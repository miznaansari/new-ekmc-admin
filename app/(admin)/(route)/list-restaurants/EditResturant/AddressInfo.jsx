import { Alert, Autocomplete, Box, Button, Grid, Paper, Snackbar, TextField, Typography, InputAdornment, IconButton } from "@mui/material";
import { Search, MyLocation, Clear, Add, Remove } from "@mui/icons-material";
import axios from "axios";
import { useEffect, useState, useCallback, useRef } from "react";

const extractPincode = (addressComponents) => {
    if (!addressComponents || !Array.isArray(addressComponents)) return null;
    
    const postalCodeComponent = addressComponents.find(component => 
        component.types && component.types.includes('postal_code')
    );
    
    return postalCodeComponent ? postalCodeComponent.long_name : null;
};

const AddressInfo = ({ cafeId }) => {
    const [formData, setFormData] = useState({
        address_1: "",
        address_2: "",
        city_name: "",
        city_id: null,
        pin_code: "",
        latitude: "",
        longitude: "",
    });

    const [formErrors, setFormErrors] = useState({
        address_1: "",
        city_id: "",
        pin_code: ""
    });

    const [alert, setAlert] = useState({
        open: false,
        severity: "info",
        message: ""
    });
    const [isOffline, setIsOffline] = useState(false); 
    const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || ""; 
    const [token, setToken] = useState("");
    const [searchCityQuery, setSearchCityQuery] = useState("");
    const [cityOptions, setCityOptions] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [initialSelectedCity, setInitialSelectedCity] = useState(null);
    const [position, setPosition] = useState(null);
    const [initialPosition, setInitialPosition] = useState(null);
    const [initialFormValues, setInitialFormValues] = useState(null);
    const [isFormModified, setIsFormModified] = useState(false);
    const OlaApiKey = process.env.NEXT_PUBLIC_VITE_OLAMAP_API_KEY || process.env.VITE_OLAMAP_API_KEY;

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsOffline(!navigator.onLine);
            setToken(localStorage.getItem("authToken") || "");

            const handleOnline = () => setIsOffline(false);
            const handleOffline = () => setIsOffline(true);
            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);
            return () => {
                window.removeEventListener("online", handleOnline);
                window.removeEventListener("offline", handleOffline);
            };
        }
    }, []);

    // Search location states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedAddressText, setSelectedAddressText] = useState("");
    const [initialAddressText, setInitialAddressText] = useState("");

    // Refs to store map and marker instances
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const popupRef = useRef(null);
    const olaMapsRef = useRef(null);
    const mapInitialized = useRef(false);
    const positionRef = useRef(null);
    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    const getValues = useCallback(() => formData, [formData]);

    const reset = useCallback((data) => {
        setFormData(data);
        setFormErrors({
            address_1: "",
            city_id: "",
            pin_code: ""
        });
    }, []);

    const setValue = useCallback((key, value, options = {}) => {
        setFormData(prev => {
            const updated = { ...prev, [key]: value };
            if (options.shouldValidate) {
                let error = "";
                if (key === "address_1" && !value) {
                    error = "Address 1 is required";
                } else if (key === "city_id" && !value) {
                    error = "City is required";
                } else if (key === "pin_code") {
                    if (!value) {
                        error = "Pin code is required";
                    } else if (!/^\d{6}$/.test(value)) {
                        error = "Pin code must be 6 digits";
                    }
                }
                setFormErrors(prevErrors => ({ ...prevErrors, [key]: error }));
            }
            return updated;
        });
    }, []);

    const handleFieldChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleFieldBlur = (name) => {
        let error = "";
        const value = formData[name];
        if (name === "address_1" && !value) {
            error = "Address 1 is required";
        } else if (name === "city_id" && !selectedCity?.value) {
            error = "City is required";
        } else if (name === "pin_code") {
            if (!value) {
                error = "Pin code is required";
            } else if (!/^\d{6}$/.test(value)) {
                error = "Pin code must be 6 digits";
            }
        }
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    // Check if form data is modified
    const checkIfDataModified = useCallback(() => {
        if (!initialFormValues) return false;
        
        const isTextFieldsChanged = 
            formData.address_1 !== initialFormValues.address_1 ||
            formData.address_2 !== initialFormValues.address_2 ||
            formData.pin_code !== initialFormValues.pin_code;
            
        const isCityChanged = 
            selectedCity?.value !== initialSelectedCity?.value;
            
        const isPositionChanged = 
            !initialPosition ? !!position :
            !position ? !!initialPosition :
            Math.abs(position.lat - initialPosition.lat) > 0.000001 || 
            Math.abs(position.lng - initialPosition.lng) > 0.000001;
            
        const isAddressTextChanged = selectedAddressText !== initialAddressText;
            
        return isTextFieldsChanged || isCityChanged || isPositionChanged || isAddressTextChanged;
    }, [formData, initialFormValues, selectedCity, initialSelectedCity, position, initialPosition, selectedAddressText, initialAddressText]);

    // Update the modified status whenever relevant state changes
    useEffect(() => {
        setIsFormModified(checkIfDataModified());
    }, [formData, selectedCity, position, selectedAddressText, checkIfDataModified]);

    // Function to perform reverse geocoding and get address details
    const reverseGeocode = useCallback(async (position) => {
        try {
            const response = await axios.get(
                `https://api.olamaps.io/places/v1/reverse-geocode`,
                {
                    params: {
                        latlng: `${position.lat},${position.lng}`,
                        api_key: OlaApiKey
                    }
                }
            );

            if (response.data && response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                const formattedAddress = result.formatted_address;
                
                const pincode = extractPincode(result.address_components);
                
                setSelectedAddressText(formattedAddress);
                setSearchQuery(formattedAddress);
                
                if (pincode) {
                    setValue('pin_code', pincode, { shouldDirty: true, shouldValidate: true });
                }

                if (formattedAddress) {
                    const parts = formattedAddress.split(',').map(p => p.trim());
                    const addr1 = parts.slice(0, 2).join(', ');
                    const addr2 = parts.slice(2).join(', ');
                    setValue('address_1', addr1, { shouldDirty: true, shouldValidate: true });
                    setValue('address_2', addr2, { shouldDirty: true, shouldValidate: true });
                }
                
                console.log('Reverse geocoded address:', formattedAddress);
                console.log('Extracted pincode:', pincode);
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }
    }, [OlaApiKey, setValue, setSelectedAddressText, setSearchQuery]);

    // Function to update popup text
    const updatePopupText = useCallback((pos) => {
        if (popupRef.current) {
            if (!popupRef.current.isOpen()) {
                markerRef.current.togglePopup();
            }
        }
    }, []);

    // Function to update marker position
    const updateMarkerPosition = useCallback((newPosition, shouldCenterMap = true) => {
        if (!mapRef.current || !olaMapsRef.current) return;

        const { lat, lng } = newPosition;

        if (!markerRef.current) {
            markerRef.current = olaMapsRef.current
                .addMarker({
                    offset: [0, -20],
                    anchor: "bottom",
                    color: "#FF0000",
                    draggable: true,
                })
                .setLngLat([lng, lat])
                .addTo(mapRef.current);

            popupRef.current = olaMapsRef.current.addPopup({
                offset: [0, -30],
                anchor: "top",
            });
            markerRef.current.setPopup(popupRef.current);

            markerRef.current.on("dragend", () => {
                const lngLat = markerRef.current.getLngLat();
                console.log("Marker dragged - lat and lng:", lngLat.lat, lngLat.lng);
                
                const dragPos = {
                    lat: parseFloat(lngLat.lat.toFixed(6)),
                    lng: parseFloat(lngLat.lng.toFixed(6))
                };
                
                setPosition(dragPos);
                reverseGeocode(dragPos);
            });

            if (shouldCenterMap) {
                mapRef.current.flyTo({
                    center: [lng, lat],
                    zoom: 15,
                    duration: 1000
                });
            }
        } else {
            markerRef.current.setLngLat([lng, lat]);
            
            if (shouldCenterMap) {
                const currentZoom = mapRef.current.getZoom();
                mapRef.current.flyTo({
                    center: [lng, lat],
                    zoom: currentZoom,
                    duration: 1000
                });
            }
        }

        updatePopupText(newPosition);
    }, [reverseGeocode, updatePopupText]);

    // Zoom functions
    const zoomIn = useCallback(() => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom();
            mapRef.current.setZoom(currentZoom + 1);
        }
    }, []);

    const zoomOut = useCallback(() => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom();
            mapRef.current.setZoom(currentZoom - 1);
        }
    }, []);

    // Initialize OLA Maps only once
    useEffect(() => {
        if (!OlaApiKey || mapInitialized.current) return;

        let active = true;
        let mapInstance = null;

        const initMaps = async () => {
            try {
                const { OlaMaps } = await import('olamaps-web-sdk');
                if (!active) return;

                olaMapsRef.current = new OlaMaps({
                    apiKey: OlaApiKey,
                });

                const defaultCenter = [77.61648476788898, 12.931423492103944];
                
                mapRef.current = olaMapsRef.current.init({
                    style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                    container: "map",
                    center: defaultCenter,
                    zoom: 15,
                });
                mapInstance = mapRef.current;

                mapRef.current.on("click", (e) => {
                    const { lat, lng } = e.lngLat;
                    console.log("Map clicked - lat and lng:", lat, lng);
                    
                    const newPos = { 
                        lat: parseFloat(lat.toFixed(6)), 
                        lng: parseFloat(lng.toFixed(6)) 
                    };

                    updateMarkerPosition(newPos, false);
                    setPosition(newPos);
                    
                    reverseGeocode(newPos);
                });

                if (positionRef.current) {
                    updateMarkerPosition(positionRef.current);
                }

                mapInitialized.current = true;
            } catch (err) {
                console.error("Error loading olamaps-web-sdk:", err);
            }
        };

        initMaps();

        return () => {
            active = false;
            if (mapInstance) {
                mapInstance.remove();
                mapRef.current = null;
                markerRef.current = null;
                popupRef.current = null;
                mapInitialized.current = false;
            }
        };
    }, [OlaApiKey, updateMarkerPosition, reverseGeocode]);

    // Function to search locations using Ola Maps API
    const searchLocation = async (query) => {
        try {
            setIsSearching(true);
            const response = await axios.get(
                `https://api.olamaps.io/places/v1/autocomplete`,
                {
                    params: {
                        input: query,
                        api_key: OlaApiKey
                    }
                }
            );

            if (response.data && response.data.predictions) {
                const results = response.data.predictions.map(pred => ({
                    id: pred.place_id,
                    placeId: pred.place_id,
                    title: pred.structured_formatting?.main_text || pred.description,
                    subtitle: pred.structured_formatting?.secondary_text || "",
                    fullAddress: pred.description
                }));
                setSearchResults(results);
                setShowSearchResults(results.length > 0);
            }
        } catch (error) {
            console.error('Error searching location:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchQuery.trim()) {
                searchLocation(searchQuery);
            }
        }
    };

    const clearAddressText = () => {
        setSearchQuery("");
        setSelectedAddressText("");
        setSearchResults([]);
        setShowSearchResults(false);
    };

    const getPlaceDetails = async (placeId) => {
        try {
            const response = await axios.get(
                `https://api.olamaps.io/places/v1/details`,
                {
                    params: {
                        place_id: placeId,
                        api_key: OlaApiKey
                    }
                }
            );

            if (response.data && response.data.result) {
                const place = response.data.result;
                const location = place.geometry?.location;
                
                if (location) {
                    const newPosition = {
                        lat: parseFloat(location.lat.toFixed(6)),
                        lng: parseFloat(location.lng.toFixed(6))
                    };
                    
                    setPosition(newPosition);
                    updateMarkerPosition(newPosition);
                    
                    const selectedResult = searchResults.find(r => r.placeId === placeId);
                    const addressToUse = selectedResult ? selectedResult.fullAddress : place.formatted_address;
                    
                    if (addressToUse) {
                        setSelectedAddressText(addressToUse);
                        setSearchQuery(addressToUse);
                        
                        const pincode = extractPincode(place.address_components);
                        if (pincode) {
                            setValue('pin_code', pincode, { shouldDirty: true, shouldValidate: true });
                        }

                        const parts = addressToUse.split(',').map(p => p.trim());
                        const addr1 = parts.slice(0, 2).join(', ');
                        const addr2 = parts.slice(2).join(', ');
                        setValue('address_1', addr1, { shouldDirty: true, shouldValidate: true });
                        setValue('address_2', addr2, { shouldDirty: true, shouldValidate: true });
                    }
                    
                    setSearchResults([]);
                    setShowSearchResults(false);
                }
            }
        } catch (error) {
            console.error('Error getting place details:', error);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setAlert({
                open: true,
                severity: "error",
                message: "Geolocation is not supported by your browser"
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const currentPos = {
                    lat: parseFloat(position.coords.latitude.toFixed(6)),
                    lng: parseFloat(position.coords.longitude.toFixed(6))
                };
                setPosition(currentPos);
                updateMarkerPosition(currentPos);
                reverseGeocode(currentPos);
            },
            (error) => {
                console.error("Error getting geolocation:", error);
                setAlert({
                    open: true,
                    severity: "error",
                    message: "Unable to retrieve your location"
                });
            }
        );
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchQuery.trim() && searchQuery !== selectedAddressText) {
                searchLocation(searchQuery);
            } else if (!searchQuery.trim()) {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, selectedAddressText]);
    
    useEffect(() => {
        if (position && mapRef.current) {
            updateMarkerPosition(position);
        }
    }, [position, updateMarkerPosition]);

    const fetchAddress = async () => {
        try {
            const response = await axios.get(`${baseUrl}/api/user/admin/restaurant-all-info/${cafeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("response in address info - ", response.data?.data);
            const [data] = response.data.data;
            
            const fetchedData = {
                address_1: data.address_1 || "",
                address_2: data.address_2 || "",
                city_name: data.city_name || "",
                pin_code: data.pin_code || "",
                latitude: data.latitude || "",
                longitude: data.longitude || "",
                city_id: data.city_id || null,
            };
            
            reset(fetchedData);
            
            const cityData = {label: data.city_name, value: data.city_id};
            setSelectedCity(cityData);
            setInitialSelectedCity(cityData);
            
            if (data.latitude && data.longitude) {
                const posData = {
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude),
                };
                setPosition(posData);
                setInitialPosition({...posData});
                
                reverseGeocode(posData).then(() => {
                    setInitialAddressText(selectedAddressText);
                });
            }
            
            setInitialFormValues({...fetchedData});
            setIsFormModified(false);
        } catch(e) {
            console.log("error during address fetch- ", e);
        }
    };

    useEffect(() => {
        if (cafeId) {
            fetchAddress();
        }
    }, [cafeId]);

    const fetchCity = async () => {
        try {
            const response = await axios.get(`${baseUrl}/api/v1/city-list`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    search: searchCityQuery
                }
            });
            console.log("city list- ", response.data.data);
            const options = response.data?.data.map((city) => ({
                label: city.city_name,
                value: city.city_id,
                state: city.state_name
            }));
            console.log("city options- ", options);
            setCityOptions(options);
        } catch(e) {
            console.log("error during fetch city - ", e);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if(searchCityQuery.trim().length >= 1) {
                fetchCity();
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchCityQuery]);

    const editAddressInfo = async (data) => {
        console.log("position inside edit - ", position);
        console.log("form data - ", data.latitude, data.longitude);
        
        if (!position && (!data.latitude || !data.longitude)) {
            setAlert({
                open: true, 
                severity: "error", 
                message: "Error: Please Select Location on map!"
            });
            return;
        }
        
        const newData = {
            ...data,
            city_id: selectedCity?.value || data.city_id,
            latitude: position?.lat || data.latitude,    
            longitude: position?.lng || data.longitude, 
        };
        console.log("payload- ", newData);

        try {
            const response = await axios.post(
                `${baseUrl}/api/user/admin/restaurant-edit-address-information/${cafeId}`,
                newData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log("Address info updated:", response.data);
            
            setAlert({
                open: true,
                severity: "success",
                message: "Address info updated successfully",
            });
            
            setInitialFormValues({...data});
            setInitialSelectedCity({...selectedCity});
            setInitialPosition(position ? {...position} : null);
            setInitialAddressText(selectedAddressText);
            setIsFormModified(false);
            
        } catch(e) {
            console.log("error during submiting addressinfo- ", e);
            setAlert({
                open: true,
                severity: "error",
                message: "Error updating address info",
            });
        }
    };

    const handleSaveAddress = () => {
        let valid = true;
        
        let address1Error = "";
        if (!formData.address_1) {
            address1Error = "Address 1 is required";
            valid = false;
        }
        
        let cityIdError = "";
        if (!selectedCity?.value) {
            cityIdError = "City is required";
            valid = false;
        }
        
        let pincodeError = "";
        if (!formData.pin_code) {
            pincodeError = "Pin code is required";
            valid = false;
        } else if (!/^\d{6}$/.test(formData.pin_code)) {
            pincodeError = "Pin code must be 6 digits";
            valid = false;
        }
        
        setFormErrors({
            address_1: address1Error,
            city_id: cityIdError,
            pin_code: pincodeError
        });
        
        if (!valid) {
            setAlert({
                open: true, 
                severity: "error", 
                message: "Please fix the errors before saving."
            });
            return;
        }
        
        editAddressInfo(formData);
    };

    return(
        <Paper sx={{ p: 0 }}>
            <Typography variant="h5" gutterBottom>Address Info</Typography>
            {isOffline && (
                <Typography variant="body2" color="error" gutterBottom>
                    You are offline. All fields are disabled.
                </Typography>
            )}
            <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                    <TextField
                        value={formData.address_1 || ""}
                        onChange={(e) => handleFieldChange("address_1", e.target.value)}
                        onBlur={() => handleFieldBlur("address_1")}
                        label="Address 1 *"
                        fullWidth
                        size="small"
                        disabled={isOffline}
                        error={!!formErrors.address_1}
                        helperText={formErrors.address_1}
                        slotProps={{
                            input: {
                                sx: {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '4px',
                                    },
                                }
                            }
                          }}
                    />
                </Grid>

                <Grid size={{ xs: 6 }}>
                    <TextField
                        value={formData.address_2 || ""}
                        onChange={(e) => handleFieldChange("address_2", e.target.value)}
                        label="Address 2"
                        fullWidth
                        size="small"
                        disabled={isOffline}
                        slotProps={{
                            input: {
                                sx: {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '4px',
                                    },
                                }
                            }
                          }}
                    />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <Box>
                        <Autocomplete
                          options={cityOptions}
                          value={selectedCity}
                          getOptionLabel={(option) => option?.label || ""}
                          isOptionEqualToValue={(option, value) =>
                            option?.value === value?.value
                          }
                          onChange={(_, newValue) => {
                            setSelectedCity(newValue);
                            setFormData(prev => ({ ...prev, city_id: newValue?.value || null }));
                            setFormErrors(prev => ({ ...prev, city_id: newValue?.value ? "" : "City is required" }));
                          }}
                          onInputChange={(_, inputValue) => {
                            setCityOptions([]);
                            setSearchCityQuery(inputValue);
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "4px",
                            },
                          }}
                          renderOption={(props, option) => (
                            <li {...props} key={option.value}>
                              <span className="text-sm font-medium text-gray-900">
                                {option.label}
                              </span>
                              {option.state && (
                                <span className="text-xs text-gray-500">
                                  , {option.state}
                                </span>
                              )}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="City *"
                              fullWidth
                              size="small"
                              disabled={isOffline}
                              error={!!formErrors.city_id}
                              helperText={formErrors.city_id}
                            />
                          )}
                        />
                    </Box>
                </Grid>

                <Grid size={{ xs: 6 }}>
                    <TextField
                        value={formData.pin_code || ""}
                        onChange={(e) => handleFieldChange("pin_code", e.target.value)}
                        onBlur={() => handleFieldBlur("pin_code")}
                        label="Pin code *"
                        fullWidth
                        size="small"
                        disabled={isOffline}
                        error={!!formErrors.pin_code}
                        helperText={formErrors.pin_code}
                        slotProps={{
                            input: {
                                sx: {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '4px',
                                    },
                                }
                            }
                          }}
                    />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle1">Location on Map</Typography>
                    
                    <Box sx={{ mb: 2, position: 'relative' }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search for a location..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            onKeyDown={handleSearchKeyDown}
                            disabled={isOffline}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={getCurrentLocation}
                                                title="Use current location"
                                                disabled={isOffline}
                                            >
                                                <MyLocation />
                                            </IconButton>
                                            {(searchQuery || selectedAddressText) && (
                                                <IconButton
                                                    size="small"
                                                    onClick={clearAddressText}
                                                    title="Clear address"
                                                >
                                                    <Clear />
                                                </IconButton>
                                            )}
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderRadius: '4px',
                                        },
                                    }
                                }
                            }}
                        />
                        
                        {showSearchResults && searchResults.length > 0 && (
                            <Paper
                                sx={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 1000,
                                    maxHeight: 300,
                                    overflow: 'auto',
                                    mt: 0.5
                                }}
                                elevation={3}
                            >
                                {searchResults.map((result) => (
                                    <Box
                                        key={result.id}
                                        sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'grey.100'
                                            },
                                            borderBottom: '1px solid',
                                            borderColor: 'grey.200'
                                        }}
                                        onClick={() => getPlaceDetails(result.placeId)}
                                    >
                                        <Typography variant="body2" fontWeight="medium">
                                            {result.title}
                                        </Typography>
                                        {result.subtitle && (
                                            <Typography variant="caption" color="text.secondary">
                                                {result.subtitle}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Paper>
                        )}
                        
                        {isSearching && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Searching...
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ height: "400px", width: "100%", mb: 2, position: 'relative' }}>
                            <div id="map" style={{ height: "100%", width: "100%" }} />
                            
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    zIndex: 1000,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0
                                }}
                            >
                                <IconButton
                                    onClick={zoomIn}
                                    disabled={isOffline}
                                    sx={{
                                        backgroundColor: 'white',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px 4px 0 0',
                                        width: 40,
                                        height: 40,
                                        '&:hover': {
                                            backgroundColor: '#f5f5f5'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#f9f9f9',
                                            color: '#ccc'
                                        }
                                    }}
                                    title="Zoom in"
                                >
                                    <Add fontSize="small" />
                                </IconButton>
                                
                                <IconButton
                                    onClick={zoomOut}
                                    disabled={isOffline}
                                    sx={{
                                        backgroundColor: 'white',
                                        border: '1px solid #ccc',
                                        borderTop: 0,
                                        borderRadius: '0 0 4px 4px',
                                        width: 40,
                                        height: 40,
                                        '&:hover': {
                                            backgroundColor: '#f5f5f5'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#f9f9f9',
                                            color: '#ccc'
                                        }
                                    }}
                                    title="Zoom out"
                                >
                                    <Remove fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Button 
                        variant="contained" 
                        onClick={handleSaveAddress}
                        disabled={!isFormModified || isOffline}
                    >
                        Save
                    </Button>
                </Grid>
            </Grid>
            <Snackbar
                open={alert.open}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                autoHideDuration={3000}
                onClose={() => setAlert({ ...alert, open: false })}
            >
                <Alert severity={alert.severity} sx={{ width: "100%" }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default AddressInfo;