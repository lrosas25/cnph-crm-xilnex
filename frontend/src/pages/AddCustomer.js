import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Container,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Notes as NotesIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NextIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  PrivacyTip as PrivacyTipIcon,
  Shield as ShieldIcon,
  ExpandMore as ExpandMoreIcon,
  Lock as LockIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../services/api';

const statusOptions = [
  { value: 'lead', label: 'Lead', color: 'info', icon: '👋' },
  { value: 'prospect', label: 'Prospect', color: 'warning', icon: '🎯' },
  { value: 'customer', label: 'Customer', color: 'success', icon: '✅' },
  { value: 'inactive', label: 'Inactive', color: 'default', icon: '😴' },
];

const sourceOptions = [
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'referral', label: 'Referral', icon: '👥' },
  { value: 'social_media', label: 'Social Media', icon: '📱' },
  { value: 'email_campaign', label: 'Email Campaign', icon: '📧' },
  { value: 'cold_call', label: 'Cold Call', icon: '📞' },
  { value: 'event', label: 'Event', icon: '🎪' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const steps = [
  'Data Privacy Agreement',
  'Basic Information', 
  'Contact Details', 
  'Address & Notes'
];

function AddCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [outletsLoading, setOutletsLoading] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'customer',
    source: 'website',
    outlet: '',
    notes: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'firstName':
        if (!value.trim()) errors.firstName = 'First name is required';
        else if (value.length < 2) errors.firstName = 'First name must be at least 2 characters';
        break;
      case 'lastName':
        if (!value.trim()) errors.lastName = 'Last name is required';
        else if (value.length < 2) errors.lastName = 'Last name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          errors.phone = 'Phone number is required';
        } else if (!/^\+639\d{9}$/.test(value)) {
          errors.phone = 'Phone number must follow the format +639171234567';
        }
        break;
      default:
        break;
    }
    
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate field on change
    const fieldErrors = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      ...fieldErrors,
      [name]: fieldErrors[name] || undefined
    }));
    
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

  // Fetch outlets from API
  const fetchOutlets = async () => {
    try {
      setOutletsLoading(true);
      const response = await fetch('http://localhost:5685/api/outlets?status=active');
      const result = await response.json();
      
      if (result.success) {
        setOutlets(result.data);
        // Set default outlet to first active outlet if available
        if (result.data.length > 0 && !formData.outlet) {
          setFormData(prev => ({
            ...prev,
            outlet: result.data[0].code
          }));
        }
      }
    } catch (err) {
      // Error fetching outlets - outlets will remain empty
      setError('Unable to load outlet information. Please refresh and try again.');
    } finally {
      setOutletsLoading(false);
    }
  };

  // Fetch outlets on component mount
  useEffect(() => {
    fetchOutlets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const allErrors = {};
    ['firstName', 'lastName', 'email'].forEach(field => {
      const fieldErrors = validateField(field, formData[field]);
      Object.assign(allErrors, fieldErrors);
    });
    
    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await customerAPI.create(formData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/customers');
        }, 2000);
      } else {
        // Handle Xilnex sync errors specifically
        if (response.error && response.error.includes('Xilnex')) {
          setError(`Xilnex Integration Error: ${response.error}. Customer was not saved.`);
        } else {
          setError(response.message || 'Failed to create customer');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create customer';
      
      // Check if it's a Xilnex-related error
      if (errorMessage.includes('Xilnex') || err.response?.data?.xilnexError) {
        setError(`Xilnex Integration Error: ${errorMessage}. Customer was not saved. Please check Xilnex configuration and try again.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (e) => {
    e.preventDefault(); // Prevent any form submission
    e.stopPropagation(); // Stop event bubbling
    
    // Validate privacy agreement on first step
    if (activeStep === 0 && !privacyAgreed) {
      setError('Please accept the privacy agreement to continue');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    setActiveStep((prevActiveStep) => {
      return prevActiveStep + 1;
    });
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                  <SecurityIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5" color="primary" fontWeight={600}>
                    Data Privacy Agreement
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please review and accept our privacy policy to continue
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <PrivacyTipIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="primary">
                    Privacy Notice
                  </Typography>
                </Box>
                
                <Typography variant="body1" paragraph>
                  We are committed to protecting your personal information and your right to privacy. 
                  This privacy notice explains how we collect, use, and protect your information when you use our CRM system.
                </Typography>

                <Accordion elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center">
                      <LockIcon sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        What information do we collect?
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Personal identification information (Name, email address, phone number)" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Business information (Company name, position, business address)" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Communication preferences and interaction history" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center">
                      <ShieldIcon sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        How do we use your information?
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="To provide and maintain our customer relationship management services" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="To communicate with you about our products and services" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="To improve our services and customer experience" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="To comply with legal obligations and protect our rights" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Box mt={3} p={2} sx={{ bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="info.contrastText">
                    <strong>Your Rights:</strong> You have the right to access, update, or delete your personal information at any time. 
                    You can also opt-out of marketing communications. Contact us at christyngph.ecom@christyng.com.ph for any privacy-related requests.
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      color="primary"
                      size="large"
                    />
                  }
                  label={
                    <Typography variant="body1" sx={{ ml: 1 }}>
                      I have read and agree to the{' '}
                      <Button
                        variant="text"
                        color="primary"
                        sx={{ 
                          p: 0, 
                          minWidth: 'auto', 
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: 'inherit',
                          textDecoration: 'underline',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => setPrivacyModalOpen(true)}
                      >
                        Privacy Policy
                      </Button>{' '}
                      and{' '}
                      <Button
                        variant="text"
                        color="primary"
                        sx={{ 
                          p: 0, 
                          minWidth: 'auto', 
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: 'inherit',
                          textDecoration: 'underline',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => setTermsModalOpen(true)}
                      >
                        Terms of Service
                      </Button>.
                      I consent to the collection and processing of my personal data as described above.
                    </Typography>
                  }
                />
              </FormGroup>
              
              {!privacyAgreed && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please accept the privacy agreement to continue with the registration process.
                </Alert>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            {/* Title Row */}
            <Box display="flex" alignItems="center" mb={4}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h6" color="primary">
                Personal Information
              </Typography>
            </Box>

            {/* Input Fields Grid */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            {/* Title Row */}
            <Box display="flex" alignItems="center" mb={4}>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Typography variant="h6" color="secondary">
                Contact & Business Information
              </Typography>
            </Box>

            {/* Input Fields Grid */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  error={!!formErrors.phone}
                  helperText={formErrors.phone || "Format: +639171234567"}
                  placeholder="+639171234567"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Position/Title"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            {/* Title Row */}
            <Box display="flex" alignItems="center" mb={4}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <LocationIcon />
              </Avatar>
              <Typography variant="h6" color="success.main">
                Address & Additional Information
              </Typography>
            </Box>

            {/* Input Fields Grid */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
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
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Outlet"
                  name="outlet"
                  value={formData.outlet}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <StorefrontIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  helperText="Select the store/outlet for this customer"
                  disabled={outletsLoading}
                >
                  {outletsLoading ? (
                    <MenuItem value="">
                      <em>Loading outlets...</em>
                    </MenuItem>
                  ) : outlets.length === 0 ? (
                    <MenuItem value="">
                      <em>No outlets available</em>
                    </MenuItem>
                  ) : (
                    outlets.map((outlet) => (
                      <MenuItem key={outlet._id} value={outlet.code}>
                        <Box display="flex" alignItems="center">
                          <span style={{ marginRight: 8 }}>
                            {outlet.type === 'store' ? '🏪' : 
                             outlet.type === 'warehouse' ? '🏭' : 
                             outlet.type === 'office' ? '🏢' : 
                             outlet.type === 'online' ? '💻' : '🏪'}
                          </span>
                          {outlet.displayName || `${outlet.name} (${outlet.code})`}
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <NotesIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  placeholder="Add any additional notes about this customer..."
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Paper elevation={0} sx={{ mb: 4, p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <IconButton color="inherit" onClick={handleCancel} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
                  Add New Customer
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Create a new customer profile for your CRM system
                </Typography>
              </Box>
            </Box>
            <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
          </Box>
        </Paper>

        {/* Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CancelIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            icon={<CheckCircleIcon fontSize="inherit" />}
          >
            Customer created successfully! Redirecting to customers list...
          </Alert>
        )}

        {/* Progress Stepper */}
        <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Form Content */}
        <Paper elevation={3} sx={{ overflow: 'hidden' }}>
          <CardContent sx={{ p: 4 }}>
            {getStepContent(activeStep)}
          </CardContent>

          <Divider />

          {/* Navigation Buttons */}
          <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Box display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                onClick={activeStep === 0 ? handleCancel : handleBack}
                startIcon={activeStep === 0 ? <CancelIcon /> : <ArrowBackIcon />}
                disabled={loading}
                size="large"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  borderColor: 'grey.400',
                  color: 'grey.700',
                  '&:hover': {
                    borderColor: 'grey.600',
                    backgroundColor: 'grey.50',
                  },
                }}
              >
                {activeStep === 0 ? 'Cancel' : 'Back'}
              </Button>

              <Box display="flex" gap={2}>
                {activeStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                    endIcon={<NextIcon />}
                    size="large"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                    }}
                  >
                    Next Step
                  </Button>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'inline' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      size="large"
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 4,
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1976D2 30%, #1BA3D1 90%)',
                        },
                      }}
                    >
                      {loading ? 'Creating Customer...' : 'Create Customer'}
                    </Button>
                  </form>
                )}
              </Box>
            </Box>

            {/* Progress indicator */}
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Step {activeStep + 1} of {steps.length} - {steps[activeStep]}
                </Typography>
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  {Math.round(((activeStep + 1) / steps.length) * 100)}% Complete
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={((activeStep + 1) / steps.length) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  },
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Help Info */}
        <Paper elevation={1} sx={{ mt: 3, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Box display="flex" alignItems="center">
            <InfoIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              <strong>Tip:</strong> Required fields are marked with an asterisk (*). 
              You can always edit customer information later from the customer details page.
            </Typography>
          </Box>
        </Paper>

        {/* Privacy Policy Modal */}
        <Dialog
          open={privacyModalOpen}
          onClose={() => setPrivacyModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, maxHeight: '90vh' }
          }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
            <PrivacyTipIcon fontSize="large" />
            <Box>
              <Typography variant="h5">Privacy Policy</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                How we collect, use, and protect your information
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last updated: September 30, 2025
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              1. Information We Collect
            </Typography>
            <Typography variant="body1" paragraph>
              We collect information you provide directly to us, such as when you create an account, 
              make a purchase, or contact us for support. This includes:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <li><Typography variant="body2">Personal identification information (name, email, phone number)</Typography></li>
              <li><Typography variant="body2">Business information (company name, position, address)</Typography></li>
              <li><Typography variant="body2">Communication preferences and interaction history</Typography></li>
              <li><Typography variant="body2">Technical information (IP address, browser type, device information)</Typography></li>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              2. How We Use Your Information
            </Typography>
            <Typography variant="body1" paragraph>
              We use the information we collect to:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <li><Typography variant="body2">Provide, maintain, and improve our services</Typography></li>
              <li><Typography variant="body2">Process transactions and send related information</Typography></li>
              <li><Typography variant="body2">Send you technical notices, updates, and administrative messages</Typography></li>
              <li><Typography variant="body2">Respond to your comments, questions, and requests</Typography></li>
              <li><Typography variant="body2">Monitor and analyze trends, usage, and activities</Typography></li>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              3. Information Sharing and Disclosure
            </Typography>
            <Typography variant="body1" paragraph>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
              except as described in this privacy policy. We may share your information in the following situations:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <li><Typography variant="body2">With service providers who assist us in providing our services</Typography></li>
              <li><Typography variant="body2">To comply with legal obligations or protect our rights</Typography></li>
              <li><Typography variant="body2">In connection with a merger, acquisition, or sale of assets</Typography></li>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              4. Data Security
            </Typography>
            <Typography variant="body1" paragraph>
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              5. Your Rights
            </Typography>
            <Typography variant="body1" paragraph>
              You have the right to access, update, correct, or delete your personal information. 
              You may also opt-out of certain communications from us. To exercise these rights, 
              please contact us at christyngph.ecom@christyng.com.ph.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              6. Contact Us
            </Typography>
            <Typography variant="body1">
              If you have any questions about this Privacy Policy, please contact us at christyngph.ecom@christyng.com.ph 
              or by mail at our business address.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setPrivacyModalOpen(false)}
              variant="contained"
              size="large"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Terms of Service Modal */}
        <Dialog
          open={termsModalOpen}
          onClose={() => setTermsModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, maxHeight: '90vh' }
          }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
            <LockIcon fontSize="large" />
            <Box>
              <Typography variant="h5">Terms of Service</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Terms and conditions for using our services
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last updated: September 30, 2025
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body1" paragraph>
              By accessing and using our Customer Relationship Management (CRM) system, you accept and agree 
              to be bound by the terms and provision of this agreement.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              2. Use License
            </Typography>
            <Typography variant="body1" paragraph>
              Permission is granted to temporarily access and use our CRM system for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <li><Typography variant="body2">Modify or copy the materials</Typography></li>
              <li><Typography variant="body2">Use the materials for any commercial purpose or for any public display</Typography></li>
              <li><Typography variant="body2">Attempt to reverse engineer any software contained in the system</Typography></li>
              <li><Typography variant="body2">Remove any copyright or other proprietary notations</Typography></li>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              3. User Accounts
            </Typography>
            <Typography variant="body1" paragraph>
              You are responsible for safeguarding the password and all activities that occur under your account. 
              You must immediately notify us of any unauthorized use of your account.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              4. Prohibited Uses
            </Typography>
            <Typography variant="body1" paragraph>
              You may not use our service:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <li><Typography variant="body2">For any unlawful purpose or to solicit others to unlawful acts</Typography></li>
              <li><Typography variant="body2">To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</Typography></li>
              <li><Typography variant="body2">To infringe upon or violate our intellectual property rights or the intellectual property rights of others</Typography></li>
              <li><Typography variant="body2">To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</Typography></li>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              5. Service Availability
            </Typography>
            <Typography variant="body1" paragraph>
              We strive to ensure our service is available 24/7, but we do not guarantee uninterrupted access. 
              We may suspend the service for maintenance, updates, or other operational reasons.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              6. Limitation of Liability
            </Typography>
            <Typography variant="body1" paragraph>
              In no event shall our company or its suppliers be liable for any damages arising out of the use 
              or inability to use our service, even if we have been notified orally or in writing of the possibility of such damage.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              7. Governing Law
            </Typography>
            <Typography variant="body1" paragraph>
              These terms and conditions are governed by and construed in accordance with the laws of the Philippines, 
              and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3, color: 'primary.main' }}>
              8. Changes to Terms
            </Typography>
            <Typography variant="body1">
              We reserve the right to update these terms at any time. Changes will be effective immediately upon posting. 
              Your continued use of the service constitutes acceptance of the revised terms.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setTermsModalOpen(false)}
              variant="contained"
              size="large"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default AddCustomer;