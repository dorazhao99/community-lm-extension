import React, { useState, useEffect } from 'react'; 
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip'; 
import Box from '@mui/material/Box';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import IconButton from '@mui/material/IconButton';
import './chips.css'
export default function ModuleChip() {
    const [dependency, changeDependency] = useState(false)

    return (
        <Grid size={4}> 
            {
                dependency ? (
                    <Paper sx={{padding: "1em", outline: "#e2e2e2 solid 1px"}} elevation={1} >
                        <Grid container>
                            <Grid size={11}> 
                                <Typography variant="body1">
                                    <strong>MSB Group @ Stanford</strong>
                                </Typography>
                            </Grid>
                            <Box onClick={() => changeDependency(!dependency)}
                                className="button"
                                display="flex"
                                justifyContent="flex-end"
                            >
                                <KeyboardArrowUpIcon/>
                            </Box>
                        </Grid>
                        <Grid sx={{margin: '0 0 1vh 0'}} container spacing={1}>
                            <Grid>
                            4 dependencies
                            </Grid>
                            &#183;
                            <Grid>
                            Updated Oct 12
                            </Grid>
                        </Grid>
                        <Typography variant="body2">
                            Dependencies
                        </Typography>
                        <Box sx={{maxHeight: '12vh', overflowY: 'auto'}} >
                            <Grid container spacing={1}>
                                <Grid>
                                    <Chip size="small" label="HCI Paper Writing"/>
                                </Grid>
                                <Grid>
                                    <Chip size="small" label="Group Feedback"/>
                                </Grid>
                                <Grid>
                                    <Chip size="small" label="MSB Social"/>
                                </Grid>
                                <Grid>
                                    <Chip size="small" label="Evaluating HCI Systems"/>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                ) : (
                    <Paper sx={{padding: "1em", outline: "#e2e2e2 solid 1px"}} elevation={1} >
                        <Grid container>
                            <Grid size={11}> 
                                <Typography variant="body1">
                                    <strong>MSB Group @ Stanford</strong>
                                </Typography>
                            </Grid>
                            <Box 
                                onClick={() => changeDependency(!dependency)}
                                className="button"
                                display="flex"
                                justifyContent="flex-end"
                            >
                                <KeyboardArrowDownIcon/>
                            </Box>
                        </Grid>
                        <Grid container spacing={1}>
                            <Grid>
                            4 dependencies
                            </Grid>
                            &#183;
                            <Grid>
                            Updated Oct 12
                            </Grid>
                        </Grid>
                    </Paper>
                )
            }
        </Grid>
    )

};
