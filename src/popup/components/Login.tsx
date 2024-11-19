import React, { useEffect, useState } from 'react';
import { Typography, Box, Button } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';


export function Login() {
    const openLogin = () => {
        browser.runtime.sendMessage({
            type: "sign_in",
        })
    }

    return (
       <Box>
        <Typography>
            Start using Community LM when you use ChatGPT.
        </Typography>
        <Button 
            sx={{borderRadius:"12px", backgroundColor: "#202124", marginTop: "2em"}}
            variant="contained"
            endIcon={<GitHubIcon/>}
            onClick={openLogin}
        >
            Log in or Sign up
        </Button>
       </Box>
    );


}