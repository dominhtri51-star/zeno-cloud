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

// Auto-run schema initialization
async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Đã kết nối thành công tới PostgreSQL Database [zeno_solar]!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('📊 Khởi tạo cấu trúc bảng PostgreSQL thành công (Sẵn sàng mở trên TablePlus)');
    }
    client.release();
  } catch (err) {
    console.warn('⚠️ Không thể kết nối trực tiếp PostgreSQL, backend sẽ fallback chế độ in-memory:', err.message);
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
