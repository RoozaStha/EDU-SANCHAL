import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Card, CardContent, CardActions, Button,
  Chip, Avatar, Divider, LinearProgress, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, Grid, Paper, Stack, Tabs, Tab,
  AppBar, Toolbar, useMediaQuery, useTheme,
  MenuItem
} from '@mui/material';
import {
  Assignment, Description, CalendarToday, CheckCircle,
  Pending, Error, Upload, Download, Close,
  VideoLibrary, PlayCircle, Subject, Class, Person, FilterList
} from '@mui/icons-material';
import { format, parseISO, isBefore } from 'date-fns';

const API_BASE = "http://localhost:5000/api";
const FILE_BASE = API_BASE.replace('/api', '');

const StudentAssignmentDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionVideo, setSubmissionVideo] = useState(null);
  const [submissionRemarks, setSubmissionRemarks] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();

  // File handling helper
  const getFileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    return FILE_BASE + path;
  };

  const handleOpenFile = (url) => {
    const fullUrl = getFileUrl(url);
    if (fullUrl) window.open(fullUrl, '_blank');
  };

  // Fetch assignments from the API
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/assignments/student/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch assignments. Please try again later.');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch student submissions
  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE}/assignments/submissions/student/list`, 
        { headers: { Authorization: `Bearer ${token}` }},
      );
      setSubmissions(response.data.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load your submissions');
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchSubmissions();
  }, []);

  const handleFileChange = (e) => {
    setSubmissionFile(e.target.files[0]);
  };

  const handleVideoChange = (e) => {
    setSubmissionVideo(e.target.files[0]);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;
   
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id);
      formData.append('remarks', submissionRemarks);
     
      if (submissionFile) {
        formData.append('submission', submissionFile);
      }
     
      if (submissionVideo) {
        formData.append('feedbackVideo', submissionVideo);
      } else if (videoUrl) {
        formData.append('videoUrl', videoUrl);
      }
     
      const response = await axios.post(`${API_BASE}/assignments/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
     
      setSuccessMessage('Assignment submitted successfully!');
      fetchAssignments();
      fetchSubmissions();
      setSubmissionDialogOpen(false);
      
      // Reset form
      setSubmissionFile(null);
      setSubmissionVideo(null);
      setVideoUrl('');
      setSubmissionRemarks('');
    } catch (err) {
      setError('Failed to submit assignment. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Status calculation logic
  const getAssignmentStatus = (assignment, submission) => {
    if (!assignment) return {
      status: 'Error',
      color: 'error',
      icon: <Error />,
      text: 'Assignment data missing'
    };

    const dueDate = parseISO(assignment.dueDate);
    const now = new Date();
    
    if (submission) {
      return {
        status: 'Submitted',
        color: 'success',
        icon: <CheckCircle />,
        text: `Submitted on ${format(parseISO(submission.createdAt), 'MMM dd, yyyy')}`,
        late: submission.lateSubmission
      };
    }
    
    if (isBefore(dueDate, now)) {
      return {
        status: 'Overdue',
        color: 'error',
        icon: <Error />,
        text: 'Past due date',
        late: true
      };
    }
    
    return {
      status: 'Pending',
      color: 'warning',
      icon: <Pending />,
      text: `Due ${format(dueDate, 'MMM dd, yyyy')}`,
      late: false
    };
  };

  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  // Find submission for assignment
  const findSubmission = (assignmentId) => {
    return submissions.find(
      s => s.assignment && s.assignment._id === assignmentId
    );
  };

  const getSubmissionStatus = (submission) => {
    if (submission.grade !== undefined && submission.grade !== null) {
      return {
        status: 'Graded',
        color: 'success',
        text: `Grade: ${submission.grade}%`,
        icon: <CheckCircle />
      };
    }
   
    return {
      status: 'Submitted',
      color: 'info',
      text: 'Pending grading',
      icon: <Pending />
    };
  };

  // Filter assignments based on subject and status
  const filteredAssignments = assignments.filter(assignment => {
    const subjectMatch = filterSubject ? 
      assignment.subject.subject_name.includes(filterSubject) : true;
    
    const statusMatch = filterStatus ? 
      getAssignmentStatus(assignment, findSubmission(assignment._id)).status === filterStatus : true;
    
    return subjectMatch && statusMatch;
  });

  // Get unique subjects for filter dropdown
  const uniqueSubjects = [...new Set(assignments.map(a => a.subject.subject_name))];

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
              <FilterList />
            </IconButton>
          )}
          <Typography
            variant="h4"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            <Box component="span" sx={{ color: "#ffffff" }}>
              Assignment
            </Box>
            <Box component="span" sx={{ color: "#ffffff", ml: 1 }}>
              Dashboard
            </Box>
          </Typography>
        </Toolbar>
      </AppBar>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ 
          mb: 3, 
          background: "#f5f9ff", 
          borderRadius: 2,
          boxShadow: theme.shadows[1]
        }}
        variant={isMobile ? "scrollable" : "standard"}
      >
        <Tab
          label="Active Assignments"
          icon={<Assignment />}
          sx={{ fontWeight: "bold", minHeight: 60 }}
        />
        <Tab
          label="My Submissions"
          icon={<Description />}
          sx={{ fontWeight: "bold", minHeight: 60 }}
        />
      </Tabs>

      {/* Filters Section */}
      {showFilters && activeTab === 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Filter by Subject"
                select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <MenuItem value="">All Subjects</MenuItem>
                {uniqueSubjects.map(subject => (
                  <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Filter by Status"
                select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Submitted">Submitted</MenuItem>
                <MenuItem value="Overdue">Overdue</MenuItem>
                <MenuItem value="Graded">Graded</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {!showFilters && isMobile && activeTab === 0 && (
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

      {/* Active Assignments Tab */}
      {activeTab === 0 && (
        <>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress size={60} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : filteredAssignments.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" color="text.secondary">
                No assignments available at this time
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Check back later or contact your teacher
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredAssignments.map((assignment) => {
                const submission = findSubmission(assignment._id);
                const status = getAssignmentStatus(assignment, submission);
               
                return (
                  <Grid item xs={12} md={6} key={assignment._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        boxShadow: 3,
                        borderLeft: `4px solid ${
                          status.color === 'success' ? '#4caf50' :
                          status.color === 'warning' ? '#ff9800' :
                          '#f44336'
                        }`,
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip
                            label={assignment.subject.subject_name}
                            size="small"
                            sx={{
                              bgcolor: '#e3f2fd',
                              color: '#1976d2',
                              fontWeight: 'bold'
                            }}
                          />
                          <Chip
                            icon={status.icon}
                            label={status.status}
                            color={status.color}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                       
                        <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>
                          {assignment.title}
                        </Typography>
                       
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                          {assignment.description}
                        </Typography>
                       
                        <Divider sx={{ my: 2 }} />
                       
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Class sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                              <Typography variant="body2">
                                Class: {assignment.class.class_text}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Person sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                              <Typography variant="body2">
                                Teacher: {assignment.teacher.name}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarToday sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                              <Typography variant="body2" color={status.late ? 'error' : 'inherit'}>
                                {status.text}
                              </Typography>
                              {status.late && (
                                <Chip
                                  label="Late"
                                  size="small"
                                  color="error"
                                  sx={{ ml: 1, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                       
                        {assignment.attachments.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Attachments:
                            </Typography>
                            <Stack spacing={1}>
                              {assignment.attachments.map((file, index) => (
                                <Chip
                                  key={index}
                                  icon={<Description />}
                                  label={file.split('/').pop()}
                                  onClick={() => handleOpenFile(file)}
                                  sx={{
                                    cursor: 'pointer',
                                    justifyContent: 'flex-start',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    borderRadius: 1
                                  }}
                                />
                              ))}
                            </Stack>
                          </Box>
                        )}
                       
                        {assignment.videoUrl && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Instructional Video:
                            </Typography>
                            <Chip
                              icon={<VideoLibrary />}
                              label="Watch Video"
                              onClick={() => handleOpenFile(assignment.videoUrl)}
                              sx={{ cursor: 'pointer', borderRadius: 1 }}
                              color="primary"
                            />
                          </Box>
                        )}
                       
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Max Points: {assignment.maxPoints}
                          </Typography>
                          {assignment.peerReviewEnabled && (
                            <Chip 
                              label="Peer Review" 
                              size="small" 
                              color="secondary" 
                              sx={{ fontWeight: 'bold' }}
                            />
                          )}
                        </Box>
                      </CardContent>
                     
                      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                        {!submission ? (
                          <Button
                            variant="contained"
                            startIcon={<Upload />}
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setSubmissionDialogOpen(true);
                            }}
                            disabled={isBefore(parseISO(assignment.dueDate), new Date()) && !assignment.allowLateSubmission}
                            sx={{ 
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              '&:hover': {
                                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                              }
                            }}
                          >
                            {isBefore(parseISO(assignment.dueDate), new Date()) && !assignment.allowLateSubmission
                              ? 'Submission Closed'
                              : 'Submit Assignment'}
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setActiveTab(1);
                              setTimeout(() => {
                                document.getElementById(`submission-${submission._id}`)?.scrollIntoView({
                                  behavior: 'smooth'
                                });
                              }, 100);
                            }}
                            sx={{ fontWeight: 'bold' }}
                          >
                            View Submission
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}

      {/* My Submissions Tab */}
      {activeTab === 1 && (
        <Box>
          {submissions.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" color="text.secondary">
                You haven't submitted any assignments yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Submit your first assignment to see it here
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {submissions.map((submission) => {
                if (!submission.assignment) return null;
                
                const assignment = assignments.find(a => a._id === submission.assignment._id) || submission.assignment;
                const status = getSubmissionStatus(submission);
               
                return (
                  <Grid item xs={12} key={submission._id} id={`submission-${submission._id}`}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {assignment.title}
                        </Typography>
                        <Chip
                          icon={status.icon}
                          label={status.status}
                          color={status.color}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                     
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Submitted on: {formatDate(submission.createdAt)}
                          </Typography>
                         
                          {submission.lateSubmission && (
                            <Chip
                              label="Late Submission"
                              size="small"
                              color="error"
                              sx={{ mt: 1, fontWeight: 'bold' }}
                            />
                          )}
                         
                          {submission.remarks && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Your Remarks:
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                {submission.remarks}
                              </Typography>
                            </Box>
                          )}
                         
                          {submission.fileUrl && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Submitted File:
                              </Typography>
                              <Button
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={() => handleOpenFile(submission.fileUrl)}
                                sx={{ fontWeight: 'bold' }}
                              >
                                Download File
                              </Button>
                            </Box>
                          )}
                         
                          {(submission.videoUrl || submission.feedbackVideoUrl) && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {submission.videoUrl ? 'Submitted Video:' : 'Feedback Video:'}
                              </Typography>
                              <Button
                                variant="outlined"
                                startIcon={<PlayCircle />}
                                onClick={() =>
                                  handleOpenFile(submission.videoUrl || submission.feedbackVideoUrl)
                                }
                                sx={{ fontWeight: 'bold' }}
                              >
                                {submission.videoUrl ? 'Watch Your Video' : 'Watch Feedback'}
                              </Button>
                            </Box>
                          )}
                        </Grid>
                       
                        <Grid item xs={12} md={6}>
                          {submission.grade !== undefined && submission.grade !== null && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Grade: {submission.grade}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={submission.grade}
                                sx={{ 
                                  height: 10, 
                                  borderRadius: 5,
                                  backgroundColor: theme.palette.grey[300],
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 5
                                  }
                                }}
                                color={
                                  submission.grade >= 90 ? 'success' :
                                  submission.grade >= 70 ? 'primary' :
                                  'error'
                                }
                              />
                            </Box>
                          )}
                         
                          {submission.feedback && (
                            <Box sx={{
                              bgcolor: '#f5f5f5',
                              p: 2,
                              borderRadius: 1,
                              borderLeft: '3px solid #3f51b5'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Teacher Feedback:
                              </Typography>
                              <Typography variant="body2">
                                {submission.feedback}
                              </Typography>
                            </Box>
                          )}
                         
                          {assignment.rubric && assignment.rubric.length > 0 && submission.rubricScores && (
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Rubric Assessment:
                              </Typography>
                              {assignment.rubric.map((criteria, index) => {
                                const score = submission.rubricScores.find(
                                  s => s.criteriaId === criteria._id
                                )?.score;
                               
                                return (
                                  <Box key={index} sx={{ mb: 1 }}>
                                    <Typography variant="body2">
                                      {criteria.name}: {score || 0}/{criteria.maxScore}
                                    </Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={(score || 0) / criteria.maxScore * 100}
                                      sx={{ 
                                        height: 6, 
                                        borderRadius: 3,
                                        backgroundColor: theme.palette.grey[300],
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 3
                                        }
                                      }}
                                    />
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* Submission Dialog */}
      <Dialog
        open={submissionDialogOpen}
        onClose={() => setSubmissionDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Submit Assignment: {selectedAssignment?.title}
            </Typography>
            <IconButton onClick={() => setSubmissionDialogOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
       
        <DialogContent sx={{ p: 3 }}>
          {selectedAssignment && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedAssignment.description}
              </Typography>
             
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Subject:</strong> {selectedAssignment.subject.subject_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Class:</strong> {selectedAssignment.class.class_text}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Teacher:</strong> {selectedAssignment.teacher.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color={isBefore(parseISO(selectedAssignment.dueDate), new Date()) ? 'error' : 'inherit'}>
                      <strong>Due Date:</strong> {formatDate(selectedAssignment.dueDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Max Points:</strong> {selectedAssignment.maxPoints}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
             
              <TextField
                label="Remarks (optional)"
                multiline
                rows={3}
                fullWidth
                value={submissionRemarks}
                onChange={(e) => setSubmissionRemarks(e.target.value)}
                sx={{ mb: 3 }}
                variant="outlined"
              />
             
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Upload Assignment File (PDF, DOC, etc.)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                  sx={{ mr: 2, fontWeight: 'bold' }}
                >
                  Choose File
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                </Button>
                {submissionFile && (
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Selected: {submissionFile.name}
                  </Typography>
                )}
              </Box>
             
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Video Submission
                </Typography>
               
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2">
                    Option 1: Upload a video file
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Upload />}
                    sx={{ alignSelf: 'flex-start', fontWeight: 'bold' }}
                  >
                    Choose Video File
                    <input
                      type="file"
                      hidden
                      onChange={handleVideoChange}
                      accept="video/*"
                    />
                  </Button>
                  {submissionVideo && (
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Selected: {submissionVideo.name}
                    </Typography>
                  )}
                 
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Option 2: Provide a video URL (YouTube, Vimeo, etc.)
                  </Typography>
                  <TextField
                    label="Video URL"
                    fullWidth
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    variant="outlined"
                  />
                </Box>
              </Box>
             
              {selectedAssignment.attachments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Assignment Attachments
                  </Typography>
                  <Stack spacing={1}>
                    {selectedAssignment.attachments.map((file, index) => (
                      <Chip
                        key={index}
                        icon={<Description />}
                        label={file.split('/').pop()}
                        onClick={() => handleOpenFile(file)}
                        sx={{ 
                          cursor: 'pointer', 
                          justifyContent: 'flex-start',
                          borderRadius: 1
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          )}
        </DialogContent>
       
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setSubmissionDialogOpen(false)}
            sx={{ fontWeight: 'bold' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitAssignment}
            disabled={submitting || (!submissionFile && !submissionVideo && !videoUrl)}
            startIcon={submitting ? <CircularProgress size={20} /> : <Upload />}
            sx={{ 
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage('')} 
          severity="success" 
          sx={{ 
            width: '100%',
            fontWeight: 'bold',
            boxShadow: 3
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ 
            width: '100%',
            fontWeight: 'bold',
            boxShadow: 3
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentAssignmentDashboard;