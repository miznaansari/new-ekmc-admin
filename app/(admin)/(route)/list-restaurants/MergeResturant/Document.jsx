import { Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, FormLabel, Grid, Paper, Radio, RadioGroup, Snackbar, Stack, TextField, Typography } from "@mui/material";
import axios from "@/app/(admin)/utils/axios";
import { useCallback, useEffect, useState } from "react";
import UploadCloudIcon from "../../../assets/icon/UploadCloudIcon";

const Document = ({cafeId, transferTargetCafeId = null, onSave = null}) => {
    const [formData, setFormData] = useState({
        fssai_certificate_url: "",
        fssai_licence_number: "",
        gst_certificate_url: "",
        gst_number: "",
        trade_name: "",
        legal_name: "",
        registered_on: "",
        is_fassai: 0,
        is_gst: 0
    });
    
    const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || ""; 
    const token = localStorage.getItem('authToken');
    const [pdfFile, setPdfFile] = useState(null);
    const [gstCertificateUrl, setGstCertificateUrl] = useState(null);
    const [fssaiUrl, setFssiUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [gstUploading, setGstUploading] = useState(false);
    const [fssaiUploading, setFssaiUploading] = useState(false);

    const [initialFormValues, setInitialFormValues] = useState({});
    const [isFormModified, setIsFormModified] = useState(false);
    const [alert, setAlert] = useState({
        open: false,
        severity: "info",
        message: ""
    });

    const isGst = formData.is_gst;
    const isFssai = formData.is_fassai;

    const setValue = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };
    
    const showAlert = (severity, message) => {
        setAlert({ open: true, severity, message });
        setTimeout(() => {
            setAlert({ ...alert, open: false });
        }, 3000);
    };

    // Improved comparison function with proper type handling
    const checkIfDataModified = useCallback(() => {
        if (!initialFormValues || Object.keys(initialFormValues).length === 0) return false;
        
        // Compare each field with proper type handling
        return Object.keys(formData).some(key => {
            // Convert to the same type before comparison
            let initialValue = initialFormValues[key];
            let currentValue = formData[key];
            
            // Handle specific type conversions
            if (key === "is_gst" || key === "is_fassai") {
                initialValue = initialValue === true || initialValue === 1 ? 1 : 0;
                currentValue = currentValue === true || currentValue === 1 ? 1 : 0;
            }
            
            return currentValue !== initialValue;
        });
    }, [formData, initialFormValues]);

    useEffect(() => {
        setIsFormModified(checkIfDataModified());
    }, [formData, checkIfDataModified]);

    // Fetch document details
    const fetchDocumentDetails = async() => {
        try {
            const response = await axios.get(`${baseUrl}/api/cafe-settings/v1/cafe-settings/${cafeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            const [data] = response.data?.data || [{}];
            
            const fetchedData = {
                fssai_certificate_url: data.fssai_certificate_url || "",
                fssai_licence_number: data.fssai_licence_number || "",
                gst_certificate_url: data.gst_certificate_url || "",
                gst_number: data.gst_number || "",
                trade_name: data.trade_name || "",
                legal_name: data.legal_name || "",
                registered_on: data.registered_on ? data.registered_on.split("T")[0] : "",
                is_fassai: data.is_fassai === true || data.is_fassai === 1 ? 1 : 0,
                is_gst: data.is_gst === true || data.is_gst === 1 ? 1 : 0
            };
            
            setFormData(fetchedData);
            setInitialFormValues(fetchedData);
            setIsFormModified(false);
            
        } catch(e) {
            console.log("error during fetching document details= ", e);
        }
    };

    useEffect(() => {
        if (cafeId) {
            fetchDocumentDetails();
        }
    }, [cafeId]);

    // PDF GST upload API
    const handleGstFileUpload = async(file) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        
        try {
            setUploading(true);
            setGstUploading(true);
            const response = await axios.post(`${baseUrl}/api/user/admin/uploadFile`, uploadFormData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            console.log("gst response- ", response.status);
            setGstCertificateUrl(response.data);
            setAlert({open: true, severity: "success", message: "GST file uploaded!"});
            
            if(response.status === 200){
                setValue("gst_certificate_url", response.data);
            }
            
        } catch(e) {
            console.log("error during pdf file upload = ", e);
            setAlert({open: true, severity: "error", message: "GST file upload failed!"});
        } finally {
            setUploading(false);
            setGstUploading(false);
        }
    };

    // FSSAI certificate upload
    const handleFssaiFileUpload = async(file) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        
        try {
            setUploading(true);
            setFssaiUploading(true);
            const response = await axios.post(`${baseUrl}/api/user/admin/uploadFile`, uploadFormData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            
            setFssiUrl(response.data);
            setAlert({open: true, severity: "success", message: "FSSAI file uploaded!"});
            if(response.status === 200){
                setValue("fssai_certificate_url", response.data);
            }
            
        } catch(e) {
            console.log("error during fssai certificate upload = ", e);
            setAlert({open: true, severity: "error", message: "FSSAI file upload failed!"});
        } finally {
            setUploading(false);
            setFssaiUploading(false);
        }
    };

    // On submit documents
    const handleSubmitDocuments = async() => {
        const payload = {
            gst_number: formData.gst_number,
            fssai_licence_number: formData.fssai_licence_number,
            gst_certificate_url: gstCertificateUrl || formData.gst_certificate_url,
            fssai_certificate_url: fssaiUrl || formData.fssai_certificate_url,
            is_gst: formData.is_gst,
            trade_name: formData.trade_name,
            legal_name: formData.legal_name,
            registered_on: formData.registered_on || "0.0.0",
            is_fassai: formData.is_fassai
        };
        
        try {
            await axios.put(`${baseUrl}/api/cafe-settings/v1/doc/${cafeId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            setInitialFormValues(formData);
            setIsFormModified(false);
            
            setAlert({open: true, severity: "success", message: "Document Info updated!"});
            onSave?.();
        } catch(e) {
            console.log("error during submitting documentation- ", e);
            setAlert({open: true, severity: "error", message: "Failed updating Document Info!"});
        }
    };
    
    return (
        <Paper sx={{ p: 2 }}>
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
            
            {/* Taxation Details */}
            <Typography variant="h5">Legal Documentation</Typography>
            <Box>
                <Typography variant="h6" sx={{ pt: 1, color: '#00000099' }}>Taxation Details</Typography>
                <FormControl component="fieldset">
                    <RadioGroup
                        row
                        value={formData.is_gst === 1 ? "1" : "0"}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_gst: parseInt(e.target.value) }))}
                    >
                        <FormControlLabel value="1" control={<Radio color="secondary" />} label="Yes" />
                        <FormControlLabel value="0" control={<Radio color="secondary" />} label="No" />
                    </RadioGroup>
                </FormControl>
                <Grid container spacing={1.5} sx={{pt:1}}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            value={formData.gst_number || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, gst_number: e.target.value }))}
                            fullWidth
                            size="small"
                            label={"GST Number"}
                            variant="outlined"
                            disabled={isGst === 0}
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
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            value={formData.trade_name || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, trade_name: e.target.value }))}
                            fullWidth
                            size="small"
                            label="Business Trade Name"
                            variant="outlined"
                            disabled={isGst === 0}
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
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box>
                            <TextField
                                value={formData.legal_name || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
                                fullWidth
                                size="small"
                                label="Business Legal Name"
                                variant="outlined"
                                disabled={isGst === 0}
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
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            value={formData.registered_on || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, registered_on: e.target.value }))}
                            fullWidth
                            type="date"
                            label="GST Registration On"
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            disabled={isGst === 0}
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
                        <label htmlFor="gst-file-upload">
                            <Box
                                width="100%"
                                height="100px"
                                bgcolor={"rgba(36, 36, 36, 0.10)"}
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                borderRadius="10px"
                            >
                                <Box textAlign="center">
                                    <input
                                        id="gst-file-upload"
                                        type="file"
                                        hidden
                                        disabled
                                        accept=".pdf,.jpg,.jpeg,.png,image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setPdfFile(file);
                                                handleGstFileUpload(file);
                                            }
                                        }}
                                    />
                                    {gstUploading ? (
                                        <CircularProgress size={20} thickness={5} color={"Black"} />
                                    ) : (
                                        <>
                                            <UploadCloudIcon />
                                            <Typography fontSize={"13px"} fontWeight={500}><span style={{ color: '#004A00' }}>CLICK TO UPLOAD</span><span style={{color:'#00000099'}}> OR DRAG AND DROP</span></Typography>
                                            <Typography fontSize={"11px"} color="#00000099" fontWeight={500}>PDF (MAX. 800x400px)</Typography>
                                            <Typography fontSize={"11px"} color="#b40303ff" fontWeight={500}>Not Available Yet!</Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        </label>
                    </Grid>
                </Grid>
            </Box>  

            {/* FSSAI CERTIFICATE */}
            <Stack sx={{pt:1}}>
                <Typography variant="h6" sx={{ mb: 2, color:'#00000099' }}>FSSAI Certificate (PDF only)</Typography>
                <FormControl component="fieldset">
                    <RadioGroup
                        row
                        value={formData.is_fassai === 1 ? "1" : "0"}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_fassai: parseInt(e.target.value) }))}
                    >
                        <FormControlLabel value="1" control={<Radio color="secondary" />} label="Yes" />
                        <FormControlLabel value="0" control={<Radio color="secondary" />} label="No" />
                    </RadioGroup>
                </FormControl>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            value={formData.fssai_licence_number || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, fssai_licence_number: e.target.value }))}
                            fullWidth
                            size="small"
                            label={"FSSAI License No."}
                            variant="outlined"
                            disabled={isFssai === 0}
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
                        <label htmlFor="fssai-file-upload">
                            <Box
                                width="100%"
                                height="100px"
                                bgcolor={"rgba(36, 36, 36, 0.10)"}
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                borderRadius="10px"
                            >
                                <Box textAlign="center">
                                    <input
                                        id="fssai-file-upload"
                                        type="file"
                                        hidden
                                        disabled
                                        accept=".pdf,.jpg,.jpeg,.png,image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setPdfFile(file);
                                                handleFssaiFileUpload(file);
                                            }
                                        }}
                                    />
                                    {fssaiUploading ? (
                                        <CircularProgress size={20} thickness={5} color={"Black"} />
                                    ) : (
                                        <>
                                            <UploadCloudIcon />
                                            <Typography fontSize={"13px"} fontWeight={500}><span style={{ color: '#004A00' }}>CLICK TO UPLOAD</span><span style={{color:'#00000099'}}> OR DRAG AND DROP</span></Typography>
                                            <Typography fontSize={"11px"} color="#00000099" fontWeight={500}>PDF (MAX. 800x400px)</Typography>
                                            <Typography fontSize={"11px"} color="#b40303ff" fontWeight={500}>Not Available Yet!</Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        </label>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmitDocuments}
                        disabled={!isFormModified}
                    >
                        Save
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
}

export default Document;