import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Stack, TextField, Typography, IconButton, Card, CardContent, 
  FormControl, InputLabel, Select, Chip, Avatar, Divider, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, Badge, Tabs, Tab, InputAdornment, 
  Paper, Grid, useMediaQuery, LinearProgress, Skeleton, Menu, MenuItem, 
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { baseApi } from '../../../environment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { motion } from 'framer-motion';

// Icons
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useTheme } from '@emotion/react';

// Validation schema
const leaveSchema = Yup.object().shape({
  startDate: Yup.date().required("Start date is required"),
  endDate: Yup.date()
    .required("End date is required")
    .min(Yup.ref('startDate'), "End date must be after start date"),
  reason: Yup.string()
    .required("Reason is required")
    .max(500, "Reason too long"),
});

export default function StudentLeave() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [editMode, setEditMode] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const statusColors = {
    PENDING: theme.palette.warning.main,
    APPROVED: theme.palette.success.main,
    REJECTED: theme.palette.error.main
  };

  const statusIcons = {
    PENDING: <PendingActionsIcon />,
    APPROVED: <CheckCircleIcon />,
    REJECTED: <CancelIcon />
  };

  const formik = useFormik({
    initialValues: {
      startDate: null,
      endDate: null,
      reason: ""
    },
    validationSchema: leaveSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = {
          startDate: values.startDate,
          endDate: values.endDate,
          reason: values.reason
        };

        if (editMode && currentRequest) {
          await axios.patch(`${baseApi}/leaves/${currentRequest._id}`, payload);
          setMessage("Leave request updated successfully");
        } else {
          await axios.post(`${baseApi}/leaves`, payload);
          setMessage("Leave request submitted successfully");
        }
        
        setMessageType("success");
        formik.resetForm();
        setEditMode(false);
        setCurrentRequest(null);
        fetchLeaveRequests();
      } catch (error) {
        console.error("Error:", error);
        setMessage(error.response?.data?.message || "An error occurred");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/leaves/my`);
      setLeaveRequests(response.data.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setMessage("Failed to fetch leave requests");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleEditRequest = (request) => {
    if (request.status !== 'PENDING') {
      setMessage("Only pending requests can be edited");
      setMessageType("warning");
      return;
    }
    
    setEditMode(true);
    setCurrentRequest(request);
    formik.setValues({
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      reason: request.reason
    });
  };

  const handleDeleteClick = (request) => {
    if (request.status !== 'PENDING') {
      setMessage("Only pending requests can be deleted");
      setMessageType("warning");
      return;
    }
    
    setRequestToDelete(request);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await axios.delete(`${baseApi}/leaves/${requestToDelete._id}`);
      setMessage("Leave request deleted successfully");
      setMessageType("success");
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error deleting leave request:", error);
      setMessage("Failed to delete leave request");
      setMessageType("error");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmOpen(false);
    setRequestToDelete(null);
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Message Alert */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Paper 
            elevation={6} 
            sx={{ 
              mb: 3, 
              p: 2,
              backgroundColor: messageType === 'success' 
                ? theme.palette.success.light 
                : messageType === 'error' 
                  ? theme.palette.error.light 
                  : theme.palette.warning.light,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {messageType === 'success' ? 
              <CheckCircleIcon color="success" /> : 
              messageType === 'error' ? 
                <CancelIcon color="error" /> : 
                <InfoIcon color="warning" />
            }
            <Typography variant="body1">{message}</Typography>
            <IconButton size="small" onClick={() => setMessage("")} sx={{ ml: 'auto' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Paper>
        </motion.div>
      )}

      {/* Header with Animated Background */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          background: 'linear-gradient(270deg, #0d47a1, #1976d2, #42a5f5)',
          backgroundSize: '600% 600%',
          animation: 'gradient 15s ease infinite',
          borderRadius: 3,
          p: 3,
          mb: 4,
          boxShadow: 3,
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
            backgroundSize: '50px 50px',
            animation: 'animateBg 3s linear infinite',
            zIndex: 1
          }
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <EventIcon fontSize="large" />
              </motion.div>
              Leave Management System
            </Typography>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="contained" 
                startIcon={<RefreshIcon />}
                onClick={fetchLeaveRequests}
                disabled={loading}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }
                }}
              >
                Refresh
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Leave Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Paper sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 3, 
          boxShadow: 3,
          background: 'linear-gradient(to bottom right, #f8fbff, #f0f7ff)',
          border: '1px solid rgba(33, 150, 243, 0.1)'
        }}>
          <Typography variant="h6" sx={{ 
            mb: 2, 
            fontWeight: 700,
            color: '#0d47a1',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            {editMode ? (
              <>
                <EditIcon fontSize="small" /> Edit Leave Request
              </>
            ) : (
              <>
                <AddIcon fontSize="small" /> New Leave Request
              </>
            )}
          </Typography>
          
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formik.values.startDate}
                    onChange={(date) => formik.setFieldValue("startDate", date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                        helperText={formik.touched.startDate && formik.errors.startDate}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarTodayIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'white'
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formik.values.endDate}
                    onChange={(date) => formik.setFieldValue("endDate", date)}
                    minDate={formik.values.startDate}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                        helperText={formik.touched.endDate && formik.errors.endDate}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarTodayIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'white'
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  name="reason"
                  value={formik.values.reason}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.reason && Boolean(formik.errors.reason)}
                  helperText={formik.touched.reason && formik.errors.reason}
                  multiline
                  rows={4}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  {editMode && (
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                          setEditMode(false);
                          formik.resetForm();
                        }}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  )}
                  <motion.div 
                    whileHover={{ scale: 1.03 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      startIcon={editMode ? <EditIcon /> : <AddIcon />}
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: '0 4px 6px rgba(13, 71, 161, 0.3)',
                        minWidth: 180,
                        height: 45
                      }}
                    >
                      {editMode ? "Update Request" : "Submit Request"}
                    </Button>
                  </motion.div>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </motion.div>

      {/* Leave History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Paper sx={{ 
          p: 3, 
          borderRadius: 3, 
          boxShadow: 3,
          background: 'linear-gradient(to bottom right, #f8fbff, #f0f7ff)',
          border: '1px solid rgba(33, 150, 243, 0.1)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#0d47a1'
            }}>
              <HistoryIcon /> My Leave History
            </Typography>
            <Chip 
              label={`${leaveRequests.length} requests`} 
              color="primary" 
              variant="outlined"
              sx={{ 
                fontWeight: 600,
                borderRadius: 1,
                borderWidth: 2
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={60} thickness={4} />
            </Box>
          ) : leaveRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ 
                textAlign: 'center', 
                p: 4,
                borderRadius: 3,
                backgroundColor: 'rgba(13, 71, 161, 0.03)',
                border: '1px dashed rgba(13, 71, 161, 0.2)'
              }}>
                <EventIcon sx={{ 
                  fontSize: 60, 
                  color: 'rgba(13, 71, 161, 0.3)', 
                  mb: 2 
                }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No leave requests found
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Submit your first leave request using the form above
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none' }}>
              <Table sx={{ minWidth: 650 }} aria-label="leave requests table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.primary.light }}>
                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'white' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'white' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <motion.tr
                      key={request._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ backgroundColor: 'rgba(13, 71, 161, 0.03)' }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${calculateDuration(request.startDate, request.endDate)} days`} 
                          variant="outlined"
                          sx={{ 
                            fontWeight: 500,
                            borderWidth: 1.5,
                            borderRadius: 1
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={request.reason} placement="top">
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200, fontWeight: 500 }}>
                            {request.reason}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusIcons[request.status]}
                          label={request.status}
                          sx={{ 
                            backgroundColor: `${statusColors[request.status]}15`,
                            color: statusColors[request.status],
                            border: `1.5px solid ${statusColors[request.status]}`,
                            fontWeight: 600,
                            borderRadius: 1
                          }}
                        />
                        {request.status === 'REJECTED' && request.rejectedReason && (
                          <Tooltip title={request.rejectedReason} arrow>
                            <InfoIcon color="error" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <motion.div 
                          style={{ display: 'inline-block' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconButton 
                            onClick={() => handleEditRequest(request)}
                            disabled={request.status !== 'PENDING'}
                            sx={{ 
                              backgroundColor: request.status === 'PENDING' 
                                ? 'rgba(13, 71, 161, 0.1)' 
                                : 'transparent',
                              mr: 1
                            }}
                          >
                            <EditIcon color={request.status === 'PENDING' ? "primary" : "disabled"} />
                          </IconButton>
                        </motion.div>
                        <motion.div 
                          style={{ display: 'inline-block' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconButton 
                            onClick={() => handleDeleteClick(request)}
                            disabled={request.status !== 'PENDING'}
                            sx={{ 
                              backgroundColor: request.status === 'PENDING' 
                                ? 'rgba(244, 67, 54, 0.1)' 
                                : 'transparent'
                            }}
                          >
                            <DeleteIcon color={request.status === 'PENDING' ? "error" : "disabled"} />
                          </IconButton>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            boxShadow: 24,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          fontWeight: 700
        }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <InfoIcon color="warning" fontSize="large" />
            <Typography variant="body1">
              Are you sure you want to delete this leave request?
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All data related to this request will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={handleDeleteCancel} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              fontWeight: 600,
              px: 3
            }}
          >
            Cancel
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error"
              variant="contained"
              disabled={loading}
              startIcon={<DeleteIcon />}
              sx={{ 
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                boxShadow: '0 4px 6px rgba(244, 67, 54, 0.3)'
              }}
            >
              Delete Request
            </Button>
          </motion.div>
        </DialogActions>
      </Dialog>

      {/* CSS for background animation */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes animateBg {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
      `}</style>
    </Box>
  );
}