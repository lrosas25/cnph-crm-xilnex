import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Paper,
  Avatar,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        // Validate registration form
        if (!formData.name.trim()) {
          setError('Name is required');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }

        const result = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          navigate(from, { replace: true });
        } else {
          setError(result.message);
        }
      } else {
        // Login
        if (!formData.email.trim() || !formData.password.trim()) {
          setError('Please enter both email and password');
          return;
        }

        const result = await login({
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          navigate(from, { replace: true });
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper elevation={6} sx={{ width: '100%', borderRadius: 3, overflow: 'hidden' }}>
          {/* Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 4,
              textAlign: 'center'
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2
              }}
            >
              {isRegisterMode ? <PersonAddIcon fontSize="large" /> : <SecurityIcon fontSize="large" />}
            </Avatar>
            <Typography variant="h4" gutterBottom fontWeight={600}>
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {isRegisterMode 
                ? 'Join our CRM system to manage customer relationships'
                : 'Sign in to access your CRM dashboard'
              }
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {isRegisterMode && (
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonAddIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                )}

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

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />

                {isRegisterMode && (
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                )}

                {!isRegisterMode && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Remember me"
                  />
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #1BA3D1 90%)',
                    },
                  }}
                >
                  {loading 
                    ? (isRegisterMode ? 'Creating Account...' : 'Signing In...') 
                    : (isRegisterMode ? 'Create Account' : 'Sign In')
                  }
                </Button>
              </Box>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {isRegisterMode 
                  ? 'Already have an account?' 
                  : "Don't have an account?"
                }
              </Typography>
              <Button
                variant="text"
                onClick={toggleMode}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                {isRegisterMode ? 'Sign In' : 'Create Account'}
              </Button>
            </Box>

            {/* Public Access Link */}
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Need to register as a customer?
                </Typography>
                <Button
                  component={Link}
                  to="/customers/add"
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  Register a Customer
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
