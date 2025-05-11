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
  MenuItem,
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
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [newNoticesCount, setNewNoticesCount] = useState(0);

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
        const noticeData = {
          title: values.title,
          message: values.message,
          audience: values.audience,
          ...(values.publishAt && { publishAt: values.publishAt.toISOString() }),
        };

        let response;
        if (editMode) {
          response = await axios.patch(
            `${baseApi}/notice/update/${editingId}`,
            noticeData
          );
          setMessage("Notice updated successfully");
        } else {
          response = await axios.post(`${baseApi}/notice/create`, noticeData);
          setMessage("Notice created successfully");
        }

        setMessageType("success");
        resetForm();
        fetchNotices();
        setEditMode(false);
        setEditingId(null);
      } catch (error) {
        console.error("Error:", error);
        setMessage(error.response?.data?.message || "An error occurred");
        setMessageType("error");
      }
    },
  });

  const fetchNotices = async () => {
    try {
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
    }
  };

  const handleEdit = (notice) => {
    setEditMode(true);
    setEditingId(notice._id);
    formik.setValues({
      title: notice.title,
      message: notice.message,
      audience: notice.audience,
      publishAt: notice.publishAt ? new Date(notice.publishAt) : null,
    });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    formik.resetForm();
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${baseApi}/notice/delete/${deleteId}`);
      setMessage("Notice deleted successfully");
      setMessageType("success");
      fetchNotices();
      setOpenDialog(false);
    } catch (error) {
      console.error("Error deleting notice:", error);
      setMessage("Failed to delete notice");
      setMessageType("error");
      setOpenDialog(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDeleteId(null);
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

  useEffect(() => {
    fetchNotices();
  }, []);

  return (
    <Box
      sx={{
        maxWidth: 1000,
        mx: "auto",
        p: 3,
        animation: `${fadeIn} 0.5s ease-out`,
      }}
    >
      {message && (
        <MessageSnackbar
          message={message}
          messageType={messageType}
          handleClose={handleMessageClose}
        />
      )}

      {/* Title and Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: `${gradientFlow} 6s ease infinite`,
            backgroundSize: "200% 200%",
          }}
        >
          {editMode ? "Edit Notice" : "Notice Board"}
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
            avatar={<Avatar>{notices.length}</Avatar>}
          />
        </Box>
      </Box>

      {/* Filter and Search Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flexGrow: 1 }}
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

      {/* Form */}
      <Box 
        component="form" 
        onSubmit={formik.handleSubmit}
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: editMode ? theme.palette.action.selected : theme.palette.background.paper,
          boxShadow: theme.shadows[1],
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[3],
          }
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnnouncementIcon color="primary" />
          {editMode ? "Edit Notice" : "Create New Notice"}
        </Typography>
        
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
              {formik.touched.audience && formik.errors.audience && (
                <FormHelperText error>{formik.errors.audience}</FormHelperText>
              )}
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
            {editMode && (
              <Button
                variant="outlined"
                onClick={cancelEdit}
                startIcon={<CloseIcon />}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              type="submit"
              startIcon={editMode ? <EditIcon /> : <AddIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 'bold',
              }}
            >
              {editMode ? "Update Notice" : "Create Notice"}
            </Button>
          </Stack>
        </Stack>
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
              <Card
                key={notice._id}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  animation: `${fadeIn} 0.5s ease-out`,
                  animationDelay: `${index * 50}ms`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: theme.shadows[3],
                    animation: `${pulse} 2s infinite`,
                  },
                  borderLeft: `4px solid ${
                    notice.audience === 'student' ? theme.palette.primary.main :
                    notice.audience === 'teacher' ? theme.palette.secondary.main :
                    theme.palette.success.main
                  }`,
                }}
                onMouseEnter={() => setHoveredCard(notice._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2,
                    flexWrap: 'wrap'
                  }}>
                    <Box sx={{ flexGrow: 1 }}>
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
                            bgcolor: 
                              notice.audience === 'student' ? theme.palette.primary.light :
                              notice.audience === 'teacher' ? theme.palette.secondary.light :
                              theme.palette.success.light,
                            color: 
                              notice.audience === 'student' ? theme.palette.primary.dark :
                              notice.audience === 'teacher' ? theme.palette.secondary.dark :
                              theme.palette.success.dark,
                          }}
                        />
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {notice.message}
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-end',
                      minWidth: 150
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(notice.createdAt)}
                      </Typography>
                      {notice.publishAt && (
                        <Typography variant="caption" color="text.secondary">
                          Scheduled: {formatDate(notice.publishAt)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ 
                  justifyContent: 'flex-end',
                  bgcolor: theme.palette.action.hover,
                }}>
                  <Tooltip title="Edit notice">
                    <IconButton
                      onClick={() => handleEdit(notice)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete notice">
                    <IconButton
                      onClick={() => confirmDelete(notice._id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              p: 4,
              borderRadius: 2,
              bgcolor: theme.palette.action.hover,
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this notice? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            autoFocus
          >
            Delete Notice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}