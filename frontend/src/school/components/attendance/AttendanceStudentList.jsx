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
  Chip,
  Avatar,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Fade,
  Slide,
  Grow,
  Zoom,
  styled,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  Class as ClassIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  InsertChart as ChartIcon,
  ListAlt as ListIcon,
  HelpOutline as HelpIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
} from "@mui/icons-material";
import { AuthContext } from "../../../context/AuthContext";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from "moment";

// Custom theme colors
const COLORS = {
  present: "#4caf50",
  absent: "#f44336",
  primary: "#3f51b5",
  secondary: "#9c27b0",
  warning: "#ff9800",
  info: "#2196f3",
  lightBlue: "#e3f2fd",
  darkBlue: "#1a3a6c",
};

// Custom styled components
const HeaderBox = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${COLORS.darkBlue} 0%, ${COLORS.primary} 100%)`,
  color: "white",
  padding: theme.spacing(3),
  borderRadius: "12px 12px 0 0",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  marginBottom: theme.spacing(4),
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  transition: "transform 0.3s, box-shadow 0.3s",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
  },
}));

const DashboardCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  marginBottom: theme.spacing(4),
  overflow: "hidden",
}));

const CustomTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "0.9rem",
  minHeight: "48px",
  "&.Mui-selected": {
    color: theme.palette.primary.main,
  },
}));

const StatusBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: 10,
    top: 15,
    padding: "0 4px",
    fontSize: "0.7rem",
    fontWeight: "bold",
  },
}));

const AttendanceStatusChip = ({ status }) => {
  return (
    <Chip
      label={status}
      size="small"
      icon={status === "Present" ? <CheckCircleIcon /> : <CancelIcon />}
      color={status === "Present" ? "success" : "error"}
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
};

const AttendanceDashboard = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
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
  const [activeTab, setActiveTab] = useState(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    studentPresent: 0,
    studentAbsent: 0,
    teacherPresent: 0,
    teacherAbsent: 0,
  });
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'table'
  const [prevStats, setPrevStats] = useState({...stats});

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

  useEffect(() => {
    if (studentSummary.length > 0 || teacherSummary.length > 0) {
      setPrevStats(stats);
      calculateStats();
    }
  }, [studentSummary, teacherSummary]);

  const calculateStats = () => {
    const studentPresent = studentSummary.filter(s => s.status === "Present").length;
    const studentAbsent = studentSummary.filter(s => s.status === "Absent").length;
    const teacherPresent = teacherSummary.filter(t => t.status === "Present").length;
    const teacherAbsent = teacherSummary.filter(t => t.status === "Absent").length;
    
    setStats({
      studentPresent,
      studentAbsent,
      teacherPresent,
      teacherAbsent,
    });
  };

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
          params: { student_class: classId }
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
        { headers: { Authorization: `Bearer ${token}` } }
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeacherSummary(res.data.data || []);
    } catch (err) {
      setError("Failed to load teacher summary");
    } finally {
      setTeacherLoading(false);
    }
  };

  const refreshData = () => {
    if (selectedClass) {
      fetchStudents(selectedClass);
      fetchStudentSummary(selectedClass);
    }
    fetchTeacherSummary();
  };

  const getStudentChartData = () => {
    if (!studentSummary.length) return [];

    const presentCount = studentSummary.filter(s => s.status === "Present").length;
    const absentCount = studentSummary.filter(s => s.status === "Absent").length;

    const studentData = studentSummary.reduce((acc, curr) => {
      const existing = acc.find(item => item.studentId === curr.student._id);
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

  const getTeacherChartData = () => {
    if (!teacherSummary.length) return [];

    const presentCount = teacherSummary.filter(t => t.status === "Present").length;
    const absentCount = teacherSummary.filter(t => t.status === "Absent").length;

    const teacherData = teacherSummary.reduce((acc, curr) => {
      const existing = acc.find(item => item.teacherId === curr.teacher._id);
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

  const getAttendancePercentage = (data) => {
    if (!data.length) return 0;
    const present = data.filter(d => d.status === "Present").length;
    return Math.round((present / data.length) * 100);
  };

  const handleStudentChange = (id, status) => {
    setStudentAttendance(prev => ({ ...prev, [id]: status }));
  };

  const handleTeacherChange = (id, status) => {
    setTeacherAttendance(prev => ({ ...prev, [id]: status }));
  };

  const submitStudentAttendance = async () => {
    setStudentLoading(true);
    try {
      const studentPayload = Object.keys(studentAttendance).map(id => ({
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
      const teacherPayload = Object.keys(teacherAttendance).map(id => ({
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
      const studentPayload = Object.keys(studentAttendance).map(id => ({
        studentId: id,
        status: studentAttendance[id],
        classId: selectedClass,
      }));
      const teacherPayload = Object.keys(teacherAttendance).map(id => ({
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
      doc.setTextColor(63, 81, 181);
      doc.text("Attendance Summary Report", 105, 15, { align: 'center' });
      
      // Add date if available
      if (date) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Date: ${moment(date).format("YYYY-MM-DD")}`, 14, 25);
      }
      
      // Class information if selected
      if (selectedClass) {
        const selectedClassData = classes.find(c => c._id === selectedClass);
        if (selectedClassData) {
          doc.text(`Class: ${selectedClassData.class_text}`, 14, 35);
        }
      }
      
      // Statistics Section
      doc.setFontSize(14);
      doc.setTextColor(63, 81, 181);
      doc.text("Attendance Statistics", 14, 45);
      
      const statsData = [
        ["Category", "Present", "Absent", "Percentage"],
        [
          "Students", 
          stats.studentPresent,
          stats.studentAbsent,
          `${Math.round((stats.studentPresent / (stats.studentPresent + stats.studentAbsent)) * 100)}%`
        ],
        [
          "Teachers",
          stats.teacherPresent,
          stats.teacherAbsent,
          `${Math.round((stats.teacherPresent / (stats.teacherPresent + stats.teacherAbsent)) * 100)}%`
        ]
      ];
      
      autoTable(doc, {
        startY: 50,
        head: [statsData[0]],
        body: statsData.slice(1),
        margin: { top: 40 },
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { 
          fillColor: [63, 81, 181],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          3: { halign: 'right' }
        }
      });
      
      // Student Summary Section
      doc.setFontSize(14);
      doc.setTextColor(63, 81, 181);
      const statsEndY = doc.lastAutoTable.finalY + 10;
      doc.text("Student Attendance Summary", 14, statsEndY);
      
      if (studentSummary.length > 0) {
        const studentData = studentSummary.map(a => [
          a.student?.name || 'N/A',
          a.status,
          moment(a.date).format("YYYY-MM-DD")
        ]);
        
        autoTable(doc, {
          startY: statsEndY + 5,
          head: [["Name", "Status", "Date"]],
          body: studentData,
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { 
            fillColor: [76, 175, 80],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      } else {
        doc.text("No student attendance data available", 14, statsEndY + 5);
      }
      
      // Teacher Summary Section
      doc.setFontSize(14);
      doc.setTextColor(63, 81, 181);
      const studentEndY = doc.lastAutoTable?.finalY || statsEndY + 15;
      doc.text("Teacher Attendance Summary", 14, studentEndY + 10);
      
      if (teacherSummary.length > 0) {
        const teacherData = teacherSummary.map(a => [
          a.teacher?.name || 'N/A',
          a.status,
          moment(a.date).format("YYYY-MM-DD")
        ]);
        
        autoTable(doc, {
          startY: studentEndY + 15,
          head: [["Name", "Status", "Date"]],
          body: teacherData,
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { 
            fillColor: [156, 39, 176],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      } else {
        doc.text("No teacher attendance data available", 14, studentEndY + 15);
      }
      
      // Save the PDF
      doc.save(`attendance_report_${moment().format("YYYYMMDD_HHmmss")}.pdf`);
      setSuccess("PDF exported successfully");
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF");
    }
  };

  const renderStatsCard = (title, present, absent, icon, color) => {
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    const prevTotal = prevStats.studentPresent + prevStats.studentAbsent;
    const prevPercentage = prevTotal > 0 ? Math.round((prevStats.studentPresent / prevTotal) * 100) : 0;
    const diff = percentage - prevPercentage;
    
    return (
      <StatCard>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, boxShadow: 1 }}>
              {icon}
            </Avatar>
          </Box>
          <Box mt={2}>
            <Box display="flex" alignItems="flex-end">
              <Typography variant="h4" component="div">
                {percentage}%
              </Typography>
              {diff !== 0 && (
                <Box ml={1} display="flex" alignItems="center" color={diff > 0 ? COLORS.present : COLORS.absent}>
                  {diff > 0 ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                  <Typography variant="body2" fontWeight="bold">
                    {Math.abs(diff)}%
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography variant="body2" color="textSecondary">
              {present} Present / {absent} Absent
            </Typography>
          </Box>
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
              color={color}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </StatCard>
    );
  };

  const renderAttendanceTable = (data, type) => {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, 10).map((attendance) => (
              <TableRow 
                key={`${type === 'student' ? attendance.student._id : attendance.teacher._id}-${attendance.date}`}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: type === 'student' ? COLORS.primary : COLORS.secondary }}>
                      {type === 'student' ? <PeopleIcon fontSize="small" /> : <SchoolIcon fontSize="small" />}
                    </Avatar>
                    {type === 'student' ? attendance.student.name : attendance.teacher.name}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <AttendanceStatusChip status={attendance.status} />
                </TableCell>
                <TableCell align="right">
                  {moment(attendance.date).format("MMM D, YYYY")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      <Slide direction="down" in={true} timeout={500}>
        <HeaderBox>
          <Grid container alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                <DashboardIcon sx={{ verticalAlign: 'middle', mr: 2, color: "white" }} />
                Attendance Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Monitor and manage attendance records efficiently
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'right', mt: { xs: 2, md: 0 } }}>
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={<PdfIcon />}
                onClick={exportPDF}
                disabled={studentSummary.length === 0 && teacherSummary.length === 0}
                sx={{ 
                  mr: 1,
                  bgcolor: "white",
                  color: COLORS.primary,
                  fontWeight: 600,
                  "&:hover": {
                    bgcolor: "white",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                  }
                }}
              >
                Export Report
              </Button>
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={refreshData} 
                  sx={{ 
                    bgcolor: "rgba(255,255,255,0.2)", 
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.3)"
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </HeaderBox>
      </Slide>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Grow in={true} timeout={600}>
            {renderStatsCard(
              "Student Attendance", 
              stats.studentPresent, 
              stats.studentAbsent, 
              <PeopleIcon />, 
              "success"
            )}
          </Grow>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Grow in={true} timeout={800}>
            {renderStatsCard(
              "Teacher Attendance", 
              stats.teacherPresent, 
              stats.teacherAbsent, 
              <SchoolIcon />, 
              "secondary"
            )}
          </Grow>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Grow in={true} timeout={1000}>
            <StatCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark', boxShadow: 1 }}>
                    <PeopleIcon />
                  </Avatar>
                </Box>
                <Typography variant="h4" component="div">
                  {students.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedClass ? `In selected class` : 'Select a class to view students'}
                </Typography>
                <Box mt={2} height={8} bgcolor="divider" borderRadius={4} />
              </CardContent>
            </StatCard>
          </Grow>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Grow in={true} timeout={1200}>
            <StatCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Teachers
                  </Typography>
                  <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark', boxShadow: 1 }}>
                    <SchoolIcon />
                  </Avatar>
                </Box>
                <Typography variant="h4" component="div">
                  {teachers.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  All teaching staff
                </Typography>
                <Box mt={2} height={8} bgcolor="divider" borderRadius={4} />
              </CardContent>
            </StatCard>
          </Grow>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Slide direction="up" in={true} timeout={600}>
        <DashboardCard>
          <CardContent sx={{ bgcolor: COLORS.lightBlue }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <FilterIcon color="primary" sx={{ mr: 1 }} />
                Filters & Controls
              </Typography>
              <Box>
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<DateRangeIcon />}
                  onClick={() => setFilterDialogOpen(true)}
                  sx={{ mr: 1, fontWeight: 600 }}
                >
                  Advanced Filters
                </Button>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <TodayIcon color="primary" sx={{ mr: 1 }} />
                    ),
                  }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Class</InputLabel>
                  <Select
                    value={selectedClass}
                    label="Select Class"
                    onChange={(e) => setSelectedClass(e.target.value)}
                    startAdornment={
                      <ClassIcon color="primary" sx={{ mr: 1 }} />
                    }
                    variant="outlined"
                  >
                    <MenuItem value="">
                      <em>All Classes</em>
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
              <Grid item xs={12} sm={4}>
                <Box display="flex" gap={1} height="100%">
                  <Button
                    variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                    color={viewMode === 'cards' ? 'primary' : 'inherit'}
                    onClick={() => setViewMode('cards')}
                    fullWidth
                    startIcon={<DashboardIcon />}
                    sx={{ fontWeight: 600 }}
                  >
                    Cards View
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'contained' : 'outlined'}
                    color={viewMode === 'table' ? 'primary' : 'inherit'}
                    onClick={() => setViewMode('table')}
                    fullWidth
                    startIcon={<ListIcon />}
                    sx={{ fontWeight: 600 }}
                  >
                    Table View
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </DashboardCard>
      </Slide>

      {/* Tabs for Attendance Entry */}
      <DashboardCard>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{ bgcolor: COLORS.lightBlue }}
        >
          <CustomTab 
            label={
              <Box display="flex" alignItems="center">
                <PeopleIcon sx={{ mr: 1 }} />
                Student Attendance
              </Box>
            }
            disabled={!selectedClass}
          />
          <CustomTab 
            label={
              <Box display="flex" alignItems="center">
                <SchoolIcon sx={{ mr: 1 }} />
                Teacher Attendance
              </Box>
            }
          />
        </Tabs>
        <Box p={3}>
          <Fade in={true} timeout={500}>
            <Box>
              {activeTab === 0 && (
                <>
                  {selectedClass ? (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Mark attendance for {students.length} students in {classes.find(c => c._id === selectedClass)?.class_text || 'selected class'}
                      </Typography>
                      {viewMode === 'cards' ? (
                        <Grid container spacing={2}>
                          {students.map((student) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={student._id}>
                              <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                                <CardContent>
                                  <Box display="flex" alignItems="center" mb={1}>
                                    <Avatar sx={{ 
                                      width: 40, 
                                      height: 40, 
                                      mr: 2, 
                                      bgcolor: COLORS.primary,
                                      boxShadow: 1
                                    }}>
                                      {student.name.charAt(0)}
                                    </Avatar>
                                    <Typography variant="subtitle1" fontWeight={500}>{student.name}</Typography>
                                  </Box>
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={studentAttendance[student._id] || ""}
                                      onChange={(e) =>
                                        handleStudentChange(student._id, e.target.value)
                                      }
                                      displayEmpty
                                      variant="outlined"
                                    >
                                      <MenuItem value="" disabled>
                                        <em>Select status</em>
                                      </MenuItem>
                                      <MenuItem value="Present">Present</MenuItem>
                                      <MenuItem value="Absent">Absent</MenuItem>
                                    </Select>
                                  </FormControl>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
                          <Table>
                            <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {students.map((student) => (
                                <TableRow key={student._id} hover>
                                  <TableCell>
                                    <Box display="flex" alignItems="center">
                                      <Avatar sx={{ 
                                        width: 32, 
                                        height: 32, 
                                        mr: 1, 
                                        bgcolor: COLORS.primary,
                                        boxShadow: 1
                                      }}>
                                        {student.name.charAt(0)}
                                      </Avatar>
                                      {student.name}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      fullWidth
                                      size="small"
                                      value={studentAttendance[student._id] || ""}
                                      onChange={(e) =>
                                        handleStudentChange(student._id, e.target.value)
                                      }
                                      variant="outlined"
                                    >
                                      <MenuItem value="Present">Present</MenuItem>
                                      <MenuItem value="Absent">Absent</MenuItem>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <ClassIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="h6" color="textSecondary">
                        Please select a class to view students
                      </Typography>
                    </Box>
                  )}
                </>
              )}
              {activeTab === 1 && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Mark attendance for {teachers.length} teachers
                  </Typography>
                  {viewMode === 'cards' ? (
                    <Grid container spacing={2}>
                      {teachers.map((teacher) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={teacher._id}>
                          <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <CardContent>
                              <Box display="flex" alignItems="center" mb={1}>
                                <Avatar sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  mr: 2, 
                                  bgcolor: COLORS.secondary,
                                  boxShadow: 1
                                }}>
                                  {teacher.name.charAt(0)}
                                </Avatar>
                                <Typography variant="subtitle1" fontWeight={500}>{teacher.name}</Typography>
                              </Box>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={teacherAttendance[teacher._id] || ""}
                                  onChange={(e) =>
                                    handleTeacherChange(teacher._id, e.target.value)
                                  }
                                  displayEmpty
                                  variant="outlined"
                                >
                                  <MenuItem value="" disabled>
                                    <em>Select status</em>
                                  </MenuItem>
                                  <MenuItem value="Present">Present</MenuItem>
                                  <MenuItem value="Absent">Absent</MenuItem>
                                </Select>
                              </FormControl>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
                      <Table>
                        <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Teacher</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teachers.map((teacher) => (
                            <TableRow key={teacher._id} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    mr: 1, 
                                    bgcolor: COLORS.secondary,
                                    boxShadow: 1
                                  }}>
                                    {teacher.name.charAt(0)}
                                  </Avatar>
                                  {teacher.name}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Select
                                  fullWidth
                                  size="small"
                                  value={teacherAttendance[teacher._id] || ""}
                                  onChange={(e) =>
                                    handleTeacherChange(teacher._id, e.target.value)
                                  }
                                  variant="outlined"
                                >
                                  <MenuItem value="Present">Present</MenuItem>
                                  <MenuItem value="Absent">Absent</MenuItem>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </Box>
          </Fade>
        </Box>
        <Box p={2} bgcolor={theme.palette.grey[50]} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={activeTab === 0 ? submitStudentAttendance : submitTeacherAttendance}
            disabled={
              activeTab === 0 
                ? studentLoading || !date || !selectedClass || Object.keys(studentAttendance).length === 0
                : teacherLoading || !date || Object.keys(teacherAttendance).length === 0
            }
            sx={{ mr: 2, fontWeight: 600 }}
          >
            {studentLoading || teacherLoading ? (
              <CircularProgress size={24} />
            ) : (
              `Submit ${activeTab === 0 ? 'Student' : 'Teacher'} Attendance`
            )}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={submitAllAttendance}
            disabled={
              loading ||
              !date ||
              (Object.keys(studentAttendance).length === 0 )&& 
              (Object.keys(teacherAttendance).length === 0)
            }
            sx={{ fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={24} /> : "Submit All"}
          </Button>
        </Box>
      </DashboardCard>

      {/* Charts and Analytics Section */}
      <DashboardCard>
        <CardContent sx={{ bgcolor: COLORS.lightBlue }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            <ChartIcon color="primary" sx={{ mr: 1 }} />
            Analytics Dashboard
          </Typography>
        </CardContent>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: theme.palette.grey[50] }}>
            <Typography fontWeight={600}>Student Attendance Analytics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {studentLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : studentSummary.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="subtitle1" align="center" gutterBottom fontWeight={600}>
                      Attendance Trend (Last 7 Days)
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={studentSummary
                          .slice(-7)
                          .sort((a, b) => new Date(a.date) - new Date(b.date))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.present} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.present} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[300]} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => moment(date).format('MMM D')} 
                        />
                        <YAxis />
                        <ChartTooltip 
                          labelFormatter={(date) => moment(date).format('MMMM D, YYYY')}
                          contentStyle={{ borderRadius: 8, border: 'none' }}
                        />
                        <Area
                          type="monotone"
                          dataKey={d => d.status === "Present" ? 1 : 0}
                          name="Present"
                          stackId="1"
                          stroke={COLORS.present}
                          fillOpacity={1}
                          fill="url(#colorPresent)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="subtitle1" align="center" gutterBottom fontWeight={600}>
                      Student Attendance Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Present",
                              value: studentSummary.filter(
                                s => s.status === "Present"
                              ).length,
                            },
                            {
                              name: "Absent",
                              value: studentSummary.filter(
                                s => s.status === "Absent"
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
                          <Cell fill={COLORS.present} />
                          <Cell fill={COLORS.absent} />
                        </Pie>
                        <ChartTooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" align="center" gutterBottom fontWeight={600}>
                      Recent Student Attendance Records
                    </Typography>
                    {renderAttendanceTable(studentSummary, 'student')}
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <HelpIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  No student attendance data available
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Mark attendance to see analytics
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: theme.palette.grey[50] }}>
            <Typography fontWeight={600}>Teacher Attendance Analytics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {teacherLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : teacherSummary.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="subtitle1" align="center" gutterBottom fontWeight={600}>
                      Attendance by Teacher
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={getTeacherChartData().filter(d => d.name !== "Overall")}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[300]} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                        <Legend />
                        <Bar
                          dataKey="Present"
                          stackId="a"
                          fill={COLORS.present}
                          name="Present"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Absent"
                          stackId="a"
                          fill={COLORS.absent}
                          name="Absent"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                    <Typography variant="subtitle1" align="center" gutterBottom fontWeight={600}>
                      Teacher Attendance Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Present",
                              value: teacherSummary.filter(
                                t => t.status === "Present"
                              ).length,
                            },
                            {
                              name: "Absent",
                              value: teacherSummary.filter(
                                t => t.status === "Absent"
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
                          <Cell fill={COLORS.present} />
                          <Cell fill={COLORS.absent} />
                        </Pie>
                        <ChartTooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" align="center" gutterBottom fontWeight={600}>
                      Recent Teacher Attendance Records
                    </Typography>
                    {renderAttendanceTable(teacherSummary, 'teacher')}
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <HelpIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" color="textSecondary">
                  No teacher attendance data available
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Mark attendance to see analytics
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </DashboardCard>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: COLORS.lightBlue }}>
          <Box display="flex" alignItems="center">
            <FilterIcon color="primary" sx={{ mr: 1 }} />
            Advanced Filters
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                variant="outlined"
                size="small"
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
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status Filter</InputLabel>
                <Select multiple value={[]} onChange={() => {}} variant="outlined">
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // Apply filters here
              setFilterDialogOpen(false);
            }}
            sx={{ fontWeight: 600 }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

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