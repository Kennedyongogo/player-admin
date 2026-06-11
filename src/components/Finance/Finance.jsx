import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  Stack,
  InputAdornment,
  Grid,
  alpha,
} from "@mui/material";
import {
  Search,
  AccountBalanceWallet,
  South,
  North,
  EmojiEvents,
  Replay,
  SportsEsports,
  TrendingUp,
} from "@mui/icons-material";
import { fetchFinance } from "../../api";
import ResponsiveTablePagination from "../ResponsiveTablePagination";

const TABS = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "entry_fee", label: "Entry fees" },
  { value: "entry_fee_refund", label: "Refunds" },
  { value: "prize_win", label: "Prizes" },
];

const TYPE_META = {
  deposit: { label: "Deposit", color: "success", flow: "in" },
  withdrawal: { label: "Withdrawal", color: "error", flow: "out" },
  entry_fee: { label: "Entry fee", color: "warning", flow: "in" },
  entry_fee_refund: { label: "Entry refund", color: "info", flow: "out" },
  prize_win: { label: "Prize", color: "secondary", flow: "out" },
};

function formatMoney(value) {
  return `KSh ${parseFloat(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function SummaryCard({ label, value, sub, color, icon: Icon }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        height: "100%",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(color, 0.14),
              color,
              display: "flex",
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}

export default function Finance() {
  const [tab, setTab] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [tab, debouncedSearch]);

  const loadFinance = useCallback(
    ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      return fetchFinance({
        page: page + 1,
        limit: rowsPerPage,
        type: tab,
        search: debouncedSearch,
      })
        .then((res) => {
          setTransactions(res.data.transactions || []);
          setSummary(res.data.summary || null);
          setPagination(res.data.pagination || { page: 1, limit: rowsPerPage, total: 0, totalPages: 0 });
        })
        .catch((err) => setError(err.message || "Failed to load finance data"))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [page, rowsPerPage, tab, debouncedSearch]
  );

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  if (loading && !summary) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#8B5CF6" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Finance & revenue
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        All platform money flows — deposits, withdrawals, match entry fees, refunds, and prizes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {summary && (
        <>
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${alpha("#F5C518", 0.25)}`,
              background: `linear-gradient(135deg, ${alpha("#8B5CF6", 0.16)} 0%, rgba(14,14,22,0.95) 60%)`,
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <TrendingUp sx={{ color: "#F5C518" }} />
                <Typography variant="subtitle1" fontWeight={800}>
                  Platform profit
                </Typography>
                <Chip
                  size="small"
                  label={formatMoney(summary.platformCommission)}
                  sx={{ fontWeight: 800, bgcolor: alpha("#F5C518", 0.15), color: "#F5C518" }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                20% commission from completed matches. Entry fees fund prize pools; prizes are paid from those pools.
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <SummaryCard
                    label="Platform commission"
                    value={formatMoney(summary.platformCommission)}
                    sub="From completed matches"
                    color="#F5C518"
                    icon={SportsEsports}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <SummaryCard
                    label="Net entry fees"
                    value={formatMoney(summary.netEntryFees)}
                    sub={
                      summary.entryFeeRefunds > 0
                        ? `${formatMoney(summary.grossEntryFees)} gross · ${formatMoney(summary.entryFeeRefunds)} refunded`
                        : "After match leave refunds"
                    }
                    color="#8B5CF6"
                    icon={AccountBalanceWallet}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <SummaryCard
                    label="Pending withdrawals"
                    value={summary.pendingWithdrawals}
                    sub="Awaiting admin / M-Pesa"
                    color={summary.pendingWithdrawals > 0 ? "#FF4D6A" : "#60A5FA"}
                    icon={South}
                  />
                </Grid>
              </Grid>
            </Box>
          </Card>

          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                label="Total deposits"
                value={formatMoney(summary.totalDeposits)}
                sub="M-Pesa in"
                color="#10F0A0"
                icon={North}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                label="Withdrawals paid"
                value={formatMoney(summary.totalWithdrawals)}
                sub="M-Pesa out"
                color="#FF4D6A"
                icon={South}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                label="Prizes paid"
                value={formatMoney(summary.totalPrizesPaid)}
                sub="Winner wallet credits"
                color="#A78BFA"
                icon={EmojiEvents}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                label="Entry refunds"
                value={formatMoney(summary.entryFeeRefunds)}
                sub="Players who left waiting room"
                color="#60A5FA"
                icon={Replay}
              />
            </Grid>
          </Grid>
        </>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      <TextField
        fullWidth
        size="small"
        placeholder="Search player, phone, description, M-Pesa receipt…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 520 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
        {refreshing && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              bgcolor: "#8B5CF6",
              zIndex: 1,
            }}
          />
        )}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Player</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Receipt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#8B5CF6" }} />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const meta = TYPE_META[tx.type] || { label: tx.type, color: "default", flow: "in" };
                  const isIn = meta.flow === "in";
                  return (
                    <TableRow key={tx.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                        {formatDate(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {tx.User?.nickname || "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tx.User?.phone || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          fontWeight={700}
                          sx={{ color: isIn ? "#10F0A0" : "#FF8FA3" }}
                        >
                          {isIn ? "+" : "−"}
                          {formatMoney(tx.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={tx.status}
                          sx={{ textTransform: "capitalize" }}
                          color={tx.status === "completed" ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" noWrap title={tx.description}>
                          {tx.description || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {tx.mpesaReceiptNumber || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && (
          <ResponsiveTablePagination
            component="div"
            count={pagination.total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        )}
      </Card>
    </Box>
  );
}
