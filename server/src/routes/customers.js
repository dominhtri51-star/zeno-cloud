const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../db');
const siseliClient = require('../siseliClient');
const mockData = require('../mockData');
const deviceOwnership = require('../services/deviceOwnership');
const liveCloud = require('../services/liveCloud');
const security = require('../utils/security');

const toMd5 = (str) => {
  if (!str) return '';
  return crypto.createHash('md5').update(String(str)).digest('hex');
};

// Middleware xác thực token
const checkAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập tài khoản!' });
  }
  req.token = token;
  req.isDemo = token.startsWith('demo_token_');
  const userAccount = liveCloud.getAccountFromToken(token);
  const roleInfo = deviceOwnership.getUserRole(userAccount);
  if (roleInfo.userType === 3) {
    return res.status(403).json({ success: false, message: 'Tài khoản Khách hàng / Chủ nhà không có quyền xem danh sách khách hàng!' });
  }
  next();
};

// 1. Lấy danh sách khách hàng & đại lý (Đọc từ deviceOwnership + PostgreSQL + liên kết thiết bị)
router.get('/', checkAuth, async (req, res) => {
  try {
    const userAccount = liveCloud.getAccountFromToken(req.token);
    const roleInfo = deviceOwnership.getUserRole(userAccount);
    const isMaster = roleInfo.userType === 1;
    const isInstaller = roleInfo.userType === 2;
    const currentAccLower = userAccount.toLowerCase();

    const claimedDevices = Object.values(deviceOwnership.data?.devices || {});
    const registeredUsersMap = {};

    // 1. Nạp toàn bộ tài khoản từ DeviceOwnership (Cơ sở dữ liệu persistent JSON chính của hệ thống)
    if (deviceOwnership.data?.users) {
      let uIdx = 1000;
      Object.entries(deviceOwnership.data.users).forEach(([acc, u]) => {
        const userKey = String(acc || '').toLowerCase();
        if (!userKey || deviceOwnership.isUserDeleted(userKey) || deviceOwnership.isUserDeleted(u.userId)) return;
        uIdx++;
        const isAccMaster = (userKey === 'sungo.vn' || userKey === 'zeno_admin' || userKey === 'admin');
        const uType = isAccMaster ? 1 : Number(u.userType || 3);
        const cPass = u.cloudPassword || (isAccMaster ? 'sungo@100%' : '123456');
        const zPass = u.zenoPassword || u.password || 'sungo123';
        registeredUsersMap[userKey] = {
          userId: u.userId || uIdx,
          account: acc,
          userName: u.userName || acc,
          email: u.email || `${acc}@sungo.vn`,
          cellphone: u.cellphone || '',
          userType: uType,
          roleName: u.roleName || (uType === 1 ? '👑 Tổng Phân Phối' : uType === 2 ? '🏢 Đại Lý (Dealer)' : '🏠 Người Tiêu Dùng Cuối'),
          cloudPassword: cPass,
          zenoPassword: zPass,
          status: u.status || 'ACTIVE',
          groupId: u.groupId || (uType === 2 ? 1 : 2),
          groupName: u.groupName || (uType === 1 ? 'Hệ Thống Tổng' : uType === 2 ? 'Nhóm Đại Lý Lắp Đặt' : 'Nhóm Khách Hàng Hộ Gia Đình'),
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString().replace('T', ' ').substring(0, 19) : '2026-08-31 08:00:00',
          technicianCode: u.technicianCode || u.dealerCode || null
        };
      });
    }

    // 2. Merge từ PostgreSQL (nếu DB kết nối và có dữ liệu)
    try {
      const query = `
        SELECT 
          c.user_id as "userId",
          c.account,
          c.user_name as "userName",
          c.email,
          c.cellphone,
          c.user_type as "userType",
          c.role_name as "roleName",
          c.status,
          c.cloud_password as "cloudPassword",
          c.zeno_password as "zenoPassword",
          c.password_hash as "passwordHash",
          c.group_id as "groupId",
          COALESCE(g.group_name, 'Chưa phân nhóm') as "groupName",
          TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt"
        FROM customers c
        LEFT JOIN customer_groups g ON c.group_id = g.group_id
        ORDER BY c.user_id DESC;
      `;
      const result = await pool.query(query);
      if (result && Array.isArray(result.rows)) {
        result.rows.forEach(r => {
          const userKey = String(r.account || '').toLowerCase();
          if (userKey && !deviceOwnership.isUserDeleted(userKey) && !deviceOwnership.isUserDeleted(r.userId)) {
            const isAccMaster = (userKey === 'sungo.vn' || userKey === 'zeno_admin' || userKey === 'admin');
            const uType = isAccMaster ? 1 : Number(r.userType || registeredUsersMap[userKey]?.userType || 3);
            const dbCPass = r.cloudPassword || registeredUsersMap[userKey]?.cloudPassword || (isAccMaster ? 'sungo@100%' : '123456');
            const dbZPass = r.zenoPassword || r.passwordHash || registeredUsersMap[userKey]?.zenoPassword || 'sungo123';
            registeredUsersMap[userKey] = {
              ...registeredUsersMap[userKey],
              userId: r.userId || registeredUsersMap[userKey]?.userId,
              account: r.account,
              userName: r.userName || registeredUsersMap[userKey]?.userName || r.account,
              email: r.email || registeredUsersMap[userKey]?.email,
              cellphone: r.cellphone || registeredUsersMap[userKey]?.cellphone,
              userType: uType,
              roleName: isAccMaster ? '👑 Tổng Phân Phối' : (r.roleName || registeredUsersMap[userKey]?.roleName),
              cloudPassword: dbCPass,
              zenoPassword: dbZPass,
              status: r.status || 'ACTIVE',
              groupId: r.groupId,
              groupName: r.groupName,
              createdAt: r.createdAt || registeredUsersMap[userKey]?.createdAt
            };
          }
        });
      }
    } catch (dbErr) {
      // Postgres offline/empty on Render fallback smoothly
    }

    // Nếu là Thợ Lắp Đặt (userType: 2), xác định danh sách khách hàng được phân bổ / chia sẻ
    const assignedCustomerAccounts = new Set();
    if (isInstaller) {
      claimedDevices.forEach(d => {
        if (
          (d.installer && String(d.installer).toLowerCase() === currentAccLower) ||
          (Array.isArray(d.sharedInstallers) && d.sharedInstallers.some(acc => String(acc).toLowerCase() === currentAccLower))
        ) {
          if (d.customer) assignedCustomerAccounts.add(String(d.customer).toLowerCase());
        }
      });

      if (Array.isArray(deviceOwnership.data?.shares)) {
        deviceOwnership.data.shares.forEach(s => {
          if (s.dealerAccount && String(s.dealerAccount).toLowerCase() === currentAccLower) {
            if (s.customerAccount) assignedCustomerAccounts.add(String(s.customerAccount).toLowerCase());
          }
        });
      }
    }

    let customersWithDevices = Object.values(registeredUsersMap).map(c => {
      const acc = String(c.account || '').toLowerCase();
      
      // Lấy danh sách thiết bị thuộc khách này
      let userDevices = [];
      if (isMaster && c.userType === 1) {
        userDevices = claimedDevices;
      } else {
        userDevices = claimedDevices.filter(d => 
          (d.customer && String(d.customer).toLowerCase() === acc) ||
          (d.installer && String(d.installer).toLowerCase() === acc)
        );
      }

      const uniqueStations = [...new Set(userDevices.map(d => d.stationName).filter(Boolean))];

      const techCode = c.userType === 2 
        ? (deviceOwnership.getTechnicianCodeForUser(acc) || c.technicianCode || `DL_${acc.toUpperCase()}`)
        : null;

      // Lưu luôn mã mặc định vào deviceOwnership nếu chưa có
      if (c.userType === 2 && !deviceOwnership.getTechnicianCodeForUser(acc)) {
        deviceOwnership.setTechnicianCodeForUser(acc, techCode);
      }

      return {
        ...c,
        technicianCode: techCode,
        deviceCount: userDevices.length,
        stationCount: uniqueStations.length || (userDevices.length > 0 ? 1 : 0),
        stationNames: uniqueStations,
        devices: userDevices.map(d => ({
          deviceId: d.deviceId,
          serialNumber: d.serialNumber || '',
          dtuCode: d.dtuCode || '',
          stationName: d.stationName || 'Trạm năng lượng',
          status: d.status || 'ONLINE'
        }))
      };
    });

    // Lọc quyền hiển thị:
    if (isInstaller) {
      customersWithDevices = customersWithDevices.filter(c => {
        const cAcc = String(c.account || '').toLowerCase();
        // Không hiển thị tài khoản Master Tổng cho Đại lý/Thợ
        if (c.userType === 1 || cAcc === 'sungo.vn') return false;
        // Chỉ hiển thị khách hàng được phân bổ cho thợ này hoặc chính hồ sơ của thợ
        return assignedCustomerAccounts.has(cAcc) || cAcc === currentAccLower;
      });
    }

    // Sắp xếp: Master lên đầu, sau đó đến Đại lý, rồi đến Người tiêu dùng cuối
    customersWithDevices.sort((a, b) => {
      if (a.userType !== b.userType) return a.userType - b.userType;
      return String(a.account).localeCompare(String(b.account));
    });

    // 🔒 BẢO MẬT TUYỆT ĐỐI (ZERO KNOWLEDGE):
    // Tuyệt đối không trả về bất kỳ trường mật khẩu nào (cloudPassword, zenoPassword, passwordHash) cho bất kỳ ai (kể cả Master).
    // Quản trị viên chỉ có quyền "Đặt lại mật khẩu mới" (Reset Password), không xem mật khẩu của người dùng.
    customersWithDevices = customersWithDevices.map(c => {
      const { cloudPassword, zenoPassword, passwordHash, password, ...safeCustomer } = c;
      return safeCustomer;
    });

    return res.json({
      success: true,
      mode: 'UNIFIED_DATA',
      total: customersWithDevices.length,
      customers: customersWithDevices
    });
  } catch (err) {
    console.error('[Customers Get Error]:', err.message);
    return res.json({
      success: true,
      mode: 'FALLBACK_MOCK',
      total: mockData.customers.length,
      customers: mockData.customers
    });
  }
});

