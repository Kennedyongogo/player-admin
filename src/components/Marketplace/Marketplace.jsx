import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  FormControlLabel,
  Switch,
  CardMedia,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Store as StoreIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as TagIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { Tabs, Tab, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";
import { evaluatePhoneInput } from "../../utils/phoneValidation";

const Marketplace = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    hot_deals: 0,
    weekend_picks: 0,
    featured: 0,
  });
  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    price: "",
    whatsapp_number: "",
    is_featured: false,
    tag: "none",
  });
  const [whatsappError, setWhatsappError] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({}); // Track current image index for each item

  const tagTabs = [
    { label: "All Items", value: "all", count: tabCounts.all },
    { label: "Hot Deals", value: "hot_deals", count: tabCounts.hot_deals },
    {
      label: "Weekend Picks",
      value: "weekend_picks",
      count: tabCounts.weekend_picks,
    },
    { label: "Featured", value: "featured", count: tabCounts.featured },
  ];

  useEffect(() => {
    fetchItems();
  }, [page, rowsPerPage, activeTab]);

  useEffect(() => {
    fetchAllItemsForCounts();
  }, []);

  // Auto-transition images for each market item
  useEffect(() => {
    if (items.length === 0) return;

    const intervals = {};
    const newIndices = {};

    items.forEach((item) => {
      const images = item.images || [];
      const itemId = item.id;

      // Preload all images for smooth transitions
      images.forEach((imagePath) => {
        const img = new Image();
        img.src = getImageUrl(imagePath);
      });

      // Always reset to 0 for new items
      newIndices[itemId] = 0;

      if (images.length > 1) {
        const imageCount = images.length;

        // Set up interval for this item
        intervals[itemId] = setInterval(() => {
          setCurrentImageIndex((prev) => {
            const currentIdx = prev[itemId] || 0;
            const nextIdx = (currentIdx + 1) % imageCount;
            return { ...prev, [itemId]: nextIdx };
          });
        }, 3000); // Change image every 3 seconds
      }
    });

    // Set all indices to 0
    setCurrentImageIndex(newIndices);

    // Cleanup intervals on unmount or when items change
    return () => {
      Object.values(intervals).forEach((interval) => clearInterval(interval));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const currentTag = tagTabs[activeTab]?.value;
      let url = `/api/market?page=${page + 1}&limit=${rowsPerPage}`;
      if (currentTag && currentTag !== "all" && currentTag !== "featured") {
        url += `&tag=${currentTag}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        let filteredData = data.data || [];

        // Filter featured items if "featured" tab is selected
        if (currentTag === "featured") {
          filteredData = filteredData.filter((item) => item.is_featured);
        }

        setItems(filteredData);
        setTotalItems(filteredData.length);
      } else {
        setError("Failed to fetch items: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      setError("Error fetching items: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllItemsForCounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/market?limit=1000`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        updateTabCounts(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching item counts:", err);
    }
  };

  const updateTabCounts = (itemsData) => {
    const counts = {
      all: itemsData.length,
      hot_deals: 0,
      weekend_picks: 0,
      featured: 0,
    };

    itemsData.forEach((item) => {
      if (item.tag === "hot_deals") counts.hot_deals++;
      if (item.tag === "weekend_picks") counts.weekend_picks++;
      if (item.is_featured) counts.featured++;
    });

    setTabCounts(counts);
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files]);
      const previews = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews.push(e.target.result);
          if (previews.length === files.length) {
            setImagePreviews((prev) => [...prev, ...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImagePreview = (index) => {
    const newPreviews = [...imagePreviews];
    const newSelected = [...selectedImages];

    // Determine if it's an existing image or new image
    if (index < existingImages.length) {
      // Remove existing image
      const newExisting = [...existingImages];
      newExisting.splice(index, 1);
      setExistingImages(newExisting);
      newPreviews.splice(index, 1);
      setImagePreviews(newPreviews);
    } else {
      // Remove new image
      const newIndex = index - existingImages.length;
      newSelected.splice(newIndex, 1);
      setSelectedImages(newSelected);
      newPreviews.splice(index, 1);
      setImagePreviews(newPreviews);
    }
  };

  const handleCreateItem = async () => {
    try {
      if (!itemForm.title || !itemForm.price) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Title and price are required.",
        });
        return;
      }

      const trimmedWhatsapp = (itemForm.whatsapp_number || "").trim();
      let normalizedWhatsapp = "";
      if (trimmedWhatsapp) {
        const { normalized, error } = evaluatePhoneInput(trimmedWhatsapp);
        if (error) {
          setWhatsappError(error);
          Swal.fire({
            icon: "error",
            title: "Invalid WhatsApp Number",
            text: error,
          });
          return;
        }
        setWhatsappError("");
        normalizedWhatsapp = normalized;
      }

      setUploading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("title", itemForm.title);
      formData.append("description", itemForm.description || "");
      formData.append("price", itemForm.price);
      formData.append("whatsapp_number", normalizedWhatsapp);
      formData.append("is_featured", itemForm.is_featured);
      formData.append("tag", itemForm.tag);

      // Append multiple images
      if (selectedImages && selectedImages.length > 0) {
        selectedImages.forEach((file) => {
          formData.append("market_images", file);
        });
      }

      const response = await fetch("/api/market", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Market item created successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
        resetForm();
        fetchItems();
        fetchAllItemsForCounts();
      } else {
        throw new Error(result.message || "Failed to create item");
      }
    } catch (err) {
      console.error("Error creating item:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to create item. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateItem = async () => {
    try {
      if (!itemForm.title || !itemForm.price) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Title and price are required.",
        });
        return;
      }

      setUploading(true);
      const token = localStorage.getItem("token");

      const trimmedWhatsapp = (itemForm.whatsapp_number || "").trim();
      let normalizedWhatsapp = "";
      if (trimmedWhatsapp) {
        const { normalized, error } = evaluatePhoneInput(trimmedWhatsapp);
        if (error) {
          setWhatsappError(error);
          Swal.fire({
            icon: "error",
            title: "Invalid WhatsApp Number",
            text: error,
          });
          return;
        }
        setWhatsappError("");
        normalizedWhatsapp = normalized;
      }

      const formData = new FormData();
      formData.append("title", itemForm.title);
      formData.append("description", itemForm.description || "");
      formData.append("price", itemForm.price);
      formData.append("whatsapp_number", normalizedWhatsapp);
      formData.append("is_featured", itemForm.is_featured);
      formData.append("tag", itemForm.tag);

      // If new images are uploaded, send them (they will replace all existing ones)
      if (selectedImages && selectedImages.length > 0) {
        selectedImages.forEach((file) => {
          formData.append("market_images", file);
        });
      } else if (existingImages.length > 0) {
        // If no new images but images were removed, send the remaining images array
        // Convert existing images back to their original paths
        const currentImages = existingImages.map((img) => {
          // Remove the /uploads/ prefix if present to get the original path
          if (img.startsWith("/uploads/")) {
            return img.replace("/uploads/", "");
          }
          return img;
        });
        // Send as JSON string - backend will parse it
        formData.append("images", JSON.stringify(currentImages));
      }

      const response = await fetch(`/api/market/${selectedItem.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Item updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        resetForm();
        fetchItems();
        fetchAllItemsForCounts();
      } else {
        throw new Error(result.message || "Failed to update item");
      }
    } catch (err) {
      console.error("Error updating item:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update item. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${item.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(`/api/market/${item.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete item");
        }

        fetchItems();
        fetchAllItemsForCounts();

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Item has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("Error deleting item:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete item. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setItemForm({
      title: item.title || "",
      description: item.description || "",
      price: item.price || "",
      whatsapp_number: item.whatsapp_number || "",
      is_featured: item.is_featured || false,
      tag: item.tag || "none",
    });
    setWhatsappError("");

    // Load existing images
    const existing = (item.images || []).map((img) => {
      if (img.startsWith("http")) return img;
      if (img.startsWith("/")) return img;
      return `/uploads/${img}`;
    });
    setExistingImages(existing);
    setImagePreviews(existing);
    setSelectedImages([]);
    setIsEditMode(true);
    setOpenEditDialog(true);
  };

  const resetForm = () => {
    setItemForm({
      title: "",
      description: "",
      price: "",
      whatsapp_number: "",
      is_featured: false,
      tag: "none",
    });
    setWhatsappError("");
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setSelectedItem(null);
    setIsEditMode(false);
    setOpenDialog(false);
    setOpenEditDialog(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return imagePath;
    return `/uploads/${imagePath}`;
  };

  if (error && items.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "none",
          boxShadow: "none",
          minHeight: "100vh",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            p: { xs: 2, sm: 3 },
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 2, sm: 0 }}
            position="relative"
            zIndex={1}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: { xs: 0.5, sm: 1 },
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2.125rem" },
                }}
              >
                TuVibe Marketplace
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  display: { xs: "none", sm: "block" },
                }}
              >
                Manage marketplace items and listings
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
              sx={{
                background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
                borderRadius: 3,
                px: { xs: 2, sm: 4 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 8px 25px rgba(255, 107, 107, 0.3)",
                width: { xs: "100%", sm: "auto" },
                minWidth: { xs: "100%", sm: "auto" },
                "&:hover": {
                  background: "linear-gradient(45deg, #FF5252, #26A69A)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 35px rgba(255, 107, 107, 0.4)",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Add New Item
            </Button>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >
          {/* Tag Tabs */}
          <Box mb={{ xs: 2, sm: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "#667eea",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
                "& .MuiTabs-scrollButtons": {
                  "&.Mui-disabled": { opacity: 0.3 },
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.75rem", sm: "0.875rem", md: "0.95rem" },
                  minHeight: { xs: 40, sm: 48 },
                  px: { xs: 1, sm: 2 },
                  color: "#666",
                  "&.Mui-selected": {
                    color: "#667eea",
                  },
                  "&:hover": {
                    color: "#667eea",
                    backgroundColor: "rgba(102, 126, 234, 0.04)",
                  },
                },
              }}
            >
              {tagTabs.map((tab, index) => (
                <Tab
                  key={tab.value}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{tab.label}</span>
                      <Chip
                        label={tab.count}
                        size="small"
                        sx={{
                          backgroundColor:
                            activeTab === index ? "#667eea" : "#e0e0e0",
                          color: activeTab === index ? "white" : "#666",
                          fontWeight: 600,
                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                          height: { xs: 18, sm: 20 },
                          minWidth: { xs: 18, sm: 20 },
                          "& .MuiChip-label": {
                            px: { xs: 0.5, sm: 1 },
                          },
                        }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {/* Items Grid */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "#667eea" }} />
            </Box>
          ) : items.length === 0 ? (
            <Card
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 3,
                background: "rgba(255, 255, 255, 0.8)",
              }}
            >
              <StoreIcon sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
              <Typography variant="h6" sx={{ color: "#999" }}>
                No items found
              </Typography>
            </Card>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map((item) => (
                <Card
                  key={item.id}
                  sx={{
                    height: "100%",
                    minHeight: { xs: "auto", sm: "200px" },
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    borderRadius: 3,
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  {/* Photo Section */}
                  <Box
                    sx={{
                      position: "relative",
                      width: { xs: "100%", sm: "200px", md: "250px" },
                      minWidth: { xs: "100%", sm: "200px", md: "250px" },
                      height: { xs: "180px", sm: "200px", md: "250px" },
                      minHeight: { xs: "180px", sm: "200px", md: "250px" },
                      backgroundColor: "rgba(0, 0, 0, 0.05)",
                      overflow: "visible",
                      flexShrink: 0,
                    }}
                  >
                    {/* Image Container */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                      }}
                    >
                      {item.images && item.images.length > 0 ? (
                        <>
                          {item.images.map((imagePath, index) => {
                            const currentIdx = currentImageIndex[item.id] || 0;
                            return (
                              <Box
                                key={`${item.id}-img-${index}`}
                                component="img"
                                src={getImageUrl(imagePath)}
                                alt={item.title}
                                sx={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  opacity: currentIdx === index ? 1 : 0,
                                  transition: "opacity 1.5s ease-in-out",
                                  zIndex: currentIdx === index ? 1 : 0,
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            );
                          })}
                          {item.images.length > 1 && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                backgroundColor: "rgba(0, 0, 0, 0.7)",
                                color: "white",
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                zIndex: 2,
                              }}
                            >
                              +{item.images.length - 1} more
                            </Box>
                          )}
                        </>
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <StoreIcon
                            sx={{ fontSize: 48, color: "#ccc", opacity: 0.5 }}
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Featured Badge */}
                    {item.is_featured && (
                      <StarIcon
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          color: "#FFD700",
                          fontSize: 28,
                          zIndex: 25,
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                        }}
                      />
                    )}

                    {/* Tag Badge */}
                    {item.tag !== "none" && (
                      <Chip
                        label={
                          item.tag === "hot_deals"
                            ? "🔥 Hot Deal"
                            : "⭐ Weekend Pick"
                        }
                        size="small"
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          left: 8,
                          bgcolor:
                            item.tag === "hot_deals" ? "#ff6b6b" : "#4ecdc4",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                          zIndex: 25,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                      />
                    )}
                  </Box>

                  {/* Content Section */}
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      p: { xs: 2, sm: 3 },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        color: "#1a1a1a",
                        mb: { xs: 0.5, sm: 1 },
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(26, 26, 26, 0.7)",
                        mb: { xs: 1, sm: 2 },
                        flexGrow: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: { xs: 2, sm: 3 },
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      {item.description || "No description"}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#667eea",
                        mb: { xs: 1, sm: 2 },
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      }}
                    >
                      KES {parseFloat(item.price).toLocaleString()}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: { xs: 0.5, sm: 1 },
                        mt: "auto",
                        justifyContent: { xs: "flex-start", sm: "flex-start" },
                      }}
                    >
                      <Tooltip title="Edit Item">
                        <IconButton
                          size="small"
                          onClick={() => handleEditItem(item)}
                          sx={{
                            color: "#3498db",
                            backgroundColor: "rgba(52, 152, 219, 0.1)",
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            "&:hover": {
                              backgroundColor: "rgba(52, 152, 219, 0.2)",
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Item">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item)}
                          sx={{
                            color: "#e74c3c",
                            backgroundColor: "rgba(231, 76, 60, 0.1)",
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            "&:hover": {
                              backgroundColor: "rgba(231, 76, 60, 0.2)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* Create Dialog */}
        <Dialog
          open={openDialog}
          onClose={resetForm}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: { xs: 2, sm: 4 },
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              m: { xs: 2, sm: 2 },
              maxWidth: { xs: "calc(100% - 16px)", sm: "600px" },
              maxHeight: { xs: "calc(100vh - 32px)", sm: "90vh" },
              width: "100%",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              fontWeight: "bold",
              fontSize: { xs: "0.9375rem", sm: "1.25rem" },
              py: { xs: 1.25, sm: 2 },
              px: { xs: 2, sm: 3 },
            }}
          >
            Create New Market Item
          </DialogTitle>
          <DialogContent
            sx={{
              mt: { xs: 1, sm: 2 },
              p: { xs: 2, sm: 3 },
              maxHeight: { xs: "calc(100vh - 200px)", sm: "none" },
              overflow: "auto",
            }}
          >
            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              <TextField
                fullWidth
                label="Title"
                value={itemForm.title}
                onChange={(e) =>
                  setItemForm({ ...itemForm, title: e.target.value })
                }
                required
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Description"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm({ ...itemForm, description: e.target.value })
                }
                multiline
                rows={3}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Price (KES)"
                type="number"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: e.target.value })
                }
                required
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="WhatsApp Number"
                value={itemForm.whatsapp_number}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  setItemForm({
                    ...itemForm,
                    whatsapp_number: rawValue,
                  });
                  if (!rawValue.trim()) {
                    setWhatsappError("");
                  } else {
                    const { error } = evaluatePhoneInput(rawValue.trim());
                    setWhatsappError(error);
                  }
                }}
                variant="outlined"
                size="small"
                placeholder="+254712345678"
                error={Boolean(whatsappError)}
                helperText={
                  whatsappError || "Include country code, e.g., +254712345678."
                }
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tag</InputLabel>
                <Select
                  value={itemForm.tag}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, tag: e.target.value })
                  }
                  label="Tag"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="hot_deals">Hot Deals</MenuItem>
                  <MenuItem value="weekend_picks">Weekend Picks</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={itemForm.is_featured}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        is_featured: e.target.checked,
                      })
                    }
                  />
                }
                label="Featured Item"
              />
              <Box>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Upload Images
                  </Button>
                </label>
                {imagePreviews.length > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    {imagePreviews.map((preview, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: { xs: 120, sm: 150 },
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeImagePreview(index)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 1)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              p: { xs: 1.5, sm: 2 },
              px: { xs: 2, sm: 3 },
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: { xs: 1, sm: 1 },
            }}
          >
            <Button
              onClick={resetForm}
              variant="outlined"
              fullWidth={isMobile}
              sx={{
                m: { xs: 0, sm: 0 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                py: { xs: 1, sm: 1.25 },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateItem}
              variant="contained"
              disabled={uploading}
              fullWidth={isMobile}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                m: { xs: 0, sm: 0 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                py: { xs: 1, sm: 1.25 },
              }}
            >
              {uploading ? <CircularProgress size={24} /> : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={resetForm}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: { xs: 2, sm: 4 },
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              m: { xs: 2, sm: 2 },
              maxWidth: { xs: "calc(100% - 16px)", sm: "600px" },
              maxHeight: { xs: "calc(100vh - 32px)", sm: "90vh" },
              width: "100%",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              fontWeight: "bold",
              fontSize: { xs: "0.9375rem", sm: "1.25rem" },
              py: { xs: 1.25, sm: 2 },
              px: { xs: 2, sm: 3 },
            }}
          >
            Edit Market Item
          </DialogTitle>
          <DialogContent
            sx={{
              mt: { xs: 1, sm: 2 },
              p: { xs: 2, sm: 3 },
              maxHeight: { xs: "calc(100vh - 200px)", sm: "none" },
              overflow: "auto",
            }}
          >
            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              <TextField
                fullWidth
                label="Title"
                value={itemForm.title}
                onChange={(e) =>
                  setItemForm({ ...itemForm, title: e.target.value })
                }
                required
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Description"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm({ ...itemForm, description: e.target.value })
                }
                multiline
                rows={3}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Price (KES)"
                type="number"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: e.target.value })
                }
                required
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="WhatsApp Number"
                value={itemForm.whatsapp_number}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  setItemForm({
                    ...itemForm,
                    whatsapp_number: rawValue,
                  });
                  if (!rawValue.trim()) {
                    setWhatsappError("");
                  } else {
                    const { error } = evaluatePhoneInput(rawValue.trim());
                    setWhatsappError(error);
                  }
                }}
                variant="outlined"
                size="small"
                placeholder="+254712345678"
                error={Boolean(whatsappError)}
                helperText={
                  whatsappError || "Include country code, e.g., +254712345678."
                }
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tag</InputLabel>
                <Select
                  value={itemForm.tag}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, tag: e.target.value })
                  }
                  label="Tag"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="hot_deals">Hot Deals</MenuItem>
                  <MenuItem value="weekend_picks">Weekend Picks</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={itemForm.is_featured}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        is_featured: e.target.checked,
                      })
                    }
                  />
                }
                label="Featured Item"
              />
              <Box>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                  id="edit-image-upload"
                />
                <label htmlFor="edit-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {selectedImages.length > 0
                      ? `Add ${selectedImages.length} More Image(s)`
                      : "Add More Images"}
                  </Button>
                </label>
                {imagePreviews.length > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                      },
                      gap: 2,
                    }}
                  >
                    {imagePreviews.map((preview, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: { xs: 120, sm: 150 },
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeImagePreview(index)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            "&:hover": {
                              backgroundColor: "rgba(255, 255, 255, 1)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              p: { xs: 1.5, sm: 2 },
              px: { xs: 2, sm: 3 },
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: { xs: 1, sm: 1 },
            }}
          >
            <Button
              onClick={resetForm}
              variant="outlined"
              fullWidth={isMobile}
              sx={{
                m: { xs: 0, sm: 0 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                py: { xs: 1, sm: 1.25 },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateItem}
              variant="contained"
              disabled={uploading}
              fullWidth={isMobile}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                m: { xs: 0, sm: 0 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                py: { xs: 1, sm: 1.25 },
              }}
            >
              {uploading ? <CircularProgress size={24} /> : "Update"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Marketplace;
