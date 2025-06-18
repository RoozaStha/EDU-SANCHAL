import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
  Avatar,
  Tabs,
  Tab,
  InputAdornment,
  TextField,
  Badge,
  Stack,
  LinearProgress,
  Paper,
  Grid,
  useMediaQuery,
  useTheme,
  Button,
  AppBar,
  Toolbar,
} from "@mui/material";
import axios from "axios";
import { baseApi } from "../../../environment";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import SortIcon from "@mui/icons-material/Sort";

export default function NoticeStudent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("student");
  const [newNoticesCount, setNewNoticesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilters, setShowFilters] = useState(!isMobile);

  const audienceOptions = [
    { value: "student", label: "Students", icon: <SchoolIcon /> },
    { value: "teacher", label: "Teachers", icon: <PersonIcon /> },
    { value: "all", label: "All", icon: <GroupsIcon /> },
  ];

  const handleMessageClose = () => {
    setMessage("");
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/notice/all`);
      const sortedNotices = response.data.data
        .filter(notice => notice.audience === "student")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotices(sortedNotices);
      setFilteredNotices(sortedNotices);
      
      const newNotices = sortedNotices.filter(
        notice => new Date(notice.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      setNewNoticesCount(newNotices.length);
    } catch (error) {
      console.error("Error fetching notices:", error);
      setMessage("Failed to fetch notices");
      setMessageType("error");
    } finally {
      setLoading(false);
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
    if (!term.trim()) {
      setFilteredNotices(notices);
    } else {
      const filtered = notices.filter(
        notice => notice.title.toLowerCase().includes(term.toLowerCase()) ||
                notice.message.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredNotices(filtered);
    }
  };

  const filterNoticesByTab = (tabValue) => {
    setFilteredNotices(notices);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm("");
    filterNoticesByTab(newValue);
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
        return theme.palette.primary.main;
      case 'teacher':
        return theme.palette.secondary.main;
      default:
        return theme.palette.success.main;
    }
  };

  const isNewNotice = (dateString) => {
    const date = new Date(dateString);
    return date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "newest" ? "oldest" : "newest";
    setSortOrder(newOrder);
    
    const sorted = [...filteredNotices].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return newOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredNotices(sorted);
  };

  const handleExport = () => {
    setMessage("Export feature would be implemented here");
    setMessageType("info");
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const NoticeSkeleton = () => (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        borderLeft: `4px solid ${theme.palette.grey[300]}`,
        p: 2,
        height: 160,
        mb: 2
      }}
    >
      <Box sx={{ mb: 2 }}>
        <LinearProgress variant="indeterminate" sx={{ height: 8, borderRadius: 2 }} />
      </Box>
      <Box sx={{ mb: 1.5 }}>
        <LinearProgress variant="indeterminate" sx={{ height: 6, borderRadius: 2, width: '60%' }} />
      </Box>
      <Box>
        <LinearProgress variant="indeterminate" sx={{ height: 6, borderRadius: 2, width: '85%' }} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <LinearProgress variant="indeterminate" sx={{ height: 6, borderRadius: 2, width: '30%' }} />
        <LinearProgress variant="indeterminate" sx={{ height: 6, borderRadius: 2, width: '20%' }} />
      </Box>
    </Card>
  );

  return (
    <Box sx={{ p: isMobile ? 1 : 1 }}>
      {message && (
        <MessageSnackbar
          message={message}
          messageType={messageType}
          handleClose={handleMessageClose}
        />
      )}

      {/* App Bar with Title */}
      <AppBar
        position="static"
        color="primary"
        sx={{
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #1976d2 30%, #2196f3 90%)",
          boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setShowFilters(!showFilters)}
              edge="start"
              sx={{ mr: 2 }}
            >
              <FilterListIcon />
            </IconButton>
          )}
          <Typography
            variant="h4"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            <Box component="span" sx={{ color: "#ffffff" }}>
              Student
            </Box>
            <Box component="span" sx={{ color: "#ffffff", ml: 1 }}>
              Notices
            </Box>
          </Typography>
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                sx={{ fontWeight: "bold" }}
              >
                Export
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={fetchNotices}
                sx={{ 
                  fontWeight: "bold",
                  color: "white",
                  borderColor: "rgba(255,255,255,0.5)",
                  '&:hover': {
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.1)"
                  }
                }}
              >
                Refresh
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ 
          mb: 3, 
          background: "#f5f9ff", 
          borderRadius: 2,
          boxShadow: theme.shadows[1]
        }}
        variant={isMobile ? "scrollable" : "standard"}
      >
        <Tab 
          label="Student Notices" 
          value="student" 
          icon={<SchoolIcon fontSize="small" />} 
          iconPosition="start" 
          sx={{ fontWeight: "bold", minHeight: 60 }}
        />
        <Tab 
          label="All Notices" 
          value="all" 
          icon={<GroupsIcon fontSize="small" />} 
          iconPosition="start" 
          sx={{ fontWeight: "bold", minHeight: 60 }}
        />
      </Tabs>

      {showFilters && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search notices..."
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

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={toggleSortOrder}
                sx={{
                  fontWeight: "bold",
                  height: "56px",
                  borderRadius: 2,
                  textTransform: "none"
                }}
              >
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </Button>
            </Grid>

            <Grid item xs={12} md={3} sx={{ display: "flex", gap: 1 }}>
              {isMobile && (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={{ fontWeight: "bold" }}
                >
                  Export
                </Button>
              )}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchNotices}
                sx={{ fontWeight: "bold" }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {!showFilters && isMobile && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(true)}
            sx={{ mb: 2 }}
          >
            Show Filters
          </Button>
        </Box>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, borderLeft: "4px solid #1976d2" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Notices
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {notices.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, borderLeft: "4px solid #4caf50" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                New Notices
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {newNoticesCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, borderLeft: "4px solid #ff9800" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: 3, borderRadius: 2, borderLeft: "4px solid #9c27b0" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Current Audience
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center', gap: 1 }}>
                {getAudienceIcon(activeTab)}
                {getAudienceLabel(activeTab)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notices List */}
      <Box>
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: "bold",
            color: "#1976d2"
          }}
        >
          <FilterListIcon color="primary" />
          {activeTab === 'all' ? 'All Notices' : 'Student Notices'}
          <Chip 
            label={`${filteredNotices.length} notices`} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Typography>

        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3, 4].map((index) => (
              <NoticeSkeleton key={index} />
            ))}
          </Stack>
        ) : filteredNotices.length > 0 ? (
          <Grid container spacing={3}>
            {filteredNotices.map((notice) => {
              const isNew = isNewNotice(notice.createdAt);
              const audienceColor = getAudienceColor(notice.audience);
              
              return (
                <Grid item xs={12} key={notice._id}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: theme.shadows[3],
                      },
                      borderLeft: `4px solid ${audienceColor}`,
                    }}
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              icon={getAudienceIcon(notice.audience)}
                              label={getAudienceLabel(notice.audience)}
                              size="small"
                              sx={{ 
                                bgcolor: `${audienceColor}10`,
                                color: audienceColor,
                                fontWeight: 'bold'
                              }}
                            />
                            {isNew && (
                              <Chip
                                label="New"
                                size="small"
                                color="error"
                                sx={{ 
                                  height: 24,
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </Box>
                          
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600,
                            mb: 1
                          }}>
                            {notice.title}
                          </Typography>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2,
                              lineHeight: 1.6
                            }}
                          >
                            {notice.message}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
                              {formatDate(notice.createdAt)}
                            </Typography>
                            
                            <Typography variant="caption" color="text.secondary">
                              {getTimeAgo(notice.createdAt)}
                            </Typography>
                          </Box>
                        </Box>

                        {notice.publishAt && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-end',
                            minWidth: 150
                          }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <NotificationsActiveIcon fontSize="small" sx={{ mr: 0.5 }} />
                              Published: {formatDate(notice.publishAt)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Paper
            sx={{
              textAlign: 'center',
              p: 4,
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <AnnouncementIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notices found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? `No notices match your search for "${searchTerm}"`
                : "There are no notices available for the current audience"}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}