import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  CardMedia,
} from "@mui/material";
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  TextFields as TextIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import Swal from "sweetalert2";

const StoriesModeration = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStories, setTotalStories] = useState(0);
  const [moderationLoading, setModerationLoading] = useState({});
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const statusTabs = [
    { label: "All Stories", value: "all", count: totalStories },
    { label: "Pending", value: "pending", count: 0 },
    { label: "Approved", value: "approved", count: 0 },
    { label: "Rejected", value: "rejected", count: 0 },
  ];

  useEffect(() => {
    fetchStories();
  }, [page, rowsPerPage, activeTab]);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const status =
        statusTabs[activeTab]?.value === "all"
          ? ""
          : statusTabs[activeTab]?.value;
      const response = await fetch(
        `/api/stories/admin/moderation?status=${status}&page=${
          page + 1
        }&pageSize=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setStories(data.data || []);
        setTotalStories(data.pagination?.total || 0);
      } else {
        setError(data.message || "Failed to load stories");
      }
    } catch (err) {
      console.error("Error fetching stories:", err);
      setError("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return imagePath;
    if (imagePath.startsWith("stories/")) return `/uploads/${imagePath}`;
    if (imagePath.startsWith("uploads/")) return `/${imagePath}`;
    return `/uploads/${imagePath}`;
  };

  const handleViewStory = (story) => {
    setSelectedStory(story);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStory(null);
    setRejectionNotes("");
    setRejectionReason("");
  };

  const handleApprove = async (storyId) => {
    try {
      setModerationLoading((prev) => ({ ...prev, [storyId]: true }));
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/stories/admin/${storyId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Approved!",
          text: "Story has been approved successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchStories();
      } else {
        throw new Error(data.message || "Failed to approve story");
      }
    } catch (err) {
      console.error("Error approving story:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to approve story. Please try again.",
      });
    } finally {
      setModerationLoading((prev) => ({ ...prev, [storyId]: false }));
    }
  };

  const handleReject = async (storyId) => {
    if (!rejectionReason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Reason Required",
        text: "Please provide a reason for rejection.",
      });
      return;
    }

    try {
      setModerationLoading((prev) => ({
        ...prev,
        [`reject-${storyId}`]: true,
      }));
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/stories/admin/${storyId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: rejectionReason,
          notes: rejectionNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Rejected!",
          text: "Story has been rejected successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        handleCloseDialog();
        fetchStories();
      } else {
        throw new Error(data.message || "Failed to reject story");
      }
    } catch (err) {
      console.error("Error rejecting story:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to reject story. Please try again.",
      });
    } finally {
      setModerationLoading((prev) => ({
        ...prev,
        [`reject-${storyId}`]: false,
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <ApproveIcon fontSize="small" />;
      case "rejected":
        return <RejectIcon fontSize="small" />;
      case "pending":
        return <PendingIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{ mb: 3, fontWeight: 700, color: "#2c3e50" }}
      >
        Stories Moderation
      </Typography>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            setPage(0);
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          {statusTabs.map((tab, index) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {tab.label}
                  {tab.count > 0 && (
                    <Chip
                      label={tab.count}
                      size="small"
                      color="primary"
                      sx={{ minWidth: 24, height: 20, fontSize: "0.7rem" }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stories Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : stories.length === 0 ? (
            <Box sx={{ textAlign: "center", p: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No stories found
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Story</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Caption</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stories.map((story) => (
                      <TableRow key={story.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {story.media_type === "video" ? (
                              <VideoIcon color="primary" />
                            ) : story.media_type === "text" ? (
                              <TextIcon color="primary" />
                            ) : (
                              <ImageIcon color="primary" />
                            )}
                            {story.media_type === "text" ? (
                              <Box
                                sx={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 1,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background:
                                    (story.metadata &&
                                      typeof story.metadata === "object" &&
                                      story.metadata.background_color) ||
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                  color: "white",
                                  p: 1,
                                  fontSize: "0.7rem",
                                  textAlign: "center",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                onClick={() => handleViewStory(story)}
                              >
                                {story.caption
                                  ? story.caption.substring(0, 30) +
                                    (story.caption.length > 30 ? "..." : "")
                                  : "Text Story"}
                              </Box>
                            ) : (
                              <Box
                                component="img"
                                src={getImageUrl(story.media_url)}
                                alt="Story preview"
                                sx={{
                                  width: 60,
                                  height: 60,
                                  objectFit: "cover",
                                  borderRadius: 1,
                                  cursor: "pointer",
                                }}
                                onClick={() => handleViewStory(story)}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              src={getImageUrl(story.user?.photo)}
                              sx={{ width: 32, height: 32 }}
                            >
                              {story.user?.name?.charAt(0) || "U"}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {story.user?.name ||
                                  story.user?.username ||
                                  "Unknown"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {story.user?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {story.caption || "No caption"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(story.moderation_status)}
                            label={story.moderation_status}
                            color={getStatusColor(story.moderation_status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(story.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(story.createdAt).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Story">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewStory(story)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {story.moderation_status === "pending" && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApprove(story.id)}
                                    disabled={moderationLoading[story.id]}
                                  >
                                    {moderationLoading[story.id] ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <ApproveIcon />
                                    )}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setSelectedStory(story);
                                      setOpenDialog(true);
                                    }}
                                    disabled={
                                      moderationLoading[`reject-${story.id}`]
                                    }
                                  >
                                    {moderationLoading[`reject-${story.id}`] ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <RejectIcon />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalStories}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* View/Reject Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Story Details</Typography>
            {selectedStory && (
              <Chip
                icon={getStatusIcon(selectedStory.moderation_status)}
                label={selectedStory.moderation_status}
                color={getStatusColor(selectedStory.moderation_status)}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStory && (
            <Stack spacing={3}>
              {/* Media or Text */}
              <Box>
                {selectedStory.media_type === "text" ? (
                  <Box
                    sx={{
                      width: "100%",
                      minHeight: 300,
                      maxHeight: 400,
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 4,
                      background:
                        (selectedStory.metadata &&
                          typeof selectedStory.metadata === "object" &&
                          selectedStory.metadata.background_color) ||
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        textAlign: "center",
                        fontWeight: 600,
                        wordWrap: "break-word",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {selectedStory.caption || "Text Story"}
                    </Typography>
                  </Box>
                ) : selectedStory.media_type === "video" ? (
                  <CardMedia
                    component="video"
                    src={getImageUrl(selectedStory.media_url)}
                    controls
                    sx={{ width: "100%", maxHeight: 400, borderRadius: 1 }}
                  />
                ) : (
                  <CardMedia
                    component="img"
                    src={getImageUrl(selectedStory.media_url)}
                    alt="Story"
                    sx={{
                      width: "100%",
                      maxHeight: 400,
                      objectFit: "contain",
                      borderRadius: 1,
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </Box>

              {/* User Info */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={getImageUrl(selectedStory.user?.photo)}
                  sx={{ width: 56, height: 56 }}
                >
                  {selectedStory.user?.name?.charAt(0) || "U"}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedStory.user?.name ||
                      selectedStory.user?.username ||
                      "Unknown User"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedStory.user?.email}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Caption */}
              <Box>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Caption
                </Typography>
                <Typography variant="body1">
                  {selectedStory.caption || "No caption provided"}
                </Typography>
              </Box>

              {/* Story Info */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedStory.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Expires
                  </Typography>
                  <Typography variant="body2">
                    {selectedStory.expires_at
                      ? new Date(selectedStory.expires_at).toLocaleString()
                      : "N/A"}
                  </Typography>
                </Grid>
              </Grid>

              {/* Rejection Form (only show if pending) */}
              {selectedStory.moderation_status === "pending" && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Rejection Reason *
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      required
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Additional Notes (Optional)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Additional notes..."
                    />
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedStory?.moderation_status === "pending" && (
            <>
              <Button
                onClick={() => handleApprove(selectedStory.id)}
                variant="contained"
                color="success"
                disabled={moderationLoading[selectedStory.id]}
                startIcon={
                  moderationLoading[selectedStory.id] ? (
                    <CircularProgress size={16} />
                  ) : (
                    <ApproveIcon />
                  )
                }
              >
                Approve
              </Button>
              <Button
                onClick={() => handleReject(selectedStory.id)}
                variant="contained"
                color="error"
                disabled={
                  moderationLoading[`reject-${selectedStory.id}`] ||
                  !rejectionReason.trim()
                }
                startIcon={
                  moderationLoading[`reject-${selectedStory.id}`] ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RejectIcon />
                  )
                }
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoriesModeration;
