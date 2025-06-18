import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  keyframes,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  Divider,
  Badge,
  Paper,
  Skeleton
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import EventIcon from "@mui/icons-material/Event";
import SubjectIcon from "@mui/icons-material/Subject";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddIcon from "@mui/icons-material/Add";
import ClassIcon from "@mui/icons-material/Class";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

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

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

// Validation schema
const examinationSchema = Yup.object().shape({
  date: Yup.date().required("Exam date is required"),
  subject: Yup.string().required("Subject is required"),
  examType: Yup.string()
    .required("Exam type is required")
    .oneOf([
      '1st Term Exam', 
      '2nd Term Exam', 
      '3rd Term Exam', 
      'Final Term Exam'
    ], "Invalid exam type"),
  classId: Yup.string().required("Class is required"),
}).test(
  'unique-date-per-exam-type',
  'Another subject already has an exam scheduled for this date in the same exam type and class',
  function(value) {
    const { date, subject, examType, classId } = value;
    if (!date || !subject || !examType || !classId) return true;
    
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const context = this.options.context;
    
    // Safety check for examinations array
    if (!context.examinations || !Array.isArray(context.examinations)) return true;
    
    return !context.examinations.some(exam => {
      if (!exam || !exam.examDate || !exam.subject) return false;
      
      // Skip current exam when editing
      if (context.editingId && exam._id === context.editingId) return false;
      
      const examDate = new Date(exam.examDate).toISOString().split('T')[0];
      return (
        examDate === formattedDate &&
        exam.examType === examType &&
        exam.class?._id === classId
      );
    });
  }
);

// Exam type options
const examTypeOptions = [
  '1st Term Exam',
  '2nd Term Exam',
  '3rd Term Exam',
  'Final Term Exam'
];

