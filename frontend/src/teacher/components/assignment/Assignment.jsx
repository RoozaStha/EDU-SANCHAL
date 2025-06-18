import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { keyframes, useTheme, alpha } from "@mui/material/styles";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Skeleton,
  Grid,
  FormGroup,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  useMediaQuery,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
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
  Extension as ExtensionIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  Grading as GradingIcon,
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

const API_BASE = "http://localhost:5000/api";
const FILE_BASE = API_BASE.replace('/api', '');

// Animation Keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
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

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const TeacherAssignmentDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      subject: "",
      class: "",
    },
  });
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState({
    assignments: false,
    submissions: false,
    analytics: false,
    form: false,
  });
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [gradeForm, setGradeForm] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [extensionDate, setExtensionDate] = useState("");
  const [rubricScores, setRubricScores] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: "dueDate",
    direction: "asc",
  });
  const [activeTab, setActiveTab] = useState("assignments");
  const [submissionCounts, setSubmissionCounts] = useState({});

  const token = localStorage.getItem("token");
  const watchClass = watch("class");

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

  // Memoized axios config
  const axiosConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    }),
    [token]
  );

  // Formatting utilities
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatDateForInput = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  }, []);

  const getTimeAgo = useCallback(
    (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return "Just now";

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return formatDate(dateString).split(",")[0];
    },
    [formatDate]
  );

  // Data fetching functions
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, assignments: true }));
      const response = await axios.get(
        `${API_BASE}/assignments/teacher/list`,
        axiosConfig
      );
      setAssignments(response.data.data);
      
      const initialCounts = {};
      response.data.data.forEach(assignment => {
        initialCounts[assignment._id] = assignment.submissionCount || 0;
      });
      setSubmissionCounts(initialCounts);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  }, [axiosConfig]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/class/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setClasses(response.data.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to fetch classes");
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/subjects`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSubjects(response.data.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to fetch subjects");
    }
  }, []);

  const fetchSubmissions = useCallback(
    async (assignmentId) => {
      try {
        setLoading((prev) => ({ ...prev, submissions: true }));
        const response = await axios.get(
          `${API_BASE}/assignments/submissions/${assignmentId}`,
          axiosConfig
        );
        setSubmissions(response.data.data);
        
        setSubmissionCounts(prev => ({
          ...prev,
          [assignmentId]: response.data.data.length
        }));
      } catch (error) {
        console.error("Error fetching submissions:", error);
        toast.error("Failed to fetch submissions");
      } finally {
        setLoading((prev) => ({ ...prev, submissions: false }));
      }
    },
    [axiosConfig]
  );

  const fetchAnalytics = useCallback(
    async (assignmentId) => {
      try {
        setLoading((prev) => ({ ...prev, analytics: true }));
        const response = await axios.get(
          `${API_BASE}/assignments/analytics/${assignmentId}`,
          axiosConfig
        );
        setAnalytics(response.data.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to fetch assignment analytics");
      } finally {
        setLoading((prev) => ({ ...prev, analytics: false }));
      }
    },
    [axiosConfig]
  );

  // Form submission handler
  const onSubmit = useCallback(
    async (data) => {
      try {
        setLoading((prev) => ({ ...prev, form: true }));

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("subject", data.subject);
        formData.append("class", data.class);
        formData.append("dueDate", data.dueDate);
        formData.append("videoUrl", data.videoUrl || "");
        formData.append("rubric", JSON.stringify(data.rubric || []));
        formData.append("maxPoints", data.maxPoints);
        formData.append("allowLateSubmission", data.allowLateSubmission);
        formData.append("peerReviewEnabled", data.peerReviewEnabled);

        if (data.attachments) {
          for (let i = 0; i < data.attachments.length; i++) {
            formData.append("attachments", data.attachments[i]);
          }
        }

        if (data.assignmentVideo) {
          formData.append("assignmentVideo", data.assignmentVideo[0]);
        }

        const endpoint =
          isEditing && currentAssignment
            ? `${API_BASE}/assignments/${currentAssignment._id}`
            : `${API_BASE}/assignments/`;

        const method = isEditing ? "put" : "post";

        const response = await axios[method](endpoint, formData, {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success(response.data.message);
        reset({
          subject: "",
          class: "",
        });
        fetchAssignments();
        setIsEditing(false);
        setCurrentAssignment(null);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Operation failed");
      } finally {
        setLoading((prev) => ({ ...prev, form: false }));
      }
    },
    [isEditing, currentAssignment, axiosConfig, fetchAssignments, reset]
  );

  // Assignment CRUD operations
  const handleEdit = useCallback(
    (assignment) => {
      setIsEditing(true);
      setCurrentAssignment(assignment);

      const subjectValue = subjects.some(
        (s) => s._id === assignment.subject?._id
      )
        ? assignment.subject?._id
        : "";

      const classValue = classes.some((c) => c._id === assignment.class?._id)
        ? assignment.class?._id
        : "";

      reset({
        title: assignment.title || "",
        description: assignment.description || "",
        subject: subjectValue,
        class: classValue,
        dueDate: formatDateForInput(assignment.dueDate) || "",
        videoUrl: assignment.videoUrl || "",
        maxPoints: assignment.maxPoints || 100,
        allowLateSubmission: assignment.allowLateSubmission || false,
        peerReviewEnabled: assignment.peerReviewEnabled || false,
        rubric: assignment.rubric || [],
      });
    },
    [reset, formatDateForInput, subjects, classes]
  );

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setCurrentAssignment(null);
    reset({
      subject: "",
      class: "",
    });
  }, [reset]);

  const openDeleteDialog = useCallback((assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!assignmentToDelete) return;

    try {
      await axios.delete(
        `${API_BASE}/assignments/${assignmentToDelete._id}`,
        axiosConfig
      );
      toast.success("Assignment deleted successfully");
      fetchAssignments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete assignment");
    } finally {
      closeDeleteDialog();
    }
  }, [assignmentToDelete, axiosConfig, fetchAssignments, closeDeleteDialog]);

  // Submission grading functions
  const handleGradeChange = useCallback((submissionId, value) => {
    setGradeForm((prev) => ({
      ...prev,
      [submissionId]: value,
    }));
  }, []);

  const handleRubricScoreChange = useCallback(
    (submissionId, criteriaId, value) => {
      setRubricScores((prev) => ({
        ...prev,
        [submissionId]: {
          ...(prev[submissionId] || {}),
          [criteriaId]: value,
        },
      }));
    },
    []
  );

  const submitGrade = useCallback(
    async (submissionId) => {
      const formData = new FormData();

      if (gradeForm[submissionId]) {
        formData.append("grade", gradeForm[submissionId]);
      }

      if (rubricScores[submissionId]) {
        formData.append(
          "rubricScores",
          JSON.stringify(
            Object.entries(rubricScores[submissionId]).map(
              ([criteriaId, score]) => ({
                criteriaId,
                score,
              })
            )
          )
        );
      }

      if (document.getElementById(`feedback-${submissionId}`).value) {
        formData.append(
          "feedback",
          document.getElementById(`feedback-${submissionId}`).value
        );
      }

      if (document.getElementById(`feedbackVideo-${submissionId}`).files[0]) {
        formData.append(
          "feedbackVideo",
          document.getElementById(`feedbackVideo-${submissionId}`).files[0]
        );
      }

      try {
        setIsSubmittingGrade(true);
        await axios.post(
          `${API_BASE}/assignments/submissions/${submissionId}/grade`,
          formData,
          {
            ...axiosConfig,
            headers: {
              ...axiosConfig.headers,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Grade submitted successfully");
        fetchSubmissions(selectedAssignmentId);
        setGradeForm((prev) => ({ ...prev, [submissionId]: "" }));
      } catch (error) {
        console.error(error);
        toast.error("Failed to submit grade");
      } finally {
        setIsSubmittingGrade(false);
      }
    },
    [
      gradeForm,
      rubricScores,
      axiosConfig,
      selectedAssignmentId,
      fetchSubmissions,
    ]
  );

  // Submission dialog functions
  const openSubmissionDialog = useCallback((submission) => {
    setSelectedSubmission(submission);
    setSubmissionDialogOpen(true);
  }, []);

  const closeSubmissionDialog = useCallback(() => {
    setSubmissionDialogOpen(false);
    setSelectedSubmission(null);
  }, []);

  const openExtensionDialog = useCallback((submission) => {
    setSelectedSubmission(submission);
    setExtensionDialogOpen(true);
    setExtensionDate("");
  }, []);

  const closeExtensionDialog = useCallback(() => {
    setExtensionDialogOpen(false);
    setSelectedSubmission(null);
    setExtensionDate("");
  }, []);

  const grantExtension = useCallback(async () => {
    if (!selectedSubmission || !extensionDate) return;

    try {
      await axios.post(
        `${API_BASE}/assignments/submissions/${selectedSubmission._id}/extension`,
        { extensionDate },
        axiosConfig
      );
      toast.success("Extension granted successfully");
      fetchSubmissions(selectedAssignmentId);
      closeExtensionDialog();
    } catch (error) {
      console.error(error);
      toast.error("Failed to grant extension");
    }
  }, [
    selectedSubmission,
    extensionDate,
    axiosConfig,
    selectedAssignmentId,
    fetchSubmissions,
    closeExtensionDialog,
  ]);

  // Sorting functionality
  const handleSort = useCallback(
    (key) => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  // Filtered and sorted assignments
  const filteredAssignments = useMemo(() => {
    let result = assignments.filter((assignment) => {
      const matchesSearch =
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = filterClass
        ? assignment.class?._id === filterClass
        : true;
      const matchesSubject = filterSubject
        ? assignment.subject?._id === filterSubject
        : true;

      return matchesSearch && matchesClass && matchesSubject;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (sortConfig.key === "dueDate") {
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [assignments, searchTerm, filterClass, filterSubject, sortConfig]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterClass("");
    setFilterSubject("");
  }, []);

  // Skeleton loaders
  const AssignmentSkeleton = useCallback(
    () => (
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          transition: "all 0.3s ease",
          animation: `${fadeIn} 0.5s ease-out`,
          p: 2,
          height: 100,
          mb: 2,
          background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box
          sx={{
            height: "100%",
            background: `linear-gradient(90deg, ${alpha(
              theme.palette.text.disabled,
              0.1
            )} 25%, 
                    ${alpha(theme.palette.text.disabled, 0.05)} 50%, 
                    ${alpha(theme.palette.text.disabled, 0.1)} 75%)`,
            backgroundSize: "200% 100%",
            animation: `${shimmer} 1.5s infinite`,
            borderRadius: 1,
          }}
        />
      </Card>
    ),
    [theme]
  );

  const SubmissionSkeleton = useCallback(
    () => (
      <TableRow>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ ml: 2 }}>
              <Skeleton variant="text" width={100} />
              <Skeleton variant="text" width={150} />
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Skeleton variant="text" />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width={120} />
        </TableCell>
        <TableCell>
          <Skeleton variant="text" width={80} />
        </TableCell>
        <TableCell>
          <Skeleton variant="circular" width={24} height={24} />
        </TableCell>
      </TableRow>
    ),
    []
  );

  // Chart components
  const BarChart = ({ data, maxValue, color }) => {
    return (
      <Box sx={{ display: "flex", alignItems: "flex-end", height: 120, gap: 1, mt: 2 }}>
        {data.map((value, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Box
              sx={{
                width: "80%",
                height: `${(value / maxValue) * 100}%`,
                background: `linear-gradient(to top, ${alpha(color, 0.7)} 0%, ${alpha(color, 1)} 100%)`,
                borderRadius: "4px 4px 0 0",
                position: "relative",
                transition: "height 0.5s ease",
                animation: `${fadeIn} 0.5s ease-out`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  top: -25,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontWeight: "bold",
                  color: theme.palette.text.primary,
                }}
              >
                {value}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ mt: 1, fontWeight: "medium", color: theme.palette.text.secondary }}
            >
              {index * 10}-{(index + 1) * 10}%
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const TimeChart = ({ data }) => {
    return (
      <Box sx={{ position: "relative", height: 120, mt: 2, px: 2 }}>
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: alpha(theme.palette.text.primary, 0.2),
          }}
        />
        {data.map((value, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              bottom: 0,
              left: `${(index / (data.length - 1)) * 100}%`,
              width: 8,
              height: `${value}%`,
              backgroundColor: theme.palette.primary.main,
              borderRadius: "4px 4px 0 0",
              transform: "translateX(-50%)",
              transition: "height 0.5s ease",
              animation: `${fadeIn} 0.5s ease-out`,
              "&:after": {
                content: '""',
                position: "absolute",
                top: -8,
                left: "50%",
                transform: "translateX(-50%)",
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: -30,
                left: "50%",
                transform: "translateX(-50%)",
                fontWeight: "bold",
                color: theme.palette.text.primary,
              }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // Initial data fetch
  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchSubjects();
  }, [fetchAssignments, fetchClasses, fetchSubjects]);

  // Fetch submissions when assignment is selected
  useEffect(() => {
    if (selectedAssignmentId) {
      fetchSubmissions(selectedAssignmentId);
      fetchAnalytics(selectedAssignmentId);
    }
  }, [selectedAssignmentId, fetchSubmissions, fetchAnalytics]);

  return (
    <Box
      sx={{
        maxWidth: "lg",
        mx: "auto",
        p: { xs: 0, sm: 3 },
        animation: `${fadeIn} 0.5s ease-out`,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: "white",
          p: 3,
          borderRadius: { xs: 0, sm: 2 },
          boxShadow: theme.shadows[4],
          mb: 4,
          position: "relative",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 40%)",
          }
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontSize: { xs: "1.8rem", sm: "2.4rem" },
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              <AssignmentIcon fontSize="large" sx={{ color: "white" }} />
              Assignment Dashboard
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
              Manage and track student assignments
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Chip
              icon={<CalendarIcon sx={{ color: "white" }} />}
              label={`Last updated: ${formatDate(new Date()).split(",")[0]}`}
              variant="outlined"
              size="small"
              sx={{ 
                fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                color: "white",
                borderColor: "rgba(255,255,255,0.3)",
                bgcolor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
              }}
            />
            <Badge
              badgeContent={
                assignments.filter((a) => new Date(a.dueDate) < new Date()).length
              }
              color="error"
            >
              <Chip
                label={`Total: ${assignments.length}`}
                variant="outlined"
                avatar={
                  <Avatar sx={{ width: 24, height: 24, bgcolor: "rgba(255,255,255,0.2)" }}>
                    {assignments.length}
                  </Avatar>
                }
                sx={{ 
                  fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  bgcolor: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                }}
              />
            </Badge>
          </Box>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              minHeight: 48,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              "&.Mui-selected": {
                color: theme.palette.primary.main,
              },
            },
            "& .MuiTabs-indicator": {
              height: 4,
              borderRadius: "2px 2px 0 0",
            },
          }}
        >
          <Tab
            label="Assignments"
            value="assignments"
            icon={<AssignmentIcon />}
            iconPosition="start"
          />
          {selectedAssignmentId && (
            <Tab
              label="Submissions"
              value="submissions"
              icon={<SchoolIcon />}
              iconPosition="start"
            />
          )}
          {selectedAssignmentId && analytics && (
            <Tab
              label="Analytics"
              value="analytics"
              icon={<AnalyticsIcon />}
              iconPosition="start"
            />
          )}
        </Tabs>
      </Box>

      {/* Create/Edit Assignment Form */}
      {activeTab === "assignments" && (
        <Card
          sx={{
            mb: 4,
            borderRadius: 2,
            boxShadow: theme.shadows[2],
            animation: isEditing ? `${pulse} 2s infinite` : "none",
            borderLeft: isEditing
              ? `4px solid ${theme.palette.primary.main}`
              : "none",
            background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            backdropFilter: "blur(10px)",
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              component="h2"
              sx={{ 
                mb: 2, 
                display: "flex", 
                alignItems: "center", 
                gap: 1,
                color: theme.palette.primary.dark,
                fontWeight: 600,
              }}
            >
              {isEditing ? (
                <>
                  <EditIcon color="primary" /> Edit Assignment
                </>
              ) : (
                <>
                  <AssignmentIcon color="primary" /> Create New Assignment
                </>
              )}
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              encType="multipart/form-data"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <TextField
                {...register("title", { required: "Title is required" })}
                label="Title"
                placeholder="Assignment Title"
                variant="outlined"
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title?.message}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                  },
                }}
              />
              <TextField
                {...register("description")}
                label="Description"
                placeholder="Assignment Description"
                variant="outlined"
                fullWidth
                multiline
                rows={1}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                  },
                }}
              />
              <FormControl fullWidth error={!!errors.subject}>
                <InputLabel>Subject *</InputLabel>
                <Select
                  {...register("subject", { required: "Subject is required" })}
                  label="Subject *"
                  value={watch("subject") || ""}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.8),
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select Subject</em>
                  </MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject._id} value={subject._id}>
                      {subject.subject_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.subject && (
                  <Typography variant="caption" color="error">
                    {errors.subject.message}
                  </Typography>
                )}
              </FormControl>
              <FormControl fullWidth error={!!errors.class}>
                <InputLabel>Class *</InputLabel>
                <Select
                  {...register("class", { required: "Class is required" })}
                  label="Class *"
                  value={watch("class") || ""}
                  disabled={classes.length === 0}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.8),
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select Class</em>
                  </MenuItem>
                  {classes.length === 0 ? (
                    <MenuItem disabled>Loading classes...</MenuItem>
                  ) : (
                    classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.class_text}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.class && (
                  <Typography variant="caption" color="error">
                    {errors.class.message}
                  </Typography>
                )}
              </FormControl>

              <TextField
                {...register("dueDate", { required: "Due date is required" })}
                label="Due Date *"
                type="date"
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                fullWidth
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
                inputProps={{
                  min: new Date().toISOString().split("T")[0],
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                  },
                }}
              />
              <TextField
                {...register("maxPoints", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Minimum 1 point" },
                  max: { value: 1000, message: "Maximum 1000 points" },
                })}
                label="Max Points"
                type="number"
                variant="outlined"
                fullWidth
                defaultValue={100}
                error={!!errors.maxPoints}
                helperText={errors.maxPoints?.message}
                InputProps={{ inputProps: { min: 1, max: 1000 } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                  },
                }}
              />
              <Box sx={{ gridColumn: "1 / -1" }}>
                <FormGroup>
                  <FormControlLabel
                    control={<Switch {...register("allowLateSubmission")} />}
                    label="Allow Late Submissions"
                  />
                  <FormControlLabel
                    control={<Switch {...register("peerReviewEnabled")} />}
                    label="Enable Peer Review"
                  />
                </FormGroup>
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography variant="subtitle1" gutterBottom>
                  Assignment Video
                </Typography>
                <input
                  type="file"
                  accept="video/*"
                  {...register("assignmentVideo")}
                />
                <TextField
                  {...register("videoUrl")}
                  label="Or Video URL"
                  placeholder="https://example.com/video.mp4"
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography variant="subtitle1" gutterBottom>
                  Attachments
                </Typography>
                <input type="file" multiple {...register("attachments")} />
              </Box>
              <Box
                sx={{
                  gridColumn: { xs: "1", md: "1 / -1" },
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 2,
                }}
              >
                {isEditing && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancelEdit}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading.form}
                  sx={{ 
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: theme.shadows[2],
                    "&:hover": {
                      boxShadow: theme.shadows[4],
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                  startIcon={
                    loading.form ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  {isEditing ? "Update Assignment" : "Create Assignment"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Filter/Search Section */}
      {activeTab === "assignments" && (
        <Card sx={{ 
          mb: 4, 
          borderRadius: 2, 
          boxShadow: theme.shadows[1],
          background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: "blur(10px)",
        }}>
          <CardContent>
            <Typography
              variant="h5"
              component="h2"
              sx={{ 
                mb: 2, 
                display: "flex", 
                alignItems: "center", 
                gap: 1,
                color: theme.palette.primary.dark,
                fontWeight: 600,
              }}
            >
              <FilterListIcon color="primary" /> Filter Assignments
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                  md: "2fr 1fr 1fr auto",
                },
                gap: 2,
                alignItems: "flex-end",
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
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm("")}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.8),
                  },
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  label="Class"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.8),
                    },
                  }}
                >
                  <MenuItem value="">All Classes</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.class_text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  label="Subject"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.8),
                    },
                  }}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject._id} value={subject._id}>
                      {subject.subject_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                sx={{ 
                  height: "56px", 
                  borderRadius: 2,
                  borderColor: theme.palette.text.disabled,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                  },
                }}
              >
                Clear
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      {activeTab === "assignments" && (
        <Card sx={{ 
          mb: 4, 
          borderRadius: 2, 
          boxShadow: theme.shadows[1],
          background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: "blur(10px)",
        }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  color: theme.palette.primary.dark,
                  fontWeight: 600,
                }}
              >
                <AssignmentIcon color="primary" /> Your Assignments
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Showing {filteredAssignments.length} of {assignments.length}{" "}
                assignments
              </Typography>
            </Box>

            {loading.assignments && assignments.length === 0 ? (
              <Box>
                {[1, 2, 3].map((i) => (
                  <AssignmentSkeleton key={i} />
                ))}
              </Box>
            ) : filteredAssignments.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  p: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.action.hover, 0.3),
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <AssignmentIcon
                  sx={{ 
                    fontSize: 60, 
                    color: "text.disabled", 
                    mb: 2,
                    opacity: 0.5,
                  }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No assignments found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || filterClass || filterSubject
                    ? "No assignments match your current filters"
                    : "You haven't created any assignments yet"}
                </Typography>
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  background: "transparent",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Table>
                  <TableHead sx={{ 
                    bgcolor: alpha(theme.palette.primary.light, 0.1),
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }}>
                    <TableRow>
                      <TableCell>
                        <Button
                          onClick={() => handleSort("title")}
                          startIcon={<SortIcon />}
                          endIcon={
                            sortConfig.key === "title" ? (
                              sortConfig.direction === "asc" ? (
                                <ArrowUpwardIcon fontSize="small" />
                              ) : (
                                <ArrowDownwardIcon fontSize="small" />
                              )
                            ) : null
                          }
                          sx={{ 
                            textTransform: "none", 
                            fontWeight: "bold",
                            color: theme.palette.text.primary,
                          }}
                        >
                          Title
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleSort("subject")}
                          startIcon={<SortIcon />}
                          endIcon={
                            sortConfig.key === "subject" ? (
                              sortConfig.direction === "asc" ? (
                                <ArrowUpwardIcon fontSize="small" />
                              ) : (
                                <ArrowDownwardIcon fontSize="small" />
                              )
                            ) : null
                          }
                          sx={{ 
                            textTransform: "none", 
                            fontWeight: "bold",
                            color: theme.palette.text.primary,
                          }}
                        >
                          Subject
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleSort("class")}
                          startIcon={<SortIcon />}
                          endIcon={
                            sortConfig.key === "class" ? (
                              sortConfig.direction === "asc" ? (
                                <ArrowUpwardIcon fontSize="small" />
                              ) : (
                                <ArrowDownwardIcon fontSize="small" />
                              )
                            ) : null
                          }
                          sx={{ 
                            textTransform: "none", 
                            fontWeight: "bold",
                            color: theme.palette.text.primary,
                          }}
                        >
                          Class
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleSort("dueDate")}
                          startIcon={<SortIcon />}
                          endIcon={
                            sortConfig.key === "dueDate" ? (
                              sortConfig.direction === "asc" ? (
                                <ArrowUpwardIcon fontSize="small" />
                              ) : (
                                <ArrowDownwardIcon fontSize="small" />
                              )
                            ) : null
                          }
                          sx={{ 
                            textTransform: "none", 
                            fontWeight: "bold",
                            color: theme.palette.text.primary,
                          }}
                        >
                          Due Date
                        </Button>
                      </TableCell>
                      <TableCell>Submissions</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAssignments.map((assignment) => (
                      <TableRow
                        key={assignment._id}
                        hover
                        sx={{
                          "&:last-child td": { borderBottom: 0 },
                          animation: `${fadeIn} 0.3s ease-out`,
                          animationDelay: `${
                            filteredAssignments.indexOf(assignment) * 50
                          }ms`,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.light, 0.05),
                          },
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight="medium">
                            {assignment.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: 300 }}
                          >
                            {assignment.description}
                          </Typography>
                          {assignment.videoUrl && (
                            <Chip
                              icon={<VideoIcon />}
                              label="Video"
                              size="small"
                              color="info"
                              sx={{ mt: 0.5 }}
                              onClick={() => handleOpenFile(assignment.videoUrl)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<SubjectIcon />}
                            label={assignment.subject?.subject_name || "N/A"}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(theme.palette.primary.light, 0.2),
                              color: theme.palette.primary.dark,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<ClassIcon />}
                            label={assignment.class?.class_text || "N/A"}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(theme.palette.secondary.light, 0.2),
                              color: theme.palette.secondary.dark,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(assignment.dueDate)}
                            </Typography>
                            {new Date(assignment.dueDate) < new Date() && (
                              <Chip
                                label="Overdue"
                                size="small"
                                color="error"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="text"
                            color="primary"
                            onClick={() => {
                              setSelectedAssignmentId(assignment._id);
                              setActiveTab("submissions");
                              fetchSubmissions(assignment._id);
                            }}
                            startIcon={<SchoolIcon />}
                            sx={{ 
                              textTransform: "none",
                              fontWeight: 600,
                            }}
                          >
                            {submissionCounts[assignment._id] || 0} submissions
                          </Button>
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "flex-end",
                            }}
                          >
                            <Tooltip title="Edit">
                              <IconButton
                                onClick={() => handleEdit(assignment)}
                                sx={{
                                  bgcolor: alpha(theme.palette.info.light, 0.1),
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.info.light, 0.2),
                                  },
                                }}
                              >
                                <EditIcon color="info" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                onClick={() => openDeleteDialog(assignment)}
                                sx={{
                                  bgcolor: alpha(theme.palette.error.light, 0.1),
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.error.light, 0.2),
                                  },
                                }}
                              >
                                <DeleteIcon color="error" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Analytics">
                              <IconButton
                                onClick={() => {
                                  setSelectedAssignmentId(assignment._id);
                                  setActiveTab("analytics");
                                  fetchAnalytics(assignment._id);
                                }}
                                sx={{
                                  bgcolor: alpha(theme.palette.success.light, 0.1),
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.success.light, 0.2),
                                  },
                                }}
                              >
                                <AnalyticsIcon color="success" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analytics Section */}
      {activeTab === "analytics" && selectedAssignmentId && analytics && (
        <Card sx={{ 
          mb: 4, 
          borderRadius: 2, 
          boxShadow: theme.shadows[1],
          background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: "blur(10px)",
        }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  color: theme.palette.primary.dark,
                  fontWeight: 600,
                }}
              >
                <AnalyticsIcon color="primary" /> Assignment Analytics
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab("submissions")}
                  startIcon={<SchoolIcon />}
                  sx={{ mr: 1 }}
                >
                  View Submissions
                </Button>
                <IconButton onClick={() => {
                  setAnalytics(null);
                  setActiveTab("assignments");
                }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    textAlign: "center",
                    p: 2,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    height: "100%",
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: "blur(10px)",
                    boxShadow: theme.shadows[1],
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h4" color="primary">
                    {analytics.totalSubmissions}
                  </Typography>
                  <Typography variant="body2">Total Submissions</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.submissionRate} 
                    sx={{ 
                      mt: 2, 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.light, 0.2),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        bgcolor: theme.palette.primary.main,
                      },
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {analytics.submissionRate}% submission rate
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    textAlign: "center",
                    p: 2,
                    borderLeft: `4px solid ${theme.palette.success.main}`,
                    height: "100%",
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: "blur(10px)",
                    boxShadow: theme.shadows[1],
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h4" color="success.main">
                    {analytics.gradedSubmissions}
                  </Typography>
                  <Typography variant="body2">Graded</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.gradedPercentage} 
                    sx={{ 
                      mt: 2, 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.success.light, 0.2),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        bgcolor: theme.palette.success.main,
                      },
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {analytics.gradedPercentage}% of submissions
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    textAlign: "center",
                    p: 2,
                    borderLeft: `4px solid ${theme.palette.error.main}`,
                    height: "100%",
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: "blur(10px)",
                    boxShadow: theme.shadows[1],
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h4" color="error.main">
                    {analytics.lateSubmissions}
                  </Typography>
                  <Typography variant="body2">Late</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.latePercentage} 
                    sx={{ 
                      mt: 2, 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.error.light, 0.2),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        bgcolor: theme.palette.error.main,
                      },
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {analytics.latePercentage}% of submissions
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    textAlign: "center",
                    p: 2,
                    borderLeft: `4px solid ${theme.palette.warning.main}`,
                    height: "100%",
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: "blur(10px)",
                    boxShadow: theme.shadows[1],
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h4">
                    {analytics.averageGrade.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">Avg Grade</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.passingRate} 
                    sx={{ 
                      mt: 2, 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.warning.light, 0.2),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        bgcolor: theme.palette.warning.main,
                      },
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {analytics.passingRate}% passing rate
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ 
                  p: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: "blur(10px)",
                  boxShadow: theme.shadows[1],
                  borderRadius: 2,
                }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 1,
                      fontWeight: 600,
                    }}
                  >
                    <AssessmentIcon /> Grade Distribution
                  </Typography>
                  <BarChart 
                    data={[12, 18, 24, 22, 15, 9]} 
                    maxValue={30} 
                    color={theme.palette.primary.main} 
                  />
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  p: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: "blur(10px)",
                  boxShadow: theme.shadows[1],
                  borderRadius: 2,
                }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 1,
                      fontWeight: 600,
                    }}
                  >
                    <GradingIcon /> Submission Timeline
                  </Typography>
                  <TimeChart data={[35, 45, 60, 75, 65, 50, 40, 30]} />
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  p: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: "blur(10px)",
                  boxShadow: theme.shadows[1],
                  borderRadius: 2,
                }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 1,
                      fontWeight: 600,
                    }}
                  >
                    <AccessTimeIcon /> Time Spent Analysis
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 2 }}>
                    <Box sx={{ 
                      position: "relative", 
                      width: 120, 
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={75} 
                        size={120} 
                        thickness={4}
                        sx={{ 
                          color: theme.palette.success.main,
                          position: "absolute",
                        }} 
                      />
                      <Box sx={{ textAlign: "center", zIndex: 1 }}>
                        <Typography variant="h5" fontWeight="bold">
                          45 min
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Average time
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Submissions Section */}
      {activeTab === "submissions" && selectedAssignmentId && (
        <Card sx={{ 
          borderRadius: 2, 
          boxShadow: theme.shadows[1],
          background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: "blur(10px)",
        }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  color: theme.palette.primary.dark,
                  fontWeight: 600,
                }}
              >
                <SchoolIcon color="primary" /> Submissions
              </Typography>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab("analytics")}
                  startIcon={<AnalyticsIcon />}
                >
                  View Analytics
                </Button>
                <IconButton onClick={() => {
                  setSelectedAssignmentId("");
                  setActiveTab("assignments");
                }}>
                  <ArrowBackIcon />
                </IconButton>
              </Box>
            </Box>

            {loading.submissions && submissions.length === 0 ? (
              <Box>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SubmissionSkeleton key={i} />
                ))}
              </Box>
            ) : submissions.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  p: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.action.hover, 0.3),
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <SchoolIcon
                  sx={{ 
                    fontSize: 60, 
                    color: "text.disabled", 
                    mb: 2,
                    opacity: 0.5,
                  }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No submissions yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Students haven't submitted any work for this assignment yet
                </Typography>
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  background: "transparent",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Table>
                  <TableHead sx={{ 
                    bgcolor: alpha(theme.palette.primary.light, 0.1),
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }}>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Submission</TableCell>
                      <TableCell>Submitted On</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow
                        key={sub._id}
                        hover
                        sx={{
                          "&:last-child td": { borderBottom: 0 },
                          animation: `${fadeIn} 0.3s ease-out`,
                          animationDelay: `${submissions.indexOf(sub) * 50}ms`,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.light, 0.05),
                          },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              src={getFileUrl(sub.student?.image_url)}
                              sx={{ width: 40, height: 40 }}
                            >
                              {sub.student?.name?.charAt(0) || "?"}
                            </Avatar>
                            <Box>
                              <Typography fontWeight="medium">
                                {sub.student?.name || "Unknown"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <EmailIcon fontSize="small" />
                                {sub.student?.email || "N/A"}
                              </Typography>
                              {sub.lateSubmission && (
                                <Chip
                                  label="Late"
                                  size="small"
                                  color="error"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {sub.fileUrl && (
                              <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleOpenFile(sub.fileUrl)}
                                sx={{ 
                                  textTransform: "none",
                                  borderRadius: 2,
                                }}
                              >
                                Document
                              </Button>
                            )}
                            {sub.videoUrl && (
                              <Button
                                variant="outlined"
                                startIcon={<PlayIcon />}
                                onClick={() => handleOpenFile(sub.videoUrl)}
                                sx={{ 
                                  textTransform: "none",
                                  borderRadius: 2,
                                }}
                              >
                                Video
                              </Button>
                            )}
                          </Box>
                          {sub.remarks && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Remarks: {sub.remarks}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(sub.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({getTimeAgo(sub.createdAt)})
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {sub.grade !== undefined ? (
                            <Box>
                              <Chip
                                label={`${sub.grade}%`}
                                color={
                                  sub.grade >= 70
                                    ? "success"
                                    : sub.grade >= 50
                                    ? "warning"
                                    : "error"
                                }
                                variant="outlined"
                                sx={{ fontWeight: "bold" }}
                              />
                              {sub.feedback && (
                                <Tooltip title={sub.feedback}>
                                  <InfoIcon
                                    color="action"
                                    sx={{ ml: 1, verticalAlign: "middle" }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Box>
                              <TextField
                                size="small"
                                placeholder="Grade"
                                value={gradeForm[sub._id] || ""}
                                onChange={(e) =>
                                  handleGradeChange(sub._id, e.target.value)
                                }
                                sx={{ 
                                  width: 80, 
                                  mb: 1,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    background: alpha(theme.palette.background.paper, 0.8),
                                  },
                                }}
                                type="number"
                                inputProps={{ min: 0, max: 100 }}
                              />
                              <TextField
                                id={`feedback-${sub._id}`}
                                placeholder="Feedback"
                                size="small"
                                multiline
                                rows={2}
                                sx={{ 
                                  width: "100%", 
                                  mb: 1,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    background: alpha(theme.palette.background.paper, 0.8),
                                  },
                                }}
                              />
                              <input
                                id={`feedbackVideo-${sub._id}`}
                                type="file"
                                accept="video/*"
                                style={{ display: "none" }}
                              />
                              <label htmlFor={`feedbackVideo-${sub._id}`}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  component="span"
                                  startIcon={<VideoIcon />}
                                  sx={{ 
                                    mb: 1,
                                    borderRadius: 2,
                                  }}
                                >
                                  Video Feedback
                                </Button>
                              </label>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => submitGrade(sub._id)}
                                disabled={isSubmittingGrade}
                                sx={{ 
                                  ml: 1,
                                  borderRadius: 2,
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                  boxShadow: theme.shadows[1],
                                  "&:hover": {
                                    boxShadow: theme.shadows[2],
                                  },
                                }}
                              >
                                {isSubmittingGrade ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  "Submit"
                                )}
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                onClick={() => openSubmissionDialog(sub)}
                                sx={{
                                  bgcolor: alpha(theme.palette.info.light, 0.1),
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.info.light, 0.2),
                                  },
                                }}
                              >
                                <VisibilityIcon color="info" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Grant Extension">
                              <IconButton
                                onClick={() => openExtensionDialog(sub)}
                                color="secondary"
                                disabled={sub.grade !== undefined}
                                sx={{
                                  bgcolor: alpha(theme.palette.secondary.light, 0.1),
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.secondary.light, 0.2),
                                  },
                                }}
                              >
                                <ExtensionIcon color="secondary" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the assignment "
            {assignmentToDelete?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone and will also delete all associated
            submissions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              boxShadow: theme.shadows[1],
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submission Details Dialog */}
      <Dialog
        open={submissionDialogOpen}
        onClose={closeSubmissionDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            backdropFilter: "blur(10px)",
          }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 1,
          fontWeight: 600,
        }}>
          <VisibilityIcon color="primary" /> Submission Details
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  mb: 3,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Avatar
                  src={getFileUrl(selectedSubmission.student?.image_url)}
                  sx={{ width: 64, height: 64 }}
                >
                  {selectedSubmission.student?.name?.charAt(0) || "?"}
                </Avatar>
                <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
                  <Typography variant="h6" fontWeight="medium">
                    {selectedSubmission.student?.name || "Unknown Student"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSubmission.student?.email || "N/A"}
                  </Typography>
                  {selectedSubmission.grade !== undefined && (
                    <Chip
                      label={`Grade: ${selectedSubmission.grade}%`}
                      color={
                        selectedSubmission.grade >= 70
                          ? "success"
                          : selectedSubmission.grade >= 50
                          ? "warning"
                          : "error"
                      }
                      sx={{ 
                        mt: 1, 
                        fontWeight: "bold",
                        boxShadow: theme.shadows[1],
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                  sx={{ color: theme.palette.primary.dark }}
                >
                  Assignment Details
                </Typography>
                <Typography>
                  <strong>Title:</strong>{" "}
                  {assignments.find(
                    (a) => a._id === selectedSubmission.assignment
                  )?.title || "N/A"}
                </Typography>
                <Typography>
                  <strong>Submitted On:</strong>{" "}
                  {formatDate(selectedSubmission.createdAt)}
                </Typography>
                {selectedSubmission.lateSubmission && (
                  <Typography color="error">
                    <strong>Late Submission</strong>
                  </Typography>
                )}
                {selectedSubmission.remarks && (
                  <Typography sx={{ mt: 1 }}>
                    <strong>Remarks:</strong> {selectedSubmission.remarks}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                  sx={{ color: theme.palette.primary.dark }}
                >
                  Submission Files
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    justifyContent: { xs: "center", sm: "flex-start" },
                  }}
                >
                  {selectedSubmission.fileUrl && (
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleOpenFile(selectedSubmission.fileUrl)}
                      sx={{ 
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        boxShadow: theme.shadows[1],
                      }}
                    >
                      Download Document
                    </Button>
                  )}
                  {selectedSubmission.videoUrl && (
                    <Button
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={() => handleOpenFile(selectedSubmission.videoUrl)}
                      sx={{ 
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                        boxShadow: theme.shadows[1],
                      }}
                    >
                      Play Submission Video
                    </Button>
                  )}
                </Box>
              </Box>

              {selectedSubmission.feedback && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="medium"
                      gutterBottom
                      sx={{ color: theme.palette.primary.dark }}
                    >
                      Teacher Feedback
                    </Typography>
                    <Card
                      variant="outlined"
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: alpha(theme.palette.info.light, 0.1),
                        borderRadius: 2,
                      }}
                    >
                      <Typography>{selectedSubmission.feedback}</Typography>
                    </Card>
                    {selectedSubmission.feedbackVideoUrl && (
                      <Button
                        variant="contained"
                        startIcon={<PlayIcon />}
                        onClick={() =>
                          handleOpenFile(selectedSubmission.feedbackVideoUrl)
                        }
                        sx={{ 
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                          boxShadow: theme.shadows[1],
                        }}
                      >
                        Play Feedback Video
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSubmissionDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Extension Dialog */}
      <Dialog open={extensionDialogOpen} onClose={closeExtensionDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            backdropFilter: "blur(10px)",
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
            <ExtensionIcon color="primary" /> Grant Extension
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ mt: 2, minWidth: { xs: "auto", sm: 400 } }}>
              <Typography gutterBottom>
                Grant extension for:{" "}
                <strong>{selectedSubmission.student?.name}</strong>
              </Typography>
              <TextField
                label="New Due Date"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                fullWidth
                value={extensionDate}
                onChange={(e) => setExtensionDate(e.target.value)}
                sx={{ mt: 2 }}
                inputProps={{
                  min: new Date().toISOString().slice(0, 16),
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                The student will have until this date to submit their work.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeExtensionDialog}>Cancel</Button>
          <Button
            onClick={grantExtension}
            variant="contained"
            disabled={!extensionDate}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              boxShadow: theme.shadows[1],
            }}
          >
            Grant Extension
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAssignmentDashboard;