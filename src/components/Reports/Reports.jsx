import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Grid,
  Paper,
  IconButton,
} from "@mui/material";
import {
  Report as ReportIcon,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Schedule,
  Cancel,
  Close,
  Person,
  Category as CategoryIcon,
  Search,
  FilterList,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  });
  const [updateForm, setUpdateForm] = useState({
    status: "",
    admin_notes: "",
    priority: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const params = new URLSearchParams({
        page: (page + 1).toString(),
        pageSize: rowsPerPage.toString(),
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.search) params.append("q", filters.search);

      const response = await fetch(`/api/reports?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setReports(data.data || []);
        setTotalReports(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setUpdateForm({
      status: report.status,
      admin_notes: report.admin_notes || "",
      priority: report.priority,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateReport = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateForm),
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Report Updated",
          text: "The report has been updated successfully.",
          confirmButtonColor: "#D4AF37",
        });
        setEditDialogOpen(false);
        fetchReports();
      } else {
        throw new Error(data.message || "Failed to update report");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update report. Please try again.",
        confirmButtonColor: "#D4AF37",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReport = async (report) => {
    const result = await Swal.fire({
      title: "Delete Report?",
      text: `Are you sure you want to delete the report "${report.subject}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#666",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/reports/${report.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "Report has been deleted successfully.",
            confirmButtonColor: "#D4AF37",
          });
          fetchReports();
        } else {
          throw new Error(data.message || "Failed to delete report");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Failed to delete report. Please try again.",
          confirmButtonColor: "#D4AF37",
        });
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "in_review":
        return "info";
      case "resolved":
        return "success";
      case "rejected":
        return "error";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getCategoryLabel = (category) => {
    const categories = {
      inappropriate_content: "Inappropriate Content",
      harassment: "Harassment",
      scam: "Scam/Fraud",
      fake_profile: "Fake Profile",
      spam: "Spam",
      payment_issue: "Payment Issue",
      technical_issue: "Technical Issue",
      other: "Other",
    };
    return categories[category] || category;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 3, color: "#1a1a1a" }}
      >
        <ReportIcon sx={{ mr: 1, verticalAlign: "middle", color: "#D4AF37" }} />
        Reports Management
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search reports..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: "#D4AF37" }} />,
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_review">In Review</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              label="Category"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="inappropriate_content">
                Inappropriate Content
              </MenuItem>
              <MenuItem value="harassment">Harassment</MenuItem>
              <MenuItem value="scam">Scam/Fraud</MenuItem>
              <MenuItem value="fake_profile">Fake Profile</MenuItem>
              <MenuItem value="spam">Spam</MenuItem>
              <MenuItem value="payment_issue">Payment Issue</MenuItem>
              <MenuItem value="technical_issue">Technical Issue</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              label="Priority"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      {/* Reports Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(212, 175, 55, 0.1)" }}>
                <TableCell sx={{ fontWeight: 700, width: "80px" }}>
                  No
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    display: { xs: "none", md: "table-cell" },
                  }}
                >
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reporter Name</TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    display: { xs: "none", md: "table-cell" },
                  }}
                >
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress sx={{ color: "#D4AF37" }} />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                    >
                      No reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report, index) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", md: "table-cell" } }}
                    >
                      <Chip
                        icon={<CategoryIcon />}
                        label={getCategoryLabel(report.category)}
                        size="small"
                        sx={{
                          bgcolor: "rgba(212, 175, 55, 0.1)",
                          color: "#D4AF37",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Person sx={{ fontSize: 16, color: "#D4AF37" }} />
                        <Typography variant="body2">
                          {report.reporter?.name || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", md: "table-cell" } }}
                    >
                      <Chip
                        label={getStatusLabel(report.status)}
                        color={getStatusColor(report.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewReport(report)}
                            sx={{ color: "#D4AF37" }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit/Update">
                          <IconButton
                            size="small"
                            onClick={() => handleEditReport(report)}
                            sx={{ color: "#2196F3" }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteReport(report)}
                            sx={{ color: "#d32f2f" }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalReports}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "#D4AF37",
            color: "#fff",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ReportIcon />
          Report Details
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedReport && (
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                >
                  SUBJECT
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#1a1a1a", mt: 0.5 }}
                >
                  {selectedReport.subject}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                  >
                    REPORTER
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedReport.reporter?.name || "N/A"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                  >
                    {selectedReport.reporter?.email}
                  </Typography>
                </Grid>
                {selectedReport.reportedUser && (
                  <Grid item xs={6}>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                    >
                      REPORTED USER
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mt: 0.5 }}
                    >
                      {selectedReport.reportedUser?.name || "N/A"}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                  >
                    STATUS
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getStatusLabel(selectedReport.status)}
                      color={getStatusColor(selectedReport.status)}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                  >
                    CATEGORY
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      icon={<CategoryIcon />}
                      label={getCategoryLabel(selectedReport.category)}
                      size="small"
                      sx={{
                        bgcolor: "rgba(212, 175, 55, 0.1)",
                        color: "#D4AF37",
                      }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                  >
                    PRIORITY
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedReport.priority.toUpperCase()}
                      color={getPriorityColor(selectedReport.priority)}
                      size="small"
                    />
                  </Box>
                </Box>
              </Stack>

              <Divider />

              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(26, 26, 26, 0.5)" }}
                >
                  DESCRIPTION
                </Typography>
                <Typography variant="body1" sx={{ color: "#1a1a1a", mt: 1 }}>
                  {selectedReport.description}
                </Typography>
              </Box>

              {selectedReport.admin_notes && (
                <Alert severity="info" sx={{ borderRadius: "8px" }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 0.5 }}
                  >
                    Admin Notes:
                  </Typography>
                  <Typography variant="body2">
                    {selectedReport.admin_notes}
                  </Typography>
                </Alert>
              )}

              <Divider />

              <Typography
                variant="caption"
                sx={{ color: "rgba(26, 26, 26, 0.5)" }}
              >
                Submitted: {formatDate(selectedReport.createdAt)}
                {selectedReport.resolution_date && (
                  <> • Resolved: {formatDate(selectedReport.resolution_date)}</>
                )}
                {selectedReport.handledBy && (
                  <> • Handled by: {selectedReport.handledBy?.name}</>
                )}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            sx={{
              bgcolor: "#D4AF37",
              "&:hover": { bgcolor: "#B8941F" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !updating && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "#D4AF37",
            color: "#fff",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Edit />
          Update Report
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={updateForm.status}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, status: e.target.value })
                }
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_review">In Review</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={updateForm.priority}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, priority: e.target.value })
                }
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Admin Notes"
              fullWidth
              multiline
              rows={4}
              value={updateForm.admin_notes}
              onChange={(e) =>
                setUpdateForm({ ...updateForm, admin_notes: e.target.value })
              }
              placeholder="Add notes about how this report was handled..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={updating}
            sx={{ color: "#666" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateReport}
            variant="contained"
            disabled={updating}
            sx={{
              bgcolor: "#D4AF37",
              "&:hover": { bgcolor: "#B8941F" },
            }}
          >
            {updating ? <CircularProgress size={20} /> : "Update Report"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
