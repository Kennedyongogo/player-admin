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
import { Box } from "@mui/material";
import { Dashboard, PeopleAlt, Quiz, Settings, Logout } from "@mui/icons-material";
import { useEffect, useState } from "react";
import Header from "./Header/Header";
import { clearAdminSession } from "../api";

const drawerWidth = 260;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
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
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
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
  { text: "Users", icon: <PeopleAlt />, path: "/users" },
  { text: "Settings", icon: <Settings />, path: "/settings" },
];

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
        <DrawerHeader>
          <IconButton onClick={() => setOpen(false)}>
            {theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          {menuItems.map((item) => {
            const selected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={selected}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor: "rgba(139, 92, 246, 0.15)",
                      "&:hover": { bgcolor: "rgba(139, 92, 246, 0.22)" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {cloneElement(item.icon, {
                      sx: { color: selected ? "primary.main" : "text.secondary" },
                    })}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: selected ? 700 : 500,
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider sx={{ mt: "auto" }} />
        <List sx={{ px: 1, pb: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={logout} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Logout sx={{ color: "text.secondary" }} />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.9rem" }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
}