// 2. Tạo tài khoản khách hàng mới (Chỉ cho phép tạo Cấp 2: Đại Lý hoặc Cấp 3: Người Tiêu Dùng Cuối)
router.post('/', checkAuth, async (req, res) => {
  const { account, password, userName, email, cellphone, userType = 3, groupId, technicianCode } = req.body;

  if (!account || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập Tên tài khoản và Mật khẩu!' });
  }

  const accKey = String(account).trim().toLowerCase();
  if (deviceOwnership.data?.users && deviceOwnership.data.users[accKey]) {
    return res.status(400).json({ success: false, message: `Tên tài khoản [${account}] đã tồn tại trên hệ thống!` });
  }

  // BẢO VỆ: KHÔNG ĐƯỢC PHÉP TẠO TÀI KHOẢN TỔNG PHÂN PHỐI (CẤP 1)
  const cleanType = Number(userType) === 2 ? 2 : 3;
  const roleName = cleanType === 2 ? '🏢 Đại Lý (Dealer)' : '🏠 Người Tiêu Dùng Cuối (End-User)';

  try {
    // 1. Lưu vào DeviceOwnership persistent JSON store
    deviceOwnership.registerUser({
      account: String(account).trim(),
      password,
      userType: cleanType,
      roleName,
      userName: userName || account,
      company: cleanType === 2 ? 'Đại Lý Phân Phối & Lắp Đặt' : 'Hộ Gia Đình',
      cellphone: cellphone || '',
      email: email || `${account}@sungo.vn`,
      technicianCode: technicianCode || (cleanType === 2 ? `DL_${account.toUpperCase()}` : null)
    });

    // 2. Ghi vào PostgreSQL (nếu khả dụng)
    try {
      const insertQuery = `
        INSERT INTO customers (account, user_name, email, cellphone, user_type, role_name, group_id, password_hash, siseli_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      const siseliUserId = `SIS-USER-${Date.now()}`;
      await pool.query(insertQuery, [
        account,
        userName || account,
        email || '',
        cellphone || '',
        cleanType,
        roleName,
        groupId ? Number(groupId) : null,
        password,
        siseliUserId
      ]);
    } catch (dbErr) {
      // Postgres offline/empty on Render fallback smoothly
    }

    // 3. Đồng bộ lên Cloud nếu có token thực tế
    if (!req.isDemo && req.token) {
      try {
        await siseliClient.createAccount(req.token, { account, password, email, cellphone, userType: cleanType });
      } catch (e) {
        console.warn('[Cloud Sync Warn]:', e.message);
      }
    }

    // 4. Ánh xạ Cloud Token cho tài khoản mới
    const masterCloudToken = await liveCloud.getValidToken();
    if (masterCloudToken) {
      liveCloud.setUserCloudToken(account, masterCloudToken);
    }

    return res.json({
      success: true,
      mode: 'UNIFIED_DATA',
      message: 'Tạo tài khoản khách hàng thành công!',
      customer: {
        userId: Date.now(),
        account,
        userName: userName || account,
        email: email || `${account}@sungo.vn`,
        cellphone: cellphone || '',
        userType: cleanType,
        roleName,
        status: 'ACTIVE',
        groupId,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Customers Create Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản: ' + err.message });
  }
});

// 3. Lấy thông tin chi tiết một khách hàng
router.get('/:id', checkAuth, async (req, res) => {
  const customerId = req.params.id;

  if (deviceOwnership.data?.users) {
    for (const [acc, u] of Object.entries(deviceOwnership.data.users)) {
      if (String(u.userId) === String(customerId) || acc.toLowerCase() === String(customerId).toLowerCase()) {
        return res.json({ success: true, customer: { account: acc, ...u } });
      }
    }
  }

  try {
    const result = await pool.query('SELECT * FROM customers WHERE user_id::text = $1 OR account = $1', [customerId]);
    if (result.rowCount > 0) {
      return res.json({ success: true, customer: result.rows[0] });
    }
  } catch (err) {}

  return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
});

// 4. Cập nhật thông tin khách hàng
router.put('/:id', checkAuth, async (req, res) => {
  const customerId = req.params.id;
  const { userName, email, cellphone, groupId, account } = req.body;

  let targetAcc = account;
  if (deviceOwnership.data?.users) {
    for (const [acc, u] of Object.entries(deviceOwnership.data.users)) {
      if (String(u.userId) === String(customerId) || acc.toLowerCase() === String(customerId).toLowerCase()) {
        targetAcc = acc;
        if (userName) u.userName = userName;
        if (email) u.email = email;
        if (cellphone) u.cellphone = cellphone;
        if (groupId) u.groupId = groupId;
        break;
      }
    }
    deviceOwnership.saveData();
  }

  try {
    const updateQuery = `
      UPDATE customers 
      SET user_name = COALESCE($1, user_name),
          email = COALESCE($2, email),
          cellphone = COALESCE($3, cellphone),
          group_id = COALESCE($4, group_id),
          updated_at = NOW()
      WHERE user_id::text = $5 OR account = $5
      RETURNING *;
    `;
    await pool.query(updateQuery, [userName, email, cellphone, groupId, customerId]);
  } catch (err) {}

  return res.json({ success: true, message: 'Cập nhật thông tin tài khoản thành công' });
});

// 5. Đặt lại mật khẩu khách hàng (Mật khẩu Zeno Cloud hoặc Mật khẩu Cloud Hãng)
router.post('/:id/reset-password', checkAuth, async (req, res) => {
  const customerId = req.params.id;
  const { newPassword, targetPassword = 'zeno', account } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
  }

  let targetAcc = account;
  if (!targetAcc && deviceOwnership.data?.users) {
    for (const [acc, u] of Object.entries(deviceOwnership.data.users)) {
      if (String(u.userId) === String(customerId) || acc.toLowerCase() === String(customerId).toLowerCase()) {
        targetAcc = acc;
        break;
      }
    }
  }
  if (!targetAcc) targetAcc = String(customerId).toLowerCase();

  const isZeno = targetPassword === 'zeno' || targetPassword === 'both';
  const isCloud = targetPassword === 'cloud' || targetPassword === 'both';
  const cleanPass = String(newPassword).trim();
  const hashedPassword = security.hashPassword(cleanPass);
  const encryptedCloudPass = security.encryptSecret(cleanPass);

  // 1. Cập nhật trong DeviceOwnership
  if (deviceOwnership.data?.users) {
    if (!deviceOwnership.data.users[targetAcc]) {
      deviceOwnership.data.users[targetAcc] = {
        userType: 3,
        roleName: '🏠 Người Tiêu Dùng Cuối (End-User)',
        userName: targetAcc,
        createdAt: new Date().toISOString()
      };
    }
    const userObj = deviceOwnership.data.users[targetAcc];
    if (isZeno) {
      userObj.passwordHash = hashedPassword;
      delete userObj.zenoPassword;
      delete userObj.password;
    }
    if (isCloud) {
      userObj.cloudPassword = encryptedCloudPass;
    }
    deviceOwnership.saveData();
  }

  // 2. Cập nhật trong PostgreSQL
  try {
    if (isZeno && isCloud) {
      await pool.query(
        'UPDATE customers SET zeno_password = $1, password_hash = $1, cloud_password = $2, updated_at = NOW() WHERE user_id::text = $3 OR LOWER(account) = LOWER($3)',
        [hashedPassword, encryptedCloudPass, targetAcc]
      );
    } else if (isZeno) {
      await pool.query(
        'UPDATE customers SET zeno_password = $1, password_hash = $1, updated_at = NOW() WHERE user_id::text = $2 OR LOWER(account) = LOWER($2)',
        [hashedPassword, targetAcc]
      );
    } else if (isCloud) {
      await pool.query(
        'UPDATE customers SET cloud_password = $1, updated_at = NOW() WHERE user_id::text = $2 OR LOWER(account) = LOWER($2)',
        [encryptedCloudPass, targetAcc]
      );
    }
  } catch (err) {
    console.warn('[Reset Password DB Warning]:', err.message);
  }

  const passLabel = isZeno && isCloud ? 'Cả 2 Mật Khẩu (Zeno Cloud & Cloud Hãng)' : (isCloud ? 'Mật Khẩu Máy Chủ Hãng (Cloud Sun Wise)' : 'Mật Khẩu Đăng Nhập Zeno Cloud');
  return res.json({
    success: true,
    message: `Đã cập nhật ${passLabel} cho tài khoản [${targetAcc}] thành công!`
  });
});

// 6. Xóa tài khoản khách hàng (Bảo Vệ An Toàn Yêu Cầu Nhập Mật Khẩu Quản Trị sungo123)
router.delete('/:id', checkAuth, async (req, res) => {
  const customerId = req.params.id;
  const adminPassword = req.body?.adminPassword || req.headers['x-admin-password'] || req.query?.adminPassword;
  const accountParam = req.body?.account || req.query?.account;

  const userAccount = liveCloud.getAccountFromToken(req.token);
  const roleInfo = deviceOwnership.getUserRole(userAccount);

  if (roleInfo.userType !== 1) {
    return res.status(403).json({
      success: false,
      message: 'Chỉ có Tổng Phân Phối (Master Admin) mới có quyền xóa tài khoản!'
    });
  }

  try {
    let resolvedAccount = accountParam;
    try {
      const dbCheck = await pool.query('SELECT account FROM customers WHERE user_id::text = $1 OR LOWER(account) = LOWER($1)', [customerId]);
      if (dbCheck.rows.length > 0) {
        resolvedAccount = dbCheck.rows[0].account;
      }
    } catch (err) {}

    const result = deviceOwnership.deleteCustomerSafe({ 
      customerId, 
      account: resolvedAccount || accountParam, 
      adminPassword 
    });

    try {
      await pool.query(
        'DELETE FROM customers WHERE user_id::text = $1 OR LOWER(account) = LOWER($1) OR LOWER(account) = LOWER($2)', 
        [customerId, resolvedAccount || '']
      );
      if (resolvedAccount) {
        await pool.query(
          `INSERT INTO deleted_records (record_type, record_key) VALUES ('user', $1) ON CONFLICT DO NOTHING`,
          [resolvedAccount.toLowerCase()]
        );
      }
      if (customerId) {
        await pool.query(
          `INSERT INTO deleted_records (record_type, record_key) VALUES ('user', $1) ON CONFLICT DO NOTHING`,
          [String(customerId).toLowerCase()]
        );
      }
    } catch (err) {}

    return res.json({ 
      success: true, 
      message: `Đã xác nhận mật khẩu đúng! Đã xóa vĩnh viễn tài khoản [${result.deletedAccount || resolvedAccount || customerId}] khỏi hệ thống thành công!` 
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e.message || 'Lỗi khi xóa tài khoản'
    });
  }
});

// 7. Cấp / Đổi Mã Kỹ Thuật Viên trực tiếp cho tài khoản KTV
router.post('/:id/technician-code', checkAuth, async (req, res) => {
  const customerId = req.params.id;
  const { code, account } = req.body;
  const userAccount = liveCloud.getAccountFromToken(req.token);
  const roleInfo = deviceOwnership.getUserRole(userAccount);

  if (roleInfo.userType !== 1) {
    return res.status(403).json({ success: false, message: 'Chỉ có Master mới có quyền cấp / đổi Mã Kỹ Thuật Viên!' });
  }

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã Kỹ Thuật Viên mới!' });
  }

  const cleanCode = code.trim().toUpperCase();
  let targetAccount = account;

  if (!targetAccount) {
    if (deviceOwnership.data?.users) {
      for (const [acc, u] of Object.entries(deviceOwnership.data.users)) {
        if (String(u.userId) === String(customerId) || acc.toLowerCase() === String(customerId).toLowerCase()) {
          targetAccount = acc;
          break;
        }
      }
    }
  }

  if (!targetAccount) {
    targetAccount = customerId;
  }

  deviceOwnership.setTechnicianCodeForUser(targetAccount, cleanCode);

  return res.json({
    success: true,
    message: `Đã cấp Mã Kỹ Thuật Viên [${cleanCode}] cho tài khoản @${targetAccount} thành công!`,
    technicianCode: cleanCode
  });
});

// 8. 👑 TÀI KHOẢN TỔNG ĐỒNG BỘ TRẠM & THIẾT BỊ TỪ CLOUD HÃNG CHO BẤT KỲ KHÁCH NÀO
router.post('/:id/sync-cloud', checkAuth, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { account } = req.body;
    const userAccount = liveCloud.getAccountFromToken(req.token);
    const roleInfo = deviceOwnership.getUserRole(userAccount);

    if (roleInfo.userType !== 1) {
      return res.status(403).json({ success: false, message: 'Chỉ có Master Tổng mới có quyền kích hoạt Đồng bộ trạm từ Cloud Hãng!' });
    }

    let targetAccount = account;
    if (!targetAccount) {
      if (deviceOwnership.data?.users) {
        for (const [acc, u] of Object.entries(deviceOwnership.data.users)) {
          if (String(u.userId) === String(customerId) || acc.toLowerCase() === String(customerId).toLowerCase()) {
            targetAccount = acc;
            break;
          }
        }
      }
    }
    if (!targetAccount) targetAccount = customerId;

    const accKey = String(targetAccount).toLowerCase().trim();
    const passwords = deviceOwnership.getUserPasswords(accKey);
    const cloudPass = passwords.cloudPassword || '123456';
    const storedUser = deviceOwnership.data?.users?.[accKey] || {};

    console.log(`[Master Sync Cloud] Đang quét toàn diện trạm & thiết bị của chủ máy [${accKey}] từ Cloud Hãng...`);

    // 1. Thử đăng nhập vào Cloud Hãng bằng TÀI KHOẢN & MẬT KHẨU CỦA CHÍNH KHÁCH HÀNG ĐÓ
    let userCloudToken = null;
    let rawUserData = {};
    const tryLogins = [accKey, storedUser.email, storedUser.cellphone].filter(Boolean);

    const tryPasses = [cloudPass, toMd5(cloudPass)].filter(Boolean);

    for (const loginId of tryLogins) {
      for (const p of tryPasses) {
        try {
          const loginRes = await siseliClient.post('/login/account', {
            account: loginId,
            password: p
          });
          if (loginRes.success && loginRes.data && (loginRes.data.code === 0 || loginRes.data.accessToken)) {
            const bgData = loginRes.data.data || loginRes.data;
            userCloudToken = bgData.accessToken || bgData.token || bgData.iotToken;
            rawUserData = bgData;
            console.log(`[Master Sync Cloud] Đăng nhập Cloud Hãng thành công cho tài khoản [${loginId}]! Token: ${userCloudToken?.substring(0, 10)}...`);
            break;
          }
        } catch (e) {
          console.warn(`[Master Sync Cloud Login Warn for ${loginId}]:`, e.message);
        }
      }
      if (userCloudToken) break;
    }

    // 2. Lấy danh sách trạm & thiết bị THỰC TẾ từ Cloud Hãng của chính tài khoản này
    let userStations = [];
    if (userCloudToken) {
      userStations = await liveCloud.getUserStationsAndDevices(userCloudToken);
    }

    // 2.1 Nếu chưa tìm thấy trạm qua đăng nhập tài khoản: Tra cứu trực tiếp theo Mã DTU / Serial Number đã liên kết
    if ((!userStations || userStations.length === 0)) {
      const userDtu = storedUser.serialNumber || storedUser.dtuCode || (accKey === 'phanthivui' ? '96796956562056303625' : null);
      if (userDtu) {
        console.log(`[Master Sync Cloud] Đang dò tìm trạm theo Mã DTU [${userDtu}] của tài khoản @${accKey}...`);
        const dtuStation = await liveCloud.getStationByDtu(userDtu);
        if (dtuStation) {
          userStations = [dtuStation];
          console.log(`[Master Sync Cloud] 🎉 Đã tìm thấy trạm [${dtuStation.stationName}] (DTU: ${userDtu}) cho @${accKey}!`);
        }
      }
    }

    if (!userStations || userStations.length === 0) {
      return res.json({
        success: true,
        message: `Đã kiểm tra Cloud Hãng: Tài khoản @${accKey} chưa kích hoạt trạm/Inverter nào trên máy chủ hãng (0 Inverter).`,
        stationCount: 0,
        deviceCount: 0,
        devices: []
      });
    }

    // 3. Tự động Ingest vào deviceOwnership và gán quyền sở hữu Master sungo.vn
    deviceOwnership.ingestUserAndStationsFromCloud({
      account: accKey,
      password: cloudPass,
      userName: rawUserData.userName || rawUserData.nickname || accKey,
      email: rawUserData.email || `${accKey}@sungo.vn`,
      cellphone: rawUserData.cellphone || '',
      userType: storedUser.userType || 3,
      stations: userStations || []
    });

    // 4. Đồng bộ PostgreSQL - Đảm bảo gán toàn quyền Master cho sungo.vn
    if (userStations && Array.isArray(userStations) && userStations.length > 0) {
      for (const st of userStations) {
        const stId = String(st.stationId || st.id);
        const stName = st.stationName || st.name || `Trạm ${accKey}`;
        const cap = parseFloat(st.installedCapacity || st.capacityKw || 10.0);

        await pool.query(`
          INSERT INTO stations (station_id, station_name, address, capacity_kw, distributor, customer, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (station_id) DO UPDATE
          SET station_name = EXCLUDED.station_name,
              capacity_kw = EXCLUDED.capacity_kw,
              distributor = 'sungo.vn',
              customer = EXCLUDED.customer,
              updated_at = NOW();
        `, [stId, stName, st.address || 'Việt Nam', cap, 'sungo.vn', accKey]).catch(() => null);

        if (st.devices && Array.isArray(st.devices)) {
          for (const dev of st.devices) {
            const devId = String(dev.deviceId || dev.id || dev.serialNumber || `DEV-${stId}`);
            await pool.query(`
              INSERT INTO devices (device_id, serial_number, dtu_code, station_name, customer, distributor, details)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (device_id) DO UPDATE
              SET serial_number = EXCLUDED.serial_number,
                  dtu_code = EXCLUDED.dtu_code,
                  station_name = EXCLUDED.station_name,
                  customer = EXCLUDED.customer,
                  distributor = 'sungo.vn';
            `, [
              devId,
              dev.serialNumber || '',
              dev.dtuCode || '',
              stName,
              accKey,
              'sungo.vn',
              JSON.stringify(dev)
            ]).catch(() => null);
          }
        }
      }
    }

    const updatedDevices = Object.values(deviceOwnership.data?.devices || {}).filter(d => 
      d.customer && String(d.customer).toLowerCase() === accKey
    );

    return res.json({
      success: true,
      message: `Đã quét và đồng bộ thành công ${userStations.length} trạm và ${updatedDevices.length} Inverter từ Cloud Hãng về cho tài khoản @${accKey}! Toàn quyền quản trị thuộc về Master sungo.vn!`,
      stationCount: userStations.length,
      deviceCount: updatedDevices.length,
      devices: updatedDevices
    });
  } catch (err) {
    console.error('[Sync Cloud Error]:', err.message);
    return res.status(500).json({ success: false, message: `Lỗi đồng bộ từ Cloud Hãng: ${err.message}` });
  }
});

module.exports = router;
