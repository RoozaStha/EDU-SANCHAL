import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { 
  Avatar, Typography, Box, Button, TextField, MenuItem, 
  IconButton, CircularProgress, Snackbar, Alert, InputAdornment,
  Card, CardContent, Divider, Grid, Fade, Slide, Grow, Zoom,
  useTheme, useMediaQuery, Paper, Stack, Skeleton, Tooltip,
  Collapse, Badge, Dialog, DialogTitle, DialogContent, DialogActions
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import axios from "axios";
import { styled } from '@mui/material/styles';
import { motion } from "framer-motion";

// Styled Components
const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 180,
  height: 180,
  border: `5px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[10],
  marginBottom: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: theme.shadows[20],
  },
}));

const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: theme.shadows[6],
  maxWidth: 900,
  margin: 'auto',
  padding: theme.spacing(4),
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, #f5f7ff)`,
  position: 'relative',
  overflow: 'visible',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    zIndex: -1,
    background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
    borderRadius: 30,
    filter: 'blur(20px)',
    opacity: 0.3,
  }
}));

const DetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: 12,
  background: theme.palette.mode === 'dark' ? '#1e1e2d' : '#f8f9ff',
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[4],
    background: theme.palette.mode === 'dark' ? '#252538' : '#ffffff',
  }
}));

const AnimatedButton = styled(Button)({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  }
});

