const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const mockData = require('../mockData');

const checkAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập!' });
  }
  req.token = token;
  req.isDemo = token.startsWith('demo_token_');
  next();
};

// 1. Lấy danh sách nhóm (Đọc trực tiếp từ PostgreSQL zeno_solar)
router.get('/', checkAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        g.group_id as "groupId",
        g.group_name as "groupName",
        g.description,
        COUNT(c.user_id)::int as "memberCount",
        TO_CHAR(g.created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt"
      FROM customer_groups g
      LEFT JOIN customers c ON c.group_id = g.group_id
      GROUP BY g.group_id, g.group_name, g.description, g.created_at
      ORDER BY g.group_id ASC;
    `;
    const result = await pool.query(query);

    return res.json({
      success: true,
      mode: 'POSTGRESQL_DB',
      groups: result.rows
    });
  } catch (err) {
    console.error('[DB Groups Get Error]:', err.message);
    return res.json({
      success: true,
      mode: 'FALLBACK_MOCK',
      groups: mockData.groups
    });
  }
});

// 2. Tạo nhóm mới (Ghi vào PostgreSQL)
router.post('/', checkAuth, async (req, res) => {
  const { groupName, description } = req.body;

  if (!groupName) {
    return res.status(400).json({ success: false, message: 'Tên nhóm không được để trống!' });
  }

  try {
    const insertQuery = `
      INSERT INTO customer_groups (group_name, description)
      VALUES ($1, $2)
      RETURNING group_id as "groupId", group_name as "groupName", description, 0 as "memberCount", created_at as "createdAt";
    `;
    const result = await pool.query(insertQuery, [groupName, description || '']);
    const newGroup = result.rows[0];

    // Log sync
    await pool.query(
      `INSERT INTO api_sync_logs (endpoint, method, status_code, request_payload, response_payload) VALUES ($1, $2, $3, $4, $5)`,
      ['/api/groups', 'POST', 200, JSON.stringify({ groupName, description }), JSON.stringify(newGroup)]
    );

    return res.json({
      success: true,
      mode: 'POSTGRESQL_DB',
      message: 'Tạo nhóm khách hàng thành công trong Cơ sở dữ liệu!',
      group: newGroup
    });
  } catch (err) {
    console.error('[DB Group Create Error]:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi ghi CSDL: ' + err.message });
  }
});

// 3. Thêm thành viên vào nhóm
router.post('/:id/members', checkAuth, async (req, res) => {
  const groupId = req.params.id;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'Thiếu userId' });
  }

  try {
    await pool.query('UPDATE customers SET group_id = $1 WHERE user_id = $2', [groupId, userId]);
    return res.json({ success: true, message: 'Đã thêm khách hàng vào nhóm trong CSDL' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Lấy danh sách thành viên trong nhóm
router.get('/:id/members', checkAuth, async (req, res) => {
  const groupId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT user_id as "userId", account, user_name as "userName", email, cellphone, status FROM customers WHERE group_id = $1',
      [groupId]
    );
    return res.json({
      success: true,
      members: result.rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
