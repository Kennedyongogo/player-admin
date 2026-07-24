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
import { getUsers, updateUser } from "../api";
import { colors } from "../theme";
import { showConfirm, showError, showSuccess } from "../utils/swal";

const ROLES = ["player", "host", "tournament_admin", "superadmin"];

export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const load = () =>
    getUsers({ search, role, limit: 100 })
      .then((res) => setItems(res.data?.users || []))
      .catch((err) => showError("Failed to load users", err.message));

  useEffect(() => {
    load();
  }, [search, role]);

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
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Users
      </Typography>
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
    </Box>
  );
}
