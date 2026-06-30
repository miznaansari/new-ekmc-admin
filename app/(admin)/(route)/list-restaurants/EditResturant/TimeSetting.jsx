import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import axios from "axios";
import { useEffect, useState } from "react";
import NewTimeManagement from "./Time/NewTimeManagement";

const TimeSetting = ({ cafeId }) => {
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || "";
  const token = localStorage.getItem("authToken");
  const [priceRange, setPriceRange] = useState(null);
  const [originalPriceRange, setOriginalPriceRange] = useState(null);
  const [isPriceRangeModified, setIsPriceRangeModified] = useState(false);
  const [schduleData, setSchduleData] = useState();

  // Check if price range changed
  useEffect(() => {
    if (originalPriceRange !== null) {
      setIsPriceRangeModified(priceRange !== originalPriceRange);
    }
  }, [priceRange, originalPriceRange]);

  const fetchWeekendTimes = async () => {
    try {
      const response = await axios.get(`${baseUrl}/api/user/admin/restaurant-all-info/${cafeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("res= ", response);
      const data = response.data.activeWeekdays || [];
      setSchduleData(data);

      // Set price range
      const fetchedPriceRange = response.data.data?.[0]?.cafe_price_range || 0;
      setPriceRange(fetchedPriceRange);
      setOriginalPriceRange(fetchedPriceRange);
      console.log("price range = ", fetchedPriceRange);

      setIsPriceRangeModified(false);

    } catch (e) {
      console.log("Error during fetching weekend times -", e);
      setAlert({ open: true, severity: "error", message: "Failed to load schedule data" });
    }
  };

  useEffect(() => {
    fetchWeekendTimes();
  }, [cafeId]);

  // Update price range
  const handlePriceRange = async () => {
    if (!isPriceRangeModified) {
      setAlert({ open: true, message: "No changes to save", severity: "info" });
      return;
    }

    const pricePayload = {
      cafe_price_range: priceRange
    };

    try {
      const res = await axios.put(`${baseUrl}/api/v2/cafe-price/${cafeId}`, pricePayload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("res pricerange update= ", res);
      setAlert({ open: true, message: "Price range updated successfully!", severity: "success" });
      setOriginalPriceRange(priceRange);
      setIsPriceRangeModified(false);

    } catch (e) {
      console.log("error during updating price- ", e);
      console.log("error message = ", e.response?.data?.msg)
      setAlert({ open: true, severity: "error", message: e.response?.data?.msg || "Failed to update price range" });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper elevation={0} sx={{ p: 0, width: '100%' }}>
     <NewTimeManagement datas={schduleData} cafeListId={cafeId}/>

        <Stack sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Price Range
          </Typography>
          <Grid container spacing={2} sx={{ mb: "16px" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Price Range"
                select
                variant="outlined"
                fullWidth
                size="small"
                required
                value={priceRange !== null && priceRange !== undefined ? priceRange : ''}
                onChange={(e) => {
                  console.log("pricerange selected-", e.target.value);
                  setPriceRange(e.target.value);
                }}
                slotProps={{
                  input: {
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: '7px',
                      },
                    },
                  }
                }}
              >
                <MenuItem value={0}>Select Price Range</MenuItem>
                <MenuItem value={1}>Most Expensive</MenuItem>
                <MenuItem value={2}>Expensive</MenuItem>
                <MenuItem value={3}>Normal</MenuItem>
                <MenuItem value={4}>Economy</MenuItem>
                <MenuItem value={5}>Most Economy</MenuItem>
              </TextField>

            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                variant="contained"
                onClick={handlePriceRange}
                disabled={!isPriceRangeModified}
              >
                UPDATE PRICE RANGE
              </Button>
            </Grid>

          </Grid>
        </Stack>


      </Paper>
    </LocalizationProvider>
  );
};

export default TimeSetting;