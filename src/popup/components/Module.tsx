import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid2';
import GitHubIcon from '@mui/icons-material/GitHub';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import { Typography, Paper, Card, CardContent, IconButton, Chip, Checkbox} from '@mui/material';
import './module.css'; 

export function Module(props) {
    const handleClick = (e) => {
        const target = e.target
        if (target.type !== "checkbox") {
            window.open(props.link, '_blank');
        }
        // console.log(props)
        // window.open(props.link, '_blank');
    };


    return (
        <Paper onClick={handleClick} className="module">
            <Grid container spacing={1} alignItems="center">
                <Grid size={1}>
                    <Checkbox 
                        id={props.id} 
                        size="small"
                        variant="solid" 
                        checked={props.checked}
                        onChange={props.onChange}
                    />
                </Grid>
                <Grid size={10} className="info">
                    <Typography variant="body" align="left">
                        <strong>{props.title}</strong>                           
                    </Typography>
                    <Typography align="left" variant="body2">
                        {props.description}
                    </Typography>
                </Grid>
                <Grid size={1}>
                    {props.access === 1 ? <div/> : <LockIcon/>}
                </Grid>
            </Grid>
            {/* <Grid container>
                <IconButton type="button" aria-label="github">
                    <GitHubIcon onClick={handleClick}/>
                </IconButton>  
            </Grid> */}
        </Paper>
    );


}