import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Snackbar, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, useMediaQuery, useTheme, Tabs, Tab,
  Card, CardContent, TablePagination, Chip
} from "@mui/material";
import { 
  Search, Add, Edit, Save, Cancel, Delete, 
  Assessment, PictureAsPdf, BarChart, PersonAdd 
} from "@mui/icons-material";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { saveAs } from 'file-saver';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TeacherResult = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  
  // State variables
  const [examinations, setExaminations] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExamination, setSelectedExamination] = useState("");
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

  // Fetch classes when component mounts
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

    fetchClasses();
  }, []);

  // Fetch students when classes are loaded
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    if (classes.length > 0) {
      fetchStudents();
    }
  }, [classes]);

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

  // Fetch examinations when class is selected
  const fetchExaminationsByClass = async (classId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/examination/class/${classId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setExaminations(response.data.examinations);
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

  // Handle class selection
  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedExamination("");
    fetchExaminationsByClass(classId);
    fetchSubjectsByClass(classId);
  };

  // Handle examination selection
  const handleExaminationChange = (examId) => {
    setSelectedExamination(examId);
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
      student: "",
      subject: "",
      marks: "",
      maxMarks: "",
      remarks: ""
    });
  };

  // Handle new result changes
  const handleNewResultChange = (e) => {
    setNewResult({ ...newResult, [e.target.name]: e.target.value });
  };

  // Handle student selection for bulk results
  const handleStudentChange = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (!student || !student.student_class) {
      setSnackbar({
        open: true,
        message: "Student doesn't have a class assigned",
        severity: "warning"
      });
      return;
    }
    
    // Initialize results for all subjects
    const initialResults = classSubjects.map(subject => ({
      subjectId: subject._id,
      subjectName: subject.subject_name,
      marks: "",
      maxMarks: ""
    }));
    
    setStudentResult({
      student: studentId,
      examination: studentResult.examination,
      class: student.student_class,
      results: initialResults
    });
  };

  // Handle subject marks change for bulk results
  const handleSubjectChange = (index, field, value) => {
    setStudentResult(prev => {
      const newResults = [...prev.results];
      newResults[index] = { 
        ...newResults[index], 
        [field]: field === 'marks' || field === 'maxMarks' ? Number(value) : value
      };
      return { ...prev, results: newResults };
    });
  };

  // Submit student results
  const handleAddStudentResults = async () => {
    // Validation
    const invalidSubjects = studentResult.results.filter(
      subj => !subj.marks || !subj.maxMarks || subj.marks > subj.maxMarks
    );
    
    if (invalidSubjects.length > 0) {
      setSnackbar({
        open: true,
        message: "Please fill all marks correctly",
        severity: "warning"
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        examinationId: studentResult.examination,
        studentId: studentResult.student,
        results: studentResult.results.map(res => ({
          subjectId: res.subjectId,
          marks: res.marks,
          maxMarks: res.maxMarks
        }))
      };

      await axios.post(
        "http://localhost:5000/api/results/student",
        payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setSnackbar({
        open: true,
        message: "Student results added successfully!",
        severity: "success"
      });
      
      // Reset form
      setStudentResult({
        student: "",
        examination: "",
        class: "",
        results: []
      });
      
      // Refresh results if examination is selected
      if (selectedExamination) {
        const res = await axios.get(
          `http://localhost:5000/api/results/examination/${selectedExamination}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setResults(res.data.data);
      }
    } catch (error) {
      console.error("Error adding student results:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to add results",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <Box sx={{ p: isMobile ? 2 : 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Exam Results Management
      </Typography>
      
      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Examination Results" icon={<Assessment />} />
        <Tab label="Create Student Result" icon={<PersonAdd />} />
        <Tab label="Analytics Dashboard" icon={<BarChart />} disabled={!analytics} />
      </Tabs>
      
      {/* Examination Results Tab */}
      {activeTab === 0 && (
        <>
          {/* Controls Section */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* Class Selection */}
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Select Class"
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
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
              
              {/* Examination Selection */}
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Select Examination"
                  value={selectedExamination}
                  onChange={(e) => handleExaminationChange(e.target.value)}
                  disabled={!selectedClass || loading}
                >
                  <MenuItem value="" disabled>
                    Choose an examination
                  </MenuItem>
                  {examinations.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.examType} - {new Date(exam.examDate).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              {/* Search and Buttons */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Students or Subjects"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!selectedExamination || loading}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openAddResultDialog}
                  disabled={!selectedExamination || loading}
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
          
          {/* Results Table */}
          {selectedExamination ? (
            loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress size={60} />
              </Box>
            ) : (
              filteredResults.length > 0 ? (
                <>
                  <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 2 }}>
                    <Table>
                      <TableHead sx={{ backgroundColor: theme.palette.primary.main }}>
                        <TableRow>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subject</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Marks</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Max Marks</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Percentage</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Status</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Remarks</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredResults
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((result) => (
                          <TableRow key={result._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ 
                                  backgroundColor: theme.palette.primary.light, 
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 36,
                                  height: 36,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mr: 2
                                }}>
                                  {result.student?.name?.charAt(0) || '?'}
                                </Box>
                                {result.student?.name || "Unknown Student"}
                              </Box>
                            </TableCell>
                            <TableCell>{result.subject?.subject_name || "Unknown Subject"}</TableCell>
                            
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
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                              {result.percentage}%
                            </TableCell>
                            
                            {/* Status */}
                            <TableCell align="center">
                              {result.percentage < 50 ? (
                                <Chip label="Fail" color="error" size="small" />
                              ) : (
                                <Chip label="Pass" color="success" size="small" />
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
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton 
                                    color="primary" 
                                    onClick={() => handleSaveEdit(result._id)}
                                    disabled={loading}
                                  >
                                    <Save />
                                  </IconButton>
                                  <IconButton color="secondary" onClick={handleCancelEdit}>
                                    <Cancel />
                                  </IconButton>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton 
                                    color="primary" 
                                    onClick={() => handleEdit(result)}
                                    disabled={loading}
                                  >
                                    <Edit />
                                  </IconButton>
                                  <IconButton 
                                    color="error" 
                                    onClick={() => handleDeleteResult(result._id)}
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
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="h6" color="textSecondary">
                    No results found for this examination
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<Add />}
                    onClick={openAddResultDialog}
                    sx={{ mt: 2 }}
                  >
                    Add New Result
                  </Button>
                </Paper>
              )
            )
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="textSecondary">
                {selectedClass ? "Please select an examination" : "Please select a class first"}
              </Typography>
            </Paper>
          )}
        </>
      )}
      
      {/* Create Student Result Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Create Results for a Student
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {/* Class Selection */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Select Class"
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
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
            
            {/* Examination Selection */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Examination"
                value={studentResult.examination}
                onChange={(e) => setStudentResult(prev => ({ ...prev, examination: e.target.value }))}
                disabled={!selectedClass || loading}
              >
                <MenuItem value="" disabled>
                  Select examination
                </MenuItem>
                {examinations.map((exam) => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.examType} - {new Date(exam.examDate).toLocaleDateString()}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            {/* Student Selection */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Student"
                value={studentResult.student}
                onChange={(e) => handleStudentChange(e.target.value)}
                disabled={!studentResult.examination || loading}
              >
                <MenuItem value="" disabled>
                  Select student
                </MenuItem>
                {students
                  .filter(student => student.student_class?._id === selectedClass)
                  .map((student) => (
                    <MenuItem 
                      key={student._id} 
                      value={student._id}
                    >
                      {student.name}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            
            {/* Subject Marks Input */}
            {studentResult.student && classSubjects.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Enter Marks:
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell align="center">Marks</TableCell>
                        <TableCell align="center">Max Marks</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentResult.results.map((result, index) => (
                        <TableRow key={result.subjectId}>
                          <TableCell>{result.subjectName}</TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              value={result.marks || ""}
                              onChange={(e) => handleSubjectChange(index, 'marks', e.target.value)}
                              inputProps={{ min: 0 }}
                              size="small"
                              sx={{ width: 100 }}
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              value={result.maxMarks || ""}
                              onChange={(e) => handleSubjectChange(index, 'maxMarks', e.target.value)}
                              inputProps={{ min: 1 }}
                              size="small"
                              sx={{ width: 100 }}
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {result.marks && result.maxMarks ? (
                              (result.marks / result.maxMarks) * 100 >= 50 ? (
                                <Chip label="Pass" color="success" size="small" />
                              ) : (
                                <Chip label="Fail" color="error" size="small" />
                              )
                            ) : (
                              <Typography variant="caption">N/A</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddStudentResults}
                disabled={loading || !studentResult.student || !studentResult.examination}
                startIcon={<Save />}
              >
                {loading ? <CircularProgress size={24} /> : "Save Results"}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Analytics Dashboard Tab */}
      {activeTab === 2 && analytics && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Examination Analytics
          </Typography>
          
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Total Students</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {analytics.totalStudents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Passed</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {analytics.passCount} ({analytics.passPercentage}%)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Failed</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {analytics.failCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Pass/Fail Distribution</Typography>
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
                        <Cell fill="#00C49F" />
                        <Cell fill="#FF8042" />
                      </Pie>
                      <Tooltip />
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
                  <Typography variant="h6" gutterBottom>Student Performance</Typography>
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
                        {analytics.studentAnalytics.slice(0, 5).map((student) => (
                          <TableRow key={student.student._id}>
                            <TableCell>{student.student.name}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <Box sx={{ 
                                    width: `${student.overallPercentage}%`, 
                                    height: 8,
                                    bgcolor: student.overallPercentage >= 40 ? 'success.main' : 'error.main',
                                    borderRadius: 4
                                  }} />
                                </Box>
                                {student.overallPercentage}%
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={student.status} 
                                color={student.status === 'Pass' ? 'success' : 'error'} 
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
          </Grid>
        </Box>
      )}
      
      {/* Add Result Dialog */}
      <Dialog open={addResultDialog} onClose={() => setAddResultDialog(false)}>
        <DialogTitle>Add New Result</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Student"
                name="student"
                value={newResult.student}
                onChange={handleNewResultChange}
              >
                <MenuItem value="" disabled>
                  Select student
                </MenuItem>
                {students
                  .filter(student => student.student_class?._id === selectedClass)
                  .map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.name}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Subject"
                name="subject"
                value={newResult.subject}
                onChange={handleNewResultChange}
              >
                <MenuItem value="" disabled>
                  Select subject
                </MenuItem>
                {classSubjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.subject_name}
                  </MenuItem>
                ))}
              </TextField>
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
                name="maxMarks"
                type="number"
                value={newResult.maxMarks}
                onChange={handleNewResultChange}
                inputProps={{ min: 1 }}
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeacherResult;