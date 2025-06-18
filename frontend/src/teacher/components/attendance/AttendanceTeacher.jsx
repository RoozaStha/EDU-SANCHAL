import React, { useState, useEffect, useContext } from "react";
import { 
    Container, Typography, Grid, Card, CardContent, 
    Select, MenuItem, InputLabel, FormControl, Button, 
    CircularProgress, Divider, Box, Paper, Table, 
    TableBody, TableCell, TableContainer, TableHead, 
    TableRow, TextField, Tabs, Tab, Chip, useTheme, 
    Stack, Avatar, AppBar, Toolbar
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
    const theme = useTheme();

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
        <Container maxWidth="lg" sx={{ py: 1 }}>
            {/* Blue header bar */}
            <AppBar 
                position="static" 
                elevation={0}
                sx={{ 
                    bgcolor: theme.palette.primary.main, 
                    borderRadius: '12px', 
                    mb: 4,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
            >
                <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
                    <Typography 
                        variant="h5" 
                        component="h1" 
                        sx={{ 
                            fontWeight: 600, 
                            letterSpacing: 0.5,
                            color: 'white'
                        }}
                    >
                        Teacher Attendance Dashboard
                    </Typography>
                </Toolbar>
            </AppBar>
            
            {/* Modern Tabs */}
            <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ 
                    mb: 4,
                    '& .MuiTabs-indicator': {
                        height: 4,
                        borderRadius: '4px 4px 0 0'
                    }
                }}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab 
                    label="Mark Attendance" 
                    sx={{ 
                        fontWeight: 600, 
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&.Mui-selected': {
                            color: theme.palette.primary.main
                        }
                    }}
                />
                <Tab 
                    label="My Attendance" 
                    sx={{ 
                        fontWeight: 600, 
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&.Mui-selected': {
                            color: theme.palette.primary.main
                        }
                    }}
                />
                <Tab 
                    label="Class Attendance" 
                    sx={{ 
                        fontWeight: 600, 
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&.Mui-selected': {
                            color: theme.palette.primary.main
                        }
                    }}
                />
            </Tabs>

            {activeTab === 0 && (
                <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
                    {teacherClass && (
                        <Box 
                            mb={3} 
                            p={2} 
                            bgcolor={theme.palette.grey[100]} 
                            borderRadius={2}
                            boxShadow={1}
                        >
                            <Typography variant="h6" fontWeight={600} color="text.secondary">
                                Class: <Box component="span" color="primary.main" fontWeight={700}>{teacherClass.class_text}</Box> (Grade {teacherClass.class_num})
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
                                variant="outlined"
                                InputProps={{
                                    sx: {
                                        borderRadius: 2,
                                        bgcolor: 'background.paper'
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>

                    {studentsLoading ? (
                        <Box display="flex" justifyContent="center" mt={6}>
                            <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
                        </Box>
                    ) : (
                        <>
                            <Typography variant="h6" gutterBottom fontWeight={600} color="text.primary" mb={2}>
                                Mark Student Attendance
                            </Typography>
                            
                            <Grid container spacing={2}>
                                {students.map(student => (
                                    <Grid item xs={12} sm={6} md={4} key={student._id}>
                                        <Card 
                                            sx={{ 
                                                borderRadius: 2, 
                                                boxShadow: 3,
                                                transition: 'transform 0.3s, box-shadow 0.3s',
                                                '&:hover': {
                                                    transform: 'translateY(-5px)',
                                                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                                }
                                            }}
                                        >
                                            <CardContent>
                                                <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                                                    <Avatar 
                                                        src={`/images/uploaded/student/${student.student_image}`}
                                                        alt={student.name}
                                                        sx={{ 
                                                            width: 50, 
                                                            height: 50,
                                                            border: `2px solid ${theme.palette.primary.light}`
                                                        }}
                                                    />
                                                    <Typography fontWeight={600}>{student.name}</Typography>
                                                </Stack>
                                                
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Status</InputLabel>
                                                    <Select
                                                        value={studentAttendance[student._id] || "Present"}
                                                        onChange={(e) => 
                                                            handleStudentAttendanceChange(student._id, e.target.value)
                                                        }
                                                        label="Status"
                                                        sx={{ borderRadius: 2 }}
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
                            
                            <Box mt={4} display="flex" justifyContent="center">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={submitStudentAttendance}
                                    disabled={loading || !date || !teacherClass || Object.keys(studentAttendance).length === 0}
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        '&:hover': {
                                            boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : "Submit Attendance"}
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            )}

            {activeTab === 1 && (
                <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
                    <Typography variant="h6" gutterBottom fontWeight={600} color="text.primary" mb={3}>
                        My Attendance Records
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Start Date"
                                InputLabelProps={{ shrink: true }}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                variant="outlined"
                                InputProps={{
                                    sx: {
                                        borderRadius: 2,
                                        bgcolor: 'background.paper'
                                    }
                                }}
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
                                variant="outlined"
                                InputProps={{
                                    sx: {
                                        borderRadius: 2,
                                        bgcolor: 'background.paper'
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                onClick={fetchTeacherAttendance}
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    px: 4,
                                    py: 1,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                Filter
                            </Button>
                        </Grid>
                    </Grid>
                    
                    {attendanceLoading ? (
                        <Box display="flex" justifyContent="center" mt={6}>
                            <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
                        </Box>
                    ) : (
                        <>
                            {teacherAttendanceRecords.length > 0 ? (
                                <>
                                    <Grid container spacing={3} sx={{ mb: 4 }}>
                                        <Grid item xs={12} md={6}>
                                            <Paper 
                                                elevation={0} 
                                                sx={{ 
                                                    p: 3, 
                                                    borderRadius: 3, 
                                                    bgcolor: 'background.paper',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                                                    border: '1px solid rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                <Typography variant="subtitle1" align="center" fontWeight={600} mb={2}>
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
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                            label={({ name, percent }) => 
                                                                `${name}: ${(percent * 100).toFixed(0)}%`
                                                            }
                                                        >
                                                            <Cell fill="#4e79a7" />
                                                            <Cell fill="#f28e2c" />
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                borderRadius: 8,
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                        <Legend 
                                                            layout="vertical" 
                                                            verticalAlign="middle" 
                                                            align="right"
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Paper>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <Paper 
                                                elevation={0} 
                                                sx={{ 
                                                    p: 3, 
                                                    borderRadius: 3, 
                                                    bgcolor: 'background.paper',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                                                    border: '1px solid rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                <Typography variant="subtitle1" align="center" fontWeight={600} mb={2}>
                                                    Attendance Over Time
                                                </Typography>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart
                                                        data={getTeacherAttendanceChartData()}
                                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis dataKey="date" stroke="#777" />
                                                        <YAxis stroke="#777" />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                borderRadius: 8,
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                        <Legend 
                                                            iconType="circle"
                                                            iconSize={10}
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="Present" 
                                                            stroke="#4e79a7" 
                                                            strokeWidth={2}
                                                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                                            activeDot={{ r: 6, stroke: '#4e79a7', strokeWidth: 2, fill: '#fff' }} 
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="Absent" 
                                                            stroke="#f28e2c" 
                                                            strokeWidth={2}
                                                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                                            activeDot={{ r: 6, stroke: '#f28e2c', strokeWidth: 2, fill: '#fff' }} 
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                    
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            p: 3, 
                                            borderRadius: 3, 
                                            bgcolor: 'background.paper',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <Typography variant="h6" fontWeight={600} mb={2}>
                                            Attendance Details
                                        </Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                                                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {teacherAttendanceRecords.map((record) => (
                                                        <TableRow 
                                                            key={record._id}
                                                            sx={{ 
                                                                '&:nth-of-type(even)': {
                                                                    bgcolor: theme.palette.grey[50]
                                                                },
                                                                '&:hover': {
                                                                    bgcolor: theme.palette.action.hover
                                                                }
                                                            }}
                                                        >
                                                            <TableCell sx={{ fontWeight: 500 }}>
                                                                {moment(record.date).format("MMMM D, YYYY")}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Chip 
                                                                    label={record.status}
                                                                    color={record.status === "Present" ? "success" : "error"}
                                                                    sx={{ 
                                                                        fontWeight: 600,
                                                                        px: 1,
                                                                        minWidth: 90
                                                                    }}
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
                                <Box 
                                    textAlign="center" 
                                    p={4} 
                                    borderRadius={3} 
                                    bgcolor="background.paper" 
                                    boxShadow={1}
                                >
                                    <Typography variant="h6" color="text.secondary">
                                        No attendance records found
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            )}

            {activeTab === 2 && teacherClass && (
                <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
                    <Typography variant="h6" gutterBottom fontWeight={600} color="text.primary" mb={3}>
                        Class Attendance Summary: <Box component="span" color="primary.main">{teacherClass.class_text}</Box>
                    </Typography>
                    
                    {attendanceLoading ? (
                        <Box display="flex" justifyContent="center" mt={6}>
                            <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
                        </Box>
                    ) : (
                        <>
                            {studentAttendanceRecords.length > 0 ? (
                                <>
                                    <Grid container spacing={3} sx={{ mb: 4 }}>
                                        <Grid item xs={12} md={6}>
                                            <Paper 
                                                elevation={0} 
                                                sx={{ 
                                                    p: 3, 
                                                    borderRadius: 3, 
                                                    bgcolor: 'background.paper',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                                                    border: '1px solid rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                <Typography variant="subtitle1" align="center" fontWeight={600} mb={2}>
                                                    Class Attendance Distribution
                                                </Typography>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={getStudentAttendanceChartData()}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
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
                                                                    fill={index === 0 ? '#4e79a7' : '#f28e2c'} 
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                borderRadius: 8,
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                        <Legend 
                                                            layout="vertical" 
                                                            verticalAlign="middle" 
                                                            align="right"
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Paper>
                                        </Grid>
                                        
                                        <Grid item xs={12} md={6}>
                                            <Paper 
                                                elevation={0} 
                                                sx={{ 
                                                    p: 3, 
                                                    borderRadius: 3, 
                                                    bgcolor: 'background.paper',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                                                    border: '1px solid rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                <Typography variant="subtitle1" align="center" fontWeight={600} mb={2}>
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
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis dataKey="name" stroke="#777" />
                                                        <YAxis stroke="#777" />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                borderRadius: 8,
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                        <Legend />
                                                        <Bar 
                                                            dataKey="Present" 
                                                            fill="#4e79a7" 
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                        <Bar 
                                                            dataKey="Absent" 
                                                            fill="#f28e2c" 
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                    
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            p: 3, 
                                            borderRadius: 3, 
                                            bgcolor: 'background.paper',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <Typography variant="h6" fontWeight={600} mb={2}>
                                            Student Attendance Details
                                        </Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                                                        <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {studentAttendanceRecords.map((record) => (
                                                        <TableRow 
                                                            key={record._id}
                                                            sx={{ 
                                                                '&:nth-of-type(even)': {
                                                                    bgcolor: theme.palette.grey[50]
                                                                },
                                                                '&:hover': {
                                                                    bgcolor: theme.palette.action.hover
                                                                }
                                                            }}
                                                        >
                                                            <TableCell sx={{ fontWeight: 500 }}>
                                                                {record.student?.name || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>
                                                                {moment(record.date).format("MMMM D, YYYY")}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Chip 
                                                                    label={record.status}
                                                                    color={record.status === "Present" ? "success" : "error"}
                                                                    sx={{ 
                                                                        fontWeight: 600,
                                                                        px: 1,
                                                                        minWidth: 90
                                                                    }}
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
                                <Box 
                                    textAlign="center" 
                                    p={4} 
                                    borderRadius={3} 
                                    bgcolor="background.paper" 
                                    boxShadow={1}
                                >
                                    <Typography variant="h6" color="text.secondary">
                                        No attendance records found for this class
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            )}
            
            <MessageSnackbar
                message={error || success}
                type={error ? "error" : "success"}
                handleClose={() => {
                    if (error) setError("");
                    if (success) setSuccess("");
                }}
            />
            
            {/* Global animations */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Container>
    );
};

export default TeacherAttendance;