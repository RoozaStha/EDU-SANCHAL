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
  useTheme
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
  CartesianGrid
} from "recharts";
import { AuthContext } from "../../../context/AuthContext";
import axios from "axios";
import moment from "moment";

const COLORS = ["#0088FE", "#FF8042"];

const StudentAttendance = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    moment().startOf("month").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    percentage: 0
  });

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

    // Group by date
    const groupedData = attendanceData.reduce((acc, curr) => {
      const date = moment(curr.date).format("MMM D");
      const existing = acc.find((item) => item.date === date);
      
      if (existing) {
        existing[curr.status] = (existing[curr.status] || 0) + 1;
      } else {
        acc.push({
          date,
          [curr.status]: 1
        });
      }
      return acc;
    }, []);

    return groupedData;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Attendance
      </Typography>

      {/* Date Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
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
          />
        </Grid>
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" color="textSecondary">
                    Total Days
                  </Typography>
                  <Typography variant="h4">
                    {attendanceData.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" color="textSecondary">
                    Present
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.present}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" color="textSecondary">
                    Attendance %
                  </Typography>
                  <Typography variant="h4">
                    {stats.percentage}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          {attendanceData.length > 0 ? (
            <>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                    <Typography variant="h6" align="center" gutterBottom>
                      Attendance Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Present", value: stats.present },
                            { name: "Absent", value: stats.absent }
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
                          <Cell fill={COLORS[0]} />
                          <Cell fill={COLORS[1]} />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
                    <Typography variant="h6" align="center" gutterBottom>
                      Daily Attendance
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Present" fill={COLORS[0]} />
                        <Bar dataKey="Absent" fill={COLORS[1]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Detailed Table */}
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Attendance History
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: theme.palette.grey[200] }}>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          Date
                        </th>
                        <th style={{ padding: "12px", textAlign: "left" }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((record) => (
                        <tr
                          key={record._id}
                          style={{
                            borderBottom: `1px solid ${theme.palette.divider}`
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            {moment(record.date).format("MMMM D, YYYY")}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color:
                                record.status === "Present"
                                  ? theme.palette.success.main
                                  : theme.palette.error.main
                            }}
                          >
                            {record.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            </>
          ) : (
            <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6">
                No attendance records found for the selected period
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default StudentAttendance;