import {
    Alert,
    Avatar,
    Button,
    Collapse,
    Paper,
    Snackbar,
    Stack,
    Typography,
    Box,
    Grid,
    TextField,
    Checkbox,
    CircularProgress
} from "@mui/material";
import { useEffect, useRef, useState, useCallback } from "react";
import { Nonvegdsvg } from "../../../assets/icon/NonvegSvg";
import { Vegdsvg } from "../../../assets/icon/VwgSvg";
import { CafeContext, useCafe } from "../../../context/cafeContext";
import axios from "axios";
import { CloudArrowUp24Regular } from "@fluentui/react-icons";
import Demo from "../../../component/ImageCroper/Demo";

const GeneralInfo = ({ cafeId }) => {
    const [formData, setFormData] = useState({
        cafe_name: "",
        cafe_email: "",
        cafe_mobile_number: "",
        cafe_slogan: "",
        description: "",
        is_featured: false,
        is_most_visited: false,
        is_new_opening: false,
        is_veg: false,
        is_non_veg: false,
        status: false,
        logo_image_id: "",
        is_published: false,
        show_res_menu: false,
        allow_order: false,
        allow_login: false,
        allow_qr_edit: false,
        allow_profile_edit: false,
        allow_menu_edit: false,
        is_user_location_required: false,
        is_limelight: false,
        is_hot_today: false,
        is_daily_report: false,
        city_id: null,
        is_test_cafe: false,
    });

    const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || "";
    const { cafeIdContext } = useCafe();
    const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
    const [imagePreview, setImagePreview] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const authToken = localStorage.getItem("authToken");
    const [isFormModified, setIsFormModified] = useState(false);
    const originalFormData = useRef(null);
    const [originalImagePreview, setOriginalImagePreview] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); // For crop dialog
    const [openCropDialog, setOpenCropDialog] = useState(false); // Crop dialog state
    const [aspectRatio] = useState(4 / 4);

    const handleCropClose = () => {
        setOpenCropDialog(false);
        setSelectedImage(null);
    };

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Check if form data has changed
    const checkIfDataModified = useCallback(() => {
        if (!originalFormData.current) return false;
        const fieldsChanged = Object.keys(formData).some(key => 
            formData[key] !== originalFormData.current[key]
        );
        const imageChanged = imagePreview !== originalImagePreview;
        return fieldsChanged || imageChanged;
    }, [formData, imagePreview, originalImagePreview]);

    useEffect(() => {
        setIsFormModified(checkIfDataModified());
    }, [checkIfDataModified]);

    // Fetch cafe general info by id
    const fetchGeneralInfo = async () => {
        try {
            const response = await axios.get(`${baseUrl}/api/user/admin/restaurant-all-info/${cafeIdContext}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "*/*",
                },
            });
            const [data] = response.data.data;

            const fetchedData = {
                cafe_name: data.cafe_name || "",
                cafe_email: data.cafe_email || "",
                cafe_mobile_number: data.cafe_mobile_number || "",
                cafe_slogan: data.cafe_slogan || "",
                description: data.cafe_about || "",
                is_featured: data.is_featured || false,
                is_most_visited: data.is_most_visited || false,
                is_new_opening: data.is_new_opening || false,
                is_veg: data.is_veg || false,
                is_non_veg: data.is_non_veg || false,
                status: data.status || false,
                logo_image_id: data.logo_image_id || "",
                is_published: data.is_published || false,
                show_res_menu: data.show_res_menu || false,
                allow_order: data.allow_order || false,
                allow_login: data.allow_login || false,
                allow_qr_edit: data.allow_qr_edit || false,
                allow_profile_edit: data.allow_profile_edit || false,
                allow_menu_edit: data.allow_menu_edit || false,
                is_user_location_required: data.is_user_location_required || false,
                is_limelight: data.is_limelight || false,
                is_hot_today: data.is_hot_today || false,
                is_daily_report: data.is_daily_report || false,
                city_id: data.city_id,
                is_test_cafe: data.is_test_cafe || false,
            };

            setFormData(fetchedData);
            originalFormData.current = { ...fetchedData };
            setIsFormModified(false);

            if (data.cafe_logo_cf_original_image_url) {
                setImagePreview(data.cafe_logo_cf_original_image_url);
                setOriginalImagePreview(data.cafe_logo_cf_original_image_url);
            } else {
                setImagePreview(null);
                setOriginalImagePreview(null);
            }
        } catch (e) {
            console.log("error during fetch cafe details- ", e);
        }
    };

    useEffect(() => {
        fetchGeneralInfo();
    }, [cafeIdContext]);

    // Edit general info
    const handleEditGeneralInfo = async () => {
        const updatedData = {
            ...formData,
            logo_image_id: imagePreview || "",
            city_id: formData.city_id || 1
        };
        try {
            const response = await axios.post(`${baseUrl}/api/user/admin/restaurant-edit-general-information/${cafeId}`, updatedData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                }
            });

            if (response.status === 200) {
                setAlert({ open: true, severity: "success", message: "Restaurant updated Successfully!" });
                originalFormData.current = { ...formData };
                setOriginalImagePreview(imagePreview);
                setIsFormModified(false);
                fetchGeneralInfo();
            }
            console.log("response after on submit general edit info=", response);
        } catch (e) {
            console.log("error during submit edit general info -", e);
            setAlert({ open: true, severity: "error", message: `Error: ${e.response?.data?.msg || e.message}` });
        }
    };

    // Logo Upload
    const uploadImage = async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("uploadType", "cafe_logo");
        setImageUploading(true);
        try {
            const response = await axios.post(`${baseUrl}/api/admin/cf/v1/upload`, uploadFormData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            if (response.status === 200) {
                setAlert({ open: true, severity: "success", message: "Uploaded successfully" });
            }
            const imageUrl = response.data?.customUrl;
            setImagePreview(imageUrl);
        } catch (e) {
            console.log("error during image upload- ", e);
        } finally {
            setImageUploading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
            setOpenCropDialog(true);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
    };

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h5">General Info</Typography>
                <Collapse in={alert.open}>
                    <Snackbar
                        open={alert.open}
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        sx={{ mt: 2 }}
                        autoHideDuration={200}
                    >
                        <Alert severity={alert.severity} sx={{ width: "100%" }} onClose={() => setAlert({ ...alert, open: false })}>
                            {alert.message}
                        </Alert>
                    </Snackbar>
                </Collapse>

                <Stack direction="row" spacing={2} sx={{ alignItems: "center", mt: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{ width: 80, height: 80, position: 'relative' }}
                        src={imageUploading ? undefined : imagePreview || ""}
                    >
                        {!imagePreview && !imageUploading && "SA"}
                        {imageUploading && (
                            <CircularProgress
                                size={24}
                                sx={{
                                    color: "white",
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    marginTop: "-12px",
                                    marginLeft: "-12px",
                                }}
                            />
                        )}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Logo Upload</Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Button
                                size="small"
                                color='primary'
                                variant="contained"
                                component="label"
                                startIcon={<CloudArrowUp24Regular />}
                            >
                                Upload
                                <input
                                    type="file"
                                    hidden
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleFileChange}
                                    disabled={!isOnline}
                                />
                            </Button>
                            <Button variant="outlined" size="small" color="error" disabled={!imagePreview}
                                onClick={handleRemoveImage}
                            >
                                Remove
                            </Button>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">Allowed file types: png, jpg, jpeg.</Typography>
                        <input type="file" accept="image/png,image/jpg,image/jpeg" style={{ display: "none" }}
                            disabled={!isOnline}
                        />
                    </Box>
                </Stack>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            value={formData.cafe_name || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, cafe_name: e.target.value }))}
                            size="small"
                            label="Restaurant Name"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={!isOnline}
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
                            value={formData.cafe_slogan || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, cafe_slogan: e.target.value }))}
                            size="small"
                            label="Slogan"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={!isOnline}
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
                            value={formData.cafe_email || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, cafe_email: e.target.value }))}
                            size="small"
                            label="Email"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={!isOnline}
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
                            value={formData.cafe_mobile_number || ""}
                            type="text"
                            label="Phone Number"
                            size="small"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={!isOnline}
                            inputProps={{
                                inputMode: 'numeric',
                            }}
                            onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, "");
                                setFormData(prev => ({ ...prev, cafe_mobile_number: digitsOnly }));
                            }}
                            slotProps={{
                                input: {
                                    sx: {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderRadius: '4px',
                                        },
                                    },
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            value={formData.description || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            size="small"
                            multiline
                            rows={4}
                            label="Restaurant Description"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={!isOnline}
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

                {/* Feature Tags */}
                <Typography variant="body1" sx={{ mt: 2 }}>Feature Tags</Typography>
                <Grid container spacing={1} sx={{ alignItems: "center" }}>
                    <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Checkbox
                            checked={Boolean(formData.is_featured)}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                            disabled={!isOnline}
                            sx={{
                                color: 'secondary.main',
                                '&.Mui-checked': {
                                    color: 'secondary.main',
                                },
                            }}
                        />
                        <Typography>Featured</Typography>
                    </Grid>

                    <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Checkbox
                            checked={Boolean(formData.is_most_visited)}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_most_visited: e.target.checked }))}
                            disabled={!isOnline}
                            sx={{
                                color: 'secondary.main',
                                '&.Mui-checked': {
                                    color: 'secondary.main',
                                },
                            }}
                        />
                        <Typography>Most-Visited</Typography>
                    </Grid>

                    <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Checkbox
                            checked={Boolean(formData.is_new_opening)}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_new_opening: e.target.checked }))}
                            disabled={!isOnline}
                            sx={{
                                color: 'secondary.main',
                                '&.Mui-checked': {
                                    color: 'secondary.main',
                                },
                            }}
                        />
                        <Typography>New Opening</Typography>
                    </Grid>
                </Grid>

                {/* Food types */}
                <Typography variant="body1" sx={{ mt: 2 }}>Food Type</Typography>
                <Grid container sx={{ alignItems: "center" }}>
                    <Grid container spacing={1} sx={{ alignItems: "center", gap: 1 }}>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_non_veg)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_non_veg: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Nonvegdsvg />
                            <Typography>Non-Veg</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_veg)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_veg: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Vegdsvg />
                            <Typography>Veg</Typography>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Menu Options */}
                <Typography variant="body1" sx={{ mt: 2 }}>Menu Options</Typography>
                <Grid container sx={{ alignItems: "center" }}>
                    <Grid container spacing={1} sx={{ alignItems: "center", gap: 1 }}>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.allow_order)}
                                onChange={(e) => setFormData(prev => ({ ...prev, allow_order: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Order</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.allow_qr_edit)}
                                onChange={(e) => setFormData(prev => ({ ...prev, allow_qr_edit: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Qr Edit</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.allow_login)}
                                onChange={(e) => setFormData(prev => ({ ...prev, allow_login: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Login</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.allow_menu_edit)}
                                onChange={(e) => setFormData(prev => ({ ...prev, allow_menu_edit: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Menu Edit</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.allow_profile_edit)}
                                onChange={(e) => setFormData(prev => ({ ...prev, allow_profile_edit: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Edit Profile</Typography>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Status */}
                <Typography variant="body1" sx={{ mt: 2 }}>Status</Typography>
                <Grid container sx={{ alignItems: "center" }}>
                    <Grid container spacing={1} sx={{ alignItems: "center", gap: 1 }}>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_user_location_required)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_user_location_required: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>User Location Required</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.status)}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Status</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_published)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Published</Typography>
                        </Grid>

                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_test_cafe)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_test_cafe: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Test Cafe</Typography>
                        </Grid>

                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_limelight)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_limelight: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Limelight</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_hot_today)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_hot_today: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Hot Today</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_featured)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Featured</Typography>
                        </Grid>
                        <Grid size="auto" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Checkbox
                                checked={Boolean(formData.is_daily_report)}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_daily_report: e.target.checked }))}
                                disabled={!isOnline}
                                sx={{
                                    color: 'secondary.main',
                                    '&.Mui-checked': {
                                        color: 'secondary.main',
                                    },
                                }}
                            />
                            <Typography>Daily Report</Typography>
                        </Grid>
                    </Grid>
                </Grid>

                <Box sx={{ display: "flex", mt: 2 }}>
                    <Button variant="contained"
                        onClick={handleEditGeneralInfo}
                        disabled={!isFormModified || !isOnline}
                    >
                        Save
                    </Button>
                </Box>
            </Paper>

            {/* Crop Dialog */}
            <Demo
                selectedImage={selectedImage}
                open={openCropDialog}
                onClose={handleCropClose}
                uploadImage={uploadImage}
                aspect={aspectRatio} // Square aspect ratio, adjust as needed
                setSelectedImage={setSelectedImage}
                setOpenCropDialog={setOpenCropDialog}
            />
        </>
    );
}

export default GeneralInfo;