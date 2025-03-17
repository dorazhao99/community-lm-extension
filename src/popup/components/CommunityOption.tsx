import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid2';

import FormControlLabel from '@mui/material/FormControlLabel';
import {Paper, Typography } from '@mui/material';
import './module.css'; 

export function CommunityOption(props) {
  const [isCheckAll, setCheckAll] = useState(0)
  const moduleIds = Object.values(props.allModules).map(item => item.id);

  const checkAll = () => {
    let values = []
    props.modules.forEach((module, _) => {
      let isChecked = props.checked[module] ? props.checked[module] : false
      values.push(isChecked)
    })
    // Check if the object is empty
    if (values.length === 0) {
        setCheckAll(0)
        return
    }
    const firstValue = values[0];
    for (let value of values) {
      if (value !== firstValue) {
          setCheckAll(2);
          return
      }
    }
    if (firstValue) {
      setCheckAll(1); 
    } else {
      setCheckAll(0);
    }
    return
  }

  useEffect(() => {
    checkAll();
}, [props.checked]);

  const validChildren = props.modules.filter(module => moduleIds.includes(module));
  
  return (
    <Box>
      {
        validChildren.length > 0 ? (
          <Paper className="module">
            <Grid container spacing={1} alignItems="center" >
                <Grid size={1}>
                  <FormControlLabel
                    control={
                    <Checkbox
                        checked={isCheckAll == 1}
                        indeterminate={isCheckAll == 2}
                        onChange={props.handleChangeAll}
                    />
                    }/>
                </Grid>
                <Grid size={10} className="info">
                    <Typography variant="body" align="left">
                        <strong>{props.name}</strong>
                        {/* <IconButton type="button" aria-label="github">
                            <GitHubIcon onClick={handleClick}/>
                        </IconButton>                              */}
                    </Typography>
                    <Typography align="left" variant="body2">
                        {props.description}
                    </Typography>
                </Grid>
            </Grid>
          </Paper>
        ) : (
          <div/>
        )
      }
    </Box>
  );
}