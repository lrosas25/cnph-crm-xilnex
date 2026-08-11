import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { BarChart as BarChartIcon, Search as SearchIcon } from '@mui/icons-material';
import { reportAPI, outletAPI } from '../services/api';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}));

const OUTLET_STORAGE_KEY = 'hrly_report_outlet';

const todayString = () => new Date().toISOString().slice(0, 10);

export default function HourlySalesReport() {
  const [outlets, setOutlets] = useState([]);
  const [outlet, setOutlet] = useState(() => localStorage.getItem(OUTLET_STORAGE_KEY) || '');
  const [date, setDate] = useState(todayString);
  const [hourFrom, setHourFrom] = useState(0);
  const [hourTo, setHourTo] = useState(23);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOutlets, setLoadingOutlets] = useState(true);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Load outlets on mount
  useEffect(() => {
    outletAPI.getAll()
      .then((data) => setOutlets(data.data || []))
      .catch(() => setOutlets([]))
      .finally(() => setLoadingOutlets(false));
  }, []);

  // Persist outlet selection
  const handleOutletChange = (e) => {
    const val = e.target.value;
    setOutlet(val);
    if (val) localStorage.setItem(OUTLET_STORAGE_KEY, val);
    else localStorage.removeItem(OUTLET_STORAGE_KEY);
  };

  const handleHourFromChange = (e) => {
    const val = Number(e.target.value);
    setHourFrom(val);
    if (val > hourTo) setHourTo(val);
  };

  const handleHourToChange = (e) => {
    const val = Number(e.target.value);
    setHourTo(val);
    if (val < hourFrom) setHourFrom(val);
  };

  const buildDateRange = useCallback(() => {
    // Construct local datetime boundaries so UTC conversion is correct
    const from = new Date(`${date}T${String(hourFrom).padStart(2, '0')}:00:00`);
    const to = new Date(`${date}T${String(hourTo).padStart(2, '0')}:59:59`);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [date, hourFrom, hourTo]);

  const handleSearch = async () => {
    if (!outlet) { setError('Please select an outlet.'); return; }
    if (!date) { setError('Please select a date.'); return; }
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const { from, to } = buildDateRange();
      const result = await reportAPI.hourlySales({ outlet, from, to });
      setRows(result.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const totalQty = rows.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <BarChartIcon color="primary" />
        <Typography variant="h5" fontWeight="bold">Hourly Sales Report</Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small" disabled={loadingOutlets}>
              <InputLabel>Outlet</InputLabel>
              <Select value={outlet} label="Outlet" onChange={handleOutletChange}>
                {outlets.map((o) => (
                  <MenuItem key={o._id} value={o.name}>{o.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} sm={2} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>From Hour</InputLabel>
              <Select value={hourFrom} label="From Hour" onChange={handleHourFromChange}>
                {HOUR_OPTIONS.map((h) => (
                  <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={2} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>To Hour</InputLabel>
              <Select value={hourTo} label="To Hour" onChange={handleHourToChange}>
                {HOUR_OPTIONS.filter((h) => h.value >= hourFrom).map((h) => (
                  <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : searched && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="subtitle1" color="text.secondary">
              {rows.length} item{rows.length !== 1 ? 's' : ''} found
            </Typography>
            {rows.length > 0 && (
              <Chip label={`Total qty: ${totalQty}`} color="primary" size="small" />
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Item Code</strong></TableCell>
                  <TableCell><strong>Item Name</strong></TableCell>
                  <TableCell align="right"><strong>Quantity</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No sales data for the selected criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{row.itemCode || '—'}</TableCell>
                      <TableCell>{row.itemName || '—'}</TableCell>
                      <TableCell align="right">{row.totalQuantity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
