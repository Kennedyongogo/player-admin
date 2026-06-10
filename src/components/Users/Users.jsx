import { useCallback, useEffect, useMemo, useState } from "react";
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { Add, Edit, Delete, Search, Visibility, VisibilityOff } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  fetchUsers,
  createStaffUser,
  updateUser,
  deleteUser,
} from "../../api";
import ResponsiveTablePagination from "../ResponsiveTablePagination";

const swalTheme = {
  confirmButtonColor: "#8B5CF6",
  cancelButtonColor: "#4B5563",
  background: "#0E0E16",
  color: "#FAFAFA",
};

const alertSuccess = (title, text) =>
  Swal.fire({ icon: "success", title, text, ...swalTheme });

const alertError = (title, text) =>
  Swal.fire({ icon: "error", title, text, ...swalTheme });

const TABS = [
  { value: "all", label: "All" },
  { value: "superadmin", label: "Super Admins" },
  { value: "admin", label: "Admins" },
  { value: "player", label: "Players" },
];

const STAFF_ROLES = ["admin", "superadmin"];

function normalizePhone(input) {
  const stripped = String(input || "").trim().replace(/[\s-]+/g, "");
  if (!stripped) return "";
  if (stripped.startsWith("+")) return stripped;
  if (stripped.startsWith("0")) return `+254${stripped.slice(1)}`;
  if (stripped.startsWith("254")) return `+${stripped}`;
  if (/^\d{9}$/.test(stripped)) return `+254${stripped}`;
  return stripped;
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function roleChipColor(role) {
  if (role === "superadmin") return "secondary";
  if (role === "admin") return "primary";
  return "default";
}

function DetailRow({ label, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
        py: 1.25,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: "right", flex: 1 }}>{children}</Box>
    </Box>
  );
}

