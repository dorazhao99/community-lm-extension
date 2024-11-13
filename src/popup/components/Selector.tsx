import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { Module } from './Module' 
import { TabList, TabContext, TabPanel} from '@mui/lab';
import { Typography, Box, Paper, Tab, Button, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import browser from "webextension-polyfill";

interface Checked {
    [key: string]: boolean;
}

export function Selector(props) {
    const [value, setValue] = useState('1');
    const [checked, setChecked] = useState({})

    useEffect(() => {
        browser.storage.sync.get("checkedModules")
        .then((result) => {
            // If undefined, send a message to read from the database
            console.log('checkedModules', result)
            if (result.checkedModules) {
                setChecked(result.checkedModules)
            }
            // call to API to update user's selected modules but do not await (background call)
        })
    }, [])

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleChecked = (event) => {
        let updatedChecked = {...checked} 
        updatedChecked[event.target.id.toString()] = event.target.checked 
        setChecked(updatedChecked)
        console.log('checked', checked)
    }

    const sendMessage = () => {
        browser.runtime.sendMessage({
            type: "save_module",
            data: {checked: checked, modules: props.modules}
        })
        .then(() => {
            browser.storage.sync.set({checkedModules: checked})
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
          <TabPanel value="2" sx={{padding: '12px', height: "67vh"}}>  
            <Box sx={{width: '100%', margin: '0 0 0 4px'}}>
                    <Grid container alignItems={"center"}>
                        <Grid size={2}>
                            <SearchIcon />
                        </Grid>
                        <Grid size={10}>
                            <InputBase
                                placeholder="Search Modules"
                                inputProps={{ 'aria-label': 'Search Modules' }}
                                onChange = {props.filterItems}
                            />
                        </Grid>
                    </Grid> 
            </Box> 
            <Grid container sx={{ maxHeight: '60vh', overflowY: 'scroll'}}>
                {
                    props.modules.map((module, idx) => {
                    return(
                        <Grid size={12} sx={{margin: '0 0 0 4px'}}>
                            <Module 
                                checked={checked[module.id] ? checked[module.id] : false}
                                onChange={handleChecked}
                                id={module.id}
                                title={module.name}
                                description={module.description}
                                link={module.gh_page}
                                access={module.access}
                            />
                        </Grid>
                    )
                    })
                }
                {console.log('Checked', checked)}

                {console.log(props.modules)}
            </Grid>
        </TabPanel>
        <TabPanel value="1" sx={{padding: '12px', height: "67vh"}}>
            <Box sx={{ height: '55vh', overflowY: 'auto'}}>
                Community
            </Box>
        </TabPanel>
        </TabContext>
        <Button onClick={sendMessage} variant="contained"> Save </Button>
    </Box>
  );
}