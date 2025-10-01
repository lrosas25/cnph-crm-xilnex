import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, customer: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        setError('Failed to load customers');
      }
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (customer) => {
    setDeleteDialog({ open: true, customer });
  };

  const handleDeleteConfirm = async () => {
    try {
      await customerAPI.delete(deleteDialog.customer._id);
      setCustomers(customers.filter(c => c._id !== deleteDialog.customer._id));
      setDeleteDialog({ open: false, customer: null });
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'customer': return 'success';
      case 'prospect': return 'warning';
      case 'lead': return 'info';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const CustomerCard = ({ customer }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h2">
            {customer.fullName || `${customer.firstName} ${customer.lastName}`}
          </Typography>
          <Box>
            <IconButton size="small" color="primary">
              <EditIcon />
            </IconButton>
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => handleDeleteClick(customer)}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {customer.email}
          </Typography>
        </Box>

        {customer.phone && (
          <Box display="flex" alignItems="center" mb={1}>
            <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {customer.phone}
            </Typography>
          </Box>
        )}

        {customer.company && (
          <Box display="flex" alignItems="center" mb={2}>
            <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {customer.company}
            </Typography>
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip 
            label={customer.status || 'customer'} 
            color={getStatusColor(customer.status)}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            {new Date(customer.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/customers/add')}
        >
          Add Customer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {customers.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              No customers found
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" mt={1}>
              Start by adding your first customer
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {customers.map((customer) => (
            <Grid item xs={12} sm={6} md={4} key={customer._id}>
              <CustomerCard customer={customer} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, customer: null })}
      >
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {deleteDialog.customer?.fullName || 
            `${deleteDialog.customer?.firstName} ${deleteDialog.customer?.lastName}`}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, customer: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Customers;