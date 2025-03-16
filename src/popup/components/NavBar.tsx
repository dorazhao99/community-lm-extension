import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';

import { Typography, Box, Button, InputBase, Toolbar, AppBar, IconButton, Paper, Checkbox } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import browser from "webextension-polyfill";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';


export function NavBar(props) {

    const handleSettings = () => {
        browser.tabs.create({ url: browser.runtime.getURL("dist/login/index.html") });
    }

    return (
        <AppBar sx={{backgroundColor: 'inherit', padding: '4px 0'}} position="static" elevation={0}>
            <Toolbar variant="dense">
                <Grid sx={{width: "100%"}} container justifyContent="center" alignItems="center">
                    <Grid>
                        <ToggleButtonGroup
                            value={props.view}
                            exclusive
                            onChange={props.handleChange}
                            size="small"
                        >
                             <ToggleButton value="personal">
                                <Button sx={{color: "#1e1e1e"}} color="secondary" value="personal" size="small"  variant={props.view === "personal" ? "contained" : "text"}>
                                    Personal Module
                                </Button>
                            </ToggleButton>
                            <ToggleButton value="imported">
                                <Button sx={{color: "#1e1e1e"}} color="secondary" value="imported" size="small" variant={props.view === "imported" ? "contained" : "text"}>
                                    Imported Modules
                                </Button>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Toolbar>
        </AppBar>
    );
}


{/* <Grid size={8}>
                            <Box>
                                <Grid container 
                                    sx={{
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        border: 'solid 1px #e2e2e2',
                                        borderRadius: '16px',
                                        padding: '4px'
                                    }}>
                                    <SearchIcon sx={{color:"#323639"}}/>
                                    <InputBase
                                        placeholder="Search..."
                                        inputProps={{ 'aria-label': 'Search...' }}
                                        onChange = {props.filterItems}
                                    />
                                </Grid> 
                            </Box>
                        </Grid>
                    </Grid> */}