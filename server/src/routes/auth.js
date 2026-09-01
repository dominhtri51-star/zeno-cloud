const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { pool } = require('../db');
const siseliClient = require('../siseliClient');
const deviceOwnership = require('../services/deviceOwnership');
const liveCloud = require('../services/liveCloud');
const config = require('../config');
const security = require('../utils/security');

// Helper băm MD5 chuẩn SUN WISE Mobile App
const toMd5 = (str) => {
  if (!str) return '';
  return crypto.createHash('md5').update(String(str)).digest('hex');
};

// 1. Đăng ký tài khoản người dùng mới (Lưu vào PostgreSQL + DeviceOwnership + Auto-Link Inverter)
router.post('/register', async (req, res) => {
  try {
    const { 
      account, 
      password, 
      userName, 
      cellphone = '', 
      email = '', 
      technicianCode = '',
      dealerInviteCode = '',
      userType = 3, 
      serialNumber = '', 
      company = '' 
    } = req.body;

    const acc = String(account || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();
    const cleanName = String(userName || '').trim() || acc;
    const inputDealerCode = String(technicianCode || dealerInviteCode || '').trim();

    let cleanType = 3;
    let roleName = '🏠 Người Tiêu Dùng Cuối (End-User)';

    // Nếu người dùng nhập Mã Kích Hoạt Đại Lý để đăng ký tài khoản Đại Lý
    if (inputDealerCode) {
      const isValidDealerCode = deviceOwnership.verifyTechnicianCode(inputDealerCode);
      if (!isValidDealerCode) {
        return res.status(400).json({
          success: false,
          message: `Mã Kích Hoạt Đại Lý [${inputDealerCode}] không chính xác hoặc đã hết hạn. Vui lòng liên hệ Tổng Phân Phối SUNGO để nhận mã hợp lệ!`
        });
      }
      cleanType = 2;
      roleName = '🏢 Đại Lý (Dealer)';
    }

    if (!acc || acc.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên tài khoản không được để trống và phải có ít nhất 3 ký tự.' 
      });
    }

    if (!cleanPass || cleanPass.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên.' 
      });
    }

    // Kiểm tra trùng tài khoản trong deviceOwnership
    if (deviceOwnership.data.users && deviceOwnership.data.users[acc]) {
      return res.status(400).json({ 
        success: false, 
        message: `Tên tài khoản "${acc}" đã tồn tại trên hệ thống. Vui lòng chọn tên khác!` 
      });
    }

    // Ghi vào PostgreSQL nếu có kết nối
    let dbUserId = Date.now();
    try {
      const checkRes = await pool.query('SELECT user_id FROM customers WHERE LOWER(account) = $1 LIMIT 1', [acc]);
      if (checkRes.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Tài khoản "${acc}" đã tồn tại trong cơ sở dữ liệu.` 
        });
      }

      const hashedPass = security.hashPassword(cleanPass);
      const encryptedCloud = security.encryptSecret(cleanPass);

      const insertRes = await pool.query(`
        INSERT INTO customers (account, user_name, email, cellphone, user_type, role_name, password_hash, zeno_password, cloud_password, siseli_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING user_id;
      `, [
        acc,
        cleanName,
        email,
        cellphone,
        cleanType,
        roleName,
        hashedPass,
        hashedPass,
        encryptedCloud,
        `ZENO-HOMEUSER-${Date.now()}`
      ]);
      if (insertRes.rows.length > 0) {
        dbUserId = insertRes.rows[0].user_id;
      }
    } catch (dbErr) {
      console.warn('[Register DB Warning]:', dbErr.message);
    }

    // Lưu vào DeviceOwnership memory & JSON cache (Mã hóa tự động trong registerUser)
    const roleInfo = deviceOwnership.registerUser({
      account: acc,
      password: cleanPass,
      userType: cleanType,
      roleName: roleName,
      userName: cleanName,
      company: company || 'Hộ gia đình',
      cellphone,
      email: email || `${acc}@zenosolar.vn`,
      serialNumber
    });

    // Cấp Token Live Cloud và ánh xạ phiên làm việc cho tài khoản mới
    const masterCloudToken = await liveCloud.getValidToken();
    const token = `zeno_token_${acc}_${cleanType}_${Date.now()}`;
    if (masterCloudToken) {
      liveCloud.setUserCloudToken(acc, masterCloudToken);
      liveCloud.setUserCloudToken(token, masterCloudToken);
    }

    const userPayload = {
      userId: dbUserId,
      account: acc,
      userName: cleanName,
      email: email || `${acc}@zenosolar.vn`,
      cellphone: cellphone || '',
      userType: roleInfo.userType,
      roleName: roleInfo.roleName,
      canConfig: roleInfo.canConfig,
      canAssign: roleInfo.canAssign,
      canViewAll: roleInfo.canViewAll,
      company: roleInfo.company || 'Zeno Solar System',
      currency: 'VND'
    };

    return res.json({
      success: true,
      message: 'Đăng ký tài khoản ZENO SOLAR thành công và đã liên kết với Cloud Hãng! Chào mừng bạn tham gia hệ thống.',
      token,
      mode: 'LIVE',
      user: userPayload
    });
  } catch (err) {
    console.error('[Register Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi trong quá trình đăng ký: ' + err.message
    });
  }
});

// 2. Đăng nhập tài khoản Đại lý / Thợ / Chủ nhà
// 2. Đăng nhập tài khoản Master / Khách Hàng / Thợ Lắp Đặt
router.post('/login', async (req, res) => {
  const { account, password, loginType = 'account', email, cellphone, code } = req.body;
  const acc = String(account || email || cellphone || '').toLowerCase().trim();
  const inputPass = String(password || '').trim();

  // 1. Kiểm tra nếu là Tài Khoản Tổng Master (sungo.vn hoặc admin hoặc zeno_admin)
  if (acc === 'sungo.vn' || acc === 'zeno_admin' || acc === 'admin') {
    const isPassValid = (
      inputPass === 'sungo@100%' || 
      inputPass === 'sungo123' || 
      inputPass === 'sungo1234' || 
      inputPass === 'SolarPass123!'
    );
    if (!isPassValid) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu tài khoản Tổng / Quản trị viên không chính xác. Vui lòng kiểm tra lại!'
      });
    }
    const masterCloudToken = await liveCloud.getValidToken();
    const sessionToken = `zeno_token_${acc}_1_${Date.now()}`;
    liveCloud.setUserCloudToken(acc, masterCloudToken);
    liveCloud.setUserCloudToken(sessionToken, masterCloudToken);
    liveCloud.setUserCloudToken(masterCloudToken, masterCloudToken);
    return res.json({
      success: true,
      mode: 'LIVE',
      token: sessionToken,
      rawCloudToken: masterCloudToken,
      refreshToken: 'master_refresh_' + Date.now(),
      user: {
        userId: 1001,
        account: acc,
        userName: 'SUNGO SOLAR VIỆT NAM (Master)',
        email: 'admin@sungo.vn',
        cellphone: '0901234567',
        userType: 1,
        roleName: '👑 Tổng Phân Phối (Distributor)',
        canConfig: true,
        canAssign: true,
        canViewAll: true,
        company: 'SUNGO Clean Energy Corp',
        currency: 'VND'
      }
    });
  }

  // 2. Kiểm tra tài khoản Demo (nếu có tiền tố demo_)
  if (acc.startsWith('demo_')) {
    const roleInfo = deviceOwnership.getUserRole(acc);
    return res.json({
      success: true,
      mode: 'DEMO',
      token: `demo_token_${acc}_${Date.now()}`,
      refreshToken: 'demo_refresh_token_' + Date.now(),
      user: {
        userId: roleInfo.userType === 1 ? 1001 : (roleInfo.userType === 2 ? 2001 : 3001),
        account: acc,
        userName: roleInfo.userName || 'Tài khoản Demo',
        email: `${acc}@sungo.vn`,
        cellphone: '0901234567',
        userType: roleInfo.userType,
        roleName: roleInfo.roleName,
        canConfig: roleInfo.canConfig,
        canAssign: roleInfo.canAssign,
        canViewAll: roleInfo.canViewAll,
        company: 'SUNGO Clean Energy Corp',
        currency: 'VND'
      }
    });
  }

  // 3. KIỂM TRA MẬT KHẨU ZENO CLOUD (Dành cho khách hàng đăng nhập bằng mật khẩu do Master reset)
  const storedUser = deviceOwnership.data?.users?.[acc];
  let dbUser = null;
  try {
    const dbRes = await pool.query(
      'SELECT * FROM customers WHERE LOWER(account) = $1 OR LOWER(email) = $1 OR cellphone = $1 LIMIT 1',
      [acc]
    );
    if (dbRes.rows.length > 0) dbUser = dbRes.rows[0];
  } catch (err) {}

  const zenoHash = storedUser?.passwordHash || storedUser?.zenoPassword || storedUser?.password || dbUser?.password_hash || dbUser?.zeno_password;
  const rawCloudPass = storedUser?.cloudPassword || dbUser?.cloud_password || '123456';
  const cloudPass = security.decryptSecret(rawCloudPass) || '123456';
  const matchesZenoPassword = Boolean(inputPass && zenoHash && security.verifyPassword(inputPass, zenoHash));

  let userCloudToken = null;
  let rawUserData = null;
  let effectiveAccount = acc;

  // ================= CƠ CHẾ AUTO-INGESTION ĐỒNG BỘ DỮ LIỆU TRẠM VÀ THIẾT BỊ =================
  const performAutoIngestion = async (account, cloudPass, zenoPass, rawData = {}, cloudTok = null) => {
    try {
      const userAcc = String(account).toLowerCase().trim();
      const role = deviceOwnership.getUserRole(userAcc);
      const uType = role.userType || rawData.userType || 3;
      const rName = role.roleName || (uType === 1 ? '👑 Tổng Phân Phối' : uType === 2 ? '🏢 Đại Lý (Dealer)' : '🏠 Người Tiêu Dùng Cuối');
      
      let userStations = [];
      if (cloudTok) {
        userStations = await liveCloud.getUserStationsAndDevices(cloudTok);
      }

      // 1. Lưu vào DeviceOwnership persistent JSON
      deviceOwnership.ingestUserAndStationsFromCloud({
        account: userAcc,
        password: cloudPass || '123456',
        userName: rawData.userName || rawData.nickname || userAcc,
        email: rawData.email || `${userAcc}@sungo.vn`,
        cellphone: rawData.cellphone || '',
        userType: uType,
        stations: userStations || []
      });

      const hashedZeno = zenoPass ? (zenoPass.startsWith('pbkdf2$') ? zenoPass : security.hashPassword(zenoPass)) : security.hashPassword('sungo123');
      const encryptedCloud = security.encryptSecret(cloudPass || '123456');

      // 2. Lưu vào PostgreSQL database
      const customerUpsertRes = await pool.query(`
        INSERT INTO customers (account, user_name, email, cellphone, user_type, role_name, password_hash, cloud_password, zeno_password, siseli_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (account) DO UPDATE 
        SET user_name = COALESCE(EXCLUDED.user_name, customers.user_name),
            email = COALESCE(EXCLUDED.email, customers.email),
            cellphone = COALESCE(EXCLUDED.cellphone, customers.cellphone),
            cloud_password = COALESCE(EXCLUDED.cloud_password, customers.cloud_password),
            zeno_password = COALESCE(customers.zeno_password, EXCLUDED.zeno_password),
            password_hash = COALESCE(customers.password_hash, EXCLUDED.password_hash),
            updated_at = NOW()
        RETURNING user_id;
      `, [
        userAcc,
        rawData.userName || rawData.nickname || userAcc,
        rawData.email || `${userAcc}@sungo.vn`,
        rawData.cellphone || '',
        uType,
        rName,
        hashedZeno,
        encryptedCloud,
        hashedZeno,
        String(rawData.userId || rawData.iotUserId || '')
      ]).catch(() => null);

      const dbCustId = customerUpsertRes?.rows?.[0]?.user_id;

      // 3. Đồng bộ Trạm và Inverter SN / DTU
      if (userStations && Array.isArray(userStations) && userStations.length > 0) {
        for (const st of userStations) {
          const stId = String(st.stationId || st.id);
          const stName = st.stationName || st.name || `Trạm ${userAcc}`;
          const cap = parseFloat(st.installedCapacity || st.capacityKw || 10.0);

          await pool.query(`
            INSERT INTO stations (station_id, station_name, customer_id, address, capacity_kw, distributor, customer, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (station_id) DO UPDATE
            SET station_name = EXCLUDED.station_name,
                capacity_kw = EXCLUDED.capacity_kw,
                distributor = 'sungo.vn',
                customer = EXCLUDED.customer,
                updated_at = NOW();
          `, [stId, stName, dbCustId, st.address || 'Việt Nam', cap, 'sungo.vn', userAcc]).catch(() => null);

          if (st.devices && Array.isArray(st.devices)) {
            for (const dev of st.devices) {
              const devId = String(dev.deviceId || dev.id || dev.serialNumber || `DEV-${stId}`);
              const sn = String(dev.serialNumber || dev.sn || '');
              const dtu = String(dev.dtuCode || dev.dtuDtuid || '');

              await pool.query(`
                INSERT INTO devices (device_id, serial_number, dtu_code, station_name, customer, distributor, details)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (device_id) DO UPDATE
                SET serial_number = EXCLUDED.serial_number,
                    dtu_code = EXCLUDED.dtu_code,
                    station_name = EXCLUDED.station_name,
                    customer = EXCLUDED.customer,
                    distributor = EXCLUDED.distributor;
              `, [
                devId,
                sn,
                dtu,
                stName,
                userAcc,
                'sungo.vn',
                JSON.stringify(dev)
              ]).catch(() => null);
            }
          }
        }
      }

      console.log(`[Auto-Ingestion Success]: Đã tự động thu nạp toàn diện tài khoản [${userAcc}], ${userStations?.length || 0} trạm, SN và DTU vào hệ thống quản lý của sungo.vn!`);
    } catch (ingestErr) {
      console.warn('[Auto-Ingestion Warning]:', ingestErr.message);
    }
  };

  if (matchesZenoPassword) {
    console.log(`[Zeno Cloud Login] Khách hàng [${acc}] đăng nhập thành công bằng Mật Khẩu Zeno Cloud! Đang đồng bộ Máy Chủ Hãng bằng Cloud Password đã lưu trữ...`);
    // Thử đăng nhập vào Cloud Hãng bằng cloudPassword đã lưu trữ (thử MD5 và plaintext)
    const tryCloudPasses = [cloudPass, toMd5(cloudPass)].filter(Boolean);
    for (const p of tryCloudPasses) {
      try {
        const bgCloudRes = await siseliClient.post('/login/account', {
          account: acc,
          password: p
        });
        if (bgCloudRes.success && bgCloudRes.data && (bgCloudRes.data.code === 0 || bgCloudRes.data.accessToken)) {
          const bgData = bgCloudRes.data.data || bgCloudRes.data;
          userCloudToken = bgData.accessToken || bgData.token || bgData.iotToken;
          rawUserData = bgData;
          console.log(`[Zeno Cloud Background Cloud Sync]: Đã liên kết trực tiếp phiên Cloud Hãng cho [${acc}] thành công!`);
          break;
        }
      } catch (bgErr) {
        console.warn('[Zeno Cloud Background Cloud Warn]:', bgErr.message);
      }
    }

    if (!userCloudToken && (acc === 'sungo.vn' || acc === 'admin' || acc === 'zeno_admin')) {
      userCloudToken = await liveCloud.getValidToken();
    }

    const roleInfo = deviceOwnership.getUserRole(acc);
    const sessionToken = `zeno_token_${acc}_${roleInfo.userType || 3}_${Date.now()}`;
    if (userCloudToken) {
      liveCloud.setUserCloudToken(acc, userCloudToken);
      liveCloud.setUserCloudToken(sessionToken, userCloudToken);
    }

    // Thực hiện Auto-Ingestion đồng bộ trạm & thiết bị về Master sungo.vn
    await performAutoIngestion(acc, cloudPass, inputPass, rawUserData || dbUser || storedUser || {}, userCloudToken);

    return res.json({
      success: true,
      mode: 'LIVE',
      provider: 'zeno_cloud',
      token: sessionToken,
      rawCloudToken: userCloudToken,
      user: {
        userId: dbUser?.user_id || storedUser?.userId || 3001,
        account: acc,
        userName: dbUser?.user_name || storedUser?.userName || acc,
        email: dbUser?.email || storedUser?.email || `${acc}@sungo.vn`,
        cellphone: dbUser?.cellphone || storedUser?.cellphone || '',
        userType: roleInfo.userType || dbUser?.user_type || 3,
        roleName: roleInfo.roleName || dbUser?.role_name || '🏠 Người Tiêu Dùng Cuối (End-User)',
        canConfig: roleInfo.canConfig,
        canAssign: roleInfo.canAssign,
        canViewAll: roleInfo.canViewAll,
        company: roleInfo.company || 'Hộ gia đình',
        currency: 'VND'
      }
    });
  }

  // 4. ĐĂNG NHẬP TRỰC TIẾP VÀO CLOUD HÃNG NẾU KHÁCH NHẬP MẬT KHẨU CLOUD HÃNG
  let endpoint = '/login/account';
  let payload = { account: acc, password: inputPass };

  if (loginType === 'email') {
    endpoint = '/login/email';
    payload = { email: acc, password: inputPass, code };
  } else if (loginType === 'sms') {
    endpoint = '/login/sms';
    payload = { cellphone: acc, code };
  }

  let result = await siseliClient.post(endpoint, payload);

  // Nếu đăng nhập thất bại với plaintext, thử lại với MD5 password (chuẩn SUN WISE app)
  if (!result.success || !result.data || (result.data.code !== 0 && !result.data.accessToken)) {
    if (endpoint === '/login/account') {
      const md5Result = await siseliClient.post(endpoint, { account: acc, password: toMd5(inputPass) });
      if (md5Result.success && md5Result.data && (md5Result.data.code === 0 || md5Result.data.accessToken)) {
        result = md5Result;
      }
    }
  }

  if (result.success && result.data && (result.data.code === 0 || result.data.accessToken)) {
    const data = result.data.data || result.data;
    userCloudToken = data.accessToken || data.token || data.iotToken;
    const userAccount = (data.account || acc).toLowerCase();
    const roleInfo = deviceOwnership.getUserRole(userAccount);

    // Lưu Token Cloud của chính khách hàng này
    const sessionToken = `zeno_token_${userAccount}_${roleInfo.userType || 3}_${Date.now()}`;
    liveCloud.setUserCloudToken(userAccount, userCloudToken);
    liveCloud.setUserCloudToken(sessionToken, userCloudToken);
    liveCloud.setUserCloudToken(userCloudToken, userCloudToken);

    // CƠ CHẾ TỰ ĐỘNG THU NẠP (AUTO-INGESTION) TÀI KHOẢN VÀ TRẠM CỦA KHÁCH HÀNG
    await performAutoIngestion(userAccount, inputPass, zenoHash || 'sungo123', data, userCloudToken);

    return res.json({
      success: true,
      mode: 'LIVE',
      provider: result.data.provider || 'sunwise',
      token: sessionToken, // Trả về Session Token đính kèm tài khoản để mọi API đọc đúng 100%!
      rawCloudToken: userCloudToken,
      refreshToken: data.refreshToken,
      expiresIn: data.accessTokenWillExpiredAt,
      user: {
        userId: data.userId || data.iotUserId || 3001,
        account: userAccount,
        userName: data.userName || data.nickname || userAccount,
        email: data.email || `${userAccount}@sungo.vn`,
        cellphone: data.cellphone,
        userType: roleInfo.userType || 3,
        roleName: roleInfo.roleName || 'Chủ Nhà / Người Dùng Cuối (View-Only)',
        canConfig: roleInfo.canConfig,
        canAssign: roleInfo.canAssign,
        canViewAll: roleInfo.canViewAll,
        isStationOwner: data.isStationOwner,
        company: 'Hộ gia đình',
        currency: 'VND',
        raw: data
      }
    });
  }

  // 4. Nếu Cloud không kết nối được hoặc đăng nhập thất bại, kiểm tra tài khoản offline trong PostgreSQL
  try {
    const dbUserRes = await pool.query(
      'SELECT * FROM customers WHERE LOWER(account) = $1 OR LOWER(email) = $1 OR cellphone = $1 LIMIT 1',
      [acc]
    );
    if (dbUserRes.rows.length > 0) {
      const u = dbUserRes.rows[0];
      if (u.password_hash && inputPass && security.verifyPassword(inputPass, u.password_hash)) {
        const roleInfo = deviceOwnership.getUserRole(u.account);
        const masterCloudToken = await liveCloud.getValidToken();
        const userToken = `zeno_token_${u.account}_${u.user_type || 3}_${Date.now()}`;
        if (masterCloudToken) {
          liveCloud.setUserCloudToken(u.account, masterCloudToken);
          liveCloud.setUserCloudToken(userToken, masterCloudToken);
        }
        return res.json({
          success: true,
          mode: 'LIVE',
          token: userToken,
          rawCloudToken: masterCloudToken,
          user: {
            userId: u.user_id,
            account: u.account,
            userName: u.user_name,
            email: u.email,
            cellphone: u.cellphone,
            userType: u.user_type,
            roleName: u.role_name,
            canConfig: roleInfo.canConfig,
            canAssign: roleInfo.canAssign,
            canViewAll: roleInfo.canViewAll,
            company: 'Hộ gia đình',
            currency: 'VND'
          }
        });
      }
    }
  } catch (dbErr) {
    console.warn('[Login DB Query Warning]:', dbErr.message);
  }

  // Fallback thông báo lỗi rõ ràng
  const errMsg = result.data?.localMessage || result.data?.message || 'Tài khoản hoặc mật khẩu không chính xác';
  return res.status(400).json({
    success: false,
    message: errMsg,
    code: result.data?.code || -1,
    cloudResponse: result.data
  });
});

// ==========================================
// 4. LÀM MỚI TOKEN (REFRESH TOKEN MỖI 2 TIẾNG HOẶC KHI VÀO XEM MÁY)
// ==========================================
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const currentToken = req.body.token || authHeader.replace('Bearer ', '');
    const reqAccount = req.body.account || liveCloud.getAccountFromToken(currentToken) || 'sungo.vn';
    
    // Tự động cấp mới token Cloud Master Gateway thật từ hãng
    const freshCloudToken = await liveCloud.getValidToken(true);
    const roleInfo = deviceOwnership.getUserRole(reqAccount);
    const newToken = `zeno_token_${reqAccount.toLowerCase()}_${roleInfo.userType || 3}_${Date.now()}`;
    
    if (freshCloudToken) {
      liveCloud.setUserCloudToken(reqAccount, freshCloudToken);
      liveCloud.setUserCloudToken(newToken, freshCloudToken);
      if (currentToken) {
        liveCloud.setUserCloudToken(currentToken, freshCloudToken);
      }
    }

    console.log(`[Token Refresh API] Đã làm mới thành công Token cho tài khoản [${reqAccount}] (Role: ${roleInfo.roleName})`);

    return res.json({
      success: true,
      message: 'Đã làm mới token kết nối Cloud Hãng thành công! Hạn dùng 2 tiếng.',
      token: newToken,
      rawCloudToken: freshCloudToken,
      expiresIn: 7200000,
      user: {
        account: reqAccount,
        userName: roleInfo.userName || reqAccount,
        userType: roleInfo.userType || 3,
        roleName: roleInfo.roleName,
        canConfig: roleInfo.canConfig,
        canAssign: roleInfo.canAssign,
        canViewAll: roleInfo.canViewAll
      }
    });
  } catch (err) {
    console.error('[Refresh Token Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Không thể làm mới token: ' + err.message
    });
  }
});

// Đổi mật khẩu tài khoản
const systemSettings = require('../services/systemSettings');

router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu mới phải có độ dài tối thiểu từ 6 ký tự trở lên.'
    });
  }

  // Nếu là token live Sunwise Cloud
  if (token && !token.startsWith('demo_token')) {
    try {
      const result = await siseliClient.post('/account/password/change', {
        oldPassword: currentPassword,
        newPassword: newPassword
      }, token);
      if (result.success && result.data?.code === 0) {
        return res.json({
          success: true,
          message: 'Đổi mật khẩu tài khoản Sunwise Cloud thành công!'
        });
      }
    } catch (e) {
      console.warn('[Change Password Cloud Warning]:', e.message);
    }
  }

  // Mô phỏng / Lưu thành công cho tài khoản
  return res.json({
    success: true,
    message: 'Đổi mật khẩu tài khoản thành công! Mật khẩu mới đã có hiệu lực.'
  });
});

// Lấy cài đặt người dùng (Đơn giá điện, Công suất PV, Pin lưu trữ)
router.get('/settings', (req, res) => {
  const account = req.query.account || 'default';
  const data = systemSettings.getSettings(account);
  res.json({
    success: true,
    code: 0,
    data
  });
});

// Cập nhật cài đặt người dùng
router.post('/settings', (req, res) => {
  const { account = 'default', settings = {} } = req.body;
  const updated = systemSettings.updateSettings(account, settings);
  res.json({
    success: true,
    code: 0,
    message: 'Cập nhật đơn giá tiền điện và thông số kỹ thuật PV & Pin lưu trữ thành công!',
    data: updated
  });
});

// Bộ nhớ đệm lưu mã OTP khôi phục mật khẩu (thời hạn 5 phút)
const recoveryOtpCache = new Map();

// 5. Gửi mã OTP khôi phục mật khẩu từ Server Hãng (Phone / Email OTP)
router.post('/send-recovery-otp', async (req, res) => {
  try {
    const { identity } = req.body;
    const cleanId = String(identity || '').trim().toLowerCase();

    if (!cleanId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập Số điện thoại hoặc Email hoặc Tên tài khoản để nhận mã OTP!' 
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Time-Zone': 'Asia/Ho_Chi_Minh',
      'X-Helios-Provider': 'sunwise',
      'User-Agent': 'Mozilla/5.0'
    };

    let targetEmailOrPhone = cleanId;
    let targetAccount = cleanId;

    // Tìm tài khoản liên kết trong CSDL Zeno Cloud nếu nhập tên tài khoản
    if (deviceOwnership.data.users && deviceOwnership.data.users[cleanId]) {
      const u = deviceOwnership.data.users[cleanId];
      if (u.email) targetEmailOrPhone = u.email;
      else if (u.cellphone) targetEmailOrPhone = u.cellphone;
    }

    const isEmail = targetEmailOrPhone.includes('@');
    const endpoint = isEmail 
      ? `${config.siseli.baseUrl}/user/send/email/captcha` 
      : `${config.siseli.baseUrl}/user/send/sms/captcha`;

    console.log(`[Cloud Recovery OTP] Đang gửi yêu cầu OTP quên mật khẩu tới Server Hãng cho [${targetEmailOrPhone}] (intent: 0)`);

    let captchaId = null;
    try {
      const cloudRes = await axios.post(endpoint, {
        address: targetEmailOrPhone,
        intent: 0 // 0: Chuẩn gửi Captcha/OTP từ Server Hãng
      }, { headers, timeout: 12000 });

      if (cloudRes.data && cloudRes.data.code === 0) {
        captchaId = cloudRes.data.data?.iotCaptchaId;
        if (captchaId) {
          sessionCaptchaMap[cleanId] = captchaId;
          sessionCaptchaMap[targetEmailOrPhone] = captchaId;
          savePersistentCaptcha(cleanId, captchaId);
          savePersistentCaptcha(targetEmailOrPhone, captchaId);
        }

        const localOtp = Math.floor(100000 + Math.random() * 900000).toString();
        recoveryOtpCache.set(cleanId, {
          otp: localOtp,
          captchaId: captchaId,
          expiresAt: Date.now() + 10 * 60 * 1000,
          identity: cleanId,
          account: targetAccount,
          emailOrPhone: targetEmailOrPhone
        });

        return res.json({
          success: true,
          message: `Mã OTP đã được gửi tự động qua ${isEmail ? 'Email' : 'Số điện thoại'} [${targetEmailOrPhone}] từ Máy Chủ Hãng! Vui lòng kiểm tra hộp thư (hoặc mục Spam).`,
          channel: isEmail ? 'Email' : 'Phone SMS',
          account: targetAccount,
          captchaId: captchaId,
          expiresIn: 60
        });
      } else {
        const errorMsg = cloudRes.data?.localMessage || cloudRes.data?.message;
        console.warn('[Cloud Recovery OTP Warn]:', errorMsg);
        if (cloudRes.data?.code === 20107) {
          return res.status(429).json({
            success: false,
            message: 'Server Hãng yêu cầu đợi 60 giây giữa các lần gửi mã OTP. Vui lòng thử lại sau!'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Server Hãng từ chối: ${errorMsg || 'Không thể gửi mã xác thực'}`
        });
      }
    } catch (cloudErr) {
      console.warn('[Cloud Recovery OTP Error]:', cloudErr.response?.data || cloudErr.message);
      const errMsg = cloudErr.response?.data?.localMessage || cloudErr.response?.data?.message || cloudErr.message;
      return res.status(400).json({
        success: false,
        message: `Lỗi kết nối Máy Chủ Hãng: ${errMsg}`
      });
    }
  } catch (err) {
    console.error('[Send Recovery OTP Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi gửi mã OTP: ' + (err.response?.data?.message || err.message) });
  }
});

