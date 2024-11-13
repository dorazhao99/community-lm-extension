import React, { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Divider from '@mui/material/Divider';


export function Footer() {
    const handleProfile = () => {
        browser.runtime.openOptionsPage()
    }

    const handleSettings = () => {
        console.log('Settings')
    }

    return (
        <Paper sx={{ position: 'fixed', width:'100%', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
            showLabels
        >
            <BottomNavigationAction onClick={handleProfile} label="Profile" icon={<AccountCircleIcon />} />
            <Divider orientation="vertical" variant="middle" flexItem />
            <BottomNavigationAction onClick={handleSettings} label="Settings" icon={<SettingsIcon />} />
        </BottomNavigation>
        </Paper>
    );
}