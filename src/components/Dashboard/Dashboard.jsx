import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Button,
  alpha,
} from "@mui/material";
import {
  People,
  PersonAdd,
  Quiz,
  SportsEsports,
  HourglassEmpty,
  AccountBalanceWallet,
  PendingActions,
  EmojiEvents,
  TrendingUp,
  Receipt,
  Settings,
  Groups,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { fetchDashboard } from "../../api";

function formatMoney(value) {
  return parseFloat(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function StatCard({ label, value, sub, icon: Icon, color, href }) {
  const content = (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "background.paper",
        height: "100%",
        transition: "border-color 0.2s",
        ...(href ? { "&:hover": { borderColor: alpha(color, 0.4) } } : {}),
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: alpha(color, 0.14),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              flexShrink: 0,
            }}
          >
            <Icon />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.25 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Box component={RouterLink} to={href} sx={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
        {content}
      </Box>
    );
  }

  return content;
}

function Section({ title, description, children }) {
  return (
    <Box sx={{ mb: 3.5 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 0.25 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {!description && <Box sx={{ mb: 2 }} />}
      {children}
    </Box>
  );
}

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

  const { players, questions, matches, finance, config } = stats;
  const liveTotal = (matches?.active || 0) + (matches?.waiting || 0);

  return (
    <Box sx={{ pb: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            ChapaQuiz platform health — players, matches, and money flow
          </Typography>
        </Box>
        <Chip
          icon={<TrendingUp sx={{ fontSize: "16px !important" }} />}
          label={`${liveTotal} live lobby${liveTotal === 1 ? "" : "ies"}`}
          sx={{
            fontWeight: 700,
            bgcolor: alpha("#10F0A0", 0.12),
            color: "#10F0A0",
            border: `1px solid ${alpha("#10F0A0", 0.3)}`,
          }}
        />
      </Stack>

      {finance.pendingWithdrawals > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/users">
              Review
            </Button>
          }
        >
          {finance.pendingWithdrawals} withdrawal{finance.pendingWithdrawals === 1 ? "" : "s"} need attention
        </Alert>
      )}

      <Card
        sx={{
          mb: 3.5,
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.08)",
          background: `linear-gradient(135deg, ${alpha("#8B5CF6", 0.18)} 0%, rgba(14,14,22,0.95) 50%, ${alpha("#F5C518", 0.08)} 100%)`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="overline" sx={{ color: "#C4B5FD", fontWeight: 700, letterSpacing: 1.2 }}>
            Revenue snapshot
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Platform commission
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#F5C518" }}>
                KSh {formatMoney(finance.platformCommission)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Total deposits
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                KSh {formatMoney(finance.totalDeposits)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Net entry fees
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                KSh {formatMoney(finance.netEntryFees)}
              </Typography>
              {finance.entryFeeRefunds > 0 && (
                <Typography variant="caption" color="text.secondary">
                  KSh {formatMoney(finance.entryFeeRefunds)} refunded
                </Typography>
              )}
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Prizes paid out
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#10F0A0" }}>
                KSh {formatMoney(finance.totalPrizesPaid)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Section title="Players" description="Registered accounts and recent sign-ups">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              label="Total players"
              value={players.total}
              sub="All registered player accounts"
              icon={People}
              color="#8B5CF6"
              href="/users"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              label="New today"
              value={players.newToday}
              sub="Signed up since midnight"
              icon={PersonAdd}
              color="#60A5FA"
              href="/users"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              label="New this week"
              value={players.newThisWeek}
              sub="Since Monday"
              icon={TrendingUp}
              color="#A78BFA"
              href="/users"
            />
          </Grid>
        </Grid>
      </Section>

      <Section title="Matches" description="Live gameplay and queue activity">
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <StatCard
              label="Live now"
              value={matches.active}
              sub="Quizzes in progress"
              icon={SportsEsports}
              color="#F5C518"
              href="/matches"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <StatCard
              label="Waiting rooms"
              value={matches.waiting}
              sub={`${matches.playersInQueue} player${matches.playersInQueue === 1 ? "" : "s"} queued`}
              icon={HourglassEmpty}
              color="#60A5FA"
              href="/matches"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <StatCard
              label="Completed"
              value={matches.completed}
              sub={`${matches.completedToday} finished today`}
              icon={CheckCircle}
              color="#10F0A0"
              href="/matches"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <StatCard
              label="Cancelled"
              value={matches.cancelled}
              sub="Left before start"
              icon={Cancel}
              color="#FF4D6A"
              href="/matches"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
            <StatCard
              label="Room size"
              value={
                config.playerLimits?.max
                  ? `${config.playerLimits?.min ?? 2}–${config.playerLimits.max}`
                  : `${config.playerLimits?.min ?? 2}+`
              }
              sub="Set by host on Play (no fixed cap)"
              icon={Groups}
              color="#C4B5FD"
            />
          </Grid>
        </Grid>
      </Section>

      <Section title="Question bank" description="Content available for matches">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatCard
              label="Active questions"
              value={questions.active}
              sub={`${questions.total} total in database`}
              icon={Quiz}
              color="#10F0A0"
              href="/questions"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatCard
              label="Pool health"
              value={questions.active >= 5 ? "Ready" : "Low"}
              sub={questions.active >= 5 ? "Enough for matches (min 5)" : "Add more questions to run matches"}
              icon={Quiz}
              color={questions.active >= 5 ? "#10F0A0" : "#FF4D6A"}
              href="/questions"
            />
          </Grid>
        </Grid>
      </Section>

      <Section title="Wallet & payouts" description="Money in, out, and pending actions">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Deposits today"
              value={`KSh ${formatMoney(finance.depositsToday)}`}
              sub={`KSh ${formatMoney(finance.totalDeposits)} all time`}
              icon={AccountBalanceWallet}
              color="#10F0A0"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Withdrawals paid"
              value={`KSh ${formatMoney(finance.totalWithdrawals)}`}
              sub="Completed M-Pesa payouts"
              icon={Receipt}
              color="#8B5CF6"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Pending withdrawals"
              value={finance.pendingWithdrawals}
              sub="Awaiting processing"
              icon={PendingActions}
              color={finance.pendingWithdrawals > 0 ? "#FF4D6A" : "#60A5FA"}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              label="Prizes distributed"
              value={`KSh ${formatMoney(finance.totalPrizesPaid)}`}
              sub="Winner wallet credits"
              icon={EmojiEvents}
              color="#F5C518"
            />
          </Grid>
        </Grid>
      </Section>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
        <Button component={RouterLink} to="/matches" variant="outlined" size="small" startIcon={<SportsEsports />}>
          View matches
        </Button>
        <Button component={RouterLink} to="/questions" variant="outlined" size="small" startIcon={<Quiz />}>
          Manage questions
        </Button>
        <Button component={RouterLink} to="/finance" variant="outlined" size="small" startIcon={<AccountBalanceWallet />}>
          Finance ledger
        </Button>
        <Button component={RouterLink} to="/settings" variant="outlined" size="small" startIcon={<Settings />}>
          Match rules
        </Button>
      </Stack>
    </Box>
  );
}
