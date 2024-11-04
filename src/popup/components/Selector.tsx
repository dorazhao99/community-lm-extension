import * as React from 'react';
import Grid from '@mui/material/Grid2';
import { Module } from './Module' 
import { TabList, TabContext, TabPanel} from '@mui/lab';
import { Typography, Box, Tab, Button, InputBase, IconButton } from '@mui/material';

export function Selector() {
  const [value, setValue] = React.useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const sendMessage = () => {
    browser.runtime
    .sendMessage({
        type: "save_module",
        data: "Data"
    })
    .then(() => {
        console.log("Modules saved")
    });
  }

  return (
    <Box sx={{ typography: 'body1', padding: '1em 1em' }}>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Communities" value="1" />
              <Tab label="Modules" value="2" />
            </TabList>
          </Box>
          <TabPanel value="2">    
            <Box sx={{ height: '60vh', overflowY: 'auto'}}>
                <Module title="Test" description="Test"/>
            </Box>
        </TabPanel>
        <TabPanel value="1">
            <Box sx={{ height: '55vh', overflowY: 'auto'}}>
                Community
            </Box>
        </TabPanel>
        </TabContext>
        <Button onClick={sendMessage} variant="contained"> Save </Button>
    </Box>
  );
}