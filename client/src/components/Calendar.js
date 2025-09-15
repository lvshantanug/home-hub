import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Calendar = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Family Calendar
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography>
          This section will include:
        </Typography>
        <ul>
          <li>Shared family calendar</li>
          <li>Event scheduling</li>
          <li>Push notifications</li>
          <li>Recurring events</li>
          <li>Task assignments</li>
          <li>Integration with Google/Apple calendars</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default Calendar;