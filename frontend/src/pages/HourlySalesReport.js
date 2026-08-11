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
  Slider,
} from '@mui/material';
import { BarChart as BarChartIcon, Search as SearchIcon } from '@mui/icons-material';
import { reportAPI, outletAPI } from '../services/api';

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

  const handleHourSliderChange = (_, newValue) => {
    setHourFrom(newValue[0]);
    setHourTo(newValue[1]);
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
          <Grid item xs={12} sm={5} md={4}>
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

          <Grid item xs={12} sm={3} md={2}>
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

          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Hour range: <strong>{hourFrom}:00</strong> — <strong>{hourTo}:59</strong>
            </Typography>
            <Slider
              value={[hourFrom, hourTo]}
              onChange={handleHourSliderChange}
              min={0}
              max={23}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}h`}
              marks={Array.from({ length: 24 }, (_, i) => ({ value: i, label: i % 3 === 0 ? String(i) : '' }))}
              sx={{ mt: 1 }}
            />
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
                  <TableCell><strong>Hour</strong></TableCell>
                  <TableCell align="right"><strong>Quantity</strong></TableCell>
                  <TableCell><strong>Item Code</strong></TableCell>
                  <TableCell><strong>Item Name</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No sales data for the selected criteria.
                    </TableCell>
                  </TableRow>
                ) : (() => {
                  // Build hour groups to compute rowSpan for the Hour cell
                  const groups = [];
                  rows.forEach((row) => {
                    const last = groups[groups.length - 1];
                    if (last && last.hour === row.hour) {
                      last.items.push(row);
                    } else {
                      groups.push({ hour: row.hour, items: [row] });
                    }
                  });
                  return groups.flatMap((group) =>
                    group.items.map((row, i) => (
                      <TableRow key={`${group.hour}-${i}`} hover>
                        {i === 0 && (
                          <TableCell
                            rowSpan={group.items.length}
                            align="center"
                            sx={{ fontWeight: 'bold', verticalAlign: 'middle', borderRight: '1px solid', borderColor: 'divider' }}
                          >
                            {group.hour}
                          </TableCell>
                        )}
                        <TableCell align="right">{row.totalQuantity}</TableCell>
                        <TableCell>{row.itemCode || '—'}</TableCell>
                        <TableCell>{row.itemName || '—'}</TableCell>
                      </TableRow>
                    ))
                  );
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
