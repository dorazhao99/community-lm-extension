import React, { useEffect, useState } from 'react';
import { Typography, Box, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';

// import GitHubIcon from '@mui/icons-material/GitHub';


export function Login() {
    const openLogin = () => {
        browser.runtime.sendMessage({
            type: "sign_in",
        })
    }
    const openSignup = () => {
        browser.runtime.sendMessage({
            type: "sign_up",
        })
    }
    const openGuest = () => {
        browser.runtime.sendMessage({
            type: "guest_sign_up",
        })
    }

    return (
        <Box>
            <Grid sx={{padding: "2em 0"}} container direction="column" justifyContent={"center"} alignItems={"center"}>
                <Grid size={8}>
                    <Typography sx={{textAlign: "center"}} variant="h4">
                        <strong>
                            Welcome to Knoll!
                        </strong>
                    </Typography>
                </Grid>
                {/* <Grid size={5}>
                    <Button 
                        sx={{borderRadius:"12px", marginTop: "2em",width: "100%"}}
                        variant="contained"
                        onClick={openSignup}
                    >
                        Join Now
                    </Button>
                </Grid>
                <Grid size={5}>
                    <Button 
                        sx={{borderRadius:"12px", marginTop: "0.5em",width: "100%"}}
                        variant="outlined"
                        onClick={openLogin}
                    >
                        Login
                    </Button>
                </Grid> */}
                <Grid size={5}>
                    <Button 
                        sx={{borderRadius:"12px", marginTop: "2em",width: "100%"}}
                        variant="contained"
                        onClick={openGuest}
                    >
                        Get Started &rarr;
                    </Button>
                </Grid>
            </Grid>
       </Box>
    );


}