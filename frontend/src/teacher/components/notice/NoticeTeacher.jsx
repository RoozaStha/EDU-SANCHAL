import { keyframes, useTheme } from "@mui/material/styles";
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
} from "@mui/material";
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";
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

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export default function NoticeBoard() {
  const theme = useTheme();
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("teacher"); // Default to teacher tab
  const [newNoticesCount, setNewNoticesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const audienceOptions = [
    { value: "student", label: "Students", icon: <SchoolIcon /> },
    { value: "teacher", label: "Teachers", icon: <PersonIcon /> },
    { value: "all", label: "Everyone", icon: <GroupsIcon /> },
  ];

  const handleMessageClose = () => {
    setMessage("");
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/notice/all`);
      const sortedNotices = response.data.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotices(sortedNotices);
      
      // Default to showing teacher notices
      const teacherNotices = sortedNotices.filter(notice => notice.audience === "teacher");
      setFilteredNotices(teacherNotices);
      
      // Count new notices (created in last 7 days)
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
    
    return formatDate(dateString).split(',')[0]; // Return just the date part
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      filterNoticesByTab(activeTab);
    } else {
      const filtered = notices.filter(
        notice => {
          const matchesSearch = notice.title.toLowerCase().includes(term.toLowerCase()) ||
                              notice.message.toLowerCase().includes(term.toLowerCase());
          
          if (activeTab === "all") return matchesSearch;
          return matchesSearch && notice.audience === activeTab;
        }
      );
      setFilteredNotices(filtered);
    }
  };

  const filterNoticesByTab = (tabValue) => {
    if (tabValue === "all") {
      setFilteredNotices(notices);
    } else {
      setFilteredNotices(notices.filter(notice => notice.audience === tabValue));
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm(""); // Clear search when changing tabs
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

  // Check if notice is new (within the last 7 days)
  const isNewNotice = (dateString) => {
    const date = new Date(dateString);
    return date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Skeleton loader for notices
  const NoticeSkeleton = () => (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
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
        animation: `${shimmer} 1.5s infinite`,
        borderRadius: 1
      }} />
    </Card>
  );

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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        position: 'relative'
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
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <NotificationsIcon fontSize="large" sx={{ color: theme.palette.primary.main }} /> 
          Notice Board
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={<CalendarTodayIcon />}
            label={`Last updated: ${formatDate(new Date()).split(',')[0]}`} 
            variant="outlined"
            size="small"
          />
          <Badge badgeContent={newNoticesCount} color="error">
            <Chip 
              label={`Total: ${notices.length}`} 
              variant="outlined" 
              avatar={<Avatar>{notices.length}</Avatar>}
              color="primary"
            />
          </Badge>
        </Box>
      </Box>

      {/* Filter and Search Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        gap: 2,
        flexWrap: {xs: 'wrap', md: 'nowrap'},
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        p: 1,
        boxShadow: theme.shadows[1]
      }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            flexGrow: 1,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 3
            },
            '& .MuiTab-root': {
              minHeight: 48,
              fontWeight: 600,
              borderRadius: 1,
              mx: 0.5
            }
          }}
        >
          <Tab 
            label="Teacher Notices" 
            value="teacher" 
            icon={<PersonIcon fontSize="small" />} 
            iconPosition="start" 
          />
          <Tab 
            label="Student Notices" 
            value="student" 
            icon={<SchoolIcon fontSize="small" />} 
            iconPosition="start" 
          />
          <Tab 
            label="All Notices" 
            value="all" 
            icon={<GroupsIcon fontSize="small" />} 
            iconPosition="start" 
          />
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
            minWidth: {xs: '100%', md: 250},
            '& .MuiOutlinedInput-root': {
              borderRadius: 20,
            }
          }}
        />
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
          <FilterListIcon color="primary" />
          {activeTab === 'all' ? 'All Notices' : `${getAudienceLabel(activeTab)} Notices`}
          <Chip 
            label={`${filteredNotices.length} found`} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Typography>

        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((index) => (
              <NoticeSkeleton key={index} />
            ))}
          </Stack>
        ) : filteredNotices.length > 0 ? (
          <Stack spacing={2}>
            {filteredNotices.map((notice, index) => {
              const audienceColor = getAudienceColor(notice.audience);
              const isNew = isNewNotice(notice.createdAt);
              
              return (
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
                    },
                    borderLeft: `4px solid ${audienceColor.border}`,
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
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
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
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 1 }}>
                          <Chip
                            icon={getAudienceIcon(notice.audience)}
                            label={getAudienceLabel(notice.audience)}
                            size="small"
                            sx={{ 
                              bgcolor: audienceColor.bg,
                              color: audienceColor.color,
                              border: `1px solid ${audienceColor.border}`,
                            }}
                          />
                          
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {getTimeAgo(notice.createdAt)}
                          </Typography>
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mt: 1,
                            lineHeight: 1.6
                          }}
                        >
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
                            Published: {formatDate(notice.publishAt)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
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
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? `No notices match your search for "${searchTerm}"`
                : activeTab === 'all' 
                  ? "There are no notices available"
                  : `No notices for ${getAudienceLabel(activeTab)} found`}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}