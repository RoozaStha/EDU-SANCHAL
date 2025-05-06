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
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Search,
  Visibility,
  VisibilityOff,
  Person,
  Work,
  Phone,
  Email,
  Cake,
  Transgender,
  Male,
  Female,
  School,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { baseApi } from "../../../environment";

const Teacher = () => {
  const theme = useTheme();
  const { user, authenticated } = useContext(AuthContext);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQualification, setSelectedQualification] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (authenticated && (user.role === "SCHOOL" || user.role === "ADMIN")) {
      fetchTeachers();
    } else if (authenticated && user.role === "TEACHER") {
      fetchTeacherData();
    }
  }, [authenticated, user]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/teachers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTeachers(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch teachers");
      setLoading(false);
    }
  };

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/teachers/fetch-single`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCurrentTeacher(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch teacher data");
      setLoading(false);
    }
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    qualification: Yup.string().required("Qualification is required"),
    age: Yup.number()
      .required("Age is required")
      .positive("Age must be positive")
      .integer("Age must be integer"),
    gender: Yup.string().required("Gender is required"),
    password: editMode
      ? Yup.string()
      : Yup.string()
          .required("Password is required")
          .min(8, "Password must be at least 8 characters"),
    teacher_image: editMode
      ? Yup.mixed()
      : Yup.mixed().required("Teacher image is required"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      qualification: "",
      age: "",
      gender: "",
      password: "",
      teacher_image: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (key === "teacher_image" && values[key]) {
            formData.append(key, values[key]);
          } else if (values[key] !== "" && key !== "teacher_image") {
            formData.append(key, values[key]);
          }
        });

        if (editMode && user.role === "SCHOOL") {
          formData.append("teacherId", currentTeacher._id);
        }

        if (editMode) {
          const response = await axios.patch(
            `${baseApi}/teachers/update`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          setSuccess("Teacher updated successfully");
          if (user.role === "TEACHER") {
            setCurrentTeacher(response.data.data);
          } else {
            fetchTeachers();
          }
        } else {
          await axios.post(`${baseApi}/teachers/register`, formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          });
          setSuccess("Teacher registered successfully");
          fetchTeachers();
        }

        setOpenDialog(false);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Operation failed");
        setLoading(false);
      }
    },
  });

  const handleEdit = (teacher) => {
    setEditMode(true);
    setCurrentTeacher(teacher);
    formik.setValues({
      name: teacher.name,
      email: teacher.email,
      qualification: teacher.qualification,
      age: teacher.age,
      gender: teacher.gender,
      password: "",
      teacher_image: null,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        setLoading(true);
        await axios.delete(`${baseApi}/teachers/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setSuccess("Teacher deleted successfully");
        fetchTeachers();
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete teacher");
        setLoading(false);
      }
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQualification = selectedQualification === "" || 
      teacher.qualification === selectedQualification;
    return matchesSearch && matchesQualification;
  });

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentTeacher(null);
    formik.resetForm();
  };

  const handleFileChange = (event) => {
    formik.setFieldValue("teacher_image", event.currentTarget.files[0]);
  };

  const uniqueQualifications = [
    ...new Set(teachers.map((teacher) => teacher.qualification)),
  ].sort();

  const renderTeacherProfile = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Avatar
            src={`/images/uploaded/teacher/${currentTeacher.teacher_image}`}
            sx={{ width: 120, height: 120, mb: 2 }}
          >
            {!currentTeacher.teacher_image && <Person fontSize="large" />}
          </Avatar>
          <Typography variant="h5" component="div">
            {currentTeacher.name}
          </Typography>
          <Typography color="text.secondary">
            {currentTeacher.email}
          </Typography>
          <Chip
            label={currentTeacher.qualification}
            icon={<Work />}
            sx={{ mt: 1 }}
            color="primary"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Cake sx={{ mr: 1, color: "text.secondary" }} />
              <Typography><strong>Age:</strong> {currentTeacher.age}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {currentTeacher.gender === "Male" ? (
                <Male sx={{ mr: 1, color: "text.secondary" }} />
              ) : currentTeacher.gender === "Female" ? (
                <Female sx={{ mr: 1, color: "text.secondary" }} />
              ) : (
                <Transgender sx={{ mr: 1, color: "text.secondary" }} />
              )}
              <Typography>
                <strong>Gender:</strong> {currentTeacher.gender}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => handleEdit(currentTeacher)}
          >
            Edit Profile
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderTeacherForm = () => (
    <Dialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="md">
      <DialogTitle>{editMode ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
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
                disabled={editMode}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
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
              <TextField
                fullWidth
                label="Qualification"
                name="qualification"
                value={formik.values.qualification}
                onChange={formik.handleChange}
                error={formik.touched.qualification && Boolean(formik.errors.qualification)}
                helperText={formik.touched.qualification && formik.errors.qualification}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={formik.values.age}
                onChange={formik.handleChange}
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
                label={editMode ? "New Password" : "Password"}
                name="password"
                type={showPassword ? "text" : "password"}
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
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
                id="teacher-image-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="teacher-image-upload">
                <Button variant="outlined" component="span" fullWidth>
                  {editMode ? "Change Teacher Image" : "Upload Teacher Image"}
                </Button>
              </label>
              {formik.values.teacher_image && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {formik.values.teacher_image.name}
                </Typography>
              )}
              {formik.touched.teacher_image && formik.errors.teacher_image && (
                <Typography color="error" variant="caption" display="block">
                  {formik.errors.teacher_image}
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

  const renderTeachersList = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search teachers..."
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
            <InputLabel>Qualification</InputLabel>
            <Select
              value={selectedQualification}
              onChange={(e) => setSelectedQualification(e.target.value)}
              label="Qualification"
            >
              <MenuItem value="">All Qualifications</MenuItem>
              {uniqueQualifications.map((qualification) => (
                <MenuItem key={qualification} value={qualification}>
                  {qualification}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {user.role !== "TEACHER" && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Add Teacher
          </Button>
        )}
      </Box>

      {filteredTeachers.length > 0 ? (
        <Grid container spacing={3}>
          {filteredTeachers.map((teacher) => (
            <Grid item xs={12} sm={6} md={4} key={teacher._id}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Box sx={{ position: "relative", pt: "100%" }}>
                  <Avatar
                    src={`/images/uploaded/teacher/${teacher.teacher_image}`}
                    alt={teacher.name}
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
                    {!teacher.teacher_image && <Person fontSize="large" />}
                  </Avatar>
                </Box>
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    {teacher.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Email fontSize="small" sx={{ mr: 1 }} />
                      {teacher.email}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Work fontSize="small" sx={{ mr: 1 }} />
                      {teacher.qualification}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Cake fontSize="small" sx={{ mr: 1 }} />
                      Age: {teacher.age}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {teacher.gender === "Male" ? (
                        <Male fontSize="small" sx={{ mr: 1 }} />
                      ) : teacher.gender === "Female" ? (
                        <Female fontSize="small" sx={{ mr: 1 }} />
                      ) : (
                        <Transgender fontSize="small" sx={{ mr: 1 }} />
                      )}
                      {teacher.gender}
                    </Box>
                  </Typography>
                </CardContent>
                {user.role !== "TEACHER" && (
                  <Box sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(teacher)}
                      variant="outlined"
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(teacher._id)}
                      variant="outlined"
                      color="error"
                    >
                      Delete
                    </Button>
                  </Box>
                )}
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
            No teachers found
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        {user.role === "TEACHER" ? "My Profile" : "Teacher Management"}
      </Typography>

      {loading && <LinearProgress />}

      {user.role === "TEACHER" ? (
        renderTeacherProfile()
      ) : (
        <>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Teachers List" icon={<School />} />
            <Tab label="Add Teacher" icon={<Add />} />
          </Tabs>

          {activeTab === 0 ? (
            renderTeachersList()
          ) : (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{ mb: 3 }}
            >
              Add New Teacher
            </Button>
          )}
        </>
      )}

      {renderTeacherForm()}

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

export default Teacher;