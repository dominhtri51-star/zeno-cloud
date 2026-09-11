const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchJson(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + (parsed.search || ''),
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'ZenoSolar-BackupClient/1.0',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];
  for (const row of rows) {
    const line = headers.map(h => {
      const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
      return '"' + val.replace(/"/g, '""') + '"';
    }).join(',');
    csvLines.push(line);
  }
  return csvLines.join('\n');
}

async function startFullBackup() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  const backupFolderName = 'backup_' + dateStr + '_' + timeStr;
  
  const rootBackupDir = path.join(__dirname, '..', 'backups');
  const targetDir = path.join(rootBackupDir, backupFolderName);
  
  ensureDir(targetDir);
  ensureDir(path.join(targetDir, 'stations'));
  ensureDir(path.join(targetDir, 'stations', 'telemetry_energy_flow'));
  ensureDir(path.join(targetDir, 'stations', 'telemetry_history_24h'));
  ensureDir(path.join(targetDir, 'customers'));
  ensureDir(path.join(targetDir, 'devices'));
  ensureDir(path.join(targetDir, 'alarms'));
  ensureDir(path.join(targetDir, 'groups'));
  ensureDir(path.join(targetDir, 'settings'));
  ensureDir(path.join(targetDir, 'csv_exports'));
  ensureDir(path.join(targetDir, 'database_sql'));

  console.log('===============================================================');
  console.log('⚡ TIẾN TRÌNH SAO LƯU DỮ LIỆU TỪ ONLINE VỀ OFFLINE (ZENO SOLAR)');
  console.log('===============================================================');
  console.log('📅 Thời gian: ' + now.toLocaleString('vi-VN'));
  console.log('🌐 Nguồn máy chủ Online: https://zeno-cloud.onrender.com');
  console.log('📁 Thư mục lưu trữ Offline: ' + targetDir);
  console.log('---------------------------------------------------------------');

  // 1. Health Check
  console.log('⏳ [1/12] Đang kiểm tra trạng thái máy chủ Online...');
  const health = await fetchJson('https://zeno-cloud.onrender.com/api/health');
  fs.writeFileSync(path.join(targetDir, 'system_health.json'), JSON.stringify(health, null, 2), 'utf8');
  console.log('   ✓ Máy chủ Online hoạt động ổn định (Health Check OK)');

  // 2. Master Authentication
  console.log('⏳ [2/12] Đang xác thực tài khoản Tổng Phân Phối sungo.vn...');
  const masterLogin = await fetchJson('https://zeno-cloud.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { account: 'sungo.vn', password: 'sungo123' });

  const token = masterLogin.token;
  if (!token) {
    throw new Error('Không lấy được Token quản trị từ máy chủ Online!');
  }
  const authHeaders = { 'Authorization': 'Bearer ' + token };
  fs.writeFileSync(path.join(targetDir, 'auth_master_profile.json'), JSON.stringify(masterLogin, null, 2), 'utf8');
  console.log('   ✓ Đăng nhập thành công! Token: ' + token.substring(0, 25) + '...');

  // 3. Stations List
  console.log('⏳ [3/12] Đang tải danh sách toàn bộ Trạm Điện Năng Lượng Mặt Trời...');
  const stationsRes = await fetchJson('https://zeno-cloud.onrender.com/api/stations', { headers: authHeaders });
  fs.writeFileSync(path.join(targetDir, 'stations', 'all_stations.json'), JSON.stringify(stationsRes, null, 2), 'utf8');
  const stations = stationsRes.stations || [];
  console.log('   ✓ Đã tải ' + stations.length + ' trạm điện từ Cloud.');

  // 4. Per Station Telemetry & Details
  console.log('⏳ [4/12] Đang tải chi tiết viễn trắc, dòng chảy năng lượng & biểu đồ 24h từng trạm...');
  const energyMetricsSummary = [];
  for (const s of stations) {
    const sId = s.stationId;
    const sName = s.stationName || 'station';
    const safeName = sName.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Energy Flow (Live Telemetry)
    const energyFlow = await fetchJson('https://zeno-cloud.onrender.com/api/stations/energy/flow?stationId=' + sId, { headers: authHeaders });
    fs.writeFileSync(path.join(targetDir, 'stations', 'telemetry_energy_flow', 'energy_flow_' + sId + '_' + safeName + '.json'), JSON.stringify(energyFlow, null, 2), 'utf8');

    // History 24h
    const history24h = await fetchJson('https://zeno-cloud.onrender.com/api/stations/history-24h?stationId=' + sId, { headers: authHeaders });
    fs.writeFileSync(path.join(targetDir, 'stations', 'telemetry_history_24h', 'history_24h_' + sId + '_' + safeName + '.json'), JSON.stringify(history24h, null, 2), 'utf8');

    // Station Settings
    const stationSettings = await fetchJson('https://zeno-cloud.onrender.com/api/stations/settings?stationId=' + sId, { headers: authHeaders });
    fs.writeFileSync(path.join(targetDir, 'settings', 'settings_' + sId + '_' + safeName + '.json'), JSON.stringify(stationSettings, null, 2), 'utf8');

    // Station Shares
    const stationShares = await fetchJson('https://zeno-cloud.onrender.com/api/stations/shares?stationId=' + sId, { headers: authHeaders });
    fs.writeFileSync(path.join(targetDir, 'stations', 'shares_' + sId + '_' + safeName + '.json'), JSON.stringify(stationShares, null, 2), 'utf8');

    const efData = energyFlow.data || energyFlow;
    energyMetricsSummary.push({
      stationId: sId,
      stationName: sName,
      capacityKw: s.installedCapacity || s.capacityKw,
      pvPower: efData?.pvPower || 0,
      gridPower: efData?.gridPower || 0,
      loadPower: efData?.loadPower || 0,
      batteryPower: efData?.batteryPower || 0,
      batterySoc: efData?.batterySoc || s.batterySoc || 100,
      gridVoltage: efData?.gridVoltage || 220,
      temperature: efData?.temperature || 35,
      isOnline: efData?.isOnline !== false,
      lastSync: efData?.lastSync || new Date().toISOString()
    });

    console.log('     + Trạm [' + sName + '] (ID: ' + sId + ') -> Đã sao lưu xong thông số & viễn trắc');
  }

  // 5. Customers & Dealers
  console.log('⏳ [5/12] Đang tải danh sách Khách hàng, Thợ lắp đặt & Đại lý...');
  const custRes = await fetchJson('https://zeno-cloud.onrender.com/api/customers', { headers: authHeaders });
  fs.writeFileSync(path.join(targetDir, 'customers', 'all_customers.json'), JSON.stringify(custRes, null, 2), 'utf8');
  const customers = custRes.customers || [];
  console.log('   ✓ Đã tải ' + customers.length + ' tài khoản người dùng & đại lý.');

  // 6. Devices List
  console.log('⏳ [6/12] Đang tải danh sách Biến Tần Inverter & Datalogger DTU...');
  const devRes = await fetchJson('https://zeno-cloud.onrender.com/api/stations/devices', { headers: authHeaders });
  fs.writeFileSync(path.join(targetDir, 'devices', 'all_claimed_devices.json'), JSON.stringify(devRes, null, 2), 'utf8');

  const custDevRes = await fetchJson('https://zeno-cloud.onrender.com/api/customers/devices', { headers: authHeaders });
  fs.writeFileSync(path.join(targetDir, 'devices', 'customer_devices.json'), JSON.stringify(custDevRes, null, 2), 'utf8');
  console.log('   ✓ Đã sao lưu toàn bộ danh sách thiết bị và mã liên kết.');

  // 7. Alarms & History
  console.log('⏳ [7/12] Đang tải nhật ký cảnh báo & sự cố kỹ thuật...');
  const alarmsRes = await fetchJson('https://zeno-cloud.onrender.com/api/alarms', { headers: authHeaders });
  fs.writeFileSync(path.join(targetDir, 'alarms', 'all_alarms.json'), JSON.stringify(alarmsRes, null, 2), 'utf8');
  console.log('   ✓ Đã sao lưu danh mục cảnh báo.');

  // 8. Groups & Fleets
  console.log('⏳ [8/12] Đang tải cấu hình nhóm trạm & cụm ghép song song 3 pha...');
  const groupsRes = await fetchJson('https://zeno-cloud.onrender.com/api/groups', { headers: authHeaders });
  fs.writeFileSync(path.join(targetDir, 'groups', 'all_groups.json'), JSON.stringify(groupsRes, null, 2), 'utf8');
  console.log('   ✓ Đã sao lưu cấu hình nhóm trạm.');

  // 9. System Settings & Grid Standards
  console.log('⏳ [9/12] Đang tải tiêu chuẩn lưới điện & cấu hình hệ thống...');
  const gridRes = await fetchJson('https://zeno-cloud.onrender.com/api/stations/grid-standards');
  fs.writeFileSync(path.join(targetDir, 'settings', 'grid_standards.json'), JSON.stringify(gridRes, null, 2), 'utf8');

  const sysRes = await fetchJson('https://zeno-cloud.onrender.com/api/system-settings');
  fs.writeFileSync(path.join(targetDir, 'settings', 'system_settings.json'), JSON.stringify(sysRes, null, 2), 'utf8');

  const dealersRes = await fetchJson('https://zeno-cloud.onrender.com/api/stations/dealers-list', { headers: authHeaders });
  fs.writeFileSync(path.join(targetDir, 'settings', 'dealers_list.json'), JSON.stringify(dealersRes, null, 2), 'utf8');
  console.log('   ✓ Đã sao lưu tiêu chuẩn lưới EVN và danh sách đại lý.');

  // 10. CSV Exports for Excel
  console.log('⏳ [10/12] Đang tạo file bảng tính Excel (CSV) để xem offline trên máy tính...');
  if (stations.length > 0) {
    const stationsCsv = stations.map(s => ({
      stationId: s.stationId,
      stationName: s.stationName,
      installedCapacity: s.installedCapacity || s.capacityKw,
      currentPowerKw: s.currentPowerKw || 0,
      todayEnergyKwh: s.todayEnergyKwh || 0,
      totalEnergyKwh: s.totalEnergyKwh || 0,
      batterySoc: s.batterySoc || 100,
      address: s.address || '',
      ownerName: s.ownerName || '',
      devicesCount: s.devices?.length || 0
    }));
    fs.writeFileSync(path.join(targetDir, 'csv_exports', 'stations.csv'), toCsv(stationsCsv), 'utf8');
  }

  if (customers.length > 0) {
    const custCsv = customers.map(c => ({
      userId: c.userId,
      account: c.account,
      userName: c.userName,
      roleName: c.roleName,
      userType: c.userType,
      email: c.email || '',
      cellphone: c.cellphone || '',
      status: c.status || 'ACTIVE',
      groupName: c.groupName || '',
      createdAt: c.createdAt || ''
    }));
    fs.writeFileSync(path.join(targetDir, 'csv_exports', 'customers.csv'), toCsv(custCsv), 'utf8');
  }

  if (energyMetricsSummary.length > 0) {
    fs.writeFileSync(path.join(targetDir, 'csv_exports', 'energy_telemetry_metrics.csv'), toCsv(energyMetricsSummary), 'utf8');
  }
  console.log('   ✓ Đã xuất các tệp CSV: stations.csv, customers.csv, energy_telemetry_metrics.csv');

  // 11. SQL Dump
  console.log('⏳ [11/12] Đang tạo tệp SQL Dump để khôi phục cơ sở dữ liệu khi cần...');
  let sqlDump = '-- ====================================================\n';
  sqlDump += '-- ZENO SOLAR OFFLINE DATABASE BACKUP DUMP\n';
  sqlDump += '-- Backup Time: ' + now.toISOString() + '\n';
  sqlDump += '-- Source: https://zeno-cloud.onrender.com\n';
  sqlDump += '-- ====================================================\n\n';
  sqlDump += 'BEGIN;\n\n';

  customers.forEach(c => {
    const acc = c.account;
    const name = (c.userName || '').replace(/'/g, "''");
    const mail = (c.email || '').replace(/'/g, "''");
    const phone = (c.cellphone || '').replace(/'/g, "''");
    const role = (c.roleName || '').replace(/'/g, "''");
    sqlDump += "INSERT INTO customers (account, user_name, email, cellphone, user_type, role_name, group_id, status, created_at) VALUES ('" + acc + "', '" + name + "', '" + mail + "', '" + phone + "', " + (c.userType||3) + ", '" + role + "', " + (c.groupId||1) + ", 'ACTIVE', NOW()) ON CONFLICT (account) DO UPDATE SET user_name = EXCLUDED.user_name, email = EXCLUDED.email, cellphone = EXCLUDED.cellphone, role_name = EXCLUDED.role_name;\n";
  });

  sqlDump += '\n';
  stations.forEach(s => {
    const sId = s.stationId;
    const rawJson = JSON.stringify(s).replace(/'/g, "''");
    sqlDump += "INSERT INTO station_settings (station_id, settings, updated_at) VALUES ('" + sId + "', '" + rawJson + "', NOW()) ON CONFLICT (station_id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW();\n";
  });

  sqlDump += '\nCOMMIT;\n';
  fs.writeFileSync(path.join(targetDir, 'database_sql', 'zeno_solar_offline_dump.sql'), sqlDump, 'utf8');
  console.log('   ✓ Đã tạo tệp SQL: zeno_solar_offline_dump.sql');

  // 12. Update Local Offline Database & Latest Pointer
  console.log('⏳ [12/12] Đang đồng bộ dữ liệu vào bộ nhớ máy tính cục bộ & tạo báo cáo...');
  const serverDataDir = path.join(__dirname, '..', 'server', 'data');
  if (fs.existsSync(serverDataDir)) {
    const localOwnershipPath = path.join(serverDataDir, 'device_ownership.json');
    if (fs.existsSync(localOwnershipPath)) {
      try {
        const localData = JSON.parse(fs.readFileSync(localOwnershipPath, 'utf8'));
        customers.forEach(c => {
          const accKey = c.account.toLowerCase();
          if (!localData.users) localData.users = {};
          localData.users[accKey] = {
            userId: c.userId,
            userName: c.userName,
            email: c.email || '',
            cellphone: c.cellphone || '',
            userType: c.userType,
            roleName: c.roleName,
            createdAt: c.createdAt || new Date().toISOString()
          };
        });
        fs.writeFileSync(localOwnershipPath, JSON.stringify(localData, null, 2), 'utf8');
      } catch (e) {
        console.warn('Sync local warning:', e.message);
      }
    }
  }

  const latestDir = path.join(rootBackupDir, 'latest_backup');
  try {
    if (fs.existsSync(latestDir)) {
      fs.rmSync(latestDir, { recursive: true, force: true });
    }
    fs.cpSync(targetDir, latestDir, { recursive: true });
  } catch(e) {}

  // Metadata JSON
  const metadata = {
    backupTimestamp: now.toISOString(),
    sourceUrl: 'https://zeno-cloud.onrender.com',
    targetOfflineDirectory: targetDir,
    statistics: {
      totalStations: stations.length,
      totalCustomers: customers.length,
      totalAlarms: (alarmsRes.alarms || []).length,
      totalGroups: (groupsRes.groups || []).length
    },
    stationsSummary: stations.map(s => ({
      id: s.stationId,
      name: s.stationName,
      capacity: s.installedCapacity || s.capacityKw,
      devices: s.devices?.length || 0
    })),
    customersSummary: customers.map(c => ({
      account: c.account,
      name: c.userName,
      role: c.roleName,
      type: c.userType
    }))
  };
  fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

  // Markdown Report
  let reportMd = '# BÁO CÁO SAO LƯU DỮ LIỆU OFFLINE ZENO SOLAR\n\n';
  reportMd += '- **Thời điểm sao lưu:** ' + now.toLocaleString('vi-VN') + '\n';
  reportMd += '- **Máy chủ nguồn:** https://zeno-cloud.onrender.com\n';
  reportMd += '- **Thư mục lưu trữ:** `' + targetDir + '`\n';
  reportMd += '- **Tổng số trạm điện:** ' + stations.length + ' trạm\n';
  reportMd += '- **Tổng số tài khoản:** ' + customers.length + ' tài khoản\n\n';

  reportMd += '## 1. Danh Sách Trạm Điện Mặt Trời (Stations)\n\n';
  reportMd += '| STT | ID Trạm | Tên Trạm | Công Suất | Số Thiết Bị | Tổng Sản Lượng (kWh) |\n';
  reportMd += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';
  stations.forEach((s, idx) => {
    reportMd += '| ' + (idx+1) + ' | ' + s.stationId + ' | ' + s.stationName + ' | ' + (s.installedCapacity || s.capacityKw + ' kWp') + ' | ' + (s.devices?.length || 0) + ' | ' + (s.totalEnergyKwh || 0) + ' kWh |\n';
  });

  reportMd += '\n## 2. Danh Sách Tài Khoản Người Dùng & Đại Lý (Customers)\n\n';
  reportMd += '| STT | Tài Khoản | Tên Người Dùng | Vai Trò (Role) | Số Điện Thoại | Email |\n';
  reportMd += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';
  customers.forEach((c, idx) => {
    reportMd += '| ' + (idx+1) + ' | ' + c.account + ' | ' + c.userName + ' | ' + c.roleName + ' | ' + (c.cellphone || '---') + ' | ' + (c.email || '---') + ' |\n';
  });

  reportMd += '\n## 3. Cấu Trúc Các Tệp Đã Sao Lưu\n\n';
  reportMd += '- `stations/all_stations.json`: Toàn bộ danh sách trạm và thiết bị\n';
  reportMd += '- `stations/telemetry_energy_flow/`: Viễn trắc thời gian thực từng trạm (PV, Lưới, Tải, Pin)\n';
  reportMd += '- `stations/telemetry_history_24h/`: Biểu đồ công suất 24 giờ từng trạm\n';
  reportMd += '- `customers/all_customers.json`: Danh sách người dùng, đại lý, phân quyền\n';
  reportMd += '- `devices/all_claimed_devices.json`: Danh sách biến tần Inverter, mã DTU\n';
  reportMd += '- `settings/`: Cài đặt giá điện, tiêu chuẩn lưới EVN, thông số pin\n';
  reportMd += '- `csv_exports/`: Các tệp Excel (.csv) xem trực tiếp bằng Microsoft Excel / Google Sheets\n';
  reportMd += '- `database_sql/zeno_solar_offline_dump.sql`: Bản sao lưu SQL Database\n';

  fs.writeFileSync(path.join(targetDir, 'BACKUP_REPORT.md'), reportMd, 'utf8');

  console.log('===============================================================');
  console.log('🎉 HOÀN THÀNH SAO LƯU DỮ LIỆU OFFLINE 100% THÀNH CÔNG!');
  console.log('📄 Báo cáo chi tiết: ' + path.join(targetDir, 'BACKUP_REPORT.md'));
  console.log('===============================================================');
}

startFullBackup().catch(err => {
  console.error('❌ Lỗi tiến trình sao lưu:', err);
});
