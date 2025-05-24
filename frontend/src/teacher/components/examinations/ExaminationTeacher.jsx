import { keyframes, useTheme } from "@mui/material/styles";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Tooltip,
  Avatar,
  Skeleton,
  InputAdornment,
  
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";

// Icons
import EventIcon from "@mui/icons-material/Event";
import SubjectIcon from "@mui/icons-material/Subject";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ClassIcon from "@mui/icons-material/Class";
import CheckIcon from "@mui/icons-material/Class";

import SchoolIcon from "@mui/icons-material/School";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoIcon from "@mui/icons-material/Info";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export default function ExaminationsView() {
  const theme = useTheme();
  const [examinations, setExaminations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    upcomingExams: 0,
    completedExams: 0
  });

  const fetchAllClasses = async () => {
    try {
      const response = await axios.get(`${baseApi}/class/all`);
      setClasses(response.data.data);
      
      if (response.data.data.length > 0 && !selectedClass) {
        setSelectedClass(response.data.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchExaminationsByClass = async (classId) => {
    if (!classId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${baseApi}/examination/class/${classId}`);
      setExaminations(response.data.examinations);
      
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
    } catch (error) {
      console.error("Error fetching examinations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (event) => {
    const classId = event.target.value;
    setSelectedClass(classId);
    fetchExaminationsByClass(classId);
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

  const getExamStatus = (examDate) => {
    const now = new Date();
    const exam = new Date(examDate);
    
    if (exam > now) {
      return {
        status: "Upcoming",
        color: "info"
      };
    } else {
      return {
        status: "Completed",
        color: "success"
      };
    }
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
    fetchAllClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchExaminationsByClass(selectedClass);
    }
  }, [selectedClass]);

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        p: 3,
        animation: `${fadeIn} 0.5s ease-out`,
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
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
          }}
        >
          Examination Schedule
        </Typography>
        
        <Tooltip title="Filter by class">
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              id="class-select"
              value={selectedClass}
              onChange={handleClassChange}
              label="Class"
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon />
                </InputAdornment>
              }
              sx={{
                borderRadius: 2,
              }}
            >
              {classes.map((classItem) => (
                <MenuItem key={classItem._id} value={classItem._id}>
                  {classItem.class_text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
      </Box>
      
      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 3,
        mb: 4
      }}>
        <StatCard 
          icon={<CalendarMonthIcon fontSize="large" />}
          title="Total Exams"
          value={stats.totalExams}
          color={theme.palette.primary.main}
          loading={loading}
        />
        
        <StatCard 
          icon={<EventIcon fontSize="large" />}
          title="Upcoming"
          value={stats.upcomingExams}
          color={theme.palette.info.main}
          loading={loading}
        />
        
        <StatCard 
          icon={<CheckIcon fontSize="large" />}
          title="Completed"
          value={stats.completedExams}
          color={theme.palette.success.main}
          loading={loading}
        />
      </Box>
      
      {/* Examinations List */}
      <Box sx={{ 
        backgroundColor: theme.palette.background.paper,
        borderRadius: 3,
        boxShadow: theme.shadows[1],
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 3,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <SchoolIcon fontSize="large" />
          <Typography variant="h5" component="h2">
            {classes.find(c => c._id === selectedClass)?.class_text || 'Class'} Examinations
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(3)].map((_, index) => (
              <Skeleton 
                key={index} 
                variant="rectangular" 
                height={120} 
                sx={{ 
                  borderRadius: 2,
                  mb: 2
                }} 
              />
            ))}
          </Box>
        ) : examinations.length > 0 ? (
          <Box sx={{ p: 0 }}>
            {examinations.map((exam, index) => (
              <React.Fragment key={exam._id}>
                <ExamCard 
                  exam={exam} 
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getExamStatus={getExamStatus}
                  getDaysRemaining={getDaysRemaining}
                  theme={theme}
                />
                {index < examinations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <InfoIcon fontSize="large" color="action" />
            <Typography variant="h6" color="text.secondary">
              No examinations scheduled for this class
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Examinations will appear here once scheduled
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function StatCard({ icon, title, value, color, loading }) {
  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: 0,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: 3
      }
    }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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
            <Typography variant="h3" component="div">
              {value}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function ExamCard({ exam, formatDate, formatTime, getExamStatus, getDaysRemaining, theme }) {
  const status = getExamStatus(exam.examDate);
  const now = new Date();
  const examDate = new Date(exam.examDate);
  const isUpcoming = examDate > now;
  
  return (
    <Box sx={{ 
      p: 3,
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: theme.palette.action.hover
      }
    }}>
      {/* Date Section */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
        textAlign: 'center'
      }}>
        <Typography variant="subtitle2" color="text.secondary">
          {formatDate(exam.examDate).split(' ')[1]} {/* Month */}
        </Typography>
        <Typography variant="h3" color="primary">
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
          gap: 2,
          mb: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {exam.subject?.subject_name || 'Unknown Subject'}
          </Typography>
          
          <Chip 
            label={status.status}
            size="small"
            color={status.color}
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
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 2 }}>
            <AssignmentIcon fontSize="small" sx={{ mr: 0.5 }} />
            {exam.examType}
          </Box>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <ClassIcon fontSize="small" sx={{ mr: 0.5 }} />
            {exam.class?.class_text || 'Unknown Class'}
          </Box>
        </Typography>
        
        <Typography variant="body2" sx={{ 
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
        minWidth: 100
      }}>
        <Box sx={{ 
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: isUpcoming ? theme.palette.info.main : theme.palette.success.main,
          boxShadow: `0 0 8px ${isUpcoming ? theme.palette.info.main : theme.palette.success.main}`,
          animation: 'pulse 2s infinite'
        }} />
      </Box>
    </Box>
  );
}