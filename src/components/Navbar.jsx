import { cloneElement } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { styled, useTheme } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Box, Typography } from "@mui/material";
import { Dashboard, PeopleAlt, Quiz, Settings, Logout, SportsEsports } from "@mui/icons-material";
import { useEffect, useState } from "react";
import Header from "./Header/Header";
import { clearAdminSession } from "../api";

const drawerWidth = 260;
const drawerCollapsedWidth = 92;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  width: drawerCollapsedWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 50%, #4C1D95 100%)",
  boxShadow: "0 4px 24px rgba(109, 40, 217, 0.35)",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  ...(!open && {
    marginLeft: drawerCollapsedWidth,
    width: `calc(100% - ${drawerCollapsedWidth}px)`,
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: open ? drawerWidth : drawerCollapsedWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const menuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  { text: "Questions", icon: <Quiz />, path: "/questions" },
  { text: "Matches", icon: <SportsEsports />, path: "/matches" },
  { text: "Users", icon: <PeopleAlt />, path: "/users" },
  { text: "Settings", icon: <Settings />, path: "/settings" },
];

function NavItem({ item, selected, open, onClick }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={onClick}
        selected={selected}
        sx={{
          borderRadius: 2,
          flexDirection: open ? "row" : "column",
          justifyContent: "center",
          alignItems: "center",
          py: open ? 1 : 1.25,
          px: open ? 2 : 0.75,
          minHeight: open ? 48 : 76,
          gap: open ? 0 : 0.5,
          "&.Mui-selected": {
            bgcolor: "rgba(139, 92, 246, 0.15)",
            "&:hover": { bgcolor: "rgba(139, 92, 246, 0.22)" },
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: open ? 40 : "auto",
            justifyContent: "center",
            m: 0,
          }}
        >
          {cloneElement(item.icon, {
            sx: { color: selected ? "primary.main" : "text.secondary", fontSize: open ? 24 : 22 },
          })}
        </ListItemIcon>
        {open ? (
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontWeight: selected ? 700 : 500,
              fontSize: "0.9rem",
            }}
          />
        ) : (
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.65rem",
              fontWeight: selected ? 700 : 500,
              color: selected ? "primary.main" : "text.secondary",
              textAlign: "center",
              lineHeight: 1.2,
              whiteSpace: "normal",
              wordBreak: "break-word",
              px: 0.25,
            }}
          >
            {item.text}
          </Typography>
        )}
      </ListItemButton>
    </ListItem>
  );
}

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [open, setOpen] = useState(() => window.innerWidth >= theme.breakpoints.values.md);

  useEffect(() => {
    const onResize = () => setOpen(window.innerWidth >= theme.breakpoints.values.md);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [theme.breakpoints.values.md]);

  const logout = () => {
    clearAdminSession();
    setUser(null);
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <Header user={user} setUser={setUser} handleDrawerOpen={() => setOpen(true)} open={open} />
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader sx={{ justifyContent: open ? "flex-end" : "center", px: open ? 1 : 0 }}>
          <IconButton onClick={() => setOpen((v) => !v)} size="small">
            {open ? (
              theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />
            ) : (
              theme.direction === "rtl" ? <ChevronLeftIcon /> : <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List sx={{ px: 0.75, pt: 1 }}>
          {menuItems.map((item) => (
            <NavItem
              key={item.text}
              item={item}
              selected={location.pathname === item.path}
              open={open}
              onClick={() => navigate(item.path)}
            />
          ))}
        </List>
        <Divider sx={{ mt: "auto" }} />
        <List sx={{ px: 0.75, pb: 1 }}>
          <NavItem
            item={{ text: "Logout", icon: <Logout /> }}
            selected={false}
            open={open}
            onClick={logout}
          />
        </List>
      </Drawer>
    </Box>
  );
}
