import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Avatar, Typography, Box, Button, TextField, MenuItem, 
  IconButton, CircularProgress, Snackbar, Alert, InputAdornment,
  Card, CardContent, CardHeader, Divider, Grid, Fade, Slide, Grow,
  useTheme, useMediaQuery
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CakeIcon from '@mui/icons-material/Cake';
import TransgenderIcon from '@mui/icons-material/Transgender';
import LockIcon from '@mui/icons-material/Lock';
import axios from "axios";
import { styled } from '@mui/material/styles';

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 180,
  height: 180,
  border: `4px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[4],
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)'
  }
}));

const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: theme.shadows[10],
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[16]
  }
}));

const DetailRow = ({ icon, label, value }) => (
  <TableRow>
    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
      {icon}
      {label}
    </TableCell>
    <TableCell>{value}</TableCell>
  </TableRow>
);

export default function TeacherDetails() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    qualification: "",
    age: "",
    gender: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchTeacherDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/teachers/fetch-single`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setTeacherDetails(response.data.data);
        setFormData({
          name: response.data.data.name,
          email: response.data.data.email,
          qualification: response.data.data.qualification,
          age: response.data.data.age,
          gender: response.data.data.gender.toLowerCase(),
          password: "",
          confirmPassword: ""
        });
      } catch (error) {
        console.error("Error in Teacher Details fetching single data.", error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || "Failed to fetch teacher details",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeacherDetails();
  }, []);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setImagePreview(null);
    setSelectedFile(null);
    setErrors({});
    setFormData({
      name: teacherDetails.name,
      email: teacherDetails.email,
      qualification: teacherDetails.qualification,
      age: teacherDetails.age,
      gender: teacherDetails.gender.toLowerCase(),
      password: "",
      confirmPassword: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.qualification.trim()) {
      newErrors.qualification = "Qualification is required";
    }
    
    if (!formData.age || isNaN(formData.age)) {
      newErrors.age = "Valid age is required";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('qualification', formData.qualification);
      formDataToSend.append('age', formData.age);
      formDataToSend.append('gender', formData.gender);
      
      if (formData.password) {
        formDataToSend.append('password', formData.password);
      }
      
      if (selectedFile) {
        formDataToSend.append('teacher_image', selectedFile);
      }
      
      const response = await axios.patch(
        `http://localhost:5000/api/teachers/update`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setTeacherDetails(response.data.data);
      setEditMode(false);
      setImagePreview(null);
      setSelectedFile(null);
      setSnackbar({
        open: true,
        message: "Profile updated successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error updating teacher:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update profile",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && !teacherDetails) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (!teacherDetails) {
    return (
      <Typography variant="h6" color="error" textAlign="center" mt={4}>
        Failed to load teacher details
      </Typography>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ maxWidth: 1200, margin: 'auto', p: isMobile ? 2 : 4 }}>
        <Slide direction="down" in={true} timeout={700}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              mb: 4, 
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              textAlign: 'center',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Your Profile
          </Typography>
        </Slide>
        
        <Grid container spacing={4} justifyContent="center">
          {/* Profile Image Section */}
          <Grid item xs={12} md={4}>
            <Grow in={true} timeout={1000}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <StyledAvatar
                  src={imagePreview || (teacherDetails.teacher_image ? `/images/uploaded/teacher/${teacherDetails.teacher_image}` : undefined)}
                />
                
                {editMode && (
                  <Grow in={editMode} timeout={500}>
                    <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
                      <Button 
                        variant="outlined" 
                        component="label" 
                        fullWidth
                        sx={{ mb: 1 }}
                        startIcon={<PersonIcon />}
                      >
                        Change Photo
                        <input 
                          type="file" 
                          hidden 
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </Button>
                      {selectedFile && (
                        <Typography variant="caption" color="text.secondary">
                          Selected: {selectedFile.name}
                        </Typography>
                      )}
                    </Box>
                  </Grow>
                )}
              </Box>
            </Grow>
          </Grid>
          
          {/* Details Section */}
          <Grid item xs={12} md={8}>
            <ProfileCard>
              <CardHeader 
                title="Personal Information" 
                titleTypographyProps={{ variant: 'h5', fontWeight: 'bold' }}
                action={
                  !editMode ? (
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={handleEditClick}
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                    >
                      Edit Profile
                    </Button>
                  ) : null
                }
              />
              <Divider />
              <CardContent>
                {editMode ? (
                  <Box component="form" noValidate sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          error={!!errors.name}
                          helperText={errors.name}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          value={formData.email}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Qualification"
                          name="qualification"
                          value={formData.qualification}
                          onChange={handleInputChange}
                          error={!!errors.qualification}
                          helperText={errors.qualification}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SchoolIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Age"
                          name="age"
                          type="number"
                          value={formData.age}
                          onChange={handleInputChange}
                          error={!!errors.age}
                          helperText={errors.age}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CakeIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label="Gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          error={!!errors.gender}
                          helperText={errors.gender}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <TransgenderIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </TextField>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                          Password Update (Leave blank to keep current password)
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          error={!!errors.password}
                          helperText={errors.password}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={togglePasswordVisibility}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm Password"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEdit}
                        disabled={loading}
                        color="secondary"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSubmit}
                        disabled={loading}
                        color="primary"
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableBody>
                        <DetailRow 
                          icon={<PersonIcon color="primary" />} 
                          label="Name" 
                          value={teacherDetails.name} 
                        />
                        <DetailRow 
                          icon={<EmailIcon color="primary" />} 
                          label="Email" 
                          value={teacherDetails.email} 
                        />
                        <DetailRow 
                          icon={<SchoolIcon color="primary" />} 
                          label="Qualification" 
                          value={teacherDetails.qualification} 
                        />
                        <DetailRow 
                          icon={<CakeIcon color="primary" />} 
                          label="Age" 
                          value={teacherDetails.age} 
                        />
                        <DetailRow 
                          icon={<TransgenderIcon color="primary" />} 
                          label="Gender" 
                          value={teacherDetails.gender.charAt(0).toUpperCase() + teacherDetails.gender.slice(1)} 
                        />
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </ProfileCard>
          </Grid>
        </Grid>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionComponent={Slide}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            elevation={6}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
}