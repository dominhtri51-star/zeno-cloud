const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const { initDatabase, logApiCall } = require('./db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Audit logging middleware for TablePlus tracking
app.use((req, res, next) => {
  const oldSend = res.send;
  res.send = function (data) {
    if (req.path.startsWith('/api/')) {
      let parsed = null;
      try {
        parsed = JSON.parse(data);
      } catch (e) {}
      logApiCall(req.path, req.method, res.statusCode, req.body, parsed, req.ip);
    }
    return oldSend.apply(res, arguments);
  };
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/public', require('./routes/public'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/alarms', require('./routes/alarms'));

// Health check & Diagnostics API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    app: 'Zeno Solar Dealer & Customer Portal',
    version: '1.1.7',
    siseliCloud: config.siseli.baseUrl,
    database: 'PostgreSQL (zeno_solar:5432)',
    time: new Date().toISOString()
  });
});

// Serve frontend built assets in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Zeno Solar Platform</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
            <h1>🚀 Zeno Solar Backend is Running!</h1>
            <p>API is available at <code>/api/health</code></p>
            <p>Database: <strong>PostgreSQL</strong> (zeno_solar on port 5432 - TablePlus Ready)</p>
          </body>
        </html>
      `);
    }
  });
});

const PORT = config.port;

// Khởi chạy server & kết nối PostgreSQL
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Zeno Web App đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔗 Siseli API Proxy Base: ${config.siseli.baseUrl}`);
  console.log(`🗄️ PostgreSQL Database: localhost:5432/zeno_solar`);
  console.log(`=======================================================`);
  await initDatabase();
});
