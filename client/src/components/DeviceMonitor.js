import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Router as RouterIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

const DeviceMonitor = () => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0 });
  const [loading, setLoading] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetchDevices();
    
    // Setup WebSocket for real-time updates
    const ws = new WebSocket(`ws://${window.location.host}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'device_update') {
        setDevices(data.devices);
        updateStats(data.devices);
      }
    };
    
    return () => ws.close();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('/api/devices');
      setDevices(response.data.devices);
      setStats({
        total: response.data.total,
        online: response.data.online,
        offline: response.data.offline
      });
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  };

  const updateStats = (deviceList) => {
    const online = deviceList.filter(d => d.status === 'online').length;
    const offline = deviceList.filter(d => d.status === 'offline').length;
    setStats({ total: deviceList.length, online, offline });
  };

  const handleScan = async () => {
    setLoading(true);
    try {
      await axios.post('/api/devices/scan');
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDevice = (device) => {
    setEditDevice(device);
    setEditOpen(true);
  };

  const handleSaveDevice = async () => {
    try {
      await axios.put(`/api/devices/${editDevice.ip}`, {
        name: editDevice.customName,
        notes: editDevice.notes,
        category: editDevice.category
      });
      setEditOpen(false);
      fetchDevices();
    } catch (error) {
      console.error('Failed to update device:', error);
    }
  };

  const getDeviceIcon = (device) => {
    if (device.hostname?.toLowerCase().includes('phone') || 
        device.customName?.toLowerCase().includes('phone')) {
      return <SmartphoneIcon />;
    }
    if (device.hostname?.toLowerCase().includes('router') || 
        device.ip.endsWith('.1')) {
      return <RouterIcon />;
    }
    return <ComputerIcon />;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Device Monitor
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Devices
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Online
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.online}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Offline
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.offline}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleScan}
          disabled={loading}
        >
          {loading ? 'Scanning...' : 'Scan Network'}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Device</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Hostname</TableCell>
              <TableCell>MAC Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.ip}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getDeviceIcon(device)}
                    <Box>
                      <Typography variant="body2">
                        {device.customName || device.hostname || 'Unknown Device'}
                      </Typography>
                      {device.category && (
                        <Typography variant="caption" color="text.secondary">
                          {device.category}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{device.ip}</TableCell>
                <TableCell>{device.hostname}</TableCell>
                <TableCell>{device.mac}</TableCell>
                <TableCell>
                  <Chip
                    label={device.status}
                    color={device.status === 'online' ? 'success' : 'error'}
                    size="small"
                  />
                  {device.isNew && (
                    <Chip
                      label="NEW"
                      color="warning"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {new Date(device.lastSeen).toLocaleString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditDevice(device)}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Device Name"
            fullWidth
            variant="outlined"
            value={editDevice?.customName || ''}
            onChange={(e) => setEditDevice({...editDevice, customName: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            variant="outlined"
            value={editDevice?.category || ''}
            onChange={(e) => setEditDevice({...editDevice, category: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={editDevice?.notes || ''}
            onChange={(e) => setEditDevice({...editDevice, notes: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDevice} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceMonitor;