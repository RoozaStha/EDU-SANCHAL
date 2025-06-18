import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from "@mui/material";
import { useFormik } from "formik";
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { subjectSchema } from "../../../yupSchema/subjectSchema";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import InfoIcon from "@mui/icons-material/Info";
import BookIcon from "@mui/icons-material/Book";
import CodeIcon from "@mui/icons-material/Code";

// Animations
const fadeIn = {
  from: { opacity: 0, transform: 'translateY(20px)' },
  to: { opacity: 1, transform: 'translateY(0)' }
};

const pulse = {
  '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(25, 118, 210, 0)' },
  '70%': { transform: 'scale(1.01)', boxShadow: '0 0 10px rgba(25, 118, 210, 0.5)' },
  '100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(25, 118, 210, 0)' }
};

const gradientFlow = {
  '0%': { backgroundPosition: '0% 50%' },
  '50%': { backgroundPosition: '100% 50%' },
  '100%': { backgroundPosition: '0% 50%' }
};

const float = {
  '0%': { transform: 'translateY(0px)' },
  '50%': { transform: 'translateY(-5px)' },
  '100%': { transform: 'translateY(0px)' }
};

export default function Subject() {
  const theme = useTheme();
  const [subjects, setSubjects] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMessageClose = () => setMessage('');

  const formik = useFormik({
    initialValues: {
      subject_name: "",
      subject_codename: ""
    },
    validationSchema: subjectSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        let response;
        
        if (editMode) {
          response = await axios.patch(
            `${baseApi}/subjects/${editingId}`,
            { 
              subject_name: values.subject_name,
              subject_codename: values.subject_codename.toUpperCase()
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          setMessage('Subject updated successfully');
        } else {
          response = await axios.post(
            `${baseApi}/subjects`,
            {
              subject_name: values.subject_name,
              subject_codename: values.subject_codename.toUpperCase()
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          setMessage('Subject created successfully');
        }
        
        setMessageType('success');
        resetForm();
        fetchAllSubjects();
        setEditMode(false);
        setEditingId(null);
      } catch (error) {
        console.error("Error:", error);
        setMessage(error.response?.data?.message || 'An error occurred');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }
  });

  const fetchAllSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/subjects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubjects(response.data.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setMessage('Failed to fetch subjects');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
    setEditMode(true);
    setEditingId(subject._id);
    formik.setValues({
      subject_name: subject.subject_name,
      subject_codename: subject.subject_codename
    });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    formik.resetForm();
  };

  const confirmDelete = (subject) => {
    setSubjectToDelete(subject);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`${baseApi}/subjects/${subjectToDelete._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('Subject deleted successfully');
      setMessageType('success');
      fetchAllSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      setMessage(error.response?.data?.message || 'Failed to delete subject');
      setMessageType('error');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setSubjectToDelete(null);
    }
  };

  useEffect(() => {
    fetchAllSubjects();
  }, []);

  return (
    <Box sx={{ 
      maxWidth: 800, 
      mx: "auto", 
      p: 3,
      animation: `fadeIn 0.5s ease-out`,
      '@keyframes fadeIn': fadeIn
    }}>
      {/* Notification Snackbar */}
      <MessageSnackbar 
        message={message} 
        messageType={messageType} 
        handleClose={handleMessageClose}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 3,
            boxShadow: theme.shadows[6],
            background: theme.palette.background.paper,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)', 
          color: 'white',
          fontWeight: 600,
        }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete 
            <Box component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {" "}{subjectToDelete?.subject_name}
            </Box> 
            <Box component="span" sx={{ 
              ml: 1,
              px: 1.5,
              py: 0.5,
              background: theme.palette.primary.light,
              color: 'white',
              borderRadius: 1,
              fontWeight: 700,
              display: 'inline-block'
            }}>
              {subjectToDelete?.subject_codename}
            </Box>?
          </Typography>
          {subjectToDelete?.examCount > 0 || subjectToDelete?.scheduleCount > 0 ? (
            <Typography color="error" variant="body2" sx={{ 
              mt: 2,
              p: 1.5,
              background: theme.palette.error.light + '22',
              borderRadius: 1,
              borderLeft: `3px solid ${theme.palette.error.main}`
            }}>
              ⚠️ Warning: This subject is referenced in {subjectToDelete?.examCount} exam(s) and {subjectToDelete?.scheduleCount} schedule(s)
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
              py: 1
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained"
            color="error"
            disabled={loading}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
              py: 1,
              background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #b71c1c 30%, #d32f2f 90%)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Title - Blue Bar */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
          color: 'white',
          py: 2,
          px: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: theme.shadows[3],
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'rgba(255,255,255,0.3)',
            animation: 'gradientFlow 6s ease infinite',
            backgroundSize: '200% 200%',
            '@keyframes gradientFlow': gradientFlow
          }
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          {editMode ? 'Edit Subject' : 'Add New Subject'}
        </Typography>
      </Box>

      {/* Subject Form */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          overflow: 'visible',
          transition: 'all 0.3s ease',
          animation: 'float 4s ease-in-out infinite',
          '@keyframes float': float,
          '&:hover': {
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <CardContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={3} sx={{ mb: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Subject Name"
                name="subject_name"
                value={formik.values.subject_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.subject_name && Boolean(formik.errors.subject_name)}
                helperText={formik.touched.subject_name && formik.errors.subject_name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BookIcon color="primary" sx={{ animation: 'pulse 2s infinite', '@keyframes pulse': pulse }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[1],
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
                    }
                  }
                }}
              />

              <TextField
                fullWidth
                variant="outlined"
                label="Subject Code"
                name="subject_codename"
                value={formik.values.subject_codename}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.subject_codename && Boolean(formik.errors.subject_codename)}
                helperText={formik.touched.subject_codename && formik.errors.subject_codename}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CodeIcon color="primary" sx={{ animation: 'pulse 2s infinite', '@keyframes pulse': pulse }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[1],
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
                    }
                  }
                }}
              />

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  startIcon={
                    <CheckIcon sx={{ 
                      animation: editMode ? 'pulse 1.5s infinite' : 'none',
                      '@keyframes pulse': pulse
                    }} />
                  }
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 8px rgba(25, 118, 210, 0.4)',
                      background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                    }
                  }}
                >
                  {loading ? 'Processing...' : editMode ? 'Update Subject' : 'Create Subject'}
                </Button>

                {editMode && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={cancelEdit}
                    startIcon={<CloseIcon />}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      color: theme.palette.text.primary,
                      borderColor: theme.palette.divider,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[2],
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Subjects List Header */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
          color: 'white',
          py: 1.5,
          px: 3,
          mb: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[3],
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            letterSpacing: '0.5px',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            '&:after': {
              content: '""',
              flexGrow: 1,
              height: '2px',
              background: 'rgba(255,255,255,0.3)',
              ml: 2,
              borderRadius: '2px'
            }
          }}
        >
          Subjects List
          <Box
            component="span"
            sx={{
              ml: 1,
              px: 1.5,
              py: 0.5,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 1,
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
          </Box>
        </Typography>
      </Box>
      
      {loading && subjects.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : (
        <Stack spacing={2}>
          {subjects.map((subject, index) => (
            <Box
              key={subject._id}
              sx={{
                animation: `fadeIn 0.5s ease-out`,
                animationDelay: `${index * 100}ms`,
                '@keyframes fadeIn': fadeIn
              }}
            >
              <Card 
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  background: hoveredCard === subject._id ? 
                    `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)` : 
                    theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: theme.shadows[6],
                    animation: 'pulse 2s ease infinite',
                    '@keyframes pulse': pulse
                  }
                }}
                onMouseEnter={() => setHoveredCard(subject._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '6px',
                    background: 'linear-gradient(to bottom, #1976d2, #2196f3)'
                  }}
                />
                <CardContent sx={{ 
                  pl: 3,
                  pr: 2,
                  py: 2,
                  '&:last-child': {
                    pb: 2
                  }
                }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BookIcon 
                        color="primary" 
                        sx={{ 
                          mr: 2,
                          fontSize: '2rem',
                          animation: 'float 3s ease-in-out infinite',
                          '@keyframes float': float
                        }} 
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary
                        }}
                      >
                        {subject.subject_name}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.8,
                        background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                        color: 'white',
                        borderRadius: 2,
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        boxShadow: theme.shadows[1],
                        animation: 'float 3s ease-in-out infinite',
                        '@keyframes float': float
                      }}
                    >
                      {subject.subject_codename}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ 
                  justifyContent: 'flex-end',
                  background: theme.palette.action.hover,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  py: 0
                }}>
                  <Tooltip title="Edit subject">
                    <IconButton 
                      onClick={() => handleEdit(subject)}
                      color="primary"
                      sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: theme.palette.primary.main,
                          color: 'white',
                          transform: 'scale(1.1)',
                          boxShadow: theme.shadows[2]
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete subject">
                    <IconButton 
                      onClick={() => confirmDelete(subject)}
                      color="error"
                      sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: theme.palette.error.main,
                          color: 'white',
                          transform: 'scale(1.1)',
                          boxShadow: theme.shadows[2]
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}