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
  const [teachers, setTeachers] = React.useState([]);
  const [selectedTeacher, setSelectedTeacher] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedStudents, setSelectedStudents] = React.useState({});
  const [attendanceStatus, setAttendanceStatus] = React.useState("present");
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState("success");
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [singleStudentDialogOpen, setSingleStudentDialogOpen] =
    React.useState(false);
  const [currentStudent, setCurrentStudent] = React.useState(null);
  const [classes, setClasses] = React.useState([]);
  const [attendanceAlreadyTaken, setAttendanceAlreadyTaken] =
    React.useState(false);
  const [date, setDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceStats, setAttendanceStats] = React.useState({});
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [attendanceDetails, setAttendanceDetails] = React.useState({});

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStudents(response.data.data || []);
        const uniqueClasses = [
          ...new Set(response.data.data.map((s) => s.student_class)),
        ];
        setClasses(uniqueClasses);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch students");
        setLoading(false);
      }
    };

    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/teachers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeachers(response.data.data || []);
      } catch (err) {
        console.error("Failed to fetch teachers:", err);
      }
    };

    fetchStudents();
    fetchTeachers();
  }, []);

 React.useEffect(() => {
  const checkAttendance = async () => {
    if (filterClass && date) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/attendance/check/${filterClass}?date=${date}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAttendanceAlreadyTaken(response.data.attendanceTaken);

        if (response.data.attendanceTaken) {
          // Fetch detailed attendance for the class on this date
          const detailsResponse = await axios.get(
            `http://localhost:5000/api/attendance/class/${filterClass}?date=${date}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const attendanceMap = {};
          detailsResponse.data.data.forEach((record) => {
            attendanceMap[record.student._id] = {
              status: record.status,
              markedBy: record.markedBy?.name || "Unknown",
            };
          });

          setAttendanceDetails(attendanceMap);
        }
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
          const response = await axios.get(
            `http://localhost:5000/api/attendance/stats/${student._id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
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
      const matchesClass =
        !filterClass || student.student_class === filterClass;
      const matchesGender =
        !filterGender ||
        student.gender?.toLowerCase() === filterGender.toLowerCase();
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
    setAttendanceDetails({});
  };

  const handleOpenSingleAttendance = (student) => {
    setCurrentStudent(student);
    setSingleStudentDialogOpen(true);
  };

  const submitSingleAttendance = async () => {
    if (!currentStudent) {
      setSnackbarMessage("Please select a student");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/attendance/mark",
        {
          studentId: currentStudent._id,
          date,
          status: attendanceStatus,
          class_num: currentStudent.student_class, // Changed from class_num to class_num
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSnackbarMessage("Attendance marked successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setSingleStudentDialogOpen(false);

      // Update attendance details...
      refreshAttendanceStats();
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const submitAttendance = async () => {
    if (!selectedTeacher) {
      setSnackbarMessage("Please select a teacher taking attendance");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setConfirmDialogOpen(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const selectedIds = Object.keys(selectedStudents).filter(
        (id) => selectedStudents[id]
      );
      if (!selectedIds.length) throw new Error("No students selected");

      const records = selectedIds.map((id) => {
        const student = students.find((s) => s._id === id);
        return {
          studentId: id,
          date,
          status: attendanceStatus,
          class_num: student.student_class,
          teacherId: selectedTeacher, // Include the teacher ID
        };
      });

      await axios.post(
        "http://localhost:5000/api/attendance/mark/bulk",
        { records },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSnackbarMessage("Attendance marked successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setSelectedStudents({});

      // Update attendance details for the marked students
      const teacherName =
        teachers.find((t) => t._id === selectedTeacher)?.name || "Unknown";
      const newAttendanceDetails = { ...attendanceDetails };
      selectedIds.forEach((id) => {
        newAttendanceDetails[id] = {
          status: attendanceStatus,
          markedBy: teacherName,
        };
      });
      setAttendanceDetails(newAttendanceDetails);

      // Only set the entire class as marked if we're filtering by class
      if (filterClass) {
        setAttendanceAlreadyTaken(true);
      }

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
        const response = await axios.get(
          `http://localhost:5000/api/attendance/stats/${student._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        stats[student._id] = response.data.data?.percentage || 0;
      }
      setAttendanceStats(stats);
    } catch (err) {
      console.error("Error refreshing stats", err);
    }
  };

  const getAttendanceStatusDisplay = (studentId) => {
    if (!attendanceDetails[studentId]) return "Not marked";
    return `${attendanceDetails[studentId].status} (by ${attendanceDetails[studentId].markedBy})`;
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Student Attendance
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={handleDateChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Teacher Taking Attendance</InputLabel>
          <Select
            value={selectedTeacher}
            label="Teacher Taking Attendance"
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            <MenuItem value="">
              <em>Select Teacher</em>
            </MenuItem>
            {teachers.map((teacher) => (
              <MenuItem key={teacher._id} value={teacher._id}>
                {teacher.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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
              setAttendanceDetails({});
            }}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {classes.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
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
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
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
            loading ||
            !selectedTeacher ||
            !filterClass ||
            Object.keys(selectedStudents).length === 0
          }
        >
          {loading ? <CircularProgress size={24} /> : "Submit Bulk Attendance"}
        </Button>
      </Box>

      {attendanceAlreadyTaken && (
        <Typography color="warning.main" sx={{ mb: 2 }}>
          Attendance already taken for this class on this date. You can still
          update individual records.
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
                    Object.keys(selectedStudents).length <
                      filteredStudents.length
                  }
                  checked={
                    filteredStudents.length > 0 &&
                    Object.keys(selectedStudents).length ===
                      filteredStudents.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Name
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Gender
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Guardian Phone
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Class
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Attendance Status
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Attendance %
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student._id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={!!selectedStudents[student._id]}
                      onChange={() => handleStudentSelect(student._id)}
                    />
                  </TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell>{student.guardian_phone}</TableCell>
                  <TableCell>{student.student_class}</TableCell>
                  <TableCell>
                    {getAttendanceStatusDisplay(student._id)}
                  </TableCell>
                  <TableCell>
                    {loadingStats ? (
                      <CircularProgress size={20} />
                    ) : (
                      `${attendanceStats[student._id]?.toFixed(2) || "0.00"}%`
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenSingleAttendance(student)}
                    >
                      Mark
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for marking single student attendance */}
      <Dialog
        open={singleStudentDialogOpen}
        onClose={() => setSingleStudentDialogOpen(false)}
      >
        <DialogTitle>Mark Attendance</DialogTitle>
        <DialogContent>
          {currentStudent && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                Student: {currentStudent.name}
              </Typography>
              <Typography variant="body2">
                Class: {currentStudent.student_class}
              </Typography>
              <Typography variant="body2">Date: {date}</Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={selectedTeacher}
                  label="Teacher"
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select Teacher</em>
                  </MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSingleStudentDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submitSingleAttendance} color="primary">
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for confirming bulk attendance */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Attendance Submission</DialogTitle>
        <DialogContent>
          <Typography>
            Confirm marking{" "}
            {Object.values(selectedStudents).filter(Boolean).length} students as{" "}
            {attendanceStatus} for {date}?
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Teacher:{" "}
            {teachers.find((t) => t._id === selectedTeacher)?.name ||
              "Not selected"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitAttendance} color="primary">
            {loading ? <CircularProgress size={24} /> : "Confirm"}
          </Button>
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
