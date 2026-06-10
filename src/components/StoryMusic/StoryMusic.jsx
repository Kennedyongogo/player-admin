import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
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
  Switch,
  FormControlLabel,
  CardMedia,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  MusicNote as MusicIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import Swal from "sweetalert2";

const StoryMusic = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [musicTracks, setMusicTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioRef, setAudioRef] = useState(null);
  const [playingProgress, setPlayingProgress] = useState(0);
  const audioEventHandlersRef = React.useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    audio_url: "",
    cover_image_url: "",
    duration: "",
    order: "",
    is_active: true,
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    fetchMusicTracks();
  }, []);

  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.src = "";
        // Remove event listeners if they exist
        if (audioEventHandlersRef.current) {
          const { handleEnded, handleTimeUpdate, handleError } =
            audioEventHandlersRef.current;
          audioRef.removeEventListener("ended", handleEnded);
          audioRef.removeEventListener("timeupdate", handleTimeUpdate);
          audioRef.removeEventListener("error", handleError);
        }
      }
    };
  }, [audioRef]);

  const fetchMusicTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/stories/music`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setMusicTracks(data.data || []);
      } else {
        setError(data.message || "Failed to load music tracks");
      }
    } catch (err) {
      console.error("Error fetching music tracks:", err);
      setError("Failed to load music tracks");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      title: "",
      artist: "",
      audio_url: "",
      cover_image_url: "",
      duration: "",
      order: "",
      is_active: true,
    });
    setAudioFile(null);
    setCoverFile(null);
    setAudioPreview(null);
    setCoverPreview(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      title: "",
      artist: "",
      audio_url: "",
      cover_image_url: "",
      duration: "",
      order: "",
      is_active: true,
    });
    setAudioFile(null);
    setCoverFile(null);
    setAudioPreview(null);
    setCoverPreview(null);
  };

  const handleOpenEditDialog = (track) => {
    setSelectedTrack(track);
    setFormData({
      title: track.title || "",
      artist: track.artist || "",
      audio_url: track.audio_url || "",
      cover_image_url: track.cover_image_url || "",
      duration: track.duration || "",
      order: track.order || "",
      is_active: track.is_active !== undefined ? track.is_active : true,
    });
    setAudioFile(null);
    setCoverFile(null);
    setAudioPreview(null);
    setCoverPreview(null);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedTrack(null);
    setFormData({
      title: "",
      artist: "",
      audio_url: "",
      cover_image_url: "",
      duration: "",
      order: "",
      is_active: true,
    });
    setAudioFile(null);
    setCoverFile(null);
    setAudioPreview(null);
    setCoverPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
      // Clear URL input when file is selected
      setFormData((prev) => ({ ...prev, audio_url: "" }));
    }
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      // Clear URL input when file is selected
      setFormData((prev) => ({ ...prev, cover_image_url: "" }));
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.artist) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Title and Artist are required fields.",
      });
      return;
    }

    if (!audioFile && !formData.audio_url) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please provide either an audio file or audio URL.",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("artist", formData.artist);
      if (formData.duration)
        formDataToSend.append("duration", formData.duration);
      if (formData.order) formDataToSend.append("order", formData.order);
      formDataToSend.append("is_active", formData.is_active);

      // Add files if uploaded, otherwise add URLs
      if (audioFile) {
        formDataToSend.append("audio_file", audioFile);
      } else if (formData.audio_url) {
        formDataToSend.append("audio_url", formData.audio_url);
      }

      if (coverFile) {
        formDataToSend.append("cover_image", coverFile);
      } else if (formData.cover_image_url) {
        formDataToSend.append("cover_image_url", formData.cover_image_url);
      }

      const response = await fetch(`/api/stories/music`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Music track created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        // Clean up any existing audio playback
        if (audioRef) {
          audioRef.pause();
          audioRef.src = "";
          // Remove event listeners if they exist
          if (audioEventHandlersRef.current) {
            const { handleEnded, handleTimeUpdate, handleError } =
              audioEventHandlersRef.current;
            audioRef.removeEventListener("ended", handleEnded);
            audioRef.removeEventListener("timeupdate", handleTimeUpdate);
            audioRef.removeEventListener("error", handleError);
          }
        }
        setAudioRef(null);
        setCurrentlyPlaying(null);
        setPlayingProgress(0);
        audioEventHandlersRef.current = null;
        handleCloseDialog();
        fetchMusicTracks();
      } else {
        throw new Error(data.message || "Failed to create music track");
      }
    } catch (err) {
      console.error("Error creating music track:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to create music track. Please try again.",
      });
    }
  };

  const handleUpdate = async () => {
    if (!formData.title || !formData.artist) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Title and Artist are required fields.",
      });
      return;
    }

    // If no file and no URL, keep existing audio_url
    if (!audioFile && !formData.audio_url && selectedTrack) {
      // Keep existing audio_url from selectedTrack
      formData.audio_url = selectedTrack.audio_url;
    }

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("artist", formData.artist);
      if (formData.duration !== undefined)
        formDataToSend.append("duration", formData.duration);
      if (formData.order !== undefined)
        formDataToSend.append("order", formData.order);
      formDataToSend.append("is_active", formData.is_active);

      // Add files if uploaded, otherwise add URLs (or keep existing)
      if (audioFile) {
        formDataToSend.append("audio_file", audioFile);
      } else if (formData.audio_url) {
        formDataToSend.append("audio_url", formData.audio_url);
      }

      if (coverFile) {
        formDataToSend.append("cover_image", coverFile);
      } else if (formData.cover_image_url) {
        formDataToSend.append("cover_image_url", formData.cover_image_url);
      }

      const response = await fetch(`/api/stories/music/${selectedTrack.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Music track updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        handleCloseEditDialog();
        fetchMusicTracks();
        // Stop playing if this track was playing and clean up
        if (currentlyPlaying === selectedTrack.id && audioRef) {
          audioRef.pause();
          audioRef.src = "";
          // Remove event listeners if they exist
          if (audioEventHandlersRef.current) {
            const { handleEnded, handleTimeUpdate, handleError } =
              audioEventHandlersRef.current;
            audioRef.removeEventListener("ended", handleEnded);
            audioRef.removeEventListener("timeupdate", handleTimeUpdate);
            audioRef.removeEventListener("error", handleError);
          }
          setAudioRef(null);
          setCurrentlyPlaying(null);
          setPlayingProgress(0);
          audioEventHandlersRef.current = null;
        }
      } else {
        throw new Error(data.message || "Failed to update music track");
      }
    } catch (err) {
      console.error("Error updating music track:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update music track. Please try again.",
      });
    }
  };

  const handleDelete = async (track) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Music Track?",
      text: `Are you sure you want to delete "${track.title}" by ${track.artist}?`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/stories/music/${track.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Music track deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        // Stop playing if this track was playing and clean up audio reference
        if (currentlyPlaying === track.id && audioRef) {
          audioRef.pause();
          audioRef.src = "";
          // Remove event listeners if they exist
          if (audioEventHandlersRef.current) {
            const { handleEnded, handleTimeUpdate, handleError } =
              audioEventHandlersRef.current;
            audioRef.removeEventListener("ended", handleEnded);
            audioRef.removeEventListener("timeupdate", handleTimeUpdate);
            audioRef.removeEventListener("error", handleError);
          }
        }
        setAudioRef(null);
        setCurrentlyPlaying(null);
        setPlayingProgress(0);
        audioEventHandlersRef.current = null;
        fetchMusicTracks();
      } else {
        throw new Error(data.message || "Failed to delete music track");
      }
    } catch (err) {
      console.error("Error deleting music track:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete music track. Please try again.",
      });
    }
  };

  const handlePlayPause = (track) => {
    if (currentlyPlaying === track.id) {
      // Pause current track
      if (audioRef) {
        audioRef.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      // Stop any currently playing track and clean up
      if (audioRef) {
        audioRef.pause();
        audioRef.src = "";
        // Remove old event listeners if they exist
        if (audioEventHandlersRef.current) {
          const { handleEnded, handleTimeUpdate, handleError } =
            audioEventHandlersRef.current;
          audioRef.removeEventListener("ended", handleEnded);
          audioRef.removeEventListener("timeupdate", handleTimeUpdate);
          audioRef.removeEventListener("error", handleError);
        }
        setAudioRef(null);
      }

      // Play new track - use getImageUrl to properly construct the URL
      const audioUrl = getImageUrl(track.audio_url);
      if (!audioUrl) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Audio URL is missing for this track.",
        });
        return;
      }

      const audio = new Audio(audioUrl);

      // Track if audio successfully started playing
      let hasStartedPlaying = false;

      // Create named functions for event listeners and store them for cleanup
      const handleEnded = () => {
        setCurrentlyPlaying(null);
        setPlayingProgress(0);
        audioEventHandlersRef.current = null;
      };

      const handleTimeUpdate = () => {
        if (audio.duration) {
          setPlayingProgress((audio.currentTime / audio.duration) * 100);
          // If we get time updates, audio is playing successfully
          hasStartedPlaying = true;
        }
      };

      const handleError = (e) => {
        console.error("Audio playback error:", e);
        // Only show error if this is the current audio and it hasn't started playing
        if (
          audioRef === audio &&
          !hasStartedPlaying &&
          audio.paused &&
          audio.readyState < 2
        ) {
          Swal.fire({
            icon: "error",
            title: "Playback Error",
            text: "Failed to play audio. Please check if the file exists.",
          });
          setCurrentlyPlaying(null);
          setPlayingProgress(0);
          setAudioRef(null);
          audioEventHandlersRef.current = null;
        }
      };

      // Store handlers for cleanup
      audioEventHandlersRef.current = {
        handleEnded,
        handleTimeUpdate,
        handleError,
      };

      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("error", handleError);

      // Set playing state immediately so pause button shows
      setCurrentlyPlaying(track.id);
      setAudioRef(audio);

      audio
        .play()
        .then(() => {
          // Audio started playing successfully
          hasStartedPlaying = true;
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          // Only show error if this is still the current audio and it hasn't started playing
          if (audioRef === audio && !hasStartedPlaying) {
            Swal.fire({
              icon: "error",
              title: "Playback Error",
              text: "Failed to play audio. Please check if the file exists.",
            });
            setCurrentlyPlaying(null);
            setPlayingProgress(0);
            setAudioRef(null);
            audioEventHandlersRef.current = null;
          }
        });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return imagePath;
    // If it's a relative path like "music/audio/file.mp3", prepend /uploads/
    if (imagePath.includes("music/")) {
      return `/uploads/${imagePath}`;
    }
    return imagePath;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const activeTracksCount = musicTracks.filter((t) => t.is_active).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
          Story Music Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          disabled={activeTracksCount >= 10}
        >
          Add Music Track
        </Button>
      </Box>

      {activeTracksCount >= 10 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Maximum of 10 active music tracks reached. Please deactivate a track
          before adding a new one.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Tracks
                  </Typography>
                  <Typography variant="h4">{musicTracks.length}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Active Tracks
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {activeTracksCount}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Inactive Tracks
                  </Typography>
                  <Typography variant="h4" color="text.secondary">
                    {musicTracks.length - activeTracksCount}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cover</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {musicTracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 4 }}>
                        <MusicIcon
                          sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No music tracks found
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Click "Add Music Track" to get started
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  musicTracks
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((track) => (
                      <TableRow key={track.id} hover>
                        <TableCell>
                          {track.cover_image_url ? (
                            <CardMedia
                              component="img"
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 1,
                                objectFit: "cover",
                              }}
                              image={getImageUrl(track.cover_image_url)}
                              alt={track.title}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 1,
                                bgcolor: "grey.300",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MusicIcon />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {track.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {track.artist}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDuration(track.duration)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {track.order || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={
                              track.is_active ? (
                                <ActiveIcon />
                              ) : (
                                <InactiveIcon />
                              )
                            }
                            label={track.is_active ? "Active" : "Inactive"}
                            color={track.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Play/Pause">
                              <IconButton
                                size="small"
                                onClick={() => handlePlayPause(track)}
                                color={
                                  currentlyPlaying === track.id
                                    ? "primary"
                                    : "default"
                                }
                              >
                                {currentlyPlaying === track.id ? (
                                  <PauseIcon />
                                ) : (
                                  <PlayIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(track)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(track)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            {musicTracks.length > 0 && (
              <TablePagination
                component="div"
                count={musicTracks.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            )}
          </TableContainer>

          {currentlyPlaying && (
            <Card
              sx={{
                position: "fixed",
                bottom: 16,
                right: 16,
                minWidth: 300,
                zIndex: 1000,
                boxShadow: 3,
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold">
                  Now Playing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {musicTracks.find((t) => t.id === currentlyPlaying)?.title} -{" "}
                  {musicTracks.find((t) => t.id === currentlyPlaying)?.artist}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={playingProgress}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Add New Music Track</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title *"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            <TextField
              fullWidth
              label="Artist *"
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              required
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "medium" }}>
                Audio File *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 1 }}
              >
                {audioFile
                  ? audioFile.name
                  : "Choose Audio File (MP3, WAV, etc.)"}
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                />
              </Button>
              {audioPreview && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <audio
                    controls
                    src={audioPreview}
                    style={{ width: "100%" }}
                  />
                </Box>
              )}
              {selectedTrack?.audio_url && !audioFile && !audioPreview && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Current audio:
                  </Typography>
                  <audio
                    controls
                    src={getImageUrl(selectedTrack.audio_url)}
                    style={{ width: "100%" }}
                  />
                </Box>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 2 }}
              >
                OR enter audio URL below
              </Typography>
              <TextField
                fullWidth
                label="Audio URL"
                name="audio_url"
                value={formData.audio_url}
                onChange={handleInputChange}
                disabled={!!audioFile}
                helperText={
                  audioFile
                    ? "File selected, URL disabled"
                    : "Enter the full URL to the audio file"
                }
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "medium" }}>
                Cover Image
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 1 }}
              >
                {coverFile
                  ? coverFile.name
                  : "Choose Cover Image (JPG, PNG, etc.)"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleCoverFileChange}
                />
              </Button>
              {coverPreview && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <CardMedia
                    component="img"
                    sx={{
                      maxHeight: 200,
                      objectFit: "contain",
                      borderRadius: 1,
                    }}
                    image={coverPreview}
                    alt="Cover preview"
                  />
                </Box>
              )}
              {selectedTrack?.cover_image_url &&
                !coverFile &&
                !coverPreview && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Current cover:
                    </Typography>
                    <CardMedia
                      component="img"
                      sx={{
                        maxHeight: 200,
                        objectFit: "contain",
                        borderRadius: 1,
                      }}
                      image={getImageUrl(selectedTrack.cover_image_url)}
                      alt="Current cover"
                    />
                  </Box>
                )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 2 }}
              >
                OR enter cover image URL below
              </Typography>
              <TextField
                fullWidth
                label="Cover Image URL"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleInputChange}
                disabled={!!coverFile}
                helperText={
                  coverFile
                    ? "File selected, URL disabled"
                    : "Enter the full URL to the cover image"
                }
              />
            </Box>
            <TextField
              fullWidth
              label="Duration (seconds)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleInputChange}
              helperText="Duration in seconds (optional)"
            />
            <TextField
              fullWidth
              label="Order"
              name="order"
              type="number"
              value={formData.order}
              onChange={handleInputChange}
              helperText="Display order (lower numbers appear first)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  name="is_active"
                />
              }
              label="Active (available for users)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Edit Music Track</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title *"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            <TextField
              fullWidth
              label="Artist *"
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              required
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "medium" }}>
                Audio File *
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 1 }}
              >
                {audioFile
                  ? audioFile.name
                  : "Choose Audio File (MP3, WAV, etc.)"}
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                />
              </Button>
              {audioPreview && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <audio
                    controls
                    src={audioPreview}
                    style={{ width: "100%" }}
                  />
                </Box>
              )}
              {selectedTrack?.audio_url && !audioFile && !audioPreview && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Current audio:
                  </Typography>
                  <audio
                    controls
                    src={getImageUrl(selectedTrack.audio_url)}
                    style={{ width: "100%" }}
                  />
                </Box>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 2 }}
              >
                OR enter audio URL below
              </Typography>
              <TextField
                fullWidth
                label="Audio URL"
                name="audio_url"
                value={formData.audio_url}
                onChange={handleInputChange}
                disabled={!!audioFile}
                helperText={
                  audioFile
                    ? "File selected, URL disabled"
                    : "Enter the full URL to the audio file"
                }
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "medium" }}>
                Cover Image
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 1 }}
              >
                {coverFile
                  ? coverFile.name
                  : "Choose Cover Image (JPG, PNG, etc.)"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleCoverFileChange}
                />
              </Button>
              {coverPreview && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <CardMedia
                    component="img"
                    sx={{
                      maxHeight: 200,
                      objectFit: "contain",
                      borderRadius: 1,
                    }}
                    image={coverPreview}
                    alt="Cover preview"
                  />
                </Box>
              )}
              {selectedTrack?.cover_image_url &&
                !coverFile &&
                !coverPreview && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Current cover:
                    </Typography>
                    <CardMedia
                      component="img"
                      sx={{
                        maxHeight: 200,
                        objectFit: "contain",
                        borderRadius: 1,
                      }}
                      image={getImageUrl(selectedTrack.cover_image_url)}
                      alt="Current cover"
                    />
                  </Box>
                )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 2 }}
              >
                OR enter cover image URL below
              </Typography>
              <TextField
                fullWidth
                label="Cover Image URL"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleInputChange}
                disabled={!!coverFile}
                helperText={
                  coverFile
                    ? "File selected, URL disabled"
                    : "Enter the full URL to the cover image"
                }
              />
            </Box>
            <TextField
              fullWidth
              label="Duration (seconds)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleInputChange}
              helperText="Duration in seconds (optional)"
            />
            <TextField
              fullWidth
              label="Order"
              name="order"
              type="number"
              value={formData.order}
              onChange={handleInputChange}
              helperText="Display order (lower numbers appear first)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  name="is_active"
                />
              }
              label="Active (available for users)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoryMusic;
