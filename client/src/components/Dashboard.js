import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon
} from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
  const [deviceStats, setDeviceStats] = useState({ total: 0, online: 0, offline: 0 });
  const [recentDevices, setRecentDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Setup WebSocket for real-time updates
    const ws = new WebSocket(`ws://${window.location.host}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'device_update') {
        updateDeviceStats(data.devices);
        checkForNewDevices(data.devices);
      }
    };
    
    return () => ws.close();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/devices');
      setDeviceStats({
        total: response.data.total,
        online: response.data.online,
        offline: response.data.offline
      });
      
      // Get recent devices (new or recently seen)
      const recent = response.data.devices
        .filter(d => d.isNew || (new Date() - new Date(d.lastSeen)) < 300000)
        .slice(0, 5);
      setRecentDevices(recent);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const updateDeviceStats = (devices) => {
    const online = devices.filter(d => d.status === 'online').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    setDeviceStats({ total: devices.length, online, offline });
  };

  const checkForNewDevices = (devices) => {
    const newDevices = devices.filter(d => d.isNew);
    if (newDevices.length > 0) {
      const newAlerts = newDevices.map(device => ({
        id: Date.now() + Math.random(),
        type: 'new_device',
        message: `New device detected: ${device.ip} (${device.hostname || 'Unknown'})`,
        timestamp: new Date(),
        severity: 'warning'
      }));
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  };

  const quickStats = [
    {
      title: 'Network Devices',
      value: deviceStats.online,
      subtitle: `${deviceStats.offline} offline`,
      icon: <ComputerIcon />,
      color: 'primary'
    },
    {
      title: 'Security Status',
      value: 'Secure',
      subtitle: 'No threats detected',
      icon: <SecurityIcon />,
      color: 'success'
    },
    {
      title: 'Monthly Expenses',
      value: '$0',
      subtitle: 'No data yet',
      icon: <MoneyIcon />,
      color: 'info'
    },
    {
      title: 'Upcoming Events',
      value: '0',
      subtitle: 'No events scheduled',
      icon: <CalendarIcon />,
      color: 'secondary'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Quick Stats */}
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 2, color: `${stat.color}.main` }}>
                    {stat.icon}
                  </Box>
                  <Typography color="textSecondary" variant="body2">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stat.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Device Activity
            </Typography>
            <List>
              {recentDevices.length > 0 ? (
                recentDevices.map((device) => (
                  <ListItem key={device.ip}>
                    <ListItemText
                      primary={device.customName || device.hostname || device.ip}
                      secondary={`Last seen: ${new Date(device.lastSeen).toLocaleString()}`}
                    />
                    {device.isNew && (
                      <Chip label="NEW" color="warning" size="small" />
                    )}
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent activity" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Security Alerts
            </Typography>
            <List>
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <ListItem key={alert.id}>
                    <Box sx={{ mr: 2, color: 'warning.main' }}>
                      <WarningIcon />
                    </Box>
                    <ListItemText
                      primary={alert.message}
                      secondary={alert.timestamp.toLocaleString()}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No alerts" secondary="All systems normal" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;