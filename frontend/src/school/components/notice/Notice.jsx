import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Stack, TextField, Typography, IconButton, Card, CardContent, 
  FormControl, InputLabel, Select, Chip, Avatar, Divider, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, Badge, Tabs, Tab, InputAdornment, 
  Paper, Fade, Grow, Zoom, Collapse, Fab, Grid, useMediaQuery, LinearProgress, 
  Skeleton, Menu, MenuItem, List, ListItem, ListItemIcon, ListItemText, 
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { keyframes, useTheme, alpha } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { baseApi } from '../../../environment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SubjectIcon from "@mui/icons-material/Subject";
import AddIcon from "@mui/icons-material/Add";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RefreshIcon from "@mui/icons-material/Refresh";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import TableChartIcon from '@mui/icons-material/TableChart';
import TodayIcon from '@mui/icons-material/Today';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const floating = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

// Validation schema
const noticeSchema = Yup.object().shape({
  title: Yup.string().required("Title is required").max(100, "Title too long"),
  message: Yup.string().required("Message is required").max(500, "Message too long"),
  audience: Yup.string().required("Audience is required"),
  publishAt: Yup.date().nullable(),
});

function StatCard({ icon, title, value, color, loading, subtitle }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: 3,
        transition: 'all 0.3s ease',
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        overflow: 'visible',
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.5)})`,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }
      }}>
        <CardContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          p: 3,
          height: '100%'
        }}>
          <Avatar sx={{ 
            backgroundColor: `${color}20`, 
            color: color,
            width: 56,
            height: 56,
            boxShadow: `0 4px 10px ${alpha(color, 0.3)}`,
          }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={60} height={40} /> 
            ) : (
              <Typography variant="h3" component="div" sx={{ fontWeight: 700, color }}>
                {value}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Notice() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [newNoticesCount, setNewNoticesCount] = useState(0);
  const [expandedNotice, setExpandedNotice] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentNotice, setCurrentNotice] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedNotices, setBookmarkedNotices] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  const audienceOptions = [
    { value: "student", label: "Students", icon: <SchoolIcon /> },
    { value: "teacher", label: "Teachers", icon: <PersonIcon /> },
    { value: "all", label: "Everyone", icon: <GroupsIcon /> },
  ];

  const handleMessageClose = () => {
    setMessage("");
  };

  const formik = useFormik({
    initialValues: {
      title: "",
      message: "",
      audience: "student",
      publishAt: null,
    },
    validationSchema: noticeSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        const noticeData = {
          title: values.title,
          message: values.message,
          audience: values.audience,
          ...(values.publishAt && { publishAt: values.publishAt.toISOString() }),
        };

        if (editMode && currentNotice) {
          // Update existing notice
          await axios.patch(`${baseApi}/notice/update/${currentNotice._id}`, noticeData);
          setMessage("Notice updated successfully");
        } else {
          // Create new notice
          await axios.post(`${baseApi}/notice/create`, noticeData);
          setMessage("Notice created successfully");
        }
        
        setMessageType("success");
        resetForm();
        setEditMode(false);
        setCurrentNotice(null);
        fetchNotices();
      } catch (error) {
        console.error("Error:", error);
        setMessage(error.response?.data?.message || "An error occurred");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchNotices = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${baseApi}/notice/all`);
      const sortedNotices = response.data.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotices(sortedNotices);
      setFilteredNotices(sortedNotices);
      
      // Count new notices (created in last 7 days)
      const newNotices = sortedNotices.filter(notice => 
        new Date(notice.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      setNewNoticesCount(newNotices.length);
    } catch (error) {
      console.error("Error fetching notices:", error);
      setMessage("Failed to fetch notices");
      setMessageType("error");
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return formatDate(dateString).split(',')[0];
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term === "") {
      setFilteredNotices(notices);
    } else {
      const filtered = notices.filter(notice =>
        notice.title.toLowerCase().includes(term.toLowerCase()) ||
        notice.message.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredNotices(filtered);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === "all") {
      setFilteredNotices(notices);
    } else {
      setFilteredNotices(notices.filter(notice => notice.audience === newValue));
    }
  };

  const getAudienceLabel = (audience) => {
    const option = audienceOptions.find(opt => opt.value === audience);
    return option ? option.label : audience;
  };

  const getAudienceIcon = (audience) => {
    const option = audienceOptions.find(opt => opt.value === audience);
    return option ? option.icon : <GroupsIcon />;
  };

  const getAudienceColor = (audience) => {
    switch (audience) {
      case 'student':
        return {
          bg: theme.palette.primary.light,
          color: theme.palette.primary.dark,
          border: theme.palette.primary.main
        };
      case 'teacher':
        return {
          bg: theme.palette.secondary.light,
          color: theme.palette.secondary.dark,
          border: theme.palette.secondary.main
        };
      default:
        return {
          bg: theme.palette.success.light,
          color: theme.palette.success.dark,
          border: theme.palette.success.main
        };
    }
  };

  const isNewNotice = (dateString) => {
    const date = new Date(dateString);
    return date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  };

  const toggleBookmark = (noticeId) => {
    let updatedBookmarks;
    if (bookmarkedNotices.includes(noticeId)) {
      updatedBookmarks = bookmarkedNotices.filter(id => id !== noticeId);
    } else {
      updatedBookmarks = [...bookmarkedNotices, noticeId];
    }
    setBookmarkedNotices(updatedBookmarks);
  };

  const isBookmarked = (noticeId) => {
    return bookmarkedNotices.includes(noticeId);
  };

  const handleExpandNotice = (noticeId) => {
    setExpandedNotice(expandedNotice === noticeId ? null : noticeId);
  };

  const handleEditNotice = (notice) => {
    setEditMode(true);
    setCurrentNotice(notice);
    formik.setValues({
      title: notice.title,
      message: notice.message,
      audience: notice.audience,
      publishAt: notice.publishAt ? new Date(notice.publishAt) : null,
    });
    // Scroll to form
    document.getElementById('notice-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setCurrentNotice(null);
    formik.resetForm();
  };

  const handleDeleteClick = (notice) => {
    setNoticeToDelete(notice);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await axios.delete(`${baseApi}/notice/delete/${noticeToDelete._id}`);
      setMessage("Notice deleted successfully");
      setMessageType("success");
      fetchNotices();
    } catch (error) {
      console.error("Error deleting notice:", error);
      setMessage("Failed to delete notice");
      setMessageType("error");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setNoticeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmOpen(false);
    setNoticeToDelete(null);
  };

  const handleMenuOpen = (event, notice) => {
    setAnchorEl(event.currentTarget);
    setCurrentNotice(notice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentNotice(null);
  };

  const handleRefresh = () => {
    fetchNotices();
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const NoticeSkeleton = () => (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        animation: `${fadeIn} 0.5s ease-out`,
        borderLeft: `4px solid ${theme.palette.grey[300]}`,
        p: 2,
        height: 160,
      }}
    >
      <Box sx={{ 
        height: '100%',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: `shimmer 1.5s infinite`,
        borderRadius: 1
      }} />
    </Card>
  );

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: "auto",
        p: { xs: 2, md: 3 },
        animation: `${fadeIn} 0.5s ease-out`,
        position: 'relative',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${theme.palette.background.default} 100%)`,
        minHeight: '100vh'
      }}
    >
      {message && (
        <Box sx={{ position: 'fixed', bottom: 20, left: 20, zIndex: 9999 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                p: 2, 
                backgroundColor: messageType === 'success' ? theme.palette.success.light : theme.palette.error.light,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {messageType === 'success' ? 
                <CheckCircleIcon color="success" /> : 
                <InfoIcon color="error" />
              }
              <Typography variant="body1">{message}</Typography>
              <IconButton size="small" onClick={handleMessageClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Paper>
          </motion.div>
        </Box>
      )}

      {/* Floating Action Button for Refresh */}
      <Zoom in={true}>
        <Fab
          color="primary"
          aria-label="refresh"
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
            animation: refreshing ? `${pulse} 1s infinite` : 'none',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          }}
        >
          {refreshing ? <RefreshIcon sx={{ animation: 'spin 2s linear infinite' }} /> : <RefreshIcon />}
        </Fab>
      </Zoom>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
          backgroundColor: theme.palette.primary.dark,
          borderRadius: 3,
          p: 3,
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              p: 2,
              borderRadius: 2,
            }}>
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <NotificationsActiveIcon sx={{ 
                  fontSize: 40, 
                  color: 'white',
                  animation: `${pulse} 2s infinite`,
                }} />
              </motion.div>
            </Box>
            
            <Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{ 
                  flexGrow: 1, 
                  fontWeight: "bold", 
                  color: "white",
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                }}
              >
                Notice Board
              </Typography>
              <Typography variant="body1" color="rgba(255,255,255,0.9)" sx={{ fontStyle: 'italic' }}>
                Manage and publish important announcements
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="New notices in last 7 days">
              <Badge badgeContent={newNoticesCount} color="error">
                <NotificationsActiveIcon sx={{ color: 'white' }} />
              </Badge>
            </Tooltip>
            <Chip 
              label={`Total: ${notices.length}`} 
              variant="outlined" 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)'
              }}
              avatar={<Avatar sx={{ bgcolor: theme.palette.secondary.main }}>{notices.length}</Avatar>}
            />
          </Box>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<NotificationsIcon fontSize="medium" />}
            title="Total Notices"
            value={notices.length}
            color={theme.palette.primary.main}
            loading={loading}
            subtitle="All notices"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<EventNoteIcon fontSize="medium" />}
            title="New Notices"
            value={newNoticesCount}
            color={theme.palette.info.main}
            loading={loading}
            subtitle="Last 7 days"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<PeopleAltIcon fontSize="medium" />}
            title="Active Audience"
            value={audienceOptions.length}
            color={theme.palette.success.main}
            loading={loading}
            subtitle="Target groups"
          />
        </Grid>
      </Grid>

      {/* Action Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        gap: 2,
        flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                textTransform: 'none',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              Refresh
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                if (editMode) {
                  document.getElementById('notice-form')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setEditMode(false);
                  setCurrentNotice(null);
                  formik.resetForm();
                  setTimeout(() => {
                    document.getElementById('notice-form')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            >
              New Notice
            </Button>
          </motion.div>
        </Box>
        
        {/* View Mode Toggle */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 1,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          p: 0.5,
          boxShadow: theme.shadows[1]
        }}>
          <Button
            variant={viewMode === 'card' ? 'contained' : 'text'}
            onClick={() => setViewMode('card')}
            startIcon={<TodayIcon />}
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 100,
            }}
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'text'}
            onClick={() => setViewMode('table')}
            startIcon={<TableChartIcon />}
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 100,
            }}
          >
            Table
          </Button>
        </Box>
      </Box>

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Paper 
          elevation={2}
          sx={{ 
            mb: 4,
            p: 2,
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search notices"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => handleSearch("")}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                height: '100%'
              }}>
                <FilterListIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Showing: 
                </Typography>
                <Chip 
                  label={activeTab === 'all' ? 'All Notices' : `${getAudienceLabel(activeTab)} Notices`} 
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip 
                  label={`${filteredNotices.length} notices`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper 
          id="notice-form"
          elevation={3}
          component="form" 
          onSubmit={formik.handleSubmit}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            bgcolor: 'background.paper',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: theme.shadows[6],
            },
            borderLeft: `4px solid ${editMode ? theme.palette.warning.main : theme.palette.primary.main}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontWeight: 700
            }}>
              <AnnouncementIcon color={editMode ? "warning" : "primary"} />
              {editMode ? "Edit Notice" : "Create New Notice"}
            </Typography>
            {editMode && (
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={handleCancelEdit}
                startIcon={<CloseIcon />}
              >
                Cancel
              </Button>
            )}
          </Box>
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              variant="outlined"
              label="Title"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AssignmentIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <TextField
              fullWidth
              variant="outlined"
              label="Message"
              name="message"
              value={formik.values.message}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.message && Boolean(formik.errors.message)}
              helperText={formik.touched.message && formik.errors.message}
              multiline
              rows={4}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SubjectIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Audience</InputLabel>
                  <Select
                    label="Audience"
                    name="audience"
                    value={formik.values.audience}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.audience && Boolean(formik.errors.audience)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  >
                    {audienceOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {option.icon}
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Schedule Publish Time"
                    value={formik.values.publishAt}
                    onChange={(newValue) => {
                      formik.setFieldValue("publishAt", newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={formik.touched.publishAt && Boolean(formik.errors.publishAt)}
                        helperText={formik.touched.publishAt && formik.errors.publishAt}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccessTimeIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                type="submit"
                startIcon={editMode ? <CheckIcon /> : <AddIcon />}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  minWidth: 150,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
              >
                {editMode ? "Update Notice" : "Create Notice"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </motion.div>

      {/* Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 3,
        boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
      }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            minHeight: 48,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 3,
              backgroundColor: theme.palette.primary.main,
            },
            '& .MuiTab-root': {
              minHeight: 48,
              fontWeight: 600,
              borderRadius: 1,
              mx: 0.5,
              textTransform: 'none',
              fontSize: '0.9rem',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }
          }}
        >
          <Tab 
            label="All Notices" 
            value="all" 
            icon={<GroupsIcon fontSize="small" />} 
            iconPosition="start" 
          />
          {audienceOptions.map(option => (
            <Tab 
              key={option.value}
              label={option.label} 
              value={option.value} 
              icon={React.cloneElement(option.icon, { fontSize: "small" })} 
              iconPosition="start" 
            />
          ))}
        </Tabs>
      </Box>

      {/* Notices List */}
      <Box>
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 700,
            color: theme.palette.text.primary
          }}
        >
          <FilterListIcon />
          {activeTab === 'all' ? 'All Notices' : `${getAudienceLabel(activeTab)} Notices`}
          <Chip 
            label={`${filteredNotices.length} found`} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ ml: 1, fontWeight: 600 }}
          />
        </Typography>

        {loading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <NoticeSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : filteredNotices.length > 0 ? (
          viewMode === 'card' ? (
            <Grid container spacing={3}>
              {filteredNotices.map((notice, index) => {
                const audienceColor = getAudienceColor(notice.audience);
                const isNew = isNewNotice(notice.createdAt);
                const bookmarked = isBookmarked(notice._id);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={notice._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderLeft: `4px solid ${audienceColor.border}`,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          '&:hover': {
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 1
                          }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1
                              }}>
                                {notice.title}
                                {isNew && (
                                  <Chip
                                    label="New"
                                    size="small"
                                    color="error"
                                    sx={{ 
                                      height: 20,
                                      '& .MuiChip-label': {
                                        px: 1,
                                        py: 0,
                                        fontWeight: 'bold',
                                        fontSize: '0.625rem'
                                      }
                                    }}
                                  />
                                )}
                              </Typography>
                              
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  mb: 2,
                                  lineHeight: 1.6,
                                  minHeight: 60
                                }}
                              >
                                {notice.message.length > 100 
                                  ? `${notice.message.substring(0, 100)}...` 
                                  : notice.message}
                              </Typography>
                            </Box>

                            <IconButton 
                              size="small" 
                              onClick={() => toggleBookmark(notice._id)}
                              sx={{ mt: -1, mr: -1 }}
                            >
                              {bookmarked ? (
                                <BookmarkIcon color="secondary" />
                              ) : (
                                <BookmarkBorderIcon />
                              )}
                            </IconButton>
                          </Box>
                          
                          <Divider sx={{ my: 1.5, borderColor: theme.palette.divider }} />
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1
                          }}>
                            <Box>
                              <Chip
                                icon={getAudienceIcon(notice.audience)}
                                label={getAudienceLabel(notice.audience)}
                                size="small"
                                sx={{ 
                                  bgcolor: audienceColor.bg,
                                  color: audienceColor.color,
                                  border: `1px solid ${audienceColor.border}`,
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                              
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, display: 'block', mt: 0.5 }}>
                                {getTimeAgo(notice.createdAt)}
                              </Typography>
                            </Box>
                            
                            <Button 
                              variant="outlined" 
                              size="small"
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: 600,
                                color: theme.palette.primary.main,
                                borderColor: theme.palette.primary.light,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  borderColor: theme.palette.primary.main
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </Box>
                        </CardContent>
                        
                        <Box sx={{ 
                          bgcolor: alpha(theme.palette.primary.light, 0.1),
                          p: 1.5,
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(notice.createdAt)}
                          </Typography>
                          {notice.publishAt && (
                            <Typography variant="caption" color="text.secondary">
                              Published: {formatDate(notice.publishAt)}
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <TableContainer
              component={Paper} 
              sx={{ 
                borderRadius: 3, 
                boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Table>
                <TableHead
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    '& th': { 
                      fontWeight: 'bold', 
                      fontSize: theme.typography.pxToRem(14),
                      color: theme.palette.common.white
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Audience</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotices.map((notice) => {
                    const isNew = isNewNotice(notice.createdAt);
                    const bookmarked = isBookmarked(notice._id);
                    
                    return (
                      <TableRow 
                        key={notice._id} 
                        hover
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {notice.title}
                            {isNew && (
                              <Chip
                                label="New"
                                size="small"
                                color="error"
                                sx={{ 
                                  height: 20,
                                  '& .MuiChip-label': {
                                    px: 1,
                                    py: 0,
                                    fontWeight: 'bold',
                                    fontSize: '0.625rem'
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getAudienceIcon(notice.audience)}
                            label={getAudienceLabel(notice.audience)}
                            size="small"
                            sx={{ 
                              bgcolor: getAudienceColor(notice.audience).bg,
                              color: getAudienceColor(notice.audience).color,
                              border: `1px solid ${getAudienceColor(notice.audience).border}`,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {notice.message.length > 50 
                              ? `${notice.message.substring(0, 50)}...` 
                              : notice.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2">
                              {formatDate(notice.createdAt)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getTimeAgo(notice.createdAt)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => toggleBookmark(notice._id)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                                }
                              }}
                            >
                              {bookmarked ? (
                                <BookmarkIcon color="secondary" />
                              ) : (
                                <BookmarkBorderIcon />
                              )}
                            </IconButton>
                            <Button 
                              variant="outlined" 
                              size="small"
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: 600,
                              }}
                            >
                              View
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              sx={{
                textAlign: 'center',
                p: 6,
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: 3,
                border: `1px dashed ${theme.palette.divider}`,
                maxWidth: 600,
                mx: 'auto',
                mt: 4
              }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AnnouncementIcon sx={{ 
                  fontSize: 80, 
                  color: theme.palette.text.disabled, 
                  mb: 2,
                  opacity: 0.7
                }} />
              </motion.div>
              <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                No notices found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm 
                  ? `No notices match your search for "${searchTerm}"`
                  : activeTab === 'all' 
                    ? "You haven't created any notices yet"
                    : `No notices for ${getAudienceLabel(activeTab)} found`}
              </Typography>
              <Button 
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  const firstInput = document.querySelector('input');
                  if (firstInput) firstInput.focus();
                }}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
              >
                Create New Notice
              </Button>
            </Paper>
          </motion.div>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            minWidth: 180,
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            handleEditNotice(currentNotice);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleDeleteClick(currentNotice);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 16px 32px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the notice "{noticeToDelete?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel} 
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={<DeleteIcon />}
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}