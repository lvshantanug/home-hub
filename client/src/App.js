import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DeviceMonitor from './components/DeviceMonitor';
import SecurityMonitor from './components/SecurityMonitor';
import ExpenseTracker from './components/ExpenseTracker';
import Calendar from './components/Calendar';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { token, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {token && <Navbar />}
      <Container maxWidth="xl" sx={{ mt: token ? 2 : 0, flex: 1 }}>
        <Routes>
          <Route 
            path="/login" 
            element={token ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/" 
            element={token ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/devices" 
            element={token ? <DeviceMonitor /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/security" 
            element={token ? <SecurityMonitor /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/expenses" 
            element={token ? <ExpenseTracker /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/calendar" 
            element={token ? <Calendar /> : <Navigate to="/login" />} 
          />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;