const DropZone = styled(Paper)(({ theme, isdragactive }) => ({
  border: `2px dashed ${isdragactive === 'true' ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: '50%',
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isdragactive === 'true' 
    ? theme.palette.primary.light + '22' 
    : theme.palette.background.default,
  width: 180,
  height: 180,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto 24px',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '22',
  }
}));

export default function TeacherDetails() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  
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
        // Simulate API delay for skeleton effect
        await new Promise(resolve => setTimeout(resolve, 1200));
        
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
    setDragActive(false);
    
    if (teacherDetails) {
      setFormData({
        name: teacherDetails.name,
        email: teacherDetails.email,
        qualification: teacherDetails.qualification,
        age: teacherDetails.age,
        gender: teacherDetails.gender.toLowerCase(),
        password: "",
        confirmPassword: ""
      });
    }
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
    const file = e.target.files?.[0] || e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleImageChange(e);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    } else if (formData.age < 21 || formData.age > 70) {
      newErrors.age = "Age must be between 21 and 70";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (formData.password && !/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (formData.password && !/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
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
      setSaving(true);
      
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
      setDragActive(false);
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
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderSkeleton = () => (
    <Box sx={{ maxWidth: 900, margin: 'auto', p: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Skeleton variant="circular" width={180} height={180} sx={{ mx: 'auto', mb: 3 }} />
        <Skeleton variant="rectangular" width={200} height={40} sx={{ mx: 'auto', borderRadius: 2 }} />
      </Box>
      <ProfileCard>
        {[...Array(5)].map((_, i) => (
          <React.Fragment key={i}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="70%" height={25} />
              </Box>
            </Box>
            {i < 4 && <Divider sx={{ my: 2 }} />}
          </React.Fragment>
        ))}
      </ProfileCard>
    </Box>
  );

  if (loading && !teacherDetails) {
    return renderSkeleton();
  }

  if (!teacherDetails) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h6" color="error" textAlign="center" mt={4}>
          Failed to load teacher details
        </Typography>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Box sx={{ p: isMobile ? 2 : 1 }}>
        <Slide direction="down" in={true} timeout={700}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                  letterSpacing: '0.5px'
                }}
              >
                Teacher Profile
              </Typography>
            </motion.div>
            
            {editMode ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="image-upload"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <DropZone
                  isdragactive={dragActive.toString()}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  {imagePreview ? (
                    <>
                      <Avatar 
                        src={imagePreview} 
                        sx={{ width: 120, height: 120, mb: 1 }} 
                      />
                      <Button 
                        variant="contained" 
                        size="small" 
                        color="secondary"
                        startIcon={<DeleteIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        sx={{ mt: 1 }}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <CloudUploadIcon fontSize="large" color="action" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        {dragActive ? "Drop your image here" : "Click or drag to upload"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        PNG, JPG, JPEG (max 5MB)
                      </Typography>
                    </>
                  )}
                </DropZone>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.03 }}
                style={{ display: 'inline-block' }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Tooltip title="Verified Account" arrow>
                      <VerifiedUserIcon color="primary" sx={{ 
                        backgroundColor: 'white', 
                        borderRadius: '50%', 
                        padding: '4px',
                        boxShadow: theme.shadows[3]
                      }} />
                    </Tooltip>
                  }
                >
                  <ProfileAvatar
                    src={teacherDetails.teacher_image ? `/images/uploaded/teacher/${teacherDetails.teacher_image}` : undefined}
                  />
                </Badge>
              </motion.div>
            )}
            
            {!editMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                  <AnimatedButton
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEditClick}
                    color="primary"
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Edit Profile
                  </AnimatedButton>
                  <AnimatedButton
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => setShowSecurityDialog(true)}
                    color="primary"
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Security
                  </AnimatedButton>
                </Stack>
              </motion.div>
            )}
          </Box>
        </Slide>
        
        <ProfileCard>
          {editMode ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
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
                    variant="outlined"
                    size="medium"
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
                    variant="outlined"
                    size="medium"
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
                    variant="outlined"
                    size="medium"
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
                    variant="outlined"
                    size="medium"
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
                    variant="outlined"
                    size="medium"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <Collapse in={true} timeout={800}>
                    <Paper sx={{ p: 3, mt: 3, mb: 2, borderRadius: 3, background: theme.palette.background.default }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <LockIcon color="primary" sx={{ mr: 1 }} />
                        Password Update
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                          (Leave blank to keep current password)
                        </Typography>
                      </Typography>
                      
                      <Grid container spacing={2}>
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
                            variant="outlined"
                            size="medium"
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
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Collapse>
                </Grid>
                
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <AnimatedButton
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelEdit}
                      disabled={saving}
                      color="secondary"
                      sx={{ px: 4 }}
                    >
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={handleSubmit}
                      disabled={saving}
                      color="primary"
                      sx={{ px: 5 }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </AnimatedButton>
                  </Stack>
                </Grid>
              </Grid>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              <DetailItem>
                <Box sx={{ 
                  backgroundColor: theme.palette.primary.light, 
                  color: theme.palette.primary.contrastText,
                  borderRadius: 2,
                  p: 1.5,
                  mr: 3,
                  minWidth: 48,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <PersonIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="h6">{teacherDetails.name}</Typography>
                </Box>
              </DetailItem>
              
              <Divider sx={{ my: 2, opacity: 0.7 }} />
              
              <DetailItem>
                <Box sx={{ 
                  backgroundColor: theme.palette.secondary.light, 
                  color: theme.palette.secondary.contrastText,
                  borderRadius: 2,
                  p: 1.5,
                  mr: 3,
                  minWidth: 48,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <EmailIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="h6">{teacherDetails.email}</Typography>
                </Box>
              </DetailItem>
              
              <Divider sx={{ my: 2, opacity: 0.7 }} />
              
              <DetailItem>
                <Box sx={{ 
                  backgroundColor: theme.palette.info.light, 
                  color: theme.palette.info.contrastText,
                  borderRadius: 2,
                  p: 1.5,
                  mr: 3,
                  minWidth: 48,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <SchoolIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Qualification
                  </Typography>
                  <Typography variant="h6">{teacherDetails.qualification}</Typography>
                </Box>
              </DetailItem>
              
              <Divider sx={{ my: 2, opacity: 0.7 }} />
              
              <DetailItem>
                <Box sx={{ 
                  backgroundColor: theme.palette.warning.light, 
                  color: theme.palette.warning.contrastText,
                  borderRadius: 2,
                  p: 1.5,
                  mr: 3,
                  minWidth: 48,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <CakeIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Age
                  </Typography>
                  <Typography variant="h6">{teacherDetails.age} years</Typography>
                </Box>
              </DetailItem>
              
              <Divider sx={{ my: 2, opacity: 0.7 }} />
              
              <DetailItem>
                <Box sx={{ 
                  backgroundColor: theme.palette.success.light, 
                  color: theme.palette.success.contrastText,
                  borderRadius: 2,
                  p: 1.5,
                  mr: 3,
                  minWidth: 48,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <TransgenderIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Gender
                  </Typography>
                  <Typography variant="h6">
                    {teacherDetails.gender.charAt(0).toUpperCase() + teacherDetails.gender.slice(1)}
                  </Typography>
                </Box>
              </DetailItem>
            </motion.div>
          )}
        </ProfileCard>
        
        {/* Security Dialog */}
        <Dialog 
          open={showSecurityDialog} 
          onClose={() => setShowSecurityDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
            Security Settings
          </DialogTitle>
          <DialogContent sx={{ py: 4 }}>
            <Typography variant="body1" gutterBottom>
              For security reasons, please contact the administrator to change sensitive account settings.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Email: info@edusanchal.com
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Phone: +977-14456789
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSecurityDialog(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionComponent={Slide}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity}
              sx={{ width: '100%', boxShadow: theme.shadows[6] }}
              elevation={6}
              variant="filled"
            >
              {snackbar.message}
            </Alert>
          </motion.div>
        </Snackbar>
      </Box>
    </motion.div>
  );
}