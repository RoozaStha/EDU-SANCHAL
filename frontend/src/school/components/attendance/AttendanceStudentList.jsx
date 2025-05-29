import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  CircularProgress,
  Divider,
  Box,
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AuthContext } from "../../../context/AuthContext";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import jsPDF from "jspdf";
import "jspdf-autotable";

const AttendanceDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [studentAttendance, setStudentAttendance] = useState({});
  const [teacherAttendance, setTeacherAttendance] = useState({});
  const [studentSummary, setStudentSummary] = useState([]);
  const [teacherSummary, setTeacherSummary] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
      fetchStudentSummary(selectedClass);
    }
    fetchTeacherSummary();
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/class/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setError("Failed to load classes");
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/students?student_class=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setError("Failed to load students");
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/teachers/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      setError("Failed to load teachers");
    }
  };

  const fetchStudentSummary = async (classId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/student/summary/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentSummary(res.data.data || []);
    } catch (err) {
      setError("Failed to load student summary");
    }
  };

  const fetchTeacherSummary = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/teacher/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeacherSummary(res.data.data || []);
    } catch (err) {
      setError("Failed to load teacher summary");
    }
  };

  const handleStudentChange = (id, status) => {
    setStudentAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const handleTeacherChange = (id, status) => {
    setTeacherAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const submitAttendance = async () => {
    setLoading(true);
    try {
      const studentPayload = Object.keys(studentAttendance).map((id) => ({
        studentId: id,
        status: studentAttendance[id],
        classId: selectedClass,
      }));
      const teacherPayload = Object.keys(teacherAttendance).map((id) => ({
        teacherId: id,
        status: teacherAttendance[id],
      }));

      await axios.post("http://localhost:5000/api/attendance/student/mark", { attendances: studentPayload, date }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await axios.post("http://localhost:5000/api/attendance/teacher/mark", { attendances: teacherPayload, date }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Attendance submitted successfully.");
    } catch (err) {
      setError("Error submitting attendance");
    }
    setLoading(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Summary Report", 14, 15);
    doc.autoTable({
      head: [["Name", "Role", "Status", "Date"]],
      body: [
        ...studentSummary.map(a => [a.student.name, "Student", a.status, new Date(a.date).toLocaleDateString()]),
        ...teacherSummary.map(a => [a.teacher.name, "Teacher", a.status, new Date(a.date).toLocaleDateString()])
      ]
    });
    doc.save("attendance_summary.pdf");
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>Attendance Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            type="date"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            type="date"
            label="End Date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Select Class</InputLabel>
            <Select
              value={selectedClass}
              label="Select Class"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {Array.isArray(classes) && classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>{cls.class_text}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }}>Student Attendance</Divider>
      <Grid container spacing={2}>
        {Array.isArray(students) && students.map((student) => (
          <Grid item xs={12} sm={6} md={4} key={student._id}>
            <Card>
              <CardContent>
                <Typography>{student.name}</Typography>
                <Select
                  fullWidth
                  value={studentAttendance[student._id] || ""}
                  onChange={(e) => handleStudentChange(student._id, e.target.value)}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                </Select>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }}>Teacher Attendance</Divider>
      <Grid container spacing={2}>
        {Array.isArray(teachers) && teachers.map((teacher) => (
          <Grid item xs={12} sm={6} md={4} key={teacher._id}>
            <Card>
              <CardContent>
                <Typography>{teacher.name}</Typography>
                <Select
                  fullWidth
                  value={teacherAttendance[teacher._id] || ""}
                  onChange={(e) => handleTeacherChange(teacher._id, e.target.value)}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                </Select>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4} display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={submitAttendance}
          disabled={loading || !date || !selectedClass}
        >
          {loading ? <CircularProgress size={24} /> : "Submit Attendance"}
        </Button>
        <Button variant="outlined" onClick={exportPDF}>Export PDF</Button>
      </Box>

      <Divider sx={{ my: 4 }}>Summary Charts</Divider>
      <Typography variant="h6">Student Summary</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={studentSummary.map(s => ({ name: s.student.name, status: s.status }))}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="status" fill="#1976d2" />
        </BarChart>
      </ResponsiveContainer>

      <Typography variant="h6">Teacher Summary</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={teacherSummary.map(s => ({ name: s.teacher.name, status: s.status }))}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="status" fill="#ff9800" />
        </BarChart>
      </ResponsiveContainer>

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

export default AttendanceDashboard;
