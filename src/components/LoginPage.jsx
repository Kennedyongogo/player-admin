// import "../Styles/login.scss";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Grid,
  Container,
  Stack,
  Divider,
  Fade,
  Slide,
  Zoom,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login,
  Security,
  Shield,
  VerifiedUser,
  AdminPanelSettings,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const images = [
  "/tuvibe-1.jpg",
  "/tuvibe-2.jpg",
  "/tuvibe-3.jpg",
  "/tuvibe-4.jpg",
];

export default function LoginPage(props) {
  const theme = useTheme();
  const rfEmail = useRef();
  const rsEmail = useRef();
  const rfPassword = useRef();
  const code = useRef();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [body, updateBody] = useState({
    email: null,
  });

  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [severity, setSeverity] = useState("error");
  const navigate = useNavigate();

  const login = async (e) => {
    if (e) e.preventDefault();

    let d = body;
    d.email = rfEmail.current.value.toLowerCase().trim();
    d.password = rfPassword.current.value;
    updateBody(d);

    if (!validateEmail(body.email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address",
        confirmButtonColor: theme.palette.primary.main,
      });
      return;
    }

    if (!validatePassword(body.password)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Password",
        text: "Password must be at least 6 characters",
        confirmButtonColor: theme.palette.primary.main,
      });
      return;
    }

    if (validateEmail(body.email) && validatePassword(body.password)) {
      setLoading(true);
      Swal.fire({
        title: "Signing in...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const response = await fetch("/api/admin-users/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });
        const data = await response.json();

        if (!response.ok) {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: data.message,
            confirmButtonColor: theme.palette.primary.main,
          });
        } else {
          // Check if login was successful
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: data.message,
              timer: 1500,
              showConfirmButton: false,
            });
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("userRole", data.data.admin.role);
            localStorage.setItem("user", JSON.stringify(data.data.admin));
            setTimeout(() => {
              navigate("/analytics");
            }, 1500);
          } else {
            Swal.fire({
              icon: "error",
              title: "Login Failed",
              text: data.message,
              confirmButtonColor: theme.palette.primary.main,
            });
          }
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Login failed. Please try again.",
          confirmButtonColor: theme.palette.primary.main,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const reset = async () => {
    let d = { Email: rsEmail.current.value.toLowerCase().trim() };

    if (!validateEmail(d.Email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address",
        confirmButtonColor: theme.palette.primary.main,
      });
      return;
    }

    if (validateEmail(d.Email)) {
      setResetLoading(true);
      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const response = await fetch("/api/auth/forgot", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(d),
        });
        const data = await response.json();

        if (response.ok) {
          setOpenResetDialog(false);
          Swal.fire({
            icon: "success",
            title: "Success",
            text: data.message,
            confirmButtonColor: theme.palette.primary.main,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.message,
            confirmButtonColor: theme.palette.primary.main,
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong. Please try again.",
          confirmButtonColor: theme.palette.primary.main,
        });
      } finally {
        setResetLoading(false);
      }
    }
  };

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]/.,;:\s@"]+(\.[^<>()[\]/.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  useEffect(() => {
    // Preload images
    images.forEach((imageSrc) => {
      const img = new Image();
      img.src = imageSrc;
    });

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      position="relative"
      sx={{
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #fafafa 100%)",
      }}
    >
      {images.map((image, index) => (
        <Box
          key={index}
          component="img"
          src={image}
          alt={`Background ${index + 1}`}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: currentImageIndex === index ? 1 : 0,
            transition: "opacity 1.5s ease-in-out",
            zIndex: 0,
          }}
        />
      ))}

      {/* Animated geometric shapes for visual interest */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: 100,
          height: 100,
          borderRadius: "50%",
          background:
            "linear-gradient(45deg, rgba(212,175,55,0.15), rgba(244,208,63,0.1))",
          animation: "float 6s ease-in-out infinite",
          "@keyframes float": {
            "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
            "50%": { transform: "translateY(-20px) rotate(180deg)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "15%",
          right: "8%",
          width: 80,
          height: 80,
          borderRadius: "20px",
          background:
            "linear-gradient(45deg, rgba(212,175,55,0.12), rgba(244,208,63,0.08))",
          animation: "pulse 4s ease-in-out infinite",
          "@keyframes pulse": {
            "0%, 100%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.1)" },
          },
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ px: { xs: 2, sm: 3, md: 4 }, position: "relative", zIndex: 1 }}
        >
          <Grid
            container
            spacing={{ xs: 2, sm: 3, md: 4 }}
            alignItems="center"
            justifyContent="center"
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <Fade in timeout={1000}>
                <Stack
                  spacing={4}
                  alignItems={{ xs: "center", md: "flex-start" }}
                >
                  <Slide direction="up" in timeout={1200}>
                    <Stack
                      spacing={4}
                      sx={{ textAlign: { xs: "center", md: "left" } }}
                    >
                      {/* Enhanced title with subtitle */}
                      <Stack spacing={2}>
                        <Typography
                          variant="h1"
                          sx={{
                            fontWeight: 900,
                            fontSize: {
                              xs: "2.7rem",
                              sm: "3.3rem",
                              md: "4.2rem",
                              lg: "4.8rem",
                              xl: "5.5rem",
                            },
                            textAlign: { xs: "center", md: "left" },
                            letterSpacing: {
                              xs: "1px",
                              sm: "1.5px",
                              md: "2px",
                            },
                            fontFamily:
                              '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                            background: `linear-gradient(135deg, 
                              #FFD700 0%, 
                              #d4af37 30%,
                              #f4d03f 60%, 
                              #FFD700 100%)`,
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textShadow:
                              "0 4px 20px rgba(255, 215, 0, 0.4), 0 2px 10px rgba(212, 175, 55, 0.3), 0 0 30px rgba(255, 215, 0, 0.2)",
                            lineHeight: { xs: 1.1, sm: 1.05, md: 1 },
                            mb: 1,
                            textTransform: "uppercase",
                            filter:
                              "drop-shadow(0 0 15px rgba(255, 215, 0, 0.5))",
                            WebkitTextStroke: "0.5px rgba(255, 215, 0, 0.6)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "scale(1.02)",
                              filter:
                                "drop-shadow(0 0 20px rgba(255, 215, 0, 0.7))",
                            },
                          }}
                        >
                          Tuvibe
                        </Typography>
                      </Stack>
                    </Stack>
                  </Slide>
                </Stack>
              </Fade>
            </Grid>

            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <Slide direction="left" in timeout={1500}>
                <Card
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 3, md: 4 },
                    maxWidth: { xs: "100%", sm: 450, md: 480 },
                    width: "100%",
                    borderRadius: { xs: 4, sm: 6 },
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(212, 175, 55, 0.2)",
                    boxShadow: `
                      0 8px 32px rgba(212, 175, 55, 0.15),
                      0 2px 8px rgba(0, 0, 0, 0.08),
                      inset 0 1px 0 rgba(255, 255, 255, 0.9)
                    `,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                    mx: { xs: 1, sm: 0 },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                    },
                    "&:hover": {
                      transform: {
                        xs: "translateY(-2px)",
                        sm: "translateY(-4px)",
                        md: "translateY(-8px) scale(1.02)",
                      },
                      boxShadow: `
                        0 12px 48px rgba(212, 175, 55, 0.25),
                        0 4px 16px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.95)
                      `,
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      "&::before": {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <form onSubmit={login}>
                    {/* Enhanced header with admin icon */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                      spacing={{ xs: 1.5, sm: 2 }}
                      sx={{ mb: { xs: 3, sm: 4 } }}
                    >
                      <AdminPanelSettings
                        sx={{
                          color: "#d4af37",
                          fontSize: { xs: 24, sm: 28, md: 32 },
                          filter: "drop-shadow(0 2px 4px rgba(212,175,55,0.3))",
                        }}
                      />
                      <Typography
                        textAlign="center"
                        fontWeight="800"
                        color="#1a1a1a"
                        variant="h4"
                        sx={{
                          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          letterSpacing: "1px",
                          background:
                            "linear-gradient(135deg, #d4af37, #f4d03f)",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2rem" },
                        }}
                      >
                        Admin Portal
                      </Typography>
                    </Stack>

                    <TextField
                      inputRef={rfEmail}
                      type="email"
                      label="Email Address"
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      placeholder="admin@tuvibe.org"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email
                              sx={{
                                color: "#d4af37",
                                transition: "all 0.3s ease",
                                fontSize: { xs: 20, sm: 24 },
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          borderRadius: { xs: 3, sm: 4 },
                          border: "1px solid rgba(212, 175, 55, 0.2)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          backdropFilter: "blur(10px)",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            border: "1px solid rgba(212, 175, 55, 0.4)",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.15)",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            border: `2px solid #d4af37`,
                            boxShadow: `
                              0 0 0 4px rgba(212, 175, 55, 0.1),
                              0 8px 24px rgba(212, 175, 55, 0.15)
                            `,
                            transform: "translateY(-2px)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "rgba(26, 26, 26, 0.7)",
                          fontWeight: 500,
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                          "&.Mui-focused": {
                            color: "#d4af37",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: "#1a1a1a",
                          fontWeight: 400,
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                          py: { xs: 1.2, sm: 1.5 },
                          "&::placeholder": {
                            color: "rgba(26, 26, 26, 0.4)",
                            opacity: 1,
                            fontSize: { xs: "0.85rem", sm: "0.9rem" },
                          },
                        },
                      }}
                    />

                    <TextField
                      inputRef={rfPassword}
                      type={showPassword ? "text" : "password"}
                      label="Password"
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      placeholder="Enter your secure password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Security
                              sx={{
                                color: "#d4af37",
                                transition: "all 0.3s ease",
                                fontSize: { xs: 20, sm: 24 },
                              }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{
                                color: "#d4af37",
                                transition: "all 0.3s ease",
                                p: { xs: 0.8, sm: 1 },
                                "&:hover": {
                                  color: "#b8941f",
                                  backgroundColor: "rgba(212, 175, 55, 0.1)",
                                  transform: "scale(1.1)",
                                },
                              }}
                            >
                              {showPassword ? (
                                <VisibilityOff
                                  sx={{ fontSize: { xs: 20, sm: 22 } }}
                                />
                              ) : (
                                <Visibility
                                  sx={{ fontSize: { xs: 20, sm: 22 } }}
                                />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          borderRadius: { xs: 3, sm: 4 },
                          border: "1px solid rgba(212, 175, 55, 0.2)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          backdropFilter: "blur(10px)",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            border: "1px solid rgba(212, 175, 55, 0.4)",
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.15)",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            border: `2px solid #d4af37`,
                            boxShadow: `
                              0 0 0 4px rgba(212, 175, 55, 0.1),
                              0 8px 24px rgba(212, 175, 55, 0.15)
                            `,
                            transform: "translateY(-2px)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "rgba(26, 26, 26, 0.7)",
                          fontWeight: 500,
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                          "&.Mui-focused": {
                            color: "#d4af37",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: "#1a1a1a",
                          fontWeight: 400,
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                          py: { xs: 1.2, sm: 1.5 },
                          "&::placeholder": {
                            color: "rgba(26, 26, 26, 0.4)",
                            opacity: 1,
                            fontSize: { xs: "0.85rem", sm: "0.9rem" },
                          },
                        },
                      }}
                    />

                    <Typography
                      variant="body2"
                      color="rgba(26, 26, 26, 0.7)"
                      align="center"
                      sx={{
                        mt: 2,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        fontWeight: 500,
                        "&:hover": {
                          color: "#1a1a1a",
                          transform: "translateY(-1px)",
                        },
                      }}
                      onClick={() => setOpenResetDialog(true)}
                    >
                      Forgot your password?
                      <Box
                        component="span"
                        sx={{
                          color: "#d4af37",
                          textDecoration: "underline",
                          ml: 0.5,
                          "&:hover": {
                            color: "#b8941f",
                          },
                        }}
                      >
                        Reset here
                      </Box>
                    </Typography>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={loading}
                      startIcon={
                        loading ? (
                          <CircularProgress
                            size={{ xs: 20, sm: 24 }}
                            color="inherit"
                          />
                        ) : (
                          <Login sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        )
                      }
                      sx={{
                        mt: { xs: 3, sm: 4 },
                        py: { xs: 1.5, sm: 2 },
                        borderRadius: { xs: 3, sm: 4 },
                        background: `
                          linear-gradient(135deg, 
                            #d4af37 0%, 
                            #f4d03f 50%, 
                            #f7dc6f 100%)
                        `,
                        boxShadow: `
                          0 8px 32px rgba(212, 175, 55, 0.3),
                          0 2px 8px rgba(212, 175, 55, 0.2),
                          inset 0 1px 0 rgba(255, 255, 255, 0.3)
                        `,
                        color: "#1a1a1a",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        textTransform: "none",
                        fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        position: "relative",
                        overflow: "hidden",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: "-100%",
                          width: "100%",
                          height: "100%",
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                          transition: "left 0.5s ease",
                        },
                        "&:hover": {
                          background: `
                            linear-gradient(135deg, 
                              #b8941f 0%, 
                              #d4af37 50%, 
                              #f4d03f 100%)
                          `,
                          boxShadow: `
                            0 12px 48px rgba(212, 175, 55, 0.4),
                            0 4px 16px rgba(212, 175, 55, 0.3),
                            inset 0 1px 0 rgba(255, 255, 255, 0.4)
                          `,
                          transform: {
                            xs: "translateY(-2px)",
                            sm: "translateY(-3px) scale(1.02)",
                          },
                          "&::before": {
                            left: "100%",
                          },
                        },
                        "&:active": {
                          transform: "translateY(-1px) scale(0.98)",
                        },
                        "&:disabled": {
                          background: "rgba(212, 175, 55, 0.3)",
                          color: "rgba(26, 26, 26, 0.5)",
                          transform: "none",
                          boxShadow: "none",
                          "&::before": {
                            display: "none",
                          },
                        },
                      }}
                    >
                      {loading ? "Authenticating..." : "Access Admin Portal"}
                    </Button>
                  </form>
                </Card>
              </Slide>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Developed by Card */}
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateX(-50%) translateY(-4px)",
          },
        }}
      >
        <Card
          sx={{
            position: "relative",
            borderRadius: "16px",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            border: "2px solid rgba(255, 255, 255, 0.5)",
            boxShadow: `
              0 10px 40px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(255, 255, 255, 0.3) inset,
              0 2px 0 rgba(255, 255, 255, 0.6) inset,
              0 -1px 8px rgba(0, 0, 0, 0.1) inset,
              0 0 20px rgba(255, 215, 0, 0.1)
            `,
            minWidth: { xs: "240px", sm: "280px", md: "320px" },
            maxWidth: { xs: "280px", sm: "320px", md: "360px" },
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)",
              transition: "left 0.6s ease",
              zIndex: 0,
            },
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.45)",
              borderColor: "rgba(255, 255, 255, 0.8)",
              boxShadow: `
                0 0 30px rgba(255, 215, 0, 0.4),
                0 15px 50px rgba(0, 0, 0, 0.2),
                0 0 0 1px rgba(255, 255, 255, 0.4) inset,
                0 3px 0 rgba(255, 255, 255, 0.7) inset,
                0 -1px 12px rgba(0, 0, 0, 0.15) inset,
                0 0 30px rgba(255, 215, 0, 0.2)
              `,
              "&::before": {
                left: "100%",
              },
            },
          }}
        >
          <CardContent
            sx={{
              position: "relative",
              zIndex: 1,
              p: { xs: 1.5, sm: 2.5 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: { xs: 0.25, sm: 0.5 },
              "&:last-child": {
                pb: { xs: 1.5, sm: 2.5 },
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
                color: "rgba(0, 0, 0, 0.7)",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Developed by
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "0.75rem", sm: "0.95rem", md: "1.1rem" },
                color: "rgba(0, 0, 0, 0.9)",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Carlvyne Technologies Ltd
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={openResetDialog}
        onClose={() => setOpenResetDialog(false)}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Slide}
        transitionDuration={400}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(212, 175, 55, 0.2)",
            boxShadow: "0 20px 40px rgba(212, 175, 55, 0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, 
              #d4af37 0%, 
              #f4d03f 100%)`,
            color: "#1a1a1a",
            fontWeight: 700,
            fontSize: "1.3rem",
            letterSpacing: "0.5px",
            textAlign: "center",
            py: 3,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
          >
            <Security sx={{ fontSize: 28 }} />
            <Box>Reset Password</Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <DialogContentText
            sx={{
              mb: 3,
              fontSize: "1rem",
              color: "rgba(0,0,0,0.7)",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Enter your registered email address and we'll send you a secure link
            to reset your password.
          </DialogContentText>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <TextField
              inputRef={rsEmail}
              type="email"
              label="Email Address"
              fullWidth
              margin="normal"
              placeholder="admin@tuvibe.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "rgba(0,0,0,0.6)" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(76, 175, 80, 0.5)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(76, 175, 80, 1)",
                    borderWidth: 2,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "rgba(76, 175, 80, 1)",
                },
              }}
            />
            <DialogActions sx={{ mt: 4, gap: 2, px: 0 }}>
              <Button
                onClick={() => setOpenResetDialog(false)}
                variant="outlined"
                sx={{
                  borderColor: "rgba(0,0,0,0.3)",
                  color: "rgba(0,0,0,0.7)",
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "rgba(0,0,0,0.5)",
                    backgroundColor: "rgba(0,0,0,0.05)",
                  },
                }}
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, 
                    #d4af37 0%, 
                    #f4d03f 100%)`,
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  color: "#1a1a1a",
                  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                  "&:hover": {
                    background: `linear-gradient(135deg, 
                      #b8941f 0%, 
                      #d4af37 100%)`,
                    boxShadow: "0 6px 16px rgba(212, 175, 55, 0.4)",
                    transform: "translateY(-1px)",
                  },
                }}
                disabled={resetLoading}
                startIcon={
                  resetLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Security />
                  )
                }
              >
                {resetLoading ? "Sending..." : "Send Reset Password"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
