import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  People,
  Quiz,
  SportsEsports,
  HourglassEmpty,
  AccountBalanceWallet,
  PendingActions,
} from "@mui/icons-material";
import { fetchDashboard } from "../../api";

const statCards = [
  { key: "totalUsers", label: "Players", icon: People, color: "#8B5CF6" },
  { key: "activeQuestions", label: "Active questions", icon: Quiz, color: "#10F0A0" },
  { key: "activeMatches", label: "Live matches", icon: SportsEsports, color: "#F5C518" },
  { key: "waitingMatches", label: "Waiting rooms", icon: HourglassEmpty, color: "#60A5FA" },
  { key: "pendingWithdrawals", label: "Pending withdrawals", icon: PendingActions, color: "#FF4D6A" },
  { key: "totalDeposits", label: "Total deposits (KSh)", icon: AccountBalanceWallet, color: "#A78BFA", format: "currency" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#8B5CF6" }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        ChapaQuiz platform overview
      </Typography>

      <Grid container spacing={2}>
        {statCards.map(({ key, label, icon: Icon, color, format }) => (
          <Grid key={key} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "background.paper",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {format === "currency"
                        ? parseFloat(stats[key] || 0).toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                          })
                        : stats[key] ?? 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
