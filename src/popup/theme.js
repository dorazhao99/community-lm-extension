import { createTheme } from '@mui/material/styles';
import './theme.css'; 

const theme = createTheme({
    typography: {
        fontFamily: [
          'Lato',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ].join(','),
    },
    palette: {
    primary: {
        main: '#7091E6', // Primary color
        contrastText: '#fff', // Text color for primary
    },
    secondary: {
        main: '#ADBBDA', // Secondary color
        contrastText: '#fff', // Text color for secondary
    },
    dark: {
        default: '#323639', 
    },
    },
    components: {
    MuiButton: {
        styleOverrides: {
        root: {
            borderRadius: '16px', // Rounded corners
            textTransform: 'none', // Disable uppercase text
        },
        },
    },
    },
});

export default theme;