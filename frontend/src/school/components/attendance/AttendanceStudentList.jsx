import * as React from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Checkbox,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

export default function AttendanceStudentList() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterClass, setFilterClass] = React.useState("");
  const [filterGender, setFilterGender] = React.useState("");
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedStudents, setSelectedStudents] = React.useState({});
  const [attendanceStatus, setAttendanceStatus] = React.useState("present");
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("success");
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [classes, setClasses] = React.useState([]);
  const [attendanceAlreadyTaken, setAttendanceAlreadyTaken] = React.useState(false);
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [attendanceStats, setAttendanceStats] = React.useState({});
  const [loadingStats, setLoadingStats] = React.useState(false);

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStudents(response.data.data || []);
        const uniqueClasses = [...new Set(response.data.data.map(s => s.student_class))];
        setClasses(uniqueClasses);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch students");
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  React.useEffect(() => {
    const checkAttendance = async () => {
      if (filterClass && date) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`http://localhost:5000/api/attendance/check/${filterClass}?date=${date}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAttendanceAlreadyTaken(response.data.attendanceTaken);
        } catch (err) {
          setSnackbarMessage("Error checking attendance status");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        }
      }
    };

    checkAttendance();
  }, [filterClass, date]);

  React.useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (!students.length) return;
      setLoadingStats(true);
      const stats = {};
      const token = localStorage.getItem("token");

      try {
        for (const student of students) {
          const response = await axios.get(`http://localhost:5000/api/attendance/stats/${student._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          stats[student._id] = response.data.data?.percentage || 0;
        }
        setAttendanceStats(stats);
      } catch (err) {
        console.error("Error fetching stats", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchAttendanceStats();
  }, [students]);

  const filteredStudents = React.useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchTerm === "" ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardian_phone?.includes(searchTerm);
      const matchesClass = !filterClass || student.student_class === filterClass;
      const matchesGender = !filterGender || (student.gender?.toLowerCase() === filterGender.toLowerCase());
      return matchesSearch && matchesClass && matchesGender;
    });
  }, [students, searchTerm, filterClass, filterGender]);

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSelectAll = (event) => {
    const newSelected = {};
    if (event.target.checked) {
      filteredStudents.forEach((s) => (newSelected[s._id] = true));
    }
    setSelectedStudents(newSelected);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setAttendanceAlreadyTaken(false);
    setSelectedStudents({});
  };

  const submitAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const selectedIds = Object.keys(selectedStudents).filter((id) => selectedStudents[id]);
      if (!selectedIds.length) throw new Error("No students selected");

      const records = selectedIds.map((id) => {
        const student = students.find((s) => s._id === id);
        return {
          studentId: id,
          date,
          status: attendanceStatus,
          classId: student.student_class,
        };
      });

      await axios.post("http://localhost:5000/api/attendance/mark/bulk", { records }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSnackbarMessage("Attendance marked successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setSelectedStudents({});
      setAttendanceAlreadyTaken(true);
      refreshAttendanceStats();
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  const refreshAttendanceStats = async () => {
    const stats = {};
    const token = localStorage.getItem("token");

    try {
      for (const student of students) {
        const response = await axios.get(`http://localhost:5000/api/attendance/stats/${student._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        stats[student._id] = response.data.data?.percentage || 0;
      }
      setAttendanceStats(stats);
    } catch (err) {
      console.error("Error refreshing stats", err);
    }
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Student Attendance</Typography>

      <TextField
        label="Date"
        type="date"
        value={date}
        onChange={handleDateChange}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          label="Search by Name or Phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ endAdornment: <SearchIcon /> }}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Class</InputLabel>
          <Select
            value={filterClass}
            label="Class"
            onChange={(e) => {
              setFilterClass(e.target.value);
              setSelectedStudents({});
            }}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {classes.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={filterGender}
            label="Gender"
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={attendanceStatus}
            label="Status"
            onChange={(e) => setAttendanceStatus(e.target.value)}
          >
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
            <MenuItem value="excused">Excused</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={() => setConfirmDialogOpen(true)}
          disabled={
            loading || attendanceAlreadyTaken || !filterClass ||
            Object.keys(selectedStudents).length === 0
          }
        >
          {loading ? <CircularProgress size={24} /> : "Submit Attendance"}
        </Button>
      </Box>

      {attendanceAlreadyTaken && (
        <Typography color="error" sx={{ mb: 2 }}>
          Attendance already taken for this date
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={
                    Object.keys(selectedStudents).length > 0 &&
                    Object.keys(selectedStudents).length < filteredStudents.length
                  }
                  checked={
                    filteredStudents.length > 0 &&
                    Object.keys(selectedStudents).length === filteredStudents.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Gender</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Guardian Phone</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Class</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Attendance %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
              </TableRow>
            ) : filteredStudents.map((student) => (
              <TableRow key={student._id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={!!selectedStudents[student._id]}
                    onChange={() => handleStudentSelect(student._id)}
                    disabled={attendanceAlreadyTaken}
                  />
                </TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.gender}</TableCell>
                <TableCell>{student.guardian_phone}</TableCell>
                <TableCell>{student.student_class}</TableCell>
                <TableCell>
                  {loadingStats ? <CircularProgress size={20} /> : `${attendanceStats[student._id]?.toFixed(2) || "0.00"}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Attendance Submission</DialogTitle>
        <DialogContent>
          <Typography>
            Confirm marking {Object.values(selectedStudents).filter(Boolean).length} students as {attendanceStatus} for {date}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitAttendance} color="primary">{loading ? <CircularProgress size={24} /> : "Confirm"}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

