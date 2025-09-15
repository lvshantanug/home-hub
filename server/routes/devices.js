const express = require('express');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

// In-memory storage for now (you can replace with database later)
let networkScanner = null;

// Set scanner instance (called from main server)
const setScanner = (scanner) => {
  networkScanner = scanner;
};

// Get all devices
router.get('/', authenticateToken, (req, res) => {
  if (!networkScanner) {
    return res.status(500).json({ error: 'Network scanner not initialized' });
  }
  
  const devices = networkScanner.getDevices();
  res.json({
    devices,
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length
  });
});

// Trigger manual scan
router.post('/scan', authenticateToken, async (req, res) => {
  if (!networkScanner) {
    return res.status(500).json({ error: 'Network scanner not initialized' });
  }
  
  try {
    const devices = await networkScanner.scanNetwork();
    res.json({ 
      message: 'Scan completed', 
      devicesFound: devices.length,
      devices 
    });
  } catch (error) {
    res.status(500).json({ error: 'Scan failed: ' + error.message });
  }
});

// Update device info (name, notes, etc.)
router.put('/:ip', authenticateToken, (req, res) => {
  const { ip } = req.params;
  const { name, notes, category } = req.body;
  
  if (!networkScanner) {
    return res.status(500).json({ error: 'Network scanner not initialized' });
  }
  
  const devices = networkScanner.devices;
  const device = devices.get(ip);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  // Update device info
  if (name) device.customName = name;
  if (notes) device.notes = notes;
  if (category) device.category = category;
  
  devices.set(ip, device);
  
  res.json({ message: 'Device updated', device });
});

module.exports = { router, setScanner };