import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const ExpenseTracker = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Expense Tracker
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography>
          This section will include:
        </Typography>
        <ul>
          <li>Household expense tracking</li>
          <li>Receipt scanning and OCR</li>
          <li>Budget categories</li>
          <li>Monthly/yearly reports</li>
          <li>Bill reminders</li>
          <li>Shared expense management</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default ExpenseTracker;