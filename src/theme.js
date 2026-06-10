import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8B5CF6", light: "#A78BFA", dark: "#6D28D9" },
    secondary: { main: "#F5C518", light: "#FFE566", dark: "#C9A000" },
    background: { default: "#050508", paper: "#0E0E16" },
    text: { primary: "#FAFAFA", secondary: "#8B8FA3" },
    error: { main: "#FF4D6A" },
    success: { main: "#10F0A0" },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.04em" },
    h2: { fontWeight: 800, letterSpacing: "-0.03em" },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
  breakpoints: {
    values: { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 14, padding: "13px 28px" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.03)",
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
            "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
            "&.Mui-focused": {
              backgroundColor: "rgba(255,255,255,0.05)",
              boxShadow: "0 0 0 3px rgba(139,92,246,0.2)",
              "& fieldset": { borderColor: "#8B5CF6" },
            },
          },
          "& .MuiInputLabel-root.Mui-focused": { color: "#A78BFA" },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

export default theme;
