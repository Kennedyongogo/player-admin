import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { createUser, getUsers, updateUser } from "../api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

const ROLES = ["player", "host", "tournament_admin", "superadmin"];
const EMPTY_FORM = { email: "", username: "", password: "", role: "player" };

export default function UsersPage() {
  const { isSuperAdmin, isTournamentAdmin } = useAuth();
  const canCreate = isSuperAdmin || isTournamentAdmin;
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () =>
    getUsers({ search, role, limit: 100 })
      .then((res) => setItems(res.data?.users || []))
      .catch((err) => showError("Failed to load users", err.message));

  useEffect(() => {
    load();
  }, [search, role]);

  const onCreate = async () => {
    if (!form.email.trim() || !form.username.trim() || !form.password.trim()) {
      showError("Missing fields", "Email, username, and password are required");
      return;
    }
    if (form.role === "superadmin" && !isSuperAdmin) {
      showError("Not allowed", "Only superadmin can create superadmin accounts");
      return;
    }
    try {
      await createUser(form);
      showSuccess("User created");
      setOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const setUserRole = async (id, nextRole) => {
    try {
      await updateUser(id, { role: nextRole });
      showSuccess("Role updated");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const toggleActive = async (u) => {
    if (u.isActive) {
      const ok = await showConfirm("Disable user?", `Disable ${u.username}?`);
      if (!ok) return;
    }
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      showSuccess(u.isActive ? "User disabled" : "User enabled");
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" sx={{ mb: 0.5 }} spacing={2}>
        <Typography variant="h4">Users</Typography>
        {canCreate && (
          <Button variant="contained" onClick={() => setOpen(true)}>
            + Create user
          </Button>
        )}
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage roles and account status
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: "auto", bgcolor: colors.surface }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select size="small" value={u.role} onChange={(e) => setUserRole(u.id, e.target.value)}>
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>{u.isActive ? "Yes" : "No"}</TableCell>
                <TableCell align="right">
                  <Button size="small" color={u.isActive ? "warning" : "success"} onClick={() => toggleActive(u)}>
                    {u.isActive ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Username"
              fullWidth
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.filter((r) => r !== "superadmin" || isSuperAdmin).map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
