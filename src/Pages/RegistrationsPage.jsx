import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { getTournaments, getRegistrations, reviewRegistration } from "../api";
import StatusBadge from "../components/StatusBadge";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

export default function RegistrationsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("pending");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    getTournaments({ limit: 100 })
      .then((res) => {
        const list = res.data?.tournaments || [];
        setTournaments(list);
        if (list[0]) setTournamentId(list[0].id);
      })
      .catch((err) => showError("Failed to load tournaments", err.message));
  }, []);

  const load = () => {
    if (!tournamentId) return;
    getRegistrations(tournamentId, { status, limit: 100 })
      .then((res) => setItems(res.data?.registrations || []))
      .catch((err) => showError("Failed to load registrations", err.message));
  };

  useEffect(() => {
    load();
  }, [tournamentId, status]);

  const review = async (registration, nextStatus) => {
    if (nextStatus === "rejected") {
      const reason = rejectReason || "Does not meet requirements";
      const ok = await showConfirm(
        "Reject registration?",
        `Reject ${registration.Team?.name}? Reason: ${reason}`,
        "Reject"
      );
      if (!ok) return;
    }
    try {
      await reviewRegistration(registration.id, {
        status: nextStatus,
        rejectionReason: nextStatus === "rejected" ? rejectReason || "Does not meet requirements" : undefined,
      });
      showSuccess(`Registration ${nextStatus}`);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Registrations
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Approve or reject team tournament entries
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 260 }}>
          <InputLabel>Tournament</InputLabel>
          <Select label="Tournament" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
            {tournaments.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Reject reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>

      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: "auto", bgcolor: colors.surface }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Team</TableCell>
              <TableCell>Captain / submitter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Typography fontWeight={700}>{r.Team?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.Team?.region} · logo {r.Team?.logoUrl ? "yes" : "missing"}
                  </Typography>
                </TableCell>
                <TableCell>{r.registeredBy?.username || r.registeredBy?.email}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell align="right">
                  {r.status === "pending" && (
                    <>
                      <Button size="small" color="success" onClick={() => review(r, "approved")}>
                        Approve
                      </Button>
                      <Button size="small" color="error" onClick={() => review(r, "rejected")}>
                        Reject
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No registrations for this filter.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