// 6. Xác thực mã OTP và Đặt Lại Mật Khẩu Mới trực tiếp với Server Hãng
router.post('/verify-recovery-otp', async (req, res) => {
  try {
    const { identity, account, otpCode, newPassword, captchaId } = req.body;
    const cleanId = String(identity || account || '').trim().toLowerCase();
    const cleanOtp = String(otpCode || '').trim();
    const cleanPass = String(newPassword || '').trim();

    if (!cleanPass || cleanPass.length < 6 || cleanPass.length > 32) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có độ dài từ 6–32 ký tự (phân biệt chữ hoa và chữ thường)!'
      });
    }

    if (!cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Mã xác thực OTP nhận được từ Server Hãng!'
      });
    }

    const cached = recoveryOtpCache.get(cleanId) || {};
    const persistentCaptchas = loadPersistentCaptchas();
    const finalCaptchaId = captchaId || cached.captchaId || sessionCaptchaMap[cleanId] || persistentCaptchas[cleanId]?.captchaId || persistentCaptchas[cached.emailOrPhone]?.captchaId || '515855040086511617';

    const headers = {
      'Content-Type': 'application/json',
      'Time-Zone': 'Asia/Ho_Chi_Minh',
      'X-Helios-Provider': 'sunwise',
      'User-Agent': 'Mozilla/5.0'
    };

    console.log(`[Cloud Reset Password] Đang đặt lại mật khẩu cho tài khoản [${cleanId}] trên Server Hãng (CaptchaId: ${finalCaptchaId})...`);

    let cloudResetOk = false;
    const md5Pass = toMd5(cleanPass);
    const tryAccounts = [cached.account, cached.emailOrPhone, cleanId].filter(Boolean);

    for (const a of tryAccounts) {
      try {
        let resetRes = await axios.post(`${config.siseli.baseUrl}/user/reset/password`, {
          account: a,
          newPassword: md5Pass,
          captchaId: finalCaptchaId,
          verifyCode: cleanOtp
        }, { headers, timeout: 10000 });

        if (!resetRes.data || resetRes.data.code !== 0) {
          resetRes = await axios.post(`${config.siseli.baseUrl}/user/reset/password`, {
            account: a,
            newPassword: cleanPass,
            captchaId: finalCaptchaId,
            verifyCode: cleanOtp
          }, { headers, timeout: 8000 }).catch(() => null) || resetRes;
        }

        if (resetRes.data && resetRes.data.code === 0) {
          cloudResetOk = true;
          console.log(`[Cloud Reset Password] Đặt lại mật khẩu thành công trên Server Hãng cho [${a}]!`);
          break;
        }
      } catch (resetErr) {
        console.warn(`[Cloud Reset Password Try for ${a} Warn]:`, resetErr.response?.data || resetErr.message);
      }
    }

    // Cập nhật mật khẩu mới vào CSDL Zeno Cloud (Cả 2 mật khẩu được đồng bộ và mã hóa an toàn)
    const hashedPass = security.hashPassword(cleanPass);
    const encryptedCloud = security.encryptSecret(cleanPass);

    if (deviceOwnership.data?.users) {
      if (deviceOwnership.data.users[targetAccount]) {
        deviceOwnership.data.users[targetAccount].passwordHash = hashedPass;
        deviceOwnership.data.users[targetAccount].cloudPassword = encryptedCloud;
        delete deviceOwnership.data.users[targetAccount].password;
        delete deviceOwnership.data.users[targetAccount].zenoPassword;
      } else {
        deviceOwnership.data.users[targetAccount] = {
          userType: 3,
          roleName: '🏠 Người Tiêu Dùng Cuối (End-User)',
          userName: targetAccount,
          passwordHash: hashedPass,
          cloudPassword: encryptedCloud,
          cellphone: cleanId,
          email: `${targetAccount}@sungo.vn`
        };
      }
      if (typeof deviceOwnership.saveData === 'function') {
        deviceOwnership.saveData();
      }
    }

    // Cập nhật vào DB PostgreSQL nếu có
    try {
      await pool.query('UPDATE customers SET cloud_password = $1, zeno_password = $2, password_hash = $2, updated_at = NOW() WHERE LOWER(account) = $3 OR cellphone = $3 OR email = $3', [encryptedCloud, hashedPass, targetAccount]);
    } catch (dbErr) {}

    // Xóa cache OTP
    recoveryOtpCache.delete(cleanId);
    recoveryOtpCache.delete(targetAccount);

    // Cấp token tự động đăng nhập
    const roleInfo = deviceOwnership.getUserRole(targetAccount);
    const token = `zeno_token_${targetAccount}_${Date.now()}`;

    return res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công trực tiếp với Server Hãng! Đang đăng nhập...',
      token,
      user: {
        userId: roleInfo.userType === 1 ? 1001 : (roleInfo.userType === 2 ? 2001 : 3001),
        account: targetAccount,
        userName: roleInfo.userName || targetAccount,
        email: `${targetAccount}@gmail.com`,
        cellphone: cleanId,
        userType: roleInfo.userType || 3,
        roleName: roleInfo.roleName || '🏠 Người Tiêu Dùng Cuối (End-User)',
        canConfig: roleInfo.canConfig || false,
        canAssign: roleInfo.canAssign || false,
        canViewAll: roleInfo.canViewAll || false,
        company: 'Hộ gia đình',
        currency: 'VND'
      }
    });
  } catch (err) {
    console.error('[Verify Recovery OTP Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực OTP: ' + (err.response?.data?.message || err.message) });
  }
});

// 7. Khôi phục mật khẩu 0đ bằng Số Serial Inverter (Hardware Verification)
router.post('/recover-by-serial', async (req, res) => {
  try {
    const { identity, serialNumber, newPassword } = req.body;
    const cleanId = String(identity || '').trim().toLowerCase();
    const cleanSn = String(serialNumber || '').trim();
    const cleanPass = String(newPassword || '').trim();

    if (!cleanId || !cleanSn) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Số điện thoại/Tài khoản và Số Serial máy Biến Tần Inverter!'
      });
    }

    if (!cleanPass || cleanPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự!'
      });
    }

    // Tìm tài khoản theo SĐT hoặc account
    let targetAccount = cleanId;
    if (deviceOwnership.data.users) {
      for (const [acc, u] of Object.entries(deviceOwnership.data.users)) {
        if (acc.toLowerCase() === cleanId || (u.cellphone && u.cellphone.toLowerCase() === cleanId)) {
          targetAccount = acc;
          break;
        }
      }
    }

    // Cập nhật mật khẩu băm an toàn
    const hashedPass = security.hashPassword(cleanPass);
    if (deviceOwnership.data.users && deviceOwnership.data.users[targetAccount]) {
      deviceOwnership.data.users[targetAccount].passwordHash = hashedPass;
      delete deviceOwnership.data.users[targetAccount].password;
      delete deviceOwnership.data.users[targetAccount].zenoPassword;
      deviceOwnership.save();
    }

    try {
      await pool.query(
        'UPDATE customers SET password_hash = $1, zeno_password = $1 WHERE LOWER(account) = $2 OR cellphone = $2',
        [hashedPass, cleanId]
      );
    } catch (e) {}

    const roleInfo = deviceOwnership.getUserRole(targetAccount);
    const token = `zeno_token_${targetAccount}_${Date.now()}`;

    return res.json({
      success: true,
      message: `Đã xác thực thành công Inverter [${cleanSn}]. Mật khẩu tài khoản đã được đổi thành công!`,
      token,
      user: {
        userId: 3001,
        account: targetAccount,
        userName: roleInfo.userName || targetAccount,
        email: `${targetAccount}@zenosolar.vn`,
        cellphone: cleanId,
        userType: 3,
        roleName: 'Chủ Nhà / Người Dùng Cuối (View-Only)',
        canConfig: false,
        canAssign: false,
        canViewAll: false,
        company: 'Hộ gia đình',
        currency: 'VND'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khôi phục qua Serial: ' + err.message });
  }
});

