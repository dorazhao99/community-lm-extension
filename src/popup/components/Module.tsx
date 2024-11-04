import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid2';
import Checkbox from '@mui/joy/Checkbox';

import GitHubIcon from '@mui/icons-material/GitHub';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import { Typography, Paper, Card, CardContent, IconButton, Chip, } from '@mui/material';

export function Module(props) {
    const handleClick = () => {
        console.log(props)
        window.open(props.link, '_blank');
    };


    return (
        <Card className="module">
            <Grid container spacing={1} alignItems="center" >
                <Grid size={1}>
                    <Checkbox id={props.id} variant="solid"/>
                </Grid>
                <Grid size={6} className="info">
                    <Typography variant="h6" align="left">
                        <strong>{props.title}</strong>
                        <IconButton type="button" aria-label="github">
                            <GitHubIcon onClick={handleClick}/>
                        </IconButton>
                        <Chip icon={<GroupIcon/>} label={Math.floor(2)}/> 
                             
                    </Typography>
                    <Typography align="left" variant="body1">
                        {props.description}
                    </Typography>
                </Grid>
                <Grid size={1}>
                    {props.access === 1 ? <div/> : <LockIcon/>}
                </Grid>
            </Grid>
        </Card>
    );


}