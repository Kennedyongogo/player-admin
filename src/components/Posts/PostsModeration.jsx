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

const PostsModeration = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);
  const [moderationLoading, setModerationLoading] = useState({});
  const [rejectionNotes, setRejectionNotes] = useState("");

  const statusTabs = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  useEffect(() => {
    fetchPosts();
  }, [page, rowsPerPage, activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const status = statusTabs[activeTab]?.value || "pending";
      const response = await fetch(
        `/api/posts/admin/moderation?status=${status}&limit=${rowsPerPage}&offset=${
          page * rowsPerPage
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts || []);
        setTotalPosts(data.data.total || 0);
      } else {
        setError(data.message || "Failed to load posts");
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return imagePath;
    if (imagePath.startsWith("posts/")) return `/uploads/${imagePath}`;
    if (imagePath.startsWith("uploads/")) return `/${imagePath}`;
    return `/uploads/${imagePath}`;
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPost(null);
    setRejectionNotes("");
  };

  const handleApprove = async (postId) => {
    try {
      setModerationLoading((prev) => ({ ...prev, [postId]: true }));
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/posts/admin/${postId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Approved!",
          text: "Post has been approved successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchPosts();
        handleCloseDialog();
      } else {
        throw new Error(data.message || "Failed to approve post");
      }
    } catch (err) {
      console.error("Error approving post:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to approve post. Please try again.",
      });
    } finally {
      setModerationLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleReject = async (postId) => {
    try {
      setModerationLoading((prev) => ({
        ...prev,
        [`reject-${postId}`]: true,
      }));
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/posts/admin/${postId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: rejectionNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Rejected!",
          text: "Post has been rejected successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        handleCloseDialog();
        fetchPosts();
      } else {
        throw new Error(data.message || "Failed to reject post");
      }
    } catch (err) {
      console.error("Error rejecting post:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to reject post. Please try again.",
      });
    } finally {
      setModerationLoading((prev) => ({
        ...prev,
        [`reject-${postId}`]: false,
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
        Posts Moderation
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
            <Tab key={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Posts Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : posts.length === 0 ? (
            <Box sx={{ textAlign: "center", p: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No posts found
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Post</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Caption</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {post.media_type === "video" ? (
                              <VideoIcon color="primary" />
                            ) : post.media_type === "text" ? (
                              <TextIcon color="primary" />
                            ) : (
                              <ImageIcon color="primary" />
                            )}
                            {post.media_type === "text" ? (
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
                                    (post.metadata &&
                                      typeof post.metadata === "object" &&
                                      post.metadata.background_color) ||
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                  color: "white",
                                  p: 1,
                                  fontSize: "0.7rem",
                                  textAlign: "center",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                onClick={() => handleViewPost(post)}
                              >
                                {post.caption
                                  ? post.caption.substring(0, 30) +
                                    (post.caption.length > 30 ? "..." : "")
                                  : "Text Post"}
                              </Box>
                            ) : (
                              <Box
                                component="img"
                                src={getImageUrl(post.media_url)}
                                alt="Post preview"
                                sx={{
                                  width: 60,
                                  height: 60,
                                  objectFit: "cover",
                                  borderRadius: 1,
                                  cursor: "pointer",
                                }}
                                onClick={() => handleViewPost(post)}
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
                              src={getImageUrl(post.user?.photo)}
                              sx={{ width: 32, height: 32 }}
                            >
                              {post.user?.name?.charAt(0) || "U"}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {post.user?.name ||
                                  post.user?.username ||
                                  "Unknown"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {post.user?.email}
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
                            {post.caption || "No caption"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(post.moderation_status)}
                            label={post.moderation_status}
                            color={getStatusColor(post.moderation_status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(post.createdAt).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Post">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewPost(post)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {post.moderation_status === "pending" && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApprove(post.id)}
                                    disabled={moderationLoading[post.id]}
                                  >
                                    {moderationLoading[post.id] ? (
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
                                      setSelectedPost(post);
                                      setOpenDialog(true);
                                    }}
                                    disabled={
                                      moderationLoading[`reject-${post.id}`]
                                    }
                                  >
                                    {moderationLoading[`reject-${post.id}`] ? (
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
                count={totalPosts}
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
            <Typography variant="h6">Post Details</Typography>
            {selectedPost && (
              <Chip
                icon={getStatusIcon(selectedPost.moderation_status)}
                label={selectedPost.moderation_status}
                color={getStatusColor(selectedPost.moderation_status)}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPost && (
            <Stack spacing={3}>
              {/* Media or Text */}
              <Box>
                {selectedPost.media_type === "text" ? (
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
                        (selectedPost.metadata &&
                          typeof selectedPost.metadata === "object" &&
                          selectedPost.metadata.background_color) ||
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
                      {selectedPost.caption || "Text Post"}
                    </Typography>
                  </Box>
                ) : selectedPost.media_type === "video" ? (
                  <CardMedia
                    component="video"
                    src={getImageUrl(selectedPost.media_url)}
                    controls
                    sx={{ width: "100%", maxHeight: 400, borderRadius: 1 }}
                  />
                ) : (
                  <CardMedia
                    component="img"
                    src={getImageUrl(selectedPost.media_url)}
                    alt="Post"
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
                  src={getImageUrl(selectedPost.user?.photo)}
                  sx={{ width: 56, height: 56 }}
                >
                  {selectedPost.user?.name?.charAt(0) || "U"}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedPost.user?.name ||
                      selectedPost.user?.username ||
                      "Unknown User"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedPost.user?.email}
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
                  {selectedPost.caption || "No caption provided"}
                </Typography>
              </Box>

              {/* Post Info */}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedPost.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedPost.location && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Location
                    </Typography>
                    <Typography variant="body2">
                      {selectedPost.location}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Rejection Form (only show if pending) */}
              {selectedPost.moderation_status === "pending" && (
                <>
                  <Divider />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Rejection Notes (Optional)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Enter notes for rejection..."
                    />
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedPost?.moderation_status === "pending" && (
            <>
              <Button
                onClick={() => handleApprove(selectedPost.id)}
                variant="contained"
                color="success"
                disabled={moderationLoading[selectedPost.id]}
                startIcon={
                  moderationLoading[selectedPost.id] ? (
                    <CircularProgress size={16} />
                  ) : (
                    <ApproveIcon />
                  )
                }
              >
                Approve
              </Button>
              <Button
                onClick={() => handleReject(selectedPost.id)}
                variant="contained"
                color="error"
                disabled={moderationLoading[`reject-${selectedPost.id}`]}
                startIcon={
                  moderationLoading[`reject-${selectedPost.id}`] ? (
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

export default PostsModeration;
