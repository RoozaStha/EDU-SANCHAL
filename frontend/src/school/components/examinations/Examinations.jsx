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

  useEffect(() => {
    fetchAllClasses();
    fetchAllSubjects();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchExaminationsByClass(selectedClass);
    }
  }, [selectedClass]);

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        p: 3,
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

      {/* Title */}
      <Typography
        variant="h3"
        component="h1"
        sx={{
          textAlign: "center",
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: `${gradientFlow} 6s ease infinite`,
          backgroundSize: "200% 200%",
        }}
      >
        {editMode ? "Edit Examination" : "Assign Examination"}
      </Typography>

      {/* Class Selector */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Change Class</Typography>
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
      </Box>

      {/* Form */}
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Stack spacing={3} sx={{ mb: 4 }}>
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

          <Stack direction="row" spacing={2}>
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
                background: theme.palette.primary.main,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: theme.palette.primary.dark,
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              {editMode ? "Update Examination" : "Assign Examination"}
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

      {/* Examinations List */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            position: "relative",
            "&:after": {
              content: '""',
              display: "block",
              width: "60px",
              height: "3px",
              background: theme.palette.primary.main,
              marginTop: "8px",
              borderRadius: "3px",
            },
          }}
        >
          Examinations
        </Typography>

        <Stack spacing={2}>
          {examinations.length > 0 ? (
            examinations.map((exam, index) => (
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
                      animation: `${pulse} 2s infinite`,
                    },
                    background:
                      hoveredCard === exam._id
                        ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
                        : theme.palette.background.paper,
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
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: theme.palette.primary.main,
                          display: "inline-block",
                        }}
                      />
                      {exam.subject?.subject_name || 'Unknown Subject'}
                    </Typography>
                    
                    <Box sx={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      mt: 1 
                    }}>
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center",
                        gap: 0.5 
                      }}>
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(exam.examDate)}
                        </Typography>
                      </Box>
                      
                      <Box
                        component="span"
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          background: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                          borderRadius: 1,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        {exam.examType}
                      </Box>
                    </Box>
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
            ))
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 4,
                bgcolor: theme.palette.action.hover,
                borderRadius: 2
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No examinations found for this class
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                onClick={() => {
                  const firstInput = document.querySelector('input, select');
                  if (firstInput) firstInput.focus();
                }}
              >
                Add Exam
              </Button>
            </Box>
          )}
        </Stack>
      </Box>

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