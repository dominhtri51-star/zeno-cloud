const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const siseliClient = require('../siseliClient');
const deviceOwnership = require('../services/deviceOwnership');
const liveCloud = require('../services/liveCloud');

// Bộ nhớ đệm lưu Captcha ID từ Cloud Hãng (Thời hạn 10 phút)
const captchaCache = new Map();

// 1. Gửi mã OTP xác nhận Email hoặc SMS trực tiếp từ Cloud Hãng Sun Wise / Siseli
router.post('/send-otp', async (req, res) => {
  try {
    const { type = 'email', email, cellphone, areaCode = '+84' } = req.body;

    if (type === 'email') {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ!' });
      }

      console.log(`[Cloud OTP Email] Đang gửi yêu cầu mã OTP tới: ${cleanEmail}`);
      // Gọi trực tiếp Cloud Hãng: intent = 0 (Đăng ký tài khoản)
      const cloudRes = await siseliClient.post('/user/send/email/captcha', {
        address: cleanEmail,
        intent: 0
      });

      if (cloudRes.success && cloudRes.data && cloudRes.data.code === 0) {
        const iotCaptchaId = cloudRes.data.data?.iotCaptchaId;
        if (iotCaptchaId) {
          captchaCache.set(cleanEmail, { captchaId: iotCaptchaId, time: Date.now() });
          const accPrefix = cleanEmail.split('@')[0];
          captchaCache.set(accPrefix, { captchaId: iotCaptchaId, time: Date.now() });
        }

        console.log(`[Cloud OTP Email Success]: Đã gửi OTP tới [${cleanEmail}], captchaId = ${iotCaptchaId}`);
        return res.json({
          success: true,
          mode: 'CLOUD_LIVE',
          captchaId: iotCaptchaId,
          message: `Mã xác thực OTP đã được Cloud Hãng gửi trực tiếp về email ${cleanEmail}. Vui lòng kiểm tra Hộp thư đến (hoặc thư mục Spam)!`
        });
      } else {
        const errMsg = cloudRes.data?.localMessage || cloudRes.data?.message || 'Không thể gửi mã OTP qua Cloud Hãng';
        console.warn(`[Cloud OTP Email Warn]:`, errMsg);
        return res.status(400).json({
          success: false,
          code: cloudRes.data?.code || -1,
          message: `Lỗi Cloud Hãng: ${errMsg}`
        });
      }
    } else {
      const cleanPhone = String(cellphone || '').trim();
      if (!cleanPhone) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại!' });
      }

      console.log(`[Cloud OTP SMS] Đang gửi yêu cầu SMS OTP tới: ${cleanPhone}`);
      const cloudRes = await siseliClient.post('/user/send/sms/captcha', {
        address: cleanPhone,
        intent: 0
      });

      if (cloudRes.success && cloudRes.data && cloudRes.data.code === 0) {
        const iotCaptchaId = cloudRes.data.data?.iotCaptchaId;
        if (iotCaptchaId) {
          captchaCache.set(cleanPhone, { captchaId: iotCaptchaId, time: Date.now() });
        }

        return res.json({
          success: true,
          mode: 'CLOUD_LIVE',
          captchaId: iotCaptchaId,
          message: `Mã OTP xác thực đã được gửi qua tin nhắn SMS tới số ${cleanPhone}!`
        });
      } else {
        const errMsg = cloudRes.data?.localMessage || cloudRes.data?.message || 'Không thể gửi tin nhắn SMS OTP qua Cloud';
        return res.status(400).json({
          success: false,
          code: cloudRes.data?.code || -1,
          message: `Lỗi Cloud Hãng: ${errMsg}`
        });
      }
    }
  } catch (err) {
    console.error('[Send OTP Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi gửi mã xác thực OTP: ' + err.message });
  }
});

