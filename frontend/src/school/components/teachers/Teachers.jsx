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
  DialogContentText,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Switch,
  CircularProgress,
  Fade,
  Grow,
  Slide,
  Zoom,
  Paper,
  alpha
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
  Class as ClassIcon,
  Subject as SubjectIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { baseApi } from "../../../environment";
import { keyframes } from "@emotion/react";

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const Teacher = () => {
  const theme = useTheme();
  const { user, authenticated } = useContext(AuthContext);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQualification, setSelectedQualification] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);

  useEffect(() => {
    if (authenticated && user.role === "SCHOOL") {
      fetchTeachers();
      fetchClasses();
      fetchSubjects();
    } else if (authenticated && user.role === "TEACHER") {
      fetchTeacherData();
    }
  }, [authenticated, user]);

  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true);
      const response = await axios.get(`${baseApi}/subjects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      let subjectsData = [];
      if (Array.isArray(response.data)) {
        subjectsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        subjectsData = response.data.data;
      }

      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setError(error.response?.data?.message || "Failed to fetch subjects");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setClassesLoading(true);
      const response = await axios.get(`${baseApi}/class/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      let classesData = [];
      if (Array.isArray(response.data)) {
        classesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        classesData = response.data.data;
      }

      setClasses(classesData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch classes");
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/teachers/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      let teachersData = [];
      if (Array.isArray(response.data)) {
        teachersData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        teachersData = response.data.data;
      }

      setTeachers(teachersData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch teachers");
    } finally {
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

      const teacherData = response.data?.data || response.data;
      setCurrentTeacher(teacherData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch teacher data");
    } finally {
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
      ? Yup.string().min(8, "Password must be at least 8 characters")
      : Yup.string()
          .required("Password is required")
          .min(8, "Password must be at least 8 characters"),
    teacher_image: editMode
      ? Yup.mixed()
      : Yup.mixed().required("Teacher image is required"),
    class: Yup.string().nullable(),
    is_class_teacher: Yup.boolean(),
    subjects: Yup.array().of(Yup.string()),
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
      class: null,
      is_class_teacher: false,
      subjects: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const formData = new FormData();

        Object.keys(values).forEach((key) => {
          if (key === "teacher_image" && values[key]) {
            formData.append(key, values[key]);
          } else if (key === "subjects" ) {
            if (values[key] && values[key].length > 0) {
              values[key].forEach((item) => {
                formData.append(`${key}[]`, item);
              });
            }
          } else if (values[key] !== "" && values[key] !== null) {
            formData.append(key, values[key]);
          }
        });

        if (editMode) {
          formData.append("teacherId", currentTeacher._id);
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
      name: teacher.name || "",
      email: teacher.email || "",
      qualification: teacher.qualification || "",
      age: teacher.age || "",
      gender: teacher.gender || "",
      password: "",
      teacher_image: null,
      class: teacher.class?._id || null,
      is_class_teacher: teacher.is_class_teacher || false,
      subjects: teacher.subjects?.map((subject) => subject._id) || [],
    });
    setOpenDialog(true);
  };

  const handleDelete = (teacherId) => {
    setTeacherToDelete(teacherId);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`${baseApi}/teachers/delete/${teacherToDelete}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setSuccess("Teacher deleted successfully");
      fetchTeachers();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete teacher");
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesQualification =
      selectedQualification === "" ||
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
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
              py: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 3,
              mx: -2,
              mt: -2,
              color: 'white',
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
            <Avatar
              src={
                currentTeacher?.teacher_image
                  ? `/images/uploaded/teacher/${currentTeacher.teacher_image}`
                  : ""
              }
              sx={{ 
                width: 140, 
                height: 140, 
                mb: 2,
                border: '4px solid white',
                boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                animation: `${floatAnimation} 4s ease-in-out infinite`
              }}
            >
              {!currentTeacher?.teacher_image && <Person fontSize="large" />}
            </Avatar>
            <Typography variant="h4" component="div" fontWeight="bold">
              {currentTeacher?.name}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              {currentTeacher?.email}
            </Typography>
            <Chip
              label={currentTeacher?.qualification}
              icon={<Work />}
              sx={{ 
                mt: 2, 
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                px: 2,
                py: 1
              }}
            />
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.08)' }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                mb: 2,
                p: 2,
                background: alpha(theme.palette.primary.light, 0.1),
                borderRadius: 2
              }}>
                <Cake sx={{ mr: 2, color: theme.palette.primary.main, fontSize: 30 }} />
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Age
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {currentTeacher?.age}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                mb: 2,
                p: 2,
                background: alpha(theme.palette.secondary.light, 0.1),
                borderRadius: 2
              }}>
                {currentTeacher?.gender === "Male" ? (
                  <Male sx={{ mr: 2, color: theme.palette.info.main, fontSize: 30 }} />
                ) : currentTeacher?.gender === "Female" ? (
                  <Female sx={{ mr: 2, color: theme.palette.error.main, fontSize: 30 }} />
                ) : (
                  <Transgender sx={{ mr: 2, color: theme.palette.warning.main, fontSize: 30 }} />
                )}
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Gender
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {currentTeacher?.gender}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            {currentTeacher?.classes && currentTeacher.classes.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ 
                  mb: 2,
                  p: 2,
                  background: alpha(theme.palette.info.light, 0.08),
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ClassIcon sx={{ mr: 1, color: theme.palette.info.dark }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Classes
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {currentTeacher.classes.map((cls) => (
                      <Chip
                        key={cls._id}
                        label={cls.class_text || cls.name}
                        size="medium"
                        color="info"
                        sx={{ fontWeight: 600, px: 1.5, py: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
            {currentTeacher?.subjects && currentTeacher.subjects.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ 
                  mb: 2,
                  p: 2,
                  background: alpha(theme.palette.success.light, 0.08),
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SubjectIcon sx={{ mr: 1, color: theme.palette.success.dark }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Subjects
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {currentTeacher.subjects.map((subject) => (
                      <Chip
                        key={subject._id}
                        label={subject.name || subject.subject_name}
                        size="medium"
                        color="success"
                        sx={{ fontWeight: 600, px: 1.5, py: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => handleEdit(currentTeacher)}
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
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Slide>
  );

  const renderTeacherForm = () => (
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
        {editMode ? "Edit Teacher" : "Add New Teacher"}
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
              <TextField
                fullWidth
                label="Qualification"
                name="qualification"
                value={formik.values.qualification}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.qualification &&
                  Boolean(formik.errors.qualification)
                }
                helperText={
                  formik.touched.qualification && formik.errors.qualification
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School sx={{ color: theme.palette.primary.main }} />
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
                label="Age"
                name="age"
                type="number"
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

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  name="class"
                  value={formik.values.class}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Class"
                  disabled={classesLoading}
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value={null}>Not assigned to a class</MenuItem>
                  {classesLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : (
                    classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.class_text || cls.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_class_teacher"
                    checked={formik.values.is_class_teacher}
                    onChange={formik.handleChange}
                    color="primary"
                    disabled={!formik.values.class}
                  />
                }
                label="Is Class Teacher"
                labelPlacement="start"
                sx={{ 
                  justifyContent: "space-between", 
                  ml: 0, 
                  width: "100%",
                  p: 1.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.primary.light, 0.1)
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Subjects</InputLabel>
                <Select
                  multiple
                  name="subjects"
                  value={formik.values.subjects}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Subjects"
                  disabled={subjectsLoading}
                  sx={{
                    borderRadius: 2,
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const subject = subjects.find((s) => s._id === value);
                        return subject ? (
                          <Chip
                            key={value}
                            label={subject.name || subject.subject_name}
                            sx={{
                              background: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.dark,
                              fontWeight: 600
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {subjectsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : (
                    subjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        <Checkbox
                          checked={
                            formik.values.subjects.indexOf(subject._id) > -1
                          }
                          color="success"
                        />
                        <ListItemText
                          primary={subject.name || subject.subject_name}
                        />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
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
                  {editMode ? "Change Teacher Image" : "Upload Teacher Image"}
                </Button>
              </label>
              {formik.values.teacher_image && (
                <Typography variant="caption" display="block" sx={{ mt: 1, ml: 1 }}>
                  {typeof formik.values.teacher_image === "object"
                    ? formik.values.teacher_image.name
                    : formik.values.teacher_image}
                </Typography>
              )}
              {formik.touched.teacher_image && formik.errors.teacher_image && (
                <Typography color="error" variant="caption" display="block" sx={{ ml: 1 }}>
                  {formik.errors.teacher_image}
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

  const renderTeachersList = () => (
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
            placeholder="Search teachers..."
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
            <InputLabel>Qualification</InputLabel>
            <Select
              value={selectedQualification}
              onChange={(e) => setSelectedQualification(e.target.value)}
              label="Qualification"
              sx={{
                borderRadius: 50,
                '& .MuiSelect-select': {
                  py: 1
                }
              }}
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
            Add Teacher
          </Button>
        )}
      </Box>

      {filteredTeachers.length > 0 ? (
        <Grid container spacing={3}>
          {filteredTeachers.map((teacher, index) => (
            <Grid item xs={12} sm={6} md={4} key={teacher._id}>
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
                        {teacher.name}
                      </Typography>
                    </Box>
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
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" fontWeight="bold">
                      {teacher.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ 
                        background: alpha(theme.palette.primary.main, 0.1), 
                        borderRadius: 1, 
                        px: 1.5, 
                        py: 0.5,
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        <Work fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="body2" fontWeight="500">
                          {teacher.qualification}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      mb: 1.5,
                      background: alpha(theme.palette.info.light, 0.1),
                      borderRadius: 1,
                      p: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <Cake fontSize="small" sx={{ mr: 1, color: theme.palette.info.dark }} />
                        <Typography variant="body2">
                          {teacher.age} years
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {teacher.gender === "Male" ? (
                          <Male fontSize="small" sx={{ mr: 1, color: theme.palette.info.dark }} />
                        ) : teacher.gender === "Female" ? (
                          <Female fontSize="small" sx={{ mr: 1, color: theme.palette.info.dark }} />
                        ) : (
                          <Transgender fontSize="small" sx={{ mr: 1, color: theme.palette.info.dark }} />
                        )}
                        <Typography variant="body2">
                          {teacher.gender}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      mb: 1.5,
                      background: alpha(theme.palette.success.light, 0.1),
                      borderRadius: 1,
                      p: 1
                    }}>
                      <ClassIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.dark }} />
                      <Typography variant="body2" fontWeight="500">
                        {teacher.class?.class_text ||
                          teacher.class?.name ||
                          "Not assigned"}
                        {teacher.is_class_teacher && " (Class Teacher)"}
                      </Typography>
                    </Box>
                    
                    {teacher.subjects && teacher.subjects.length > 0 && (
                      <Box sx={{ 
                        mt: 2,
                        background: alpha(theme.palette.warning.light, 0.1),
                        borderRadius: 1,
                        p: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <SubjectIcon fontSize="small" sx={{ mr: 1, color: theme.palette.warning.dark }} />
                          <Typography variant="body2" fontWeight="500">
                            Subjects:
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                          }}
                        >
                          {teacher.subjects.map((subject) => (
                            <Chip
                              key={subject._id}
                              label={subject.name || subject.subject_name}
                              size="small"
                              sx={{
                                background: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.dark,
                                fontWeight: 500
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  {user.role !== "TEACHER" && (
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
                        onClick={() => handleEdit(teacher)}
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
                        onClick={() => handleDelete(teacher._id)}
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
                  )}
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
            <School sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No Teachers Found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try adjusting your search or add a new teacher
            </Typography>
          </Box>
        </Fade>
      )}
    </Box>
  );

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
            Are you sure you want to delete this teacher? This action cannot be undone.
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

  return (
    <Fade in timeout={500}>
      <Container maxWidth="lg" sx={{ py: 1}}>
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
            {user.role === "TEACHER" ? "My Profile" : "Teacher Management"}
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              opacity: 0.9,
              position: 'relative',
              zIndex: 2
            }}
          >
            {user.role === "TEACHER" 
              ? "Manage your professional profile" 
              : "Manage all teacher profiles and information"}
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

        {user.role === "TEACHER" ? (
          currentTeacher && renderTeacherProfile()
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
                label="Teachers List" 
                icon={<School />} 
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
                label="Add Teacher" 
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
              renderTeachersList()
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
                  Add New Teacher
                </Button>
              </Box>
            )}
          </>
        )}

        {renderTeacherForm()}
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

export default Teacher;