function UserViewDialog({ open, user, onClose }) {
  if (!user) return null;

  const isPlayer = user.role === "player";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>User details</DialogTitle>
      <DialogContent dividers>
        <DetailRow label="Nickname">
          <Typography fontWeight={700}>{user.nickname}</Typography>
        </DetailRow>
        <DetailRow label="Phone">
          <Typography fontWeight={600}>{user.phone}</Typography>
        </DetailRow>
        <DetailRow label="Email">
          <Typography fontWeight={600}>{user.email || "—"}</Typography>
        </DetailRow>
        <DetailRow label="Role">
          <Chip
            size="small"
            label={user.role}
            color={roleChipColor(user.role)}
            sx={{ textTransform: "capitalize", fontWeight: 700 }}
          />
        </DetailRow>
        <DetailRow label="Status">
          <Chip
            size="small"
            label={user.isActive !== false ? "Active" : "Inactive"}
            color={user.isActive !== false ? "success" : "default"}
          />
        </DetailRow>
        {!isPlayer && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {user.role === "superadmin" ? "Super admin" : "Admin"} accounts manage the
            platform (questions, matches, deposits) and do not join quiz matches or hold
            player wallets.
          </Alert>
        )}
        {isPlayer && (
          <>
            <DetailRow label="Wallet balance">
              <Typography fontWeight={600}>
                KSh {parseFloat(user.walletBalance || 0).toFixed(2)}
              </Typography>
            </DetailRow>
            <DetailRow label="Matches played">
              <Typography fontWeight={600}>{user.totalMatchesPlayed ?? 0}</Typography>
            </DetailRow>
            <DetailRow label="Total winnings">
              <Typography fontWeight={600}>
                KSh {parseFloat(user.totalWinnings || 0).toFixed(2)}
              </Typography>
            </DetailRow>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

const emptyStaffForm = {
  phone: "",
  nickname: "",
  password: "",
  email: "",
  role: "admin",
};

const emptyEditForm = {
  phone: "",
  nickname: "",
  email: "",
  password: "",
  isActive: true,
  role: "admin",
};

export default function Users() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [tab, setTab] = useState("all");
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyStaffForm);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);


  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [tab, debouncedSearch]);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError("");
    fetchUsers({
      role: tab,
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch,
    })
      .then((res) => {
        setUsers(res.data.users || []);
        setPagination(
          res.data.pagination || { page: 1, limit: rowsPerPage, total: 0, totalPages: 0 }
        );
      })
      .catch((err) => setError(err.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, [tab, page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showCreateButton = isSuperAdmin && (tab === "superadmin" || tab === "admin");

  const openCreate = () => {
    setActionError("");
    setShowCreatePassword(false);
    setCreateForm({
      ...emptyStaffForm,
      role: tab === "superadmin" ? "superadmin" : "admin",
    });
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setShowCreatePassword(false);
  };

  const openEdit = (user) => {
    setActionError("");
    setEditTarget(user);
    setEditForm({
      phone: user.phone || "",
      nickname: user.nickname || "",
      email: user.email || "",
      password: "",
      isActive: user.isActive !== false,
      role: user.role,
    });
    setEditOpen(true);
  };

  const openView = (user) => {
    setViewTarget(user);
    setViewOpen(true);
  };

  const handleCreate = async () => {
    setActionError("");
    const phone = normalizePhone(createForm.phone);
    if (!phone || !createForm.nickname || !createForm.password) {
      setActionError("Phone, nickname, and password are required.");
      return;
    }

    const nickname = createForm.nickname.trim();
    const role = createForm.role;

    setSaving(true);
    try {
      await createStaffUser({
        phone,
        nickname,
        password: createForm.password,
        email: createForm.email.trim() || undefined,
        role,
      });
      closeCreate();
      loadUsers();
      await alertSuccess("User created", `${nickname} has been added as ${role}.`);
    } catch (err) {
      const message = err.message || "Failed to create user";
      setActionError(message);
      await alertError("Create failed", message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setActionError("");

    const phone = normalizePhone(editForm.phone);
    if (!phone || !editForm.nickname.trim()) {
      setActionError("Phone and nickname are required.");
      return;
    }

    const payload = {
      phone,
      nickname: editForm.nickname.trim(),
      email: editForm.email.trim() || null,
      isActive: editForm.isActive,
    };
    if (editForm.password) payload.password = editForm.password;
    if (STAFF_ROLES.includes(editTarget.role)) payload.role = editForm.role;

    setSaving(true);
    try {
      await updateUser(editTarget.id, payload);
      setEditOpen(false);
      setEditTarget(null);
      loadUsers();
      await alertSuccess("User updated", `${payload.nickname} has been saved.`);
    } catch (err) {
      const message = err.message || "Failed to update user";
      setActionError(message);
      await alertError("Update failed", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      ...swalTheme,
      title: "Delete user?",
      html: `Permanently delete <strong>${user.nickname}</strong> (${user.phone})?<br/>This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#FF4D6A",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteUser(user.id);
      loadUsers();
      await alertSuccess("User deleted", `${user.nickname} has been removed.`);
    } catch (err) {
      await alertError("Delete failed", err.message || "Failed to delete user");
    }
  };

  const renderActions = (user) => {
    const isSelf = user.id === currentUser?.id;
    const staffManageable = isSuperAdmin && STAFF_ROLES.includes(user.role);
    const playerManageable = isSuperAdmin && user.role === "player";
    const canEditDelete = staffManageable || playerManageable;

    return (
      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
        <IconButton size="small" onClick={() => openView(user)} aria-label="View user">
          <Visibility fontSize="small" />
        </IconButton>
        {canEditDelete && (
          <>
            <IconButton size="small" onClick={() => openEdit(user)} aria-label="Edit user">
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(user)}
              disabled={isSelf}
              aria-label="Delete user"
            >
              <Delete fontSize="small" />
            </IconButton>
          </>
        )}
      </Stack>
    );
  };

  const showPlayerStats = tab === "player";
  const showRoleColumn = tab === "all";
  const colCount =
    1 + 2 + (showRoleColumn ? 1 : 0) + (showPlayerStats ? 3 : 0) + 1 + 1;

  const tabDescription = {
    all: "All accounts — players compete in quizzes; admins and super admins manage the system only.",
    superadmin: "Full platform access. Super admins do not play or use player wallets.",
    admin: "Staff who run the platform (questions, matches, deposits). Admins do not play.",
    player: "Quiz competitors — entry fees, matches, scores, and prize winnings.",
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Users
          </Typography>
          <Typography color="text.secondary">
            {isSuperAdmin ? tabDescription[tab] : `${tabDescription[tab]} View only — contact a super admin to manage accounts.`}
          </Typography>
        </Box>
        {showCreateButton && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Create {tab === "superadmin" ? "Super Admin" : "Admin"}
          </Button>
        )}
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      <TextField
        fullWidth
        size="small"
        type="search"
        name="chapaquiz-users-filter"
        id="chapaquiz-users-filter"
        placeholder="Search by nickname, phone, or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 480 }}
        autoComplete="off"
        inputProps={{
          autoComplete: "off",
          autoCorrect: "off",
          autoCapitalize: "off",
          spellCheck: "false",
          "data-lpignore": "true",
          "data-form-type": "other",
          role: "search",
        }}
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

      <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
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
                  <TableCell>Nickname</TableCell>
                  <TableCell>Phone</TableCell>
                  {showRoleColumn && <TableCell>Role</TableCell>}
                  {showPlayerStats && (
                    <>
                      <TableCell>Wallet (KSh)</TableCell>
                      <TableCell>Matches</TableCell>
                      <TableCell>Winnings (KSh)</TableCell>
                    </>
                  )}
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u, index) => (
                    <TableRow key={u.id} hover>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{u.nickname}</TableCell>
                      <TableCell>{u.phone}</TableCell>
                      {showRoleColumn && (
                        <TableCell>
                          <Chip
                            size="small"
                            label={u.role}
                            color={roleChipColor(u.role)}
                            sx={{ textTransform: "capitalize" }}
                          />
                        </TableCell>
                      )}
                      {showPlayerStats && (
                        <>
                          <TableCell>{parseFloat(u.walletBalance || 0).toFixed(2)}</TableCell>
                          <TableCell>{u.totalMatchesPlayed ?? 0}</TableCell>
                          <TableCell>{parseFloat(u.totalWinnings || 0).toFixed(2)}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <Chip
                          size="small"
                          label={u.isActive !== false ? "Active" : "Inactive"}
                          color={u.isActive !== false ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">{renderActions(u)}</TableCell>
                    </TableRow>
                  ))
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

      <Dialog open={createOpen} onClose={() => !saving && closeCreate()} fullWidth maxWidth="sm">
        <DialogTitle>
          Create {createForm.role === "superadmin" ? "Super Admin" : "Admin"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {actionError && <Alert severity="error">{actionError}</Alert>}
            <TextField
              label="Phone"
              placeholder="+254712345678"
              value={createForm.phone}
              onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Nickname"
              value={createForm.nickname}
              onChange={(e) => setCreateForm((f) => ({ ...f, nickname: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email (optional)"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Password"
              type={showCreatePassword ? "text" : "password"}
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              fullWidth
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowCreatePassword((v) => !v)}
                      edge="end"
                      aria-label={showCreatePassword ? "Hide password" : "Show password"}
                      sx={{ color: "text.secondary" }}
                    >
                      {showCreatePassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Role"
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
              fullWidth
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="superadmin">Super Admin</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCreate} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit {editTarget?.nickname}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {actionError && <Alert severity="error">{actionError}</Alert>}
            <TextField
              label="Phone"
              placeholder="+254712345678"
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Nickname"
              value={editForm.nickname}
              onChange={(e) => setEditForm((f) => ({ ...f, nickname: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="New password (leave blank to keep)"
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              fullWidth
            />
            {editTarget && STAFF_ROLES.includes(editTarget.role) && (
              <TextField
                select
                label="Role"
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                fullWidth
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
              </TextField>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label="Active account"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <UserViewDialog
        open={viewOpen}
        user={viewTarget}
        onClose={() => {
          setViewOpen(false);
          setViewTarget(null);
        }}
      />

    </Box>
  );
}