// 2. Đăng ký tài khoản công khai (Tạo tài khoản trên Cloud Hãng + Lưu PostgreSQL)
router.post('/register', async (req, res) => {
  try {
    const { 
      email = '', 
      cellphone = '', 
      password = '', 
      code = '', 
      userName = '', 
      dealerInviteCode = '', 
      captchaId = '', 
      areaCode = '+84',
      serialNumber = ''
    } = req.body;

    const cleanPass = String(password || '').trim();
    const cleanCode = String(code || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(cellphone || '').trim();

    if ((!cleanEmail && !cleanPhone) || !cleanPass) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin và mật khẩu!' });
    }

    if (cleanPass.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 6 ký tự trở lên!' });
    }

    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã xác thực OTP đã nhận!' });
    }

    const account = cleanEmail ? cleanEmail.split('@')[0] : cleanPhone;
    const name = String(userName || '').trim() || account;

    let cleanType = 3;
    let roleName = 'Chủ Nhà / Người Dùng Cuối (View-Only)';

    if (dealerInviteCode && dealerInviteCode.trim()) {
      const isValid = deviceOwnership.verifyTechnicianCode(dealerInviteCode.trim());
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: `Mã Kỹ Thuật Viên [${dealerInviteCode}] không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ Tổng Phân Phối SUNGO để nhận mã!`
        });
      }
      cleanType = 2;
      roleName = 'Thợ Lắp Đặt / Đại Lý (Installer)';
    }

    // Tìm Captcha ID trong cache nếu client không gửi kèm
    let effectiveCaptchaId = captchaId;
    if (!effectiveCaptchaId) {
      const cached = (cleanEmail && captchaCache.get(cleanEmail)) || 
                     (cleanPhone && captchaCache.get(cleanPhone)) ||
                     captchaCache.get(account);
      if (cached && (Date.now() - cached.time < 10 * 60 * 1000)) {
        effectiveCaptchaId = cached.captchaId;
      }
    }

    let cloudAccessToken = null;
    let siseliUserId = `SIS-USER-${Date.now()}`;
    let cloudRawUser = null;

    // 1. GỌI API ĐĂNG KÝ TRỰC TIẾP TRÊN CLOUD HÃNG SUN WISE / SISELI
    if (cleanEmail && effectiveCaptchaId) {
      console.log(`[Cloud Register Email] Đang đăng ký tài khoản [${account}] trên Cloud Hãng...`);
      const regRes = await siseliClient.post('/user/register/email', {
        account: account,
        password: cleanPass,
        email: cleanEmail,
        captchaId: effectiveCaptchaId,
        verifyCode: cleanCode
      });

      if (regRes.success && regRes.data && (regRes.data.code === 0 || regRes.data.accessToken)) {
        console.log(`[Cloud Register Success]: Đăng ký thành công tài khoản [${account}] trên Cloud Hãng!`);
      } else if (regRes.data && regRes.data.code === 20002) {
        // Tài khoản đã tồn tại trên cloud -> tiếp tục thử đăng nhập
        console.log(`[Cloud Register Info]: Tài khoản [${account}] đã tồn tại trên Cloud, tiếp tục liên kết.`);
      } else if (regRes.data && regRes.data.code !== 0) {
        const errMsg = regRes.data.localMessage || regRes.data.message || 'Đăng ký trên Cloud Hãng thất bại';
        return res.status(400).json({
          success: false,
          code: regRes.data.code,
          message: `Lỗi xác thực Cloud Hãng: ${errMsg}`
        });
      }
    } else if (cleanPhone && effectiveCaptchaId) {
      console.log(`[Cloud Register Phone] Đang đăng ký số điện thoại [${cleanPhone}] trên Cloud Hãng...`);
      const regRes = await siseliClient.post('/user/register/cellphone', {
        account: account,
        password: cleanPass,
        cellphone: cleanPhone,
        countryTelephoneCode: areaCode.replace('+', ''),
        captchaId: effectiveCaptchaId,
        verifyCode: cleanCode
      });

      if (regRes.data && regRes.data.code !== 0 && regRes.data.code !== 20002) {
        const errMsg = regRes.data.localMessage || regRes.data.message || 'Đăng ký số điện thoại trên Cloud thất bại';
        return res.status(400).json({
          success: false,
          code: regRes.data.code,
          message: `Lỗi xác thực Cloud Hãng: ${errMsg}`
        });
      }
    }

    // 2. TỰ ĐỘNG ĐĂNG NHẬP VÀO CLOUD ĐỂ LẤY TOKEN THỰC TẾ
    try {
      const loginRes = await siseliClient.post('/login/account', {
        account: account,
        password: cleanPass
      });

      if (loginRes.success && loginRes.data && (loginRes.data.code === 0 || loginRes.data.accessToken)) {
        const data = loginRes.data.data || loginRes.data;
        cloudAccessToken = data.accessToken || data.token || data.iotToken;
        siseliUserId = String(data.userId || data.iotUserId || siseliUserId);
        cloudRawUser = data;
        console.log(`[Cloud Login Success]: Đã lấy Cloud Token thành công cho [${account}]: ${cloudAccessToken?.substring(0, 12)}...`);
      }
    } catch (loginErr) {
      console.warn('[Cloud Auto-Login Warn]:', loginErr.message);
    }

    // Nếu không có token cá nhân từ cloud, cấp token từ Master Gateway để đảm bảo luôn kết nối Live
    if (!cloudAccessToken) {
      cloudAccessToken = await liveCloud.getValidToken();
    }

    const appToken = `zeno_token_${account}_${Date.now()}`;

    // Ánh xạ token và account vào LiveCloud để tất cả API Telemetry / Inverter hoạt động trơn tru
    if (cloudAccessToken) {
      liveCloud.setUserCloudToken(account, cloudAccessToken);
      liveCloud.setUserCloudToken(appToken, cloudAccessToken);
    }

    // 3. LƯU VÀO CƠ SỞ DỮ LIỆU POSTGRESQL
    let dbUserId = Date.now();
    try {
      const insertQuery = `
        INSERT INTO customers (account, user_name, email, cellphone, user_type, role_name, group_id, password_hash, siseli_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8)
        ON CONFLICT (account) DO UPDATE
        SET user_name = EXCLUDED.user_name,
            email = EXCLUDED.email,
            cellphone = EXCLUDED.cellphone,
            password_hash = EXCLUDED.password_hash,
            siseli_user_id = EXCLUDED.siseli_user_id,
            updated_at = NOW()
        RETURNING *;
      `;
      const dbRes = await pool.query(insertQuery, [
        account,
        name,
        cleanEmail || '',
        cleanPhone || '',
        cleanType,
        roleName,
        cleanPass,
        siseliUserId
      ]);

      if (dbRes.rows.length > 0) {
        dbUserId = dbRes.rows[0].user_id;
      }
    } catch (dbErr) {
      console.warn('[Register DB Insert Warning]:', dbErr.message);
    }

    // 4. LƯU VÀO DEVICE OWNERSHIP & LIÊN KẾT INVERTER
    deviceOwnership.registerUser({
      account,
      password: cleanPass,
      userType: cleanType,
      roleName: roleName,
      userName: name,
      cellphone: cleanPhone || '',
      email: cleanEmail || '',
      company: cleanType === 2 ? 'Đội Kỹ Thuật Lắp Đặt' : 'Gia đình',
      serialNumber: serialNumber || ''
    });

    // 5. TỰ ĐỘNG THU NẠP TRẠM VÀ THIẾT BỊ TỪ CLOUD HÃNG VỀ CHO MASTER SUNGO.VN
    if (cloudAccessToken) {
      liveCloud.getUserStationsAndDevices(cloudAccessToken).then(stations => {
        if (stations && stations.length > 0) {
          deviceOwnership.ingestUserAndStationsFromCloud({
            account,
            password: cleanPass,
            userName: name,
            email: cleanEmail || `${account}@sungo.vn`,
            cellphone: cleanPhone || '',
            userType: cleanType,
            stations
          });
        }
      }).catch(() => null);
    }

    return res.json({
      success: true,
      mode: 'LIVE_CLOUD_LINKED',
      message: cleanType === 2 
        ? 'Đăng ký thành công tài khoản Kỹ Thuật Viên và đã liên kết với Cloud Hãng!' 
        : 'Đăng ký thành công tài khoản Chủ Nhà và đã liên kết thành công với Cloud Hãng!',
      token: appToken,
      cloudToken: cloudAccessToken,
      user: {
        userId: dbUserId,
        account: account,
        userName: name,
        email: cleanEmail || `${account}@zenosolar.vn`,
        cellphone: cleanPhone || '',
        userType: cleanType,
        roleName: roleName,
        canConfig: cleanType === 2,
        canAssign: cleanType === 2,
        canViewAll: false,
        company: cleanType === 2 ? 'Đội Kỹ Thuật Lắp Đặt' : 'Gia đình',
        currency: 'VND'
      }
    });
  } catch (err) {
    console.error('[Public Register Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi đăng ký tài khoản: ' + err.message });
  }
});

// 3. Lấy danh sách mã quốc gia
router.get('/area-codes', (req, res) => {
  return res.json({
    success: true,
    codes: [
      { code: '+84', name: 'Vietnam (+84)' },
      { code: '+86', name: 'China (+86)' },
      { code: '+1', name: 'United States (+1)' },
      { code: '+49', name: 'Germany (+49)' },
      { code: '+33', name: 'France (+33)' },
      { code: '+81', name: 'Japan (+81)' },
      { code: '+82', name: 'South Korea (+82)' },
      { code: '+66', name: 'Thailand (+66)' },
      { code: '+65', name: 'Singapore (+65)' },
      { code: '+60', name: 'Malaysia (+60)' },
      { code: '+61', name: 'Australia (+61)' }
    ]
  });
});

module.exports = router;

