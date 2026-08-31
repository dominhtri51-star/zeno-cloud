const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const siseliClient = require('../siseliClient');
const mockData = require('../mockData');
const deviceOwnership = require('../services/deviceOwnership');
const liveCloud = require('../services/liveCloud');

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

// 1. Lấy danh sách khách hàng (Đọc từ PostgreSQL + liên kết thiết bị từ DeviceOwnership)
router.get('/', checkAuth, async (req, res) => {
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
        c.group_id as "groupId",
        COALESCE(g.group_name, 'Chưa phân nhóm') as "groupName",
        TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt"
      FROM customers c
      LEFT JOIN customer_groups g ON c.group_id = g.group_id
      ORDER BY c.user_id DESC;
    `;
    const result = await pool.query(query);

    const userAccount = liveCloud.getAccountFromToken(req.token);
    const roleInfo = deviceOwnership.getUserRole(userAccount);
    const isMaster = roleInfo.userType === 1;
    const isInstaller = roleInfo.userType === 2;
    const currentAccLower = userAccount.toLowerCase();

    const claimedDevices = Object.values(deviceOwnership.data?.devices || {});

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

    let customersWithDevices = result.rows.map(c => {
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
        ? (deviceOwnership.getTechnicianCodeForUser(acc) || `KT_${acc.toUpperCase()}`)
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

    return res.json({
      success: true,
      mode: 'POSTGRESQL_DB',
      total: customersWithDevices.length,
      customers: customersWithDevices
    });
  } catch (err) {
    console.error('[DB Customers Get Error]:', err.message);
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

  // BẢO VỆ: KHÔNG ĐƯỢC PHÉP TẠO TÀI KHOẢN TỔNG PHÂN PHỐI (CẤP 1)
  const cleanType = Number(userType) === 2 ? 2 : 3;
  const roleName = cleanType === 2 ? '🏢 Đại Lý (Dealer)' : '🏠 Người Tiêu Dùng Cuối (End-User)';

  try {
    // 1. Ghi vào PostgreSQL
    const insertQuery = `
      INSERT INTO customers (account, user_name, email, cellphone, user_type, role_name, group_id, password_hash, siseli_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const siseliUserId = `SIS-USER-${Date.now()}`;
    const dbRes = await pool.query(insertQuery, [
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

    const createdCustomer = dbRes.rows[0];

    // 2. Đồng bộ lên Cloud nếu có token thực tế
    if (!req.isDemo && req.token) {
      try {
        await siseliClient.createAccount(req.token, { account, password, email, cellphone, userType: cleanType });
      } catch (e) {
        console.warn('[Cloud Sync Warn]:', e.message);
      }
    }

    // 3. Đồng bộ vào DeviceOwnership memory & JSON cache để đăng nhập được ngay
    deviceOwnership.registerUser({
      account,
      password,
      userType: cleanType,
      roleName,
      userName: userName || account,
      company: cleanType === 2 ? 'Đại Lý Phân Phối & Lắp Đặt' : 'Hộ Gia Đình',
      cellphone: cellphone || '',
      email: email || `${account}@sungo.vn`,
      technicianCode: technicianCode || (cleanType === 2 ? `DL_${account.toUpperCase()}` : null)
    });

    // 4. Ánh xạ Cloud Token cho tài khoản mới
    const masterCloudToken = await liveCloud.getValidToken();
    if (masterCloudToken) {
      liveCloud.setUserCloudToken(account, masterCloudToken);
    }

    // Ghi audit log
    await pool.query(
      `INSERT INTO api_sync_logs (endpoint, method, status_code, request_payload, response_payload) VALUES ($1, $2, $3, $4, $5)`,
      ['/api/customers', 'POST', 200, JSON.stringify({ account, userName, email, groupId }), JSON.stringify(createdCustomer)]
    );

    return res.json({
      success: true,
      mode: 'POSTGRESQL_DB',
      message: 'Tạo tài khoản khách hàng thành công và đã lưu vào Cơ sở dữ liệu!',
      customer: {
        userId: createdCustomer.user_id,
        account: createdCustomer.account,
        userName: createdCustomer.user_name,
        email: createdCustomer.email,
        cellphone: createdCustomer.cellphone,
        userType: createdCustomer.user_type,
        roleName: createdCustomer.role_name,
        status: createdCustomer.status,
        groupId: createdCustomer.group_id,
        createdAt: createdCustomer.created_at
      }
    });
  } catch (err) {
    console.error('[DB Customers Create Error]:', err.message);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, message: `Tên tài khoản [${account}] đã tồn tại trong cơ sở dữ liệu!` });
    }
    return res.status(500).json({ success: false, message: 'Lỗi ghi cơ sở dữ liệu: ' + err.message });
  }
});

// 3. Lấy thông tin chi tiết một khách hàng
router.get('/:id', checkAuth, async (req, res) => {
  const customerId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM customers WHERE user_id = $1', [customerId]);
    if (result.rowCount > 0) {
      return res.json({ success: true, customer: result.rows[0] });
    }
    return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng trong cơ sở dữ liệu' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Cập nhật thông tin khách hàng (Cập nhật trực tiếp PostgreSQL)
router.put('/:id', checkAuth, async (req, res) => {
  const customerId = req.params.id;
  const { userName, email, cellphone, groupId } = req.body;

  try {
    const updateQuery = `
      UPDATE customers 
      SET user_name = COALESCE($1, user_name),
          email = COALESCE($2, email),
          cellphone = COALESCE($3, cellphone),
          group_id = COALESCE($4, group_id),
          updated_at = NOW()
      WHERE user_id = $5
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [userName, email, cellphone, groupId, customerId]);
    if (result.rowCount > 0) {
      return res.json({ success: true, message: 'Cập nhật thông tin trong CSDL thành công', customer: result.rows[0] });
    }
    return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Đặt lại mật khẩu khách hàng
router.post('/:id/reset-password', checkAuth, async (req, res) => {
  const customerId = req.params.id;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
  }

  try {
    const result = await pool.query('UPDATE customers SET password_hash = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *', [newPassword, customerId]);
    if (result.rowCount > 0) {
      return res.json({
        success: true,
        message: `Đã đổi mật khẩu cho tài khoản ${result.rows[0].account} thành công trong CSDL.`
      });
    }
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Xóa tài khoản khách hàng (Xóa khỏi PostgreSQL)
router.delete('/:id', checkAuth, async (req, res) => {
  const customerId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM customers WHERE user_id = $1 RETURNING *', [customerId]);
    if (result.rowCount > 0) {
      return res.json({ success: true, message: `Đã xóa khách hàng [${result.rows[0].account}] khỏi CSDL`, customer: result.rows[0] });
    }
    return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng để xóa' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
    const dbUser = await pool.query('SELECT account FROM customers WHERE user_id = $1', [customerId]);
    if (dbUser.rows.length > 0) {
      targetAccount = dbUser.rows[0].account;
    }
  }

  if (!targetAccount) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản để gán mã!' });
  }

  deviceOwnership.setTechnicianCodeForUser(targetAccount, cleanCode);

  return res.json({
    success: true,
    message: `Đã cấp Mã Kỹ Thuật Viên [${cleanCode}] cho tài khoản @${targetAccount} thành công!`,
    technicianCode: cleanCode
  });
});

module.exports = router;
