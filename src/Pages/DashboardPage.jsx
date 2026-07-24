import { useEffect, useState } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import { Link as RouterLink } from "react-router-dom";
import { getDashboard } from "../api";
import StatusBadge from "../components/StatusBadge";
import { colors } from "../theme";
import { showError } from "../utils/swal";

const KPI = [
  { key: "totalPlayers", label: "Players", to: "/users", icon: PeopleOutlinedIcon, accent: colors.primaryLight },
  { key: "totalTeams", label: "Teams", to: "/teams", icon: GroupsOutlinedIcon, accent: colors.cyan },
  { key: "activeTournaments", label: "Active tournaments", to: "/tournaments", icon: EmojiEventsOutlinedIcon, accent: colors.warning },
  { key: "pendingRegistrations", label: "Pending regs", to: "/registrations", icon: HowToRegOutlinedIcon, accent: colors.accent },
  { key: "liveLobbies", label: "Live lobbies", to: "/lobbies", icon: MeetingRoomOutlinedIcon, accent: colors.danger },
  { key: "activeSponsors", label: "Sponsors", to: "/sponsors", icon: CampaignOutlinedIcon, accent: colors.success },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => showError("Failed to load dashboard", err.message));
  }, []);

  const kpis = data?.kpis || {};

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        Live platform overview
      </Typography>

      {/* Edge-to-edge: 6-up on large, 2-per-row on small */}
      <Box
        sx={{
          mx: { xs: -2, md: -3 },
          mb: 3,
          px: { xs: 1.5, md: 2 },
          py: { xs: 1.5, md: 2 },
          bgcolor: colors.surface,
          borderTop: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
          backgroundImage: `
            linear-gradient(180deg, rgba(124,58,237,0.1), transparent 70%),
            linear-gradient(90deg, rgba(0,194,255,0.05), transparent 40%)
          `,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: "repeat(6, 1fr)",
            },
            gap: { xs: 1.5, md: 1.5 },
            width: "100%",
          }}
        >
          {KPI.map((item) => {
            const Icon = item.icon;
            const value = kpis[item.key] ?? "—";

            return (
              <Box
                key={item.key}
                component={RouterLink}
                to={item.to}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  px: { xs: 1.5, md: 1.75 },
                  py: { xs: 1.75, md: 2 },
                  minHeight: { xs: 92, md: 100 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 1,
                  borderRadius: 2.5,
                  border: `1px solid ${colors.border}`,
                  bgcolor: colors.elevated,
                  transition: "background-color 0.2s ease, border-color 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(124,58,237,0.14)",
                    borderColor: "rgba(124,58,237,0.45)",
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.75}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      fontSize: { xs: "0.6rem", md: "0.65rem" },
                      lineHeight: 1.2,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: 1.25,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(255,255,255,0.04)",
                      color: item.accent,
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 15 }} />
                  </Box>
                </Stack>
                <Typography
                  sx={{
                    fontFamily: "Orbitron, sans-serif",
                    fontWeight: 800,
                    fontSize: { xs: "1.5rem", md: "1.65rem" },
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    background: `linear-gradient(180deg, #fff 30%, ${item.accent})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {value}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Pending registrations</Typography>
            <Typography component={RouterLink} to="/registrations" color="primary.light" sx={{ textDecoration: "none" }}>
              Review all
            </Typography>
          </Stack>
          <Stack spacing={1}>
            {(data?.recentRegistrations || []).length === 0 && (
              <Typography color="text.secondary">No pending registrations.</Typography>
            )}
            {(data?.recentRegistrations || []).map((r) => (
              <Box
                key={r.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${colors.border}`,
                  bgcolor: colors.elevated,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700}>{r.Team?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {r.Tournament?.name}
                  </Typography>
                </Box>
                <StatusBadge status={r.status} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
