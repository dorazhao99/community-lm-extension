import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material";
import theme from "./theme";
import browser from "webextension-polyfill"
// import { Header } from './components/Header';

export const Popup = () => {
  return (
    <ThemeProvider theme={theme}>
      <Box>
        Hello, World! 
      </Box>
    </ThemeProvider>
  )
};