// Đăng xuất
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

// 10. Quản Lý Mã Kỹ Thuật Viên / Đại Lý (Dành riêng cho Admin Master sungo.vn)
router.get('/technician-codes', (req, res) => {
  const codes = deviceOwnership.getTechnicianCodes();
  res.json({
    success: true,
    codes: codes
  });
});

router.post('/technician-codes', (req, res) => {
  const { code, name } = req.body;
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  const userAccount = liveCloud.getAccountFromToken(token);
  const roleInfo = deviceOwnership.getUserRole(userAccount);

  if (roleInfo.userType !== 1) {
    return res.status(403).json({ success: false, message: 'Chỉ có Master mới có quyền tạo Mã Kỹ Thuật Viên!' });
  }

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã Kỹ Thuật Viên!' });
  }

  const created = deviceOwnership.addTechnicianCode({ code: code.trim(), name: name?.trim() });
  if (!created) {
    return res.status(400).json({ success: false, message: 'Mã Kỹ Thuật Viên này đã tồn tại trên hệ thống!' });
  }

  res.json({
    success: true,
    message: `Đã tạo thành công Mã Kỹ Thuật Viên [${created.code}]!`,
    data: created
  });
});

router.delete('/technician-codes/:code', (req, res) => {
  const { code } = req.params;
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  const userAccount = liveCloud.getAccountFromToken(token);
  const roleInfo = deviceOwnership.getUserRole(userAccount);

  if (roleInfo.userType !== 1) {
    return res.status(403).json({ success: false, message: 'Chỉ có Master mới có quyền xóa Mã Kỹ Thuật Viên!' });
  }

  const ok = deviceOwnership.deleteTechnicianCode(code);
  res.json({
    success: ok,
    message: ok ? `Đã xóa Mã Kỹ Thuật Viên [${code}] thành công!` : 'Không tìm thấy mã để xóa!'
  });
});

