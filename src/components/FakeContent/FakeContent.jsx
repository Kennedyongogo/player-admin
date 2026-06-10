import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Avatar,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  PersonAdd,
  RateReview,
  CheckCircle,
  Error as ErrorIcon,
  PhotoCamera,
  AttachMoney,
  Visibility,
  VisibilityOff,
  TrendingUp,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import GeoTargetPicker from "../Boost/GeoTargetPicker";

export default function FakeContent() {
  const [loading, setLoading] = useState(false);
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileLatitude, setProfileLatitude] = useState(null);
  const [profileLongitude, setProfileLongitude] = useState(null);
  const [locatingProfile, setLocatingProfile] = useState(false);
  const [profileLocationError, setProfileLocationError] = useState("");

  // Fake Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    category: "Regular",
    county: "",
    bio: "",
    birth_year: "",
    age: "",
    latitude: "",
    longitude: "",
    isVerified: false,
    autoApprove: false, // Default to pending like registration
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Fake Testimonial Form State
  const [testimonialForm, setTestimonialForm] = useState({
    public_user_id: "",
    rating: 5,
    testimonial: "",
    autoApprove: true,
  });

  // Fake Subscription Form State
  const [subscriptionForm, setSubscriptionForm] = useState({
    public_user_id: "",
    plan: "Silver",
    duration_days: 30,
  });

  // Fake Boost Form State
  const [boostForm, setBoostForm] = useState({
    public_user_id: "",
    targetCategory: "Regular",
    targetArea: "",
    targetLatitude: "",
    targetLongitude: "",
    targetRadiusKm: 10,
    durationHours: 1,
  });
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [boostLatitude, setBoostLatitude] = useState(null);
  const [boostLongitude, setBoostLongitude] = useState(null);
  const [locatingBoost, setLocatingBoost] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [userSubscription, setUserSubscription] = useState(null);
  const [boostHoursInfo, setBoostHoursInfo] = useState(null);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingBoosts, setLoadingBoosts] = useState(false);
  const [selectedBoostForExtend, setSelectedBoostForExtend] = useState(null);

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        Swal.fire({
          icon: "error",
          title: "Invalid File",
          text: "Please select an image file.",
          confirmButtonColor: "#D4AF37",
        });
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "File Too Large",
          text: "Please select an image smaller than 10MB.",
          confirmButtonColor: "#D4AF37",
        });
        return;
      }
      setProfileImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestimonialChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTestimonialForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubscriptionChange = (e) => {
    const { name, value } = e.target;
    setSubscriptionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBoostChange = (e) => {
    const { name, value } = e.target;
    setBoostForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const parseNumericValue = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const requestCurrentLocation = useCallback(({ onComplete } = {}) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by this device or browser."
      );
      if (onComplete) onComplete(false);
      return;
    }

    setLocatingBoost(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocatingBoost(false);
        setLocationError("");
        setBoostLatitude(latitude);
        setBoostLongitude(longitude);
        setBoostForm((prev) => ({
          ...prev,
          targetLatitude: String(latitude),
          targetLongitude: String(longitude),
        }));
        if (onComplete) onComplete(true);
      },
      (error) => {
        setLocatingBoost(false);
        setLocationError(
          error?.message || "Unable to fetch your current location."
        );
        if (onComplete) onComplete(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  const fetchUserSubscription = useCallback(async (userId) => {
    if (!userId) {
      setUserSubscription(null);
      setBoostHoursInfo(null);
      return;
    }

    setLoadingSubscription(true);
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const response = await fetch(
        `/api/admin-users/public-users/${userId}/subscription`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("[FakeContent] Subscription response:", data);
      if (data.success && data.data) {
        if (data.data.hasSubscription && data.data.subscription) {
          setUserSubscription(data.data.subscription);
          setBoostHoursInfo(data.data.boostHours);
        } else {
          setUserSubscription(null);
          setBoostHoursInfo(null);
        }
      } else {
        setUserSubscription(null);
        setBoostHoursInfo(null);
      }
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      setUserSubscription(null);
      setBoostHoursInfo(null);
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  const fetchUserBoosts = useCallback(async (userId) => {
    if (!userId) {
      setActiveBoosts([]);
      return;
    }

    setLoadingBoosts(true);
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const response = await fetch(
        `/api/admin-users/public-users/${userId}/boosts/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        setActiveBoosts(data.data.boosts || []);
      } else {
        setActiveBoosts([]);
      }
    } catch (error) {
      console.error("Error fetching user boosts:", error);
      setActiveBoosts([]);
    } finally {
      setLoadingBoosts(false);
    }
  }, []);

  const handleOpenBoostDialog = () => {
    if (!boostForm.public_user_id) {
      Swal.fire({
        icon: "warning",
        title: "Select User First",
        text: "Please select a user before opening the boost dialog.",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }
    // Initialize coordinates from form if available
    const lat = parseNumericValue(boostForm.targetLatitude);
    const lng = parseNumericValue(boostForm.targetLongitude);
    if (lat !== null && lng !== null) {
      setBoostLatitude(lat);
      setBoostLongitude(lng);
    }
    // Fetch subscription and boost status
    fetchUserSubscription(boostForm.public_user_id);
    fetchUserBoosts(boostForm.public_user_id);
    setBoostDialogOpen(true);
  };

  const handleCloseBoostDialog = () => {
    setBoostDialogOpen(false);
    setLocationError("");
    setSelectedBoostForExtend(null);
  };

  const handleExtendBoost = async (boost) => {
    if (!boost || !boost.id) {
      Swal.fire({
        icon: "info",
        title: "No Boost Selected",
        text: "Please select a boost to extend.",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }

    const { value: hours } = await Swal.fire({
      title: "Extend Boost",
      html: `
        <div style="text-align: left;">
          <p><strong>Current Boost:</strong></p>
          <p>Ends at: ${new Date(boost.ends_at).toLocaleString()}</p>
          <p>Category: ${boost.target_category}</p>
          <p>Area: ${boost.target_area || "N/A"}</p>
          <p>Radius: ${
            boost.radius_km ? boost.radius_km.toFixed(1) + " km" : "N/A"
          }</p>
          <br>
          <label for="extend-hours">Hours to add (0.1-24):</label>
          <input id="extend-hours" type="number" class="swal2-input" min="0.1" max="24" step="0.1" value="1" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Extend",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#D4AF37",
      preConfirm: () => {
        const hoursInput = document.getElementById("extend-hours");
        const hours = parseFloat(hoursInput?.value || "1");
        if (!hours || hours < 0.1 || hours > 24) {
          Swal.showValidationMessage("Hours must be between 0.1 and 24");
          return false;
        }
        return hours;
      },
    });

    if (!hours) return;

    setBoostLoading(true);
    try {
      const token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      const response = await fetch(
        `/api/admin-users/boosts/${boost.id}/extend`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            additionalHours: hours,
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire({
          icon: "success",
          title: "Boost Extended!",
          text: `Boost extended by ${hours} hour(s).`,
          confirmButtonColor: "#D4AF37",
        });
        await fetchUserBoosts(boostForm.public_user_id);
        await fetchUserSubscription(boostForm.public_user_id);
      } else {
        throw new Error(data.message || "Failed to extend boost");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to extend boost",
        confirmButtonColor: "#D4AF37",
      });
    } finally {
      setBoostLoading(false);
    }
  };

  const sanitizedBoostRadiusKm = Math.min(
    200,
    Math.max(1, Number.parseFloat(boostForm.targetRadiusKm) || 10)
  );

  // Fetch users for autocomplete (only fake profiles)
  const fetchUsers = async (query = "") => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: "1",
        pageSize: "50", // Limit to 50 for autocomplete
        is_fake: "true", // Only fetch fake profiles
      });
      if (query) {
        params.append("q", query);
      }

      const response = await fetch(`/api/admin-users/public-users?${params}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers("");
  }, []);

  // Sync profileForm latitude/longitude with location picker state
  useEffect(() => {
    const lat = parseNumericValue(profileForm.latitude);
    const lon = parseNumericValue(profileForm.longitude);
    
    // Only update if values have changed to avoid loops
    if (lat !== profileLatitude || lon !== profileLongitude) {
      setProfileLatitude(lat);
      setProfileLongitude(lon);
    }
  }, [profileForm.latitude, profileForm.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateFakeProfile = async () => {
    if (!profileForm.name || !profileForm.username || !profileForm.email) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Name, username, and email are required",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }

    // Profile image is required (same as registration)
    if (!profileImage) {
      Swal.fire({
        icon: "error",
        title: "Profile Image Required",
        text: "Profile image is required to create a user profile.",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");

      // Use FormData for file upload (same as registration)
      const formData = new FormData();
      formData.append("profile_image", profileImage);
      formData.append("name", profileForm.name);
      formData.append("username", profileForm.username);
      formData.append("email", profileForm.email);
      if (profileForm.phone) formData.append("phone", profileForm.phone);
      if (profileForm.password)
        formData.append("password", profileForm.password);
      if (profileForm.gender) formData.append("gender", profileForm.gender);
      formData.append("category", profileForm.category);
      if (profileForm.county) formData.append("county", profileForm.county);
      if (profileForm.bio) formData.append("bio", profileForm.bio);
      if (profileForm.birth_year)
        formData.append("birth_year", profileForm.birth_year);
      if (profileForm.age) formData.append("age", profileForm.age);
      if (profileForm.latitude)
        formData.append("latitude", profileForm.latitude);
      if (profileForm.longitude)
        formData.append("longitude", profileForm.longitude);
      formData.append("isVerified", profileForm.isVerified);
      formData.append("autoApprove", profileForm.autoApprove);

      const response = await fetch(
        "/api/admin-users/public-users/create-fake",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - browser will set it with boundary for FormData
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const loginInfo = data.data.loginCredentials
          ? `\n\nLogin Credentials:\nEmail: ${data.data.loginCredentials.email}\nPassword: ${data.data.loginCredentials.password}`
          : "";
        setSuccessMessage(
          `Fake profile created successfully! User ID: ${data.data.user.id}${loginInfo}`
        );
        Swal.fire({
          icon: "success",
          title: "Profile Created!",
          html: `Fake profile "<strong>${
            profileForm.name
          }</strong>" has been created successfully.<br><br><strong>User ID:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${
            data.data.user.id
          }</code>${
            data.data.loginCredentials
              ? `<br><br><strong>Login Credentials:</strong><br>Email: <code>${data.data.loginCredentials.email}</code><br>Password: <code>${data.data.loginCredentials.password}</code>`
              : ""
          }<br><br><small style="color: #666;">You can now search and select this user in the Testimonial and Subscription forms below.</small>`,
          confirmButtonColor: "#D4AF37",
        });
        // Reset form
        setProfileForm({
          name: "",
          username: "",
          email: "",
          phone: "",
          password: "",
          gender: "",
          category: "Regular",
          county: "",
          bio: "",
          birth_year: "",
          age: "",
          latitude: "",
          longitude: "",
          isVerified: false,
          autoApprove: false,
        });
        setProfileImage(null);
        setProfileImagePreview(null);
        // Reset location picker
        setProfileLatitude(null);
        setProfileLongitude(null);
        setProfileLocationError("");
        // Refresh users list to include the newly created user (but don't auto-select)
        fetchUsers();
      } else {
        throw new Error(data.message || "Failed to create fake profile");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to create fake profile");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to create fake profile",
        confirmButtonColor: "#D4AF37",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFakeTestimonial = async () => {
    if (!testimonialForm.public_user_id || !testimonialForm.rating) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "User ID and rating are required",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }

    setTestimonialLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "/api/admin-users/testimonials/create-fake",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            public_user_id: testimonialForm.public_user_id,
            rating: parseInt(testimonialForm.rating),
            testimonial: testimonialForm.testimonial || undefined,
            autoApprove: testimonialForm.autoApprove,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Fake testimonial created successfully!");
        Swal.fire({
          icon: "success",
          title: "Testimonial Created!",
          text: "Fake testimonial has been created and approved.",
          confirmButtonColor: "#D4AF37",
        });
        // Reset form
        setTestimonialForm({
          public_user_id: "",
          rating: 5,
          testimonial: "",
          autoApprove: true,
        });
      } else {
        throw new Error(data.message || "Failed to create fake testimonial");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to create fake testimonial");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to create fake testimonial",
        confirmButtonColor: "#D4AF37",
      });
    } finally {
      setTestimonialLoading(false);
    }
  };

  const handleCreateFakeSubscription = async () => {
    if (!subscriptionForm.public_user_id || !subscriptionForm.plan) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "User ID and plan are required",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }

    setSubscriptionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "/api/admin-users/subscriptions/create-fake",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            public_user_id: subscriptionForm.public_user_id,
            plan: subscriptionForm.plan,
            duration_days: parseInt(subscriptionForm.duration_days) || 30,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Fake subscription created successfully!");
        Swal.fire({
          icon: "success",
          title: "Subscription Created!",
          html: `Fake subscription has been created successfully.<br><br><strong>Plan:</strong> ${
            data.data.subscription.plan
          }<br><strong>Amount:</strong> KES ${
            data.data.subscription.amount
          }<br><strong>Status:</strong> ${
            data.data.subscription.status
          }<br><strong>Expires:</strong> ${new Date(
            data.data.subscription.expires_at
          ).toLocaleDateString()}`,
          confirmButtonColor: "#D4AF37",
        });
        // Reset form
        setSubscriptionForm({
          public_user_id: "",
          plan: "Silver",
          duration_days: 30,
        });
      } else {
        throw new Error(data.message || "Failed to create fake subscription");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to create fake subscription");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to create fake subscription",
        confirmButtonColor: "#D4AF37",
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleCreateFakeBoost = async () => {
    if (!boostForm.public_user_id || !boostForm.targetCategory) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "User ID and target category are required",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }

    // Use coordinates from state (map) or form
    const lat =
      boostLatitude !== null
        ? boostLatitude
        : parseNumericValue(boostForm.targetLatitude);
    const lng =
      boostLongitude !== null
        ? boostLongitude
        : parseNumericValue(boostForm.targetLongitude);

    if (lat === null || lng === null) {
      Swal.fire({
        icon: "error",
        title: "Missing Coordinates",
        text: "Please select a location on the map or provide coordinates",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }

    const duration = parseFloat(boostForm.durationHours);
    if (!duration || duration <= 0 || duration > 24) {
      Swal.fire({
        icon: "error",
        title: "Invalid Duration",
        text: "Duration must be between 0.1 and 24 hours",
        confirmButtonColor: "#D4AF37",
      });
      return;
    }

    setBoostLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin-users/boosts/create-fake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          public_user_id: boostForm.public_user_id,
          targetCategory: boostForm.targetCategory,
          targetArea: boostForm.targetArea || undefined,
          targetLatitude: lat,
          targetLongitude: lng,
          targetRadiusKm: sanitizedBoostRadiusKm,
          durationHours: duration,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Fake profile boost created successfully!");
        Swal.fire({
          icon: "success",
          title: "Boost Created!",
          html: `Fake profile boost has been created successfully.<br><br><strong>Duration:</strong> ${duration} hour(s)<br><strong>Target Category:</strong> ${
            boostForm.targetCategory
          }<br><strong>Radius:</strong> ${
            boostForm.targetRadiusKm
          } km<br><strong>Ends At:</strong> ${new Date(
            data.data.boost.ends_at
          ).toLocaleString()}`,
          confirmButtonColor: "#D4AF37",
        });
        // Refresh subscription and boost status
        if (boostForm.public_user_id) {
          await fetchUserSubscription(boostForm.public_user_id);
          await fetchUserBoosts(boostForm.public_user_id);
        }
        // Reset form
        setBoostForm({
          public_user_id: "",
          targetCategory: "Regular",
          targetArea: "",
          targetLatitude: "",
          targetLongitude: "",
          targetRadiusKm: 10,
          durationHours: 1,
        });
        setBoostLatitude(null);
        setBoostLongitude(null);
        setLocationError("");
        setBoostDialogOpen(false);
      } else {
        throw new Error(data.message || "Failed to create fake boost");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to create fake boost");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to create fake boost",
        confirmButtonColor: "#D4AF37",
      });
    } finally {
      setBoostLoading(false);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 3,
          background: "linear-gradient(45deg, #D4AF37, #B8941F)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Fake Content Management
      </Typography>

      {successMessage && (
        <Alert
          severity="success"
          icon={<CheckCircle />}
          onClose={() => setSuccessMessage("")}
          sx={{ mb: 3 }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          onClose={() => setErrorMessage("")}
          sx={{ mb: 3 }}
        >
          {errorMessage}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Instructions
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Creating Fake Profiles:</strong>
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: 2, pl: 2 }}>
            <ul>
              <li>
                Name, username, email, and profile image are required fields
                (same as registration)
              </li>
              <li>
                Profile image must be uploaded using the file picker (same as
                user registration)
              </li>
              <li>
                Phone validation and age checks are bypassed by default for fake
                users
              </li>
              <li>
                By default, photos and bio are set to "pending" (like
                registration) - use Auto-Approve to approve immediately
              </li>
              <li>Verified badge can be enabled for premium appearance</li>
              <li>
                Password is optional - random password generated if not provided
              </li>
              <li>
                Fake profiles are created exactly like real user registrations
              </li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Creating Fake Testimonials:</strong>
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: 2, pl: 2 }}>
            <ul>
              <li>
                User ID is required (get this from the created fake profile
                response)
              </li>
              <li>Rating must be between 1-5 stars</li>
              <li>Testimonial text is optional but recommended</li>
              <li>
                Auto-approve will make the testimonial visible immediately on
                the Pricing page
              </li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Creating Fake Subscriptions:</strong>
          </Typography>
          <Typography variant="body2" component="div" sx={{ pl: 2 }}>
            <ul>
              <li>
                User ID is required (get this from the created fake profile
                response)
              </li>
              <li>Plan must be either Silver or Gold</li>
              <li>Amount is automatically calculated based on user category</li>
              <li>
                Duration defaults to 30 days but can be customized (1-365 days)
              </li>
              <li>
                Subscription will be immediately active and badges will be
                synced automatically
              </li>
              <li>Regular users: Silver = KES 149, Gold = KES 249</li>
              <li>Premium users: Silver = KES 199, Gold = KES 349</li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Creating Fake Profile Boosts:</strong>
          </Typography>
          <Typography variant="body2" component="div" sx={{ pl: 2 }}>
            <ul>
              <li>
                User ID is required (get this from the created fake profile
                response)
              </li>
              <li>Target category is required (Regular, Sugar Mummy, etc.)</li>
              <li>
                Target latitude and longitude are required for geotargeting
              </li>
              <li>
                Target radius defaults to 10 km but can be customized (1-200 km)
              </li>
              <li>
                Duration can be set between 0.1 and 24 hours (default: 1 hour)
              </li>
              <li>
                Target area (county) is optional but recommended for better
                targeting
              </li>
              <li>
                Admin-created boosts bypass all subscription checks and are free
              </li>
            </ul>
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={3}>
        {/* Create Fake Profile Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <PersonAdd sx={{ color: "#D4AF37", fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Create Fake Profile
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField
                label="Name *"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                fullWidth
                required
              />
              <TextField
                label="Username *"
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                fullWidth
                required
              />
              <TextField
                label="Email *"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                fullWidth
                required
              />
              <TextField
                label="Phone"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                fullWidth
                placeholder="+254700000000"
                helperText="Optional - defaults to fake number if not provided"
              />
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={profileForm.password}
                onChange={handleProfileChange}
                fullWidth
                helperText="Optional - random password generated if not provided"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={profileForm.gender}
                  onChange={handleProfileChange}
                  label="Gender"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  name="category"
                  value={profileForm.category}
                  onChange={handleProfileChange}
                  label="Category *"
                >
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Sugar Mummy">Sugar Mummy</MenuItem>
                  <MenuItem value="Sponsor">Sponsor</MenuItem>
                  <MenuItem value="Ben 10">Ben 10</MenuItem>
                  <MenuItem value="Urban Chics">Urban Chics</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="County"
                name="county"
                value={profileForm.county}
                onChange={handleProfileChange}
                fullWidth
              />
              <TextField
                label="Bio"
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                fullWidth
                multiline
                rows={3}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Birth Year"
                    name="birth_year"
                    type="number"
                    value={profileForm.birth_year}
                    onChange={handleProfileChange}
                    fullWidth
                    inputProps={{ min: 1900, max: new Date().getFullYear() }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Age"
                    name="age"
                    type="number"
                    value={profileForm.age}
                    onChange={handleProfileChange}
                    fullWidth
                    inputProps={{ min: 18, max: 120 }}
                    helperText="Alternative to birth year"
                  />
                </Grid>
              </Grid>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Profile Image * (Required)
                </Typography>
                <input
                  accept="image/*"
                  type="file"
                  id="profile-image-upload"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
                <label htmlFor="profile-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    sx={{
                      borderColor: profileImage
                        ? "#4CAF50"
                        : "rgba(0, 0, 0, 0.23)",
                      color: profileImage ? "#4CAF50" : "rgba(0, 0, 0, 0.6)",
                      "&:hover": {
                        borderColor: profileImage ? "#4CAF50" : "#D4AF37",
                        backgroundColor: profileImage
                          ? "rgba(76, 175, 80, 0.05)"
                          : "rgba(212, 175, 55, 0.05)",
                      },
                    }}
                  >
                    {profileImage ? profileImage.name : "Choose Profile Image"}
                  </Button>
                </label>
                {profileImagePreview && (
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={profileImagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: "200px",
                        maxHeight: "200px",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Location (Optional)
                </Typography>
                <GeoTargetPicker
                  latitude={profileLatitude}
                  longitude={profileLongitude}
                  radiusKm={null}
                  onLocationChange={(lat, lon) => {
                    setProfileLatitude(lat);
                    setProfileLongitude(lon);
                    setProfileForm((prev) => ({
                      ...prev,
                      latitude: lat !== null && lat !== undefined ? String(lat) : "",
                      longitude: lon !== null && lon !== undefined ? String(lon) : "",
                    }));
                    setProfileLocationError("");
                  }}
                  onRequestCurrentLocation={() => {
                    if (typeof navigator === "undefined" || !navigator.geolocation) {
                      setProfileLocationError(
                        "Geolocation is not supported by this device or browser."
                      );
                      return;
                    }

                    setLocatingProfile(true);
                    setProfileLocationError("");
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const { latitude, longitude } = position.coords;
                        setLocatingProfile(false);
                        setProfileLocationError("");
                        setProfileLatitude(latitude);
                        setProfileLongitude(longitude);
                        setProfileForm((prev) => ({
                          ...prev,
                          latitude: String(latitude),
                          longitude: String(longitude),
                        }));
                      },
                      (error) => {
                        setLocatingProfile(false);
                        setProfileLocationError(
                          error?.message || "Unable to fetch your current location."
                        );
                      },
                      {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 30000,
                      }
                    );
                  }}
                  locating={locatingProfile}
                  locationError={profileLocationError}
                  onCountySuggested={(county) => {
                    if (county && typeof county === "string" && county.trim()) {
                      setProfileForm((prev) => ({
                        ...prev,
                        county: county.trim(),
                      }));
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Chip
                  label={profileForm.isVerified ? "Verified" : "Not Verified"}
                  color={profileForm.isVerified ? "success" : "default"}
                  onClick={() =>
                    setProfileForm((prev) => ({
                      ...prev,
                      isVerified: !prev.isVerified,
                    }))
                  }
                  sx={{ cursor: "pointer" }}
                />
                <Chip
                  label={
                    profileForm.autoApprove ? "Auto-Approve" : "Manual Approval"
                  }
                  color={profileForm.autoApprove ? "primary" : "default"}
                  onClick={() =>
                    setProfileForm((prev) => ({
                      ...prev,
                      autoApprove: !prev.autoApprove,
                    }))
                  }
                  sx={{ cursor: "pointer" }}
                />
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCreateFakeProfile}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <PersonAdd />
                }
                sx={{
                  bgcolor: "#D4AF37",
                  "&:hover": { bgcolor: "#B8941F" },
                  py: 1.5,
                }}
              >
                {loading ? "Creating..." : "Create Fake Profile"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Create Fake Testimonial Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <RateReview sx={{ color: "#D4AF37", fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Create Fake Testimonial
              </Typography>
            </Box>

            <Stack spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Select User *</InputLabel>
                <Select
                  value={testimonialForm.public_user_id || ""}
                  onChange={(e) => {
                    setTestimonialForm((prev) => ({
                      ...prev,
                      public_user_id: e.target.value,
                    }));
                  }}
                  label="Select User *"
                  disabled={loadingUsers}
                >
                  {loadingUsers ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading users...
                    </MenuItem>
                  ) : users.length === 0 ? (
                    <MenuItem disabled>No users available</MenuItem>
                  ) : (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {user.photo && (
                            <Avatar
                              src={`/uploads/${user.photo}`}
                              sx={{ width: 24, height: 24 }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2">
                              {user.name || "Unknown"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {testimonialForm.public_user_id && (
                <Chip
                  label={`Selected: ${testimonialForm.public_user_id}`}
                  onDelete={() => {
                    setTestimonialForm((prev) => ({
                      ...prev,
                      public_user_id: "",
                    }));
                  }}
                  color="primary"
                  size="small"
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Rating *</InputLabel>
                <Select
                  name="rating"
                  value={testimonialForm.rating}
                  onChange={handleTestimonialChange}
                  label="Rating *"
                >
                  <MenuItem value={1}>1 Star</MenuItem>
                  <MenuItem value={2}>2 Stars</MenuItem>
                  <MenuItem value={3}>3 Stars</MenuItem>
                  <MenuItem value={4}>4 Stars</MenuItem>
                  <MenuItem value={5}>5 Stars</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Testimonial Text"
                name="testimonial"
                value={testimonialForm.testimonial}
                onChange={handleTestimonialChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Enter testimonial text here..."
              />
              <Box>
                <Chip
                  label={
                    testimonialForm.autoApprove
                      ? "Auto-Approve"
                      : "Manual Approval"
                  }
                  color={testimonialForm.autoApprove ? "primary" : "default"}
                  onClick={() =>
                    setTestimonialForm((prev) => ({
                      ...prev,
                      autoApprove: !prev.autoApprove,
                    }))
                  }
                  sx={{ cursor: "pointer" }}
                />
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCreateFakeTestimonial}
                disabled={testimonialLoading}
                startIcon={
                  testimonialLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <RateReview />
                  )
                }
                sx={{
                  bgcolor: "#D4AF37",
                  "&:hover": { bgcolor: "#B8941F" },
                  py: 1.5,
                }}
              >
                {testimonialLoading ? "Creating..." : "Create Fake Testimonial"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Create Fake Subscription Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <AttachMoney sx={{ color: "#D4AF37", fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Create Fake Subscription
              </Typography>
            </Box>

            <Stack spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Select User *</InputLabel>
                <Select
                  value={subscriptionForm.public_user_id || ""}
                  onChange={(e) => {
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      public_user_id: e.target.value,
                    }));
                  }}
                  label="Select User *"
                  disabled={loadingUsers}
                >
                  {loadingUsers ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading users...
                    </MenuItem>
                  ) : users.length === 0 ? (
                    <MenuItem disabled>No users available</MenuItem>
                  ) : (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {user.photo && (
                            <Avatar
                              src={`/uploads/${user.photo}`}
                              sx={{ width: 24, height: 24 }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2">
                              {user.name || "Unknown"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {subscriptionForm.public_user_id && (
                <Chip
                  label={`Selected: ${subscriptionForm.public_user_id}`}
                  onDelete={() => {
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      public_user_id: "",
                    }));
                  }}
                  color="primary"
                  size="small"
                />
              )}
              <FormControl fullWidth>
                <InputLabel>Plan *</InputLabel>
                <Select
                  name="plan"
                  value={subscriptionForm.plan}
                  onChange={handleSubscriptionChange}
                  label="Plan *"
                >
                  <MenuItem value="Silver">Silver</MenuItem>
                  <MenuItem value="Gold">Gold</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Duration (Days)"
                name="duration_days"
                type="number"
                value={subscriptionForm.duration_days}
                onChange={handleSubscriptionChange}
                fullWidth
                inputProps={{ min: 1, max: 365 }}
                helperText="Subscription duration in days (default: 30)"
              />
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontSize: "0.875rem" }}
              >
                <strong>Note:</strong> Amount will be automatically calculated
                based on user category:
                <br />• Regular users: Silver = KES 149, Gold = KES 249
                <br />• Premium users: Silver = KES 199, Gold = KES 349
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCreateFakeSubscription}
                disabled={subscriptionLoading}
                startIcon={
                  subscriptionLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <AttachMoney />
                  )
                }
                sx={{
                  bgcolor: "#D4AF37",
                  "&:hover": { bgcolor: "#B8941F" },
                  py: 1.5,
                }}
              >
                {subscriptionLoading
                  ? "Creating..."
                  : "Create Fake Subscription"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Create Fake Boost Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <TrendingUp sx={{ color: "#D4AF37", fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Create Fake Profile Boost
              </Typography>
            </Box>

            <Stack spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Select User *</InputLabel>
                <Select
                  value={boostForm.public_user_id || ""}
                  onChange={(e) => {
                    setBoostForm((prev) => ({
                      ...prev,
                      public_user_id: e.target.value,
                    }));
                  }}
                  label="Select User *"
                  disabled={loadingUsers}
                >
                  {loadingUsers ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading users...
                    </MenuItem>
                  ) : users.length === 0 ? (
                    <MenuItem disabled>No users available</MenuItem>
                  ) : (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {user.photo && (
                            <Avatar
                              src={`/uploads/${user.photo}`}
                              sx={{ width: 24, height: 24 }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2">
                              {user.name || "Unknown"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {boostForm.public_user_id && (
                <Chip
                  label={`Selected: ${boostForm.public_user_id}`}
                  onDelete={() => {
                    setBoostForm((prev) => ({
                      ...prev,
                      public_user_id: "",
                    }));
                  }}
                  color="primary"
                  size="small"
                />
              )}
              <Button
                variant="contained"
                fullWidth
                onClick={handleOpenBoostDialog}
                disabled={!boostForm.public_user_id || boostLoading}
                startIcon={<TrendingUp />}
                sx={{
                  bgcolor: "#D4AF37",
                  "&:hover": { bgcolor: "#B8941F" },
                  py: 1.5,
                }}
              >
                {boostForm.public_user_id
                  ? "Open Boost Dialog"
                  : "Select User First"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Boost Dialog */}
        <Dialog
          open={boostDialogOpen}
          onClose={handleCloseBoostDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "20px",
              maxHeight: "90vh",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #D4AF37, #B8941F)",
              color: "#1a1a1a",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <TrendingUp />
            Create Fake Profile Boost
          </DialogTitle>
          <DialogContent
            sx={{
              pt: 3,
              pb: 0,
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(90vh - 120px)",
              overflowY: "auto",
            }}
          >
            <Stack spacing={2.5}>
              {loadingSubscription || loadingBoosts ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : null}

              {!userSubscription && !loadingSubscription ? (
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: "12px",
                    bgcolor: "rgba(255, 152, 0, 0.08)",
                    border: "1px solid rgba(255, 152, 0, 0.2)",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    No Active Subscription
                  </Typography>
                  <Typography variant="body2">
                    This user does not have an active subscription.
                    Admin-created boosts will bypass subscription checks, but
                    for realistic testing, consider creating a subscription
                    first.
                  </Typography>
                </Alert>
              ) : null}

              {userSubscription && boostHoursInfo && (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: "12px",
                    bgcolor: "rgba(33, 150, 243, 0.08)",
                    border: "1px solid rgba(33, 150, 243, 0.2)",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    User's Boost Hours Package
                  </Typography>
                  <Typography variant="body2">
                    <strong>Plan:</strong> {userSubscription.plan || "N/A"} ·{" "}
                    <strong>Total Daily Hours:</strong>{" "}
                    {boostHoursInfo.totalHoursPerDay || 0} hrs ·{" "}
                    <strong>Used Today:</strong>{" "}
                    {boostHoursInfo.usedHours?.toFixed(1) || 0} hrs ·{" "}
                    <strong>Remaining:</strong>{" "}
                    {boostHoursInfo.remainingHours?.toFixed(1) || 0} hrs
                  </Typography>
                  {boostHoursInfo.remainingHours <= 0 ? (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        color: "#d32f2f",
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ Daily boost hours exhausted. User cannot create new
                      boosts until tomorrow (admin can still bypass).
                    </Typography>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        color: "rgba(26, 26, 26, 0.65)",
                      }}
                    >
                      Default boost duration:{" "}
                      {boostHoursInfo.defaultDurationPerBoost || 1} hour
                      {boostHoursInfo.defaultDurationPerBoost > 1
                        ? "s"
                        : ""}{" "}
                      per boost.
                    </Typography>
                  )}
                </Alert>
              )}

              {activeBoosts.length > 0 && (
                <Alert
                  severity="success"
                  sx={{
                    borderRadius: "12px",
                    bgcolor: "rgba(76, 175, 80, 0.08)",
                    border: "1px solid rgba(76, 175, 80, 0.2)",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Active Boosts ({activeBoosts.length})
                  </Typography>
                  <Stack spacing={1}>
                    {activeBoosts.map((boost) => {
                      const endsAt = new Date(boost.ends_at);
                      const now = new Date();
                      const remainingMs = endsAt.getTime() - now.getTime();
                      const remainingHours = Math.floor(
                        remainingMs / (1000 * 60 * 60)
                      );
                      const remainingMinutes = Math.floor(
                        (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
                      );
                      return (
                        <Box
                          key={boost.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: "rgba(255, 255, 255, 0.5)",
                            border: "1px solid rgba(76, 175, 80, 0.2)",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                              mb: 0.5,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {boost.target_category}
                                {boost.target_area
                                  ? ` · ${boost.target_area}`
                                  : ""}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Ends: {endsAt.toLocaleString()}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {" · "}
                                {remainingHours > 0
                                  ? `${remainingHours}h ${remainingMinutes}m left`
                                  : remainingMinutes > 0
                                  ? `${remainingMinutes}m left`
                                  : "Expired"}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleExtendBoost(boost)}
                              disabled={boostLoading}
                              sx={{
                                minWidth: "auto",
                                px: 1.5,
                                py: 0.5,
                                fontSize: "0.75rem",
                                textTransform: "none",
                              }}
                            >
                              Extend
                            </Button>
                          </Box>
                          {boost.radius_km && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Radius: {boost.radius_km.toFixed(1)} km
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Alert>
              )}

              <Alert
                severity="info"
                sx={{
                  borderRadius: "12px",
                  bgcolor: "rgba(33, 150, 243, 0.08)",
                  border: "1px solid rgba(33, 150, 243, 0.2)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Admin Boost Creation
                </Typography>
                <Typography variant="body2">
                  Admin-created boosts bypass all subscription checks and are
                  free. The boost will be active immediately and expire after
                  the specified duration.
                </Typography>
              </Alert>

              <FormControl fullWidth>
                <InputLabel>Target Category</InputLabel>
                <Select
                  value={boostForm.targetCategory}
                  label="Target Category"
                  onChange={(e) =>
                    setBoostForm((prev) => ({
                      ...prev,
                      targetCategory: e.target.value,
                    }))
                  }
                  disabled={boostLoading}
                >
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Sugar Mummy">Sugar Mummy</MenuItem>
                  <MenuItem value="Sponsor">Sponsor</MenuItem>
                  <MenuItem value="Ben 10">Ben 10</MenuItem>
                  <MenuItem value="Urban Chics">Urban Chics</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Hours to boost"
                type="number"
                value={boostForm.durationHours}
                onChange={(e) =>
                  setBoostForm((prev) => ({
                    ...prev,
                    durationHours: e.target.value,
                  }))
                }
                inputProps={{
                  min: 0.1,
                  max: 24,
                  step: 0.1,
                }}
                helperText="Boost duration (0.1-24 hours)"
                fullWidth
                disabled={boostLoading}
              />

              <TextField
                label="Target radius (km)"
                type="number"
                value={boostForm.targetRadiusKm}
                onChange={(e) =>
                  setBoostForm((prev) => ({
                    ...prev,
                    targetRadiusKm: e.target.value,
                  }))
                }
                inputProps={{
                  min: 1,
                  max: 200,
                  step: 0.5,
                }}
                helperText={`Boost reaches users within ${sanitizedBoostRadiusKm.toFixed(
                  1
                )} km of your target point.`}
                fullWidth
                disabled={boostLoading}
              />

              <GeoTargetPicker
                latitude={boostLatitude}
                longitude={boostLongitude}
                radiusKm={sanitizedBoostRadiusKm}
                onLocationChange={(lat, lon) => {
                  setBoostLatitude(lat);
                  setBoostLongitude(lon);
                  setBoostForm((prev) => ({
                    ...prev,
                    targetLatitude: lat !== null ? String(lat) : "",
                    targetLongitude: lon !== null ? String(lon) : "",
                  }));
                  setLocationError("");
                }}
                onRequestCurrentLocation={() =>
                  requestCurrentLocation({
                    onComplete: (success) => {
                      if (!success) {
                        setBoostLatitude(null);
                        setBoostLongitude(null);
                      }
                    },
                  })
                }
                locating={boostLoading ? false : locatingBoost}
                locationError={locationError}
                onCountySuggested={(county) => {
                  setBoostForm((prev) => ({
                    ...prev,
                    targetArea: county || "",
                  }));
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "rgba(26, 26, 26, 0.75)" }}
                >
                  Selected location:
                </Typography>
                <Chip
                  label={boostForm.targetArea || "None"}
                  size="small"
                  sx={{
                    bgcolor: boostForm.targetArea
                      ? "rgba(212, 175, 55, 0.15)"
                      : "rgba(0, 0, 0, 0.05)",
                    color: "rgba(26, 26, 26, 0.8)",
                    fontWeight: 600,
                  }}
                />
                {!boostForm.targetArea && (
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(26, 26, 26, 0.55)" }}
                  >
                    Use the map search above to choose a target area.
                  </Typography>
                )}
              </Box>

              <Alert
                severity="success"
                sx={{
                  borderRadius: "12px",
                  bgcolor: "rgba(76, 175, 80, 0.08)",
                  border: "1px solid rgba(76, 175, 80, 0.2)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Boost Preview
                </Typography>
                <Typography variant="body2">
                  This boost will run for{" "}
                  <strong>
                    {parseFloat(boostForm.durationHours) || 1} hour
                    {parseFloat(boostForm.durationHours) > 1 ? "s" : ""}
                  </strong>{" "}
                  covering roughly {sanitizedBoostRadiusKm.toFixed(1)} km.
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              p: 3,
              pt: 2,
              borderTop: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            }}
          >
            <Button
              onClick={handleCloseBoostDialog}
              disabled={boostLoading}
              sx={{
                color: "rgba(26, 26, 26, 0.7)",
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFakeBoost}
              variant="contained"
              disabled={
                boostLoading ||
                boostLatitude === null ||
                boostLongitude === null
              }
              startIcon={
                boostLoading ? <CircularProgress size={20} /> : <TrendingUp />
              }
              sx={{
                background: "linear-gradient(45deg, #D4AF37, #B8941F)",
                color: "#1a1a1a",
                fontWeight: 700,
                "&:hover": {
                  background: "linear-gradient(45deg, #B8941F, #D4AF37)",
                },
                "&:disabled": {
                  background: "rgba(0, 0, 0, 0.12)",
                  color: "rgba(0, 0, 0, 0.26)",
                },
              }}
            >
              {boostLoading ? "Creating..." : "Create Boost"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}
