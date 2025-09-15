const express = require('express');
const { authenticateToken } = require('../middleware/security');
const router = express.Router();

// Placeholder for expense tracking endpoints
router.get('/', authenticateToken, (req, res) => {
  res.json({ expenses: [], message: 'Expense tracking coming soon' });
});

router.post('/', authenticateToken, (req, res) => {
  res.json({ message: 'Expense creation coming soon' });
});

module.exports = router;