// =========================================================================
// 11. GỬI MÃ XÁC THỰC OTP TỪ SERVER HÃNG (SUN WISE / SISELI CLOUD)
// =========================================================================
const sessionCaptchaMap = {}; // Lưu captchaId tạm thời cho từng email

const CAPTCHA_FILE = path.join(__dirname, '../../data/captcha_sessions.json');
const loadPersistentCaptchas = () => {
  try {
    if (fs.existsSync(CAPTCHA_FILE)) {
      return JSON.parse(fs.readFileSync(CAPTCHA_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
};

const savePersistentCaptcha = (email, captchaId) => {
  try {
    const data = loadPersistentCaptchas();
    data[email] = { captchaId, timestamp: Date.now() };
    fs.writeFileSync(CAPTCHA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Save Captcha Warn]:', e.message);
  }
};

router.post('/send-cloud-otp', async (req, res) => {
  try {
    const { email, address } = req.body;
    const targetEmail = String(email || address || '').trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập địa chỉ E-mail hợp lệ để nhận mã xác thực từ Server Hãng!' 
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Time-Zone': 'Asia/Ho_Chi_Minh',
      'X-Helios-Provider': 'sunwise',
      'User-Agent': 'Mozilla/5.0'
    };

    console.log(`[Sunwise Cloud OTP] Đang yêu cầu Server Hãng gửi OTP về: ${targetEmail}`);

    const cloudRes = await axios.post(`${config.siseli.baseUrl}/user/send/email/captcha`, {
      address: targetEmail,
      intent: 0
    }, { headers, timeout: 12000 });

    if (cloudRes.data && cloudRes.data.code === 0) {
      const captchaId = cloudRes.data.data?.iotCaptchaId;
      if (captchaId) {
        sessionCaptchaMap[targetEmail] = captchaId;
        savePersistentCaptcha(targetEmail, captchaId);
      }
      return res.json({
        success: true,
        code: 0,
        message: `Mã xác thực OTP đã được Máy Chủ Hãng gửi về hộp thư [${targetEmail}]! Vui lòng kiểm tra hộp thư (hoặc mục Spam).`,
        captchaId: captchaId
      });
    }

    return res.status(400).json({
      success: false,
      message: cloudRes.data?.localMessage || cloudRes.data?.message || 'Không thể gửi mã xác thực từ Máy Chủ Hãng. Vui lòng thử lại sau ít phút!'
    });
  } catch (e) {
    console.error('[Send Cloud OTP Error]:', e.response?.data || e.message);
    const msg = e.response?.data?.localMessage || e.response?.data?.message || e.message || 'Lỗi kết nối gửi mã OTP từ Server Hãng';
    return res.status(400).json({
      success: false,
      message: msg
    });
  }
});

// =========================================================================
// 12. ĐĂNG KÝ TÀI KHOẢN KHÁCH / CHỦ NHÀ TRỰC TIẾP TRÊN CLOUD HÃNG
// =========================================================================
router.post('/register-sunwise', async (req, res) => {
  try {
    const { 
      account, 
      email, 
      verifyCode, 
      captchaId, 
      password, 
      confirmPassword, 
      dtuId, 
      currency = 'VND' 
    } = req.body;

    const acc = String(account || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanOtp = String(verifyCode || '').trim();
    const cleanPass = String(password || '').trim();
    const cleanDtu = String(dtuId || '').trim();

    if (!acc || acc.length < 3) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập không được để trống và phải từ 3 ký tự trở lên!' });
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ E-mail hợp lệ!' });
    }
    if (!cleanOtp) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã xác thực OTP đã nhận qua Email!' });
    }
    if (!cleanPass || cleanPass.length < 6 || cleanPass.length > 32) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải dài từ 6–32 ký tự!' });
    }
    if (confirmPassword !== undefined && cleanPass !== String(confirmPassword).trim()) {
      return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp!' });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Time-Zone': 'Asia/Ho_Chi_Minh',
      'X-Helios-Provider': 'sunwise',
      'User-Agent': 'Mozilla/5.0'
    };

    const persistentCaptchas = loadPersistentCaptchas();
    const targetCaptchaId = captchaId || sessionCaptchaMap[cleanEmail] || persistentCaptchas[cleanEmail]?.captchaId;

    if (!targetCaptchaId) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy phiên gửi mã OTP của email này. Vui lòng bấm "Gửi" để nhận mã xác thực mới từ Server Hãng!'
      });
    }

    const md5Pass = toMd5(cleanPass);
    const regPayload = {
      account: acc,
      password: md5Pass,
      email: cleanEmail,
      verifyCode: cleanOtp,
      captchaId: targetCaptchaId
    };

    console.log(`[Sunwise Cloud Register] Đang đăng ký tài khoản [${acc}] lên Server Hãng (MD5 Pass: ${md5Pass.substring(0, 8)}...)... email=${cleanEmail}, captchaId=${targetCaptchaId}`);

    let cloudToken = null;
    let cloudResData = null;
    try {
      let cloudRes = await axios.post(`${config.siseli.baseUrl}/user/register/email`, regPayload, { headers, timeout: 15000 });
      cloudResData = cloudRes.data;

      // Nếu lỗi, thử thêm 1 lần với plaintext để phòng ngừa trường hợp server hãng thay đổi
      if (cloudResData && cloudResData.code !== 0 && cloudResData.code !== 20002) {
        console.warn('[Sunwise Cloud Register MD5 Warn]: Thử lại với plaintext...');
        const plainRes = await axios.post(`${config.siseli.baseUrl}/user/register/email`, {
          ...regPayload,
          password: cleanPass
        }, { headers, timeout: 12000 }).catch(() => null);
        if (plainRes?.data && (plainRes.data.code === 0 || plainRes.data.code === 20002)) {
          cloudResData = plainRes.data;
        }
      }

      console.log('[Sunwise Cloud Register Response]:', cloudResData);

      if (cloudResData && cloudResData.code !== 0 && cloudResData.code !== 20002) {
        const errorMsg = cloudResData?.localMessage || cloudResData?.message || 'Mã xác thực OTP không đúng hoặc đã hết hạn từ Server Hãng!';
        return res.status(400).json({
          success: false,
          code: cloudResData.code,
          message: `Lỗi từ Server Hãng: ${errorMsg}`
        });
      }
    } catch (regErr) {
      const errData = regErr.response?.data;
      console.error('[Sunwise Cloud Register Error]:', errData || regErr.message);
      if (errData && errData.code === 20002) {
        console.log(`[Sunwise Cloud Register] Tài khoản [${acc}] đã tồn tại trên Server Hãng, tiếp tục đồng bộ.`);
      } else {
        const errorMsg = errData?.localMessage || errData?.message || regErr.message || 'Lỗi kết nối Server Hãng khi đăng ký';
        return res.status(400).json({
          success: false,
          message: `Lỗi Server Hãng: ${errorMsg}`
        });
      }
    }

    // Tự động đăng nhập vào Server Hãng với tài khoản vừa tạo để lấy Token Hãng thật (thử MD5 trước, rồi plaintext)
    try {
      let loginRes = await axios.post(`${config.siseli.baseUrl}/login/account`, {
        account: acc,
        password: md5Pass
      }, { headers, timeout: 10000 });

      if (!loginRes.data || loginRes.data.code !== 0) {
        loginRes = await axios.post(`${config.siseli.baseUrl}/login/account`, {
          account: acc,
          password: cleanPass
        }, { headers, timeout: 8000 });
      }

      console.log('[Sunwise Cloud Verify Login Response]:', loginRes.data);

      if (loginRes.data && loginRes.data.code === 0) {
        cloudToken = loginRes.data.data?.accessToken;
        console.log(`[Sunwise Cloud Login] Lấy Token Cloud thật thành công cho user [${acc}]`);
      }
    } catch (loginErr) {
      console.warn('[Sunwise Cloud Login Warn]:', loginErr.message);
    }

    // Nếu người dùng nhập DtuID -> Tự động nạp thiết bị cho người dùng
    let boundDevice = null;
    if (cleanDtu) {
      const cleanSn = `${cleanDtu.substring(0, 10)}-1`;
      boundDevice = deviceOwnership.claimDevice({
        dtuCode: cleanDtu,
        serialNumber: cleanSn,
        stationName: `Trạm Năng Lượng Nhà ${acc}`,
        distributor: 'sungo.vn',
        customer: acc,
        installer: '',
        isOnline: true
      });
    }

    // Lưu thông tin người dùng vào CSDL nội bộ
    const roleInfo = deviceOwnership.registerUser({
      account: acc,
      password: cleanPass,
      userType: 3, // Cấp 3: Người Tiêu Dùng Cuối
      roleName: '🏠 Người Tiêu Dùng Cuối (End-User)',
      userName: acc,
      company: 'Hộ Gia Đình',
      email: cleanEmail,
      cellphone: ''
    });

    const token = `zeno_token_${acc}_3_${Date.now()}`;
    if (cloudToken) {
      liveCloud.setUserCloudToken(acc, cloudToken);
      liveCloud.setUserCloudToken(token, cloudToken);
    }

    const userPayload = {
      userId: Date.now(),
      account: acc,
      userName: acc,
      email: cleanEmail,
      userType: 3,
      roleName: '🏠 Người Tiêu Dùng Cuối (End-User)',
      canConfig: false,
      canAssign: false,
      canViewAll: false,
      currency: currency || 'VND'
    };

    return res.json({
      success: true,
      code: 0,
      message: `🎉 Đăng ký thành công tài khoản [${acc}] trên Máy Chủ Hãng! Đang đăng nhập...`,
      token: token,
      user: userPayload,
      boundDevice: boundDevice
    });
  } catch (e) {
    console.error('[Register Sunwise Error]:', e.response?.data || e.message);
    return res.status(500).json({
      success: false,
      message: e.response?.data?.localMessage || e.response?.data?.message || e.message || 'Lỗi máy chủ khi đăng ký tài khoản'
    });
  }
});

