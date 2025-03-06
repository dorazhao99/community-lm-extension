import React, { useState, useEffect } from "react";
import { Selector } from './components/Selector';
import Box from "@mui/material/Box";
import { Button, Divider, Alert, CircularProgress, Paper } from "@mui/material";
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import constants from "~/services/constants";
// import { Header } from './components/Header';

export const Clipper = (props) => {
  const [modules, setModules] = useState([])
  const [knowledgeDict, setKD] = useState({})
  const [clippedKnowledge, setClippedKnowledge] = useState([])
  const [user, setUser] = useState("")
  const [selected, setSelected] = useState('personal');
  const [isSuccess, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [link, setLink] = useState({isPersonal: true, link: ''})
  const [isLoading, setLoading] = useState(false)

//   browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     console.log(message)
//     if (message.type === 'clipped') {
//         browser.storage.local.get(["clipped"]).then((result) => {
//             if ("clipped" in result) {
//               setClipped(result['clipped'])
//               browser.storage.local.remove("clipped");
//             }
//         })
//     }
//   });

  const handleChange = (event: SelectChangeEvent) => {
    setError('')
    setSuccess('')
    setSelected(event.target.value);
  };

  const openSignup = () => {
        browser.runtime.sendMessage({
            type: "sign_up",
        })
    }

  function saveContent() {
    if (selected !== 'personal' && props.isAnon) {
        setSuccess(false)
        setError('To contribute to an imported module, you must authenticate your account.')
    } else {
        // Save to Working Memory
        if (selected === 'personal') {
            const newClipped = [...clippedKnowledge, props?.clipped]
            setClippedKnowledge(newClipped)
            let updatedKD = {...knowledgeDict}
            updatedKD['personal'] = {knowledge: newClipped, link: `${constants.URL}/${props.uid}/personal`, name: 'Personal Module'}
            browser.storage.local.set({"knowledge": updatedKD}).then(() => {
                setSuccess(true)
                setLink({isPersonal: true})
                return new Promise((resolve, reject) => {
                    resolve(null)
                })
            })
            .catch(error => {
                setSuccess(false)
                setError(error)
            })
            
        } else {
            setLoading(true)
            browser.runtime.sendMessage({type: "add_content", data: {user: user, content: props?.clipped, module: selected}})
            .then(response => {
            if (response?.success) {
                setSuccess(true)
                setLink({link: response.link, isPersonal: false})
                setLoading(false)
            } else {
                setSuccess(false)
                setError(response?.error)
                setLoading(false)
            }
            })
        }
    }
  }
  
  function clearClipped() {
    setClippedKnowledge([])
    let updatedKD = {...knowledgeDict}
    if ('personal' in updatedKD) {
        delete updatedKD['personal']
        browser.storage.local.set({"knowledge": updatedKD}).then(() => {
                return new Promise((resolve, reject) => {
                  resolve(null)
                })
        });
    }
  }

  function openLink() {
    if (link.isPersonal) {
        props.changeView('personal')
    } else {
        browser.tabs.update({
            url: link
          })
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

  const ClipTextInterface = () => {
    return (
        <Grid container direction="column" spacing={1} alignItems="center">
            {/* {
                props.isAnon ? (
                    <Grid>
                        <Alert severity="info">
                            Guest users can only add to their personal modules. If you want to contribute to another module, you must create an account.
                            <Button onClick={openSignup}>
                                Join now
                            </Button>
                        </Alert>
                    </Grid>
                ) : null
            } */}
            <Grid size={11} sx={{m: 1}}>
                <Typography variant="body1">
                <strong>
                    CLIPPED TEXT
                </strong>
                </Typography>
                <Box sx={{backgroundColor: "#f2f2f2", p: 1, maxHeight: "150px", overflowY: "scroll"}}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                    {props.clipped}
                </Typography>
                </Box>
            </Grid>
            <Grid size={12}>
                <Divider/>
            </Grid>
            <Grid size={12}>
                <Grid container alignItems="center" justifyContent="space-around" spacing={1}>
                    <Grid size={2}>
                        <Typography variant="body2">
                        Add to
                        </Typography>
                    </Grid>
                    <Grid size={7}>
                        <FormControl sx={{ m: 1, width: "200px"}} size="small">
                        <Select
                            labelId="demo-select-small-label"
                            id="demo-select-small"
                            value={selected}
                            fullWidth
                            onChange={handleChange}
                        >
                            <MenuItem sx={{display: 'block'}} value={'personal'}>
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                    Personal Module
                                </div>
                            </MenuItem>
                            {
                                props.modules.map((module) => {
                                    if (module) {
                                        return (
                                            <MenuItem sx={{display: 'block'}} value={module.id}>
                                                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {module.name}
                                                </div>
                                            </MenuItem>
                                        )
                                    }
                                })
                            }
                        </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Grid>
            <Grid size={12}>
                <Divider/>
            </Grid>
            <Grid sx={{pl:1, pb: 1}} size={6}>
                {
                isLoading ? (
                    <Button fullWidth size="small" variant="contained" onClick={saveContent} disabled>
                    <CircularProgress size={20}/>
                    </Button>
                ) : (
                    <Button fullWidth size="small" variant="contained" onClick={saveContent}>
                    Save Content
                    </Button>
                )
                }
            </Grid>
            {
                isSuccess === true ? (
                <Grid sx={{pl:1, pb: 1}}  size={6}>
                    <Button fullWidth variant="outlined" size="small" onClick={openLink}>
                    View updated module 
                    </Button>
                </Grid> 
                ) : isSuccess === false ? (
                <Grid sx={{pl:1, pb: 1}}  size={8}>
                    <Alert severity="error">
                    {error}
                    </Alert>
                </Grid>
                ) : null
            }
            <Divider/>
        </Grid>
    )
  }

  return (
    <Box sx={{p: 2}}>
        <ClipTextInterface/>
    </Box>
  )
};