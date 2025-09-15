const jwt = require('jsonwebtoken');

// IP whitelist middleware
const ipWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ALLOWED_IPS ? 
    process.env.ALLOWED_IPS.split(',') : 
    ['127.0.0.1', '::1']; // localhost by default
  
  const clientIP = req.ip || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
  
  // Extract IP from potential proxy headers
  const forwardedIP = req.headers['x-forwarded-for'];
  const realIP = forwardedIP ? forwardedIP.split(',')[0].trim() : clientIP;
  
  console.log(`Connection attempt from IP: ${realIP}`);
  
  // Check if IP is in whitelist
  const isAllowed = allowedIPs.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // CIDR notation support (basic)
      return realIP.startsWith(allowedIP.split('/')[0].slice(0, -1));
    }
    return realIP === allowedIP || realIP.endsWith(allowedIP);
  });
  
  if (!isAllowed) {
    console.log(`Blocked connection from unauthorized IP: ${realIP}`);
    return res.status(403).json({ error: 'Access denied from this IP address' });
  }
  
  next();
};

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = {
  ipWhitelist,
  authenticateToken
};