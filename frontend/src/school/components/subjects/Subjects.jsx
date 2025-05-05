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
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.03)' },
  '100%': { transform: 'scale(1)' }
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
      animation: `${fadeIn} 0.5s ease-out` 
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
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{subjectToDelete?.subject_name}</strong> ({subjectToDelete?.subject_codename})?
          </Typography>
          {subjectToDelete?.examCount > 0 || subjectToDelete?.scheduleCount > 0 ? (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              Warning: This subject is referenced in {subjectToDelete?.examCount} exam(s) and {subjectToDelete?.scheduleCount} schedule(s)
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Page Title */}
      <Typography 
        variant="h3" 
        component="h1" 
        sx={{ 
          textAlign: "center",
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundSize: "200% 200%",
          animation: `gradientFlow 6s ease infinite`,
          '@keyframes gradientFlow': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          }
        }}
      >
        {editMode ? 'Edit Subject' : 'Add New Subject'}
      </Typography>

      {/* Subject Form */}
      <Box 
        component="form" 
        onSubmit={formik.handleSubmit}
        sx={{
          mb: 4,
          animation: `${fadeIn} 0.5s ease-out`
        }}
      >
        <Stack spacing={3}>
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
                  <BookIcon color="primary" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 2,
                '&:hover': {
                  boxShadow: theme.shadows[2],
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
                  <CodeIcon color="primary" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 2,
                '&:hover': {
                  boxShadow: theme.shadows[2],
                }
              }
            }}
          />

          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              startIcon={<CheckIcon />}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: "bold",
                background: theme.palette.primary.main,
                '&:hover': {
                  background: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
                transition: 'all 0.3s ease',
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
                  fontWeight: "bold",
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[1],
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Subjects List */}
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3,
          position: 'relative',
          '&:after': {
            content: '""',
            display: 'block',
            width: '60px',
            height: '3px',
            background: theme.palette.primary.main,
            marginTop: '8px',
            borderRadius: '3px'
          }
        }}
      >
        Subjects List
      </Typography>
      
      {loading && subjects.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {subjects.map((subject, index) => (
            <Box
              key={subject._id}
              sx={{
                animation: `${fadeIn} 0.5s ease-out`,
                animationDelay: `${index * 100}ms`,
                '@keyframes fadeIn': fadeIn
              }}
            >
              <Card 
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[4],
                    animation: `${pulse} 2s infinite`,
                    '@keyframes pulse': pulse
                  },
                  background: hoveredCard === subject._id ? 
                    `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)` : 
                    theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                }}
                onMouseEnter={() => setHoveredCard(subject._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent sx={{ 
                  position: 'relative',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: theme.palette.primary.main,
                    borderRadius: '0 4px 4px 0'
                  }
                }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BookIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {subject.subject_name}
                    </Typography>
                    <Chip 
                      label={subject.subject_codename}
                      size="small"
                      sx={{ 
                        ml: 1,
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title="Subject details">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
                <CardActions sx={{ 
                  justifyContent: 'flex-end',
                  background: theme.palette.action.hover,
                  borderTop: `1px solid ${theme.palette.divider}`
                }}>
                  <Tooltip title="Edit subject">
                    <IconButton 
                      onClick={() => handleEdit(subject)}
                      color="primary"
                      sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          transform: 'scale(1.1)'
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
                          color: theme.palette.error.contrastText,
                          transform: 'scale(1.1)'
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