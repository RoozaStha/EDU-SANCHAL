import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Avatar,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Chip,
  useTheme,
  InputAdornment,
  Fade,
  Grow,
  Slide,
  Zoom,
  Paper,
  alpha,
  CircularProgress,
  styled,
  DialogContentText
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Search,
  Visibility,
  VisibilityOff,
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
  Style,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { keyframes } from "@emotion/react";

// Animation keyframes
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components
const HeaderBar = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
  color: theme.palette.common.white,
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[6],
  marginBottom: theme.spacing(4),
  position: "relative",
  overflow: "hidden",
  "&:before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "6px",
    background: "linear-gradient(90deg, #ffeb3b, #4caf50, #2196f3)",
  },
  "&:after": {
    content: '""',
    position: "absolute",
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    background: "rgba(255,255,255,0.1)",
    borderRadius: "50%",
    zIndex: 0
  }
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  transition: "all 0.3s",
  fontWeight: "bold",
  "&:hover": {
    animation: `${pulseAnimation} 0.5s`,
    transform: "translateY(-3px)",
    boxShadow: theme.shadows[6]
  },
}));

const Student = () => {
  const theme = useTheme();
  const { user, authenticated } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);

  // Fetch students and classes data
  useEffect(() => {
    if (authenticated && (user.role === "SCHOOL" || user.role === "ADMIN")) {
      fetchStudents();
      fetchClasses();
    } else if (authenticated && user.role === "STUDENT") {
      fetchStudentData();
    }
  }, [authenticated, user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/students/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setStudents(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch students");
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

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/students/fetch-single`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCurrentStudent(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch student data");
      setLoading(false);
    }
  };

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    student_class: Yup.string().required("Class is required"),
    age: Yup.string().required("Age is required"),
    gender: Yup.string().required("Gender is required"),
    guardian: Yup.string().required("Guardian name is required"),
    guardian_phone: Yup.string().required("Guardian phone is required"),
    password: editMode
      ? Yup.string()
      : Yup.string()
          .required("Password is required")
          .min(8, "Password must be at least 8 characters"),
    student_image: editMode
      ? Yup.mixed()
      : Yup.mixed().required("Student image is required"),
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
      student_image: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);

        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (key === "student_image" && values[key]) {
            formData.append(key, values[key]);
          } else if (values[key] !== "" && key !== "student_image") {
            formData.append(key, values[key]);
          }
        });
        
        if (editMode && user.role === "SCHOOL") {
          formData.append("studentId", currentStudent._id);
        }

        if (editMode) {
          // Update student
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
          setSuccess("Student updated successfully");
          if (user.role === "STUDENT") {
            setCurrentStudent(response.data.data);
          } else {
            fetchStudents();
          }
        } else {
          // Create new student
          await axios.post(`http://localhost:5000/api/students/register`, formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          });
          setSuccess("Student registered successfully");
          fetchStudents();
        }

        setOpenDialog(false);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Operation failed");
        setLoading(false);
      }
    },
  });

  // Handle edit student
  const handleEdit = (student) => {
    setEditMode(true);
    setCurrentStudent(student);
    formik.setValues({
      name: student.name,
      email: student.email,
      student_class: student.student_class?._id || "",
      age: student.age,
      gender: student.gender,
      guardian: student.guardian,
      guardian_phone: student.guardian_phone,
      password: "",
      student_image: null,
    });
    setOpenDialog(true);
  };

  // Handle delete student
  const handleDelete = (id) => {
    setStudentToDelete(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/students/delete/${studentToDelete}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSuccess("Student deleted successfully");
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete student");
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
    }
  };

  // Filter students based on search and class
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass =
      selectedClass === "" || 
      (student.student_class && student.student_class._id === selectedClass);
    
    return matchesSearch && matchesClass;
  });

  // Reset form when dialog closes
  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentStudent(null);
    formik.resetForm();
  };

  // Handle file upload
  const handleFileChange = (event) => {
    formik.setFieldValue("student_image", event.currentTarget.files[0]);
  };

  // Render student profile
  const renderStudentProfile = () => {
    if (!currentStudent) return null;

    return (
      <Slide in={true} direction="up" timeout={500}>
        <Card 
          sx={{ 
            mb: 4, 
            borderRadius: 4,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #f0f4ff, #ffffff)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 15px 35px rgba(0,0,0,0.15)'
            }
          }}
        >
          <Box sx={{ 
            background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)", 
            height: 150,
            position: "relative",
            '&:before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }
          }}>
            <Box sx={{
              position: "absolute",
              bottom: -75,
              left: "50%",
              transform: "translateX(-50%)",
            }}>
              <Avatar
                src={`/images/uploaded/student/${currentStudent.student_image}`}
                sx={{ 
                  width: 150, 
                  height: 150, 
                  border: "5px solid white",
                  boxShadow: 6,
                  animation: `${floatAnimation} 4s ease-in-out infinite`
                }}
              >
                {!currentStudent.student_image && 
                  <Person sx={{ fontSize: 70 }} />}
              </Avatar>
            </Box>
          </Box>
          <CardContent sx={{ mt: 9, textAlign: "center" }}>
            <Typography variant="h4" component="div" fontWeight="bold">
              {currentStudent.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mb={2}>
              {currentStudent.email}
            </Typography>
            {currentStudent.student_class && (
              <Chip
                label={currentStudent.student_class.class_text}
                icon={<Class />}
                sx={{ 
                  mb: 2,
                  background: "linear-gradient(45deg, #4caf50, #8bc34a)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: '1rem',
                  px: 2,
                  py: 1
                }}
              />
            )}
            
            <Divider sx={{ my: 3, borderColor: 'rgba(0,0,0,0.08)' }} />
            
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  mb: 2,
                  p: 2,
                  borderRadius: 3,
                  background: alpha(theme.palette.primary.light, 0.1),
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}>
                  <Cake sx={{ mr: 2, color: theme.palette.primary.main, fontSize: 30 }} />
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Age
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {currentStudent.age}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  mb: 2,
                  p: 2,
                  borderRadius: 3,
                  background: alpha(theme.palette.secondary.light, 0.1),
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}>
                  {currentStudent.gender === "Male" ? (
                    <Male sx={{ mr: 2, color: theme.palette.info.main, fontSize: 30 }} />
                  ) : currentStudent.gender === "Female" ? (
                    <Female sx={{ mr: 2, color: theme.palette.error.main, fontSize: 30 }} />
                  ) : (
                    <Transgender sx={{ mr: 2, color: theme.palette.warning.main, fontSize: 30 }} />
                  )}
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Gender
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {currentStudent.gender}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  mb: 2,
                  p: 2,
                  borderRadius: 3,
                  background: alpha(theme.palette.info.light, 0.1),
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}>
                  <Group sx={{ mr: 2, color: theme.palette.info.main, fontSize: 30 }} />
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Guardian
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {currentStudent.guardian}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  mb: 2,
                  p: 2,
                  borderRadius: 3,
                  background: alpha(theme.palette.success.light, 0.1),
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}>
                  <Phone sx={{ mr: 2, color: theme.palette.success.main, fontSize: 30 }} />
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Guardian Phone
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {currentStudent.guardian_phone}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <AnimatedButton
                variant="contained"
                startIcon={<Edit />}
                onClick={() => handleEdit(currentStudent)}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 50,
                  fontWeight: 'bold',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                    animation: `${pulseAnimation} 1.5s infinite`
                  }
                }}
              >
                Edit Profile
              </AnimatedButton>
            </Box>
          </CardContent>
        </Card>
      </Slide>
    );
  };

  // Render student form dialog
  const renderStudentForm = () => (
    <Dialog
      open={openDialog}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Slide}
      transitionDuration={500}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #f8fbff, #ffffff)',
          boxShadow: '0 15px 50px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, 
          color: 'white',
          fontWeight: 'bold',
          py: 2,
          textAlign: 'center'
        }}
      >
        {editMode ? "Edit Student" : "Add New Student"}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
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
                      <Person sx={{ color: theme.palette.primary.main }} />
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={editMode}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: theme.palette.primary.main }} />
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
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  {classesLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : (
                    classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.class_text}
                      </MenuItem>
                    ))
                  )}
                </Select>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
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
                  error={formik.touched.gender && Boolean(formik.errors.gender)}
                  label="Gender"
                  sx={{
                    borderRadius: 2,
                  }}
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
                      <Home sx={{ color: theme.palette.primary.main }} />
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
                      <Phone sx={{ color: theme.palette.primary.main }} />
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={
                  editMode
                    ? "New Password (leave blank to keep current)"
                    : "Password"
                }
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="student-image-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="student-image-upload">
                <Button 
                  variant="outlined" 
                  component="span" 
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    borderWidth: 2,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.1),
                      borderWidth: 2
                    }
                  }}
                >
                  {editMode ? "Change Student Image" : "Upload Student Image"}
                </Button>
              </label>
              {formik.values.student_image && (
                <Typography variant="caption" display="block" sx={{ mt: 1, ml: 1 }}>
                  {formik.values.student_image.name}
                </Typography>
              )}
              {formik.touched.student_image && formik.errors.student_image && (
                <Typography color="error" variant="caption" display="block" sx={{ ml: 1 }}>
                  {formik.errors.student_image}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <Button 
          onClick={handleDialogClose}
          sx={{
            px: 4,
            py: 1,
            borderRadius: 2,
            fontWeight: 'bold',
            color: theme.palette.text.secondary,
            '&:hover': {
              background: alpha(theme.palette.text.secondary, 0.05)
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={formik.handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            px: 4,
            py: 1,
            borderRadius: 2,
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
              animation: `${pulseAnimation} 1.5s infinite`
            }
          }}
        >
          {editMode ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render students list
  const renderStudentsList = () => (
    <Box>
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        mb: 3,
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ 
          display: "flex", 
          gap: 2,
          flexGrow: 1,
          maxWidth: 600
        }}>
          <TextField
            variant="outlined"
            placeholder="Search students..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 50,
                background: alpha(theme.palette.primary.light, 0.1),
                '&:hover': {
                  background: alpha(theme.palette.primary.light, 0.15)
                }
              }
            }}
            sx={{
              flexGrow: 1
            }}
          />
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Class"
              sx={{
                borderRadius: 50,
                '& .MuiSelect-select': {
                  py: 1
                }
              }}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.class_text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {user.role !== "STUDENT" && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{
              borderRadius: 50,
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                animation: `${pulseAnimation} 1.5s infinite`
              }
            }}
          >
            Add Student
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredStudents.length > 0 ? (
        <Grid container spacing={3}>
          {filteredStudents.map((student, index) => (
            <Grid item xs={12} sm={6} md={4} key={student._id}>
              <Grow in timeout={500 + (index * 100)}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 15px 30px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Box sx={{ position: "relative", pt: "100%", overflow: 'hidden' }}>
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      opacity: 0.9,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.3s ease',
                      '&:hover': {
                        opacity: 0
                      }
                    }}>
                      <Typography 
                        variant="h5" 
                        color="white"
                        fontWeight="bold"
                        textAlign="center"
                        sx={{
                          textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                        }}
                      >
                        {student.name}
                      </Typography>
                    </Box>
                    <Avatar
                      src={`/images/uploaded/student/${student.student_image}`}
                      alt={student.name}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        borderRadius: 0,
                        objectFit: "cover",
                      }}
                    >
                      {!student.student_image && 
                        <Person sx={{ fontSize: 60 }} />}
                    </Avatar>
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" fontWeight="bold">
                      {student.name}
                    </Typography>
                    
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      mb: 1.5,
                      background: alpha(theme.palette.primary.light, 0.1),
                      borderRadius: 1,
                      p: 1
                    }}>
                      <Email fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                      <Typography variant="body2">
                        {student.email}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      mb: 1.5,
                      background: alpha(theme.palette.info.light, 0.1),
                      borderRadius: 1,
                      p: 1
                    }}>
                      <Class fontSize="small" sx={{ mr: 1, color: theme.palette.info.dark }} />
                      <Typography variant="body2" fontWeight="500">
                        Class: {student.student_class?.class_text || "Not assigned"}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      mb: 1.5,
                      background: alpha(theme.palette.success.light, 0.1),
                      borderRadius: 1,
                      p: 1
                    }}>
                      <Cake fontSize="small" sx={{ mr: 1, color: theme.palette.success.dark }} />
                      <Typography variant="body2">
                        Age: {student.age}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      mb: 1.5,
                      background: alpha(theme.palette.warning.light, 0.1),
                      borderRadius: 1,
                      p: 1
                    }}>
                      <Group fontSize="small" sx={{ mr: 1, color: theme.palette.warning.dark }} />
                      <Typography variant="body2">
                        Guardian: {student.guardian}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      background: alpha(theme.palette.error.light, 0.1),
                      borderRadius: 1,
                      p: 1
                    }}>
                      <Phone fontSize="small" sx={{ mr: 1, color: theme.palette.error.dark }} />
                      <Typography variant="body2">
                        {student.guardian_phone}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Box
                    sx={{
                      p: 2,
                      mt: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: '1px solid rgba(0,0,0,0.08)'
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(student)}
                      variant="outlined"
                      sx={{
                        borderRadius: 50,
                        px: 2,
                        fontWeight: 'bold',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2
                        }
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(student._id)}
                      variant="outlined"
                      color="error"
                      sx={{
                        borderRadius: 50,
                        px: 2,
                        fontWeight: 'bold',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Fade in timeout={800}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
              border: "2px dashed",
              borderColor: theme.palette.divider,
              borderRadius: 4,
              background: alpha(theme.palette.primary.light, 0.03),
              textAlign: 'center',
              p: 4
            }}
          >
            <Group sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No Students Found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try adjusting your search or add a new student
            </Typography>
          </Box>
        </Fade>
      )}
    </Box>
  );

  // Render delete dialog
  const renderDeleteDialog = () => (
    <Dialog 
      open={openDeleteDialog} 
      onClose={() => setOpenDeleteDialog(false)}
      TransitionComponent={Zoom}
    >
      <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Confirm Delete</DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <Delete sx={{ fontSize: 60, color: theme.palette.error.main, mb: 2 }} />
          <DialogContentText>
            Are you sure you want to delete this student? This action cannot be undone.
          </DialogContentText>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
        <Button 
          onClick={() => setOpenDeleteDialog(false)} 
          variant="outlined"
          sx={{
            px: 4,
            borderRadius: 50,
            fontWeight: 'bold'
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={confirmDelete}
          color="error"
          variant="contained"
          disabled={loading}
          sx={{
            px: 4,
            borderRadius: 50,
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
            }
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Main render
  return (
    <Fade in timeout={500}>
      <Container maxWidth="lg" sx={{ py: 1 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            color: 'white',
            borderRadius: 3,
            p: 3,
            mb: 4,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ 
              fontWeight: 800,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              position: 'relative',
              zIndex: 2
            }}
          >
            {user.role === "STUDENT" ? "My Profile" : "Student Management"}
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              opacity: 0.9,
              position: 'relative',
              zIndex: 2
            }}
          >
            {user.role === "STUDENT" 
              ? "View and manage your academic profile" 
              : "Manage all student information and records"}
          </Typography>
        </Paper>

        {loading && (
          <LinearProgress 
            sx={{ 
              height: 6, 
              borderRadius: 3, 
              background: alpha(theme.palette.primary.light, 0.2),
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderRadius: 3
              }
            }} 
          />
        )}

        {user.role === "STUDENT" ? (
          renderStudentProfile()
        ) : (
          <>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ 
                mb: 4,
                '& .MuiTabs-indicator': {
                  height: 4,
                  borderRadius: 2,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }
              }}
              textColor="primary"
            >
              <Tab 
                label="Students List" 
                icon={<Group />} 
                iconPosition="start"
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  py: 1.5,
                  minHeight: 'auto',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main
                  }
                }} 
              />
              <Tab 
                label="Add Student" 
                icon={<Add />} 
                iconPosition="start"
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  py: 1.5,
                  minHeight: 'auto',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main
                  }
                }} 
              />
            </Tabs>

            {activeTab === 0 ? (
              renderStudentsList()
            ) : (
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenDialog(true)}
                  sx={{
                    px: 5,
                    py: 1.5,
                    borderRadius: 50,
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                      animation: `${pulseAnimation} 1.5s infinite`
                    }
                  }}
                >
                  Add New Student
                </Button>
              </Box>
            )}
          </>
        )}

        {renderStudentForm()}
        {renderDeleteDialog()}

        <MessageSnackbar
          message={error || success}
          type={error ? "error" : "success"}
          handleClose={() => {
            if (error) setError("");
            if (success) setSuccess("");
          }}
        />
      </Container>
    </Fade>
  );
};

export default Student;