export default function Examinations() {
  const theme = useTheme();
  const [examinations, setExaminations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  
  // Calculate statistics
  const stats = {
    total: examinations.length,
    upcoming: examinations.filter(exam => new Date(exam.examDate) > new Date()).length,
    completed: examinations.filter(exam => new Date(exam.examDate) <= new Date()).length
  };

  const handleMessageClose = () => {
    setMessage("");
  };

  const checkDuplicateDate = (values, examinations, editingId) => {
    if (!values.date || !examinations || !Array.isArray(examinations)) return false;
    
    const formattedDate = new Date(values.date).toISOString().split('T')[0];
    
    return examinations.some(exam => {
      if (!exam || !exam.examDate || !exam.subject) return false;
      
      // Skip current exam when editing
      if (editingId && exam._id === editingId) return false;
      
      const examDate = new Date(exam.examDate).toISOString().split('T')[0];
      return (
        examDate === formattedDate &&
        exam.examType === values.examType &&
        exam.class?._id === values.classId
      );
    });
  };

  const formik = useFormik({
    initialValues: {
      date: null,
      subject: "",
      examType: "",
      classId: "",
    },
    validationSchema: examinationSchema,
    context: {
      examinations,
      editingId
    },
    onSubmit: async (values, { resetForm }) => {
      if (checkDuplicateDate(values, examinations, editingId)) {
        setMessage("Another subject already has an exam scheduled for this date in the same exam type and class");
        setMessageType("error");
        return;
      }

      try {
        const formattedDate = values.date ? new Date(values.date).toISOString() : null;

        let response;
        if (editMode) {
          response = await axios.patch(
            `${baseApi}/examination/update/${editingId}`,
            {
              date: formattedDate,
              subject: values.subject,
              examType: values.examType,
            }
          );
          setMessage("Examination updated successfully");
        } else {
          const apiData = {
            date: formattedDate,
            subject: values.subject,
            examType: values.examType,
            classId: values.classId,
          };
          response = await axios.post(`${baseApi}/examination/create`, apiData);
          setMessage("Examination created successfully");
        }

        setMessageType("success");
        resetForm();
        fetchExaminationsByClass(selectedClass);
        setEditMode(false);
        setEditingId(null);
      } catch (error) {
        console.error("Error:", error);
        setMessage(error.response?.data?.message || "An error occurred");
        setMessageType("error");
      }
    },
  });

  const fetchAllClasses = async () => {
    try {
      const response = await axios.get(`${baseApi}/class/all`);
      setClasses(response.data.data || []);
      
      if (response.data.data?.length > 0 && !selectedClass) {
        setSelectedClass(response.data.data[0]._id);
        formik.setFieldValue("classId", response.data.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setMessage("Failed to fetch classes");
      setMessageType("error");
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const response = await axios.get(`${baseApi}/subjects`);
      setSubjects(response.data.data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setMessage("Failed to fetch subjects");
      setMessageType("error");
    }
  };

  const fetchExaminationsByClass = async (classId) => {
    if (!classId) return;
    
    try {
      const response = await axios.get(`${baseApi}/examination/class/${classId}`);
      setExaminations(response.data.examinations || []);
    } catch (error) {
      console.error("Error fetching examinations:", error);
      setMessage("Failed to fetch examinations");
      setMessageType("error");
    }
  };

  const handleClassChange = (event) => {
    const classId = event.target.value;
    setSelectedClass(classId);
    formik.setFieldValue("classId", classId);
    fetchExaminationsByClass(classId);
  };

  const handleEdit = (exam) => {
    setEditMode(true);
    setEditingId(exam._id);
    formik.setValues({
      date: exam.examDate ? new Date(exam.examDate) : null,
      subject: exam.subject?._id || "",
      examType: exam.examType || "",
      classId: exam.class?._id || selectedClass,
    });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    formik.resetForm();
    formik.setFieldValue("classId", selectedClass);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${baseApi}/examination/delete/${deleteId}`);
      setMessage("Examination deleted successfully");
      setMessageType("success");
      fetchExaminationsByClass(selectedClass);
      setOpenDialog(false);
    } catch (error) {
      console.error("Error deleting examination:", error);
      setMessage("Failed to delete examination");
      setMessageType("error");
      setOpenDialog(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDeleteId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
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

  const filterExaminations = () => {
    let filtered = [...examinations];
    
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
    
    return filtered;
  };

  useEffect(() => {
    fetchAllClasses();
    fetchAllSubjects();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchExaminationsByClass(selectedClass);
    }
  }, [selectedClass]);

  const filteredExams = filterExaminations();

  return (
    <Box
      sx={{
        width: '100%',
        animation: `${fadeIn} 0.5s ease-out`,
        maxWidth: 1200,
        mx: 'auto',
        p: { xs: 1, sm: 1 }
      }}
    >
      {message && (
        <MessageSnackbar
          message={message}
          messageType={messageType}
          handleClose={handleMessageClose}
        />
      )}

      {/* Header Section */}
      <Box 
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
          color: 'white',
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: `${gradientFlow} 6s ease infinite`,
          backgroundSize: '200% 200%',
        }}
      >
        <Box>
          <Typography 
            variant="h3" 
            component="h1"
            sx={{ 
              fontWeight: 700,
              mb: 1,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              letterSpacing: 0.5
            }}
          >
            {editMode ? "Edit Examination" : "Examination Management"}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Schedule, view and manage all examinations
          </Typography>
        </Box>
        
        <Box 
          sx={{ 
            mt: { xs: 2, md: 0 },
            animation: `${floatAnimation} 3s ease-in-out infinite`,
            display: { xs: 'none', sm: 'block' }
          }}
        >
          <AssignmentIcon sx={{ fontSize: 80, opacity: 0.8 }} />
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<EventIcon />}
            title="Total Exams"
            value={stats.total}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<UpcomingIcon />}
            title="Upcoming"
            value={stats.upcoming}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard 
            icon={<CheckCircleIcon />}
            title="Completed"
            value={stats.completed}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ mb: 2 }}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
        
        {showFilters && (
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
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
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Form */}
        <Grid item xs={12} md={5}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: 3,
              background: 'linear-gradient(to bottom, #f5f7fa, #e4edf9)'
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                fontWeight: 600,
                color: theme.palette.primary.dark,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <AssignmentIcon />
              {editMode ? "Edit Examination" : "Create New Examination"}
            </Typography>
            
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="class-select-label">Class</InputLabel>
                  <Select
                    labelId="class-select-label"
                    id="class-select"
                    value={selectedClass}
                    onChange={handleClassChange}
                    label="Class"
                    startAdornment={
                      <InputAdornment position="start">
                        <ClassIcon />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: theme.shadows[2],
                      },
                    }}
                  >
                    {classes.map((classItem) => (
                      <MenuItem key={classItem._id} value={classItem._id}>
                        {classItem.class_text}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Exam Date"
                    value={formik.values.date}
                    onChange={(newValue) => {
                      formik.setFieldValue("date", newValue);
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        error: formik.touched.date && Boolean(formik.errors.date),
                        helperText: formik.touched.date && formik.errors.date,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EventIcon />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              boxShadow: theme.shadows[2],
                            },
                          },
                        },
                      }
                    }}
                  />
                </LocalizationProvider>

                <FormControl fullWidth variant="outlined">
                  <InputLabel id="subject-select-label">Subject</InputLabel>
                  <Select
                    labelId="subject-select-label"
                    id="subject-select"
                    name="subject"
                    value={formik.values.subject}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.subject && Boolean(formik.errors.subject)}
                    label="Subject"
                    startAdornment={
                      <InputAdornment position="start">
                        <SubjectIcon />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: theme.shadows[2],
                      },
                    }}
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.subject_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.subject && formik.errors.subject && (
                    <FormHelperText error>{formik.errors.subject}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth variant="outlined">
                  <InputLabel id="exam-type-label">Exam Type</InputLabel>
                  <Select
                    labelId="exam-type-label"
                    id="exam-type"
                    name="examType"
                    value={formik.values.examType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.examType && Boolean(formik.errors.examType)}
                    label="Exam Type"
                    startAdornment={
                      <InputAdornment position="start">
                        <AssignmentIcon />
                      </InputAdornment>
                    }
                    sx={{
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: theme.shadows[2],
                      },
                    }}
                  >
                    {examTypeOptions.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.examType && formik.errors.examType && (
                    <FormHelperText error>{formik.errors.examType}</FormHelperText>
                  )}
                </FormControl>

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    size="large"
                    startIcon={<CheckIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: "bold",
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    {editMode ? "Update" : "Create"}
                  </Button>

                  {editMode && (
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={cancelEdit}
                      startIcon={<CloseIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: "bold",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: theme.shadows[1],
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Examinations List */}
        <Grid item xs={12} md={7}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: 3,
              minHeight: 500
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  color: theme.palette.primary.dark,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <EventIcon />
                Scheduled Examinations
              </Typography>
              
              <Badge 
                badgeContent={filteredExams.length} 
                color="primary"
                sx={{ 
                  '& .MuiBadge-badge': {
                    fontSize: '1rem',
                    height: 28,
                    minWidth: 28,
                    borderRadius: 14
                  }
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Total
                </Typography>
              </Badge>
            </Box>

            <Divider sx={{ mb: 3 }} />
            
            {filteredExams.length > 0 ? (
              <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
                <Stack spacing={2}>
                  {filteredExams.map((exam, index) => (
                    <Grow in={true} key={exam._id} timeout={index * 150}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          animation: `${fadeIn} 0.5s ease-out`,
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: theme.shadows[4],
                          },
                          borderColor: theme.palette.divider,
                        }}
                        onMouseEnter={() => setHoveredCard(exam._id)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <CardContent
                          sx={{
                            position: "relative",
                            "&:before": {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: "4px",
                              background: theme.palette.primary.main,
                              borderRadius: "0 4px 4px 0",
                            },
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                              <Box sx={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 1,
                                backgroundColor: theme.palette.action.hover,
                                borderRadius: 1
                              }}>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(exam.examDate).split(' ')[1]}
                                </Typography>
                                <Typography variant="h4" color="primary" sx={{ lineHeight: 1, fontWeight: 700 }}>
                                  {formatDate(exam.examDate).split(' ')[0]}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(exam.examDate)}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                }}
                              >
                                {exam.subject?.subject_name || 'Unknown Subject'}
                              </Typography>
                              
                              <Chip 
                                label={exam.examType}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mt: 1 }}
                              />
                              
                              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                {getDaysRemaining(exam.examDate)}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} sm={3} sx={{ textAlign: 'center' }}>
                              <Chip
                                label={new Date(exam.examDate) > new Date() ? 'Upcoming' : 'Completed'}
                                color={new Date(exam.examDate) > new Date() ? 'info' : 'success'}
                                size="small"
                                sx={{ 
                                  fontWeight: 'bold',
                                  minWidth: 90
                                }}
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                        <CardActions
                          sx={{
                            justifyContent: "flex-end",
                            background: theme.palette.action.hover,
                            borderTop: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <IconButton
                            onClick={() => handleEdit(exam)}
                            color="primary"
                            sx={{
                              transition: "all 0.3s ease",
                              "&:hover": {
                                background: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                transform: "scale(1.1)",
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => confirmDelete(exam._id)}
                            color="error"
                            sx={{
                              transition: "all 0.3s ease",
                              "&:hover": {
                                background: theme.palette.error.main,
                                color: theme.palette.error.contrastText,
                                transform: "scale(1.1)",
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grow>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No examinations found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedClass 
                    ? "No examinations scheduled for this class" 
                    : "Please select a class to view examinations"}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const firstInput = document.querySelector('input, select');
                    if (firstInput) firstInput.focus();
                  }}
                >
                  Create New Examination
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[5],
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this examination? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            sx={{ borderRadius: 1 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: 4
      },
      height: '100%',
      background: `linear-gradient(135deg, ${color}20, #ffffff)`
    }}>
      <CardContent sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        p: 3
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
          <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}