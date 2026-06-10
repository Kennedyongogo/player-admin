import { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ArrowDropDown as ArrowDropDownIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import UserAccount from "./userAccount";
import { useNavigate } from "react-router-dom";
import { clearAdminSession } from "../../api";

const LoadingScreen = () => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(15, 10, 30, 0.95)",
      zIndex: 1300,
    }}
  >
    <CircularProgress sx={{ color: "#8B5CF6" }} />
  </Box>
);

export default function Header(props) {
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [toggleAccount, setToggleAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      const userData = JSON.parse(savedUser);
      setCurrentUser(userData);
      props.setUser(userData);
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (props.user) setCurrentUser(props.user);
  }, [props.user]);

  const logout = () => {
    clearAdminSession();
    props.setUser(null);
    navigate("/");
  };

  return (
    <>
      {loading && <LoadingScreen />}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          color: "#ffffff",
        }}
      >
        <IconButton
          aria-label="open drawer"
          onClick={props.handleDrawerOpen}
          edge="start"
          sx={{
            color: "#ffffff",
            mr: 2,
            ...(props.open && { display: "none" }),
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.15)" },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body1" sx={{ mr: 1, fontWeight: 600 }}>
            {currentUser?.nickname || currentUser?.phone}
          </Typography>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ color: "#ffffff", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.15)" } }}
          >
            <ArrowDropDownIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { mt: 1.5, minWidth: 200, borderRadius: 2 } }}
        >
          <MenuItem
            onClick={() => {
              setToggleAccount(true);
              setAnchorEl(null);
            }}
          >
            <AccountCircleIcon sx={{ mr: 1, color: "primary.main" }} /> Account
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/settings");
              setAnchorEl(null);
            }}
          >
            <SettingsIcon sx={{ mr: 1, color: "primary.main" }} /> Settings
          </MenuItem>
          <MenuItem onClick={logout}>
            <LogoutIcon sx={{ mr: 1, color: "primary.main" }} /> Logout
          </MenuItem>
        </Menu>

        {currentUser && (
          <UserAccount
            onClose={() => setToggleAccount(false)}
            open={toggleAccount}
            currentUser={currentUser}
          />
        )}
      </Box>
    </>
  );
}
