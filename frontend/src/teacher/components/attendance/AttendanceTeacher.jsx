import React, { useState, useEffect, useContext } from "react";
import { 
    Container, Typography, Grid, Card, CardContent, 
    Select, MenuItem, InputLabel, FormControl, Button, 
    CircularProgress, Divider, Box, Paper, Table, 
    TableBody, TableCell, TableContainer, TableHead, 
    TableRow, TextField, Tabs, Tab, Chip
} from "@mui/material";
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, 
    ResponsiveContainer, Legend, PieChart, Pie, 
    Cell, CartesianGrid, LineChart, Line 
} from "recharts";
import { AuthContext } from "../../../context/AuthContext";
import axios from "axios";
import moment from "moment";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const TeacherAttendance = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [teacherClass, setTeacherClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [studentAttendance, setStudentAttendance] = useState({});
    const [teacherAttendanceRecords, setTeacherAttendanceRecords] = useState([]);
    const [studentAttendanceRecords, setStudentAttendanceRecords] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeTab, setActiveTab] = useState(0);

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchTeacherClass();
        fetchTeacherAttendance();
    }, []);

    useEffect(() => {
        if (teacherClass) {
            fetchClassStudents(teacherClass._id);
            fetchClassAttendance(teacherClass._id);
        }
    }, [teacherClass]);

    const fetchTeacherClass = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:5000/api/attendance/teacher/class", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeacherClass(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load teacher's class");
        } finally {
            setLoading(false);
        }
    };

    const fetchClassStudents = async (classId) => {
        try {
            setStudentsLoading(true);
            const res = await axios.get(
                `http://localhost:5000/api/attendance/teacher/class-students/${classId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStudents(res.data.data || []);
            
            // Initialize attendance status as Present by default
            const initialAttendance = {};
            res.data.data.forEach(student => {
                initialAttendance[student._id] = "Present";
            });
            setStudentAttendance(initialAttendance);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load class students");
        } finally {
            setStudentsLoading(false);
        }
    };

    const fetchClassAttendance = async (classId) => {
        try {
            setAttendanceLoading(true);
            const res = await axios.get(
                `http://localhost:5000/api/attendance/student/summary/${classId}`,
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    params: { date }
                }
            );
            setStudentAttendanceRecords(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load class attendance");
        } finally {
            setAttendanceLoading(false);
        }
    };

    const fetchTeacherAttendance = async () => {
        try {
            setAttendanceLoading(true);
            const res = await axios.get(
                "http://localhost:5000/api/attendance/teacher/my-attendance",
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    params: { startDate, endDate }
                }
            );
            setTeacherAttendanceRecords(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load teacher attendance");
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handleStudentAttendanceChange = (studentId, status) => {
        setStudentAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const submitStudentAttendance = async () => {
        try {
            setLoading(true);
            const attendancePayload = Object.keys(studentAttendance).map(studentId => ({
                studentId,
                status: studentAttendance[studentId],
                classId: teacherClass._id
            }));

            await axios.post(
                "http://localhost:5000/api/attendance/teacher/mark-students",
                { 
                    attendances: attendancePayload,
                    date,
                    classId: teacherClass._id 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess("Attendance submitted successfully");
            fetchClassAttendance(teacherClass._id);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit attendance");
        } finally {
            setLoading(false);
        }
    };

    // Process data for charts
    const getStudentAttendanceChartData = () => {
        if (!studentAttendanceRecords.length) return [];

        // Count presents and absents
        const presentCount = studentAttendanceRecords.filter(
            record => record.status === "Present"
        ).length;
        const absentCount = studentAttendanceRecords.filter(
            record => record.status === "Absent"
        ).length;

        return [
            { name: "Present", value: presentCount },
            { name: "Absent", value: absentCount }
        ];
    };

    const getTeacherAttendanceChartData = () => {
        if (!teacherAttendanceRecords.length) return [];

        // Group by date and status
        const groupedData = teacherAttendanceRecords.reduce((acc, record) => {
            const dateStr = moment(record.date).format("MMM D");
            const existing = acc.find(item => item.date === dateStr);
            
            if (existing) {
                existing[record.status] = (existing[record.status] || 0) + 1;
            } else {
                acc.push({
                    date: dateStr,
                    Present: record.status === "Present" ? 1 : 0,
                    Absent: record.status === "Absent" ? 1 : 0
                });
            }
            
            return acc;
        }, []);

        return groupedData;
    };

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Teacher Attendance Dashboard
            </Typography>
            
            <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
            >
                <Tab label="Mark Attendance" />
                <Tab label="My Attendance" />
                <Tab label="Class Attendance" />
            </Tabs>

            {activeTab === 0 && (
                <>
                    {teacherClass && (
                        <Box mb={3}>
                            <Typography variant="h6">
                                Class: {teacherClass.class_text} (Grade {teacherClass.class_num})
                            </Typography>
                        </Box>
                    )}
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Date"
                                InputLabelProps={{ shrink: true }}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    {studentsLoading ? (
                        <Box display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <Typography variant="h6" gutterBottom>
                                Mark Student Attendance
                            </Typography>
                            
                            <Grid container spacing={2}>
                                {students.map(student => (
                                    <Grid item xs={12} sm={6} md={4} key={student._id}>
                                        <Card>
                                            <CardContent>
                                                <Box display="flex" alignItems="center" mb={1}>
                                                    <Box 
                                                        component="img"
                                                        src={`/images/uploaded/student/${student.student_image}`}
                                                        alt={student.name}
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            mr: 2
                                                        }}
                                                    />
                                                    <Typography>{student.name}</Typography>
                                                </Box>
                                                
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Status</InputLabel>
                                                    <Select
                                                        value={studentAttendance[student._id] || "Present"}
                                                        onChange={(e) => 
                                                            handleStudentAttendanceChange(student._id, e.target.value)
                                                        }
                                                        label="Status"
                                                    >
                                                        <MenuItem value="Present">Present</MenuItem>
                                                        <MenuItem value="Absent">Absent</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                            
                            <Box mt={3}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={submitStudentAttendance}
                                    disabled={loading || !date || !teacherClass || Object.keys(studentAttendance).length === 0}
                                >
                                    {loading ? <CircularProgress size={24} /> : "Submit Attendance"}
                                </Button>
                            </Box>
                        </>
                    )}
                </>
            )}

            {activeTab === 1 && (
                <>
                    <Typography variant="h6" gutterBottom>
                        My Attendance Records
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Start Date"
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="End Date"
                                InputLabelProps={{ shrink: true }}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="outlined"
                                onClick={fetchTeacherAttendance}
                            >
                                Filter
                            </Button>
                        </Grid>
                    </Grid>
                    
                    {attendanceLoading ? (
                        <Box display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            {teacherAttendanceRecords.length > 0 ? (
                                <>
                                    <Grid container spacing={3} sx={{ mb: 4 }}>
                                        <Grid item xs={12} md={6}>
                                            <Paper elevation={3} sx={{ p: 2 }}>
                                                <Typography variant="subtitle1" align="center">
                                                    Attendance Distribution
                                                </Typography>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                {
                                                                    name: "Present",
                                                                    value: teacherAttendanceRecords.filter(
                                                                        r => r.status === "Present"
                                                                    ).length
                                                                },
                                                                {
                                                                    name: "Absent",
                                                                    value: teacherAttendanceRecords.filter(
                                                                        r => r.status === "Absent"
                                                                    ).length
                                                                }
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
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
                                                <Typography variant="subtitle1" align="center">
                                                    Attendance Over Time
                                                </Typography>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart
                                                        data={getTeacherAttendanceChartData()}
                                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="Present" 
                                                            stroke="#0088FE" 
                                                            activeDot={{ r: 8 }} 
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="Absent" 
                                                            stroke="#FF8042" 
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                    
                                    <Paper elevation={3} sx={{ p: 2 }}>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell align="center">Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {teacherAttendanceRecords.map((record) => (
                                                        <TableRow key={record._id}>
                                                            <TableCell>
                                                                {moment(record.date).format("MMMM D, YYYY")}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Chip 
                                                                    label={record.status}
                                                                    color={record.status === "Present" ? "success" : "error"}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </>
                            ) : (
                                <Typography>No attendance records found</Typography>
                            )}
                        </>
                    )}
                </>
            )}

            {activeTab === 2 && teacherClass && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Class Attendance Summary: {teacherClass.class_text}
                    </Typography>
                    
                    {attendanceLoading ? (
                        <Box display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            {studentAttendanceRecords.length > 0 ? (
                                <>
                                    <Grid container spacing={3} sx={{ mb: 4 }}>
                                        <Grid item xs={12} md={6}>
                                            <Paper elevation={3} sx={{ p: 2 }}>
                                                <Typography variant="subtitle1" align="center">
                                                    Class Attendance Distribution
                                                </Typography>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={getStudentAttendanceChartData()}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                            label={({ name, percent }) => 
                                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                                            }
                                                        >
                                                            {getStudentAttendanceChartData().map((entry, index) => (
                                                                <Cell 
                                                                    key={`cell-${index}`} 
                                                                    fill={COLORS[index % COLORS.length]} 
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Paper>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <Paper elevation={3} sx={{ p: 2 }}>
                                                <Typography variant="subtitle1" align="center">
                                                    Attendance by Student
                                                </Typography>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart
                                                        data={studentAttendanceRecords.reduce((acc, record) => {
                                                            const existing = acc.find(item => 
                                                                item.studentId === record.student._id
                                                            );
                                                            
                                                            if (existing) {
                                                                existing[record.status] = 
                                                                    (existing[record.status] || 0) + 1;
                                                            } else {
                                                                acc.push({
                                                                    name: record.student.name,
                                                                    studentId: record.student._id,
                                                                    [record.status]: 1
                                                                });
                                                            }
                                                            
                                                            return acc;
                                                        }, [])}
                                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="Present" fill="#0088FE" />
                                                        <Bar dataKey="Absent" fill="#FF8042" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                    
                                    <Paper elevation={3} sx={{ p: 2 }}>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Student</TableCell>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell align="center">Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {studentAttendanceRecords.map((record) => (
                                                        <TableRow key={record._id}>
                                                            <TableCell>
                                                                {record.student?.name || 'N/A'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {moment(record.date).format("MMMM D, YYYY")}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Chip 
                                                                    label={record.status}
                                                                    color={record.status === "Present" ? "success" : "error"}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </>
                            ) : (
                                <Typography>No attendance records found for this class</Typography>
                            )}
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

export default TeacherAttendance;