import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Card,
  CardContent,
  TablePagination,
  Chip,
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Save,
  Cancel,
  Delete,
  Assessment,
  PictureAsPdf,
  BarChart,
  TrendingUp,
} from "@mui/icons-material";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { saveAs } from "file-saver";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const examTypeOptions = [
  "1st Term Exam",
  "2nd Term Exam",
  "3rd Term Exam",
  "Final Term Exam",
];

const SchoolResult = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState(0);

  // Add missing handleTabChange function
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // State variables
  const [examinations, setExaminations] = useState([]);
  const [filteredExaminations, setFilteredExaminations] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedExamination, setSelectedExamination] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(null);
  const [tempResult, setTempResult] = useState({});
  const [addResultDialog, setAddResultDialog] = useState(false);
  const [classSubjects, setClassSubjects] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [newResult, setNewResult] = useState({
    student: "",
    subject: "",
    marks: "",
    maxMarks: "",
    remarks: "",
  });

  // State for student performance analysis
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [selectedClassForAnalysis, setSelectedClassForAnalysis] = useState("");
  const [selectedStudentForAnalysis, setSelectedStudentForAnalysis] =
    useState("");

  // Fetch classes and students
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/class/all",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setClasses(response.data.data);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setSnackbar({
          open: true,
          message: "Failed to load classes",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/students/all",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setStudents(response.data.data);
      } catch (error) {
        console.error("Error fetching students:", error);
        setSnackbar({
          open: true,
          message: "Failed to load students",
          severity: "error",
        });
      }
    };

    fetchClasses();
    fetchStudents();
  }, []);

  // Fetch examinations when component mounts
  useEffect(() => {
    const fetchAllExaminations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/examination/all",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setExaminations(response.data.examinations || []);
      } catch (error) {
        console.error("Error fetching examinations:", error);
        setSnackbar({
          open: true,
          message: "Failed to load examinations",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllExaminations();
  }, []);

  // Filter examinations based on selected exam type
  useEffect(() => {
    if (selectedExamType) {
      const filtered = examinations.filter(
        (exam) => exam.examType === selectedExamType
      );
      setFilteredExaminations(filtered);

      // Get unique classes from filtered examinations
      const uniqueClasses = [
        ...new Set(filtered.map((exam) => exam.class._id)),
      ];
      setSelectedClass(uniqueClasses.length > 0 ? uniqueClasses[0] : "");
    } else {
      setFilteredExaminations([]);
      setSelectedClass("");
    }
  }, [selectedExamType, examinations]);

  // Filter examinations for selected class
  useEffect(() => {
    if (selectedClass && selectedExamType) {
      const classExams = filteredExaminations.filter(
        (exam) => exam.class._id === selectedClass
      );
      setSelectedExamination(classExams.length > 0 ? classExams[0]._id : "");
    } else {
      setSelectedExamination("");
    }
  }, [selectedClass, filteredExaminations]);

  // Fetch subjects for a class
  const fetchSubjectsByClass = async (classId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/results/subjects/${classId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setClassSubjects(response.data.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSnackbar({
        open: true,
        message: "Failed to load subjects",
        severity: "error",
      });
    }
  };

  // Fetch results when examination is selected
  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedExamination) return;

      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/results/examination/${selectedExamination}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setResults(res.data.data);
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

    fetchResults();
  }, [selectedExamination]);

  // Fetch analytics when examination is selected
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedExamination) return;

      try {
        const res = await axios.get(
          `http://localhost:5000/api/results/analytics/${selectedExamination}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setAnalytics(res.data.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, [selectedExamination, results]);

  // Fetch subjects when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchSubjectsByClass(selectedClass);
    }
  }, [selectedClass]);

  // Fetch detailed student performance
  const fetchStudentPerformance = async (studentId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/results/student-performance/${studentId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setStudentPerformance(response.data.data);
    } catch (error) {
      console.error("Error fetching student performance:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || "Failed to load student performance",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enter edit mode for a result
  const handleEdit = (result) => {
    setEditMode(result._id);
    setTempResult({
      marks: result.marks,
      maxMarks: result.maxMarks,
      remarks: result.remarks || "",
    });
  };

  // Handle temporary changes during edit
  const handleTempChange = (e) => {
    setTempResult({ ...tempResult, [e.target.name]: e.target.value });
  };

  // Save edited result
  const handleSaveEdit = async (resultId) => {
    try {
      setLoading(true);
      await axios.patch(
        `http://localhost:5000/api/results/${resultId}`,
        tempResult,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setEditMode(null);
      // Refresh results
      const res = await axios.get(
        `http://localhost:5000/api/results/examination/${selectedExamination}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setResults(res.data.data);
    } catch (error) {
      console.error("Update error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update result",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditMode(null);
  };

  // Delete a result
  const handleDeleteResult = async (resultId) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/results/${resultId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Refresh results
      const res = await axios.get(
        `http://localhost:5000/api/results/examination/${selectedExamination}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setResults(res.data.data);
    } catch (error) {
      console.error("Delete error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete result",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open add result dialog
  const openAddResultDialog = () => {
    setAddResultDialog(true);
    setNewResult({
      student: selectedStudent || "",
      subject: currentExam?.subject?._id || "",
      marks: "",
      maxMarks: currentExam?.subject?.maxMarks || 100,
      remarks: "",
    });
  };

  // Handle new result changes
  const handleNewResultChange = (e) => {
    setNewResult({ ...newResult, [e.target.name]: e.target.value });
  };

  // Submit new result
  const handleAddResult = async () => {
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:5000/api/results",
        {
          examinationId: selectedExamination,
          studentId: newResult.student,
          subjectId: newResult.subject,
          marks: Number(newResult.marks),
          maxMarks: Number(newResult.maxMarks),
          remarks: newResult.remarks,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setAddResultDialog(false);
      setSnackbar({
        open: true,
        message: "Result added successfully!",
        severity: "success",
      });

      // Refresh results
      const res = await axios.get(
        `http://localhost:5000/api/results/examination/${selectedExamination}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setResults(res.data.data);
    } catch (error) {
      console.error("Error adding result:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to add result",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/results/export/pdf/${selectedExamination}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      saveAs(pdfBlob, `results_${selectedExamination}.pdf`);
    } catch (error) {
      console.error("Export error:", error);
      setSnackbar({
        open: true,
        message: "Failed to export results",
        severity: "error",
      });
    }
  };

  // Filter results based on search term
  const filteredResults = results.filter((result) => {
    const studentName = result.student?.name?.toLowerCase() || "";
    const subjectName = result.subject?.subject_name?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return studentName.includes(search) || subjectName.includes(search);
  });

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Format date
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

  // Get selected examination object
  const currentExam = filteredExaminations.find(
    (exam) => exam._id === selectedExamination
  );

  return (
    <Box sx={{ p: isMobile ? 2 : 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Exam Results Management
      </Typography>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Examination Results" icon={<Assessment />} />
        <Tab label="Analysis Dashboard" icon={<BarChart />} />
        <Tab label="Student Analysis" icon={<TrendingUp />} />
      </Tabs>

      {/* Examination Results Tab */}
      {activeTab === 0 && (
        <>
          {/* Controls Section */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Exam Type Selection */}
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Select Exam Type"
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="" disabled>
                    Choose exam type
                  </MenuItem>
                  {examTypeOptions.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Class Selection */}
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Select Class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={!selectedExamType || loading}
                >
                  <MenuItem value="" disabled>
                    Choose a class
                  </MenuItem>
                  {[
                    ...new Set(
                      filteredExaminations.map((exam) => exam.class._id)
                    ),
                  ]
                    .map((classId) => {
                      const cls = classes.find((c) => c._id === classId);
                      return cls ? (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.class_text}
                        </MenuItem>
                      ) : null;
                    })
                    .filter(Boolean)}
                </TextField>
              </Grid>

              {/* Examination Selection */}
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Select Examination"
                  value={selectedExamination}
                  onChange={(e) => setSelectedExamination(e.target.value)}
                  disabled={!selectedClass || loading}
                >
                  <MenuItem value="" disabled>
                    Choose an examination
                  </MenuItem>
                  {filteredExaminations
                    .filter((exam) => exam.class._id === selectedClass)
                    .map((exam) => (
                      <MenuItem key={exam._id} value={exam._id}>
                        {exam.subject.subject_name} -{" "}
                        {formatDate(exam.examDate)}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              {/* Student Selection */}
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Select Student"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={!selectedExamination || loading}
                >
                  <MenuItem value="" disabled>
                    Choose a student
                  </MenuItem>
                  {students
                    .filter(
                      (student) =>
                        student.student_class?._id === selectedClass
                    )
                    .map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              <Grid
                item
                xs={12}
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "flex-end",
                  mt: 2,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openAddResultDialog}
                  disabled={!selectedStudent || !selectedExamination || loading}
                >
                  Add Result
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={handleExportPDF}
                  disabled={!selectedExamination || loading}
                >
                  PDF Export
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Exam Details */}
          {currentExam && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">
                    <strong>Subject:</strong>{" "}
                    {currentExam.subject?.subject_name || "Unknown"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">
                    <strong>Date:</strong> {formatDate(currentExam.examDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">
                    <strong>Exam Type:</strong> {currentExam.examType}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Results Table */}
          {selectedExamination ? (
            loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress size={60} />
              </Box>
            ) : filteredResults.length > 0 ? (
              <>
                <TableContainer
                  component={Paper}
                  sx={{ borderRadius: 2, mb: 2 }}
                >
                  <Table>
                    <TableHead
                      sx={{ backgroundColor: theme.palette.primary.main }}
                    >
                      <TableRow>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                          Student
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                          Subject
                        </TableCell>
                        <TableCell
                          sx={{ color: "white", fontWeight: "bold" }}
                          align="center"
                        >
                          Marks
                        </TableCell>
                        <TableCell
                          sx={{ color: "white", fontWeight: "bold" }}
                          align="center"
                        >
                          Max Marks
                        </TableCell>
                        <TableCell
                          sx={{ color: "white", fontWeight: "bold" }}
                          align="center"
                        >
                          Percentage
                        </TableCell>
                        <TableCell
                          sx={{ color: "white", fontWeight: "bold" }}
                          align="center"
                        >
                          Status
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                          Remarks
                        </TableCell>
                        <TableCell
                          sx={{ color: "white", fontWeight: "bold" }}
                          align="center"
                        >
                          Actions
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
                          <TableRow key={result._id}>
                            <TableCell>
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Box
                                  sx={{
                                    backgroundColor:
                                      theme.palette.primary.light,
                                    color: "white",
                                    borderRadius: "50%",
                                    width: 36,
                                    height: 36,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mr: 2,
                                  }}
                                >
                                  {result.student?.name?.charAt(0) || "?"}
                                </Box>
                                {result.student?.name || "Unknown Student"}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {result.subject?.subject_name ||
                                "Unknown Subject"}
                            </TableCell>

                            {/* Marks */}
                            <TableCell align="center">
                              {editMode === result._id ? (
                                <TextField
                                  name="marks"
                                  value={tempResult.marks}
                                  onChange={handleTempChange}
                                  type="number"
                                  size="small"
                                  sx={{ width: 80 }}
                                  inputProps={{ min: 0 }}
                                />
                              ) : (
                                result.marks
                              )}
                            </TableCell>

                            {/* Max Marks */}
                            <TableCell align="center">
                              {editMode === result._id ? (
                                <TextField
                                  name="maxMarks"
                                  value={tempResult.maxMarks}
                                  onChange={handleTempChange}
                                  type="number"
                                  size="small"
                                  sx={{ width: 80 }}
                                  inputProps={{ min: 1 }}
                                />
                              ) : (
                                result.maxMarks
                              )}
                            </TableCell>

                            {/* Percentage */}
                            <TableCell
                              align="center"
                              sx={{ fontWeight: "bold" }}
                            >
                              {result.percentage}%
                            </TableCell>

                            {/* Status */}
                            <TableCell align="center">
                              {result.percentage < 50 ? (
                                <Chip label="Fail" color="error" size="small" />
                              ) : (
                                <Chip
                                  label="Pass"
                                  color="success"
                                  size="small"
                                />
                              )}
                            </TableCell>

                            {/* Remarks */}
                            <TableCell>
                              {editMode === result._id ? (
                                <TextField
                                  name="remarks"
                                  value={tempResult.remarks}
                                  onChange={handleTempChange}
                                  size="small"
                                  fullWidth
                                />
                              ) : (
                                result.remarks || "N/A"
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="center">
                              {editMode === result._id ? (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <IconButton
                                    color="primary"
                                    onClick={() => handleSaveEdit(result._id)}
                                    disabled={loading}
                                  >
                                    <Save />
                                  </IconButton>
                                  <IconButton
                                    color="secondary"
                                    onClick={handleCancelEdit}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Box>
                              ) : (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <IconButton
                                    color="primary"
                                    onClick={() => handleEdit(result)}
                                    disabled={loading}
                                  >
                                    <Edit />
                                  </IconButton>
                                  <IconButton
                                    color="error"
                                    onClick={() =>
                                      handleDeleteResult(result._id)
                                    }
                                    disabled={loading}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Box>
                              )}
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
                />
              </>
            ) : (
              <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                <Typography variant="h6" color="textSecondary">
                  No results found for this examination
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={openAddResultDialog}
                  sx={{ mt: 2 }}
                  disabled={!selectedStudent}
                >
                  Add New Result
                </Button>
              </Paper>
            )
          ) : (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h6" color="textSecondary">
                {selectedClass
                  ? "Please select an examination"
                  : "Please select a class and exam type first"}
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Analysis Dashboard Tab */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Examination Analysis
          </Typography>

          {/* Analysis Controls */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Select Exam Type"
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="" disabled>
                    Choose exam type
                  </MenuItem>
                  {examTypeOptions.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Select Class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={!selectedExamType || loading}
                >
                  <MenuItem value="" disabled>
                    Choose a class
                  </MenuItem>
                  {[
                    ...new Set(
                      filteredExaminations.map((exam) => exam.class._id)
                    ),
                  ]
                    .map((classId) => {
                      const cls = classes.find((c) => c._id === classId);
                      return cls ? (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.class_text}
                        </MenuItem>
                      ) : null;
                    })
                    .filter(Boolean)}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Select Examination"
                  value={selectedExamination}
                  onChange={(e) => setSelectedExamination(e.target.value)}
                  disabled={!selectedClass || loading}
                >
                  <MenuItem value="" disabled>
                    Choose an examination
                  </MenuItem>
                  {filteredExaminations
                    .filter((exam) => exam.class._id === selectedClass)
                    .map((exam) => (
                      <MenuItem key={exam._id} value={exam._id}>
                        {exam.subject.subject_name} -{" "}
                        {formatDate(exam.examDate)}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Analysis Content */}
          {analytics ? (
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Students</Typography>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      {analytics.totalStudents}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Passed</Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "bold", color: "success.main" }}
                    >
                      {analytics.passCount} ({analytics.passPercentage}%)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Failed</Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "bold", color: "error.main" }}
                    >
                      {analytics.failCount} (
                      {Math.round(100 - analytics.passPercentage)}%)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pie Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pass/Fail Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Passed", value: analytics.passCount },
                            { name: "Failed", value: analytics.failCount },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#00C49F" />
                          <Cell fill="#FF8042" />
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${value} students`,
                            value === 1 ? "Student" : "Students",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Student Performance */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Performers
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...analytics.studentAnalytics]
                            .sort(
                              (a, b) =>
                                b.overallPercentage - a.overallPercentage
                            )
                            .slice(0, 5)
                            .map((student) => (
                              <TableRow key={student.student._id}>
                                <TableCell>{student.student.name}</TableCell>
                                <TableCell align="right">
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Box sx={{ width: "100%", mr: 1 }}>
                                      <Box
                                        sx={{
                                          width: `${student.overallPercentage}%`,
                                          height: 8,
                                          bgcolor:
                                            student.overallPercentage >= 50
                                              ? "success.main"
                                              : "error.main",
                                          borderRadius: 4,
                                        }}
                                      />
                                    </Box>
                                    {student.overallPercentage}%
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={
                                      student.overallPercentage >= 50
                                        ? "Pass"
                                        : "Fail"
                                    }
                                    color={
                                      student.overallPercentage >= 50
                                        ? "success"
                                        : "error"
                                    }
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Subject-wise Performance */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Subject-wise Performance
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <ReBarChart
                        data={analytics.studentAnalytics.flatMap((student) =>
                          student.subjects.map((subject) => ({
                            student: student.student.name,
                            subject: subject.subject,
                            percentage: subject.percentage,
                          }))
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
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="percentage"
                          name="Percentage"
                          fill="#8884d8"
                        />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h6" color="textSecondary">
                {selectedExamination
                  ? "No analytics available for this examination"
                  : "Please select an examination to view analytics"}
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Student Performance Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Student Performance Analysis
          </Typography>

          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Select Class"
                  value={selectedClassForAnalysis}
                  onChange={(e) => setSelectedClassForAnalysis(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="" disabled>
                    Choose a class
                  </MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.class_text}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Select Student"
                  value={selectedStudentForAnalysis}
                  onChange={(e) => {
                    setSelectedStudentForAnalysis(e.target.value);
                    fetchStudentPerformance(e.target.value);
                  }}
                  disabled={!selectedClassForAnalysis || loading}
                >
                  <MenuItem value="" disabled>
                    Choose a student
                  </MenuItem>
                  {students
                    .filter(
                      (student) =>
                        student.student_class?._id === selectedClassForAnalysis
                    )
                    .map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {studentPerformance ? (
            <Grid container spacing={3}>
              {/* Student Summary Card */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {studentPerformance.student.name}
                    </Typography>
                    <Typography>
                      Class: {studentPerformance.student.class.class_text}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>
                      Exams Taken: {studentPerformance.examCount}
                    </Typography>

                    {studentPerformance.improvement && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">
                          Performance Trend
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: "bold",
                            color:
                              studentPerformance.improvement.change >= 0
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          {studentPerformance.improvement.change >= 0
                            ? "+"
                            : ""}
                          {studentPerformance.improvement.change}%
                        </Typography>
                        <Typography variant="body2">
                          From {studentPerformance.improvement.from}% to{" "}
                          {studentPerformance.improvement.to}%
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Subject Trends */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Subject Performance Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <ReBarChart
                        data={Object.entries(
                          studentPerformance.subjectTrends
                        ).map(([subject, exams]) => ({
                          subject,
                          latest: exams[exams.length - 1]?.percentage || 0,
                          average: parseFloat(
                            (
                              exams.reduce(
                                (sum, exam) => sum + exam.percentage,
                                0
                              ) / exams.length
                            ).toFixed(2)
                          ),
                        }))}
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
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Percentage"]}
                        />
                        <Legend />
                        <Bar
                          dataKey="latest"
                          name="Latest Exam"
                          fill="#8884d8"
                        />
                        <Bar
                          dataKey="average"
                          name="Overall Average"
                          fill="#82ca9d"
                        />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Exam Performance Details */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Exam Performance Details
                    </Typography>
                    {Object.entries(studentPerformance.exams).map(
                      ([examId, exam]) => (
                        <Box key={examId} sx={{ mb: 4 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ mb: 2, fontWeight: "bold" }}
                          >
                            {exam.examType} - {formatDate(exam.examDate)}
                          </Typography>

                          <Grid container spacing={2}>
                            {/* Overall Summary */}
                            <Grid item xs={12} md={3}>
                              <Paper
                                sx={{
                                  p: 2,
                                  backgroundColor: theme.palette.grey[100],
                                }}
                              >
                                <Typography variant="subtitle2">
                                  Overall
                                </Typography>
                                <Typography
                                  variant="h5"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {exam.overallPercentage}%
                                </Typography>
                                <Typography variant="body2">
                                  {exam.totalMarks}/{exam.totalMaxMarks} Marks
                                </Typography>
                              </Paper>
                            </Grid>

                            {/* Subject Performance */}
                            {exam.subjects.map((subject, index) => (
                              <Grid item xs={12} md={3} key={index}>
                                <Paper sx={{ p: 2 }}>
                                  <Typography variant="subtitle2">
                                    {subject.subject}
                                  </Typography>
                                  <Typography variant="h6">
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
                                        color:
                                          subject.percentage >= 50
                                            ? "success.main"
                                            : "error.main",
                                      }}
                                    >
                                      {subject.percentage}%
                                    </Typography>
                                    {subject.percentage >= 50 ? (
                                      <Chip
                                        label="Pass"
                                        color="success"
                                        size="small"
                                      />
                                    ) : (
                                      <Chip
                                        label="Fail"
                                        color="error"
                                        size="small"
                                      />
                                    )}
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="h6" color="textSecondary">
                {selectedStudentForAnalysis
                  ? "Loading performance data..."
                  : "Please select a class and student to view performance analysis"}
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Add Result Dialog */}
      <Dialog open={addResultDialog} onClose={() => setAddResultDialog(false)}>
        <DialogTitle>Add New Result</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Student"
                value={
                  students.find((s) => s._id === newResult.student)?.name || ""
                }
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={currentExam?.subject?.subject_name || ""}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                value={currentExam ? formatDate(currentExam.examDate) : ""}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Marks"
                name="marks"
                type="number"
                value={newResult.marks}
                onChange={handleNewResultChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Marks"
                value={newResult.maxMarks}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={newResult.remarks}
                onChange={handleNewResultChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddResultDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddResult} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Add Result"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchoolResult;