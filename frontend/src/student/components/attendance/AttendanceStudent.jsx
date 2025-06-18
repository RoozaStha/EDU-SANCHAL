import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Box,
  Paper,
  CircularProgress,
  Divider,
  useTheme,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  AppBar,
  Toolbar,
  Avatar,
  LinearProgress,
  Chip,
  IconButton
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
  LabelList
} from "recharts";
import { AuthContext } from "../../../context/AuthContext";
import axios from "axios";
import moment from "moment";
import { 
  Event as EventIcon, 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  ArrowDropDown as ArrowDropDownIcon
} from "@mui/icons-material";

const COLORS = ["#4caf50", "#f44336", "#2196f3", "#ff9800", "#9c27b0"];

const StudentAttendance = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    moment().subtract(1, 'months').format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    percentage: 0
  });
  const [expandedChart, setExpandedChart] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, [startDate, endDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/attendance/student/summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          params: {
            studentId: user.id,
            startDate,
            endDate
          }
        }
      );

      const data = response.data.data || [];
      setAttendanceData(data);

      // Calculate stats
      const present = data.filter((d) => d.status === "Present").length;
      const absent = data.filter((d) => d.status === "Absent").length;
      const percentage = Math.round((present / data.length) * 100) || 0;

      setStats({
        present,
        absent,
        percentage
      });
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const getChartData = () => {
    if (!attendanceData.length) return [];

    return attendanceData.map(record => ({
      date: moment(record.date).format("MMM D"),
      status: record.status,
      Present: record.status === "Present" ? 1 : 0,
      Absent: record.status === "Absent" ? 1 : 0
    }));
  };

  const pieData = [
    { name: "Present", value: stats.present, icon: <CheckCircleIcon /> },
    { name: "Absent", value: stats.absent, icon: <CancelIcon /> }
  ];

  const getStatusColor = (status) => {
    return status === "Present" ? theme.palette.success.main : theme.palette.error.main;
  };

  return (
    <Box sx={{ pb: 4, background: theme.palette.background.default, minHeight: "100vh" }}>
      {/* Modern Header */}
      <AppBar 
        position="static" 
        color="inherit"
        elevation={0}
        sx={{ 
          background: 'linear-gradient(45deg, #1976d2 0%, #2196f3 100%)',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          mb: 4,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Toolbar>
          <Avatar sx={{ 
            bgcolor: 'white', 
            mr: 2,
            width: 48,
            height: 48,
            color: theme.palette.primary.main
          }}>
            <EventIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                color: 'white',
                letterSpacing: 0.5
              }}
            >
              Attendance Dashboard
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 500, 
                color: 'rgba(255, 255, 255, 0.8)',
                mt: -0.5
              }}
            >
              Track and analyze your attendance records
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        {/* Date Filters with modern design */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 4,
            background: theme.palette.background.paper,
            boxShadow: theme.shadows[3]
          }}
        >
          <Box display="flex" alignItems="center" mb={2}>
            <CalendarIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Select Date Range</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ color: theme.palette.text.secondary, mr: 1 }}>
                      <CalendarIcon fontSize="small" />
                    </Box>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ color: theme.palette.text.secondary, mr: 1 }}>
                      <CalendarIcon fontSize="small" />
                    </Box>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" justifyContent="flex-end" height="100%">
                <Chip 
                  label={`${stats.percentage}% Overall Attendance`} 
                  color="primary" 
                  variant="outlined"
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '1rem',
                    px: 2,
                    py: 1
                  }} 
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" my={8}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <>
            {/* Summary Cards with modern design */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                    color: 'white',
                    height: '100%',
                    boxShadow: theme.shadows[4]
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                          Total Days Tracked
                        </Typography>
                        <Typography variant="h2" sx={{ fontWeight: 800, mt: 1 }}>
                          {attendanceData.length}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <EventIcon fontSize="large" />
                      </Avatar>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={100} 
                      sx={{ 
                        mt: 3, 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'white'
                        }
                      }} 
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                    color: 'white',
                    height: '100%',
                    boxShadow: theme.shadows[4]
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                          Present Days
                        </Typography>
                        <Typography variant="h2" sx={{ fontWeight: 800, mt: 1 }}>
                          {stats.present}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <CheckCircleIcon fontSize="large" />
                      </Avatar>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.percentage} 
                      sx={{ 
                        mt: 3, 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'white'
                        }
                      }} 
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
                    color: 'white',
                    height: '100%',
                    boxShadow: theme.shadows[4]
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                          Absent Days
                        </Typography>
                        <Typography variant="h2" sx={{ fontWeight: 800, mt: 1 }}>
                          {stats.absent}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        <CancelIcon fontSize="large" />
                      </Avatar>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.absent / attendanceData.length) * 100 || 0} 
                      sx={{ 
                        mt: 3, 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'white'
                        }
                      }} 
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 4,
                background: theme.palette.background.paper,
                boxShadow: theme.shadows[3]
              }}
            >
              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                mb={3}
                sx={{ cursor: 'pointer' }}
                onClick={() => setExpandedChart(!expandedChart)}
              >
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Attendance Visualization
                </Typography>
                <IconButton>
                  <ArrowDropDownIcon sx={{ 
                    transform: expandedChart ? 'rotate(0deg)' : 'rotate(-90deg)', 
                    transition: 'transform 0.3s' 
                  }} />
                </IconButton>
              </Box>
              
              {expandedChart && attendanceData.length > 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 320 }}>
                      <Typography variant="subtitle1" align="center" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                        Attendance Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                            <LabelList 
                              dataKey="value" 
                              position="outside" 
                              formatter={(value) => `${value} days`}
                              fill={theme.palette.text.primary}
                            />
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} days`, name]} 
                            contentStyle={{ 
                              borderRadius: 12,
                              border: 'none',
                              boxShadow: theme.shadows[3]
                            }}
                          />
                          <Legend 
                            layout="horizontal" 
                            verticalAlign="bottom" 
                            align="center" 
                            iconType="circle"
                            iconSize={12}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 320 }}>
                      <Typography variant="subtitle1" align="center" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
                        Daily Attendance Trend
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                          <YAxis 
                            domain={[0, 1]} 
                            ticks={[0, 1]}
                            stroke={theme.palette.text.secondary}
                            tickFormatter={(value) => value === 1 ? 'Present' : 'Absent'}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'Present' ? 'Present' : 'Absent', 
                              ''
                            ]}
                            contentStyle={{ 
                              borderRadius: 12,
                              border: 'none',
                              boxShadow: theme.shadows[3]
                            }}
                          />
                          <Bar 
                            dataKey="Present" 
                            fill={COLORS[0]} 
                            barSize={20} 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="Absent" 
                            fill={COLORS[1]} 
                            barSize={20} 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Detailed Table */}
            {attendanceData.length > 0 ? (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 4,
                  background: theme.palette.background.paper,
                  boxShadow: theme.shadows[3]
                }}
              >
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  <Box component="span" sx={{ borderBottom: `3px solid ${theme.palette.primary.main}`, pb: 0.5 }}>
                    Attendance History
                  </Box>
                </Typography>
                <TableContainer sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Table stickyHeader size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          fontWeight: 600,
                          backgroundColor: theme.palette.grey[100],
                          fontSize: '1rem',
                          py: 2
                        }}>
                          Date
                        </TableCell>
                        <TableCell 
                          align="center" 
                          sx={{ 
                            fontWeight: 600,
                            backgroundColor: theme.palette.grey[100],
                            fontSize: '1rem',
                            py: 2
                          }}
                        >
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceData.map((record) => (
                        <TableRow 
                          hover 
                          key={record._id}
                          sx={{ 
                            '&:nth-of-type(odd)': {
                              backgroundColor: theme.palette.action.hover
                            }
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Box display="flex" alignItems="center">
                              <CalendarIcon 
                                fontSize="small" 
                                sx={{ 
                                  color: theme.palette.text.secondary, 
                                  mr: 1.5 
                                }} 
                              />
                              {moment(record.date).format("ddd, MMM D, YYYY")}
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2 }}>
                            <Chip
                              label={record.status}
                              size="medium"
                              sx={{
                                fontWeight: 600,
                                backgroundColor: record.status === "Present" 
                                  ? theme.palette.success.light 
                                  : theme.palette.error.light,
                                color: record.status === "Present" 
                                  ? theme.palette.success.dark 
                                  : theme.palette.error.dark,
                                px: 2,
                                minWidth: 100
                              }}
                              icon={record.status === "Present" ? 
                                <CheckCircleIcon fontSize="small" /> : 
                                <CancelIcon fontSize="small" />
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 6, 
                  textAlign: "center", 
                  borderRadius: 4,
                  background: theme.palette.background.paper,
                  boxShadow: theme.shadows[3]
                }}
              >
                <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/4076/4076392.png" 
                    alt="No records" 
                    style={{ width: 120, height: 120, opacity: 0.7, marginBottom: 20 }} 
                  />
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    No Attendance Records Found
                  </Typography>
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                    We couldn't find any attendance records for the selected date range.
                  </Typography>
                  <Chip 
                    label="Try adjusting your date filters" 
                    color="primary" 
                    variant="outlined"
                    sx={{ px: 2, py: 1, fontWeight: 500 }}
                  />
                </Box>
              </Paper>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default StudentAttendance;