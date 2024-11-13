import React, { useState, useEffect } from 'react'; 
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AutoAwesomeMotionRoundedIcon from '@mui/icons-material/AutoAwesomeMotionRounded';
import ModuleChip from './ModuleChip';
import './chips.css';
export const Profile = () => {
  return (
    <Container>
      <Box className="section">
        <Typography variant="h3">
          dorazhao9
        </Typography>
      </Box>
      <Box className="section">
        <Grid container spacing={2}>
          <Grid>
            <PeopleRoundedIcon fontSize="large"/>
          </Grid>
          <Grid>
              <Typography variant="h5">
                Communities
              </Typography>
          </Grid>
          <Grid>
            <Typography variant="h5">
              1
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid size={4}> 
            <Paper sx={{padding: "1em", outline: "#e2e2e2 solid 1px"}} elevation={1} >
              <Typography variant="body1">
                Stanford HCI
              </Typography>
              <Grid container spacing={1}>
                <Grid>
                  2 modules
                </Grid>
                &#183;
                <Grid>
                  Updated Aug 10
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      <Grid container spacing={2}>
        <Grid>
          <AutoAwesomeMotionRoundedIcon fontSize="large"/>
        </Grid>
        <Grid>
            <Typography variant="h5">
              Modules
            </Typography>
        </Grid>
        <Grid>
          <Typography variant="h5">
            4
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <ModuleChip/>
        <ModuleChip/>
        <ModuleChip/>
        <ModuleChip/>
      </Grid>

    </Container>
  )

};
