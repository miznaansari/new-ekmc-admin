import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Switch,
  Avatar,
  InputAdornment,
  CircularProgress,
  FormControl,
  Snackbar,
  Paper,
  Stack,
  IconButton,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import { Close } from "@mui/icons-material";
import { CloudArrowUp16Regular, Delete16Regular, DocumentArrowUp16Regular, Image32Regular } from "@fluentui/react-icons";
import Demo from "../ImageCroper/Demo";

const AddEmployeesEatery = ({ onSuccess, onClose, selectEatry }) => {
  const [selectedCafe, setSelectedCafe] = useState(
    selectEatry?.id ? { label: selectEatry.cafe_name || selectEatry.name, value: selectEatry.id } : null
  );
  const [restaurants, setRestaurants] = useState(
    selectEatry?.id ? [{ label: selectEatry.cafe_name || selectEatry.name, value: selectEatry.id }] : []
  );
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { handleSubmit, control, reset, setValue, formState: { errors }, } = useForm({
    defaultValues: {
      user_role_id: "",
      first_name: "",
      last_name: "",
      cafe_list_id: selectEatry?.id || null,
      mobile_number: "",
      email: "",
      status: true,
      photo_proof_id_url: "",
      address_proof_id_url: "",
      profile_pic_image_id: "",
      uap_azure_original_image_url: ""
    },
    resolver: async (data) => {
      const errors = {};
      if (!data.first_name) errors.first_name = { message: "First name is required" };
      if (!data.last_name) errors.last_name = { message: "Last name is required" };
      if (!data.mobile_number) {
        errors.mobile_number = { message: "Mobile number is required" };
      } else if (!/^[6-9]\d{9}$/.test(data.mobile_number)) {
        errors.mobile_number = { message: "Invalid mobile number" };
      }

      return { values: data, errors };
    },
  });
  const [seacrhCafeQuery, setSearchCafequery] = useState("");
  const [alert, setAlert] = useState({
    open: false,
    severity: "info",
    message: ""
  });
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedImage, setSelectedImage] = useState(null);
  const [openCropDialog, setOpenCropDialog] = useState(false);
  const [aspectRatio] = useState(4 / 4);
  const handleCropClose = () => {
    setOpenCropDialog(false);
    setSelectedImage(null);
  };

  const fetchRestaurants = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || '';
      const url = new URL(`${baseUrl}/api/user/admin/cafe-list/get/all`);
      if (seacrhCafeQuery) {
        url.searchParams.append("s", seacrhCafeQuery);
      }

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch restaurants");

      const responseData = await res.json();
      const cafeOptions = (responseData?.data || []).map((cafe) => ({
        label: cafe.cafe_name,
        value: cafe.id
      }))
      setRestaurants(cafeOptions);

    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setLoading(false);
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (seacrhCafeQuery.trim().length >= 1) {
        fetchRestaurants();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [seacrhCafeQuery]);


  const onSubmit = async (data) => {
    if (
      !data.user_role_id ||
      !data.first_name ||
      !data.last_name ||
      !data.cafe_list_id ||
      !data.mobile_number
    ) {
      setSnackbarMessage("Please fill out all required fields");
      setOpenSnackbar(true);
      return;
    }

    const finalPayload = {
      ...data,
      photo_proof_id_url: '',
      profile_pic_image_id: previewImage,
      uap_azure_original_image_url: '',
      status: data.status ? 1 : 0,
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || '';
      const res = await fetch(`${baseUrl}/api/admin/restaurant/v1/employee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(finalPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw { response: { data: errData } };
      }

      setSnackbarMessage("Employee created successfully!");
      onSuccess();
      setOpenSnackbar(true);
      reset();
    } catch (error) {
      console.log("error creating employee- ", error)
      const message = error.response?.data?.msg || error.message || "Error creating employee";
      setAlert({ open: true, severity: "error", message: message })
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadType', "user_customer_profile");

    try {
      setUploading(true)
      const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || '';
      const res = await fetch(`${baseUrl}/api/admin/cf/v1/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Image upload failed");

      const responseData = await res.json();
      const imageUl = responseData?.customUrl;
      setPreviewImage(imageUl)
    } catch (err) {
      console.error(err)
      return null;
    } finally {
      setUploading(false)
    }
  };
  const [previewImage, setPreviewImage] = useState('')
  const [uploading, setUploading] = useState(false)

  const fileInputRef = React.useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setOpenCropDialog(true);
      setUploading(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => {
    setPreviewImage('');
  }

  const uploadPdfFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || '';
      const res = await fetch(`${baseUrl}/api/user/admin/uploadFile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("PDF upload failed");
      const responseData = await res.json();
      console.log("response of file upload- ", responseData);
    } catch (e) {
      console.log("error during upload pdf file= ", e)
      setAlert({ open: true, severity: "error", message: "error uploading file!!" })
    }
  }

  const handlePhotoProofFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadPdfFile(file);
    } else {
      setAlert({ open: true, severity: "error", message: "error uploading file!!" })
    }
  }

  const handleAddressproofFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadPdfFile(file);
    }
  }

  return (
    <Box sx={{
      height: isSmallScreen ? "95vh" : '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        bgcolor: "#F7F7F7",
        flexShrink: 0
      }}>
        <Paper sx={{ padding: 1, margin: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Add Employee</Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Stack>
        </Paper>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1,
          pb: 1
        }}>
          <Paper sx={{ p: 2 }}>
            <Box textAlign="center" mb={2}>
              {previewImage ? (
                <Avatar src={previewImage} sx={{ width: '100%', height: 250, margin: 'auto', borderRadius: '10px' }} />
              ) : (
                <Avatar sx={{ width: '100%', height: 150, margin: 'auto', borderRadius: '10px' }}>
                  {uploading ? <CircularProgress /> : <Image32Regular color="black" />}
                </Avatar>
              )}
              <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                <Button
                  sx={{ flex: 1 }}
                  component="label"
                  variant="outlined"
                  size="small"
                  color="primary"
                  startIcon={<CloudArrowUp16Regular />}
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    disabled={uploading}
                  />
                </Button>
                <Button
                  sx={{ flex: 1 }}
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Delete16Regular />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </Stack>
            </Box>

            <Typography variant='h6' marginBottom={2}>Employee Details</Typography>

            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="First Name"
                      variant="outlined"
                      fullWidth
                      size="small"
                      margin="dense"
                      required
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Last Name"
                      variant="outlined"
                      fullWidth
                      required
                      size="small"
                      margin="dense"
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" required>
                  <Controller
                    name="cafe_list_id"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        options={restaurants}
                        value={selectedCafe}
                        getOptionKey={(option) => option.value}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        onInputChange={(_, inputValue) => {
                          setSearchCafequery(inputValue);
                        }}
                        onChange={(_, newValue) => {
                          setSelectedCafe(newValue || null);
                          onChange(newValue?.value || null);
                        }}
                        loading={loading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Restaurant Name"
                            variant="outlined"
                            size="small"
                            margin="dense"
                            required
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loading ? (
                                    <CircularProgress
                                      color="inherit"
                                      size={20}
                                    />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" required>
                  <Controller
                    name="user_role_id"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        select
                        label="Employee Role"
                        variant="outlined"
                        fullWidth
                        size="small"
                        margin="dense"
                        required
                        SelectProps={{
                          native: true,
                        }}
                        {...field}
                      >
                        <option value=""></option>
                        <option value="2">Manager</option>
                        <option value="3">Kitchen</option>
                        <option value="4">Captain</option>
                      </TextField>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Email"
                      variant="outlined"
                      fullWidth
                      size="small"
                      margin="dense"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="mobile_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Phone"
                      variant="outlined"
                      fullWidth
                      size="small"
                      margin="dense"
                      required
                      error={!!errors.mobile_number}
                      helperText={errors.mobile_number?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
              <FormControl variant="outlined" sx={{ flex: 1 }} size="small">
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Photo Proof ID (PDF only)"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <DocumentArrowUp16Regular />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>
              <Button component="label" variant="contained" color='secondary' size="small">
                Upload
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handlePhotoProofFile}
                />
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
              <FormControl variant="outlined" sx={{ flex: 1 }} size="small">
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Address Proof ID (PDF only)"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <DocumentArrowUp16Regular />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>
              <Button component="label" variant="contained" size="small" color='secondary'>
                Upload
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handleAddressproofFile}
                />
              </Button>
            </Box>

            <Box display="flex" alignItems="center" mt={3} mb={2}>
              <Typography>Active</Typography>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    color='secondary'
                    size='small'
                    inputProps={{ "aria-label": "controlled" }}
                  />
                )}
              />
            </Box>
          </Paper>
        </Box>

        <Box sx={{
          p: 1,
          bgcolor: "#F7F7F7",
          borderTop: '1px solid #e0e0e0',
        }}>
          <Paper sx={{ display: "flex", gap: 1, padding: 1 }}>
            <Button
              variant="outlined"
              color='error'
              sx={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" sx={{ flex: 1 }} variant="contained">
              {loading ? <CircularProgress size={24} thickness={4} /> : 'Save'}
            </Button>
          </Paper>
        </Box>
      </Box>

      <Demo
        selectedImage={selectedImage}
        open={openCropDialog}
        onClose={handleCropClose}
        uploadImage={uploadImage}
        aspect={aspectRatio}
        setSelectedImage={setSelectedImage}
        setOpenCropDialog={setOpenCropDialog}
      />

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
    </Box>
  );
};

export default AddEmployeesEatery;
