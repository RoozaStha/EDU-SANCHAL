import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { baseApi } from "../../../environment";

const Student = () => {
  const theme = useTheme();
  const { user, authenticated } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

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
      const response = await axios.get(`${baseApi}/students`, {
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
      const response = await axios.get(`${baseApi}/class/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setClasses(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch classes");
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/students/fetch-single`, {
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
    age: Yup.number()
      .required("Age is required")
      .positive("Age must be positive")
      .integer("Age must be integer"),
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
            `${baseApi}/students/update`,
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
          await axios.post(`${baseApi}/students/register`, formData, {
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
      student_class: student.student_class,
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
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        setLoading(true);
        await axios.delete(`${baseApi}/students/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setSuccess("Student deleted successfully");
        fetchStudents();
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete student");
        setLoading(false);
      }
    }
  };

  // Filter students based on search and class
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass =
      selectedClass === "" || student.student_class === selectedClass;
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
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Avatar
              src={`/images/uploaded/student/${currentStudent.student_image}`}
              sx={{ width: 120, height: 120, mb: 2 }}
            >
              {!currentStudent.student_image && <Person fontSize="large" />}
            </Avatar>
            <Typography variant="h5" component="div">
              {currentStudent.name}
            </Typography>
            <Typography color="text.secondary">
              {currentStudent.email}
            </Typography>
            <Chip
              label={currentStudent.student_class}
              icon={<Class />}
              sx={{ mt: 1 }}
              color="primary"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Cake sx={{ mr: 1, color: "text.secondary" }} />
                <Typography>
                  <strong>Age:</strong> {currentStudent.age}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                {currentStudent.gender === "Male" ? (
                  <Male sx={{ mr: 1, color: "text.secondary" }} />
                ) : currentStudent.gender === "Female" ? (
                  <Female sx={{ mr: 1, color: "text.secondary" }} />
                ) : (
                  <Transgender sx={{ mr: 1, color: "text.secondary" }} />
                )}
                <Typography>
                  <strong>Gender:</strong>{" "}
                  {currentStudent.gender.charAt(0).toUpperCase() +
                    currentStudent.gender.slice(1)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Group sx={{ mr: 1, color: "text.secondary" }} />
                <Typography>
                  <strong>Guardian:</strong> {currentStudent.guardian}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Phone sx={{ mr: 1, color: "text.secondary" }} />
                <Typography>
                  <strong>Guardian Phone:</strong>{" "}
                  {currentStudent.guardian_phone}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => handleEdit(currentStudent)}
            >
              Edit Profile
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render student form dialog
  const renderStudentForm = () => (
    <Dialog
      open={openDialog}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{editMode ? "Edit Student" : "Add New Student"}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
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
                disabled={editMode}
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
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls.class_text}>
                      {cls.class_text}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.student_class && formik.errors.student_class && (
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
                type="number"
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
                  error={formik.touched.gender && Boolean(formik.errors.gender)}
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
                <Button variant="outlined" component="span" fullWidth>
                  {editMode ? "Change Student Image" : "Upload Student Image"}
                </Button>
              </label>
              {formik.values.student_image && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {formik.values.student_image.name}
                </Typography>
              )}
              {formik.touched.student_image && formik.errors.student_image && (
                <Typography color="error" variant="caption" display="block">
                  {formik.errors.student_image}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Cancel</Button>
        <Button
          onClick={formik.handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {editMode ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render students list
  const renderStudentsList = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search students..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Class"
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls.class_text}>
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
          >
            Add Student
          </Button>
        )}
      </Box>

      {filteredStudents.length > 0 ? (
        <Grid container spacing={3}>
          {filteredStudents.map((student) => (
            <Grid item xs={12} sm={6} md={4} key={student._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ position: "relative", pt: "100%" }}>
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
                    {!student.student_image && <Person fontSize="large" />}
                  </Avatar>
                </Box>
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    {student.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <Email fontSize="small" sx={{ mr: 1 }} />
                      {student.email}
                    </Box>
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <Class fontSize="small" sx={{ mr: 1 }} />
                      Class: {student.student_class}
                    </Box>
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <Cake fontSize="small" sx={{ mr: 1 }} />
                      Age: {student.age}
                    </Box>
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      <Group fontSize="small" sx={{ mr: 1 }} />
                      Guardian: {student.guardian}
                    </Box>
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <Phone fontSize="small" sx={{ mr: 1 }} />
                      {student.guardian_phone}
                    </Box>
                  </Typography>
                </CardContent>
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEdit(student)}
                    variant="outlined"
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(student._id)}
                    variant="outlined"
                    color="error"
                  >
                    Delete
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No students found
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Main render
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        {user.role === "STUDENT" ? "My Profile" : "Student Management"}
      </Typography>

      {loading && <LinearProgress />}

      {user.role === "STUDENT" ? (
        renderStudentProfile()
      ) : (
        <>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Students List" icon={<Group />} />
            <Tab label="Add Student" icon={<Add />} />
          </Tabs>

          {activeTab === 0 ? (
            renderStudentsList()
          ) : (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{ mb: 3 }}
            >
              Add New Student
            </Button>
          )}
        </>
      )}

      {renderStudentForm()}

      <MessageSnackbar
        message={error || success}
        type={error ? "error" : "success"}
        handleClose={() => {
          if (error) setError("");
          if (success) setSuccess("");
        }}
      />
    </Container>
  );
};

export default Student;