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

      // Ensure we're getting the subjects array properly
      let subjectsData = [];
      if (Array.isArray(response.data)) {
        subjectsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        subjectsData = response.data.data;
      }

      console.log("Subjects data:", subjectsData);
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
      is_class_teacher: false, // New field
      subjects: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const formData = new FormData();

        // Append all fields to formData
        Object.keys(values).forEach((key) => {
          if (key === "teacher_image" && values[key]) {
            formData.append(key, values[key]);
          } else if (key === "subjects" ) {
            // Handle arrays
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
      class: teacher.class?._id || null, // Changed from classes array
      is_class_teacher: teacher.is_class_teacher || false, // New field
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
            src={
              currentTeacher?.teacher_image
                ? `/images/uploaded/teacher/${currentTeacher.teacher_image}`
                : ""
            }
            sx={{ width: 120, height: 120, mb: 2 }}
          >
            {!currentTeacher?.teacher_image && <Person fontSize="large" />}
          </Avatar>
          <Typography variant="h5" component="div">
            {currentTeacher?.name}
          </Typography>
          <Typography color="text.secondary">
            {currentTeacher?.email}
          </Typography>
          <Chip
            label={currentTeacher?.qualification}
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
              <Typography>
                <strong>Age:</strong> {currentTeacher?.age}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              {currentTeacher?.gender === "Male" ? (
                <Male sx={{ mr: 1, color: "text.secondary" }} />
              ) : currentTeacher?.gender === "Female" ? (
                <Female sx={{ mr: 1, color: "text.secondary" }} />
              ) : (
                <Transgender sx={{ mr: 1, color: "text.secondary" }} />
              )}
              <Typography>
                <strong>Gender:</strong> {currentTeacher?.gender}
              </Typography>
            </Box>
          </Grid>
          {currentTeacher?.classes && currentTeacher.classes.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  <strong>Classes:</strong>
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {currentTeacher.classes.map((cls) => (
                    <Chip
                      key={cls._id}
                      label={cls.class_text || cls.name}
                      size="small"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          )}
          {currentTeacher?.subjects && currentTeacher.subjects.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  <strong>Subjects:</strong>
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {currentTeacher.subjects.map((subject) => (
                    <Chip
                      key={subject._id}
                      label={subject.name || subject.subject_name}
                      size="small"
                      color="secondary"
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
          >
            Edit Profile
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderTeacherForm = () => (
    <Dialog
      open={openDialog}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
    >
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
                sx={{ justifyContent: "space-between", ml: 0, width: "100%" }}
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
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const subject = subjects.find((s) => s._id === value);
                        return subject ? (
                          <Chip
                            key={value}
                            label={subject.name || subject.subject_name}
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
                <Button variant="outlined" component="span" fullWidth>
                  {editMode ? "Change Teacher Image" : "Upload Teacher Image"}
                </Button>
              </label>
              {formik.values.teacher_image && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {typeof formik.values.teacher_image === "object"
                    ? formik.values.teacher_image.name
                    : formik.values.teacher_image}
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
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
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
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <School fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        Class:{" "}
                        {teacher.class?.class_text ||
                          teacher.class?.name ||
                          "Not assigned"}
                        {teacher.is_class_teacher && " (Class Teacher)"}
                      </Typography>
                    </Box>
                    {teacher.subjects && teacher.subjects.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          Subjects:
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          {teacher.subjects.map((subject) => (
                            <Chip
                              key={subject._id}
                              label={subject.name || subject.subject_name}
                              size="small"
                              color="secondary"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Typography>
                </CardContent>
                {user.role !== "TEACHER" && (
                  <Box
                    sx={{
                      p: 2,
                      mt: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
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

  const renderDeleteDialog = () => (
    <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this teacher? This action cannot be
          undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
        <Button
          onClick={confirmDelete}
          color="error"
          variant="contained"
          disabled={loading}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
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
        currentTeacher && renderTeacherProfile()
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
  );
};

export default Teacher;
