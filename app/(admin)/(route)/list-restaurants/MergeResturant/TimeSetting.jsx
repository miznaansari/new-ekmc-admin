import {
  Alert,
  Button,
  Chip,
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
import axios from "@/app/(admin)/utils/axios";
import { useEffect, useState } from "react";
import NewTimeManagement from "./Time/NewTimeManagement";

const TimeSetting = ({ cafeId, transferTargetCafeId = null, timeTransferSignal = 0, onTransferSuccess = null, onSave = null }) => {
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || "";
  const token = localStorage.getItem("authToken");
  const [priceRange, setPriceRange] = useState(null);
  const [originalPriceRange, setOriginalPriceRange] = useState(null);
  const [isPriceRangeModified, setIsPriceRangeModified] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferState, setTransferState] = useState({ done: false, targetCafeId: null });
  const [timeRefreshKey, setTimeRefreshKey] = useState(0);
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
  }, [cafeId, timeTransferSignal]);

  useEffect(() => {
    setTransferState({ done: false, targetCafeId: null });
  }, [cafeId, transferTargetCafeId]);

  useEffect(() => {
    const handleTimeRefresh = (event) => {
      const affectedCafeIds = event.detail?.cafeIds || [];

      if (affectedCafeIds.includes(cafeId)) {
        fetchWeekendTimes();
        setTimeRefreshKey((prev) => prev + 1);
      }
    };

    window.addEventListener("cafe-time-updated", handleTimeRefresh);
    return () => window.removeEventListener("cafe-time-updated", handleTimeRefresh);
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

  const handleTransferTimeAndPrice = async () => {
    if (!transferTargetCafeId) {
      setAlert({ open: true, severity: "info", message: "No target cafe selected" });
      return;
    }

    try {
      setIsTransferring(true);

      const response = await axios.get(`${baseUrl}/api/user/admin/restaurant-all-info/${cafeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sourceWeekdays = response.data?.activeWeekdays || [];

      if (sourceWeekdays.length > 0) {
        const schedulesByWeekday = sourceWeekdays.reduce((acc, item) => {
          const weekday = item.weekday;
          if (!weekday) return acc;

          if (!acc[weekday]) {
            acc[weekday] = {
              weekday,
              is_holiday: item.is_holiday === 1 || item.holiday === 1 ? 1 : 0,
              slots: [],
            };
          }

          // New API shape: timings are inside item.slots[]
          if (Array.isArray(item.slots) && item.slots.length > 0) {
            item.slots.forEach((slot) => {
              if (slot?.opening_time && slot?.closing_time) {
                acc[weekday].slots.push({
                  opening_time: slot.opening_time,
                  closing_time: slot.closing_time,
                });
              }
            });
          } else if (item.opening_time && item.closing_time) {
            // Backward compatibility for older flat weekday payloads
            acc[weekday].slots.push({
              opening_time: item.opening_time,
              closing_time: item.closing_time,
            });
          }

          return acc;
        }, {});

        const schedulePayload = {
          cafe_list_id: String(transferTargetCafeId),
          schedules: Object.values(schedulesByWeekday),
        };

        await axios.post(`${baseUrl}/api/v2/schedule`, schedulePayload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Refetch both cafes immediately after transfer to ensure latest schedule is available.
      await Promise.all([
        axios.get(`${baseUrl}/api/user/admin/restaurant-all-info/${cafeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseUrl}/api/user/admin/restaurant-all-info/${transferTargetCafeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      window.dispatchEvent(
        new CustomEvent("cafe-time-updated", {
          detail: { cafeIds: [cafeId, transferTargetCafeId] },
        })
      );

      setTransferState({ done: true, targetCafeId: transferTargetCafeId });
      onTransferSuccess?.();

      setAlert({ open: true, severity: "success", message: `Time and price transferred to cafe ${transferTargetCafeId}` });
    } catch (e) {
      console.log("error during transfer time and price - ", e);
      setAlert({ open: true, severity: "error", message: "Failed to transfer time and price" });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper elevation={0} sx={{ p: 0, width: '100%' }}>
      <NewTimeManagement key={`${cafeId}-${timeRefreshKey}`} datas={schduleData} cafeListId={cafeId}/>

        <Stack sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }} spacing={1}>
            <Typography variant="h7">
              Price Range
            </Typography>
            {transferTargetCafeId && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={handleTransferTimeAndPrice}
                  disabled={isTransferring}
                >
                  {isTransferring ? "Transferring..." : `Transfer Time & Price to ${transferTargetCafeId}`}
                </Button>
                {transferState.done && transferState.targetCafeId === transferTargetCafeId && (
                  <Chip size="small" color="success" label={`Transferred to ${transferTargetCafeId}`} />
                )}
              </Stack>
            )}
          </Stack>
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