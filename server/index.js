const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const authRoutes = require('./routes/auth');
const { router: deviceRoutes, setScanner } = require('./routes/devices');
const securityRoutes = require('./routes/security');
const expenseRoutes = require('./routes/expenses');
const calendarRoutes = require('./routes/calendar');

const { initDatabase } = require('./database/postgres');
const { ipWhitelist } = require('./middleware/security');
const NetworkScanner = require('./services/networkScanner');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Security middleware
app.use(helmet());
app.use(ipWhitelist); // IP restriction middleware

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/calendar', calendarRoutes);

// WebSocket connection for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start network scanning
    const scanner = new NetworkScanner(wss);
    setScanner(scanner);
    scanner.startScanning();
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});