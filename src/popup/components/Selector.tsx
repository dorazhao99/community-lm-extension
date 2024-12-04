import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { Module } from './Module';
import { TabList, TabContext, TabPanel} from '@mui/lab';
import { Typography, Box, Paper, Tab, Button, InputBase, IconButton } from '@mui/material';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import { CommunityOption } from './CommunityOption';
import SearchIcon from '@mui/icons-material/Search';
import browser from "webextension-polyfill";
import userServices from '~/services/userServices';

interface Checked {
    [key: string]: boolean;
}

export function Selector(props) {
    const [value, setValue] = useState('1');
    const [checked, setChecked] = useState(props.checked)
    const [showAlert, setAlert] = useState(false)
    const [isSuccess, setSuccess] = useState(false)

    useEffect(() => {
        browser.storage.sync.get("checkedModules")
        .then((result) => {
            console.log('checkedModules', result)
            if (result.checkedModules) {
                setChecked(result.checkedModules)
            } else {
                // read from DB if checked is not saved in browser storage
                userServices.fetchUserModules()
                .then((userResponse) => {
                    if (userResponse.success) {
                        console.log('Read DB', userResponse.response.checked)
                        setChecked(userResponse.response.checked)
                    }
                })
            }
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
        console.log('send messsage', checked, props.modules)
        browser.runtime.sendMessage({
            type: "save_module",
            data: {checked: checked, modules: props.modules}
        })
        .then(() => {
            browser.storage.sync.set({checkedModules: checked})
            console.log("Modules saved")
            setAlert(true)
            setSuccess(true)
        })
        .catch(() => {
            setAlert(true)
            setSuccess(false)
        });
    }

    const checkAll = (event, modules) => {
        let updateChecked = {...checked}
        console.log('comm checkked', updateChecked, modules)
        modules.forEach((module, _) => {
            updateChecked[module] = event.target.checked
        })
        setChecked(updateChecked)
      }


  return (
    <Box sx={{ typography: 'body1'}}>
        <Grid container justifyContent="end">
            {
                showAlert ? (
                    isSuccess ? (
                        <Alert 
                        sx={{ position: "absolute", top: 5, left: 255, right: 10, zIndex: 999, width: "200px" }} 
                        severity="success"
                        onClose={() => setAlert(false)}
                    >
                        Modules saved.
                    </Alert>
                    ) : (
                        <Alert 
                        sx={{ position: "absolute", top: 5, left: 255, right: 10, zIndex: 999, width: "210px" }} 
                        severity="error"
                        onClose={() => setAlert(false)}
                    >
                        Error saving modules.
                    </Alert>
                    )
                ) : null
            }
        </Grid>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Communities" value="1" />
              <Tab label="Modules" value="2" />
            </TabList>
          </Box>
          <TabPanel value="2" sx={{padding: '12px', height: "73vh"}}>  
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
            <Grid container sx={{ maxHeight: '70vh', overflowY: 'scroll'}}>
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
        <TabPanel value="1" sx={{padding: '12px', height: "73vh"}}>
            <Box sx={{ height: '70vh', overflowY: 'auto'}}>
                {
                    props.communities.map((comm, _) => {
                    return (
                        <Grid size={12} sx={{margin: '0 0 0 4px'}}>
                            <CommunityOption
                                checked = {checked}
                                name = {comm.name}
                                description = {comm.description}
                                modules = {comm.modules}
                                allModules = {props.modules}
                                onChange={handleChecked}
                                handleChangeAll={() => checkAll(event, comm.modules)}
                            />
                        </Grid>
                    )
                    })
                }
            </Box>
        </TabPanel>
        </TabContext>
        <Grid sx={{padding: '12px'}} container justifyContent="center">
            <Button 
                sx={{width: '95%'}} 
                onClick={sendMessage} 
                variant="contained"
            > 
                Save
            </Button>
        </Grid>
    </Box>
  );
}