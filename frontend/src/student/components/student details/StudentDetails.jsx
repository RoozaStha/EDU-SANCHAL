import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Button,
  useTheme,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Stack,
  Badge,
  CircularProgress,
  Tooltip,
  Fab
} from "@mui/material";
import {
  Person,
  School,
  Class,
  Phone,
  Email,
  Home,
  Cake,
  Group,
  Male,
  Female,
  Transgender,
  Edit,
  Visibility,
  VisibilityOff,
  CalendarToday,
  Assessment,
  Timeline,
  Book,
  Assignment,
  Quiz,
  Event,
  InsertPhoto,
  CloudUpload,
  CheckCircle,
  Error
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { styled } from '@mui/material/styles';
import { Timeline as MuiTimeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from '@mui/lab';

// Custom styled components
const ProfileHeader = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(4),
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
    borderRadius: theme.shape.borderRadius
  }
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6]
  }
}));

const UploadButton = styled(Button)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  padding: theme.spacing(2),
  '&:hover': {
    border: `2px dashed ${theme.palette.primary.main}`,
    backgroundColor: 'rgba(25, 118, 210, 0.04)'
  }
}));

const StudentDetails = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    attendance: 0,
    assignments: 0,
    exams: 0
  });
  const [activities, setActivities] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    student_class: Yup.string().required("Class is required"),
    age: Yup.string().required("Age is required"),
    gender: Yup.string().required("Gender is required"),
    guardian: Yup.string().required("Guardian name is required"),
    guardian_phone: Yup.string()
      .required("Guardian phone is required")
      .matches(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    password: Yup.string().min(8, "Password must be at least 8 characters"),
  });

  // Formik form handling
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      student_class: "",
      age: "",
      gender: "",
      guardian: "",
      guardian_phone: "",
      password: "",
      student_image: null
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const formData = new FormData();
        
        // Append all fields except password if it's empty
        Object.keys(values).forEach((key) => {
          if (key === "password" && values[key] === "") {
            return; // Skip empty password field
          }
          formData.append(key, values[key]);
        });

        const response = await axios.patch(
          `http://localhost:5000/api/students/update`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setStudent(response.data.data);
        setSuccess("Profile updated successfully");
        setEditMode(false);
        setLoading(false);
        setImagePreview(null);
      } catch (err) {
        setError(err.response?.data?.message || "Update failed");
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchStudentData();
    fetchClasses();
    fetchStudentStats();
    fetchRecentActivities();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/students/fetch-single`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setStudent(response.data.data);
      if (response.data.data.student_class?._id) {
      localStorage.setItem('classId', response.data.data.student_class._id);
    }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch student data");
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setClassesLoading(true);
      const response = await axios.get(`http://localhost:5000/api/class/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setClasses(response.data.data);
      setClassesLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch classes");
      setClassesLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        attendance: 85, // percentage
        assignments: 12, // completed
        exams: 3 // upcoming
      });
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Mock data - replace with actual API calls
      setActivities([
        {
          id: 1,
          type: 'assignment',
          title: 'Math Homework Submitted',
          date: '2023-06-15T10:30:00',
          status: 'completed'
        },
        {
          id: 2,
          type: 'exam',
          title: 'Science Midterm Scheduled',
          date: '2023-06-18T09:00:00',
          status: 'upcoming'
        },
        {
          id: 3,
          type: 'attendance',
          title: 'Present in all classes',
          date: '2023-06-14T16:45:00',
          status: 'completed'
        },
        {
          id: 4,
          type: 'assignment',
          title: 'History Essay Graded (A)',
          date: '2023-06-12T14:15:00',
          status: 'completed'
        }
      ]);
    } catch (err) {
      console.error("Failed to fetch activities", err);
    }
  };

  const handleEdit = () => {
    if (!student) return;
    
    formik.setValues({
      name: student.name,
      email: student.email,
      student_class: student.student_class?._id || "",
      age: student.age,
      gender: student.gender,
      guardian: student.guardian,
      guardian_phone: student.guardian_phone,
      password: "",
      student_image: null
    });
    setEditMode(true);
  };

  const handleFileChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      formik.setFieldValue("student_image", file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading && !student) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 200,
        }}
      >
        <Typography variant="h6">No student data found</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Profile Header */}
      <ProfileHeader>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Fab
                  color="primary"
                  size="small"
                  onClick={handleEdit}
                  sx={{ boxShadow: theme.shadows[6] }}
                >
                  <Edit fontSize="small" />
                </Fab>
              }
            >
              <Avatar
                src={imagePreview || `/images/uploaded/student/${student.student_image}`}
                sx={{
                  width: 150,
                  height: 150,
                  fontSize: '3.5rem',
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.shadows[6]
                }}
              >
                {!student.student_image && !imagePreview &&
                  student.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
              {student.name}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
              {student.email}
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              {student.student_class && (
                <Chip
                  label={`Class ${student.student_class.class_text}`}
                  icon={<Class />}
                  color="secondary"
                  sx={{ color: 'white', fontWeight: 600 }}
                />
              )}
              <Chip
                label={`Age ${student.age}`}
                icon={<Cake />}
                color="secondary"
                sx={{ color: 'white', fontWeight: 600 }}
              />
              <Chip
                label={student.gender}
                icon={student.gender === "Male" ? <Male /> : student.gender === "Female" ? <Female /> : <Transgender />}
                color="secondary"
                sx={{ color: 'white', fontWeight: 600 }}
              />
            </Stack>
            
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              <Group sx={{ verticalAlign: 'middle', mr: 1 }} />
              Guardian: {student.guardian} ({student.guardian_phone})
            </Typography>
          </Grid>
        </Grid>
      </ProfileHeader>

      {/* Main Content */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="secondary"
          textColor="secondary"
          sx={{ mb: 3 }}
        >
          <Tab label="Overview" icon={<Person />} />
          <Tab label="Statistics" icon={<Assessment />} />
          <Tab label="Activities" icon={<Timeline />} />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1 }} /> Personal Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{student.name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{student.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Class</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {student.student_class?.class_text || 'Not assigned'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{student.age}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{student.gender}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <Group sx={{ mr: 1 }} /> Guardian Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Guardian Name</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{student.guardian}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Guardian Phone</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{student.guardian_phone}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <School sx={{ mr: 1 }} /> Class Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {student.student_class ? (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">Class Teacher</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{student.student_class.teacher?.name || 'Not assigned'}</Typography>
                      
                      <Typography variant="subtitle2" color="text.secondary">Class Schedule</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>Mon-Fri, 8:00 AM - 2:00 PM</Typography>
                      
                      <Typography variant="subtitle2" color="text.secondary">Current Subjects</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {['Math', 'Science', 'History', 'English'].map(subject => (
                          <Chip key={subject} label={subject} size="small" />
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      No class information available
                    </Typography>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <Event sx={{ mr: 1 }} /> Quick Actions
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Stack spacing={2}>
                    <Button variant="contained" startIcon={<Book />} fullWidth>
                      View Timetable
                    </Button>
                    <Button variant="outlined" startIcon={<Assignment />} fullWidth>
                      View Assignments
                    </Button>
                    <Button variant="outlined" startIcon={<Quiz />} fullWidth>
                      View Exam Results
                    </Button>
                    <Button variant="outlined" startIcon={<CalendarToday />} fullWidth onClick={handleEdit}>
                      Edit Profile
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StatCard>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                    <CircularProgress 
                      variant="determinate" 
                      value={stats.attendance} 
                      size={60} 
                      thickness={5}
                      color={stats.attendance > 75 ? 'success' : stats.attendance > 50 ? 'warning' : 'error'}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" component="div" color="text.secondary">
                        {`${Math.round(stats.attendance)}%`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="h6">Attendance</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.attendance > 75 ? 'Excellent' : stats.attendance > 50 ? 'Good' : 'Needs improvement'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">
                  Your attendance rate for this semester. Regular attendance is crucial for academic success.
                </Typography>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <StatCard>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    backgroundColor: theme.palette.secondary.light,
                    color: theme.palette.secondary.contrastText,
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <Typography variant="h5">{stats.assignments}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6">Assignments</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed this month
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">
                  You've submitted {stats.assignments} assignments. Keep up the good work!
                </Typography>
              </StatCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <StatCard>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    backgroundColor: theme.palette.warning.light,
                    color: theme.palette.warning.contrastText,
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <Typography variant="h5">{stats.exams}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6">Exams</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming this month
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">
                  You have {stats.exams} exams scheduled. Start preparing early!
                </Typography>
              </StatCard>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Timeline sx={{ mr: 1 }} /> Recent Activities
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <MuiTimeline>
                {activities.map((activity, index) => (
                  <TimelineItem key={activity.id}>
                    <TimelineSeparator>
                      <TimelineDot color={
                        activity.status === 'completed' ? 'success' : 
                        activity.status === 'upcoming' ? 'warning' : 'primary'
                      }>
                        {activity.type === 'assignment' ? <Assignment /> : 
                         activity.type === 'exam' ? <Quiz /> : <CalendarToday />}
                      </TimelineDot>
                      {index < activities.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {activity.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {new Date(activity.date).toLocaleString()}
                        </Typography>
                        <Chip
                          label={activity.status === 'completed' ? 'Completed' : 'Upcoming'}
                          size="small"
                          sx={{ 
                            mt: 1,
                            backgroundColor: activity.status === 'completed' ? 
                              theme.palette.success.light : theme.palette.warning.light,
                            color: activity.status === 'completed' ? 
                              theme.palette.success.contrastText : theme.palette.warning.contrastText
                          }}
                        />
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </MuiTimeline>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editMode}
        onClose={() => {
          setEditMode(false);
          setImagePreview(null);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'visible'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderTopLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: theme.shape.borderRadius
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1 }} />
            Edit Student Profile
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={imagePreview || `/images/uploaded/student/${student.student_image}`}
                  sx={{
                    width: 150,
                    height: 150,
                    fontSize: '3.5rem',
                    mb: 3,
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: theme.shadows[4]
                  }}
                >
                  {!student.student_image && !imagePreview &&
                    student.name?.charAt(0).toUpperCase()}
                </Avatar>
                
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="student-image-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="student-image-upload">
                  <UploadButton
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<CloudUpload />}
                  >
                    Change Photo
                  </UploadButton>
                </label>
                {formik.values.student_image && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {typeof formik.values.student_image === "object"
                      ? formik.values.student_image.name
                      : "Current image will be updated"}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Class</InputLabel>
                      <Select
                        name="student_class"
                        value={formik.values.student_class}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.student_class &&
                          Boolean(formik.errors.student_class)
                        }
                        label="Class"
                        disabled={classesLoading}
                      >
                        {classes.map((cls) => (
                          <MenuItem key={cls._id} value={cls._id}>
                            {cls.class_text}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.student_class &&
                        formik.errors.student_class && (
                          <Typography color="error" variant="caption">
                            {formik.errors.student_class}
                          </Typography>
                        )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Age"
                      name="age"
                      value={formik.values.age}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.age && Boolean(formik.errors.age)}
                      helperText={formik.touched.age && formik.errors.age}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        name="gender"
                        value={formik.values.gender}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched.gender && Boolean(formik.errors.gender)
                        }
                        label="Gender"
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Guardian Name"
                      name="guardian"
                      value={formik.values.guardian}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.guardian && Boolean(formik.errors.guardian)
                      }
                      helperText={formik.touched.guardian && formik.errors.guardian}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Home />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Guardian Phone"
                      name="guardian_phone"
                      value={formik.values.guardian_phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.guardian_phone &&
                        Boolean(formik.errors.guardian_phone)
                      }
                      helperText={
                        formik.touched.guardian_phone && formik.errors.guardian_phone
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Password (leave blank to keep current)"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.password && Boolean(formik.errors.password)
                      }
                      helperText={formik.touched.password && formik.errors.password}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={() => {
              setEditMode(false);
              setImagePreview(null);
            }}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: 2 }}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      <MessageSnackbar
        message={error || success}
        type={error ? "error" : "success"}
        handleClose={() => {
          if (error) setError("");
          if (success) setSuccess("");
        }}
      />
    </>
  );
};

export default StudentDetails;