import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { Module } from './Module';
import { styled, alpha } from '@mui/material/styles';
import { Typography, Box, Button, InputBase, Toolbar, AppBar, IconButton, Paper, Checkbox } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Alert from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import { AddModule } from './AddModule';
import browser from "webextension-polyfill";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

import './module.css'; 

interface Checked {
    [key: string]: boolean;
}

export function Selector(props) {
    const [open, setOpen] = useState(false);
    const [checked, setChecked] = useState(props.checked)
    const [showAlert, setAlert] = useState(false)
    const [isSuccess, setSuccess] = useState(false)

    const explorePage = () => {
        browser.runtime.sendMessage({
            type: "explore",
        })
    }

    const handleClick = () => {
        window.open('https://knollapp.com/create', '_blank');
    };

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleChecked = (event) => {
        let updatedChecked = {...checked} 
        updatedChecked[event.target.id.toString()] = event.target.checked 
        setChecked(updatedChecked)
    }

    const sendMessage = () => {
        console.log('send messsage', checked, props.modules)
        browser.runtime.sendMessage({
            type: "save_module",
            data: {checked: checked, modules: props.modules}
        })
        .then(() => {
            browser.storage.session.set({"checked": checked})
            setAlert(true)
            setSuccess(true)
        })
        .catch((error) => {
            console.error(error)
            setAlert(true)
            setSuccess(false)
        });
    }

    // const checkAll = (event, modules) => {
    //     let updateChecked = {...checked}
    //     console.log('comm checkked', updateChecked, modules)
    //     modules.forEach((module, _) => {
    //         updateChecked[module] = event.target.checked
    //     })
    //     setChecked(updateChecked)
    //   }

    useEffect(() => {
        setChecked(props.checked)
    }, [props.checked])

    return (
        <Box sx={{ typography: 'body1'}}>
            {/* <AddModule 
                user={props.user}
                open={open}
                handleClose={() => setOpen(false)}
                reloadModules={props.reloadModules}
            /> */}
            <Box sx={{height: '65vh', margin: '1em 1em 0 1em'}}>
                 <Typography variant="body1">
                    <strong>
                        Imported Knowledge Modules
                    </strong>
                </Typography>
                <Grid container sx={{ maxHeight: '60vh', overflowY: 'auto'}} justifyContent="center">
                    {
                        props.modules.map((module, idx) => {
                            const link = module?.source === 'google' ? module.doc_page : module.gh_page
                            return(
                                <Module 
                                    checked={checked[module.id] ? checked[module.id] : false}
                                    onChange={handleChecked}
                                    id={module.id}
                                    title={module.name}
                                    description={module.description}
                                    link={link}
                                    access={module.access}
                                />
                            )
                        })
                    }
                    {
                        Object.keys(props.modules).length < 2 ? (
                            <Grid sx={{mt: 3}} align="center">
                                <Typography>
                                    <strong>
                                        Explore what other types of knowledge you can add.
                                    </strong>
                                </Typography>
                                <Button variant="outlined" onClick={explorePage}>
                                    Browse Modules
                                </Button>
                            </Grid>
                        ) : null
                    }
                </Grid>
            </Box>
            <Box>
            </Box>
            <Grid container
                direction="column"
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{p: 1}}
            >
                <Grid size={10}>
                    <Button 
                        fullWidth
                        size="small"
                        onClick={sendMessage} 
                        variant="contained"
                    > 
                        Update
                    </Button>
                </Grid>
                <Grid>
                    {
                        showAlert ? (
                            isSuccess ? (
                                <Alert 
                                severity="success"
                                onClose={() => setAlert(false)}
                            >
                                Modules saved.
                            </Alert>
                            ) : (
                                <Alert 
                                severity="error"
                                onClose={() => setAlert(false)}
                            >
                                Error saving modules.
                            </Alert>
                            )
                        ) : null
                    }
                </Grid>
                {/* <Grid size={10} textAlign="center">
                    <Typography variant="body2">
                        Last updated at DATE
                    </Typography>
                </Grid> */}
            </Grid>
        </Box>
    );
}

{/* <TabContext value={value}>
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
</TabContext> */}