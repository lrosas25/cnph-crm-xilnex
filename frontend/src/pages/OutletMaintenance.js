import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Paper,
  Container,
  InputAdornment,
  MenuItem,
  Tooltip,
  Fab,
  Collapse,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Storefront as StorefrontIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const OutletMaintenance = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    phone: '',
    email: '',
    manager: '',
    status: 'active',
    type: 'store',
  });

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'inactive', label: 'Inactive', color: 'default' },
    { value: 'maintenance', label: 'Maintenance', color: 'warning' },
  ];

  const typeOptions = [
    { value: 'store', label: 'Store', icon: '🏪' },
    { value: 'warehouse', label: 'Warehouse', icon: '🏭' },
    { value: 'office', label: 'Office', icon: '🏢' },
    { value: 'online', label: 'Online', icon: '💻' },
  ];

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);

      const response = await fetch(`http://localhost:5685/api/outlets?${params}`);
      const result = await response.json();

      if (result.success) {
        setOutlets(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch outlets');
      }
    } catch (err) {
      setError(err.message);
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (outlet = null) => {
    if (outlet) {
      setEditingOutlet(outlet);
      setFormData({
        name: outlet.name || '',
        code: outlet.code || '',
        description: outlet.description || '',
        address: {
          street: outlet.address?.street || '',
          city: outlet.address?.city || '',
          state: outlet.address?.state || '',
          zipCode: outlet.address?.zipCode || '',
          country: outlet.address?.country || '',
        },
        phone: outlet.phone || '',
        email: outlet.email || '',
        manager: outlet.manager || '',
        status: outlet.status || 'active',
        type: outlet.type || 'store',
      });
    } else {
      setEditingOutlet(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        phone: '',
        email: '',
        manager: '',
        status: 'active',
        type: 'store',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOutlet(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      phone: '',
      email: '',
      manager: '',
      status: 'active',
      type: 'store',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const url = editingOutlet 
        ? `http://localhost:5685/api/outlets/${editingOutlet._id}`
        : 'http://localhost:5685/api/outlets';
      
      const method = editingOutlet ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(editingOutlet ? 'Outlet updated successfully!' : 'Outlet created successfully!');
        setError(null);
        handleCloseDialog();
        fetchOutlets();
      } else {
        throw new Error(Array.isArray(result.error) ? result.error.join(', ') : result.error);
      }
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (outletId) => {
    if (!window.confirm('Are you sure you want to delete this outlet?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5685/api/outlets/${outletId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Outlet deleted successfully!');
        setError(null);
        fetchOutlets();
      } else {
        throw new Error(result.error || 'Failed to delete outlet');
      }
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status) || statusOptions[0];
    return (
      <Chip
        label={statusConfig.label}
        color={statusConfig.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const getTypeIcon = (type) => {
    const typeConfig = typeOptions.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : '🏪';
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <span style={{ marginRight: 8, fontSize: '1.2em' }}>
            {getTypeIcon(params.row.type)}
          </span>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {params.row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.code}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => {
        const typeConfig = typeOptions.find(t => t.value === params.value);
        return typeConfig ? typeConfig.label : params.value;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'manager',
      headerName: 'Manager',
      width: 150,
    },
    {
      field: 'fullAddress',
      headerName: 'Address',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row._id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Paper elevation={0} sx={{ mb: 4, p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <StorefrontIcon sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
                  Outlet Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Manage store outlets and locations
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<RefreshIcon />}
                onClick={fetchOutlets}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Search and Filter Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search outlets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={fetchOutlets}
                  disabled={loading}
                >
                  Search
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Outlet
                </Button>
              </Grid>
            </Grid>

            <Collapse in={showFilters}>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {typeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box display="flex" alignItems="center">
                            <span style={{ marginRight: 8 }}>{option.icon}</span>
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>

        {/* Data Grid */}
        <Card>
          <CardContent>
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={outlets}
                columns={columns}
                loading={loading}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                getRowId={(row) => row._id}
                sx={{
                  '& .MuiDataGrid-cell:hover': {
                    color: 'primary.main',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 2,
              minHeight: '80vh'
            }
          }}
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <StorefrontIcon fontSize="large" />
              <Box>
                <Typography variant="h5" component="div">
                  {editingOutlet ? 'Edit Outlet' : 'Add New Outlet'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {editingOutlet ? 'Update outlet information' : 'Create a new outlet location'}
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {/* Left Column - Basic Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 3, height: 'fit-content' }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <BusinessIcon />
                      Basic Information
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Outlet Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Outlet Code"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                          helperText="Unique identifier (e.g., Main, Br1)"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Type"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                        >
                          {typeOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <span>{option.icon}</span>
                                {option.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          select
                          label="Status"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                        >
                          {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          multiline
                          rows={4}
                          variant="outlined"
                          placeholder="Brief description of this outlet..."
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Contact Information */}
                  <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <PhoneIcon />
                      Contact Information
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="+639171234567"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="outlet@company.com"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Manager"
                          name="manager"
                          value={formData.manager}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="Manager name"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Right Column - Address Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 3, height: 'fit-content' }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <LocationIcon />
                      Address Information
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Street Address"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="123 Main Street"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="City"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="Manila"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="State/Province"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="Metro Manila"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="ZIP/Postal Code"
                          name="address.zipCode"
                          value={formData.address.zipCode}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="1000"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Country"
                          name="address.country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          variant="outlined"
                          placeholder="Philippines"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, bgcolor: 'grey.50', gap: 2 }}>
              <Button 
                onClick={handleCloseDialog} 
                variant="outlined"
                size="large"
                startIcon={<CancelIcon />}
                sx={{ minWidth: 120 }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
                size="large"
                startIcon={<SaveIcon />}
                sx={{ minWidth: 120 }}
              >
                {editingOutlet ? 'Update Outlet' : 'Create Outlet'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Container>
  );
};

export default OutletMaintenance;