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
  IconButton
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

export default function StudentExaminations() {
  const theme = useTheme();
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
    switch (tabIndex) {
      case 0: // Upcoming
        setFilteredExaminations(exams.filter(exam => new Date(exam.examDate) > now));
        break;
      case 1: // Completed
        setFilteredExaminations(exams.filter(exam => new Date(exam.examDate) <= now));
        break;
      case 2: // All
        setFilteredExaminations(exams);
        break;
      default:
        setFilteredExaminations(exams);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    filterExaminations(examinations, newValue);
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
      minute: '2-digit'
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

  useEffect(() => {
    fetchExaminations();
  }, []);

  useEffect(() => {
    filterExaminations(examinations, tabValue);
  }, [examinations, tabValue]);

  return (
    <Box
      sx={{
        maxWidth: 1000,
        mx: "auto",
        p: 1.5,
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

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: `${gradientFlow} 6s ease infinite`,
            backgroundSize: "200% 200%",
          }}
        >
          Examination Schedule
        </Typography>
      </Box>
      
      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 2,
        mb: 2
      }}>
        <StatCard 
          icon={<EventIcon fontSize="medium" />}
          title="Total Exams"
          value={stats.totalExams}
          color={theme.palette.primary.main}
          loading={isLoading}
        />
        
        <StatCard 
          icon={<UpcomingIcon fontSize="medium" />}
          title="Upcoming"
          value={stats.upcomingExams}
          color={theme.palette.info.main}
          loading={isLoading}
        />
        
        <StatCard 
          icon={<CheckCircleIcon fontSize="medium" />}
          title="Completed"
          value={stats.completedExams}
          color={theme.palette.success.main}
          loading={isLoading}
        />
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="examination tabs"
          variant="fullWidth"
          sx={{ minHeight: 40 }}
        >
          <Tab 
            icon={<UpcomingIcon fontSize="small" />}
            iconPosition="start" 
            label="Upcoming" 
            {...a11yProps(0)} 
            sx={{ minHeight: 40, py: 0.5 }}
          />
          <Tab 
            icon={<CheckCircleIcon fontSize="small" />}
            iconPosition="start" 
            label="Completed" 
            {...a11yProps(1)} 
            sx={{ minHeight: 40, py: 0.5 }}
          />
          <Tab 
            icon={<AllInboxIcon fontSize="small" />}
            iconPosition="start" 
            label="All" 
            {...a11yProps(2)} 
            sx={{ minHeight: 40, py: 0.5 }}
          />
        </Tabs>
      </Box>

      {/* Examinations List */}
      <Box sx={{ 
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 1.5,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SchoolIcon fontSize="medium" />
          <Typography variant="h6" component="h2">
            Examinations
          </Typography>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(3)].map((_, index) => (
                <Skeleton 
                  key={index} 
                  variant="rectangular" 
                  height={90}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1
                  }} 
                />
              ))}
            </Box>
          ) : filteredExaminations.length > 0 ? (
            <Box sx={{ p: 0 }}>
              {filteredExaminations.map((exam, index) => (
                <React.Fragment key={exam._id}>
                  <ExamCard 
                    exam={exam} 
                    formatDate={formatDate}
                    formatTime={formatTime}
                    getDaysRemaining={getDaysRemaining}
                    theme={theme}
                  />
                  {index < filteredExaminations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>
          ) : (
            <EmptyState />
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(3)].map((_, index) => (
                <Skeleton 
                  key={index} 
                  variant="rectangular" 
                  height={90}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1
                  }} 
                />
              ))}
            </Box>
          ) : filteredExaminations.length > 0 ? (
            <Box sx={{ p: 0 }}>
              {filteredExaminations.map((exam, index) => (
                <React.Fragment key={exam._id}>
                  <ExamCard 
                    exam={exam} 
                    formatDate={formatDate}
                    formatTime={formatTime}
                    getDaysRemaining={getDaysRemaining}
                    theme={theme}
                  />
                  {index < filteredExaminations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>
          ) : (
            <EmptyState />
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(3)].map((_, index) => (
                <Skeleton 
                  key={index} 
                  variant="rectangular" 
                  height={90}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1
                  }} 
                />
              ))}
            </Box>
          ) : filteredExaminations.length > 0 ? (
            <Box sx={{ p: 0 }}>
              {filteredExaminations.map((exam, index) => (
                <React.Fragment key={exam._id}>
                  <ExamCard 
                    exam={exam} 
                    formatDate={formatDate}
                    formatTime={formatTime}
                    getDaysRemaining={getDaysRemaining}
                    theme={theme}
                  />
                  {index < filteredExaminations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>
          ) : (
            <EmptyState />
          )}
        </TabPanel>
      </Box>
    </Box>
  );
}

function StatCard({ icon, title, value, color, loading }) {
  return (
    <Card sx={{ 
      borderRadius: 1,
      boxShadow: 0,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: 2
      }
    }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Avatar sx={{ 
          backgroundColor: `${color}20`, 
          color: color,
          width: 48,
          height: 48
        }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={50} height={32} /> 
          ) : (
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          )}
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
    <Box sx={{ 
      p: 2,
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        transform: 'translateY(-1px)',
        boxShadow: theme.shadows[1]
      }
    }}>
      {/* Date Section */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        textAlign: 'center'
      }}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(exam.examDate).split(' ')[1]} {/* Month */}
        </Typography>
        <Typography variant="h4" color="primary">
          {formatDate(exam.examDate).split(' ')[0]} {/* Day */}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatTime(exam.examDate)}
        </Typography>
      </Box>
      
      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.5,
          flexWrap: 'wrap'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {exam.subject?.subject_name || 'Unknown Subject'}
          </Typography>
          
          <Chip 
            label={isUpcoming ? "Upcoming" : "Completed"}
            size="small"
            color={isUpcoming ? "info" : "success"}
            variant="outlined"
          />
          
          {isUpcoming && (
            <Chip 
              label={getDaysRemaining(exam.examDate)}
              size="small"
              color="warning"
              variant="filled"
            />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}>
            <AssignmentIcon fontSize="small" sx={{ mr: 0.25 }} />
            {exam.examType}
          </Box>
        </Typography>
        
        <Typography variant="caption" sx={{
          fontStyle: 'italic',
          color: isUpcoming ? theme.palette.info.main : theme.palette.success.main
        }}>
          {isUpcoming ? 'Upcoming examination' : 'This examination has been completed'}
        </Typography>
      </Box>
      
      {/* Status Indicator */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80
      }}>
        <Box sx={{ 
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: isUpcoming ? theme.palette.info.main : theme.palette.success.main,
          boxShadow: `0 0 6px ${isUpcoming ? theme.palette.info.main : theme.palette.success.main}`,
          animation: 'pulse 2s infinite'
        }} />
      </Box>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box sx={{ 
      p: 2,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1
    }}>
      <InfoIcon fontSize="medium" color="action" />
      <Typography variant="subtitle1" color="text.secondary">
        No examinations found
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Examinations will appear here once scheduled
      </Typography>
    </Box>
  );
}