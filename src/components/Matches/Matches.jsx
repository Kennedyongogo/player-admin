import { useCallback, useEffect, useRef, useState } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  InputAdornment,
  Button,
  LinearProgress,
  Tooltip,
  Divider,
  alpha,
} from "@mui/material";
import {
  Search,
  Visibility,
  ContentCopy,
  Refresh,
  Groups,
  Link as LinkIcon,
  Public,
  Lock,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { fetchMatches } from "../../api";
import ResponsiveTablePagination from "../ResponsiveTablePagination";

const TABS = [
  { value: "all", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLOR = {
  waiting: "info",
  active: "success",
  completed: "default",
  cancelled: "error",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatMoney(value) {
  return `KSh ${parseFloat(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function getPlayers(match) {
  return match.MatchPlayers || match.MatchPlayer || [];
}

function DetailRow({ label, children }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ py: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: "right", flex: 1 }}>{children}</Box>
    </Stack>
  );
}

function MatchViewDialog({ open, match, onClose }) {
  if (!match) return null;

  const players = getPlayers(match);
  const fillPct = Math.min(100, (match.currentPlayers / match.requiredPlayers) * 100);

  const copyInvite = () => {
    if (!match.inviteLinkCode) return;
    navigator.clipboard.writeText(match.inviteLinkCode);
    Swal.fire({
      icon: "success",
      title: "Copied",
      text: "Invite code copied to clipboard",
      timer: 1500,
      showConfirmButton: false,
      background: "#0E0E16",
      color: "#FAFAFA",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ fontWeight: 800 }}>Match details</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip
              size="small"
              label={match.status}
              color={STATUS_COLOR[match.status] || "default"}
              sx={{ textTransform: "capitalize", fontWeight: 700 }}
            />
            <Chip
              size="small"
              icon={match.matchType === "private_challenge" ? <Lock /> : <Public />}
              label={match.matchType === "private_challenge" ? "Private" : "Public queue"}
              variant="outlined"
            />
            <Chip size="small" label={`Entry ${formatMoney(match.entryFee)}`} variant="outlined" />
          </Stack>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              bgcolor: alpha("#8B5CF6", 0.06),
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Players
              </Typography>
              <Typography fontWeight={700}>
                {match.currentPlayers} / {match.requiredPlayers}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={fillPct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.08)",
                "& .MuiLinearProgress-bar": { bgcolor: match.status === "active" ? "#10F0A0" : "#8B5CF6" },
              }}
            />
          </Box>

          <Divider />

          <DetailRow label="Prize pool">{formatMoney(match.totalPrizePool)}</DetailRow>
          <DetailRow label="Commission (20%)">{formatMoney(match.platformCommission)}</DetailRow>
          <DetailRow label="Questions">{match.questionsCount ?? 5} · {match.timeLimitSeconds ?? 60}s</DetailRow>
          {match.inviteLinkCode && (
            <DetailRow label="Invite code">
              <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
                <Typography fontWeight={700} sx={{ fontFamily: "monospace" }}>
                  {match.inviteLinkCode}
                </Typography>
                <IconButton size="small" onClick={copyInvite}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Stack>
            </DetailRow>
          )}
          {match.creator && (
            <DetailRow label="Host">
              <Typography fontWeight={600}>{match.creator.nickname}</Typography>
            </DetailRow>
          )}
          <DetailRow label="Started">{formatDate(match.startTime)}</DetailRow>
          <DetailRow label="Ended">{formatDate(match.endTime)}</DetailRow>
          <DetailRow label="Created">{formatDate(match.createdAt)}</DetailRow>
          <DetailRow label="Prizes paid">
            <Chip
              size="small"
              label={match.prizesDistributed ? "Yes" : "No"}
              color={match.prizesDistributed ? "success" : "default"}
            />
          </DetailRow>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" fontWeight={700}>
            Players ({players.length})
          </Typography>

          {players.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No players yet
            </Typography>
          ) : (
            <TableContainer sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell align="center">Rank</TableCell>
                    <TableCell align="right">Prize</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{p.User?.nickname || "—"}</TableCell>
                      <TableCell>
                        <Chip size="small" label={p.status} sx={{ textTransform: "capitalize" }} />
                      </TableCell>
                      <TableCell align="center">{p.score ?? 0}</TableCell>
                      <TableCell align="center">{p.rank ?? "—"}</TableCell>
                      <TableCell align="right">{formatMoney(p.prizeWon)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Matches() {
  const [tab, setTab] = useState("all");
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, active: 0, completed: 0, cancelled: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedOnce = useRef(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [tab, debouncedSearch]);

  const loadMatches = useCallback(
    ({ silent = false } = {}) => {
      const background = silent || hasLoadedOnce.current;
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      if (!background) setError("");

      fetchMatches({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch,
        status: tab,
      })
        .then((res) => {
          const nextMatches = res.data.matches || [];
          setMatches(nextMatches);
          setPagination(res.data.pagination || { page: 1, limit: rowsPerPage, total: 0, totalPages: 0 });
          setStats(res.data.stats || { total: 0, waiting: 0, active: 0, completed: 0, cancelled: 0 });
          setViewTarget((current) => {
            if (!current) return current;
            return nextMatches.find((m) => m.id === current.id) || current;
          });
          hasLoadedOnce.current = true;
        })
        .catch((err) => setError(err.message || "Failed to load matches"))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [page, rowsPerPage, debouncedSearch, tab]
  );

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    if (!autoRefresh || (tab !== "waiting" && tab !== "active" && tab !== "all")) return undefined;
    const id = setInterval(() => loadMatches({ silent: true }), 15000);
    return () => clearInterval(id);
  }, [autoRefresh, tab, loadMatches]);

  const openView = (match) => {
    setViewTarget(match);
    setViewOpen(true);
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Matches
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip size="small" label={`${stats.waiting} waiting`} color="info" variant="outlined" />
            <Chip size="small" label={`${stats.active} live`} color="success" variant="outlined" />
            <Chip size="small" label={`${stats.completed} done`} variant="outlined" />
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title={autoRefresh ? "Auto-refresh on (15s)" : "Auto-refresh off"}>
            <Button
              size="small"
              variant={autoRefresh ? "contained" : "outlined"}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              Live
            </Button>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => loadMatches({ silent: true })}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

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
        type="search"
        name="chapaquiz-matches-filter"
        placeholder="Search invite code or match ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 480 }}
        autoComplete="off"
        inputProps={{ autoComplete: "off", role: "search", "data-lpignore": "true" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
        {refreshing && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              borderRadius: "12px 12px 0 0",
              height: 2,
              zIndex: 1,
              "& .MuiLinearProgress-bar": { bgcolor: "#8B5CF6" },
            }}
          />
        )}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#8B5CF6" }} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}>#</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Entry</TableCell>
                  <TableCell>Players</TableCell>
                  <TableCell>Prize pool</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Invite</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No matches found
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((m, index) => {
                    const fillPct = Math.min(100, (m.currentPlayers / m.requiredPlayers) * 100);
                    const isPrivate = m.matchType === "private_challenge";
                    return (
                      <TableRow key={m.id} hover>
                        <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                          {page * rowsPerPage + index + 1}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={isPrivate ? <Lock sx={{ fontSize: 14 }} /> : <Public sx={{ fontSize: 14 }} />}
                            label={isPrivate ? "Private" : "Public"}
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatMoney(m.entryFee)}</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Stack spacing={0.5}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Groups sx={{ fontSize: 16, color: "text.secondary" }} />
                              <Typography variant="body2" fontWeight={600}>
                                {m.currentPlayers}/{m.requiredPlayers}
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={fillPct}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                bgcolor: "rgba(255,255,255,0.08)",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor: m.status === "active" ? "#10F0A0" : "#8B5CF6",
                                },
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>{formatMoney(m.totalPrizePool)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={m.status}
                            color={STATUS_COLOR[m.status] || "default"}
                            sx={{ textTransform: "capitalize", fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          {m.inviteLinkCode ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <LinkIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                {m.inviteLinkCode}
                              </Typography>
                            </Stack>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(m.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={() => openView(m)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
          />
        )}
      </Card>

      <MatchViewDialog
        open={viewOpen}
        match={viewTarget}
        onClose={() => {
          setViewOpen(false);
          setViewTarget(null);
        }}
      />
    </Box>
  );
}
