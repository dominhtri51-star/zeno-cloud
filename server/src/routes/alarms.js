const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const mockData = require('../mockData');

const checkAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập!' });
  }
  next();
};

// 1. Lấy danh sách cảnh báo (Đọc trực tiếp từ PostgreSQL zeno_solar)
router.get('/', checkAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        alarm_id as "alarmId",
        station_id as "stationId",
        device_sn as "deviceSn",
        level,
        type,
        title,
        message,
        is_processed as "isProcessed",
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt"
      FROM alarms
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query);

    return res.json({
      success: true,
      mode: 'POSTGRESQL_DB',
      total: result.rowCount,
      unprocessedCount: result.rows.filter(a => !a.isProcessed).length,
      alarms: result.rows
    });
  } catch (err) {
    console.error('[DB Alarms Get Error]:', err.message);
    return res.json({
      success: true,
      mode: 'FALLBACK_MOCK',
      total: mockData.alarms.length,
      unprocessedCount: mockData.alarms.filter(a => !a.isProcessed).length,
      alarms: mockData.alarms
    });
  }
});

// 2. Xử lý cảnh báo (Cập nhật trực tiếp vào PostgreSQL)
router.put('/:id/resolve', checkAuth, async (req, res) => {
  const alarmId = req.params.id;

  try {
    const updateQuery = `
      UPDATE alarms 
      SET is_processed = TRUE 
      WHERE alarm_id = $1 
      RETURNING alarm_id as "alarmId", station_id as "stationId", title, is_processed as "isProcessed";
    `;
    const result = await pool.query(updateQuery, [alarmId]);
    if (result.rowCount > 0) {
      return res.json({
        success: true,
        mode: 'POSTGRESQL_DB',
        message: 'Đã xác nhận xử lý cảnh báo trong Cơ sở dữ liệu',
        alarm: result.rows[0]
      });
    }
    return res.status(404).json({ success: false, message: 'Không tìm thấy cảnh báo trong CSDL' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật CSDL: ' + err.message });
  }
});

module.exports = router;
