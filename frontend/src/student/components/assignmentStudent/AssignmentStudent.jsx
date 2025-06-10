import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { keyframes, useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
  Avatar,
  InputAdornment,
  TextField,
  Badge,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Tooltip,
  Divider,
  LinearProgress,
  Skeleton,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  VideoFile as VideoIcon,
  PlayCircle as PlayIcon,
  BarChart as AnalyticsIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  Grade as GradeIcon,
  Feedback as FeedbackIcon,
  AccessTime as TimeIcon,
  DoneAll as SubmittedIcon,
  HourglassEmpty as PendingIcon,
  Warning as LateIcon
} from "@mui/icons-material";

const API_BASE = "http://localhost:5000/api";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const StudentAssignmentDashboard = () => {
  const theme = useTheme();
  const { register, handleSubmit, reset, watch } = useForm();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [classInfo, setClassInfo] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const classId = localStorage.getItem("classId");
  
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  };

  const fetchAssignments = async () => {
  try {
    setLoading(true);
    
    // Fetch assignments for student
    const assignmentsResponse = await axios.get(
      `${API_BASE}/assignments/student/list`,
      axiosConfig
    );
    
    // Fetch student's submissions
    const submissionsResponse = await axios.get(
      `${API_BASE}/assignments/submissions/student/${userId}`,
      axiosConfig
    );

    setAssignments(assignmentsResponse.data.data);
    setSubmissions(submissionsResponse.data.data);
    
    // Fetch class and subject information separately if needed
    const classResponse = await axios.get(
      `${API_BASE}/class/${classId}`,
      axiosConfig
    );
    setClassInfo(classResponse.data.data);

    const subjectsResponse = await axios.get(
      `${API_BASE}/subjects`,
      axiosConfig
    );
    setSubjects(subjectsResponse.data.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    toast.error("Failed to load assignments");
  } finally {
    setLoading(false);
  }
};

  const onSubmitAssignment = async (data) => {
    if (!selectedAssignment) return;
    
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id);
      if (data.remarks) formData.append('remarks', data.remarks);
      
      if (data.submissionFile) {
        formData.append('submission', data.submissionFile[0]);
      }
      
      if (data.submissionVideo) {
        formData.append('submissionVideo', data.submissionVideo[0]);
      }
      
      const response = await axios.post(
        `${API_BASE}/assignments/submit`,
        formData,
        {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success(response.data.message);
      reset();
      setSubmissionDialogOpen(false);
      fetchAssignments();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return formatDate(dateString).split(',')[0];
  };

  const getAssignmentStatus = (assignment) => {
    const submission = submissions.find(s => s.assignment === assignment._id);
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (submission) {
      return {
        status: 'submitted',
        late: submission.lateSubmission,
        submission
      };
    }
    
    if (now > dueDate) {
      return {
        status: 'overdue',
        late: true
      };
    }
    
    return {
      status: 'pending',
      late: false
    };
  };

  const filteredAssignments = assignments.filter(assignment => {
    // First filter by tab selection
    const status = getAssignmentStatus(assignment);
    const matchesTab =
      (selectedTab === 0) || // All
      (selectedTab === 1 && status.status === 'submitted') || // Submitted
      (selectedTab === 2 && status.status !== 'submitted'); // Pending/Overdue

    if (!matchesTab) return false;

    // Then filter by search term and status filter
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'submitted' && status.status === 'submitted') ||
                         (filterStatus === 'pending' && status.status === 'pending') ||
                         (filterStatus === 'overdue' && status.status === 'overdue');
    
    return matchesSearch && matchesFilter;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  // Skeleton loaders
  const AssignmentSkeleton = () => (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        animation: `${fadeIn} 0.5s ease-out`,
        p: 2,
        height: 100,
        mb: 2
      }}
    >
      <Box sx={{ 
        height: '100%',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: `${shimmer} 1.5s infinite`,
        borderRadius: 1
      }} />
    </Card>
  );

  useEffect(() => {
    // Verify we have the required user data
    if (!userId || !classId) {
      toast.error("User information not found. Please log in again.");
      return;
    }
    
    fetchAssignments();
  }, []);

  return (
    <Box
      sx={{
        maxWidth: 'lg',
        mx: "auto",
        p: 3,
        animation: `${fadeIn} 0.5s ease-out`,
      }}
    >
      {/* Title Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        position: 'relative'
      }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: `${gradientFlow} 6s ease infinite`,
            backgroundSize: "200% 200%",
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <AssignmentIcon fontSize="large" /> 
          My Assignments
        </Typography>
        
        {classInfo && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              icon={<ClassIcon />}
              label={classInfo.class_text} 
              variant="outlined"
              color="primary"
            />
          </Box>
        )}
      </Box>

      {/* Filter/Search Section */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: theme.shadows[1] }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="primary" /> Filter Assignments
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' },
              gap: 2,
              alignItems: 'flex-end'
            }}
          >
            <TextField
              label="Search"
              placeholder="Search assignments..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              sx={{ height: '56px', borderRadius: 2 }}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs 
        value={selectedTab} 
        onChange={(e, newValue) => setSelectedTab(newValue)}
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab label="All Assignments" icon={<AssignmentIcon />} />
        <Tab label="Submitted" icon={<SubmittedIcon />} />
        <Tab label="Pending" icon={<PendingIcon />} />
      </Tabs>

      {/* Assignments List */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: theme.shadows[1] }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon color="primary" /> Assignments
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </Typography>
          </Box>
          
          {loading && assignments.length === 0 ? (
            <Box>
              {[1, 2, 3].map((i) => (
                <AssignmentSkeleton key={i} />
              ))}
            </Box>
          ) : filteredAssignments.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                p: 4,
                borderRadius: 2,
                bgcolor: theme.palette.action.hover,
              }}
            >
              <AssignmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No assignments found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || filterStatus !== "all" || selectedTab !== 0
                  ? "No assignments match your current filters"
                  : "You don't have any assignments yet"}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
                  <TableRow>
                    <TableCell>Assignment</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const status = getAssignmentStatus(assignment);
                    
                    return (
                      <TableRow
                        key={assignment._id}
                        hover
                        sx={{
                          '&:last-child td': { borderBottom: 0 },
                          animation: `${fadeIn} 0.3s ease-out`,
                          animationDelay: `${filteredAssignments.indexOf(assignment) * 50}ms`
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight="medium">{assignment.title}</Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {assignment.description}
                          </Typography>
                          {assignment.videoUrl && (
                            <Chip
                              icon={<VideoIcon />}
                              label="Video"
                              size="small"
                              color="info"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<SubjectIcon />}
                            label={assignment.subject?.subject_name || subjects.find(s => s._id === assignment.subject)?.subject_name || "N/A"}
                            size="small"
                            sx={{ bgcolor: theme.palette.primary.light }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(assignment.dueDate)}
                            </Typography>
                            {status.late && (
                              <Chip
                                label="Late"
                                size="small"
                                color="error"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {status.status === 'submitted' ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Submitted"
                              color="success"
                              variant="outlined"
                            />
                          ) : status.status === 'overdue' ? (
                            <Chip
                              icon={<LateIcon />}
                              label="Overdue"
                              color="error"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              icon={<PendingIcon />}
                              label="Pending"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {status.status === 'submitted' ? (
                              <>
                                <Tooltip title="View Submission">
                                  <IconButton
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setSubmissionDialogOpen(true);
                                    }}
                                    color="primary"
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                {status.submission.grade !== undefined && (
                                  <Tooltip title="View Grade">
                                    <IconButton
                                      onClick={() => {
                                        setSelectedAssignment(assignment);
                                        setSubmissionDialogOpen(true);
                                      }}
                                      color="success"
                                    >
                                      <GradeIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setSubmissionDialogOpen(true);
                                }}
                                startIcon={<UploadIcon />}
                              >
                                Submit
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Submission Dialog */}
      <Dialog 
        open={submissionDialogOpen} 
        onClose={() => setSubmissionDialogOpen(false)} 
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedAssignment && getAssignmentStatus(selectedAssignment).status === 'submitted' ? (
            <>
              <SubmittedIcon color="primary" /> Your Submission
            </>
          ) : (
            <>
              <UploadIcon color="primary" /> Submit Assignment
            </>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Box sx={{ mt: 2 }}>
              {getAssignmentStatus(selectedAssignment).status === 'submitted' ? (
                // View submission details
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {selectedAssignment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAssignment.description}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Your Submission Details
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <TimeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Submitted On" 
                          secondary={formatDate(getAssignmentStatus(selectedAssignment).submission.createdAt)} 
                        />
                      </ListItem>
                      
                      {getAssignmentStatus(selectedAssignment).submission.remarks && (
                        <ListItem>
                          <ListItemIcon>
                            <FeedbackIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Your Remarks" 
                            secondary={getAssignmentStatus(selectedAssignment).submission.remarks} 
                          />
                        </ListItem>
                      )}
                      
                      {getAssignmentStatus(selectedAssignment).submission.fileUrl && (
                        <ListItem>
                          <ListItemIcon>
                            <DescriptionIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Submitted File" 
                            secondary={
                              <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => window.open(getAssignmentStatus(selectedAssignment).submission.fileUrl, '_blank')}
                                sx={{ mt: 1 }}
                              >
                                Download File
                              </Button>
                            } 
                          />
                        </ListItem>
                      )}
                      
                      {getAssignmentStatus(selectedAssignment).submission.videoUrl && (
                        <ListItem>
                          <ListItemIcon>
                            <VideoIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Submitted Video" 
                            secondary={
                              <Button
                                variant="outlined"
                                startIcon={<PlayIcon />}
                                onClick={() => window.open(getAssignmentStatus(selectedAssignment).submission.videoUrl, '_blank')}
                                sx={{ mt: 1 }}
                              >
                                Play Video
                              </Button>
                            } 
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                  
                  {getAssignmentStatus(selectedAssignment).submission.grade !== undefined && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Teacher Feedback
                        </Typography>
                        
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: theme.palette.success.light,
                          border: `1px solid ${theme.palette.success.main}`
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6">
                              Grade: {getAssignmentStatus(selectedAssignment).submission.grade}%
                            </Typography>
                            <Typography variant="body2">
                              Graded on: {formatDate(getAssignmentStatus(selectedAssignment).submission.gradedAt)}
                            </Typography>
                          </Box>
                          
                          {getAssignmentStatus(selectedAssignment).submission.feedback && (
                            <Typography sx={{ mt: 1 }}>
                              {getAssignmentStatus(selectedAssignment).submission.feedback}
                            </Typography>
                          )}
                          
                          {getAssignmentStatus(selectedAssignment).submission.feedbackVideoUrl && (
                            <Button
                              variant="contained"
                              startIcon={<PlayIcon />}
                              onClick={() => window.open(getAssignmentStatus(selectedAssignment).submission.feedbackVideoUrl, '_blank')}
                              sx={{ mt: 2 }}
                            >
                              Watch Feedback Video
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </>
                  )}
                </>
              ) : (
                // Submit assignment form
                <Box component="form" onSubmit={handleSubmit(onSubmitAssignment)}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {selectedAssignment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Due: {formatDate(selectedAssignment.dueDate)}
                    </Typography>
                    {getAssignmentStatus(selectedAssignment).status === 'overdue' && (
                      <Chip
                        label="This assignment is overdue"
                        color="error"
                        sx={{ mb: 2 }}
                      />
                    )}
                    <Typography variant="body2">
                      {selectedAssignment.description}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Assignment Files
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedAssignment.attachments.map((file, index) => (
                          <Button
                            key={index}
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => window.open(file, '_blank')}
                          >
                            Download File {index + 1}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {selectedAssignment.videoUrl && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Assignment Video
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<PlayIcon />}
                        onClick={() => window.open(selectedAssignment.videoUrl, '_blank')}
                      >
                        Watch Instruction Video
                      </Button>
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Your Submission
                    </Typography>
                    
                    <TextField
                      {...register("remarks")}
                      label="Remarks (Optional)"
                      variant="outlined"
                      fullWidth
                      multiline
                      rows={3}
                      sx={{ mb: 3 }}
                    />
                    
                    <Typography variant="body2" gutterBottom>
                      Upload your work:
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          border: `1px dashed ${theme.palette.divider}`,
                          p: 3,
                          borderRadius: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" gutterBottom>
                            Document (PDF, Word, etc.)
                          </Typography>
                          <input
                            type="file"
                            id="submissionFile"
                            {...register("submissionFile")}
                            accept=".pdf,.doc,.docx,.txt"
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="submissionFile">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<DescriptionIcon />}
                            >
                              Choose File
                            </Button>
                          </label>
                          {watch("submissionFile")?.[0] && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                              Selected: {watch("submissionFile")[0].name}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          border: `1px dashed ${theme.palette.divider}`,
                          p: 3,
                          borderRadius: 2,
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" gutterBottom>
                            Video Submission (Optional)
                          </Typography>
                          <input
                            type="file"
                            id="submissionVideo"
                            {...register("submissionVideo")}
                            accept="video/*"
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="submissionVideo">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<VideoIcon />}
                            >
                              Choose Video
                            </Button>
                          </label>
                          {watch("submissionVideo")?.[0] && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                              Selected: {watch("submissionVideo")[0].name}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setSubmissionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || (!watch("submissionFile") && !watch("submissionVideo"))}
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default StudentAssignmentDashboard;