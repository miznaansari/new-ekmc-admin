import { 
    Alert, 
    Box, 
    Button, 
    FormControl, 
    FormControlLabel, 
    Grid, 
    InputAdornment, 
    InputLabel, 
    MenuItem, 
    Paper, 
    Radio, 
    RadioGroup, 
    Select, 
    Snackbar, 
    Stack, 
    TextField, 
    Typography 
} from "@mui/material";
import axios from "@/app/(admin)/utils/axios";
import { useCallback, useEffect, useState } from "react";

const AdditionalInfo = ({cafeId}) => {
    const [formData, setFormData] = useState({
        currency: "",
        language: "",
        is_zomato: 0,
        zomato_commission: "",
        is_swiggy: 0,
        swiggy_commission: "",
        is_dinein: 0,
        is_takeaway: 0,
        upi: "",
        name_at_bank: "",
        cafe_detection_radius: 0,
        is_user_location_required: false,
        is_oneview: 0,
    });
    
    const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || ""; 
    const token = localStorage.getItem("authToken");
    const [alert, setAlert] = useState({
        open: false,
        severity: "info",
        message: ""
    });
    const [initialFormData, setInitialFormData] = useState({});
    const [isFormModified, setIsFormModified] = useState(false);
    
    const zomatoCommission = formData.zomato_commission;
    const swiggyCommission = formData.swiggy_commission;
    const [initialZomatoCommission, setInitialZomatoCommission] = useState();
    const [initialSwiggyCommission, setInitialSwiggyCommission] = useState();
    const [isSwiggyCommissionModified, setIsSwiggyCommissionModified] = useState(false);
    const [isZomatoCommissionModified, setIsZomatoCommissionModified] = useState(false);

    // Check if Zomato commission is modified
    const checkIsZomatoCommissionModified = useCallback(() => {
        return zomatoCommission != initialZomatoCommission;
    }, [zomatoCommission, initialZomatoCommission]);

    useEffect(() => {
        setIsZomatoCommissionModified(checkIsZomatoCommissionModified());
    }, [zomatoCommission, initialZomatoCommission, checkIsZomatoCommissionModified]);

    // Check if Swiggy commission is modified
    const checkIsSwiggyModified = useCallback(() => {
        return swiggyCommission != initialSwiggyCommission;
    }, [swiggyCommission, initialSwiggyCommission]);

    useEffect(() => {
        setIsSwiggyCommissionModified(checkIsSwiggyModified());
    }, [swiggyCommission, initialSwiggyCommission, checkIsSwiggyModified]);

    const showAlert = (severity, message) => {
        setAlert({ open: true, severity, message });
        setTimeout(() => {
            setAlert({ ...alert, open: false });
        }, 3000);
    };

    // Check if main fields are modified
    const checkIfDataModified = useCallback(() => {
        if (!initialFormData || Object.keys(initialFormData).length === 0) return false;
        
        return Object.keys(formData).some(key => {
            // Skip commission fields in the comparison
            if (key === 'zomato_commission' || key === 'swiggy_commission') {
                return false;
            }
            
            let initialValue = initialFormData[key];
            let currentValue = formData[key];
            
            // Handle radio button values (convert to numbers for comparison)
            if (['is_zomato', 'is_swiggy', 'is_dinein', 'is_takeaway'].includes(key)) {
                initialValue = Number(initialValue);
                currentValue = Number(currentValue);
            }
            
            return currentValue !== initialValue;
        });
    }, [formData, initialFormData]);

    useEffect(() => {
        setIsFormModified(checkIfDataModified());
    }, [formData, checkIfDataModified]);

    // Fetch additional info
    const fetchAdditionalInfo = async() => {
        if (!cafeId) return;
        
        try {
            const response = await axios.get(`${baseUrl}/api/cafe-settings/v1/cafe-settings/${cafeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("additional info- ", response);
            
            if (response.data && response.data.data && response.data.data.length > 0) {
                const AdditionalData = response.data.data[0];
                
                const fetchedData = {
                    currency: AdditionalData.currency || "",
                    language: AdditionalData.language || "",
                    is_zomato: Number(AdditionalData.is_zomato) || 0,
                    zomato_commission: AdditionalData.zomato_commission ? `${AdditionalData.zomato_commission}` : "",
                    is_swiggy: Number(AdditionalData.is_swiggy) || 0,
                    swiggy_commission: AdditionalData.swiggy_commission ? `${AdditionalData.swiggy_commission}` : "",
                    is_dinein: Number(AdditionalData.is_dinein) || 0,
                    is_takeaway: Number(AdditionalData.is_takeaway) || 0,
                    upi: response.data.upi || "",
                    name_at_bank: response.data.name_at_bank || "",
                    cafe_detection_radius: AdditionalData.cafe_radius || 0,
                    is_user_location_required: AdditionalData.is_user_location_required || false,
                    is_oneview: AdditionalData.is_oneview || 0 
                };
                
                setFormData(fetchedData);
                
                // Store initial form data for comparison but exclude commission fields
                const formIsmodifiedForm = {
                    currency: AdditionalData.currency || "",
                    language: AdditionalData.language || "",
                    is_zomato: Number(AdditionalData.is_zomato) || 0,
                    is_swiggy: Number(AdditionalData.is_swiggy) || 0,
                    is_dinein: Number(AdditionalData.is_dinein) || 0,
                    is_takeaway: Number(AdditionalData.is_takeaway) || 0,
                    upi: response.data.upi || "",
                    name_at_bank: response.data.name_at_bank || "",
                    cafe_detection_radius: response.data.cafe_radius || 0,
                    is_user_location_required: response.data.is_user_location_required || false,
                    is_oneview: AdditionalData.is_oneview || 0 
                };
                setInitialFormData(formIsmodifiedForm);
                setIsFormModified(false);
                setInitialZomatoCommission(AdditionalData.zomato_commission);
                setInitialSwiggyCommission(AdditionalData.swiggy_commission);
                setIsSwiggyCommissionModified(false);
                setIsZomatoCommissionModified(false);
            }
        } catch (e) {
            console.log("Error during fetching additional info: ", e);
            showAlert("error", "Failed to fetch cafe information");
        }
    };

    useEffect(() => {
        if (cafeId) {
            fetchAdditionalInfo();
        }
    }, [cafeId]);

    // Handle main form submission
    const handleSubmitAdditionalInfo = async() => {
        const payload = {
            currency: formData.currency || "",
            is_dinein: Number(formData.is_dinein) || 0,
            is_takeaway: Number(formData.is_takeaway) || 0,
            is_zomato: Number(formData.is_zomato) || 0,
            is_swiggy: Number(formData.is_swiggy) || 0,
            language: formData.language || "",
            upi_id: formData.upi || "",
            name_at_bank: formData.name_at_bank || "",
            cafe_detection_radius: formData.cafe_detection_radius || 0,
            is_user_location_required: formData.is_user_location_required,
            is_oneview: formData.is_oneview
        };
        
        try {
            const response = await axios.put(`${baseUrl}/api/cafe-settings/v1/settings/${cafeId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            const formIsModified = {
                currency: formData.currency || "",
                is_dinein: Number(formData.is_dinein) || 0,
                is_takeaway: Number(formData.is_takeaway) || 0,
                is_zomato: Number(formData.is_zomato) || 0,
                is_swiggy: Number(formData.is_swiggy) || 0,
                language: formData.language || "",
                upi: formData.upi || "",
                name_at_bank: formData.name_at_bank || "",
                cafe_detection_radius: formData.cafe_detection_radius || 0,
                is_user_location_required: formData.is_user_location_required,
                is_oneview: formData.is_oneview
            };
            
            if (response.status === 200) {
                showAlert("success", "Additional info updated!");
                setInitialFormData(formIsModified);
                setIsFormModified(false);
            }
        } catch (e) {
            console.log("Error during submitting additional info: ", e);
            showAlert("error", "Additional info update failed!");
        }
    };

    // Handle Zomato commission update
    const handleZomatoCommisionUpdate = async() => {
        const stripPercent = (value) =>
            typeof value === "string" ? value.replace("%", "").trim() : value;
    
        const payload = {
            zomato_commison: stripPercent(formData.zomato_commission) || "",
        };
        
        try {
            const response = await axios.put(`${baseUrl}/api/cafe-settings/v1/price/${cafeId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                showAlert("success", "Zomato commission updated!");
                setInitialZomatoCommission(formData.zomato_commission);
                setIsZomatoCommissionModified(false);
            }
        } catch (e) {
            console.log("Error during update commission: ", e);
            showAlert("error", "Zomato commission update failed!");
        }
    };

    // Handle Swiggy commission update
    const handleSwiggyCommissionUpdate = async() => {
        const stripPercent = (value) =>
            typeof value === "string" ? value.replace("%", "").trim() : value;
    
        const payload = {
            swiggy_commison: stripPercent(formData.swiggy_commission) || "",
        };
        
        try {
            const response = await axios.put(`${baseUrl}/api/cafe-settings/v1/price/${cafeId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                showAlert("success", "Swiggy commission updated!");
                setInitialSwiggyCommission(formData.swiggy_commission);
                setIsSwiggyCommissionModified(false);
            }
        } catch (e) {
            console.log("Error during update swiggy commission: ", e);
            showAlert("error", "Swiggy commission update failed!");
        }
    };
    
    return (
        <Paper sx={{ width: '100%' }}>
            <Box sx={{ width: "100%" }}>
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
                
                <Typography variant="h5" sx={{ p: 2, pb: 0 }}>Additional Info</Typography>
                <Stack sx={{ p: 2, pt: 0 }}>
                    <Grid container spacing={2} sx={{ mt: 1, mb: "16px" }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth size="small" sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                 borderRadius: '4px',
                                },
                              }}>
                                <InputLabel id="currency-select-label">Currency</InputLabel>
                                <Select
                                    value={formData.currency || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                    labelId="currency-select-label"
                                    label="Currency"
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    <MenuItem value="USD">USD</MenuItem>
                                    <MenuItem value="EUR">EUR</MenuItem>
                                    <MenuItem value="INR">INR</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth size="small" sx={ {
                                '& .MuiOutlinedInput-notchedOutline': {
                                 borderRadius: '4px',
                                },
                              }}>
                                <InputLabel id="language-select-label">Language</InputLabel>
                                <Select
                                    value={formData.language || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                    labelId="language-select-label"
                                    label="Language"
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    <MenuItem value="ENGLISH">English</MenuItem>
                                    <MenuItem value="SPANISH">Spanish</MenuItem>
                                    <MenuItem value="FRENCH">French</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* Zomato Available */}
                    <Typography variant="body1">Zomato Available</Typography>
                    <RadioGroup
                        row
                        value={Number(formData.is_zomato)}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_zomato: Number(e.target.value) }))}
                    >
                        <FormControlLabel value={1} control={<Radio color="secondary" />} label="Yes" />
                        <FormControlLabel value={0} control={<Radio color="secondary" />} label="No" />
                    </RadioGroup>
                    
                    {/* Commission Block */}
                    <Grid container spacing={2} sx={{ mb: "16px" }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                value={formData.zomato_commission || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, zomato_commission: e.target.value }))}
                                label="Commission"
                                variant="outlined"
                                fullWidth
                                size="small"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    sx: {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                         borderRadius: '4px',
                                        },
                                      }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Button 
                                variant="contained" 
                                onClick={handleZomatoCommisionUpdate}
                                disabled={!isZomatoCommissionModified}
                            >
                                UPDATE MENU PRICE
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Swiggy Available */}
                    <Typography variant="body1">Swiggy Available</Typography>
                    <RadioGroup
                        row
                        value={Number(formData.is_swiggy)}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_swiggy: Number(e.target.value) }))}
                    >
                        <FormControlLabel value={1} control={<Radio color="secondary" />} label="Yes" />
                        <FormControlLabel value={0} control={<Radio color="secondary" />} label="No" />
                    </RadioGroup>
                    
                    {/* Commission Block */}
                    <Grid container spacing={2} sx={{ mb: "16px" }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                value={formData.swiggy_commission || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, swiggy_commission: e.target.value }))}
                                label="Commission"
                                variant="outlined"
                                fullWidth
                                size="small"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    sx: {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                         borderRadius: '4px',
                                        },
                                      }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Button 
                                variant="contained" 
                                onClick={handleSwiggyCommissionUpdate}
                                disabled={!isSwiggyCommissionModified}
                            >
                                UPDATE MENU PRICE
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Dine-in Available */}
                    <Typography variant="body1">Dine-in Available</Typography>
                    <RadioGroup
                        row
                        value={Number(formData.is_dinein)}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_dinein: Number(e.target.value) }))}
                    >
                        <FormControlLabel value={1} control={<Radio color="secondary" />} label="Yes" />
                        <FormControlLabel value={0} control={<Radio color="secondary" />} label="No" />
                    </RadioGroup>
                    
                    {/* Takeaway Available */}
                    <Typography variant="body1">Takeaway Available</Typography>
                    <RadioGroup
                        row
                        value={Number(formData.is_takeaway)}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_takeaway: Number(e.target.value) }))}
                    >
                        <FormControlLabel value={1} control={<Radio color="secondary" />} label="Yes" />
                        <FormControlLabel value={0} control={<Radio color="secondary" />} label="No" />
                    </RadioGroup>

                    {/* IS Oneview */}
                    <Typography variant="body1">One View</Typography>
                    <RadioGroup
                        row
                        value={Number(formData.is_oneview)}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_oneview: Number(e.target.value) }))}
                    >
                        <FormControlLabel value={1} control={<Radio color="secondary" />} label="Yes" />
                        <FormControlLabel value={0} control={<Radio color="secondary" />} label="No" />
                    </RadioGroup>

                    {/* is User location required */}
                    <Typography variant="body1">User location required</Typography>
                    <RadioGroup
                        row
                        value={Number(formData.is_user_location_required)}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_user_location_required: Number(e.target.value) }))}
                    >
                        <FormControlLabel value={1} control={<Radio color="secondary" />} label="Yes" />
                        <FormControlLabel value={0} control={<Radio color="secondary" />} label="No" />
                    </RadioGroup>

                    {/* Cafe detection radius */}
                    <Grid container spacing={2} sx={{ mt: 1, mb: "16px" }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                value={formData.cafe_detection_radius || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, cafe_detection_radius: Number(e.target.value) }))}
                                label="Cafe detection radius"
                                variant="outlined"
                                fullWidth
                                size="small"
                                type="number"
                                slotProps={{
                                    input: {
                                        sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                             borderRadius: '4px',
                                            },
                                        }
                                    }
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                    </Grid>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                value={formData.upi || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, upi: e.target.value }))}
                                label="UPI"
                                variant="outlined"
                                fullWidth
                                size="small"
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
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                value={formData.name_at_bank || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, name_at_bank: e.target.value }))}
                                label="Name at Bank"
                                variant="outlined"
                                fullWidth
                                size="small"
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
                    </Grid>

                    <Box sx={{ display: "flex", mt: 2 }}>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmitAdditionalInfo} 
                            disabled={!isFormModified}
                        >
                            Save
                        </Button>
                    </Box>
                </Stack>
            </Box>
        </Paper>
    );
};

export default AdditionalInfo;