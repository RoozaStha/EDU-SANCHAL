import { useTheme } from "@mui/material/styles";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  keyframes,
  Chip,
  Skeleton,
  Avatar,
  Divider,
  IconButton,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  LinearProgress,
  useMediaQuery,
  Button,
  AppBar,
  Toolbar,
  Badge,
  TablePagination
} from "@mui/material";
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";

// Icons
import EventIcon from "@mui/icons-material/Event";
import SubjectIcon from "@mui/icons-material/Subject";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import SchoolIcon from "@mui/icons-material/School";
import InfoIcon from "@mui/icons-material/Info";
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AlarmIcon from '@mui/icons-material/Alarm';
import TodayIcon from '@mui/icons-material/Today';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import TimelineIcon from '@mui/icons-material/Timeline';

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

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`exams-tabpanel-${index}`}
      aria-labelledby={`exams-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `exams-tab-${index}`,
    'aria-controls': `exams-tabpanel-${index}`,
  };
}

export default function TeacherExaminations() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [examinations, setExaminations] = useState([]);
  const [filteredExaminations, setFilteredExaminations] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    upcomingExams: 0,
    completedExams: 0
  });
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleMessageClose = () => {
    setMessage("");
  };

  const fetchExaminations = async () => {
    setIsLoading(true);
    try {
      // Get student's class ID from localStorage
      const classId = localStorage.getItem('classId');
      
      if (!classId) {
        setMessage("You are not enrolled in any class");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      // Fetch exams only for the student's class
      const response = await axios.get(`${baseApi}/examination/class/${classId}`);
      setExaminations(response.data.examinations || []);
      
      // Calculate stats
      const now = new Date();
      const upcoming = response.data.examinations.filter(exam => 
        new Date(exam.examDate) > now
      ).length;
      
      const completed = response.data.examinations.filter(exam => 
        new Date(exam.examDate) <= now
      ).length;
      
      setStats({
        totalExams: response.data.examinations.length,
        upcomingExams: upcoming,
        completedExams: completed
      });
      
      filterExaminations(response.data.examinations, tabValue);
    } catch (error) {
      console.error("Error fetching examinations:", error);
      setMessage("Failed to fetch examinations");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const filterExaminations = (exams, tabIndex) => {
    const now = new Date();
    let filtered = exams;
    
    // Apply tab filter
    switch (tabIndex) {
      case 0: // Upcoming
        filtered = filtered.filter(exam => new Date(exam.examDate) > now);
        break;
      case 1: // Completed
        filtered = filtered.filter(exam => new Date(exam.examDate) <= now);
        break;
      case 2: // All
        filtered = filtered;
        break;
      default:
        filtered = filtered;
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(exam => 
        exam.subject?.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.examType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply exam type filter
    if (selectedExamType) {
      filtered = filtered.filter(exam => exam.examType === selectedExamType);
    }
    
    // Apply subject filter
    if (selectedSubject) {
      filtered = filtered.filter(exam => exam.subject?._id === selectedSubject);
    }
    
    setFilteredExaminations(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterExaminations(examinations, newValue);
    setPage(0); // Reset to first page when changing tabs
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDaysRemaining = (examDate) => {
    const now = new Date();
    const exam = new Date(examDate);
    const diffTime = exam - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    } else if (diffDays === 0) {
      return "Today";
    } else {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getUniqueSubjects = () => {
    const subjects = [];
    examinations.forEach(exam => {
      if (exam.subject && !subjects.some(s => s._id === exam.subject._id)) {
        subjects.push(exam.subject);
      }
    });
    return subjects;
  };

  const getUniqueExamTypes = () => {
    return [...new Set(examinations.map(exam => exam.examType))];
  };

  useEffect(() => {
    fetchExaminations();
  }, []);

  useEffect(() => {
    filterExaminations(examinations, tabValue);
  }, [examinations, tabValue, searchTerm, selectedExamType, selectedSubject]);

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
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h4"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            
            <Box component="span" sx={{ color: "#ffffff", ml: 1 }}>
              Examinations
            </Box>
          </Typography>
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
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
            icon={<EventIcon fontSize="medium" />}
            title="Total Exams"
            value={stats.totalExams}
            color={theme.palette.primary.main}
            loading={isLoading}
            subtitle="All examinations"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<UpcomingIcon fontSize="medium" />}
            title="Upcoming"
            value={stats.upcomingExams}
            color={theme.palette.info.main}
            loading={isLoading}
            subtitle="Future exams"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<CheckCircleIcon fontSize="medium" />}
            title="Completed"
            value={stats.completedExams}
            color={theme.palette.success.main}
            loading={isLoading}
            subtitle="Past exams"
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
                label="Search exams"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "action.active" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Exam Type"
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="">All Types</MenuItem>
                {getUniqueExamTypes().map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="">All Subjects</MenuItem>
                {getUniqueSubjects().map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.subject_name}
                  </MenuItem>
                ))}
              </TextField>
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
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="examination tabs"
          variant={isMobile ? "scrollable" : "fullWidth"}
          sx={{ 
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              padding: '6px 12px',
              fontSize: theme.typography.pxToRem(14),
              fontWeight: theme.typography.fontWeightMedium
            }
          }}
        >
          <Tab 
            icon={<UpcomingIcon fontSize="small" />}
            iconPosition="start" 
            label={
              <Badge badgeContent={stats.upcomingExams} color="info" max={99}>
                <Box sx={{ px: 1 }}>Upcoming</Box>
              </Badge>
            }
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<CheckCircleIcon fontSize="small" />}
            iconPosition="start" 
            label={
              <Badge badgeContent={stats.completedExams} color="success" max={99}>
                <Box sx={{ px: 1 }}>Completed</Box>
              </Badge>
            }
            {...a11yProps(1)} 
          />
          <Tab 
            icon={<AllInboxIcon fontSize="small" />}
            iconPosition="start" 
            label={
              <Badge badgeContent={stats.totalExams} color="primary" max={99}>
                <Box sx={{ px: 1 }}>All</Box>
              </Badge>
            }
            {...a11yProps(2)} 
          />
        </Tabs>
      </Box>

      {/* View Mode Toggle for Mobile */}
      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 2,
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

      {/* Examinations List */}
      {isLoading ? (
        <Box sx={{ p: 2 }}>
          {[...Array(3)].map((_, index) => (
            <Skeleton 
              key={index} 
              variant="rectangular" 
              height={viewMode === 'card' ? 120 : 56}
              sx={{ 
                borderRadius: 1,
                mb: 1
              }} 
            />
          ))}
        </Box>
      ) : filteredExaminations.length > 0 ? (
        <>
          {viewMode === 'card' ? (
            <Grid container spacing={2}>
              {filteredExaminations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((exam) => (
                  <Grid item xs={12} key={exam._id}>
                    <ExamCard 
                      exam={exam} 
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getDaysRemaining={getDaysRemaining}
                      theme={theme}
                    />
                  </Grid>
                ))}
            </Grid>
          ) : (
            <>
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
                      <TableCell>Subject</TableCell>
                      <TableCell>Exam Type</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExaminations
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((exam) => {
                        const examDate = new Date(exam.examDate);
                        const now = new Date();
                        const isUpcoming = examDate > now;
                        
                        return (
                          <TableRow 
                            key={exam._id} 
                            hover
                            sx={{ 
                              '&:last-child td, &:last-child th': { border: 0 },
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover
                              }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 500 }}>
                              {exam.subject?.subject_name || 'Unknown Subject'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={exam.examType}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarTodayIcon fontSize="small" color="action" />
                                {formatDate(exam.examDate)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AlarmIcon fontSize="small" color="action" />
                                {formatTime(exam.examDate)}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={isUpcoming ? 'Upcoming' : 'Completed'}
                                color={isUpcoming ? 'info' : 'success'}
                                size="small"
                                sx={{ 
                                  fontWeight: 'bold',
                                  minWidth: 90
                                }}
                              />
                              {isUpcoming && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {getDaysRemaining(exam.examDate)}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredExaminations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ mt: 2 }}
          />
        </>
      ) : (
        <EmptyState />
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

function ExamCard({ exam, formatDate, formatTime, getDaysRemaining, theme }) {
  const now = new Date();
  const examDate = new Date(exam.examDate);
  const isUpcoming = examDate > now;
  
  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: 4,
        borderLeft: `4px solid ${isUpcoming ? theme.palette.info.main : theme.palette.success.main}`
      },
      borderLeft: `4px solid ${isUpcoming ? theme.palette.info.light : theme.palette.success.light}`
    }}>
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {/* Date Section */}
          <Grid item xs={12} sm={2} sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: { sm: `1px solid ${theme.palette.divider}` },
            pr: { sm: 2 },
            mb: { xs: 1, sm: 0 }
          }}>
            <Typography variant="caption" color="text.secondary" align="center">
              {formatDate(exam.examDate).split(' ')[1]} {/* Month */}
            </Typography>
            <Typography variant="h3" color="primary" align="center" sx={{ 
              lineHeight: 1,
              fontWeight: 700,
              mb: 0.5
            }}>
              {formatDate(exam.examDate).split(' ')[0]} {/* Day */}
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              {formatTime(exam.examDate)}
            </Typography>
          </Grid>
          
          {/* Main Content */}
          <Grid item xs={12} sm={8}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1,
              flexWrap: 'wrap'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {exam.subject?.subject_name || 'Unknown Subject'}
              </Typography>
              
              <Chip 
                label={exam.examType}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 2 }}>
                <AssignmentIcon fontSize="small" sx={{ mr: 0.5 }} />
                {exam.examType}
              </Box>
              {exam.description && (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <SubjectIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {exam.description.substring(0, 50)}{exam.description.length > 50 ? '...' : ''}
                </Box>
              )}
            </Typography>
            
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap'
            }}>
              <Chip 
                label={isUpcoming ? "Upcoming" : "Completed"}
                size="small"
                color={isUpcoming ? "info" : "success"}
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
              
              {isUpcoming && (
                <Chip 
                  label={getDaysRemaining(exam.examDate)}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          </Grid>
          
          {/* Status Indicator */}
          <Grid item xs={12} sm={2} sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: { sm: `1px solid ${theme.palette.divider}` },
            pl: { sm: 2 }
          }}>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <Box sx={{ 
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isUpcoming ? theme.palette.info.main : theme.palette.success.main,
                boxShadow: `0 0 8px ${isUpcoming ? theme.palette.info.main : theme.palette.success.main}`,
                animation: `${pulse} 2s infinite`,
                mb: 1
              }} />
              <Typography variant="caption" color="text.secondary" align="center">
                {isUpcoming ? 'Upcoming' : 'Completed'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: 'background.paper'
      }}
    >
      <InfoIcon fontSize="large" color="action" sx={{ mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No examinations found
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Examinations will appear here once scheduled for your class
      </Typography>
    </Paper>
  );
}