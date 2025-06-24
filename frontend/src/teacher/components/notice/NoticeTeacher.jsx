import { keyframes, useTheme, alpha } from "@mui/material/styles";
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
  Paper,
  Grid,
  Skeleton,
  Divider,
  Button,
  Tooltip,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  AppBar,
  Toolbar,
  LinearProgress
} from "@mui/material";
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { motion } from "framer-motion";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import TableChartIcon from '@mui/icons-material/TableChart';
import TodayIcon from '@mui/icons-material/Today';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuIcon from '@mui/icons-material/Menu';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
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

export default function TeacherNoticeBoard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("teacher");
  const [newNoticesCount, setNewNoticesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookmarkedNotices, setBookmarkedNotices] = useState([]);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [stats, setStats] = useState({
    totalNotices: 0,
    newNotices: 0,
    bookmarked: 0
  });

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
      
      // Update stats
      setStats({
        totalNotices: sortedNotices.length,
        newNotices: newNotices.length,
        bookmarked: bookmarkedNotices.length
      });
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
    setPage(0); // Reset to first page when searching
  };

  const filterNoticesByTab = (tabValue) => {
    if (tabValue === "all") {
      setFilteredNotices(notices);
    } else {
      setFilteredNotices(notices.filter(notice => notice.audience === tabValue));
    }
    setPage(0); // Reset to first page when changing tabs
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
    
    // Update stats
    setStats(prev => ({
      ...prev,
      bookmarked: updatedBookmarks.length
    }));
  };

  const isBookmarked = (noticeId) => {
    return bookmarkedNotices.includes(noticeId);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    // Update bookmarked count in stats
    setStats(prev => ({
      ...prev,
      bookmarked: bookmarkedNotices.length
    }));
  }, [bookmarkedNotices]);

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
        animation: `${shimmer} 1.5s infinite`,
        borderRadius: 1
      }} />
    </Card>
  );

  return (
    <Box
      sx={{
        width: '100%',
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

      {/* App Bar */}
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
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              p: 1,
              borderRadius: 2,
            }}>
              <NotificationsActiveIcon sx={{ 
                fontSize: 32, 
                color: 'white',
                animation: `${pulse} 2s infinite`,
              }} />
            </Box>
            
            <Box>
              <Typography
                variant="h4"
                component="div"
                sx={{ flexGrow: 1, fontWeight: "bold", color: "white" }}
              >
                Notice Board
              </Typography>
              <Typography variant="body1" color="rgba(255,255,255,0.8)">
                Important announcements and updates
              </Typography>
            </Box>
          </Box>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <Button
                variant={viewMode === 'card' ? 'contained' : 'outlined'}
                color="inherit"
                onClick={() => setViewMode('card')}
                startIcon={<TodayIcon />}
                sx={{ 
                  fontWeight: "bold",
                  backgroundColor: viewMode === 'card' ? 'rgba(255,255,255,0.2)' : 'transparent'
                }}
              >
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                color="inherit"
                onClick={() => setViewMode('table')}
                startIcon={<TableChartIcon />}
                sx={{ 
                  fontWeight: "bold",
                  backgroundColor: viewMode === 'table' ? 'rgba(255,255,255,0.2)' : 'transparent'
                }}
              >
                Table
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<NotificationsActiveIcon fontSize="medium" />}
            title="Total Notices"
            value={stats.totalNotices}
            color={theme.palette.primary.main}
            loading={loading}
            subtitle="All notices"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<CheckCircleIcon fontSize="medium" />}
            title="New Notices"
            value={stats.newNotices}
            color={theme.palette.info.main}
            loading={loading}
            subtitle="Last 7 days"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<BookmarkIcon fontSize="medium" />}
            title="Bookmarked"
            value={stats.bookmarked}
            color={theme.palette.success.main}
            loading={loading}
            subtitle="Saved notices"
          />
        </Grid>
      </Grid>

      {/* Filters Section */}
      {showFilters && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
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
      )}

      {!showFilters && isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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

      {/* Action Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        gap: 2,
        flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchNotices}
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
        
        </Box>
        
        {/* View Mode Toggle for Mobile */}
        {isMobile && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 1
          }}>
            <Button
              variant={viewMode === 'card' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('card')}
              startIcon={<TodayIcon />}
              size="small"
            >
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              startIcon={<TableChartIcon />}
              size="small"
            >
              Table
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1]
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
      </Box>

      {/* Notices List */}
      {loading ? (
        <Box sx={{ p: 2 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <NoticeSkeleton />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : filteredNotices.length > 0 ? (
        <>
          {viewMode === 'card' ? (
            <Grid container spacing={2}>
              {filteredNotices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((notice, index) => {
                  const audienceColor = getAudienceColor(notice.audience);
                  const isNew = isNewNotice(notice.createdAt);
                  const bookmarked = isBookmarked(notice._id);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={notice._id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <NoticeCard 
                          notice={notice} 
                          audienceColor={audienceColor}
                          isNew={isNew}
                          bookmarked={bookmarked}
                          toggleBookmark={toggleBookmark}
                          formatDate={formatDate}
                          getTimeAgo={getTimeAgo}
                          getAudienceLabel={getAudienceLabel}
                          getAudienceIcon={getAudienceIcon}
                          theme={theme}
                        />
                      </motion.div>
                    </Grid>
                  );
                })}
            </Grid>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
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
                  {filteredNotices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((notice) => {
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
          )}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredNotices.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ mt: 2 }}
          />
        </>
      ) : (
        <EmptyState 
          searchTerm={searchTerm} 
          activeTab={activeTab} 
          getAudienceLabel={getAudienceLabel} 
          fetchNotices={fetchNotices}
        />
      )}
    </Box>
  );
}

function StatCard({ icon, title, value, color, loading, subtitle }) {
  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: 4
      },
      height: '100%'
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
          height: 56
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
            <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function NoticeCard({ 
  notice, 
  audienceColor, 
  isNew, 
  bookmarked, 
  toggleBookmark, 
  formatDate, 
  getTimeAgo,
  getAudienceLabel,
  getAudienceIcon,
  theme 
}) {
  return (
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
        boxShadow: theme.shadows[1],
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[4],
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
        
        <Divider sx={{ my: 1.5 }} />
        
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
            variant="text" 
            size="small"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              color: theme.palette.primary.main
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
      
      <Box sx={{ 
        bgcolor: theme.palette.grey[100],
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
  );
}

function EmptyState({ searchTerm, activeTab, getAudienceLabel, fetchNotices }) {
  const theme = useTheme(); // Fixed: Added useTheme hook
  
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: 3,
        border: `1px dashed ${theme.palette.divider}`,
        maxWidth: 600,
        mx: 'auto',
        mt: 4
      }}
    >
      <AnnouncementIcon sx={{ 
        fontSize: 80, 
        color: theme.palette.text.disabled, 
        mb: 2,
        opacity: 0.7
      }} />
      <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
        No notices found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {searchTerm 
          ? `No notices match your search for "${searchTerm}"`
          : activeTab === 'all' 
            ? "There are no notices available"
            : `No notices for ${getAudienceLabel(activeTab)} found`}
      </Typography>
      <Button 
        variant="outlined" 
        startIcon={<RefreshIcon />}
        onClick={fetchNotices}
        sx={{ borderRadius: 2, fontWeight: 600 }}
      >
        Refresh Notices
      </Button>
    </Paper>
  );
}