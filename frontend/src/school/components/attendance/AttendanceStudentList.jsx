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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { AuthContext } from "../../../context/AuthContext";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from "moment";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const AttendanceDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
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
    } else {
      setStudents([]);
      setStudentSummary([]);
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
    setStudentLoading(true);
    const res = await axios.get(
      `http://localhost:5000/api/students/all`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          student_class: classId
        }
      }
    );
    
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch students");
    }
    
    setStudents(Array.isArray(res.data.data) ? res.data.data : []);
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Failed to load students";
    setError(errorMsg);
    console.error("Error fetching students:", err);
  } finally {
    setStudentLoading(false);
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
      setStudentLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/attendance/student/summary/${classId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudentSummary(res.data.data || []);
    } catch (err) {
      setError("Failed to load student summary");
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchTeacherSummary = async () => {
    try {
      setTeacherLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/attendance/teacher/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTeacherSummary(res.data.data || []);
    } catch (err) {
      setError("Failed to load teacher summary");
    } finally {
      setTeacherLoading(false);
    }
  };

  // Process student data for charts
  const getStudentChartData = () => {
    if (!studentSummary.length) return [];

    // Count presents and absents
    const presentCount = studentSummary.filter(
      (s) => s.status === "Present"
    ).length;
    const absentCount = studentSummary.filter(
      (s) => s.status === "Absent"
    ).length;

    // Group by student
    const studentData = studentSummary.reduce((acc, curr) => {
      const existing = acc.find((item) => item.studentId === curr.student._id);
      if (existing) {
        existing[curr.status] = (existing[curr.status] || 0) + 1;
      } else {
        const newItem = {
          name: curr.student.name,
          studentId: curr.student._id,
          [curr.status]: 1,
        };
        acc.push(newItem);
      }
      return acc;
    }, []);

    return [
      {
        name: "Overall",
        Present: presentCount,
        Absent: absentCount,
      },
      ...studentData,
    ];
  };

  // Process teacher data for charts
  const getTeacherChartData = () => {
    if (!teacherSummary.length) return [];

    // Count presents and absents
    const presentCount = teacherSummary.filter(
      (t) => t.status === "Present"
    ).length;
    const absentCount = teacherSummary.filter(
      (t) => t.status === "Absent"
    ).length;

    // Group by teacher
    const teacherData = teacherSummary.reduce((acc, curr) => {
      const existing = acc.find((item) => item.teacherId === curr.teacher._id);
      if (existing) {
        existing[curr.status] = (existing[curr.status] || 0) + 1;
      } else {
        const newItem = {
          name: curr.teacher.name,
          teacherId: curr.teacher._id,
          [curr.status]: 1,
        };
        acc.push(newItem);
      }
      return acc;
    }, []);

    return [
      {
        name: "Overall",
        Present: presentCount,
        Absent: absentCount,
      },
      ...teacherData,
    ];
  };

  // Calculate attendance percentage
  const getAttendancePercentage = (data) => {
    if (!data.length) return 0;
    const present = data.filter((d) => d.status === "Present").length;
    return Math.round((present / data.length) * 100);
  };

  const handleStudentChange = (id, status) => {
    setStudentAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const handleTeacherChange = (id, status) => {
    setTeacherAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const submitStudentAttendance = async () => {
    setStudentLoading(true);
    try {
      const studentPayload = Object.keys(studentAttendance).map((id) => ({
        studentId: id,
        status: studentAttendance[id],
        classId: selectedClass,
      }));

      await axios.post(
        "http://localhost:5000/api/attendance/student/mark",
        { attendances: studentPayload, date },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Student attendance submitted successfully.");
      fetchStudentSummary(selectedClass);
      setStudentAttendance({});
    } catch (err) {
      setError("Error submitting student attendance");
    }
    setStudentLoading(false);
  };

  const submitTeacherAttendance = async () => {
    setTeacherLoading(true);
    try {
      const teacherPayload = Object.keys(teacherAttendance).map((id) => ({
        teacherId: id,
        status: teacherAttendance[id],
      }));

      await axios.post(
        "http://localhost:5000/api/attendance/teacher/mark",
        { attendances: teacherPayload, date },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Teacher attendance submitted successfully.");
      fetchTeacherSummary();
      setTeacherAttendance({});
    } catch (err) {
      setError("Error submitting teacher attendance");
    }
    setTeacherLoading(false);
  };

  const submitAllAttendance = async () => {
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

      await axios.post(
        "http://localhost:5000/api/attendance/all/mark",
        {
          studentAttendances: studentPayload,
          teacherAttendances: teacherPayload,
          date,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("All attendance submitted successfully.");
      fetchStudentSummary(selectedClass);
      fetchTeacherSummary();
      setStudentAttendance({});
      setTeacherAttendance({});
    } catch (err) {
      setError("Error submitting attendance");
    }
    setLoading(false);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text("Attendance Summary Report", 105, 15, { align: 'center' });
      
      // Add date if available
      if (date) {
        doc.setFontSize(12);
        doc.text(`Date: ${moment(date).format("YYYY-MM-DD")}`, 14, 25);
      }
      
      // Class information if selected
      if (selectedClass) {
        const selectedClassData = classes.find(c => c._id === selectedClass);
        if (selectedClassData) {
          doc.text(`Class: ${selectedClassData.class_text}`, 14, 35);
        }
      }
      
      // Student Summary Section
      doc.setFontSize(14);
      doc.text("Student Attendance Summary", 14, 45);
      
      if (studentSummary.length > 0) {
        const studentData = studentSummary.map(a => [
          a.student?.name || 'N/A',
          a.status,
          moment(a.date).format("YYYY-MM-DD")
        ]);
        
        autoTable(doc, {
          startY: 50,
          head: [["Name", "Status", "Date"]],
          body: studentData,
          margin: { top: 40 },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      } else {
        doc.text("No student attendance data available", 14, 55);
      }
      
      // Teacher Summary Section
      doc.setFontSize(14);
      const startY = doc.lastAutoTable?.finalY || 60;
      doc.text("Teacher Attendance Summary", 14, startY + 15);
      
      if (teacherSummary.length > 0) {
        const teacherData = teacherSummary.map(a => [
          a.teacher?.name || 'N/A',
          a.status,
          moment(a.date).format("YYYY-MM-DD")
        ]);
        
        autoTable(doc, {
          startY: startY + 20,
          head: [["Name", "Status", "Date"]],
          body: teacherData,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [39, 174, 96] }
        });
      } else {
        doc.text("No teacher attendance data available", 14, startY + 20);
      }
      
      // Add statistics if we have data
      if (studentSummary.length > 0 || teacherSummary.length > 0) {
        const finalY = doc.lastAutoTable?.finalY || startY + 30;
        doc.setFontSize(12);
        doc.text("Attendance Statistics", 14, finalY + 15);
        
        const stats = [
          ["Category", "Present", "Absent", "Percentage"],
          [
            "Students", 
            studentSummary.filter(s => s.status === "Present").length,
            studentSummary.filter(s => s.status === "Absent").length,
            `${Math.round((studentSummary.filter(s => s.status === "Present").length / studentSummary.length) * 100)}%`
          ],
          [
            "Teachers",
            teacherSummary.filter(t => t.status === "Present").length,
            teacherSummary.filter(t => t.status === "Absent").length,
            `${Math.round((teacherSummary.filter(t => t.status === "Present").length / teacherSummary.length) * 100)}%`
          ]
        ];
        
        autoTable(doc, {
          startY: finalY + 20,
          head: stats.slice(0, 1),
          body: stats.slice(1),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [52, 73, 94] },
          columnStyles: {
            3: { halign: 'right' }
          }
        });
      }
      
      // Save the PDF
      doc.save(`attendance_report_${moment().format("YYYYMMDD_HHmmss")}.pdf`);
      setSuccess("PDF exported successfully");
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF");
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Attendance Dashboard
      </Typography>
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
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {Array.isArray(classes) &&
                classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.class_text}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {selectedClass && (
        <>
          <Divider sx={{ my: 2 }}>Student Attendance</Divider>
          <Grid container spacing={2}>
            {students.length > 0 ? (
              students.map((student) => (
                <Grid item xs={12} sm={6} md={4} key={student._id}>
                  <Card>
                    <CardContent>
                      <Typography>{student.name}</Typography>
                      <Select
                        fullWidth
                        value={studentAttendance[student._id] || ""}
                        onChange={(e) =>
                          handleStudentChange(student._id, e.target.value)
                        }
                      >
                        <MenuItem value="Present">Present</MenuItem>
                        <MenuItem value="Absent">Absent</MenuItem>
                      </Select>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography>No students found for selected class</Typography>
              </Grid>
            )}
          </Grid>
        </>
      )}

      <Divider sx={{ my: 2 }}>Teacher Attendance</Divider>
      <Grid container spacing={2}>
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <Grid item xs={12} sm={6} md={4} key={teacher._id}>
              <Card>
                <CardContent>
                  <Typography>{teacher.name}</Typography>
                  <Select
                    fullWidth
                    value={teacherAttendance[teacher._id] || ""}
                    onChange={(e) =>
                      handleTeacherChange(teacher._id, e.target.value)
                    }
                  >
                    <MenuItem value="Present">Present</MenuItem>
                    <MenuItem value="Absent">Absent</MenuItem>
                  </Select>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography>No teachers found</Typography>
          </Grid>
        )}
      </Grid>

      <Box mt={4} display="flex" gap={2} flexWrap="wrap">
        {selectedClass && (
          <Button
            variant="contained"
            color="primary"
            onClick={submitStudentAttendance}
            disabled={studentLoading || !date || !selectedClass || Object.keys(studentAttendance).length === 0}
          >
            {studentLoading ? (
              <CircularProgress size={24} />
            ) : (
              "Submit Student Attendance"
            )}
          </Button>
        )}

        <Button
          variant="contained"
          color="secondary"
          onClick={submitTeacherAttendance}
          disabled={teacherLoading || !date || Object.keys(teacherAttendance).length === 0}
        >
          {teacherLoading ? (
            <CircularProgress size={24} />
          ) : (
            "Submit Teacher Attendance"
          )}
        </Button>

        <Button
          variant="contained"
          onClick={submitAllAttendance}
          disabled={
            loading ||
            !date ||
            (Object.keys(studentAttendance).length === 0 )&& 
            (Object.keys(teacherAttendance).length === 0)
          }
        >
          {loading ? <CircularProgress size={24} /> : "Submit All Attendance"}
        </Button>

        <Button 
          variant="outlined" 
          onClick={exportPDF}
          disabled={studentSummary.length === 0 && teacherSummary.length === 0}
        >
          Export PDF
        </Button>
      </Box>

      <Divider sx={{ my: 4 }}>Summary Charts</Divider>

      {studentLoading || teacherLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Student Summary Section */}
          {selectedClass && studentSummary.length > 0 && (
            <>
              <Typography variant="h5" gutterBottom>
                Student Summary
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" align="center">
                      Attendance Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Present",
                              value: studentSummary.filter(
                                (s) => s.status === "Present"
                              ).length,
                            },
                            {
                              name: "Absent",
                              value: studentSummary.filter(
                                (s) => s.status === "Absent"
                              ).length,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          <Cell fill="#0088FE" />
                          <Cell fill="#FF8042" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" align="center">
                      Attendance by Student
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={getStudentChartData().filter(
                          (d) => d.name !== "Overall"
                        )}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="Present"
                          stackId="a"
                          fill="#0088FE"
                          name="Present"
                        />
                        <Bar
                          dataKey="Absent"
                          stackId="a"
                          fill="#FF8042"
                          name="Absent"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}

          {/* Teacher Summary Section */}
          {teacherSummary.length > 0 && (
            <>
              <Typography variant="h5" gutterBottom>
                Teacher Summary
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" align="center">
                      Attendance Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Present",
                              value: teacherSummary.filter(
                                (t) => t.status === "Present"
                              ).length,
                            },
                            {
                              name: "Absent",
                              value: teacherSummary.filter(
                                (t) => t.status === "Absent"
                              ).length,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          <Cell fill="#00C49F" />
                          <Cell fill="#FFBB28" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 2 }}>
                    <Typography variant="h6" align="center">
                      Attendance by Teacher
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={getTeacherChartData().filter(
                          (d) => d.name !== "Overall"
                        )}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="Present"
                          stackId="a"
                          fill="#00C49F"
                          name="Present"
                        />
                        <Bar
                          dataKey="Absent"
                          stackId="a"
                          fill="#FFBB28"
                          name="Absent"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}

          {/* Detailed Summary Tables */}
          {(studentSummary.length > 0 || teacherSummary.length > 0) && (
            <>
              <Typography variant="h5" gutterBottom>
                Detailed Summary
              </Typography>
              <Grid container spacing={3}>
                {studentSummary.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                      <Typography variant="h6" align="center">
                        Student Attendance
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell align="right">Status</TableCell>
                              <TableCell align="right">Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {studentSummary.slice(0, 5).map((attendance) => (
                              <TableRow
                                key={`${attendance.student._id}-${attendance.date}`}
                              >
                                <TableCell>{attendance.student.name}</TableCell>
                                <TableCell align="right">
                                  {attendance.status}
                                </TableCell>
                                <TableCell align="right">
                                  {moment(attendance.date).format("YYYY-MM-DD")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                )}
                {teacherSummary.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                      <Typography variant="h6" align="center">
                        Teacher Attendance
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell align="right">Status</TableCell>
                              <TableCell align="right">Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {teacherSummary.slice(0, 5).map((attendance) => (
                              <TableRow
                                key={`${attendance.teacher._id}-${attendance.date}`}
                              >
                                <TableCell>{attendance.teacher.name}</TableCell>
                                <TableCell align="right">
                                  {attendance.status}
                                </TableCell>
                                <TableCell align="right">
                                  {moment(attendance.date).format("YYYY-MM-DD")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </>
      )}

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