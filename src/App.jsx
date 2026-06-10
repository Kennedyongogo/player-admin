import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import LoginPage from "./components/LoginPage";
import PageRoutes from "./components/PageRoutes";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/*" element={<PageRoutes />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
