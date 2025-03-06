import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { Button, Divider, Alert, CircularProgress, Paper, IconButton, TextField } from "@mui/material";
import { ShareClipping } from "./Share";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IosShareIcon from '@mui/icons-material/IosShare';
import Grid from '@mui/material/Grid2';
import constants from "~/services/constants";

export const PersonalModule = (props:any) => {
  const [edit, setEdit] = useState(false)
  const [manual, setManual] = useState('')
  const [isAdd, setAdd] = useState(false)
  const [knowledgeDict, setKD] = useState({})
  const [clippedKnowledge, setClippedKnowledge] = useState([])
  
  
  const deleteClip = (idx) => {
    const newClipped = [...clippedKnowledge]
    newClipped.splice(idx, 1); // Removes the element at index 2 (value 3)
    setClippedKnowledge(newClipped)
    let updatedKD:any = {...knowledgeDict}
    updatedKD['personal'] = {knowledge: newClipped, link: `${constants.URL}/${props.uid}/personal`, name: 'Personal Module'}
    browser.storage.local.set({"knowledge": updatedKD}).then(() => {
            return new Promise((resolve, reject) => {
              resolve(null)
            })
    });
  }

  const shareClip=(idx:number) => {
    console.log("share")
  }

  const onUpdate = (evt) => {
    setManual(evt.target.value)
  }

  const manualSave = () => {
    if (manual.length > 0) {
        const newClipped = [...clippedKnowledge, manual]
        setClippedKnowledge(newClipped)
        let updatedKD = {...knowledgeDict}
        updatedKD['personal'] = {knowledge: newClipped, link: `${constants.URL}/${props.uid}/personal`, name: 'Personal Module'}
        browser.storage.local.set({"knowledge": updatedKD}).then(() => {
            return new Promise((resolve, reject) => {
                resolve(null)
            })
        });
        setManual('')
        setAdd(!isAdd)
    }
  }

  useEffect(() => {
    browser.storage.local.get(["knowledge"]).then((result) => {
        // console.log(result)
        // if ("clipped" in result) {
        //   setClipped(result['clipped'])
        //   browser.storage.local.remove("clipped");
        // }
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
        <ShareClipping clipping={clippedKnowledge[0]}/>
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
            <Grid>
                {
                    clippedKnowledge.length > 0 ? (
                        clippedKnowledge.map((clip, idx) => {
                            return (
                                <Paper sx={{p:1, mb: 1}}>
                                    <Grid container spacing={1} justifyContent="space-around" alignItems="center">
                                        <Grid size={11}>
                                            <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
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
       
       
