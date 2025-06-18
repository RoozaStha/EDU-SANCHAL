import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import {
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  CircularProgress,
  Fade,
  Grow,
  Paper,
  Fab
} from "@mui/material";
import CloudUpload from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";
import CancelIcon from '@mui/icons-material/Cancel';

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const StyledButton = styled(Button)(({ theme }) => ({
  fontWeight: 600,
  textTransform: 'none',
  letterSpacing: '0.5px',
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  }
}));

export default function Dashboard() {
  const [school, setSchool] = useState(null);
  const [edit, setEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleMessageClose = () => {
    setMessage('');
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setImageError("Image size should be less than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Check for actual changes
      const hasImageChange = Boolean(imageFile);
      const hasNameChange = schoolName !== school.school_name;
      
      if (!hasImageChange && !hasNameChange) {
        setMessage('No changes detected');
        setMessageType('info');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      if (imageFile) formData.append("school_image", imageFile);
      if (hasNameChange) formData.append("school_name", schoolName);

      const response = await axios.patch(
        "http://localhost:5000/api/school/update",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage('School information updated successfully! 🎉');
      setMessageType('success');
      setSchool(response.data.data);
      setEdit(false);
      setImageFile(null);

    } catch (error) {
      console.error("Update error:", error);
      setMessage(error.response?.data?.message || 'Update failed. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSchool = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/school/fetch-single",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchool(response.data.data);
      setSchoolName(response.data.data.school_name);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    fetchSchool();
  }, [message]); // Refetch when message changes (after updates)

  const handleCancelEdit = () => {
    setEdit(false);
    setImagePreview(null);
    setImageFile(null);
    setImageError('');
    setMessage('Changes discarded');
    setMessageType('info');
    fetchSchool(); // Reset to original data
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f4f8', 
      padding: { xs: '16px', md: '12px' } 
    }}>
      {/* Header Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        marginBottom: '32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          transform: 'rotate(30deg)',
        }
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 700, 
          letterSpacing: '1px',
          position: 'relative',
          zIndex: 1
        }}>
          School Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ 
          opacity: 0.9, 
          marginTop: '8px',
          position: 'relative',
          zIndex: 1
        }}>
          Manage your school profile
        </Typography>
      </Box>
      
      <MessageSnackbar 
        message={message} 
        type={messageType} 
        handleClose={handleMessageClose}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />

      <Box sx={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        transition: 'all 0.3s ease'
      }}>
        {edit ? (
          <Fade in={edit} timeout={500}>
            <Paper elevation={3} sx={{ 
              padding: { xs: '20px', md: '30px' }, 
              borderRadius: '16px',
              backgroundColor: 'white',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '5px',
                height: '100%',
                background: 'linear-gradient(to bottom, #1976d2, #0d47a1)',
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#0d47a1' }}>
                  Edit School Profile
                </Typography>
                <Button 
                  onClick={handleCancelEdit}
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  sx={{ borderRadius: '20px' }}
                >
                  Cancel
                </Button>
              </Box>
              
              <Box
                component="form"
                onSubmit={handleSubmit}
              >
                <Stack spacing={3}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    marginBottom: '16px',
                    position: 'relative'
                  }}>
                    <Button
                      component="label"
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<CloudUpload />}
                      sx={{
                        height: '120px',
                        borderRadius: '12px',
                        border: imageError ? '2px dashed #f44336' : '2px dashed #e0e0e0',
                        backgroundColor: '#f8fbff',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                          borderColor: '#1976d2',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, marginBottom: '4px' }}>
                          {imagePreview ? 'Change School Picture' : 'Upload School Picture'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          PNG, JPG up to 2MB
                        </Typography>
                      </Box>
                      <VisuallyHiddenInput
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </Button>
                    
                    {imageError && (
                      <Typography color="error" variant="caption" sx={{ marginTop: '8px', display: 'block' }}>
                        {imageError}
                      </Typography>
                    )}
                  </Box>

                  {(imagePreview || school?.school_image) && (
                    <Grow in={true} timeout={600}>
                      <Box sx={{ 
                        width: "100%", 
                        height: "250px",
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1px solid #e0e0e0',
                        position: 'relative'
                      }}>
                        <img
                          src={imagePreview || `/images/uploaded/${school.school_image}`}
                          alt="School preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <Box sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                          padding: '12px',
                          color: 'white'
                        }}>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Preview
                          </Typography>
                        </Box>
                      </Box>
                    </Grow>
                  )}

                  <TextField
                    fullWidth
                    label="School Name"
                    variant="outlined"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    InputProps={{
                      sx: { 
                        borderRadius: '12px',
                        backgroundColor: '#f8fbff'
                      },
                    }}
                    InputLabelProps={{
                      sx: { fontWeight: 500 }
                    }}
                  />

                  <Stack direction="row" spacing={2} sx={{ marginTop: '16px' }}>
                    <StyledButton
                      fullWidth
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={isSubmitting}
                      sx={{ 
                        py: 1.5,
                        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Save Changes"
                      )}
                    </StyledButton>
                  </Stack>
                </Stack>
              </Box>
            </Paper>
          </Fade>
        ) : (
          school && (
            <Fade in={!edit} timeout={500}>
              <Paper elevation={3} sx={{ 
                position: "relative",
                height: "500px",
                width: "100%",
                background: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(/images/uploaded/${school.school_image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                transition: 'all 0.5s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                }
              }}>
                <Box sx={{
                  textAlign: 'center',
                  padding: '24px',
                  backdropFilter: 'blur(2px)',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '12px',
                  maxWidth: '80%'
                }}>
                  <Typography
                    variant="h3"
                    component="h2"
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      marginBottom: '16px',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}
                  >
                    {school.school_name}
                  </Typography>
                
                </Box>

                <Fab
                  color="primary"
                  aria-label="edit"
                  onClick={() => setEdit(true)}
                  sx={{
                    position: "absolute",
                    bottom: "32px",
                    right: "32px",
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'white',
                    color: '#1976d2',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <EditIcon fontSize="large" />
                </Fab>
              </Paper>
            </Fade>
          )
        )}
      </Box>
      
      {/* Footer note */}
      <Box sx={{ 
        textAlign: 'center', 
        marginTop: '40px', 
        padding: '16px',
        color: '#666',
        fontSize: '0.9rem'
      }}>
        
      </Box>
    </Box>
  );
}