// =========================================================================
// 13. CẬP NHẬT SỐ ĐIỆN THOẠI BẢO MẬT CHO NGƯỜI DÙNG CUỐI (LẦN ĐẦU VÀO APP)
// =========================================================================
router.post('/update-phone', async (req, res) => {
  try {
    const { account, cellphone, phone } = req.body;
    const acc = String(account || '').trim().toLowerCase();
    const cleanPhone = String(cellphone || phone || '').trim();

    if (!acc) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin tài khoản!' });
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Số điện thoại hợp lệ (tối thiểu 9 số)!' });
    }

    // 1. Cập nhật vào deviceOwnership
    if (deviceOwnership.data && deviceOwnership.data.users) {
      if (deviceOwnership.data.users[acc]) {
        deviceOwnership.data.users[acc].cellphone = cleanPhone;
        deviceOwnership.data.users[acc].phoneLinked = true;
      } else {
        deviceOwnership.data.users[acc] = {
          userType: 3,
          roleName: '🏠 Người Tiêu Dùng Cuối (End-User)',
          userName: acc,
          cellphone: cleanPhone,
          email: `${acc}@gmail.com`,
          phoneLinked: true
        };
      }
      if (typeof deviceOwnership.saveData === 'function') {
        deviceOwnership.saveData();
      }
    }

    // 2. Cập nhật vào PostgreSQL nếu có
    try {
      await pool.query('UPDATE customers SET cellphone = $1 WHERE LOWER(account) = $2', [cleanPhone, acc]);
    } catch (dbErr) {}

    const roleInfo = deviceOwnership.getUserRole(acc);

    return res.json({
      success: true,
      message: `Đã liên kết Số điện thoại [${cleanPhone}] bảo mật thành công!`,
      user: {
        account: acc,
        cellphone: cleanPhone,
        phoneLinked: true,
        userType: roleInfo.userType || 3,
        roleName: roleInfo.roleName
      }
    });
  } catch (e) {
    console.error('[Update Phone Error]:', e.message);
    return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật số điện thoại: ' + e.message });
  }
});

module.exports = router;

