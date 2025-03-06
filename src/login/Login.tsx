import React, { useState, useEffect } from 'react'; 
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
export const Login = () => {
  return (
    <Box sx={{height: "100vh", backgroundColor: "#EDE8F5"}}> 
      <Grid container>
        <Grid display="flex" justifyContent="center" alignItems="center"
          sx={{height: "100vh"}} size={12}>
          <Box sx={{
            backgroundColor: "white", 
            width:"40%", 
            padding: "2em", 
            borderRadius: "12px", 
            height: "20vh", 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
              <Typography variant="h4">
                <strong>Welcome to Community LM</strong>
              </Typography>
              <Button sx={{borderRadius:"12px", backgroundColor: "#202124", marginTop: "2em"}} variant="contained" endIcon={<GitHubIcon />}>
                Sign in with Github
              </Button>
          </Box>
          {/* <Typography variant="h4">
            <strong>
              Welcome to Community LM
            </strong>
          </Typography>
        </Grid>
        <Grid display="flex" alignItems="center">
          <Box sx={{padding: "2em"}}>
            <Typography variant="h6">
              Connect to Community LM using your Github account
            </Typography>
            <Button variant="contained">
              Sign in with Github
            </Button>
          </Box> */}
        </Grid>
      </Grid>
    </Box>
  )

};
