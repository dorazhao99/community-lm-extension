import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Button, Divider, Alert, CircularProgress, Paper, IconButton, TextField } from "@mui/material";
import { ShareClipping } from "./Share";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IosShareIcon from '@mui/icons-material/IosShare';
import Grid from '@mui/material/Grid2';
import constants from "~/services/constants";
import { getByteSize } from "~/contentScripts/utils";

export const PersonalModule = (props:any) => {
  const [edit, setEdit] = useState(false)
  const [success, setSuccess] = useState({})
  const [share, setShare] = useState('')
  const [open, setOpen] = useState(false)
  const [manual, setManual] = useState('')
  const [isAdd, setAdd] = useState(false)
  const [knowledgeDict, setKD] = useState({})
  const [clippedKnowledge, setClippedKnowledge] = useState([])
  
  
  const deleteClip = (idx:number) => {
    const newClipped = [...clippedKnowledge]
    newClipped.splice(idx, 1); // Removes the element at index 2 (value 3)
    setClippedKnowledge(newClipped)
    let updatedKD:any = {...knowledgeDict}
    updatedKD['personal'] = {knowledge: newClipped, link: `${constants.URL}/personal`, name: 'Personal Module'}
    browser.storage.local.set({"knowledge": updatedKD}).then(() => {
            return new Promise((resolve, reject) => {
              resolve(null)
            })
    });
    browser.runtime.sendMessage({type: "log", data: {action: 'delete_personal'}}) 
  }

  const shareClip=(idx:number) => {
    if (idx < clippedKnowledge.length) {
        setShare(clippedKnowledge[idx])
        setOpen(true)
    }
  }

  const onUpdate = (evt) => {
    setManual(evt.target.value)
  }

  const manualSave = () => {
    if (manual.length > 0) {
        const numBytes = getByteSize(manual) 
        console.log(numBytes)
        if (numBytes > 500000) {
            setSuccess({status: false, message: 'Entry cannot exceed 500KB in size.'})
        } else {
            const newClipped = [...clippedKnowledge, manual]
            setClippedKnowledge(newClipped)
            let updatedKD = {...knowledgeDict}
            updatedKD['personal'] = {knowledge: newClipped, link: `${constants.URL}/personal`, name: 'Personal Module'}
            browser.storage.local.set({"knowledge": updatedKD}).then(() => {
                return new Promise((resolve, reject) => {
                    resolve(null)
                })
            })
            .catch(error => {
                setSuccess({status: false, message: 'Personal module size has exceeded quota limit. Remove knowledge from your personal module or import the information as an external module using a GitHub Markdown or Google Docs file.'})
            });
        
            browser.runtime.sendMessage({type: "log", data: {action: 'add_manual'}})  
            setManual('')
            setAdd(!isAdd)
            setSuccess({})
        }
    }
  }

  useEffect(() => {
    browser.storage.local.get(["knowledge"]).then((result) => {
        if ("knowledge" in result) {
            const knowledge = result['knowledge']
            setKD(knowledge)
            if ("personal" in knowledge) {
                setClippedKnowledge(knowledge["personal"]["knowledge"])
            }
        }
      })
  }, [])


  return (
    <Box sx={{p: 2}}>
        <ShareClipping 
            clipping={share}
            open={open}
            isAnon={props.isAnon}
            handleClose={() => setOpen(!open)}
        />
        <Grid container direction="column" spacing={1} alignItems="space-around">
            <Grid>
                <Grid container direction="row" spacing={1} alignItems="center">
                    <Grid>
                        <Typography variant="body1">
                            <strong>
                                Personal Knowledge Module
                            </strong>
                        </Typography>
                    </Grid>
                    <Grid>
                        <Button variant={edit ? "contained": "outlined"} size="small" onClick={() => setEdit(!edit)} disabled={clippedKnowledge.length === 0 || isAdd}>
                            {edit ? "Done" : "Edit"}
                        </Button>
                    </Grid>
                    <Grid>
                        <Button size="small" variant="contained" onClick={() => setAdd(!isAdd)}>
                            Add Manually
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
            {
                isAdd ? (
                    <Grid>
                        <Paper sx={{p:1}} elevation={3}>
                            <TextField
                                inputProps={{style: {fontSize: 13}}} 
                                fullWidth
                                multiline
                                onChange={onUpdate}
                            />
                            <Button sx={{mt: 0.5}} size="small" onClick={manualSave} disabled={manual.length === 0}>
                                Save
                            </Button>
                        </Paper>
                    </Grid>
                ) : null
            }
            {
                ('status' in success) ? (
                    <Alert severity="error">
                        {success.message}
                    </Alert>
                ) : null
            }
            <Grid>
                {
                    clippedKnowledge.length > 0 ? (
                        clippedKnowledge.map((clip, idx) => {
                            return (
                                <Paper sx={{p:1, mb: 1}}>
                                    <Grid container spacing={1} justifyContent="space-around" alignItems="center">
                                        <Grid size={11} sx={{maxHeight: "10em", overflowY: "auto", maxWidth: "80vw"}}>
                                            <Typography variant="body2" style={{ whiteSpace: 'pre-line'}}>
                                                {clip}
                                            </Typography>
                                        </Grid>
                                        {
                                            edit ? (
                                                <Grid size={1}>
                                                    <IconButton size="small">
                                                        <DeleteOutlineIcon onClick={() => deleteClip(idx)}/>
                                                    </IconButton>
                                                </Grid>
                                            ) : (
                                                <Grid size={1}>
                                                    <IconButton size="small">
                                                        <IosShareIcon onClick={() => shareClip(idx)}/>
                                                    </IconButton>
                                                </Grid>
                                            )
                                        }
                                    </Grid>
                                </Paper>
                            )
                        })
                    ) : (
                        <Box>
                            <Typography variant="body1">
                                No knowledge added yet. <br/>
                                Learn how to add knowledge to your module here.
                            </Typography>
                        </Box>
                    )
                }
            </Grid>
        </Grid>
    </Box>
  )
};
       
       
