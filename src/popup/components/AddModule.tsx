import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';


import { Typography, Box, Button } from '@mui/material';

export function AddModule(props) {
    const [link, setLink] = useState("")
    const [llmHelper, setLLMHelper] = useState("")
    const [success, setSuccess] = useState("")
    const [message, setMessage] = useState("")

    function endsWithLLM() {
        if (!link.startsWith('https://github.com')) {
            return "Repo must be a link to Github"
        } else if (!link.endsWith('.md')) {
            return "Link must be to a Markdown file"
        } else if (link.slice(8,).split('/').length <= 2) {
            return "Link formatted incorrectly"
        } else {
            return ""
        }
    }

    const handleSubmit = () => {
        const llmMessage = endsWithLLM()
        setLLMHelper(llmMessage)
        if (llmMessage.length === 0) {
            const data = {
                llmLink: link,
                uid: props.user,
            }
            browser.runtime.sendMessage({
                type: "add_module",
                data: data
            })
            .then((response) => {
                if (response.response.success) {
                    setSuccess("success")
                    props.reloadModules()
                } else {
                    setSuccess("error")
                    setMessage(response.response.message)
                }
            })
            .catch((error) => {
                console.error('Error saving module', error)
                setSuccess("error")
                setMessage("There was an error saving the module")
            });
        } else {
            setSuccess("error")
            setMessage("Check the module you are inputting again before submitting.")
        }
    }
    return (
        <Dialog
            open={props.open}
            onClose={props.handleClose}
        >
            <DialogTitle>Add Module</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    To add a knowledge module, please enter the link to the Github Markdown file.
                </DialogContentText>
                <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="link"
                    name="link"
                    fullWidth
                    label="URL of Markdown file" 
                    variant="outlined" 
                    onChange={(event) => {
                        setLink(event.target.value);
                    }}
                    helperText={llmHelper}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.handleClose}>Cancel</Button>
                {
                    (link.length === 0) ? (
                        <Button 
                        onClick={handleSubmit} 
                        disabled
                        >
                            Enter
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleSubmit} 
                        >
                            Enter
                        </Button>
                    )
                }
            </DialogActions>
            {
                success ? (
                        <Alert sx={{margin: "1em 0"}} severity={success}>
                            {
                                success === "error" ? (
                                    <div>{message}</div>
                                ) : (
                                    <div>Module added.</div>
                                )
                            }
                        </Alert>
                ): null
            }
        </Dialog>
    );
}