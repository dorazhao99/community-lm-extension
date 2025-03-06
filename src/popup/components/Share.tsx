import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Dialog, IconButton } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid2';
import constants from "~/services/constants";
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
export const ShareClipping= (props:any) => {
  return (
    <Dialog open={true}>
        <Grid container sx={{p: 1}} direction="column" spacing={1}>
            <Grid>
                <Typography variant="h6">
                    Share this knowledge
                </Typography>
            </Grid>
            <Grid>
                <Box sx={{backgroundColor: "#f2f2f2", p: 1.5, maxHeight: "150px", overflowY: "scroll"}}>
                    <Typography variant="body3">
                        <strong>
                            CLIPPED TEXT
                        </strong>
                    </Typography>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                        {props.clipping}
                    </Typography>
                </Box>
            </Grid>
            <Grid>
                <Grid container>
                    
                    <Grid>
                        <IconButton>
                            <GitHubIcon/>
                        </IconButton>
                    </Grid>
                    <Grid>
                        <IconButton>
                            <GoogleIcon/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    </Dialog>
  )
};
       
       
