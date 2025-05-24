import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Container,
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
  Checkbox,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  useTheme,
  Tooltip,
  IconButton,
  LinearProgress,
  InputAdornment,
} from "@mui/material";
import {
  Search,
  CheckCircle,
  Cancel,
  WatchLater,
  Event,
  Person,
  School,
  Refresh,
  BarChart,
  ListAlt,
  DoneAll,
  Today,
  Block,
} from "@mui/icons-material";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { baseApi } from "../../../environment";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import moment from "moment";

const Attendance = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [className, setClassName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState({});
  const [attendanceStatus, setAttendanceStatus] = useState("present");
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [classTeacher, setClassTeacher] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceTaken, setAttendanceTaken] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [todayAttendanceMarked, setTodayAttendanceMarked] = useState(false);

  // Check if today's attendance is already marked
  useEffect(() => {
    if (date === moment().format("YYYY-MM-DD")) {
      setTodayAttendanceMarked(attendanceTaken);
    } else {
      setTodayAttendanceMarked(false);
    }
  }, [date, attendanceTaken]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch classes
        const classesRes = await axios.get(`${baseApi}/class/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setClasses(classesRes.data.data || []);

        // If user is class teacher, set their class
        if (user.role === "TEACHER") {
          const teacherRes = await axios.get(
            `${baseApi}/teachers/fetch-single`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          if (teacherRes.data.data?.class) {
            setSelectedClass(teacherRes.data.data.class._id);
            setClassName(teacherRes.data.data.class.class_text);
            fetchClassAttendance(teacherRes.data.data.class._id);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch initial data");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  // Fetch class attendance data
  const fetchClassAttendance = async (classId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseApi}/attendance/class/${classId}?date=${date}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setAttendanceData(res.data.data || []);
      setClassTeacher(res.data.classTeacher || null);
      setAttendanceTaken(res.data.attendanceTaken || false);
      setClassName(res.data.className || "");
      setSelectedStudents({});
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch attendance data"
      );
      setLoading(false);
    }
  };

  // Fetch class summary
  const fetchClassSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${baseApi}/attendance/summary/${selectedClass}?fromDate=${moment()
          .startOf("month")
          .format("YYYY-MM-DD")}&toDate=${moment().format("YYYY-MM-DD")}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSummary(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch class summary");
      setLoading(false);
    }
  };

  // Handle class change
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    fetchClassAttendance(classId);

    if (activeTab === 1) {
      fetchClassSummary();
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    if (selectedClass) {
      fetchClassAttendance(selectedClass);
    }
  };

  // Handle student selection
  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  // Handle select all
  const handleSelectAll = (e) => {
    const newSelected = {};
    if (e.target.checked) {
      attendanceData.forEach((item) => {
        if (!attendanceTaken && item.status === null) {
          newSelected[item.student._id] = true;
        }
      });
    }
    setSelectedStudents(newSelected);
  };

  // Submit attendance
  const submitAttendance = async () => {
    try {
      setLoading(true);

      const records = Object.keys(selectedStudents)
        .filter((id) => selectedStudents[id])
        .map((id) => ({
          studentId: id,
          status: attendanceStatus,
          remarks: remarks,
        }));

      await axios.post(
        `${baseApi}/attendance/bulk`,
        {
          date,
          classId: selectedClass,
          records,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setSuccess(
        `Attendance marked successfully for ${records.length} students!`
      );
      setConfirmDialogOpen(false);
      fetchClassAttendance(selectedClass);
      setRemarks("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    if (newValue === 1 && selectedClass) {
      fetchClassSummary();
    }
  };

  // Filter students based on search term
  const filteredStudents = attendanceData.filter(
    (item) =>
      item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.guardianPhone?.includes(searchTerm)
  );

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle color="success" />;
      case "absent":
        return <Cancel color="error" />;
      case "late":
        return <WatchLater color="warning" />;
      case "half_day":
        return <Event color="info" />;
      case "excused":
        return <CheckCircle color="secondary" />;
      default:
        return null;
    }
  };

  // Get status chip color
  const getStatusChipColor = (status) => {
    switch (status) {
      case "present":
        return "success";
      case "absent":
        return "error";
      case "late":
        return "warning";
      case "half_day":
        return "info";
      case "excused":
        return "secondary";
      default:
        return "default";
    }
  };

  // Calculate selected count
  const selectedCount = Object.keys(selectedStudents).filter(
    (id) => selectedStudents[id]
  ).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Attendance Management {className && `- ${className}`}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab label="Mark Attendance" icon={<ListAlt />} />
        <Tab label="Class Summary" icon={<BarChart />} />
      </Tabs>

      {activeTab === 0 ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={date}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                disabled={todayAttendanceMarked}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Today />
                    </InputAdornment>
                  ),
                }}
              />
              {todayAttendanceMarked && (
                <Typography variant="caption" color="text.secondary">
                  Attendance already marked for today
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  label="Class"
                  onChange={handleClassChange}
                  disabled={user.role === "TEACHER" || todayAttendanceMarked}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.class_text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Students"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search />,
                }}
              />
            </Grid>
          </Grid>

          {classTeacher && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Class Teacher
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    src={`/images/uploaded/teacher/${classTeacher.teacher_image}`}
                    sx={{ width: 56, height: 56 }}
                  >
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {classTeacher.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {classTeacher.email}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {attendanceTaken && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Attendance already taken for this date. Contact school admin to
              make changes.
            </Alert>
          )}

          <Paper sx={{ mb: 3 }}>
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: theme.palette.grey[100],
              }}
            >
              <Typography variant="subtitle1">
                {filteredStudents.length} Students
                {selectedCount > 0 && ` (${selectedCount} selected)`}
              </Typography>

              {!attendanceTaken && selectedClass && !todayAttendanceMarked && (
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <FormControl sx={{ minWidth: 120 }} size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={attendanceStatus}
                      label="Status"
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                    >
                      <MenuItem value="present">Present</MenuItem>
                      <MenuItem value="absent">Absent</MenuItem>
                      <MenuItem value="late">Late</MenuItem>
                      <MenuItem value="half_day">Half Day</MenuItem>
                      <MenuItem value="excused">Excused</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />

                  <Tooltip
                    title={
                      selectedCount === 0
                        ? "Select students to mark attendance"
                        : ""
                    }
                  >
                    <span>
                      <Button
                        variant="contained"
                        onClick={() => setConfirmDialogOpen(true)}
                        disabled={
                          selectedCount === 0 ||
                          loading ||
                          todayAttendanceMarked
                        }
                        startIcon={
                          loading ? <CircularProgress size={20} /> : <DoneAll />
                        }
                      >
                        Mark Attendance
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
              {todayAttendanceMarked && (
                <Chip
                  icon={<Block />}
                  label="Today's attendance already marked"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={
                          filteredStudents.length > 0 &&
                          filteredStudents.every(
                            (item) =>
                              selectedStudents[item.student._id] ||
                              item.status !== null
                          )
                        }
                        indeterminate={
                          filteredStudents.some(
                            (item) => selectedStudents[item.student._id]
                          ) &&
                          !filteredStudents.every(
                            (item) =>
                              selectedStudents[item.student._id] ||
                              item.status !== null
                          )
                        }
                        onChange={handleSelectAll}
                        disabled={attendanceTaken || todayAttendanceMarked}
                      />
                    </TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Guardian Phone</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Marked By</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((item) => (
                      <TableRow key={item.student._id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={
                              !!selectedStudents[item.student._id] ||
                              item.status !== null
                            }
                            onChange={() =>
                              handleStudentSelect(item.student._id)
                            }
                            disabled={
                              item.status !== null ||
                              attendanceTaken ||
                              todayAttendanceMarked
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              src={`/images/uploaded/student/${item.student.image}`}
                              sx={{ width: 40, height: 40 }}
                            >
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography>{item.student.name}</Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {item.student.gender}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>{item.student.class}</TableCell>

                        <TableCell>{item.student.guardianPhone}</TableCell>

                        <TableCell align="center">
                          {item.status ? (
                            <Chip
                              icon={getStatusIcon(item.status)}
                              label={item.status.replace("_", " ")}
                              color={getStatusChipColor(item.status)}
                              variant="outlined"
                              sx={{ textTransform: "capitalize" }}
                            />
                          ) : (
                            <Typography color="text.secondary">
                              Not marked
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          {item.markedBy ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                src={`/images/uploaded/teacher/${item.markedBy.teacher_image}`}
                                sx={{ width: 24, height: 24 }}
                              />
                              <Typography>{item.markedBy.name}</Typography>
                            </Box>
                          ) : (
                            <Typography color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : (
        <>
          {selectedClass ? (
            <>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
              >
                <Typography variant="h6">
                  Class Attendance Summary - {className}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchClassSummary}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>

              {loading ? (
                <LinearProgress />
              ) : summary ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Class Average
                        </Typography>
                        <Typography variant="h4">
                          {summary.classAverage}%
                        </Typography>
                        <Typography variant="body2">
                          {moment(summary.dateRange.from).format("MMM D")} -{" "}
                          {moment(summary.dateRange.to).format("MMM D, YYYY")}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          {summary.totalSchoolDays} school days
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Student Attendance
                        </Typography>

                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Student</TableCell>
                                <TableCell align="right">Present</TableCell>
                                <TableCell align="right">Late</TableCell>
                                <TableCell align="right">Half Day</TableCell>
                                <TableCell align="right">Absent</TableCell>
                                <TableCell align="right">Percentage</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {summary.summary.map((student) => (
                                <TableRow key={student.studentId}>
                                  <TableCell>{student.studentName}</TableCell>
                                  <TableCell align="right">
                                    {student.presentDays}
                                  </TableCell>
                                  <TableCell align="right">
                                    {student.lateDays}
                                  </TableCell>
                                  <TableCell align="right">
                                    {student.halfDays}
                                  </TableCell>
                                  <TableCell align="right">
                                    {student.absentDays}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box
                                      sx={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      <Box sx={{ width: "50px", mr: 1 }}>
                                        <LinearProgress
                                          variant="determinate"
                                          value={student.attendancePercentage}
                                          color={
                                            student.attendancePercentage > 90
                                              ? "success"
                                              : student.attendancePercentage >
                                                75
                                              ? "primary"
                                              : student.attendancePercentage >
                                                50
                                              ? "warning"
                                              : "error"
                                          }
                                        />
                                      </Box>
                                      {student.attendancePercentage.toFixed(1)}%
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Typography>No summary data available</Typography>
              )}
            </>
          ) : (
            <Typography>Please select a class to view summary</Typography>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Attendance</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark attendance for {selectedCount}{" "}
            students as {attendanceStatus}?
          </Typography>
          {remarks && (
            <Typography sx={{ mt: 2 }}>
              <strong>Remarks:</strong> {remarks}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={submitAttendance}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Marking..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
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

export default Attendance;