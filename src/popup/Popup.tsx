import React, { useState, useEffect } from "react";
import { NavBar } from "./components/NavBar";
import { Selector } from './components/Selector';
import { Clipper } from "./components/Clipper";
import { PersonalModule } from "./components/PersonalModule";
import Box from "@mui/material/Box";
import CircularProgress from '@mui/material/CircularProgress';
import Typography from "@mui/material/Typography";
import Grid from '@mui/material/Grid2';
import { Footer } from './components/Footer';
import { Login } from "./components/Login";
import { ThemeProvider } from "@mui/material";
import theme from "./theme";
import browser from "webextension-polyfill"
// import { Header } from './components/Header';

export const Popup = () => {
  const [view, setView] = useState('personal')
  const [modules, setModules] = useState([])
  const [clipped, setClipped] = useState('')
  const [allModules, setAllModules] = useState([])
  const [userChecked, setChecked] = useState({})
  const [user, setUser] = useState("")
  const [isAnon, setAnon] = useState(true)
  const [isLoading, setLoading] = useState(false)
  const filterItems = (event) => {
    const searchTerm = event.target.value
    const filteredModules = allModules.filter(module =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setModules(filteredModules)
  }

  const handleNavBarChange = (evt) => {
      setView(evt.target.value)
  }

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'clipped') {
      setView('clipper')
      browser.storage.local.get(["clipped"]).then((result) => {
          if ("clipped" in result) {
            setClipped(result['clipped'])
            browser.storage.local.remove("clipped");
          }
      })
    }
  });

  document.addEventListener('DOMContentLoaded', async(event) => {
    const syncData = await browser.storage.sync.get(["uid", "isAnon"])
    const uid = syncData?.uid
    let anon = true 
    if (syncData?.isAnon === false) {
      anon = false
    }
    setUser(uid);
    setAnon(anon)
    // setModules([]);
    // setAllModules([]);
    if (uid) {
      browser.storage.session.get(["modules", "checked"]).then((result) => {
        let runServer = false
        if (result?.modules && result?.modules.length > 0) {
          setAllModules(result.modules)
          setModules(result.modules)
        } else {
          runServer = true 
        }
        if (result?.checked) {
          const newChecked = result.checked
          setChecked(newChecked)
        } else {
          runServer = true
        }

        if (runServer) {
          setLoading(true)
          browser.runtime.sendMessage({ type: 'popup_open', data: {user: uid} })
          .then(response => {
            if (response.success) {
              let serverModules = response.response.modules
              let serverChecked = {}
              setModules(serverModules)
              setAllModules(serverModules)
              if (response.response.checked) {
                serverChecked = response.response.checked
                setChecked(serverChecked)
              }
              browser.storage.session.set({"modules": serverModules, "checked": serverChecked})
            }
            setLoading(false)
          })
        }
      })
      browser.storage.local.get("clipped").then((result) => {
        if ("clipped" in result) {
          setView('clipper')
          setClipped(result['clipped'])
          browser.storage.local.remove("clipped");
        }
      })
    } else {
      console.error("No user")
      setLoading(false)
    }
  });

  const reloadModules = () => {
    browser.runtime.sendMessage({ type: 'popup_open', data: {user: user} })
      .then(response => {
        if (response.modules.success) {
          setModules(response.modules.response)
          setAllModules(response.modules.response)
        }
      })
    }
  
  const returnView = () => {
    if (view === 'clipper') {
      return (
        <Clipper uid={user} isAnon={isAnon} clipped={clipped} modules={modules} changeView={setView}/>
      )
    } else if (view === 'personal') {
      return (
        <PersonalModule changeView={setView} isAnon={isAnon}/>
      )
    } else {
      return (
        <Selector 
          user={user}
          modules={modules}
          communities={[]}
          checked={userChecked}
          filterItems={filterItems}
          reloadModules={reloadModules}
        />
      )
    }
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
              <NavBar view={view} handleChange={handleNavBarChange}/>
             {
                returnView()
             }
            </Box>
          ) : (
            <Box>
              <Login/>
            </Box>
          )
        }
      </Box>
        )
      }
    </ThemeProvider>
  )
};