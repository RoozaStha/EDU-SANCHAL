import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import PropTypes from "prop-types";

// Material UI components
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormHelperText,
  Typography,
  TextField,
  Divider,
  Stack,
  Grid,
  Chip,
  IconButton,
  Fade,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Avatar,
  Tooltip,
  useTheme,
} from "@mui/material";

// Icons
import {
  Schedule as ScheduleIcon,
  Class as ClassIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Today as TodayIcon,
  AccessTime as TimeIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";

const periodSchema = Yup.object().shape({
  teacher: Yup.string().required("Teacher selection is required"),
  subject: Yup.string().required("Subject selection is required"),
  period: Yup.string().required("Period selection is required"),
  date: Yup.date()
    .required("Date selection is required")
    .typeError("Invalid date"),
  class: Yup.string().required("Class selection is required"),
});

const periods = [
  {
    id: 1,
    label: "Period 1",
    timeRange: "10:00 AM - 11:00 AM",
    startTime: "10:00",
    endTime: "11:00",
    color: "#4caf50",
  },
  {
    id: 2,
    label: "Period 2",
    timeRange: "11:00 AM - 12:00 PM",
    startTime: "11:00",
    endTime: "12:00",
    color: "#2196f3",
  },
  {
    id: 3,
    label: "Period 3",
    timeRange: "12:00 PM - 1:00 PM",
    startTime: "12:00",
    endTime: "13:00",
    color: "#ff9800",
  },
  {
    id: 4,
    label: "Lunch Break",
    timeRange: "1:00 PM - 2:00 PM",
    startTime: "13:00",
    endTime: "14:00",
    color: "#f44336",
  },
  {
    id: 5,
    label: "Period 4",
    timeRange: "2:00 PM - 3:00 PM",
    startTime: "14:00",
    endTime: "15:00",
    color: "#9c27b0",
  },
  {
    id: 6,
    label: "Period 5",
    timeRange: "3:00 PM - 4:00 PM",
    startTime: "15:00",
    endTime: "16:00",
    color: "#673ab7",
  },
];

const ScheduleEvent = ({
  open,
  onClose,
  event,
  selectedClass,
  refreshSchedules,
  onError,
  onSuccess,
}) => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setLocalError] = useState(null);
  const [success, setLocalSuccess] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const theme = useTheme();

  const steps = [
    "Select Teacher & Subject",
    "Choose Time & Date",
    "Confirm Details",
  ];

  useEffect(() => {
    const initializeForm = async () => {
      if (event) {
        const {
          teacher,
          subject,
          class: classId,
          startTime,
          endTime,
        } = event.resource;

        // Convert to dayjs objects
        const start = dayjs(startTime);
        const end = dayjs(endTime);

        // Find matching period
        const matchedPeriod = periods.find((p) => {
          const [startH, startM] = p.startTime.split(":").map(Number);
          const [endH, endM] = p.endTime.split(":").map(Number);

          return (
            start.hour() === startH &&
            start.minute() === startM &&
            end.hour() === endH &&
            end.minute() === endM
          );
        });

        formik.setValues({
          teacher: teacher?._id || "",
          subject: subject?._id || "",
          class: classId?._id || selectedClass || "",
          period: matchedPeriod?.id.toString() || "",
          date: start,
        });
      } else {
        formik.resetForm();
        formik.setValues({
          ...formik.initialValues,
          class: selectedClass || "",
        });
      }
      setActiveStep(0); // Reset steps when opening dialog
    };

    if (open) initializeForm();
  }, [open, event, selectedClass]);

  const formik = useFormik({
    initialValues: {
      teacher: "",
      subject: "",
      period: "",
      date: dayjs(),
      class: selectedClass || "",
    },
    validationSchema: periodSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setLocalError(null);
      setLocalSuccess(null);

      try {
        const selectedPeriod = periods.find(
          (p) => p.id === Number(values.period)
        );
        if (!selectedPeriod) throw new Error("Selected period is invalid.");

        const dateObj = dayjs(values.date);
        if (!dateObj.isValid()) {
          throw new Error("Invalid date selection");
        }

        const selectedDate = dateObj.toDate();

        const [startH, startM] = selectedPeriod.startTime
          .split(":")
          .map(Number);
        const [endH, endM] = selectedPeriod.endTime.split(":").map(Number);

        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);

        startDate.setHours(startH, startM, 0, 0);
        endDate.setHours(endH, endM, 0, 0);

        const formattedValues = {
          teacher: values.teacher,
          subject: values.subject,
          class: values.class,
          startTimeISO: startDate.toISOString(),
          endTimeISO: endDate.toISOString(),
        };
        const token = localStorage.getItem("token");
        const url = event
          ? `http://localhost:5000/api/schedule/${event.id}`
          : `http://localhost:5000/api/schedule`;

        const method = event ? "put" : "post";

        await axios[method](url, formattedValues, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const successMsg = event
          ? "Schedule updated successfully!"
          : "Schedule successfully created!";
        setLocalSuccess(successMsg);
        if (onSuccess) onSuccess(successMsg);
        refreshSchedules();

        // Reset form after successful submission
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } catch (apiError) {
        console.error("API Error:", apiError);

        let errorMessage;
        if (apiError.response) {
          errorMessage =
            apiError.response.data?.message ||
            `Server error: ${apiError.response.status}`;
        } else if (apiError.request) {
          errorMessage =
            "No response received from server. Please check your connection.";
        } else {
          errorMessage =
            apiError.message || "Failed to create schedule. Please try again.";
        }

        setLocalError(errorMessage);
        if (onError) onError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          const errMsg = "Authentication token missing. Please log in again.";
          setLocalError(errMsg);
          if (onError) onError(errMsg);
          return;
        }

        const [teacherResponse, subjectResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/teachers/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/subjects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setTeachers(teacherResponse.data?.data || []);
        setSubjects(subjectResponse.data?.data || []);
      } catch (err) {
        console.error("Data Fetch Error:", err);
        const errMsg = "Failed to load required data. Please refresh the page.";
        setLocalError(errMsg);
        if (onError) onError(errMsg);
      }
    };

    fetchData();
  }, [onError]);

  useEffect(() => {
    if (selectedClass) {
      formik.setFieldValue("class", selectedClass);
    }
  }, [selectedClass]);

  const handleNext = () => {
    const stepValidation = {
      0: () => formik.values.teacher && formik.values.subject,
      1: () => formik.values.period && formik.values.date,
      2: () => true,
    };

    if (stepValidation[activeStep]()) {
      if (activeStep === 2) {
        setConfirmDialogOpen(true);
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    } else {
      // Touch the fields to show validation errors
      if (activeStep === 0) {
        formik.setFieldTouched("teacher", true);
        formik.setFieldTouched("subject", true);
      } else if (activeStep === 1) {
        formik.setFieldTouched("period", true);
        formik.setFieldTouched("date", true);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleConfirmSubmit = () => {
    setConfirmDialogOpen(false);
    formik.handleSubmit();
  };

  const getSelectedTeacherName = () => {
    const teacher = teachers.find((t) => t._id === formik.values.teacher);
    return teacher ? teacher.name : "Not selected";
  };

  const getSelectedSubjectName = () => {
    const subject = subjects.find((s) => s._id === formik.values.subject);
    return subject ? subject.subject_name : "Not selected";
  };

  const getSelectedPeriodInfo = () => {
    const period = periods.find((p) => p.id === Number(formik.values.period));
    return period || { label: "Not selected", timeRange: "" };
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Select Instructor
              </Typography>
              <FormControl
                fullWidth
                error={formik.touched.teacher && Boolean(formik.errors.teacher)}
                variant="outlined"
              >
                <InputLabel id="teacher-label">Teacher</InputLabel>
                <Select
                  labelId="teacher-label"
                  name="teacher"
                  label="Teacher"
                  value={formik.values.teacher}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  startAdornment={
                    formik.values.teacher && (
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          mr: 1,
                          bgcolor: theme.palette.primary.main,
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    )
                  }
                >
                  {teachers.length === 0 ? (
                    <MenuItem disabled value="">
                      Loading teachers...
                    </MenuItem>
                  ) : (
                    teachers.map((teacher) => (
                      <MenuItem key={teacher._id} value={teacher._id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: theme.palette.primary.main,
                            }}
                          >
                            {(teacher.name || "?")[0].toUpperCase()}
                          </Avatar>
                          <span>
                            {teacher.name || `Teacher ${teacher._id}`}
                          </span>
                        </Stack>
                      </MenuItem>
                    ))
                  )}
                </Select>
                <FormHelperText>
                  {formik.touched.teacher && formik.errors.teacher}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <BookIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                Select Subject
              </Typography>
              <FormControl
                fullWidth
                error={formik.touched.subject && Boolean(formik.errors.subject)}
                variant="outlined"
              >
                <InputLabel id="subject-label">Subject</InputLabel>
                <Select
                  labelId="subject-label"
                  name="subject"
                  label="Subject"
                  value={formik.values.subject}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  startAdornment={
                    formik.values.subject && (
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          mr: 1,
                          bgcolor: theme.palette.secondary.main,
                        }}
                      >
                        <BookIcon fontSize="small" />
                      </Avatar>
                    )
                  }
                >
                  {subjects.length === 0 ? (
                    <MenuItem disabled value="">
                      Loading subjects...
                    </MenuItem>
                  ) : (
                    subjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: theme.palette.secondary.main,
                            }}
                          >
                            {(subject.subject_name || "?")[0].toUpperCase()}
                          </Avatar>
                          <span>
                            {subject.subject_name || `Subject ${subject._id}`}
                          </span>
                        </Stack>
                      </MenuItem>
                    ))
                  )}
                </Select>
                <FormHelperText>
                  {formik.touched.subject && formik.errors.subject}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <TimeIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                Select Class Period
              </Typography>
              <FormControl
                fullWidth
                error={formik.touched.period && Boolean(formik.errors.period)}
                variant="outlined"
              >
                <InputLabel id="period-label">Period</InputLabel>
                <Select
                  labelId="period-label"
                  name="period"
                  label="Period"
                  value={formik.values.period}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {periods.map((period) => (
                    <MenuItem key={period.id} value={period.id}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ width: "100%" }}
                      >
                        <Chip
                          label={period.label}
                          size="small"
                          sx={{
                            bgcolor: period.color,
                            color: "white",
                            fontWeight: "bold",
                            minWidth: "100px",
                          }}
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {period.timeRange}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {formik.touched.period && formik.errors.period}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <TodayIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                Select Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  value={formik.values.date}
                  onChange={(date) => formik.setFieldValue("date", date)}
                  minDate={dayjs()}
                  format="MM/DD/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined",
                      error: formik.touched.date && Boolean(formik.errors.date),
                      helperText: formik.touched.date && formik.errors.date,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );

      case 2:
        const periodInfo = getSelectedPeriodInfo();
        return (
          <Card sx={{ backgroundColor: theme.palette.background.default }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: "bold",
                  color: theme.palette.primary.main,
                }}
              >
                Schedule Summary
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2,
                      height: "100%",
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Teacher
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <PersonIcon
                        sx={{ mr: 1, color: theme.palette.primary.main }}
                      />
                      {getSelectedTeacherName()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2,
                      height: "100%",
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Subject
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <BookIcon
                        sx={{ mr: 1, color: theme.palette.secondary.main }}
                      />
                      {getSelectedSubjectName()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2,
                      height: "100%",
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Class
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <ClassIcon
                        sx={{ mr: 1, color: theme.palette.info.dark }}
                      />
                      {selectedClass || "Not selected"}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2,
                      height: "100%",
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Date
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <CalendarIcon
                        sx={{ mr: 1, color: theme.palette.info.main }}
                      />
                      {dayjs(formik.values.date).format("MMMM D, YYYY")}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: periodInfo.color
                        ? `${periodInfo.color}15`
                        : theme.palette.background.paper,
                      border: `1px solid ${
                        periodInfo.color || theme.palette.divider
                      }`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label={periodInfo.label}
                        sx={{
                          bgcolor: periodInfo.color,
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                      <Typography
                        variant="body1"
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <TimeIcon sx={{ mx: 1 }} />
                        {periodInfo.timeRange}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Box sx={{ maxWidth: 800, mx: "auto", p: 0 }}>
        <Card
          sx={{
            overflow: "visible",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            borderRadius: "16px",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                p: 2,
                backgroundColor: theme.palette.primary.main,
                color: "white",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <ScheduleIcon />
                <Typography variant="h5" component="div">
                  Schedule New Class Event
                </Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: "white" }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {(error || success) && (
              <Fade in={Boolean(error || success)}>
                <Alert
                  severity={error ? "error" : "success"}
                  sx={{ m: 2 }}
                  action={
                    <IconButton
                      size="small"
                      onClick={() => {
                        setLocalError(null);
                        setLocalSuccess(null);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  {error || success}
                </Alert>
              </Fade>
            )}

            <Box sx={{ p: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  startIcon={
                    <ArrowForwardIcon sx={{ transform: "rotate(180deg)" }} />
                  }
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={
                    activeStep === steps.length - 1 ? (
                      <CheckIcon />
                    ) : (
                      <ArrowForwardIcon />
                    )
                  }
                  disabled={isSubmitting || !selectedClass}
                  color={
                    activeStep === steps.length - 1 ? "success" : "primary"
                  }
                >
                  {activeStep === steps.length - 1 ? "Confirm" : "Next"}
                </Button>
              </Box>

              {!selectedClass && (
                <Typography
                  color="error"
                  variant="body2"
                  align="center"
                  sx={{ mt: 2 }}
                >
                  Please select a class first
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          aria-labelledby="confirm-dialog-title"
        >
          <DialogTitle id="confirm-dialog-title">
            Confirm Schedule Creation
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to schedule this class event? This will be
              visible to all relevant students and teachers.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmSubmit}
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Scheduling..." : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Dialog>
  );
};

ScheduleEvent.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  event: PropTypes.object,
  selectedClass: PropTypes.string,
  refreshSchedules: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default ScheduleEvent;
