import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Dialog, Button, Alert, Paper, IconButton} from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid2';
import constants from "~/services/constants";
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export const ShareClipping= (props:any) => {
    const [success, setSuccess] = useState(-1)
    const [shareUrl, setShareUrl] = useState('')
    const [errorNumber, setNumber] = useState(-1)
    const [alertMessage, setMessage] = useState('')

    const openGithub = () => {
        browser.runtime.sendMessage({
            type: "link_gh",
        })
    }

    const createAlert = (num) => {
        if (success === 0) {
            return (
                <Alert severity="success"> {alertMessage} </Alert>
            )
        } else {
            if (num === -1) {
                return null
            }
            else if (num === 0) {
                return (
                    <Alert severity="error"> {alertMessage} </Alert>
                )
            } else if (num === 1) {
                return (
                    <Alert severity="error">
                        {alertMessage}
                        <Button
                            variant="contained"
                            size="small"
                            sx={{backgroundColor: "#323639", mt: 0.5}}
                            onClick={openGithub}
                        >Link Github Account</Button>
                    </Alert>
                )
            }
        }
    }
    const copyClipboard = async(copyItem) => {
        try {
            await navigator.clipboard.writeText(copyItem);
            browser.runtime.sendMessage({type: "log", data: {action: 'share_copy'}}) 
            setSuccess(0)
            setMessage('Copied to clipboard.')
        } catch (err) {
            setSuccess(1)
            setNumber(0)
            setMessage('Failed to copy.')
        }
    }

    const shareGithub = async() => {
        if (props.isAnon) {
            setSuccess(1)
            setNumber(1)
            setMessage('Please authenticate with Github to share via Gist.')
        } else {
            browser.runtime.sendMessage({
                type: "create_gist",
                data: {clipping: props.clipping}
            })
            .then(response => {
                console.log(response)
                browser.runtime.sendMessage({type: "log", data: {action: 'share_github'}}) 
                setShareUrl(response.response.url)
            })
            .catch(error => {
                setSuccess(1)
                setNumber(0)
                setMessage('Error creating Github Gist. Please try again later.')
            })
        }
    }
    return (
        <Dialog open={props.open} onClose={props.handleClose}>
            <Grid container sx={{p: 2}} direction="column" spacing={1}>
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
                    <Typography variant="body2">
                        Share as <br/>
                    </Typography>
                    <Grid container spacing={1}>
                        
                        <Grid>
                            <Button 
                                onClick={() => copyClipboard(props.clipping)}
                                color="secondary"
                                variant="contained"
                                size="small"
                                startIcon={<ContentCopyIcon />}
                            >
                                Copy text
                            </Button>
                        </Grid>
                        <Grid>
                            <Button 
                                onClick={shareGithub}
                                color="secondary"
                                variant="contained"
                                size="small"
                                startIcon={<GitHubIcon />}
                            >
                                GitHub Gist
                            </Button>
                        </Grid>
                        {/* <Grid>
                            <Button color="secondary" variant="contained" size="small" startIcon={<GoogleIcon />}>
                                Google Docs
                            </Button>
                        </Grid> */}
                    </Grid>
                </Grid>
                <Grid>
                    {
                        shareUrl.length > 0 ? (
                            <Paper elevation={0} sx={{mt: 1}}>
                                <Typography variant="body3">
                                    <strong>
                                    Link to Gist:
                                    </strong>
                                </Typography>
                                <Box sx={{backgroundColor: "#f2f2f2", p: 1}}>
                                    <Grid container spacing={1} justifyContent="flex-start" alignItems="center">
                                        <Grid size={10}>
                                            <Typography variant="body2" style={{maxWidth: "400px", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden"}}>
                                                <a href={shareUrl} target="_blank" rel="noreferrer">
                                                    {shareUrl}
                                                </a>
                                            </Typography>
                                        </Grid>
                                        <Grid size={1}>
                                            <IconButton size="small" onClick={() => copyClipboard(shareUrl)}>
                                                <ContentCopyIcon/>
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Paper>
                        ) : null
                    }
                </Grid>
                <Grid>
                        {
                            createAlert(errorNumber)
                        }
                    </Grid>
            </Grid>
        </Dialog>
  )
};
       
       
