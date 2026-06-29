'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Grid, Paper, Typography, Box, Button } from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCodeIcon from '@mui/icons-material/QrCode';
import GroupIcon from '@mui/icons-material/Group';

export default function InsightsDashboard() {
  const router = useRouter();
  const [allowedActions, setAllowedActions] = useState([]);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const actualPermissions = JSON.parse(localStorage.getItem('user_permission')) || [];

    const allowedPermissionSet = new Set(
      actualPermissions
        .filter(p => p.status === 1)
        .map(p => p.permission_name)
    );

    const hasPermission = (permission) => {
      // Super Admin (role 1) has all permissions, or fallback if no permissions stored
      if (userRole === '1' || actualPermissions.length === 0) return true;
      if (!permission) return true;
      return allowedPermissionSet.has(permission);
    };

    const quickActions = [
      { label: 'List Eatery', path: '/list-restaurants', permission: 'list_eatery-read', icon: <StoreIcon /> },
      { label: 'Onboard Eatery', path: '/onboarding', permission: 'onboard_new_eatery-read', icon: <AddBusinessIcon /> },
      { label: 'Verify QR', path: '/verifyQR', permission: '', icon: <QrCodeScannerIcon /> },
      { label: 'QR Management', path: '/qr/management', permission: 'qr_management-read', icon: <QrCodeIcon /> },
      { label: 'List Customers', path: '/users/customers', permission: 'list_customers-read', icon: <GroupIcon /> },
    ];

    setAllowedActions(quickActions.filter(action => hasPermission(action.permission)));
  }, []);

  return (
    <Container maxWidth={false} sx={{ px: 0, py: 0 }}>
      <Grid container spacing={3}>
        {/* Quick Navigate */}
        {allowedActions.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                Quick Navigate
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {allowedActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={() => router.push(action.path)}
                    sx={{
                      flex: '1 1 auto',
                      minWidth: '160px',
                      maxWidth: '100%',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      p: 1.5,
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(0, 74, 0, 0.04)'
                      }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, textAlign: 'left' }}>
                      {action.label}
                    </Typography>
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Total Revenue */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: 300,
              borderRadius: 2
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Total Revenue
            </Typography>
            <Typography component="p" variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
              $24,000
            </Typography>
            <Typography color="textSecondary">
              on 15 March, 2024
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          {/* MapView placeholder if needed, or spacing */}
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
              Recent Orders
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography>Order #1 - $250 - <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>Completed</Box></Typography>
              <Typography>Order #2 - $180 - <Box component="span" sx={{ color: 'warning.main', fontWeight: 600 }}>Pending</Box></Typography>
              <Typography>Order #3 - $300 - <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>Completed</Box></Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
