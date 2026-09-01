const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'solar_admin',
      password: process.env.DB_PASSWORD || 'SolarPass123!',
      database: process.env.DB_NAME || 'zeno_solar',
      max: 10,
      idleTimeoutMillis: 30000
    };

const pool = new Pool(poolConfig);

pool.on('connect', (client) => {
  client.query('CREATE SCHEMA IF NOT EXISTS zeno; SET search_path TO zeno, public;').catch(() => {});
});

// Auto-run schema initialization & seed initial data
async function initDatabase() {
  try {
    const client = await pool.connect();
    const dbTarget = connectionString ? 'Cloud PostgreSQL (Render)' : 'Local PostgreSQL';
    console.log(`✅ Đã kết nối thành công tới ${dbTarget}!`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('📊 Khởi tạo cấu trúc bảng PostgreSQL thành công (Sẵn sàng mở trên TablePlus)');
    }

    // 0. Tạo bảng deleted_records nếu chưa có
    await client.query(`
      CREATE TABLE IF NOT EXISTS deleted_records (
        record_type VARCHAR(50) NOT NULL,
        record_key VARCHAR(150) NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (record_type, record_key)
      );
    `);

    // 1. Tải toàn bộ danh sách đã xóa từ PostgreSQL vào deviceOwnership
    const deviceOwnership = require('./services/deviceOwnership');
    try {
      const delRes = await client.query('SELECT record_type, record_key FROM deleted_records');
      if (delRes.rows) {
        delRes.rows.forEach(r => {
          const k = String(r.record_key).toLowerCase().trim();
          if (r.record_type === 'user' && !deviceOwnership.data.deletedUsers.includes(k)) {
            deviceOwnership.data.deletedUsers.push(k);
          }
          if (r.record_type === 'station' && !deviceOwnership.data.deletedStations.includes(k)) {
            deviceOwnership.data.deletedStations.push(k);
          }
          if (r.record_type === 'device' && !deviceOwnership.data.deletedDevices.includes(k)) {
            deviceOwnership.data.deletedDevices.push(k);
          }
        });
      }
    } catch (delErr) {
      console.warn('[DB Deleted Records Load]:', delErr.message);
    }

    await seedInitialData(client, deviceOwnership);

    // 2. Đồng bộ 2 chiều: Nạp toàn bộ tài khoản active từ PostgreSQL vào bộ nhớ hệ thống
    const custRows = await client.query('SELECT * FROM customers');
    if (custRows.rows && deviceOwnership.data) {
      if (!deviceOwnership.data.users) deviceOwnership.data.users = {};
      custRows.rows.forEach(r => {
        if (r.account) {
          const accKey = r.account.toLowerCase();
          if (deviceOwnership.isUserDeleted(accKey) || deviceOwnership.isUserDeleted(r.user_id)) {
            return; // Tuyệt đối bỏ qua tài khoản đã bị xóa
          }
          if (!deviceOwnership.data.users[accKey]) {
            deviceOwnership.data.users[accKey] = {
              userId: r.user_id,
              userType: (accKey === 'sungo.vn' || accKey === 'admin' || accKey === 'zeno_admin') ? 1 : Number(r.user_type || 3),
              roleName: (accKey === 'sungo.vn' || accKey === 'admin' || accKey === 'zeno_admin') ? '👑 Tổng Phân Phối' : (r.role_name || '🏠 Người Tiêu Dùng Cuối'),
              userName: r.user_name,
              email: r.email,
              cellphone: r.cellphone,
              password: r.password_hash || '',
              cloudPassword: r.cloud_password || '123456',
              zenoPassword: r.zeno_password || r.password_hash || 'sungo123',
              createdAt: r.created_at
            };
          }
        }
      });
      deviceOwnership.saveData();
    }

    client.release();
  } catch (err) {
    console.warn('⚠️ Không thể kết nối trực tiếp PostgreSQL, backend sẽ fallback chế độ in-memory:', err.message);
  }
}

async function seedInitialData(client, deviceOwnership) {
  try {
    // 1. Luôn đảm bảo tài khoản Master sungo.vn tồn tại trên PostgreSQL
    await client.query(`
      INSERT INTO customers (account, user_name, email, cellphone, user_type, role_name, password_hash, cloud_password, zeno_password, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (account) DO UPDATE SET
        user_type = 1,
        role_name = '👑 Tổng Phân Phối',
        user_name = 'SUNGO SOLAR VIỆT NAM (Master)';
    `, [
      'sungo.vn',
      'SUNGO SOLAR VIỆT NAM (Master)',
      'admin@sungo.vn',
      '0901234567',
      1,
      '👑 Tổng Phân Phối (Distributor)',
      'sungo123',
      'sungo@100%',
      'sungo123'
    ]);

    // 2. Chỉ seed tài khoản ban đầu nếu bảng customers hoàn toàn mới (<= 1 row) VÀ tài khoản đó CHƯA TỪNG BỊ XÓA
    const custCountRes = await client.query('SELECT count(*) as cnt FROM customers');
    const custCount = parseInt(custCountRes.rows[0]?.cnt || '0');

    if (custCount <= 1) {
      const ownershipPath = path.join(__dirname, '../data/device_ownership.json');
      if (fs.existsSync(ownershipPath)) {
        const raw = fs.readFileSync(ownershipPath, 'utf8');
        const data = JSON.parse(raw);
        if (data.users) {
          for (const [account, u] of Object.entries(data.users)) {
            const accKey = String(account).toLowerCase().trim();
            if (accKey === 'sungo.vn' || deviceOwnership?.isUserDeleted(accKey)) {
              continue; // Bỏ qua nếu đã xóa hoặc là sungo.vn
            }
            await client.query(
              `INSERT INTO customers (account, user_name, email, cellphone, user_type, role_name, password_hash, cloud_password, zeno_password, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (account) DO NOTHING`,
              [
                account,
                u.userName || account,
                u.email || `${account}@sungo.vn`,
                u.cellphone || '',
                u.userType || 3,
                u.roleName || '🏠 Người Tiêu Dùng Cuối',
                u.password || 'sungo123',
                u.cloudPassword || '123456',
                u.zenoPassword || u.password || 'sungo123',
                u.createdAt ? new Date(u.createdAt) : new Date()
              ]
            );
          }
        }
      }
    }

      if (data.technicianCodes) {
        for (const [code, info] of Object.entries(data.technicianCodes)) {
          await client.query(
            `INSERT INTO technician_codes (code, dealer_name, account, created_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (code) DO NOTHING`,
            [
              code,
              typeof info === 'object' ? info.dealerName || code : String(info),
              typeof info === 'object' ? info.account || '' : '',
              new Date()
            ]
          );
        }
      }

      if (data.claimedDevices) {
        for (const [key, dev] of Object.entries(data.claimedDevices)) {
          await client.query(
            `INSERT INTO devices (device_id, serial_number, dtu_code, station_name, customer, installer, distributor, details, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (device_id) DO UPDATE SET
               station_name = EXCLUDED.station_name,
               customer = EXCLUDED.customer,
               installer = EXCLUDED.installer,
               distributor = EXCLUDED.distributor,
               details = EXCLUDED.details,
               updated_at = EXCLUDED.updated_at`,
            [
              key,
              dev.serialNumber || '',
              dev.dtuCode || '',
              dev.stationName || '',
              dev.customer || '',
              dev.installer || '',
              dev.distributor || 'sungo.vn',
              JSON.stringify(dev),
              new Date()
            ]
          );
        }
      }
    }

    // 2. Seed Station Settings
    const settingsPath = path.join(__dirname, '../data/station_settings.json');
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(raw);
      for (const [stationId, setObj] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO station_settings (station_id, settings, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (station_id) DO UPDATE SET
             settings = EXCLUDED.settings,
             updated_at = EXCLUDED.updated_at`,
          [
            stationId,
            JSON.stringify(setObj),
            new Date()
          ]
        );
      }
    }

    console.log('🌱 Đã đồng bộ thành công toàn bộ tài khoản, trạm & cài đặt vào Cloud PostgreSQL Database!');
  } catch (err) {
    console.error('Lỗi khi seed initial data vào PostgreSQL:', err.message);
  }
}

// Log API call to TablePlus audit table
async function logApiCall(endpoint, method, statusCode, requestPayload, responsePayload, clientIp) {
  try {
    await pool.query(
      `INSERT INTO api_sync_logs (endpoint, method, status_code, request_payload, response_payload, client_ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        endpoint,
        method,
        statusCode,
        JSON.stringify(requestPayload || {}),
        JSON.stringify(responsePayload || {}),
        clientIp || '127.0.0.1'
      ]
    );
  } catch (e) {
    // ignore
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDatabase,
  logApiCall
};
