import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  Button,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Check,
  Close,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Settings({ user }) {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState("success");
  const [ploading, setPLoading] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false,
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const checkPasswordCriteria = (password) => {
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  useEffect(() => {
    checkPasswordCriteria(newPassword);
  }, [newPassword]);

  // Update password handler
  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setMessage(null); // Clear previous messages

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setSeverity("error");
      return;
    }

    if (
      !passwordCriteria.digit ||
      !passwordCriteria.length ||
      !passwordCriteria.lowercase ||
      !passwordCriteria.special ||
      !passwordCriteria.uppercase
    ) {
      setMessage("Enter a strong password!");
      setSeverity("error");
      return;
    }

    setPLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("No authentication token found");
        setSeverity("error");
        setPLoading(false);
        return;
      }

      const response = await fetch(`/api/admin-users/${user?.id}/password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword: newPassword,
        }),
      });
      const data = await response.json();

      if (data.success) {
        // Clear any existing messages
        setMessage(null);

        // Clear password fields
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Show success SweetAlert
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Password updated successfully.",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          // Redirect to home page after SweetAlert closes
          navigate("/");
        });
      } else {
        setMessage(data.message || "Failed to update password.");
        setSeverity("error");
        // Clear error message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      setMessage("Failed to update password.");
      setSeverity("error");
      // Clear error message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
    setPLoading(false);
  };

  return (
    <Box
      sx={{
        background: "#ffffff",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          overflow: "hidden",
          background: "#ffffff",
          border: "none",
          boxShadow: "none",
          minHeight: "100vh",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            background:
              "linear-gradient(135deg, #ffffff 0%, #fef5e7 50%, #fff9e6 100%)",
            p: 3,
            color: "#2c3e50",
            position: "relative",
            overflow: "hidden",
            borderBottom: "2px solid #FFD700",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: "rgba(255, 215, 0, 0.08)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              background: "rgba(255, 182, 193, 0.06)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 2, sm: 0 }}
            position="relative"
            zIndex={1}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: "#2c3e50",
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                }}
              >
                Security Settings
              </Typography>
              <Typography variant="body1" sx={{ color: "#7f8c8d" }}>
                Update your password for better security
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<PersonIcon />}
                label={user?.role || "Admin"}
                sx={{
                  background: "rgba(255, 215, 0, 0.15)",
                  color: "#b8860b",
                  fontWeight: 600,
                  borderRadius: 3,
                  px: 2,
                  border: "1px solid rgba(255, 215, 0, 0.3)",
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >
          <Stack spacing={3}>
            {/* Password Update Card */}
            <form onSubmit={handlePasswordUpdate}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
                  background: "#ffffff",
                  border: "2px solid rgba(255, 215, 0, 0.3)",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 35px rgba(255, 215, 0, 0.15)",
                  },
                }}
              >
                <CardHeader
                  sx={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #fff9e6 50%, #fef5e7 100%)",
                    color: "#2c3e50",
                    position: "relative",
                    overflow: "hidden",
                    borderBottom: "2px solid #FFD700",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      background: "rgba(255, 215, 0, 0.08)",
                      borderRadius: "50%",
                      zIndex: 0,
                    }}
                  />
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    sx={{ position: "relative", zIndex: 1 }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 215, 0, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFD700",
                      }}
                    >
                      <SecurityIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: "#2c3e50",
                        }}
                      >
                        Security Settings
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#7f8c8d" }}>
                        Update your password for better security
                      </Typography>
                    </Box>
                  </Box>
                </CardHeader>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    {/* Password Criteria */}
                    <Box
                      sx={{
                        background: "rgba(255, 215, 0, 0.05)",
                        borderRadius: 2,
                        p: 2,
                        border: "1px solid rgba(255, 215, 0, 0.2)",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: "#FFD700",
                          mb: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <LockIcon fontSize="small" />
                        Password Requirements
                      </Typography>
                      <List dense>
                        {[
                          {
                            key: "length",
                            text: "At least 8 characters long",
                          },
                          {
                            key: "uppercase",
                            text: "At least one uppercase letter",
                          },
                          {
                            key: "lowercase",
                            text: "At least one lowercase letter",
                          },
                          { key: "digit", text: "At least one digit" },
                          {
                            key: "special",
                            text: "At least one special character",
                          },
                        ].map(({ key, text }) => (
                          <ListItem key={key} sx={{ py: 0.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {passwordCriteria[key] ? (
                                <Check
                                  sx={{ color: "#90EE90" }}
                                  fontSize="small"
                                />
                              ) : (
                                <Close
                                  sx={{ color: "#FFB6C1" }}
                                  fontSize="small"
                                />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={text}
                              primaryTypographyProps={{
                                fontSize: "0.875rem",
                                color: passwordCriteria[key]
                                  ? "#2d8659"
                                  : "#7f8c8d",
                                fontWeight: passwordCriteria[key] ? 600 : 400,
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    {/* Password Fields */}
                    <FormControl fullWidth>
                      <InputLabel
                        sx={{
                          color: "#FFD700",
                          fontWeight: 600,
                          "&.Mui-focused": {
                            color: "#FFD700",
                          },
                        }}
                      >
                        Current Password
                      </InputLabel>
                      <OutlinedInput
                        label="Current Password"
                        type={showPasswords.oldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        startAdornment={
                          <Box sx={{ mr: 1, color: "#FFD700" }}>
                            <LockIcon />
                          </Box>
                        }
                        endAdornment={
                          <Tooltip
                            title={
                              showPasswords.oldPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            <IconButton
                              onClick={() =>
                                togglePasswordVisibility("oldPassword")
                              }
                              sx={{ color: "#FFD700" }}
                            >
                              {showPasswords.oldPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </Tooltip>
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "#ffffff",
                            "&:hover": {
                              backgroundColor: "rgba(255, 215, 0, 0.05)",
                            },
                            "&.Mui-focused": {
                              backgroundColor: "white",
                              boxShadow: "0 0 0 2px rgba(255, 215, 0, 0.3)",
                            },
                          },
                        }}
                      />
                    </FormControl>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel
                            sx={{
                              color: "#FFD700",
                              fontWeight: 600,
                              "&.Mui-focused": {
                                color: "#FFD700",
                              },
                            }}
                          >
                            New Password
                          </InputLabel>
                          <OutlinedInput
                            label="New Password"
                            type={
                              showPasswords.newPassword ? "text" : "password"
                            }
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            startAdornment={
                              <Box sx={{ mr: 1, color: "#FFD700" }}>
                                <LockIcon />
                              </Box>
                            }
                            endAdornment={
                              <Tooltip
                                title={
                                  showPasswords.newPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                <IconButton
                                  onClick={() =>
                                    togglePasswordVisibility("newPassword")
                                  }
                                  sx={{ color: "#FFD700" }}
                                >
                                  {showPasswords.newPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </Tooltip>
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "#ffffff",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 215, 0, 0.05)",
                                },
                                "&.Mui-focused": {
                                  backgroundColor: "white",
                                  boxShadow: "0 0 0 2px rgba(255, 215, 0, 0.3)",
                                },
                              },
                            }}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel
                            sx={{
                              color: "#FFD700",
                              fontWeight: 600,
                              "&.Mui-focused": {
                                color: "#FFD700",
                              },
                            }}
                          >
                            Confirm Password
                          </InputLabel>
                          <OutlinedInput
                            label="Confirm Password"
                            type={
                              showPasswords.confirmPassword
                                ? "text"
                                : "password"
                            }
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (e.target.value !== newPassword) {
                                setMessage("Passwords do not match");
                                setSeverity("error");
                              } else setMessage("");
                            }}
                            startAdornment={
                              <Box sx={{ mr: 1, color: "#FFD700" }}>
                                <LockIcon />
                              </Box>
                            }
                            endAdornment={
                              <Tooltip
                                title={
                                  showPasswords.confirmPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                <IconButton
                                  onClick={() =>
                                    togglePasswordVisibility("confirmPassword")
                                  }
                                  sx={{ color: "#FFD700" }}
                                >
                                  {showPasswords.confirmPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </Tooltip>
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "#ffffff",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 215, 0, 0.05)",
                                },
                                "&.Mui-focused": {
                                  backgroundColor: "white",
                                  boxShadow: "0 0 0 2px rgba(255, 215, 0, 0.3)",
                                },
                              },
                            }}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>

                    {message && (
                      <Alert
                        severity={severity}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 500,
                        }}
                      >
                        {message}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
                <Divider />
                <CardActions sx={{ p: 3, justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={ploading}
                    startIcon={
                      ploading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SecurityIcon />
                      )
                    }
                    sx={{
                      background: "#FFD700",
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      color: "#2c3e50",
                      textTransform: "none",
                      boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)",
                      "&:hover": {
                        background: "#FFC700",
                        transform: "translateY(-1px)",
                        boxShadow: "0 6px 20px rgba(255, 215, 0, 0.4)",
                      },
                      "&:disabled": {
                        background: "rgba(255, 215, 0, 0.3)",
                        color: "rgba(44, 62, 80, 0.4)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {ploading ? "Updating..." : "Update Password"}
                  </Button>
                </CardActions>
              </Card>
            </form>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
