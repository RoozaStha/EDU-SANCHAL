import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormHelperText,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";
import * as Yup from "yup";

const periodSchema = Yup.object().shape({
  teacher: Yup.string().required("Teacher is required"),
  subject: Yup.string().required("Subject is required"),
  period: Yup.string().required("Period is required"),
  date: Yup.date().required("Date is required").typeError("Invalid date"),
  class: Yup.string().required("Class is required"),
});

const periods = [
  { id: 1, label: "Period 1 (10:00 AM - 11:00 AM)", startTime: "10:00", endTime: "11:00" },
  { id: 2, label: "Period 2 (11:00 AM - 12:00 PM)", startTime: "11:00", endTime: "12:00" },
  { id: 3, label: "Period 3 (12:00 PM - 1:00 PM)", startTime: "12:00", endTime: "13:00" },
  { id: 4, label: "Lunch Break (1:00 PM - 2:00 PM)", startTime: "13:00", endTime: "14:00" },
  { id: 5, label: "Period 4 (2:00 PM - 3:00 PM)", startTime: "14:00", endTime: "15:00" },
  { id: 6, label: "Period 5 (3:00 PM - 4:00 PM)", startTime: "15:00", endTime: "16:00" },
];

const ScheduleEvent = ({ selectedClass, refreshSchedules, onClose }) => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const formik = useFormik({
    initialValues: {
      teacher: "",
      subject: "",
      period: "",
      date: dayjs(),
      class: selectedClass || "",
    },
    validationSchema: periodSchema,
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        const selectedPeriod = periods.find(p => p.id === Number(values.period));
        if (!selectedPeriod) throw new Error("Selected period is invalid.");

        // Ensure we have a valid date by using dayjs
        const dateObj = dayjs(values.date);
        if (!dateObj.isValid()) {
          throw new Error("Invalid date selection");
        }

        // Get the date portion only (year, month, day)
        const selectedDate = dateObj.toDate();
        
        // Parse time strings to numbers
        const [startH, startM] = selectedPeriod.startTime.split(":").map(Number);
        const [endH, endM] = selectedPeriod.endTime.split(":").map(Number);

        // Create new Date objects to avoid timezone issues
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);
        
        // Set hours and minutes explicitly
        startDate.setHours(startH, startM, 0, 0);
        endDate.setHours(endH, endM, 0, 0);

        // Debug logging
        console.log("Selected date:", selectedDate);
        console.log("Period:", selectedPeriod);
        console.log("Start time:", startDate);
        console.log("End time:", endDate);

        const formattedValues = {
          teacher: values.teacher,
          subject: values.subject,
          class: values.class,
          startTimeISO: startDate.toISOString(),
          endTimeISO: endDate.toISOString(),
        };

        console.log("Sending schedule data:", formattedValues);
        
        // Get token from localStorage
        const token = localStorage.getItem("token");
        console.log("Using auth token:", token ? "Token exists" : "No token found");

        const response = await axios.post(`http://localhost:5000/api/schedule`, formattedValues, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Server response:", response.data);

        setSuccess("Schedule created successfully!");
        refreshSchedules();
        resetForm({
          values: {
            teacher: "",
            subject: "",
            period: "",
            date: dayjs(),
            class: selectedClass,
          },
        });

        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } catch (apiError) {
        console.error("API Error:", apiError);
        
        // Enhanced error handling with more detailed messages
        let errorMessage;
        if (apiError.response) {
          // The server responded with a status code outside the 2xx range
          errorMessage = apiError.response.data?.message || 
                         `Server error: ${apiError.response.status}`;
          console.error("Error response data:", apiError.response.data);
        } else if (apiError.request) {
          // The request was made but no response was received
          errorMessage = "No response received from server. Please check your connection.";
        } else {
          // Something happened in setting up the request
          errorMessage = apiError.message || "Failed to create schedule. Please try again.";
        }
        
        setError(errorMessage);
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
          setError("Authentication token missing. Please log in again.");
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

        console.log("Teachers data:", teacherResponse.data);
        console.log("Subjects data:", subjectResponse.data);

        setTeachers(teacherResponse.data?.data || []);
        setSubjects(subjectResponse.data?.data || []);
      } catch (err) {
        console.error("Data Fetch Error:", err);
        setError("Failed to load required data. Please refresh the page.");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      formik.setFieldValue("class", selectedClass);
    }
  }, [selectedClass]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Schedule Event
      </Typography>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {success && <Typography color="success.main" sx={{ mb: 2 }}>{success}</Typography>}

      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <FormControl fullWidth error={formik.touched.teacher && Boolean(formik.errors.teacher)}>
          <InputLabel id="teacher-label">Teacher</InputLabel>
          <Select
            labelId="teacher-label"
            name="teacher"
            label="Teacher"
            value={formik.values.teacher}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {teachers.length === 0 ? (
              <MenuItem disabled value="">Loading teachers...</MenuItem>
            ) : (
              teachers.map(teacher => (
                <MenuItem key={teacher._id} value={teacher._id}>
                  {teacher.name || `Teacher ${teacher._id}`}
                </MenuItem>
              ))
            )}
          </Select>
          <FormHelperText>{formik.touched.teacher && formik.errors.teacher}</FormHelperText>
        </FormControl>

        <FormControl fullWidth error={formik.touched.subject && Boolean(formik.errors.subject)}>
          <InputLabel id="subject-label">Subject</InputLabel>
          <Select
            labelId="subject-label"
            name="subject"
            label="Subject"
            value={formik.values.subject}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {subjects.length === 0 ? (
              <MenuItem disabled value="">Loading subjects...</MenuItem>
            ) : (
              subjects.map(subject => (
                <MenuItem key={subject._id} value={subject._id}>
                  {subject.subject_name || `Subject ${subject._id}`}
                </MenuItem>
              ))
            )}
          </Select>
          <FormHelperText>{formik.touched.subject && formik.errors.subject}</FormHelperText>
        </FormControl>

        <FormControl fullWidth error={formik.touched.period && Boolean(formik.errors.period)}>
          <InputLabel id="period-label">Period</InputLabel>
          <Select
            labelId="period-label"
            name="period"
            label="Period"
            value={formik.values.period}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {periods.map(period => (
              <MenuItem key={period.id} value={period.id}>
                {period.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{formik.touched.period && formik.errors.period}</FormHelperText>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={formik.values.date}
            onChange={(date) => formik.setFieldValue("date", date)}
            minDate={dayjs()}
            slotProps={{
              textField: {
                fullWidth: true,
                error: formik.touched.date && Boolean(formik.errors.date),
                helperText: formik.touched.date && formik.errors.date,
              },
            }}
          />
        </LocalizationProvider>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || !selectedClass}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? "Scheduling..." : "Schedule Event"}
          </Button>
          <Button variant="outlined" size="large" onClick={onClose} sx={{ mt: 2 }}>
            Cancel
          </Button>
        </Box>

        {!selectedClass && (
          <Typography color="error" variant="body2">
            Please select a class first
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ScheduleEvent;