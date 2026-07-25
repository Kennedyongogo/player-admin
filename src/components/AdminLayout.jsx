import { useState } from "react";
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import EmojiEventsIcon from "@mui/icons-material/EmojiEventsOutlined";
import HowToRegIcon from "@mui/icons-material/HowToRegOutlined";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoomOutlined";
import ScoreboardIcon from "@mui/icons-material/ScoreboardOutlined";
import LeaderboardIcon from "@mui/icons-material/LeaderboardOutlined";
import GroupsIcon from "@mui/icons-material/GroupsOutlined";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import CampaignIcon from "@mui/icons-material/CampaignOutlined";
import ArticleIcon from "@mui/icons-material/ArticleOutlined";
import LiveTvIcon from "@mui/icons-material/LiveTvOutlined";
import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import AccountTreeIcon from "@mui/icons-material/AccountTreeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import BrandLogo from "./BrandLogo";

const WIDTH = 268;

const ALL_ROLES = ["superadmin", "tournament_admin", "host"];
const STAFF_ONLY = ["superadmin", "tournament_admin"];

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon />, roles: ALL_ROLES },
  { to: "/tournaments", label: "Tournaments", icon: <EmojiEventsIcon />, roles: STAFF_ONLY },
  { to: "/registrations", label: "Registrations", icon: <HowToRegIcon />, roles: ALL_ROLES },
  { to: "/lobbies", label: "Lobbies", icon: <MeetingRoomIcon />, roles: ALL_ROLES },
  { to: "/scores", label: "Live Scores", icon: <ScoreboardIcon />, roles: ALL_ROLES },
  { to: "/leaderboards", label: "Leaderboards", icon: <LeaderboardIcon />, roles: STAFF_ONLY },
  { to: "/brackets", label: "Brackets", icon: <AccountTreeIcon />, roles: STAFF_ONLY },
  { to: "/teams", label: "Teams", icon: <GroupsIcon />, roles: STAFF_ONLY },
  { to: "/users", label: "Users", icon: <PeopleIcon />, roles: STAFF_ONLY },
  { to: "/sponsors", label: "Sponsors", icon: <CampaignIcon />, roles: STAFF_ONLY },
  { to: "/news", label: "News", icon: <ArticleIcon />, roles: STAFF_ONLY },
  { to: "/streams", label: "Streams", icon: <LiveTvIcon />, roles: STAFF_ONLY },
  { to: "/reports", label: "Reports", icon: <AssessmentIcon />, roles: STAFF_ONLY },
  { to: "/settings", label: "Settings", icon: <SettingsIcon />, roles: STAFF_ONLY },
];

function SideNav({ onNavigate }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const nav = NAV.filter((item) => item.roles.includes(user?.role));

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: colors.surface }}>
      <Box sx={{ px: 2, py: 2.5 }}>
        <BrandLogo variant="nav" height={48} to="/dashboard" />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, pl: 0.5 }}>
          Admin Portal
        </Typography>
      </Box>
      <Divider sx={{ borderColor: colors.border }} />
      <List sx={{ flex: 1, px: 1, py: 1, overflow: "auto" }}>
        {nav.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              mb: 0.25,
              "&.active": {
                bgcolor: "rgba(124,58,237,0.18)",
                color: colors.primaryLight,
                "& .MuiListItemIcon-root": { color: colors.primaryLight },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 13.5 }} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ borderColor: colors.border }} />
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2 }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
          {(user?.username || "A").slice(0, 1).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap fontWeight={700} fontSize={14}>
            {user?.username}
          </Typography>
          <Typography noWrap variant="caption" color="text.secondary">
            {user?.role?.replace("_", " ")}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => {
            logoutUser();
            navigate("/login");
          }}
        >
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}

export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", bgcolor: "background.default" }}>
      {!isMobile && (
        <Box
          component="aside"
          sx={{
            width: WIDTH,
            flexShrink: 0,
            borderRight: `1px solid ${colors.border}`,
            position: "sticky",
            top: 0,
            height: "100dvh",
          }}
        >
          <SideNav />
        </Box>
      )}
      <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: WIDTH } }}>
        <SideNav onNavigate={() => setOpen(false)} />
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 8,
            px: { xs: 2, md: 3 },
            py: 1.5,
            borderBottom: `1px solid ${colors.border}`,
            bgcolor: "rgba(11,15,26,0.92)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {isMobile && (
            <IconButton onClick={() => setOpen(true)} color="inherit">
              <MenuIcon />
            </IconButton>
          )}
          <Typography fontWeight={700} sx={{ flex: 1 }}>
            Battlegrounds HQ Admin
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, width: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
