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
  TablePagination,
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
  InputAdornment,
  Paper,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
  CheckCircle,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deactivateQuestion,
} from "../../api";

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
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const OPTIONS = ["A", "B", "C", "D"];

const emptyForm = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
};

function truncate(text, max = 80) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function OptionPicker({ letter, value, onChange, selected, onSelect, disabled }) {
  return (
    <Paper
      onClick={disabled ? undefined : onSelect}
      sx={{
        p: 1,
        borderRadius: 1.5,
        cursor: disabled ? "default" : "pointer",
        border: "2px solid",
        borderColor: selected ? "#F5C518" : "rgba(255,255,255,0.08)",
        bgcolor: selected ? alpha("#F5C518", 0.08) : "rgba(255,255,255,0.02)",
        transition: "border-color 0.2s, background 0.2s",
        "&:hover": disabled
          ? {}
          : {
              borderColor: selected ? "#F5C518" : "rgba(139,92,246,0.4)",
              bgcolor: selected ? alpha("#F5C518", 0.1) : "rgba(139,92,246,0.05)",
            },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.75rem",
            flexShrink: 0,
            bgcolor: selected ? "#F5C518" : "rgba(139,92,246,0.2)",
            color: selected ? "#050508" : "#A78BFA",
          }}
        >
          {letter}
        </Box>
        <TextField
          value={value}
          onChange={onChange}
          placeholder={`Option ${letter}`}
          fullWidth
          size="small"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          InputProps={{
            endAdornment: selected ? (
              <InputAdornment position="end">
                <CheckCircle sx={{ color: "#F5C518", fontSize: 18 }} />
              </InputAdornment>
            ) : null,
          }}
        />
      </Stack>
    </Paper>
  );
}

