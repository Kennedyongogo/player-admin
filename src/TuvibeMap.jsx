import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  IconButton,
  Typography,
  Drawer,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Backdrop,
  Tooltip,
  Checkbox,
  Fade,
  Collapse,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Divider,
  Avatar,
  Badge,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, transformExtent } from "ol/proj";
import { defaults as defaultControls, ScaleLine } from "ol/control";
import XYZ from "ol/source/XYZ";
import MapIcon from "@mui/icons-material/Map";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import TerrainIcon from "@mui/icons-material/Terrain";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon } from "ol/style";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import LocationSearchingIcon from "@mui/icons-material/LocationSearching";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import VerifiedIcon from "@mui/icons-material/Verified";
import StarIcon from "@mui/icons-material/Star";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const TuvibeMap = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [baseLayer, setBaseLayer] = useState("osm");
  const [showMarker, setShowMarker] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const vectorLayerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tileLoadError, setTileLoadError] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [publicUsers, setPublicUsers] = useState([]);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  const [visibleCategories, setVisibleCategories] = useState({
    Regular: true,
    "Sugar Mummy": true,
    Sponsor: true,
    "Ben 10": true,
    "Urban Chics": true,
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchColumn, setSearchColumn] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  // Geolocation states
  const [userLocation, setUserLocation] = useState(null);
  const [nearMeMode, setNearMeMode] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState(10); // km
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [nearMeResults, setNearMeResults] = useState([]);

  // Use proxy path instead of direct API URL
  const API_BASE_URL = "/api";

  // Helper to build URL for uploaded assets using Vite proxy
  const buildImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;

    // Use relative URLs - Vite proxy will handle routing to backend
    if (imageUrl.startsWith("uploads/")) return `/${imageUrl}`;
    if (imageUrl.startsWith("/uploads/")) return imageUrl;
    // Handle public users photo path (e.g., "profiles/filename.png")
    if (imageUrl.startsWith("profiles/")) return `/uploads/${imageUrl}`;
    return imageUrl;
  };

  // Distance calculation utility (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Get user's current location
  const getUserLocation = (callback) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setIsGettingLocation(false);
        setLocationError(null);
        // Call callback if provided (for near me functionality)
        if (callback) {
          callback();
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Find public users near user location
  const findNearMeProjects = () => {
    if (!userLocation) {
      getUserLocation(() => {
        // This callback will be called after location is obtained
        performNearMeSearch();
      });
      return;
    }

    performNearMeSearch();
  };

  // Helper function to perform the actual near me search
  const performNearMeSearch = () => {
    if (!userLocation) return;

    const dataToSearch = searchResults.length > 0 ? searchResults : publicUsers;

    console.log("Performing near me search with:", {
      userLocation,
      dataToSearchLength: dataToSearch.length,
      nearMeRadius,
    });

    const nearbyUsers = dataToSearch
      .filter((user) => {
        const hasValidCoords =
          user.longitude !== null && user.latitude !== null;
        if (!hasValidCoords) {
          console.log("User missing coordinates:", user.name, {
            longitude: user.longitude,
            latitude: user.latitude,
          });
        }
        return hasValidCoords;
      })
      .map((user) => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(user.latitude),
          parseFloat(user.longitude)
        );
        return { ...user, distance };
      })
      .filter((user) => user.distance <= nearMeRadius)
      .sort((a, b) => a.distance - b.distance);

    console.log("Near me results:", nearbyUsers);

    setNearMeResults(nearbyUsers);
    setNearMeMode(true);
  };

  // Center map on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapInstance.current) {
      const map = mapInstance.current;
      const view = map.getView();
      view.setCenter(
        fromLonLat([userLocation.longitude, userLocation.latitude])
      );
      view.setZoom(12);
    }
  };

  // Create map instance only once
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      const osmLayer = new TileLayer({
        source: new OSM({
          preload: 4,
          crossOrigin: "anonymous",
        }),
        visible: true,
        title: "osm",
        opacity: 1,
        zIndex: 0,
      });

      const satelliteLayer = new TileLayer({
        source: new XYZ({
          url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
          maxZoom: 20,
          attributions: "© Google Maps",
          preload: 4,
          crossOrigin: "anonymous",
        }),
        visible: false,
        title: "satellite",
        opacity: 1,
        zIndex: 0,
      });

      const terrainLayer = new TileLayer({
        source: new XYZ({
          url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
          maxZoom: 24,
          preload: 4,
          crossOrigin: "anonymous",
        }),
        visible: false,
        title: "terrain",
        opacity: 1,
        zIndex: 0,
      });

      // Create vector source and layer for polling stations
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        visible: showMarker,
      });
      vectorLayerRef.current = vectorLayer;

      const map = new Map({
        target: mapRef.current,
        layers: [osmLayer, satelliteLayer, terrainLayer, vectorLayer],
        view: new View({
          center: fromLonLat([36.7758, -1.2921]), // Center near Nairobi, Kenya where the construction project is
          zoom: 10, // Closer view to see the construction project
        }),
        controls: defaultControls().extend([new ScaleLine()]),
      });

      // Click interaction will be handled in the application-specific useEffect

      mapInstance.current = map;
      setMapInitialized(true);
    }
    // Cleanup only on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, []);

  // Removed hospital fetching - focusing only on applications

  // Removed hospital markers - focusing only on applications

  // Update marker visibility when showMarker changes
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;
    if (vectorLayerRef.current) {
      vectorLayerRef.current.setVisible(showMarker);
    }
  }, [showMarker, mapInitialized]);

  // Search public users function
  const searchPublicUsers = async (query, column) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        limit: 10000,
      });

      // Add category filter
      if (categoryFilter) {
        params.append("category", categoryFilter);
      }

      if (query.trim()) {
        if (column === "all") {
          params.append("q", query);
        } else {
          params.append(column, query);
        }
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/admin-users/public-users?${params}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data?.data || []);
      return data?.data || [];
    } catch (error) {
      console.error("Error searching public users:", error);
      setSearchError(error.message);
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch public users
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({
          limit: "10000",
        });

        // Add category filter
        if (categoryFilter) {
          params.append("category", categoryFilter);
        }

        const usersResponse = await fetch(
          `${API_BASE_URL}/admin-users/public-users?${params}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!usersResponse.ok) {
          throw new Error(`HTTP error! status: ${usersResponse.status}`);
        }

        const usersData = await usersResponse.json();
        setPublicUsers(usersData?.data || []);
      } catch (error) {
        console.error("Error fetching public users:", error);
        setPublicUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [categoryFilter]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPublicUsers(searchQuery, searchColumn);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchColumn, categoryFilter]);

  // Auto-zoom to filtered results when data changes
  useEffect(() => {
    if (mapInstance.current && mapInitialized) {
      const dataToZoom = searchResults.length > 0 ? searchResults : publicUsers;

      if (dataToZoom && dataToZoom.length > 0) {
        const map = mapInstance.current;
        const view = map.getView();

        // Calculate bounds for filtered results
        const coordinates = dataToZoom
          .filter((user) => user.longitude && user.latitude)
          .map((user) => [
            parseFloat(user.longitude),
            parseFloat(user.latitude),
          ]);

        if (coordinates.length > 0) {
          if (coordinates.length === 1) {
            // Single result - zoom to it
            view.setCenter(fromLonLat(coordinates[0]));
            view.setZoom(15);
          } else {
            // Multiple results - fit all in view
            const extent = coordinates.reduce(
              (extent, coord) => {
                const [lon, lat] = coord;
                return [
                  Math.min(extent[0], lon),
                  Math.min(extent[1], lat),
                  Math.max(extent[2], lon),
                  Math.max(extent[3], lat),
                ];
              },
              [Infinity, Infinity, -Infinity, -Infinity]
            );

            // Add some padding to the extent
            const padding = 0.01; // degrees
            const paddedExtent = [
              extent[0] - padding,
              extent[1] - padding,
              extent[2] + padding,
              extent[3] + padding,
            ];

            // Transform extent from lon/lat to map coordinates
            const transformedExtent = transformExtent(
              paddedExtent,
              "EPSG:4326",
              view.getProjection()
            );

            view.fit(transformedExtent, {
              padding: [50, 50, 50, 50],
              duration: 1000,
            });
          }
        }
      }
    }
  }, [searchResults, publicUsers, categoryFilter, mapInitialized]);

  // Auto-update near me results when radius changes
  useEffect(() => {
    if (nearMeMode && userLocation) {
      performNearMeSearch();
    }
  }, [nearMeRadius]);

  // Handle navigation from ProjectView to center on specific project
  useEffect(() => {
    if (location.state?.centerCoordinates && mapInstance.current) {
      const [longitude, latitude] = location.state.centerCoordinates;
      const view = mapInstance.current.getView();
      view.setCenter(fromLonLat([longitude, latitude]));
      view.setZoom(15); // Zoom in closer for specific project

      // Clear the state to prevent re-centering on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, mapInstance.current, navigate, location.pathname]);

  // Add hover interaction for tooltips
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;
    const map = mapInstance.current;

    const handlePointerMove = (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );

      if (feature) {
        const properties = feature.get("properties");
        const featureType = properties?.type;

        if (featureType === "publicUser") {
          // Show tooltip for public users
          const coordinate = event.coordinate;
          const pixel = map.getPixelFromCoordinate(coordinate);
          setTooltip({
            visible: true,
            content: properties.name || "No name",
            x: pixel[0] + 10,
            y: pixel[1] - 10,
          });
          map.getTarget().style.cursor = "pointer";
        } else {
          // Hide tooltip
          setTooltip({ visible: false, content: "", x: 0, y: 0 });
          map.getTarget().style.cursor = "";
        }
      } else {
        // Hide tooltip
        setTooltip({ visible: false, content: "", x: 0, y: 0 });
        map.getTarget().style.cursor = "";
      }
    };

    const handlePointerLeave = () => {
      setTooltip({ visible: false, content: "", x: 0, y: 0 });
      map.getTarget().style.cursor = "";
    };

    map.on("pointermove", handlePointerMove);
    map.on("pointerleave", handlePointerLeave);

    return () => {
      map.un("pointermove", handlePointerMove);
      map.un("pointerleave", handlePointerLeave);
    };
  }, [mapInitialized]);

  // Add click interaction for projects
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;
    const map = mapInstance.current;

    const handleClick = (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );

      if (feature) {
        const properties = feature.get("properties");
        const featureType = properties?.type;

        if (featureType === "publicUser") {
          // Show user details in drawer
          setSelectedProjectDetails(properties);
          setDrawerOpen(true);
        }
      }
    };

    map.on("click", handleClick);

    return () => {
      map.un("click", handleClick);
    };
  }, [mapInitialized, navigate]);

  // Create public user markers
  const createProjectMarkers = (users, isSearchResult = false) => {
    return users
      .filter((user) => {
        // Check if coordinates are valid
        if (user.longitude === null || user.latitude === null) {
          return false;
        }
        // If categoryFilter is set, only show that category
        if (categoryFilter) {
          return user.category === categoryFilter;
        }
        // Otherwise, use visibleCategories from legend checkboxes
        return visibleCategories[user.category];
      })
      .map((user) => {
        const lon = parseFloat(user.longitude); // longitude
        const lat = parseFloat(user.latitude); // latitude

        if (isNaN(lon) || isNaN(lat)) {
          return null;
        }

        const feature = new Feature({
          geometry: new Point(fromLonLat([lon, lat])),
          properties: {
            ...user,
            type: "publicUser",
            isSearchResult: isSearchResult,
          },
        });

        // Get category specific marker
        const markerSvg = getCategoryMarker(
          user.category,
          user.isVerified ? "verified" : "unverified",
          isSearchResult
        );

        feature.setStyle(
          new Style({
            image: new Icon({
              src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                markerSvg
              )}`,
              scale: 1,
              anchor: [0.5, 0.5],
            }),
          })
        );
        return feature;
      })
      .filter((marker) => marker !== null);
  };

  // Create user location marker
  const createUserLocationMarker = () => {
    if (!userLocation) return null;

    const feature = new Feature({
      geometry: new Point(
        fromLonLat([userLocation.longitude, userLocation.latitude])
      ),
      properties: {
        type: "userLocation",
      },
    });

    feature.setStyle(
      new Style({
        image: new Icon({
          src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#FFD700" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
              <circle cx="16" cy="16" r="3" fill="#FFD700"/>
            </svg>
          `)}`,
          scale: 1,
          anchor: [0.5, 0.5],
        }),
      })
    );
    return feature;
  };

  // Update markers when projects, search results, visible statuses, or near me mode change
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;
    const vectorSource = vectorLayerRef.current.getSource();

    // Clear existing markers
    const existingFeatures = vectorSource.getFeatures();
    const projectFeatures = existingFeatures.filter(
      (f) => f.get("properties")?.type === "publicUser"
    );
    const userLocationFeatures = existingFeatures.filter(
      (f) => f.get("properties")?.type === "userLocation"
    );
    projectFeatures.forEach((f) => vectorSource.removeFeature(f));
    userLocationFeatures.forEach((f) => vectorSource.removeFeature(f));

    // Determine which data to show
    let dataToShow;
    if (nearMeMode && nearMeResults.length > 0) {
      dataToShow = nearMeResults;
    } else if (searchResults.length > 0) {
      dataToShow = searchResults;
    } else {
      dataToShow = publicUsers;
    }

    // Add project markers
    const isSearchResult =
      searchResults.length > 0 && dataToShow === searchResults;
    const projectMarkers = createProjectMarkers(dataToShow, isSearchResult);
    vectorSource.addFeatures(projectMarkers);

    // Add user location marker if available
    const userLocationMarker = createUserLocationMarker();
    if (userLocationMarker) {
      vectorSource.addFeature(userLocationMarker);
    }
  }, [
    publicUsers,
    searchResults,
    mapInitialized,
    visibleCategories,
    nearMeMode,
    nearMeResults,
    userLocation,
    categoryFilter,
  ]);

  const handleBaseLayerChange = (event) => {
    const selectedLayer = event.target.value;
    setBaseLayer(selectedLayer);
    if (mapInstance.current) {
      const layers = mapInstance.current.getLayers();
      layers.forEach((layer) => {
        const layerTitle = layer.get("title");
        if (
          layerTitle === "osm" ||
          layerTitle === "satellite" ||
          layerTitle === "terrain"
        ) {
          layer.setVisible(layerTitle === selectedLayer);
        }
      });
    }
  };

  const handleMarkerToggle = (event) => {
    setShowMarker(event.target.checked);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // User categories matching the API (Public User categories)
  // Original vibrant colors for markers and legend
  const USER_CATEGORIES = {
    Regular: { label: "Regular", color: "#4caf50" },
    "Sugar Mummy": { label: "Sugar Mummy", color: "#e91e63" },
    Sponsor: { label: "Sponsor", color: "#2196f3" },
    "Ben 10": { label: "Ben 10", color: "#ff9800" },
    "Urban Chics": { label: "Urban Chics", color: "#9c27b0" },
  };

  // Gold accent color (primary brand color)
  const GOLD_COLOR = "#FFD700";
  const GOLD_DARK = "#F4C430";

  // Helper function to get category marker
  const getCategoryMarker = (category, status, isSearchResult = false) => {
    const categoryColor = USER_CATEGORIES[category]?.color || "#666";
    const strokeWidth = isSearchResult ? 3 : 2;
    const outerRadius = isSearchResult ? 12 : 10;

    let svgIcon = "";

    switch (category) {
      case "Regular":
        svgIcon = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="${outerRadius}" fill="${categoryColor}" stroke="white" stroke-width="${strokeWidth}"/>
            ${
              isSearchResult
                ? `<circle cx="12" cy="12" r="14" fill="none" stroke="#ff6b35" stroke-width="2" opacity="0.8"/>`
                : ""
            }
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>
          </svg>
        `;
        break;
      case "Sugar Mummy":
        svgIcon = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="${outerRadius}" fill="${categoryColor}" stroke="white" stroke-width="${strokeWidth}"/>
            ${
              isSearchResult
                ? `<circle cx="12" cy="12" r="14" fill="none" stroke="#ff6b35" stroke-width="2" opacity="0.8"/>`
                : ""
            }
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="white"/>
          </svg>
        `;
        break;
      case "Sponsor":
        svgIcon = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="${outerRadius}" fill="${categoryColor}" stroke="white" stroke-width="${strokeWidth}"/>
            ${
              isSearchResult
                ? `<circle cx="12" cy="12" r="14" fill="none" stroke="#ff6b35" stroke-width="2" opacity="0.8"/>`
                : ""
            }
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.93s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="white"/>
          </svg>
        `;
        break;
      case "Ben 10":
        svgIcon = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="${outerRadius}" fill="${categoryColor}" stroke="white" stroke-width="${strokeWidth}"/>
            ${
              isSearchResult
                ? `<circle cx="12" cy="12" r="14" fill="none" stroke="#ff6b35" stroke-width="2" opacity="0.8"/>`
                : ""
            }
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/>
          </svg>
        `;
        break;
      case "Urban Chics":
        svgIcon = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="${outerRadius}" fill="${categoryColor}" stroke="white" stroke-width="${strokeWidth}"/>
            ${
              isSearchResult
                ? `<circle cx="12" cy="12" r="14" fill="none" stroke="#ff6b35" stroke-width="2" opacity="0.8"/>`
                : ""
            }
            <path d="M12 4c1.66 0 3 1.34 3 3 0 1.25-.77 2.32-1.86 2.77l1.36 1.73c.32.41.5.92.5 1.45v2.05c0 .64-.52 1.16-1.16 1.16H11v1.34c0 .37-.3.67-.67.67H9.83c-.37 0-.67-.3-.67-.67V16.2H8.16C7.52 16.2 7 15.68 7 15.04V13c0-.53.18-1.04.5-1.45l1.36-1.73C7.77 9.32 7 8.25 7 7c0-1.66 1.34-3 3-3h2z" fill="white"/>
          </svg>
        `;
        break;
      default:
        svgIcon = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="${outerRadius}" fill="${categoryColor}" stroke="white" stroke-width="${strokeWidth}"/>
            ${
              isSearchResult
                ? `<circle cx="12" cy="12" r="14" fill="none" stroke="#ff6b35" stroke-width="2" opacity="0.8"/>`
                : ""
            }
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>
          </svg>
        `;
        break;
    }

    return svgIcon;
  };

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setVisibleCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Handle select all/deselect all
  const handleSelectAll = () => {
    setVisibleCategories({
      Regular: true,
      "Sugar Mummy": true,
      Sponsor: true,
      "Ben 10": true,
      "Urban Chics": true,
    });
  };

  const handleDeselectAll = () => {
    setVisibleCategories({
      Regular: false,
      "Sugar Mummy": false,
      Sponsor: false,
      "Ben 10": false,
      "Urban Chics": false,
    });
  };

  // Search handlers
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchColumnChange = (event) => {
    setSearchColumn(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchColumn("all");
    setSearchResults([]);
    setSearchError(null);
    setCategoryFilter(""); // Also clear category filter
  };

  const clearNearMe = () => {
    setNearMeMode(false);
    setNearMeResults([]);
    setLocationError(null);
    setUserLocation(null); // Clear user location

    // Reset map view to default
    if (mapInstance.current) {
      const view = mapInstance.current.getView();
      view.setCenter(fromLonLat([36.7758, -1.2921])); // Default center near Nairobi, Kenya
      view.setZoom(10); // Default zoom level
    }
  };

  // Get category counts
  const getCategoryCounts = () => {
    const counts = {};
    const categories = Object.keys(USER_CATEGORIES);
    let dataToCount;

    if (nearMeMode && nearMeResults.length > 0) {
      dataToCount = nearMeResults;
    } else if (searchResults.length > 0) {
      dataToCount = searchResults;
    } else {
      dataToCount = publicUsers;
    }

    categories.forEach((category) => {
      counts[category] = dataToCount.filter(
        (user) =>
          user.category === category &&
          user.longitude !== null &&
          user.latitude !== null
      ).length;
    });

    return counts;
  };

  const categoryCounts = getCategoryCounts();

  return (
    <>
      {/* Search and Filter Controls */}
      <Box
        sx={{
          mb: 0.5,
          p: 1,
          backgroundColor: "#f8f9fa",
          borderRadius: 1,
          border: "1px solid #e0e0e0",
        }}
      >
        {/* Tuvibe Map Label and Near Me Controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#FFD700",
              fontSize: "1.1rem",
            }}
          >
            Tuvibe Map
          </Typography>

          {/* Near Me Controls */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {/* Near Me Button */}
            <Button
              variant={nearMeMode ? "contained" : "outlined"}
              size="small"
              onClick={findNearMeProjects}
              disabled={isGettingLocation}
              startIcon={
                isGettingLocation ? (
                  <CircularProgress size={16} />
                ) : (
                  <MyLocationIcon />
                )
              }
              sx={{
                minWidth: 120,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: nearMeMode ? "#FFD700" : "transparent",
                borderColor: "#FFD700",
                color: nearMeMode ? "white" : "#FFD700",
                "&:hover": {
                  backgroundColor: nearMeMode ? "#F4C430" : "#FFF9E6",
                  borderColor: "#F4C430",
                },
                "&:disabled": {
                  backgroundColor: "transparent",
                  borderColor: "#ccc",
                  color: "#999",
                },
              }}
            >
              {isGettingLocation ? "Getting Location..." : "Near Me"}
            </Button>

            {/* Radius Input (shown when near me mode is active) */}
            {nearMeMode && (
              <TextField
                size="small"
                type="number"
                label="Radius (km)"
                value={nearMeRadius}
                onChange={(e) =>
                  setNearMeRadius(parseFloat(e.target.value) || 10)
                }
                inputProps={{
                  min: 0.1,
                  max: 1000,
                  step: 0.1,
                }}
                sx={{
                  minWidth: 120,
                  maxWidth: 120,
                  "& .MuiInputBase-root": {
                    fontSize: "0.75rem",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.7rem",
                  },
                }}
              />
            )}

            {/* Center on Location Button */}
            {userLocation && (
              <Button
                variant="outlined"
                size="small"
                onClick={centerOnUserLocation}
                startIcon={<LocationSearchingIcon />}
                sx={{
                  minWidth: 100,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#FFD700",
                  color: "#FFD700",
                  "&:hover": {
                    backgroundColor: "#FFF9E6",
                    borderColor: "#F4C430",
                  },
                }}
              >
                Center
              </Button>
            )}

            {/* Clear Near Me Button */}
            {nearMeMode && (
              <Button
                variant="outlined"
                size="small"
                onClick={clearNearMe}
                startIcon={<ClearIcon />}
                sx={{
                  minWidth: 100,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#f44336",
                  color: "#f44336",
                  "&:hover": {
                    backgroundColor: "#ffebee",
                    borderColor: "#d32f2f",
                  },
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {/* Category Filter Row */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            mb: 0,
            justifyContent: "flex-start",
          }}
        >
          {/* Category Filter */}
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "white",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                "&:hover fieldset": {
                  borderColor: "rgba(255, 215, 0, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#FFD700",
                },
              },
            }}
          >
            <InputLabel
              sx={{
                color: "#7f8c8d",
                fontWeight: 600,
              }}
            >
              Filter by Category
            </InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                const nextFilter = e.target.value;
                setCategoryFilter(nextFilter);
                setSearchResults([]); // Clear search results when filter changes
                setNearMeResults([]); // Clear near me results when filter changes
                setNearMeMode(false); // Exit near me mode when filter changes

                // Update visibleCategories to match the filter
                if (nextFilter) {
                  // When a specific category is selected, enable only that category
                  setVisibleCategories({
                    Regular: nextFilter === "Regular",
                    "Sugar Mummy": nextFilter === "Sugar Mummy",
                    Sponsor: nextFilter === "Sponsor",
                    "Ben 10": nextFilter === "Ben 10",
                    "Urban Chics": nextFilter === "Urban Chics",
                  });
                } else {
                  // When "All Categories" is selected, enable all
                  setVisibleCategories({
                    Regular: true,
                    "Sugar Mummy": true,
                    Sponsor: true,
                    "Ben 10": true,
                    "Urban Chics": true,
                  });
                }
              }}
              label="Filter by Category"
              sx={{
                color: "#2c3e50",
                fontWeight: 600,
                "& .MuiSelect-icon": {
                  color: "#FFD700",
                },
              }}
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              <MenuItem value="Regular">Regular</MenuItem>
              <MenuItem value="Sugar Mummy">Sugar Mummy</MenuItem>
              <MenuItem value="Sponsor">Sponsor</MenuItem>
              <MenuItem value="Ben 10">Ben 10</MenuItem>
              <MenuItem value="Urban Chics">Urban Chics</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Near Me Status Indicators */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {nearMeMode && nearMeResults.length > 0 && (
            <Chip
              label={`${nearMeResults.length} users within ${nearMeRadius}km`}
              color="info"
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.7rem",
                height: "20px",
                ml: 1,
              }}
            />
          )}

          {locationError && (
            <Chip
              label={`Location: ${
                locationError.length > 15
                  ? locationError.substring(0, 15) + "..."
                  : locationError
              }`}
              color="error"
              size="small"
              onDelete={() => setLocationError(null)}
              sx={{
                fontSize: "0.7rem",
                height: "20px",
                ml: 1,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Map Container */}

      <Box
        ref={mapRef}
        sx={{
          width: "100%",
          height: "calc(100vh - 200px)",
          position: "relative",
          "& .ol-zoom": {
            top: "1em",
            left: "1em",
            background: "none",
            border: "none",
            padding: 0,
            "& .ol-zoom-in, & .ol-zoom-out": {
              background: "rgba(255,255,255,0.8)",
              border: "1px solid #ccc",
              borderRadius: "2px",
              margin: "2px",
              width: "28px",
              height: "28px",
              lineHeight: "28px",
            },
          },
          // Remove animations that cause blinking
          "& .ol-layer-animating": {
            transition: "none",
          },
          "& .ol-layer": {
            transition: "none",
          },
          "& .ol-tile": {
            transition: "none",
          },
          "& .ol-tile-loading": {
            opacity: 1,
          },
          "& .ol-tile-loaded": {
            opacity: 1,
          },
          "& .ol-rotate": {
            top: "4.5em",
            right: "auto",
            left: "1em",
            background: "rgba(255,255,255,0.8)",
            border: "1px solid #ccc",
            borderRadius: "2px",
            margin: "2px",
            padding: 0,
            "& button": {
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },
        }}
      >
        {/* Tooltip */}
        {tooltip.visible && (
          <Box
            sx={{
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y,
              zIndex: 1000,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
              pointerEvents: "none",
              maxWidth: "200px",
              wordWrap: "break-word",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              "&::after": {
                content: '""',
                position: "absolute",
                top: "100%",
                left: "10px",
                border: "4px solid transparent",
                borderTopColor: "rgba(0, 0, 0, 0.8)",
              },
            }}
          >
            {tooltip.content}
          </Box>
        )}

        {/* Loading indicator positioned on map */}
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "4px 8px",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <CircularProgress size={20} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Loading Tuvibe Family...
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            left: "1em",
            top: "7em",
            zIndex: 1000,
            backgroundColor: "rgba(255,255,255,0.8)",
            borderRadius: "2px",
            border: "1px solid #ccc",
            padding: "2px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            width: "40px",
            "& .MuiIconButton-root": {
              padding: "4px",
              borderRadius: "2px",
              height: "40px",
              width: "40px",
            },
          }}
        >
          <IconButton
            sx={{
              backgroundColor: "transparent",
              color: baseLayer === "osm" ? "#FFD700" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
            onClick={() => handleBaseLayerChange({ target: { value: "osm" } })}
          >
            <MapIcon />
          </IconButton>
          <IconButton
            sx={{
              backgroundColor: "transparent",
              color: baseLayer === "satellite" ? "#FFD700" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
            onClick={() =>
              handleBaseLayerChange({ target: { value: "satellite" } })
            }
          >
            <SatelliteAltIcon />
          </IconButton>
          <IconButton
            sx={{
              backgroundColor: "transparent",
              color: baseLayer === "terrain" ? "#FFD700" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
            onClick={() =>
              handleBaseLayerChange({ target: { value: "terrain" } })
            }
          >
            <TerrainIcon />
          </IconButton>
        </Box>

        {/* Compact Legend Box for Tuvibe Family with filtering */}
        <Box
          sx={{
            position: "absolute",
            bottom: 60,
            right: 10,
            zIndex: 1000,
            backgroundColor: "white",
            borderRadius: 1,
            padding: "6px 10px",
            minWidth: "200px",
            maxWidth: "220px",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
            opacity: 0.9,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: "bold", mb: 0.5, fontSize: "13px" }}
          >
            Legend
          </Typography>

          {/* Select All / Deselect All Buttons */}
          <Box sx={{ display: "flex", gap: 0.25, mb: 0.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              sx={{
                fontSize: "9px",
                py: 0.1,
                px: 0.75,
                textTransform: "none",
                borderColor: "#FFD700",
                color: "#FFD700",
                minWidth: "auto",
                height: "20px",
                "&:hover": {
                  backgroundColor: "#FFF9E6",
                  borderColor: "#F4C430",
                },
              }}
            >
              All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
              sx={{
                fontSize: "9px",
                py: 0.1,
                px: 0.75,
                textTransform: "none",
                borderColor: "#f44336",
                color: "#f44336",
                minWidth: "auto",
                height: "20px",
                "&:hover": {
                  backgroundColor: "#ffebee",
                  borderColor: "#d32f2f",
                },
              }}
            >
              None
            </Button>
          </Box>

          {/* User Location Marker */}
          {userLocation && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                mb: 0.5,
                p: 0.25,
                backgroundColor: "#FFF9E6",
                borderRadius: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#FFD700",
                  mr: 0.5,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#F4C430",
                }}
              >
                Your Location
              </Typography>
            </Box>
          )}

          {/* Project Categories with Checkboxes */}
          <Typography
            variant="body2"
            sx={{
              fontSize: "11px",
              fontWeight: "bold",
              mb: 0.25,
              color: "text.secondary",
            }}
          >
            User Categories
          </Typography>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 0.25, mb: 1 }}
          >
            {Object.entries(visibleCategories).map(([category, isVisible]) => (
              <Box
                key={category}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <Checkbox
                  checked={isVisible}
                  onChange={() => handleCategoryToggle(category)}
                  size="small"
                  sx={{
                    padding: 0.1,
                    "&.Mui-checked": {
                      color: USER_CATEGORIES[category]?.color,
                    },
                    "&:hover": {
                      backgroundColor: `${USER_CATEGORIES[category]?.color}20`,
                    },
                  }}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: USER_CATEGORIES[category]?.color,
                    mr: 0.25,
                    transition: "all 0.2s ease-in-out",
                    opacity: isVisible ? 1 : 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "7px",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {category.charAt(0).toUpperCase()}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "10px",
                    fontWeight: isVisible ? 600 : 400,
                    color: isVisible ? "text.primary" : "text.secondary",
                    transition: "all 0.2s ease-in-out",
                    flexGrow: 1,
                    textTransform: "capitalize",
                  }}
                >
                  {USER_CATEGORIES[category]?.label || category}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "8px",
                    color: "text.secondary",
                    backgroundColor: isVisible
                      ? `${USER_CATEGORIES[category]?.color}20`
                      : "#f5f5f5",
                    px: 0.25,
                    py: 0.05,
                    borderRadius: 0.25,
                    fontWeight: 600,
                    minWidth: "14px",
                    textAlign: "center",
                  }}
                >
                  {categoryCounts[category]}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Summary */}
          <Box
            sx={{
              mt: 0.5,
              pt: 0.5,
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                fontSize: "9px",
              }}
            >
              Visible:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "bold",
                color: "primary.main",
                fontSize: "9px",
              }}
            >
              {Object.entries(visibleCategories)
                .filter(([_, isVisible]) => isVisible)
                .reduce(
                  (sum, [category, _]) => sum + categoryCounts[category],
                  0
                )}
            </Typography>
          </Box>
        </Box>

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: "420px",
              padding: 0,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              height: "100vh",
              position: "fixed",
              top: "64px",
              right: 0,
              border: "none",
              boxShadow: "0px 8px 32px rgba(0,0,0,0.12)",
              borderRadius: "8px 0 0 8px",
              overflow: "hidden",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 64px)",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 3,
                borderBottom: 1,
                borderColor: "divider",
                background: "linear-gradient(135deg, #FFD700 0%, #F4C430 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative Elements */}
              <Box
                sx={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "50%",
                  zIndex: 0,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -15,
                  left: -15,
                  width: 80,
                  height: 80,
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "50%",
                  zIndex: 0,
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: "1.1rem" }}
                >
                  User Details
                </Typography>
                <IconButton
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              {selectedProjectDetails && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                    fontSize: "0.9rem",
                  }}
                >
                  {selectedProjectDetails?.name}
                </Typography>
              )}
            </Box>

            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                backgroundColor: "#f8f9fa",
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  minHeight: "56px",
                  "&.Mui-selected": {
                    color: "#FFD700",
                    fontWeight: 600,
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#FFD700",
                  height: 3,
                  borderRadius: "2px 2px 0 0",
                },
              }}
            >
              <Tab
                icon={<InfoIcon fontSize="small" />}
                label="Basic Info"
                sx={{ minHeight: "56px" }}
              />
              <Tab
                icon={<LocationOnIcon fontSize="small" />}
                label="Location"
                sx={{ minHeight: "56px" }}
              />
            </Tabs>

            {/* Content Area */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                p: 3,
                backgroundColor: "#fafafa",
              }}
            >
              {selectedProjectDetails ? (
                <>
                  {tabValue === 0 && (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {/* Profile Photo */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          badgeContent={
                            selectedProjectDetails.is_online ? (
                              <Box
                                sx={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: "50%",
                                  backgroundColor: "#C8E6C9",
                                  border: "2px solid white",
                                }}
                              />
                            ) : null
                          }
                        >
                          <Avatar
                            src={
                              selectedProjectDetails.photo
                                ? buildImageUrl(selectedProjectDetails.photo)
                                : undefined
                            }
                            sx={{
                              width: 120,
                              height: 120,
                              border: "3px solid #FFD700",
                              bgcolor: "#FFD700",
                            }}
                          >
                            {selectedProjectDetails.name
                              ?.charAt(0)
                              .toUpperCase() || <PersonIcon />}
                          </Avatar>
                        </Badge>
                      </Box>

                      {/* Name */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Name
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 500, color: "text.primary" }}
                          >
                            {selectedProjectDetails.name || "-"}
                          </Typography>
                          {selectedProjectDetails.isVerified && (
                            <VerifiedIcon
                              sx={{
                                fontSize: 20,
                                color: "#FFD700",
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Gender & Age */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Gender & Age
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {selectedProjectDetails.gender || "-"}
                          {selectedProjectDetails.age
                            ? `, ${selectedProjectDetails.age} years`
                            : ""}
                        </Typography>
                      </Box>

                      {/* Category */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Category
                        </Typography>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 2,
                            py: 0.5,
                            borderRadius: 3,
                            backgroundColor: `${
                              USER_CATEGORIES[selectedProjectDetails.category]
                                ?.color
                            }20`,
                            color:
                              USER_CATEGORIES[selectedProjectDetails.category]
                                ?.color,
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          {USER_CATEGORIES[selectedProjectDetails.category]
                            ?.label ||
                            selectedProjectDetails.category ||
                            "-"}
                        </Box>
                      </Box>

                      {/* City */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          City
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {selectedProjectDetails.city || "-"}
                        </Typography>
                      </Box>

                      {/* Phone */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Phone
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <PhoneIcon
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 500, color: "text.primary" }}
                          >
                            {selectedProjectDetails.phone || "-"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Email */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Email
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <EmailIcon
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 500, color: "text.primary" }}
                          >
                            {selectedProjectDetails.email || "-"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Bio */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Bio
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {selectedProjectDetails.bio || "-"}
                        </Typography>
                      </Box>

                      {/* Stats Row */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                        }}
                      >
                        {/* Boost Score */}
                        <Box
                          sx={{
                            flex: 1,
                            p: 2,
                            backgroundColor: "white",
                            borderRadius: 2,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: "text.secondary",
                              mb: 0.5,
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Boost Score
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <StarIcon sx={{ fontSize: 16, color: "#ff9800" }} />
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600, color: "text.primary" }}
                            >
                              {selectedProjectDetails.boost_score || 0}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Token Balance */}
                        <Box
                          sx={{
                            flex: 1,
                            p: 2,
                            backgroundColor: "white",
                            borderRadius: 2,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: "text.secondary",
                              mb: 0.5,
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Tokens
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <AccountBalanceWalletIcon
                              sx={{ fontSize: 16, color: "#F4C430" }}
                            />
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600, color: "text.primary" }}
                            >
                              {parseFloat(
                                selectedProjectDetails.token_balance || 0
                              ).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Distance from user location */}
                      {userLocation &&
                        selectedProjectDetails.distance !== undefined && (
                          <Box
                            sx={{
                              p: 2,
                              backgroundColor: "white",
                              borderRadius: 2,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              border: "1px solid #e0e0e0",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: "text.secondary",
                                mb: 1,
                                fontSize: "0.8rem",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Distance from You
                            </Typography>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: 2,
                                py: 0.5,
                                borderRadius: 3,
                                backgroundColor: "#FFF9E6",
                                color: "#F4C430",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                              }}
                            >
                              <LocationOnIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {selectedProjectDetails.distance.toFixed(1)} km
                            </Box>
                          </Box>
                        )}
                    </Box>
                  )}
                  {tabValue === 1 && (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {/* City */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          City
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {selectedProjectDetails.city || "-"}
                        </Typography>
                      </Box>

                      {/* Coordinates */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Coordinates
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", display: "block" }}
                            >
                              Latitude
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: "text.primary",
                                fontFamily: "monospace",
                              }}
                            >
                              {selectedProjectDetails.latitude || "-"}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", display: "block" }}
                            >
                              Longitude
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: "text.primary",
                                fontFamily: "monospace",
                              }}
                            >
                              {selectedProjectDetails.longitude || "-"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Last Seen */}
                      {selectedProjectDetails.last_seen_at && (
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor: "white",
                            borderRadius: 2,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontSize: "0.8rem",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Last Seen
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <CalendarTodayIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 500, color: "text.primary" }}
                            >
                              {new Date(
                                selectedProjectDetails.last_seen_at
                              ).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Online Status */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Online Status
                        </Typography>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 2,
                            py: 0.5,
                            borderRadius: 3,
                            backgroundColor: selectedProjectDetails.is_online
                              ? "#C8E6C920"
                              : "#9e9e9e20",
                            color: selectedProjectDetails.is_online
                              ? "#81C784"
                              : "#9e9e9e",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: selectedProjectDetails.is_online
                                ? "#81C784"
                                : "#9e9e9e",
                              mr: 1,
                            }}
                          />
                          {selectedProjectDetails.is_online
                            ? "Online"
                            : "Offline"}
                        </Box>
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "200px",
                    textAlign: "center",
                    p: 3,
                  }}
                >
                  <InfoIcon
                    sx={{
                      fontSize: 48,
                      color: "text.secondary",
                      mb: 2,
                      opacity: 0.5,
                    }}
                  />
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 1, fontWeight: 500 }}
                  >
                    No User Selected
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ opacity: 0.7 }}
                  >
                    Click on a marker on the map to view user details
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Bottom Button */}
            <Box
              sx={{
                p: 3,
                borderTop: 1,
                borderColor: "divider",
                marginTop: "auto",
                backgroundColor: "white",
                boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  if (selectedProjectDetails?.id) {
                    navigate(`/users`);
                  }
                }}
                sx={{
                  py: 1.5,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #FFD700 0%, #F4C430 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #F4C430 0%, #FFA500 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(255, 215, 0, 0.4)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                View All Users
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Box>
    </>
  );
};

export default TuvibeMap;
