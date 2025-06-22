import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Stack, Typography, Card, CardContent, 
  Chip, Avatar, Divider, Tooltip, Paper, Grid, useMediaQuery, 
  Tabs, Tab, TableContainer, Table, TableHead, TableRow, 
  TableCell, TableBody, CircularProgress, IconButton, FormControl, 
  InputLabel, Select, MenuItem, LinearProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Badge
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import axios from 'axios';
import { baseApi } from '../../../environment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTheme } from '@emotion/react';
import { keyframes } from '@emotion/react';

// Icons
import EventIcon from '@mui/icons-material/Event';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import ClassIcon from '@mui/icons-material/Class';
import PersonIcon from '@mui/icons-material/Person';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

const localizer = momentLocalizer(moment);

// Animation keyframes
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(0, 123, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
`;

export default function SchoolLeave() {
  const [analytics, setAnalytics] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const statusColors = {
    PENDING: theme.palette.warning.main,
    APPROVED: theme.palette.success.main,
    REJECTED: theme.palette.error.main
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await axios.get(`${baseApi}/leaves/analytics`, {
        params: { 
          year: year || new Date().getFullYear(),
          month: month || new Date().getMonth() + 1
        },
        withCredentials: true
      });
      
      // Handle empty response
      const data = response.data?.data || {};
      
      setAnalytics({
        summary: data.summary || {
          totalRequests: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          approvalRate: 0,
          avgDuration: 0
        },
        monthlyTrend: data.monthlyTrend || [],
        typeDistribution: data.typeDistribution || [],
        recentLeaves: data.recentLeaves || []
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      
      // Show detailed error message
      const errorMsg = error.response?.data?.message || 
                      "Failed to fetch analytics data";
      
      setMessage(errorMsg);
      setMessageType("error");
      
      // Set empty analytics data
      setAnalytics({
        summary: {
          totalRequests: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          approvalRate: 0,
          avgDuration: 0
        },
        monthlyTrend: [],
        typeDistribution: [],
        recentLeaves: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      setMessage("");
      const start = moment().startOf('month').format('YYYY-MM-DD');
      const end = moment().endOf('month').format('YYYY-MM-DD');
      
      const response = await axios.get(`${baseApi}/leaves/calendar`, {
        params: { start, end },
        withCredentials: true
      });
      setCalendarEvents(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching calendar:", error);
      setMessage("Failed to fetch calendar data");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await axios.get(`${baseApi}/leaves/pending`, {
        withCredentials: true
      });
      setPendingLeaves(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching pending leaves:", error);
      setMessage("Failed to fetch pending leave requests");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      setMessage("");
      await axios.patch(`${baseApi}/leaves/${id}/status`, { 
        status: 'APPROVED' 
      }, {
        withCredentials: true
      });
      setMessage("Leave request approved successfully");
      setMessageType("success");
      fetchPendingLeaves();
    } catch (error) {
      console.error("Error approving leave:", error);
      setMessage(error.response?.data?.message || "Failed to approve leave");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (leave) => {
    setSelectedLeave(leave);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason) {
      setMessage("Please provide a rejection reason");
      setMessageType("warning");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      await axios.patch(`${baseApi}/leaves/${selectedLeave._id}/status`, { 
        status: 'REJECTED',
        rejectedReason: rejectReason
      }, {
        withCredentials: true
      });
      setMessage("Leave request rejected successfully");
      setMessageType("success");
      setRejectDialogOpen(false);
      setRejectReason("");
      fetchPendingLeaves();
    } catch (error) {
      console.error("Error rejecting leave:", error);
      setMessage(error.response?.data?.message || "Failed to reject leave");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setRejectReason("");
    setSelectedLeave(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchAnalytics();
    } else if (activeTab === 1) {
      fetchCalendar();
    } else if (activeTab === 2) {
      fetchPendingLeaves();
    }
  }, [activeTab, year, month]);

  return (
    <Box sx={{ 
      maxWidth: 1400, 
      mx: "auto", 
      p: 0,
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%)',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Animated Header */}
      <Box sx={{ 
        background: 'linear-gradient(90deg, #0c3483 0%, #2a75bc 50%, #0c3483 100%)',
        backgroundSize: '200% 200%',
        animation: `${gradientAnimation} 10s ease infinite`,
        borderRadius: '12px 12px 0 0',
        p: 4,
        mb: 4,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #00c6ff, #0072ff)',
          animation: `${pulse} 2s infinite`
        }
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              letterSpacing: '-0.5px'
            }}>
              <EventIcon fontSize="large" sx={{ color: '#ffd166' }} />
              School Leave Management
            </Typography>
            <Typography variant="subtitle1" sx={{ 
              color: 'rgba(255,255,255,0.85)', 
              mt: 1,
              fontWeight: 400
            }}>
              Manage, analyze and approve leave requests efficiently
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={() => {
              if (activeTab === 0) fetchAnalytics();
              else if (activeTab === 1) fetchCalendar();
              else if (activeTab === 2) fetchPendingLeaves();
            }}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

      {/* Message Alert */}
      {message && (
        <Paper 
          elevation={3} 
          sx={{ 
            mb: 3, 
            p: 2,
            backgroundColor: messageType === 'success' 
              ? theme.palette.success.light 
              : messageType === 'error' 
                ? theme.palette.error.light 
                : theme.palette.warning.light,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            animation: `${fadeIn} 0.4s ease-out`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          {messageType === 'success' ? 
            <CheckCircleIcon color="success" /> : 
            messageType === 'error' ? 
              <CancelIcon color="error" /> : 
              <InfoIcon color="warning" />
          }
          <Typography variant="body1" sx={{ fontWeight: 500 }}>{message}</Typography>
          <IconButton size="small" onClick={() => setMessage("")} sx={{ ml: 'auto' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {/* Tabs & Filters Container */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 2,
        mb: 4,
        p: 3,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(255,255,255,0.5)'
      }}>
        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ 
            mb: isMobile ? 2 : 0,
            '& .MuiTabs-indicator': {
              height: '4px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #0c3483, #2a75bc)'
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: '8px',
                transition: 'all 0.3s',
                '&:hover': {
                  background: 'rgba(12, 52, 131, 0.05)'
                }
              }}>
                <AnalyticsIcon />
                Analytics
              </Box>
            } 
            sx={{ 
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 'auto',
              textTransform: 'none'
            }}
          />
          <Tab 
            label={
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: '8px',
                transition: 'all 0.3s',
                '&:hover': {
                  background: 'rgba(12, 52, 131, 0.05)'
                }
              }}>
                <CalendarMonthIcon />
                Calendar
              </Box>
            } 
            sx={{ 
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 'auto',
              textTransform: 'none'
            }}
          />
          <Tab 
            label={
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: '8px',
                transition: 'all 0.3s',
                '&:hover': {
                  background: 'rgba(12, 52, 131, 0.05)'
                }
              }}>
                <PendingActionsIcon />
                Pending Approvals
                {pendingLeaves.length > 0 && (
                  <Badge 
                    badgeContent={pendingLeaves.length} 
                    color="error" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            } 
            sx={{ 
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 'auto',
              textTransform: 'none'
            }}
          />
        </Tabs>
        
        {/* Filters */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexWrap: 'wrap',
          justifyContent: isMobile ? 'flex-start' : 'flex-end'
        }}>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel sx={{ fontWeight: 500 }}>Year</InputLabel>
            <Select 
              value={year} 
              label="Year" 
              onChange={(e) => setYear(e.target.value)}
              sx={{
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                '& .MuiSelect-select': {
                  py: 1.2
                }
              }}
            >
              {years.map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel sx={{ fontWeight: 500 }}>Month</InputLabel>
            <Select 
              value={month} 
              label="Month" 
              onChange={(e) => setMonth(e.target.value)}
              sx={{
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                '& .MuiSelect-select': {
                  py: 1.2
                }
              }}
            >
              {months.map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Content */}
      {activeTab === 0 ? (
        <Box>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '300px',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              <CircularProgress size={60} thickness={5} sx={{ color: '#0c3483' }} />
            </Box>
          ) : analytics ? (
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12} md={3}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      mb: 2,
                      color: '#0c3483'
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(12, 52, 131, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <SchoolIcon />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total Requests
                      </Typography>
                    </Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: '#0c3483',
                      textAlign: 'center',
                      mt: 1
                    }}>
                      {analytics.summary.totalRequests}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      mb: 2,
                      color: '#00c853'
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(0, 200, 83, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircleIcon />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Approved
                      </Typography>
                    </Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: '#00c853',
                      textAlign: 'center',
                      mt: 1
                    }}>
                      {analytics.summary.approved}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      mb: 2,
                      color: '#ff3d00'
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255, 61, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CancelIcon />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Rejected
                      </Typography>
                    </Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: '#ff3d00',
                      textAlign: 'center',
                      mt: 1
                    }}>
                      {analytics.summary.rejected}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      mb: 2,
                      color: '#ffab00'
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255, 171, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <AccessTimeIcon />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Avg. Duration
                      </Typography>
                    </Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: '#ffab00',
                      textAlign: 'center',
                      mt: 1
                    }}>
                      {analytics.summary.avgDuration} <span style={{ fontSize: '1.5rem', fontWeight: 500 }}>days</span>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Charts */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  p: 3, 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  height: 400 
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    mb: 2,
                    color: '#0c3483'
                  }}>
                    <BarChartIcon />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Monthly Trend
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={analytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                          return monthNames[value - 1] || value;
                        }}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: 'none'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" name="Total Requests" fill="#0c3483" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" name="Approved" fill="#00c853" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  p: 3, 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  height: 400 
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    mb: 2,
                    color: '#0c3483'
                  }}>
                    <PieChartIcon />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Requester Type
                    </Typography>
                  </Box>
                  {analytics.typeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="85%">
                      <PieChart>
                        <Pie
                          data={analytics.typeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="type"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="body1" color="text.secondary">
                        No data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
              
              {/* Recent Leaves */}
              <Grid item xs={12}>
                <Card sx={{ 
                  p: 3, 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    mb: 3,
                    color: '#0c3483'
                  }}>
                    <PendingActionsIcon />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Recent Leave Requests
                    </Typography>
                  </Box>
                  {analytics.recentLeaves.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analytics.recentLeaves.map((leave) => (
                            <TableRow 
                              key={leave._id}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'rgba(12, 52, 131, 0.03)'
                                }
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar sx={{ width: 36, height: 36 }} />
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {leave.requester?.name || "Unknown"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {leave.requesterModel}
                                      {leave.requesterModel === 'Student' && leave.requester?.student_class && 
                                        ` • Class: ${leave.requester.student_class.class_text || "N/A"}`
                                      }
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${calculateDuration(leave.startDate, leave.endDate)} days`} 
                                  variant="outlined"
                                  sx={{ 
                                    fontWeight: 500,
                                    borderColor: '#0c3483',
                                    color: '#0c3483'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Tooltip title={leave.reason}>
                                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                    {leave.reason}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={leave.status}
                                  sx={{ 
                                    backgroundColor: `${statusColors[leave.status]}10`,
                                    color: statusColors[leave.status],
                                    border: `1px solid ${statusColors[leave.status]}`,
                                    fontWeight: 600,
                                    minWidth: 100
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                      <EventIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No recent leave requests
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              p: 4,
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              <AnalyticsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No analytics data available
              </Typography>
            </Box>
          )}
        </Box>
      ) : activeTab === 1 ? (
        <Box>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '400px',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              <CircularProgress size={60} thickness={5} sx={{ color: '#0c3483' }} />
            </Box>
          ) : calendarEvents.length > 0 ? (
            <Card sx={{ 
              p: 3, 
              borderRadius: '16px', 
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.5)',
              height: 600 
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                mb: 2,
                color: '#0c3483'
              }}>
                <CalendarMonthIcon />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Leave Calendar
                </Typography>
              </Box>
              <Calendar
                localizer={localizer}
                events={calendarEvents.map(event => ({
                  ...event,
                  start: new Date(event.start),
                  end: new Date(event.end)
                }))}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                views={['month', 'week', 'day']}
                components={{
                  toolbar: (props) => (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2,
                      px: 2
                    }}>
                      <Button 
                        onClick={() => props.onNavigate('PREV')}
                        startIcon={<ArrowBackIosIcon />}
                        size="small"
                      >
                        Back
                      </Button>
                      <Typography variant="h6" fontWeight={600}>
                        {props.label}
                      </Typography>
                      <Button 
                        onClick={() => props.onNavigate('NEXT')}
                        endIcon={<ArrowForwardIosIcon />}
                        size="small"
                      >
                        Next
                      </Button>
                    </Box>
                  ),
                  event: ({ event }) => (
                    <Tooltip title={
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{event.title}</Typography>
                        <Typography variant="caption">
                          {moment(event.start).format('MMM D, h:mm a')} - {moment(event.end).format('MMM D, h:mm a')}
                        </Typography>
                        <Typography variant="body2" mt={1}>{event.desc}</Typography>
                      </Box>
                    }>
                      <Box sx={{ 
                        p: 1, 
                        bgcolor: (event.extendedProps?.status || 'APPROVED') === 'APPROVED' 
                          ? 'rgba(0, 200, 83, 0.15)' 
                          : 'rgba(255, 171, 0, 0.15)',
                        color: (event.extendedProps?.status || 'APPROVED') === 'APPROVED' 
                          ? '#00c853' 
                          : '#ffab00',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        borderLeft: '4px solid',
                        borderColor: (event.extendedProps?.status || 'APPROVED') === 'APPROVED' 
                          ? '#00c853' 
                          : '#ffab00',
                        fontWeight: 500
                      }}>
                        {event.title}
                      </Box>
                    </Tooltip>
                  )
                }}
              />
            </Card>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              p: 4,
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              <CalendarMonthIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No leave events in this period
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '300px',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              <CircularProgress size={60} thickness={5} sx={{ color: '#0c3483' }} />
            </Box>
          ) : pendingLeaves.length > 0 ? (
            <Card sx={{ 
              p: 3, 
              borderRadius: '16px', 
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.5)',
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                mb: 3,
                color: '#0c3483'
              }}>
                <PendingActionsIcon />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Pending Leave Requests
                  <Badge 
                    badgeContent={pendingLeaves.length} 
                    color="error" 
                    sx={{ ml: 2, fontSize: '0.8rem' }}
                  />
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingLeaves.map((leave) => (
                      <TableRow 
                        key={leave._id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(12, 52, 131, 0.03)'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36 }} />
                            <Typography variant="body2" fontWeight={600}>
                              {leave.requester?.name || "Unknown"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {leave.requesterModel === 'Student' ? (
                            <Chip 
                              icon={<ClassIcon fontSize="small" />}
                              label={`Student • ${leave.requester?.student_class?.class_text || 'N/A'}`}
                              size="small"
                              sx={{
                                background: 'rgba(12, 52, 131, 0.1)',
                                color: '#0c3483',
                                fontWeight: 500
                              }}
                            />
                          ) : (
                            <Chip 
                              icon={<PersonIcon fontSize="small" />}
                              label="Teacher"
                              size="small"
                              sx={{
                                background: 'rgba(255, 61, 0, 0.1)',
                                color: '#ff3d00',
                                fontWeight: 500
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${calculateDuration(leave.startDate, leave.endDate)} days`} 
                            variant="outlined"
                            sx={{ 
                              fontWeight: 500,
                              borderColor: '#0c3483',
                              color: '#0c3483'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={leave.reason}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {leave.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small"
                            sx={{ 
                              mr: 1,
                              fontWeight: 600,
                              boxShadow: 'none',
                              borderRadius: '8px',
                              px: 2,
                              py: 1,
                              minWidth: 100
                            }}
                            onClick={() => handleApprove(leave._id)}
                            disabled={loading}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            onClick={() => handleRejectClick(leave)}
                            disabled={loading}
                            sx={{ 
                              fontWeight: 600,
                              borderRadius: '8px',
                              px: 2,
                              py: 1,
                              minWidth: 100
                            }}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              p: 4,
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              <CheckCircleIcon sx={{ fontSize: 60, color: '#00c853', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No pending leave requests
              </Typography>
              <Typography variant="body1" color="text.secondary">
                All leave requests have been processed
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={handleRejectCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 16px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{
          background: 'linear-gradient(90deg, #0c3483 0%, #2a75bc 100%)',
          color: 'white',
          p: 2
        }}>
          <DialogTitle sx={{ color: 'white', fontWeight: 700, p: 0 }}>
            Reject Leave Request
          </DialogTitle>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Typography sx={{ mb: 2, fontWeight: 500 }}>
            Please provide a reason for rejecting this leave request:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            label="Rejection Reason"
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleRejectCancel} 
            color="inherit"
            sx={{
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
              py: 1
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRejectConfirm} 
            color="error"
            variant="contained"
            disabled={loading}
            sx={{
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
              py: 1,
              boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)'
            }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}