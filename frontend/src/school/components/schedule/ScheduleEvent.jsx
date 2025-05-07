import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  FormHelperText 
} from "@mui/material";
import { periodSchema } from "../../../yupSchema/periodSchema";
import { baseApi } from "../../../environment.js";
import axios from "axios";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const ScheduleEvent = () => {
  // Static periods data
  const periods = [
    { id: 1, label: 'Period 1 (10:00 AM - 11:00 AM)', startTime: '10:00', endTime: '11:00' },
    { id: 2, label: 'Period 2 (11:00 AM - 12:00 PM)', startTime: '11:00', endTime: '12:00' },
    { id: 3, label: 'Period 3 (12:00 PM - 1:00 PM)', startTime: '12:00', endTime: '13:00' },
    { id: 4, label: 'Lunch Break (1:00 PM - 2:00 PM)', startTime: '13:00', endTime: '14:00' },
    { id: 5, label: 'Period 4 (2:00 PM - 3:00 PM)', startTime: '14:00', endTime: '15:00' },
    { id: 6, label: 'Period 5 (3:00 PM - 4:00 PM)', startTime: '15:00', endTime: '16:00' }
  ];

  // State for dynamic data
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formik initialization
  const formik = useFormik({
    initialValues: {
      teacher: "",
      subject: "",
      period: "",
      date: null
    },
    validationSchema: periodSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const formattedValues = {
          ...values,
          date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null
        };
        console.log("Submitting schedule:", formattedValues);
        // Add your API call here
        // await axios.post(`${baseApi}/schedule`, formattedValues);
        alert('Schedule created successfully!');
        formik.resetForm();
      } catch (error) {
        console.error("Error creating schedule:", error);
        alert('Failed to create schedule');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teacherResponse, subjectResponse] = await Promise.all([
          axios.get(`${baseApi}/teachers/all`),
          axios.get(`${baseApi}/subjects/all`)
        ]);
        setTeachers(teacherResponse.data.teachers || []);
        setSubjects(subjectResponse.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once

  // Date change handler
  const handleDateChange = (date) => {
    formik.setFieldValue('date', date);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <h1>Schedule Event</h1>
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
        {/* Teacher Select */}
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
                {teacher.name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText error>
            {formik.touched.teacher && formik.errors.teacher}
          </FormHelperText>
        </FormControl>

        {/* Subject Select */}
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
                {subject.subject_name}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText error>
            {formik.touched.subject && formik.errors.subject}
          </FormHelperText>
        </FormControl>

        {/* Period Select */}
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
          <FormHelperText error>
            {formik.touched.period && formik.errors.period}
          </FormHelperText>
        </FormControl>

        {/* Date Picker */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={formik.values.date}
            onChange={handleDateChange}
            slotProps={{
              textField: {
                fullWidth: true,
                error: formik.touched.date && Boolean(formik.errors.date),
                helperText: formik.touched.date && formik.errors.date
              }
            }}
          />
        </LocalizationProvider>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
        </Button>
      </Box>
    </Box>
  );
};

export default ScheduleEvent;