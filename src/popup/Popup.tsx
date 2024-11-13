import React, { useState, useEffect } from "react";
import { Selector } from './components/Selector';
import { Box } from "@mui/material";
import { Footer } from './components/Footer';
// import { Header } from './components/Header';

export const Popup = () => {
  const [modules, setModules] = useState([])
  const [allModules, setAllModules] = useState([])


  const filterItems = (event) => {
    const searchTerm = event.target.value
    const filteredModules = allModules.filter(module =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setModules(filteredModules)
  }

  document.addEventListener('DOMContentLoaded', () => {
    browser.runtime.sendMessage({ type: 'popup_open' })
    .then(response => {
      console.log('Response in popup', response)
      if (response.success) {
        setModules(response.response)
        setAllModules(response.response)
      }
    })
  });

  return (
    <Box sx={{width: "100%"}}>
      <Selector 
        modules={modules}
        filterItems={filterItems}
      />
      <Footer/>
    </Box>
  )
};