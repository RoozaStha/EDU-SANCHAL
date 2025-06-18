import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Snackbar, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, useMediaQuery, useTheme, Tabs, Tab,
  Card, CardContent, TablePagination, Chip, Divider, Avatar, Stack
} from "@mui/material";
import { 
  Search, Add, Edit, Save, Cancel, Delete, 
  Assessment, PictureAsPdf, BarChart, PersonAdd, 
  ArrowDropDown, ArrowDropUp, FilterList, MoreVert,
  School, InsertChart, Description, People, 
  CheckCircle, Error, Download, Print
} from "@mui/icons-material";
// Icons
import {

  BarChart as BarChartIcon,

  Subject as SubjectIcon,
 
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';

const COLORS = ['#4361ee', '#3a0ca3', '#4cc9f0', '#4895ef', '#560bad'];
const examTypeOptions = [
  '1st Term Exam',
  '2nd Term Exam',
  '3rd Term Exam',
  'Final Term Exam'
];

const AnimatedCard = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    {children}
  </motion.div>
);

const TeacherResult = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  
  // State variables
  const [examinations, setExaminations] = useState([]);
  const [filteredExaminations, setFilteredExaminations] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
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
  const [studentResult, setStudentResult] = useState({
    student: "",
    examination: "",
    class: "",
    results: []
  });
  const [newResult, setNewResult] = useState({
    student: "",
    subject: "",
    marks: "",
    maxMarks: "",
    remarks: ""
  });

  // Fetch classes and students
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/class/all",
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setClasses(response.data.data);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setSnackbar({
          open: true,
          message: "Failed to load classes",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/students/all",
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setStudents(response.data.data);
      } catch (error) {
        console.error("Error fetching students:", error);
        setSnackbar({
          open: true,
          message: "Failed to load students",
          severity: "error"
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
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setExaminations(response.data.examinations || []);
      } catch (error) {
        console.error("Error fetching examinations:", error);
        setSnackbar({
          open: true,
          message: "Failed to load examinations",
          severity: "error"
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
        exam => exam.examType === selectedExamType
      );
      setFilteredExaminations(filtered);
      
      // Get unique classes from filtered examinations
      const uniqueClasses = [...new Set(filtered.map(exam => exam.class._id))];
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
        exam => exam.class._id === selectedClass
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
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setClassSubjects(response.data.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSnackbar({
        open: true,
        message: "Failed to load subjects",
        severity: "error"
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
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setResults(res.data.data);
      } catch (error) {
        console.error("Error fetching results:", error);
        setSnackbar({
          open: true,
          message: "Failed to load results",
          severity: "error"
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
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
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

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Enter edit mode for a result
  const handleEdit = (result) => {
    setEditMode(result._id);
    setTempResult({
      marks: result.marks,
      maxMarks: result.maxMarks,
      remarks: result.remarks || ""
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
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setEditMode(null);
      // Refresh results
      const res = await axios.get(
        `http://localhost:5000/api/results/examination/${selectedExamination}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setResults(res.data.data);
    } catch (error) {
      console.error("Update error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update result",
        severity: "error"
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
      await axios.delete(
        `http://localhost:5000/api/results/${resultId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Refresh results
      const res = await axios.get(
        `http://localhost:5000/api/results/examination/${selectedExamination}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setResults(res.data.data);
    } catch (error) {
      console.error("Delete error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete result",
        severity: "error"
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
      remarks: ""
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
          remarks: newResult.remarks
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setAddResultDialog(false);
      setSnackbar({
        open: true,
        message: "Result added successfully!",
        severity: "success"
      });
      
      // Refresh results
      const res = await axios.get(
        `http://localhost:5000/api/results/examination/${selectedExamination}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setResults(res.data.data);
    } catch (error) {
      console.error("Error adding result:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to add result",
        severity: "error"
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
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          responseType: 'blob'
        }
      );
      
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(pdfBlob, `results_${selectedExamination}.pdf`);
    } catch (error) {
      console.error("Export error:", error);
      setSnackbar({
        open: true,
        message: "Failed to export results",
        severity: "error"
      });
    }
  };

  // Filter results based on search term
  const filteredResults = results.filter(result => {
    const studentName = result.student?.name?.toLowerCase() || "";
    const subjectName = result.subject?.subject_name?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    
    return (
      studentName.includes(search) ||
      subjectName.includes(search)
    );
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
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Get students for selected class
  const classStudents = students.filter(
    student => student.student_class?._id === selectedClass
  );

  // Get selected examination object
  const currentExam = filteredExaminations.find(
    exam => exam._id === selectedExamination
  );

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.primary.dark,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <School sx={{ fontSize: 36 }} />
            Results Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and analyze student examination results
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            startIcon={<Print />}
            onClick={handleExportPDF}
            disabled={!selectedExamination}
            sx={{ borderRadius: 2 }}
          >
            Print Report
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            onClick={handleExportPDF}
            disabled={!selectedExamination}
            sx={{ borderRadius: 2 }}
          >
            Export PDF
          </Button>
        </Stack>
      </Box>
      
      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 4,
            borderRadius: '4px 4px 0 0',
          }
        }}
      >
        <Tab 
          label="Results Dashboard" 
          icon={<Description sx={{ mb: 0.5 }} />} 
          sx={{ minHeight: 'auto', py: 1.5, fontWeight: 600 }}
        />
        <Tab 
          label="Analytics" 
          icon={<InsertChart sx={{ mb: 0.5 }} />} 
          sx={{ minHeight: 'auto', py: 1.5, fontWeight: 600 }}
        />
      </Tabs>
      
      {/* Results Dashboard Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Filters Card */}
          <AnimatedCard>
            <Card sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: `1px solid ${theme.palette.divider}`
            }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Exam Type"
                      value={selectedExamType}
                      onChange={(e) => setSelectedExamType(e.target.value)}
                      disabled={loading}
                      size="small"
                      variant="outlined"
                      InputProps={{
                        startAdornment: <FilterList sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select exam type
                      </MenuItem>
                      {examTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Class"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      disabled={!selectedExamType || loading}
                      size="small"
                      variant="outlined"
                    >
                      <MenuItem value="" disabled>
                        Select class
                      </MenuItem>
                      {[...new Set(filteredExaminations.map(exam => exam.class._id))]
                        .map(classId => {
                          const cls = classes.find(c => c._id === classId);
                          return cls ? (
                            <MenuItem key={cls._id} value={cls._id}>
                              {cls.class_text}
                            </MenuItem>
                          ) : null;
                        })
                        .filter(Boolean)}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Examination"
                      value={selectedExamination}
                      onChange={(e) => setSelectedExamination(e.target.value)}
                      disabled={!selectedClass || loading}
                      size="small"
                      variant="outlined"
                    >
                      <MenuItem value="" disabled>
                        Select examination
                      </MenuItem>
                      {filteredExaminations
                        .filter(exam => exam.class._id === selectedClass)
                        .map((exam) => (
                          <MenuItem key={exam._id} value={exam._id}>
                            {exam.subject.subject_name} - {formatDate(exam.examDate)}
                          </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Student"
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      disabled={!selectedExamination || loading}
                      size="small"
                      variant="outlined"
                    >
                      <MenuItem value="" disabled>
                        Select student
                      </MenuItem>
                      {classStudents.map((student) => (
                        <MenuItem key={student._id} value={student._id}>
                          {student.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={openAddResultDialog}
                      disabled={!selectedStudent || !selectedExamination || loading}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Result
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </AnimatedCard>
          
          {/* Exam Details Card */}
          {currentExam && (
            <AnimatedCard>
              <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: theme.palette.primary.light, 
                        color: theme.palette.primary.contrastText,
                        mr: 2 
                      }}>
                        <SubjectIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                        <Typography variant="h6">{currentExam.subject?.subject_name || 'Unknown'}</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: theme.palette.secondary.light, 
                        color: theme.palette.secondary.contrastText,
                        mr: 2 
                      }}>
                        <CalendarIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                        <Typography variant="h6">{formatDate(currentExam.examDate)}</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: theme.palette.success.light, 
                        color: theme.palette.success.contrastText,
                        mr: 2 
                      }}>
                        <Assessment />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Exam Type</Typography>
                        <Typography variant="h6">{currentExam.examType}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </AnimatedCard>
          )}
          
          {/* Results Table */}
          {selectedExamination ? (
            loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress size={60} />
              </Box>
            ) : (
              filteredResults.length > 0 ? (
                <AnimatedCard>
                  <Card sx={{ borderRadius: 3, mb: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <TableContainer>
                      <Table>
                        <TableHead sx={{ 
                          backgroundColor: theme.palette.primary.dark,
                          '& th': { 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.95rem',
                            py: 1.5
                          }
                        }}>
                          <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell align="center">Marks</TableCell>
                            <TableCell align="center">Max Marks</TableCell>
                            <TableCell align="center">Percentage</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell>Remarks</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredResults
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((result, index) => (
                            <TableRow 
                              key={result._id} 
                              hover
                              sx={{ 
                                '&:nth-of-type(odd)': { 
                                  backgroundColor: theme.palette.action.hover 
                                } 
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    sx={{ 
                                      bgcolor: theme.palette.primary.light, 
                                      color: theme.palette.primary.contrastText,
                                      mr: 2,
                                      width: 36,
                                      height: 36
                                    }}
                                  >
                                    {result.student?.name?.charAt(0) || '?'}
                                  </Avatar>
                                  {result.student?.name || "Unknown Student"}
                                </Box>
                              </TableCell>
                              <TableCell>{result.subject?.subject_name || "Unknown Subject"}</TableCell>
                              
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
                              
                              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  gap: 0.5
                                }}>
                                  {result.percentage}%
                                  {result.percentage >= 70 ? (
                                    <ArrowDropUp sx={{ color: theme.palette.success.main }} />
                                  ) : result.percentage >= 50 ? (
                                    <ArrowDropUp sx={{ color: theme.palette.warning.main }} />
                                  ) : (
                                    <ArrowDropDown sx={{ color: theme.palette.error.main }} />
                                  )}
                                </Box>
                              </TableCell>
                              
                              <TableCell align="center">
                                {result.percentage < 50 ? (
                                  <Chip 
                                    icon={<Error fontSize="small" />} 
                                    label="Fail" 
                                    color="error" 
                                    size="small" 
                                    sx={{ fontWeight: 600 }}
                                  />
                                ) : (
                                  <Chip 
                                    icon={<CheckCircle fontSize="small" />} 
                                    label="Pass" 
                                    color="success" 
                                    size="small" 
                                    sx={{ fontWeight: 600 }}
                                  />
                                )}
                              </TableCell>
                              
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
                              
                              <TableCell align="center">
                                {editMode === result._id ? (
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Button 
                                      variant="contained"
                                      size="small"
                                      onClick={() => handleSaveEdit(result._id)}
                                      disabled={loading}
                                      startIcon={<Save />}
                                    >
                                      Save
                                    </Button>
                                    <Button 
                                      variant="outlined"
                                      size="small"
                                      onClick={handleCancelEdit}
                                      startIcon={<Cancel />}
                                    >
                                      Cancel
                                    </Button>
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Button 
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleEdit(result)}
                                      disabled={loading}
                                      startIcon={<Edit />}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outlined"
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteResult(result._id)}
                                      disabled={loading}
                                      startIcon={<Delete />}
                                    >
                                      Delete
                                    </Button>
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
                      sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                    />
                  </Card>
                </AnimatedCard>
              ) : (
                <AnimatedCard>
                  <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                      No results found for this examination
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<Add />}
                      onClick={openAddResultDialog}
                      disabled={!selectedStudent}
                    >
                      Add New Result
                    </Button>
                  </Card>
                </AnimatedCard>
              )
            )
          ) : (
            <AnimatedCard>
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" color="textSecondary">
                  {selectedClass ? "Please select an examination" : "Please select a class and exam type first"}
                </Typography>
              </Card>
            </AnimatedCard>
          )}
        </Box>
      )}
      
      {/* Analysis Dashboard Tab */}
      {activeTab === 1 && (
        <Box>
          <AnimatedCard>
            <Card sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: `1px solid ${theme.palette.divider}`
            }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Exam Type"
                      value={selectedExamType}
                      onChange={(e) => setSelectedExamType(e.target.value)}
                      disabled={loading}
                      size="small"
                      variant="outlined"
                    >
                      <MenuItem value="" disabled>
                        Select exam type
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
                      label="Class"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      disabled={!selectedExamType || loading}
                      size="small"
                      variant="outlined"
                    >
                      <MenuItem value="" disabled>
                        Select class
                      </MenuItem>
                      {[...new Set(filteredExaminations.map(exam => exam.class._id))]
                        .map(classId => {
                          const cls = classes.find(c => c._id === classId);
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
                      label="Examination"
                      value={selectedExamination}
                      onChange={(e) => setSelectedExamination(e.target.value)}
                      disabled={!selectedClass || loading}
                      size="small"
                      variant="outlined"
                    >
                      <MenuItem value="" disabled>
                        Select examination
                      </MenuItem>
                      {filteredExaminations
                        .filter(exam => exam.class._id === selectedClass)
                        .map((exam) => (
                          <MenuItem key={exam._id} value={exam._id}>
                            {exam.subject.subject_name} - {formatDate(exam.examDate)}
                          </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </AnimatedCard>
          
          {/* Analysis Content */}
          {analytics ? (
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12} md={4}>
                <AnimatedCard>
                  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People /> Total Students
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, textAlign: 'center' }}>
                        {analytics.totalStudents}
                      </Typography>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <AnimatedCard>
                  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle /> Passed
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 'bold', color: theme.palette.success.main, textAlign: 'center' }}>
                        {analytics.passCount} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>({analytics.passPercentage}%)</span>
                      </Typography>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <AnimatedCard>
                  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Error /> Failed
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 'bold', color: theme.palette.error.main, textAlign: 'center' }}>
                        {analytics.failCount} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>({Math.round(100 - analytics.passPercentage)}%)</span>
                      </Typography>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
              
              {/* Pie Chart */}
              <Grid item xs={12} md={6}>
                <AnimatedCard>
                  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PieChart /> Pass/Fail Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Passed', value: analytics.passCount },
                              { name: 'Failed', value: analytics.failCount }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#4cc9f0" />
                            <Cell fill="#f72585" />
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value} students`, value === 1 ? 'Student' : 'Students']}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
              
              {/* Student Performance */}
              <Grid item xs={12} md={6}>
                <AnimatedCard>
                  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BarChartIcon /> Top Performers
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
                              .sort((a, b) => b.overallPercentage - a.overallPercentage)
                              .slice(0, 5)
                              .map((student) => (
                                <TableRow key={student.student._id}>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Avatar sx={{ 
                                        bgcolor: theme.palette.primary.light, 
                                        color: theme.palette.primary.contrastText,
                                        width: 32,
                                        height: 32,
                                        mr: 1.5,
                                        fontSize: '0.8rem'
                                      }}>
                                        {student.student.name.charAt(0)}
                                      </Avatar>
                                      {student.student.name}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                      <Box sx={{ 
                                        width: `${student.overallPercentage}%`, 
                                        height: 8,
                                        bgcolor: student.overallPercentage >= 50 ? 
                                          theme.palette.success.main : theme.palette.error.main,
                                        borderRadius: 4,
                                        mr: 1
                                      }} />
                                      {student.overallPercentage}%
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip 
                                      label={student.overallPercentage >= 50 ? 'Pass' : 'Fail'} 
                                      color={student.overallPercentage >= 50 ? 'success' : 'error'} 
                                      size="small" 
                                      sx={{ fontWeight: 600 }}
                                    />
                                  </TableCell>
                                </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
              
              {/* Subject-wise Performance */}
              <Grid item xs={12}>
                <AnimatedCard>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SubjectIcon /> Subject-wise Performance
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <ReBarChart
                          data={analytics.studentAnalytics.flatMap(student => 
                            student.subjects.map(subject => ({
                              student: student.student.name,
                              subject: subject.subject,
                              percentage: subject.percentage
                            }))
                          )}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis 
                            dataKey="subject" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                            tick={{ fill: theme.palette.text.primary }}
                          />
                          <YAxis 
                            tick={{ fill: theme.palette.text.primary }}
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: 8,
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="percentage" 
                            name="Percentage" 
                            fill={theme.palette.primary.main} 
                            radius={[4, 4, 0, 0]}
                          />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
            </Grid>
          ) : (
            <AnimatedCard>
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" color="textSecondary">
                  {selectedExamination 
                    ? "No analytics available for this examination" 
                    : "Please select an examination to view analytics"}
                </Typography>
              </Card>
            </AnimatedCard>
          )}
        </Box>
      )}
      
      {/* Add Result Dialog */}
      <Dialog 
        open={addResultDialog} 
        onClose={() => setAddResultDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { 
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Add /> Add New Result
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Student"
                value={students.find(s => s._id === newResult.student)?.name || ""}
                disabled
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={currentExam?.subject?.subject_name || ""}
                disabled
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                value={currentExam ? formatDate(currentExam.examDate) : ""}
                disabled
                size="small"
                variant="outlined"
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
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Marks"
                value={newResult.maxMarks}
                disabled
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={newResult.remarks}
                onChange={handleNewResultChange}
                size="small"
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={() => setAddResultDialog(false)} 
            color="secondary"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddResult} 
            color="primary" 
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : "Add Result"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              borderRadius: 2,
              boxShadow: theme.shadows[3],
              alignItems: 'center'
            }}
          >
            {snackbar.message}
          </Alert>
        </motion.div>
      </Snackbar>
    </Box>
  );
};

export default TeacherResult;