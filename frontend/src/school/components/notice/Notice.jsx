import { keyframes, useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tabs,
  Tab,
  InputAdornment,
  Paper,
  Fade,
  Grow,
  Zoom,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fab,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Validation schema
const noticeSchema = Yup.object().shape({
  title: Yup.string().required("Title is required").max(100, "Title too long"),
  message: Yup.string().required("Message is required").max(500, "Message too long"),
  audience: Yup.string().required("Audience is required"),
  publishAt: Yup.date().nullable(),
});

export default function Notice() {
  const theme = useTheme();
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [hoveredCard, setHoveredCard] = useState(null);
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
    return audience === 'student' ? 'primary' : 
           audience === 'teacher' ? 'secondary' : 
           'success';
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

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 2, md: 3 },
        animation: `${fadeIn} 0.5s ease-out`,
        position: 'relative',
      }}
    >
      {message && (
        <MessageSnackbar
          message={message}
          messageType={messageType}
          handleClose={handleMessageClose}
        />
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
          }}
        >
          {refreshing ? <RefreshIcon sx={{ animation: 'spin 2s linear infinite' }} /> : <RefreshIcon />}
        </Fab>
      </Zoom>

      {/* Title and Stats */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: `${gradientFlow} 6s ease infinite`,
            backgroundSize: "200% 200%",
            fontSize: { xs: '2rem', md: '2.5rem' },
          }}
        >
          Notice Board
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="New notices in last 7 days">
            <Badge badgeContent={newNoticesCount} color="error">
              <NotificationsActiveIcon color="action" />
            </Badge>
          </Tooltip>
          <Chip 
            label={`Total: ${notices.length}`} 
            variant="outlined" 
            avatar={<Avatar sx={{ bgcolor: theme.palette.primary.main }}>{notices.length}</Avatar>}
          />
        </Box>
      </Box>

      {/* Filter and Search Bar */}
      <Paper 
        elevation={2}
        sx={{ 
          mb: 4,
          p: 2,
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              flexGrow: 1,
              minWidth: 300,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 3,
              }
            }}
          >
            <Tab 
              label="All Notices" 
              value="all" 
              icon={<GroupsIcon fontSize="small" />} 
              iconPosition="start" 
              sx={{ minHeight: 48 }}
            />
            {audienceOptions.map(option => (
              <Tab 
                key={option.value}
                label={option.label} 
                value={option.value} 
                icon={React.cloneElement(option.icon, { fontSize: "small" })} 
                iconPosition="start" 
                sx={{ minHeight: 48 }}
              />
            ))}
          </Tabs>
          
          <TextField
            variant="outlined"
            placeholder="Search notices..."
            size="small"
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
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 20,
              }
            }}
          />
        </Box>
      </Paper>

      {/* Form */}
      <Grow in={true}>
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
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Audience</InputLabel>
                <Select
                  label="Audience"
                  name="audience"
                  value={formik.values.audience}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.audience && Boolean(formik.errors.audience)}
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
                      sx={{ minWidth: 250 }}
                      error={formik.touched.publishAt && Boolean(formik.errors.publishAt)}
                      helperText={formik.touched.publishAt && formik.errors.publishAt}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Box>

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
                }}
              >
                {editMode ? "Update Notice" : "Create Notice"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Grow>

      {/* Notices List */}
      <Box>
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FilterListIcon />
          {activeTab === 'all' ? 'All Notices' : `${getAudienceLabel(activeTab)} Notices`}
          <Chip 
            label={`${filteredNotices.length} found`} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Typography>

        {filteredNotices.length > 0 ? (
          <Stack spacing={2}>
            {filteredNotices.map((notice, index) => (
              <Grow in={true} key={notice._id} timeout={index * 100}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: theme.shadows[3],
                    },
                    borderLeft: `4px solid ${
                      theme.palette[getAudienceColor(notice.audience)].main
                    }`,
                  }}
                  onMouseEnter={() => setHoveredCard(notice._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <CardContent sx={{ pb: 0 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 2,
                      flexWrap: 'wrap'
                    }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1
                        }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            {notice.title}
                            <Chip
                              label={getAudienceLabel(notice.audience)}
                              size="small"
                              icon={getAudienceIcon(notice.audience)}
                              sx={{ 
                                ml: 1,
                                bgcolor: `${theme.palette[getAudienceColor(notice.audience)].light}20`,
                                color: theme.palette[getAudienceColor(notice.audience)].dark,
                              }}
                            />
                          </Typography>
                          
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleExpandNotice(notice._id)}
                              sx={{ mr: 1 }}
                            >
                              {expandedNotice === notice._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, notice)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Collapse in={expandedNotice === notice._id}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 2,
                              whiteSpace: 'pre-wrap',
                              p: 1,
                              bgcolor: 'action.hover',
                              borderRadius: 1
                            }}
                          >
                            {notice.message}
                          </Typography>
                        </Collapse>
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    pt: 0,
                    flexWrap: 'wrap',
                    gap: 1
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" />
                      Created: {formatDate(notice.createdAt)}
                    </Typography>
                    
                    {hoveredCard === notice._id && (
                      <Fade in={hoveredCard === notice._id}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditNotice(notice)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(notice)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Fade>
                    )}
                  </CardActions>
                </Card>
              </Grow>
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              p: 4,
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: theme.shadows[1],
            }}
          >
            <AnnouncementIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notices found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
            >
              Create New Notice
            </Button>
          </Box>
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
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Confirm Delete
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
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={<DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}