function QuestionFormDialog({ open, title, form, setForm, onClose, onSave, saving, error, readOnly }) {
  const setOption = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 800, py: 1.5 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2.5, px: 3, pb: 2, overflow: "visible" }}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Question"
            placeholder="e.g. What is the capital of Kenya?"
            value={form.questionText}
            onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            disabled={readOnly}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 0.5 }}
          />
          <Box>
            {!readOnly && (
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Click a row to mark the correct answer — click again to unselect
              </Typography>
            )}
            <Stack spacing={1}>
              {OPTIONS.map((letter) => (
                <OptionPicker
                  key={letter}
                  letter={letter}
                  value={form[`option${letter}`]}
                  onChange={(e) => setOption(`option${letter}`, e.target.value)}
                  selected={form.correctAnswer === letter}
                  onSelect={() =>
                    setForm((f) => ({
                      ...f,
                      correctAnswer: f.correctAnswer === letter ? "" : letter,
                    }))
                  }
                  disabled={readOnly}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      {!readOnly && (
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save question"}
          </Button>
        </DialogActions>
      )}
      {readOnly && (
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default function Questions() {
  const [tab, setTab] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [tab, debouncedSearch]);

  const loadQuestions = useCallback(() => {
    setLoading(true);
    setError("");
    fetchQuestions({
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch,
      status: tab,
    })
      .then((res) => {
        setQuestions(res.data.questions || []);
        setPagination(res.data.pagination || { page: 1, limit: rowsPerPage, total: 0, totalPages: 0 });
        setStats(res.data.stats || { total: 0, active: 0, inactive: 0 });
      })
      .catch((err) => setError(err.message || "Failed to load questions"))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, debouncedSearch, tab]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const openCreate = () => {
    setFormError("");
    setForm(emptyForm);
    setFormMode("create");
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEdit = (q) => {
    setFormError("");
    setEditTarget(q);
    setForm({
      questionText: q.questionText || "",
      optionA: q.optionA || "",
      optionB: q.optionB || "",
      optionC: q.optionC || "",
      optionD: q.optionD || "",
      correctAnswer: q.correctAnswer || "",
    });
    setFormMode("edit");
    setFormOpen(true);
  };

  const openView = (q) => {
    setViewTarget(q);
    setViewOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
    setFormError("");
  };

  const validateForm = () => {
    if (!form.questionText.trim()) return "Question text is required";
    if (!form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
      return "All four options are required";
    }
    if (!OPTIONS.includes(form.correctAnswer)) return "Click one of the options (A, B, C, or D) to mark the correct answer";
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      questionText: form.questionText.trim(),
      optionA: form.optionA.trim(),
      optionB: form.optionB.trim(),
      optionC: form.optionC.trim(),
      optionD: form.optionD.trim(),
      correctAnswer: form.correctAnswer,
    };

    setSaving(true);
    setFormError("");
    try {
      if (formMode === "create") {
        await createQuestion(payload);
        closeForm();
        loadQuestions();
        await alertSuccess("Question added", "The question is now in the pool for matches.");
      } else {
        await updateQuestion(editTarget.id, payload);
        closeForm();
        loadQuestions();
        await alertSuccess("Question updated", "Changes have been saved.");
      }
    } catch (err) {
      const message = err.message || "Failed to save question";
      setFormError(message);
      await alertError("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (q) => {
    if (!q.isActive) return;

    const result = await Swal.fire({
      ...swalTheme,
      title: "Deactivate question?",
      html: `This question will no longer appear in new matches.<br/><br/><em>${truncate(q.questionText, 120)}</em>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Deactivate",
      confirmButtonColor: "#FF4D6A",
    });

    if (!result.isConfirmed) return;

    try {
      await deactivateQuestion(q.id);
      loadQuestions();
      await alertSuccess("Question deactivated", "It will not be used in new matches.");
    } catch (err) {
      await alertError("Failed", err.message || "Could not deactivate question");
    }
  };

  const handleReactivate = async (q) => {
    try {
      await updateQuestion(q.id, { isActive: true });
      loadQuestions();
      await alertSuccess("Question reactivated", "It is back in the match pool.");
    } catch (err) {
      await alertError("Failed", err.message || "Could not reactivate question");
    }
  };

  const getCorrectLabel = (q) => {
    const key = `option${q.correctAnswer}`;
    return `${q.correctAnswer}: ${truncate(q[key], 40)}`;
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
            Questions
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip size="small" label={`${stats.total} total`} variant="outlined" />
            <Chip size="small" label={`${stats.active} active`} color="success" variant="outlined" />
            <Chip size="small" label={`${stats.inactive} inactive`} variant="outlined" />
          </Stack>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Add question
        </Button>
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
        name="chapaquiz-questions-filter"
        id="chapaquiz-questions-filter"
        placeholder="Search question text or options…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 480 }}
        autoComplete="off"
        inputProps={{
          autoComplete: "off",
          role: "search",
          "data-lpignore": "true",
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
                  <TableCell>Question</TableCell>
                  <TableCell>Correct answer</TableCell>
                  <TableCell>Used</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created by</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No questions found
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((q, index) => (
                    <TableRow key={q.id} hover sx={{ opacity: q.isActive ? 1 : 0.65 }}>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{truncate(q.questionText, 70)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getCorrectLabel(q)}
                          sx={{
                            fontWeight: 600,
                            bgcolor: alpha("#F5C518", 0.12),
                            color: "#F5C518",
                            maxWidth: 220,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {q.timesUsed ?? 0}×
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={q.isActive ? "Active" : "Inactive"}
                          color={q.isActive ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{q.creator?.nickname || "—"}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => openView(q)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(q)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {q.isActive ? (
                            <Tooltip title="Deactivate">
                              <IconButton size="small" color="error" onClick={() => handleDeactivate(q)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Reactivate">
                              <IconButton size="small" color="success" onClick={() => handleReactivate(q)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!loading && (
          <TablePagination
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

      <QuestionFormDialog
        open={formOpen}
        title={formMode === "create" ? "Add question" : "Edit question"}
        form={form}
        setForm={setForm}
        onClose={closeForm}
        onSave={handleSave}
        saving={saving}
        error={formError}
        readOnly={false}
      />

      <QuestionFormDialog
        open={viewOpen}
        title="Question details"
        form={
          viewTarget
            ? {
                questionText: viewTarget.questionText,
                optionA: viewTarget.optionA,
                optionB: viewTarget.optionB,
                optionC: viewTarget.optionC,
                optionD: viewTarget.optionD,
                correctAnswer: viewTarget.correctAnswer,
              }
            : emptyForm
        }
        setForm={() => {}}
        onClose={() => {
          setViewOpen(false);
          setViewTarget(null);
        }}
        onSave={() => {}}
        saving={false}
        error=""
        readOnly
      />
    </Box>
  );
}
