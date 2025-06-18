import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  TablePagination,
  Chip,
  LinearProgress,
  useMediaQuery,
  useTheme,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import {
  Assessment,
  PictureAsPdf,
  TrendingUp,
  FilterList,
  Search,
  Menu as MenuIcon,
} from "@mui/icons-material";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { saveAs } from "file-saver";
import { AuthContext } from "../../../context/AuthContext";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#00CED1",
  "#9370DB",
];

const StudentResult = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedExamination, setSelectedExamination] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [examinations, setExaminations] = useState([]);
  const [showFilters, setShowFilters] = useState(!isMobile);

  // Fetch student results and examinations
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:5000/api/results/student",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setResults(res.data.data || []);

        // Extract unique examinations
        const exams = [];
        res.data.data.forEach((result) => {
          if (
            result.examination &&
            !exams.some((e) => e._id === result.examination._id)
          ) {
            exams.push(result.examination);
          }
        });
        setExaminations(exams);
      } catch (error) {
        console.error("Error fetching results:", error);
        setSnackbar({
          open: true,
          message: "Failed to load results",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchResults();
  }, [user]);

  // Fetch performance data when tab changes
  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoadingPerformance(true);
        const response = await axios.get(
          "http://localhost:5000/api/results/student/my-detailed-performance",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setPerformanceData(response.data.data);
      } catch (error) {
        console.error("Error fetching performance:", error);
        setSnackbar({
          open: true,
          message: "Failed to load performance data",
          severity: "error",
        });
      } finally {
        setLoadingPerformance(false);
      }
    };

    if (activeTab === 1) {
      fetchPerformance();
    }
  }, [activeTab]);

  const handleExportPDF = async () => {
    if (!selectedExamination) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/api/results/export/pdf/${selectedExamination}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      saveAs(pdfBlob, `my_results_${selectedExamination}.pdf`);
    } catch (error) {
      console.error("Export error:", error);
      setSnackbar({
        open: true,
        message: "Failed to export results",
        severity: "error",
      });
    }
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.examination?.examType
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      result.subject?.subject_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesExamType = selectedExamType
      ? result.examination?.examType === selectedExamType
      : true;

    const matchesExamination = selectedExamination
      ? result.examination?._id === selectedExamination
      : true;

    return matchesSearch && matchesExamType && matchesExamination;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const renderPerformanceAnalysis = () => {
    if (!performanceData) return null;

    return (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Student Summary Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}
              >
                {performanceData.student?.name || "My Profile"}
              </Typography>
              <Typography>
                <strong>Class:</strong>{" "}
                {performanceData.student?.class?.class_text || "N/A"}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>Exams Taken:</strong> {performanceData.examCount}
              </Typography>
            </CardContent>
          </Card>

          {/* Overall Performance */}
          <Card sx={{ mt: 3, boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                Overall Performance
              </Typography>
              {Object.values(performanceData.exams || {}).map((exam, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {exam.examType} - {formatDate(exam.examDate)}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ width: "100%", mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={exam.overallPercentage}
                        color={
                          exam.overallPercentage >= 75
                            ? "success"
                            : exam.overallPercentage >= 50
                            ? "warning"
                            : "error"
                        }
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round(exam.overallPercentage)}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Subject Trends */}
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                Subject Performance Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(performanceData.subjectTrends || {}).map(
                    ([subject, data]) => ({
                      subject,
                      latest:
                        data.exams[data.exams.length - 1]?.percentage || 0,
                      average: data.averagePercentage,
                    })
                  )}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="subject"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                  <Legend />
                  <Bar dataKey="latest" name="Latest Exam" fill="#1976d2" />
                  <Bar
                    dataKey="average"
                    name="Overall Average"
                    fill="#4caf50"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          {performanceData.subjectDistribution && (
            <Card sx={{ mt: 3, boxShadow: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold", color: "#1976d2" }}
                >
                  Subject Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData.subjectDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {performanceData.subjectDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, "Exams"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Exam Details */}
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                Exam Performance Details
              </Typography>
              {Object.values(performanceData.exams || {}).map((exam, index) => (
                <Box key={index} sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}
                  >
                    {exam.examType} - {formatDate(exam.examDate)}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Paper
                        sx={{
                          p: 2,
                          backgroundColor: theme.palette.grey[100],
                          borderRadius: 2,
                          borderLeft: `4px solid ${
                            exam.overallPercentage >= 50 ? "#4caf50" : "#f44336"
                          }`,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="medium">
                          Overall
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                          {exam.overallPercentage}%
                        </Typography>
                        <Typography variant="body2">
                          {exam.totalMarks}/{exam.totalMaxMarks} Marks
                        </Typography>
                        <Chip
                          label={exam.overallPercentage >= 50 ? "PASS" : "FAIL"}
                          color={
                            exam.overallPercentage >= 50 ? "success" : "error"
                          }
                          sx={{ mt: 1, fontWeight: "bold" }}
                        />
                      </Paper>
                    </Grid>

                    {exam.subjects &&
                      exam.subjects.map((subject, idx) => (
                        <Grid item xs={12} md={3} key={idx}>
                          <Paper
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              borderLeft: `4px solid ${
                                subject.percentage >= 50 ? "#4caf50" : "#f44336"
                              }`,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight="medium">
                              {subject.subject}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {subject.marks}/{subject.maxMarks}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  mr: 1,
                                  fontWeight: "bold",
                                  color:
                                    subject.percentage >= 50
                                      ? theme.palette.success.main
                                      : theme.palette.error.main,
                                }}
                              >
                                {subject.percentage}%
                              </Typography>
                              {subject.percentage >= 50 ? (
                                <Chip
                                  label="Pass"
                                  color="success"
                                  size="small"
                                  sx={{ fontWeight: "bold" }}
                                />
                              ) : (
                                <Chip
                                  label="Fail"
                                  color="error"
                                  size="small"
                                  sx={{ fontWeight: "bold" }}
                                />
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 1 }}>
      {/* App Bar with Title */}
      <AppBar
        position="static"
        color="primary"
        sx={{
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #1976d2 30%, #2196f3 90%)",
          boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setShowFilters(!showFilters)}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h4"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            <Box component="span" sx={{ color: "#ffffff" }}>
              My
            </Box>
            <Box component="span" sx={{ color: "#ffffff", ml: 1 }}>
              Results
            </Box>
          </Typography>
          {!isMobile && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PictureAsPdf />}
              onClick={handleExportPDF}
              disabled={!selectedExamination}
              sx={{ fontWeight: "bold" }}
            >
              Export PDF
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3, background: "#f5f9ff", borderRadius: 2 }}
        variant={isMobile ? "scrollable" : "standard"}
      >
        <Tab
          label="My Results"
          icon={<Assessment />}
          sx={{ fontWeight: "bold", minHeight: 60 }}
        />
        <Tab
          label="Performance Analysis"
          icon={<TrendingUp />}
          sx={{ fontWeight: "bold", minHeight: 60 }}
        />
      </Tabs>

      {activeTab === 0 ? (
        <>
          {showFilters && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Search Exams or Subjects"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Search sx={{ mr: 1, color: "action.active" }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Exam Type"
                    value={selectedExamType}
                    onChange={(e) => setSelectedExamType(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {[...new Set(examinations.map((e) => e.examType))].map(
                      (type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      )
                    )}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Examination"
                    value={selectedExamination}
                    onChange={(e) => setSelectedExamination(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="">All Exams</MenuItem>
                    {examinations
                      .filter(
                        (e) =>
                          !selectedExamType || e.examType === selectedExamType
                      )
                      .map((exam) => (
                        <MenuItem key={exam._id} value={exam._id}>
                          {exam.subject?.subject_name} -{" "}
                          {formatDate(exam.examDate)}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>

                {isMobile && (
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PictureAsPdf />}
                      onClick={handleExportPDF}
                      disabled={!selectedExamination}
                      sx={{ fontWeight: "bold" }}
                    >
                      Export Results
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {!showFilters && isMobile && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(true)}
                sx={{ mb: 2 }}
              >
                Show Filters
              </Button>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress size={60} />
            </Box>
          ) : filteredResults.length > 0 ? (
            <>
              <TableContainer
                component={Paper}
                sx={{ borderRadius: 2, boxShadow: 3 }}
              >
                <Table>
                  <TableHead
                    sx={{
                      backgroundColor: "primary.main",
                      "& th": { fontWeight: "bold", fontSize: "1rem" },
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ color: "white" }}>Exam</TableCell>
                      <TableCell sx={{ color: "white" }}>Subject</TableCell>
                      <TableCell sx={{ color: "white" }}>Date</TableCell>
                      <TableCell sx={{ color: "white" }} align="center">
                        Marks
                      </TableCell>
                      <TableCell sx={{ color: "white" }} align="center">
                        Percentage
                      </TableCell>
                      <TableCell sx={{ color: "white" }} align="center">
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResults
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((result) => (
                        <TableRow key={result._id} hover>
                          <TableCell>
                            {result.examination?.examType || "N/A"}
                          </TableCell>
                          <TableCell>
                            {result.subject?.subject_name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatDate(result.examination?.examDate)}
                          </TableCell>
                          <TableCell align="center">
                            <Box component="span" sx={{ fontWeight: "bold" }}>
                              {result.marks}
                            </Box>{" "}
                            / {result.maxMarks}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: "bold" }}>
                            {result.percentage}%
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={result.percentage >= 50 ? "Pass" : "Fail"}
                              color={
                                result.percentage >= 50 ? "success" : "error"
                              }
                              size="small"
                              sx={{ fontWeight: "bold", minWidth: 70 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredResults.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ mt: 2 }}
              />
            </>
          ) : (
            <Paper
              sx={{ p: 4, textAlign: "center", borderRadius: 2, boxShadow: 3 }}
            >
              <Typography variant="h6" color="textSecondary">
                No results found
              </Typography>
            </Paper>
          )}
        </>
      ) : (
        <Box>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
          >
            My Performance Analysis
          </Typography>
          {loadingPerformance ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress size={60} />
            </Box>
          ) : performanceData ? (
            performanceData.examCount > 0 ? (
              renderPerformanceAnalysis()
            ) : (
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  No performance data available
                </Typography>
              </Paper>
            )
          ) : (
            <Paper
              sx={{ p: 4, textAlign: "center", borderRadius: 2, boxShadow: 3 }}
            >
              <Typography variant="h6" color="textSecondary">
                No performance data available
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", fontWeight: "bold" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentResult;
