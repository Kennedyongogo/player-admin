import { useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getDashboard } from "../api";
import StatusBadge from "../components/StatusBadge";
import { colors } from "../theme";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const kpis = data?.kpis || {};

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Live platform overview
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          ["Players", kpis.totalPlayers ?? "—"],
          ["Teams", kpis.totalTeams ?? "—"],
          ["Active tournaments", kpis.activeTournaments ?? "—"],
          ["Pending regs", kpis.pendingRegistrations ?? "—"],
          ["Live lobbies", kpis.liveLobbies ?? "—"],
          ["Sponsors", kpis.activeSponsors ?? "—"],
        ].map(([label, value]) => (
          <Grid item xs={6} md={4} lg={2} key={label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography sx={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "1.4rem" }}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
