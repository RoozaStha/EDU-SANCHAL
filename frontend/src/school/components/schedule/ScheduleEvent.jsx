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
  Typography
} from "@mui/material";
import { periodSchema } from "../../../yupSchema/periodSchema";
import { baseApi } from "../../../environment.js";
import axios from "axios";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const ScheduleEvent = ({ selectedClass }) => {
  const periods = [
    { id: 1, label: 'Period 1 (10:00 AM - 11:00 AM)', startTime: '10:00', endTime: '11:00' },
    { id: 2, label: 'Period 2 (11:00 AM - 12:00 PM)', startTime: '11:00', endTime: '12:00' },
    { id: 3, label: 'Period 3 (12:00 PM - 1:00 PM)', startTime: '12:00', endTime: '13:00' },
    { id: 4, label: 'Lunch Break (1:00 PM - 2:00 PM)', startTime: '13:00', endTime: '14:00' },
    { id: 5, label: 'Period 4 (2:00 PM - 3:00 PM)', startTime: '14:00', endTime: '15:00' },
    { id: 6, label: 'Period 5 (3:00 PM - 4:00 PM)', startTime: '15:00', endTime: '16:00' }
  ];

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
      class: selectedClass?._id || ""
    },
    validationSchema: periodSchema,
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      try {
        const [startTimeStr, endTimeStr] = values.period.split(',');
        const selectedDate = dayjs(values.date).toDate();

        // Create Date objects with proper time
        const startTimeDate = new Date(selectedDate);
        const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
        startTimeDate.setHours(startHours, startMinutes, 0, 0);

        const endTimeDate = new Date(selectedDate);
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
        endTimeDate.setHours(endHours, endMinutes, 0, 0);

        console.log("Schedule Details:", {
          teacher: values.teacher,
          subject: values.subject,
          class: values.class,
          date: dayjs(values.date).format('YYYY-MM-DD'),
          startTime: startTimeStr,
          endTime: endTimeStr,
          startTimeDate,
          endTimeDate,
          durationMinutes: (endTimeDate - startTimeDate) / (1000 * 60)
        });

        const formattedValues = {
          teacher: values.teacher,
          subject: values.subject,
          class: values.class,
          date: dayjs(values.date).format('YYYY-MM-DD'),
          startTime: startTimeStr,
          endTime: endTimeStr,
          startTimeISO: startTimeDate.toISOString(),
          endTimeISO: endTimeDate.toISOString()
        };

        try {
          const response = await axios.post(
            `${baseApi}/schedule/create`, 
            formattedValues,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          console.log("API Response:", response.data);
          setSuccess('Schedule created successfully!');
        } catch (apiError) {
          console.error("API Error:", apiError.response?.data || apiError.message);
          setError('Failed to create schedule. Please try again.');
        }

        resetForm({
          values: {
            teacher: "",
            subject: "",
            period: "",
            date: dayjs(),
            class: selectedClass?._id || ""
          }
        });
      } catch (error) {
        console.error("Form Error:", error);
        setError(error.message || 'Failed to process form');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teacherResponse, subjectResponse] = await Promise.all([
          axios.get(`${baseApi}/teachers/all`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }),
          axios.get(`${baseApi}/subjects`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);
        
        setTeachers(teacherResponse.data?.data || []);
        setSubjects(subjectResponse.data?.data || []);
      } catch (error) {
        console.error("Data Fetch Error:", error);
        setError('Failed to load required data. Please refresh the page.');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass?._id) {
      formik.setFieldValue('class', selectedClass._id);
    }
  }, [selectedClass]);

  const handleDateChange = (date) => {
    formik.setFieldValue('date', date);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Schedule Event
      </Typography>
      
      {selectedClass && (
        <Typography variant="subtitle1" gutterBottom>
          For Class: {selectedClass.className}
        </Typography>
      )}
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {success && (
        <Typography color="success.main" sx={{ mb: 2 }}>
          {success}
        </Typography>
      )}

      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}
        onSubmit={formik.handleSubmit}
      >
        <FormControl fullWidth error={formik.touched.teacher && Boolean(formik.errors.teacher)}>
          <InputLabel id="teacher-label">Teacher</InputLabel>
          <Select
            labelId="teacher-label"
            label="Teacher"
            name="teacher"
            value={formik.values.teacher}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {teachers.map((teacher) => (
              <MenuItem key={teacher._id} value={teacher._id}>
                {teacher.name || `Teacher ${teacher._id}`}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {formik.touched.teacher && formik.errors.teacher}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth error={formik.touched.subject && Boolean(formik.errors.subject)}>
          <InputLabel id="subject-label">Subject</InputLabel>
          <Select
            labelId="subject-label"
            label="Subject"
            name="subject"
            value={formik.values.subject}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {subjects.map((subject) => (
              <MenuItem key={subject._id} value={subject._id}>
                {subject.subject_name || `Subject ${subject._id}`}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {formik.touched.subject && formik.errors.subject}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth error={formik.touched.period && Boolean(formik.errors.period)}>
          <InputLabel id="period-label">Period</InputLabel>
          <Select
            labelId="period-label"
            label="Period"
            name="period"
            value={formik.values.period}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {periods.map((period) => (
              <MenuItem key={period.id} value={`${period.startTime},${period.endTime}`}>
                {period.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {formik.touched.period && formik.errors.period}
          </FormHelperText>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={formik.values.date}
            onChange={handleDateChange}
            minDate={dayjs()}
            slotProps={{
              textField: {
                fullWidth: true,
                error: formik.touched.date && Boolean(formik.errors.date),
                helperText: formik.touched.date && formik.errors.date
              }
            }}
          />
        </LocalizationProvider>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting || !selectedClass}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
        </Button>

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