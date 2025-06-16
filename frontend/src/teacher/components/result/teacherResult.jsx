import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Snackbar, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, useMediaQuery, useTheme
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import axios from "axios";

const TeacherResult = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State variables
  const [examinations, setExaminations] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedExamination, setSelectedExamination] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(null);
  const [tempResult, setTempResult] = useState({});
  const [addResultDialog, setAddResultDialog] = useState(false);
  const [newResult, setNewResult] = useState({
    examination: "",
    student: "",
    subject: "",
    marks: "",
    maxMarks: "",
    remarks: ""
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Parallel API requests
        const [examsRes, studentsRes, subjectsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/examination/all", {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get("http://localhost:5000/api/students/all", {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get("http://localhost:5000/api/subjects", {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        
        setExaminations(examsRes.data.examinations);
        setStudents(studentsRes.data.data);
        setSubjects(subjectsRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setSnackbar({
          open: true,
          message: "Failed to load initial data",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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

  // Handle examination selection
  const handleExaminationChange = (e) => {
    setSelectedExamination(e.target.value);
    setEditMode(null);
    setSearchTerm("");
  };

  // Start editing a result
  const handleEdit = (result) => {
    setEditMode(result._id);
    setTempResult({
      marks: result.marks,
      maxMarks: result.maxMarks,
      remarks: result.remarks || ""
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditMode(null);
  };

  // Save edited result
  const handleSaveEdit = async (resultId) => {
    if (!tempResult.marks || !tempResult.maxMarks) {
      setSnackbar({
        open: true,
        message: "Marks fields are required",
        severity: "warning"
      });
      return;
    }
    
    if (parseFloat(tempResult.marks) > parseFloat(tempResult.maxMarks)) {
      setSnackbar({
        open: true,
        message: "Marks cannot exceed max marks",
        severity: "warning"
      });
      return;
    }

    try {
      setLoading(true);
      await axios.patch(
        `http://localhost:5000/api/results/${resultId}`,
        {
          marks: tempResult.marks,
          maxMarks: tempResult.maxMarks,
          remarks: tempResult.remarks
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Optimistic UI update
      setResults(results.map(result => 
        result._id === resultId ? { 
          ...result, 
          marks: tempResult.marks,
          maxMarks: tempResult.maxMarks,
          remarks: tempResult.remarks,
          percentage: parseFloat(((tempResult.marks / tempResult.maxMarks) * 100).toFixed(2))
        } : result
      ));
      
      setEditMode(null);
      setSnackbar({
        open: true,
        message: "Result updated successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error updating result:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update result",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle temporary result changes during edit
  const handleTempChange = (e) => {
    const { name, value } = e.target;
    setTempResult(prev => ({ ...prev, [name]: value }));
  };

  // Handle new result dialog
  const openAddResultDialog = () => {
    setAddResultDialog(true);
    setNewResult({
      examination: selectedExamination,
      student: "",
      subject: "",
      marks: "",
      maxMarks: "",
      remarks: ""
    });
  };

  // Handle new result input changes
  const handleNewResultChange = (e) => {
    const { name, value } = e.target;
    setNewResult(prev => ({ ...prev, [name]: value }));
  };

  // Submit new result
  const handleAddResult = async () => {
    // Validation
    if (!newResult.student || !newResult.subject || !newResult.marks || !newResult.maxMarks) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "warning"
      });
      return;
    }
    
    if (parseFloat(newResult.marks) > parseFloat(newResult.maxMarks)) {
      setSnackbar({
        open: true,
        message: "Marks cannot exceed max marks",
        severity: "warning"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const payload = {
        examinationId: newResult.examination,
        studentId: newResult.student,
        subjectId: newResult.subject,
        marks: Number(newResult.marks),
        maxMarks: Number(newResult.maxMarks),
        remarks: newResult.remarks
      };

      const res = await axios.post(
        "http://localhost:5000/api/results",
        payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Optimistic UI update
      const percentage = parseFloat(((
        res.data.data.marks / res.data.data.maxMarks
      ) * 100).toFixed(2));
      
      setResults(prev => [...prev, {
        ...res.data.data,
        percentage,
        student: students.find(s => s._id === newResult.student),
        subject: subjects.find(sub => sub._id === newResult.subject)
      }]);
      
      setAddResultDialog(false);
      setSnackbar({
        open: true,
        message: "Result added successfully!",
        severity: "success"
      });
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

  // Delete result
  const handleDeleteResult = async (resultId) => {
    if (!window.confirm("Are you sure you want to delete this result?")) return;
    
    try {
      setLoading(true);
      await axios.delete(
        `http://localhost:5000/api/results/${resultId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Optimistic UI update
      setResults(prev => prev.filter(result => result._id !== resultId));
      setSnackbar({
        open: true,
        message: "Result deleted successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error deleting result:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete result",
        severity: "error"
      });
    } finally {
      setLoading(false);
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

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Exam Results Management
      </Typography>
      
      {/* Controls Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Select Examination"
              value={selectedExamination}
              onChange={handleExaminationChange}
              disabled={loading}
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
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Students or Subjects"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!selectedExamination || loading}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: isMobile ? 'left' : 'right' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddResultDialog}
              disabled={!selectedExamination || loading}
              sx={{ mt: isMobile ? 1 : 0 }}
            >
              Add Result
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
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.primary.main }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subject</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Marks</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Max Marks</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Percentage</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Remarks</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.map((result) => (
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
                              <SaveIcon />
                            </IconButton>
                            <IconButton color="secondary" onClick={handleCancelEdit}>
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              color="primary" 
                              onClick={() => handleEdit(result)}
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteResult(result._id)}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="textSecondary">
                No results found for this examination
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
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
            Please select an examination to view results
          </Typography>
        </Paper>
      )}
      
      {/* Add Result Dialog */}
      <Dialog open={addResultDialog} onClose={() => setAddResultDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Add New Result
          <IconButton
            aria-label="close"
            onClick={() => setAddResultDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Examination"
                name="examination"
                value={newResult.examination}
                disabled
              >
                {examinations
                  .filter(e => e._id === selectedExamination)
                  .map(exam => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.examType} - {new Date(exam.examDate).toLocaleDateString()}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Student *"
                name="student"
                value={newResult.student}
                onChange={handleNewResultChange}
                required
              >
                <MenuItem value="" disabled>Select a student</MenuItem>
                {students.map(student => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name} - {student.student_class?.class_text || "No Class"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Subject *"
                name="subject"
                value={newResult.subject}
                onChange={handleNewResultChange}
                required
              >
                <MenuItem value="" disabled>Select a subject</MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.subject_name} ({subject.subject_codename})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marks *"
                name="marks"
                type="number"
                value={newResult.marks}
                onChange={handleNewResultChange}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Marks *"
                name="maxMarks"
                type="number"
                value={newResult.maxMarks}
                onChange={handleNewResultChange}
                required
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
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddResultDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleAddResult} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save Result
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