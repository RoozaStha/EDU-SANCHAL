import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Chip,
  useTheme,
  InputAdornment,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Avatar,
  Badge
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Search,
  Today,
  CalendarMonth,
  Person,
  CheckCircle,
  Cancel,
  WatchLater,
  AccessTime,
  BeachAccess,
  Refresh,
  ArrowBack,
  ArrowForward,
  FilterList
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import axios from 'axios';
import { baseApi } from '../../../environment';
import { AuthContext } from "../../../context/AuthContext";

const TeacherAttendance = () => {
  const theme = useTheme();
  const { user} = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openMarkDialog, setOpenMarkDialog] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [remarks, setRemarks] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [summaryData, setSummaryData] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Status options with icons and colors
  const statusOptions = [
    { value: 'Present', label: 'Present', icon: <CheckCircle color="success" />, color: 'success' },
    { value: 'Absent', label: 'Absent', icon: <Cancel color="error" />, color: 'error' },
    { value: 'Late', label: 'Late', icon: <WatchLater color="warning" />, color: 'warning' },
    { value: 'Half Day', label: 'Half Day', icon: <AccessTime color="info" />, color: 'info' },
    { value: 'On Leave', label: 'On Leave', icon: <BeachAccess color="secondary" />, color: 'secondary' }
  ];

  // Fetch all teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/teachers/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTeachers(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch teachers');
      setLoading(false);
    }
  };

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      let url = `${baseApi}/attendance/teacher`;
      
      if (selectedTeacher) {
        url += `?teacherId=${selectedTeacher}`;
      } else if (user.role === 'TEACHER') {
        url += `?teacherId=${user.id}`;
      }

      // Add date range for monthly view
      if (activeTab === 1) {
        const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        url += `${selectedTeacher || user.role === 'TEACHER' ? '&' : '?'}startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAttendanceRecords(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
      setLoading(false);
    }
  };

  // Fetch attendance summary
  const fetchAttendanceSummary = async () => {
    try {
      setLoading(true);
      const teacherId = selectedTeacher || (user.role === 'TEACHER' ? user.id : null);
      if (!teacherId) return;

      const response = await axios.get(`${baseApi}/attendance/teacher/summary?teacherId=${teacherId}&periodType=Monthly`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSummaryData(response.data.data[0] || null);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance summary');
      setLoading(false);
    }
  };

  // Mark attendance
  const markAttendance = async () => {
    try {
      setLoading(true);
      const teacherId = selectedTeacher || user.id;
      const data = {
        teacherId,
        status: attendanceStatus,
        remarks
      };

      await axios.post(`${baseApi}/attendance/teacher`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess('Attendance marked successfully');
      setOpenMarkDialog(false);
      fetchAttendanceRecords();
      fetchAttendanceSummary();
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
      setLoading(false);
    }
  };

  // Initialize calendar days for monthly view
  const initCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    setCalendarDays(days);
  };

  // Filter attendance records based on search and status
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesStatus = filterStatus === 'All' || record.status === filterStatus;
    
    if (!selectedTeacher && user.role !== 'TEACHER') {
      const teacher = teachers.find(t => t._id === record.teacher);
      const matchesSearch = teacher && 
        (teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    }
    return matchesStatus;
  });

  // Get teacher name by ID
  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.icon : null;
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle month navigation
  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentMonth(newMonth);
  };

  // Initialize data
  useEffect(() => {
    fetchTeachers();
    initCalendarDays();
  }, []);

  // Fetch data when dependencies change
  useEffect(() => {
    if (activeTab === 0) {
      fetchAttendanceRecords();
    } else {
      fetchAttendanceRecords();
      fetchAttendanceSummary();
    }
  }, [selectedTeacher, currentMonth, activeTab]);

  // Reinitialize calendar when month changes
  useEffect(() => {
    initCalendarDays();
  }, [currentMonth]);

  // Close snackbar
  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Teacher Attendance Management
      </Typography>

      {loading && <LinearProgress />}

      {/* Error/Success Messages */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>

      {/* Teacher Selection (for School role) */}
      {user.role === 'SCHOOL' && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Teacher</InputLabel>
            <Select
              value={selectedTeacher || ''}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              label="Select Teacher"
              sx={{ minWidth: 250 }}
            >
              <MenuItem value="">
                <em>All Teachers</em>
              </MenuItem>
              {teachers.map((teacher) => (
                <MenuItem key={teacher._id} value={teacher._id}>
                  {teacher.name} ({teacher.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Daily View" icon={<Today />} />
          <Tab label="Monthly Summary" icon={<CalendarMonth />} />
        </Tabs>
      </Box>

      {/* Daily View */}
      {activeTab === 0 && (
        <Box>
          {/* Action Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search teachers..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!!selectedTeacher || user.role === 'TEACHER'}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="All">All Statuses</MenuItem>
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenMarkDialog(true)}
                disabled={user.role === 'SCHOOL' && !selectedTeacher}
              >
                Mark Attendance
              </Button>
            </Box>
          </Box>

          {/* Attendance Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {(!selectedTeacher && user.role !== 'TEACHER') && (
                    <TableCell>Teacher</TableCell>
                  )}
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Marked By</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record._id}>
                      {(!selectedTeacher && user.role !== 'TEACHER') && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={`/images/uploaded/teacher/${record.teacher_details?.teacher_image}`}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography>{getTeacherName(record.teacher)}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {record.teacher_details?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(record.status)}
                          label={record.status}
                          color={statusOptions.find(opt => opt.value === record.status)?.color || 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{record.marked_by}</TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                      <TableCell>
                        <IconButton color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No attendance records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Monthly View */}
      {activeTab === 1 && (
        <Box>
          {/* Month Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => handleMonthChange('prev')}
            >
              Previous
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => handleMonthChange('next')}
            >
              Next
            </Button>
          </Box>

          {/* Summary Card */}
          {summaryData && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Summary for {format(currentMonth, 'MMMM yyyy')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2">Total Days</Typography>
                      <Typography variant="h4">{summaryData.total_days}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2">Present Days</Typography>
                      <Typography variant="h4" color="success.main">
                        {summaryData.present_days}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2">Absent Days</Typography>
                      <Typography variant="h4" color="error.main">
                        {summaryData.absent_days}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2">Attendance %</Typography>
                      <Typography variant="h4">
                        {summaryData.attendance_percentage}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Calendar View */}
          <Grid container spacing={2}>
            {calendarDays.map((day) => {
              const dayRecords = attendanceRecords.filter(
                record => format(new Date(record.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
              );
              const status = dayRecords[0]?.status || 'Not Marked';
              const isCurrentDay = isToday(day);

              return (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={day}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: isCurrentDay ? `2px solid ${theme.palette.primary.main}` : 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                    onClick={() => {
                      setSelectedDate(day);
                      if (dayRecords.length > 0) {
                        // TODO: Open edit dialog
                      } else {
                        setOpenMarkDialog(true);
                      }
                    }}
                  >
                    <Typography variant="subtitle2">
                      {format(day, 'EEE')}
                    </Typography>
                    <Typography variant="h6">
                      {format(day, 'd')}
                    </Typography>
                    {status !== 'Not Marked' ? (
                      <Chip
                        label={status}
                        size="small"
                        color={statusOptions.find(opt => opt.value === status)?.color || 'default'}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Not marked
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {/* Attendance Details */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Details
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Marked By</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(record.status)}
                            label={record.status}
                            color={statusOptions.find(opt => opt.value === record.status)?.color || 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{record.marked_by}</TableCell>
                        <TableCell>{record.remarks || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body1" color="text.secondary">
                          No attendance records found for this month
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}

      {/* Mark Attendance Dialog */}
      <Dialog
        open={openMarkDialog}
        onClose={() => setOpenMarkDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedDate ? `Mark Attendance for ${format(selectedDate, 'PP')}` : 'Mark Attendance'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Remarks"
              multiline
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMarkDialog(false)}>Cancel</Button>
          <Button
            onClick={markAttendance}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            Mark Attendance
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherAttendance;