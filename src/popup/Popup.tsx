import React, { useState, useEffect } from "react";
import { Selector } from './components/Selector';
import Box from "@mui/material/Box";
import CircularProgress from '@mui/material/CircularProgress';
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid2';
import { Footer } from './components/Footer';
import { Login } from "./components/Login";
import { ThemeProvider } from "@mui/material";
import theme from "./theme";
// import { Header } from './components/Header';

export const Popup = () => {
  const [modules, setModules] = useState([])
  const [communities, setCommunities] = useState([])
  const [allModules, setAllModules] = useState([])
  const [userChecked, setChecked] = useState({})
  const [user, setUser] = useState("")
  const [isLoading, setLoading] = useState(true)
  const filterItems = (event) => {
    const searchTerm = event.target.value
    const filteredModules = allModules.filter(module =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setModules(filteredModules)
  }

  document.addEventListener('DOMContentLoaded', async(event) => {
    const syncData = await browser.storage.sync.get("uid")
    const uid = syncData?.uid
    setUser(uid);
    // setModules([]);
    // setAllModules([]);
    // setLoading(false);
    if (uid) {
      browser.runtime.sendMessage({ type: 'popup_open', data: {user: uid} })
      .then(response => {
        console.log('Response in popup', response, response.checked)
        if (response.success) {
          setModules(response.response.modules)
          setAllModules(response.response.modules)
          if (response.response.checked) {
            setChecked(response.response.checked)
          }
        }
        // if (response.communities.success) {
        //   setCommunities(response.communities.response)
        // }
        setUser(uid)
        setLoading(false)
      })
    } else {
      console.log("No user")
      setLoading(false)
    }
  });

  const reloadModules = () => {
    console.log('Reload')
    browser.runtime.sendMessage({ type: 'popup_open', data: {user: user} })
      .then(response => {
        console.log('Response in popup', response, response.checked)
        if (response.modules.success) {
          setModules(response.modules.response)
          setAllModules(response.modules.response)
        }
      })
    }

  return (
    <ThemeProvider theme={theme}>
      {
        isLoading ? (
          <Box>
            <Grid sx={{height: '100vh'}} container justifyContent="center" alignItems="center" direction="column">
              <Grid>
                <CircularProgress color="secondary" />
              </Grid>
              <Grid>
                <Typography variant="h5">
                  Loading
                </Typography>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{width: "100%"}}>
        {
          user ? (
            <Box>
              <Selector 
                user={user}
                modules={modules}
                communities={communities}
                checked={userChecked}
                filterItems={filterItems}
                reloadModules={reloadModules}
              />
              {/* <Footer/> */}
            </Box>
          ) : (
            <Box>
              <Login/>
            </Box>
          )
        }
        {console.log('in popup', userChecked)}
      </Box>
        )
      }
    </ThemeProvider>
  )
};