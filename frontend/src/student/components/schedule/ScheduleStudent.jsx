import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";

// Material UI components
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Divider,
  useTheme,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  TextField,
  InputAdornment,
  Badge,
  Breadcrumbs,
  Link,
  Stack,
} from "@mui/material";

// Icons
import {
  Refresh as RefreshIcon,
  Event as EventIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon,
  ViewAgenda as ViewAgendaIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Today as TodayIcon,
  Subject as SubjectIcon,
  Class as ClassIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Search,
  Home as HomeIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const localizer = momentLocalizer(moment);

// Custom calendar toolbar component
const CustomToolbar = ({ label, onNavigate, onView, view, views }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        flexWrap: "wrap",
        gap: 1,
        backgroundColor: theme.palette.background.paper,
        p: 2,
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton 
          onClick={() => onNavigate("PREV")}
          aria-label="Previous period"
          sx={{ 
            backgroundColor: theme.palette.action.hover,
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <IconButton 
          onClick={() => onNavigate("TODAY")}
          aria-label="Today"
          sx={{ 
            backgroundColor: theme.palette.action.hover,
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            }
          }}
        >
          <TodayIcon />
        </IconButton>
        <IconButton 
          onClick={() => onNavigate("NEXT")}
          aria-label="Next period"
          sx={{ 
            backgroundColor: theme.palette.action.hover,
            '&:hover': {
              backgroundColor: theme.palette.action.selected,
            }
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          {label}
        </Typography>
      </Box>

      <Tabs
        value={view}
        onChange={(e, newView) => onView(newView)}
        sx={{
          minHeight: "unset",
          "& .MuiTabs-indicator": {
            height: 4,
            borderRadius: '4px 4px 0 0',
            backgroundColor: theme.palette.primary.main,
          },
          "& .MuiTab-root": { 
            minHeight: 40, 
            py: 0.5,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          },
        }}
      >
        {views.map((viewName) => {
          let label = viewName.charAt(0).toUpperCase() + viewName.slice(1);
          let icon;
          switch (viewName) {
            case "day":
              icon = <ViewDayIcon fontSize="small" />;
              break;
            case "week":
              icon = <ViewWeekIcon fontSize="small" />;
              break;
            case "agenda":
              icon = <ViewAgendaIcon fontSize="small" />;
              break;
            default:
              icon = <EventIcon fontSize="small" />;
          }

          return (
            <Tab
              key={viewName}
              value={viewName}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {icon}
                  <span>{label}</span>
                </Box>
              }
              sx={{
                color:
                  view === viewName
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                "&.Mui-selected": { 
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                },
                minWidth: 'unset',
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

// Custom event component for student view
const StudentEvent = ({ event }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 1,
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: '4px',
      }}
    >
      <Typography
        variant="body2"
        sx={{ 
          fontWeight: 600, 
          mb: 0.5, 
          lineHeight: 1.2,
          fontSize: '0.75rem',
          color: 'white',
        }}
      >
        {event.title}
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: "auto",
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: "0.65rem",
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {moment(event.start).format("h:mm A")} -{" "}
          {moment(event.end).format("h:mm A")}
        </Typography>
      </Box>
    </Box>
  );
};

export default function StudentSchedule() {
  const theme = useTheme();
  const [classes, setClasses] = useState([]);
  const [currentView, setCurrentView] = useState("week");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statsOpen, setStatsOpen] = useState(false);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Get student's class from user data or let them select
  const studentClass = useMemo(() => {
    // In a real app, this would come from the student's profile
    return classes.length > 0 ? classes[0]._id : "";
  }, [classes]);

  // Stats for the schedule
  const stats = useMemo(() => {
    if (!events.length) return null;

    const subjectCounts = {};
    const teacherCounts = {};
    let totalHours = 0;
    const uniqueDays = new Set();

    events.forEach((event) => {
      const subjectName = event.title.split(" - ")[0];
      const teacherName = event.title.split(" - ")[1];
      const duration = (event.end - event.start) / (1000 * 60 * 60); // hours
      const day = moment(event.start).format("YYYY-MM-DD");

      subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
      teacherCounts[teacherName] = (teacherCounts[teacherName] || 0) + 1;
      totalHours += duration;
      uniqueDays.add(day);
    });

    return {
      totalEvents: events.length,
      totalHours: totalHours.toFixed(1),
      totalDays: uniqueDays.size,
      subjectCounts,
      teacherCounts,
      averagePerDay: (totalHours / uniqueDays.size).toFixed(1),
    };
  }, [events]);

  // Filter events based on search and other criteria
  const filteredEvents = useMemo(() => {
    let result = [...events];
    
    if (!showWeekends) {
      result = result.filter((event) => {
        const day = event.start.getDay();
        return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(term) ||
        event.resource.subject?.subject_name.toLowerCase().includes(term) ||
        event.resource.teacher?.name.toLowerCase().includes(term)
      );
    }

    if (filteredSubjects.length > 0) {
      result = result.filter(event => 
        filteredSubjects.includes(event.resource.subject?._id)
      );
    }

    if (filteredTeachers.length > 0) {
      result = result.filter(event => 
        filteredTeachers.includes(event.resource.teacher?._id)
      );
    }

    return result;
  }, [events, showWeekends, searchTerm, filteredSubjects, filteredTeachers]);

  // Fetch student's schedule
  const refreshSchedules = useCallback(async () => {
    if (!studentClass) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/schedule/fetch-with-class/${studentClass}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data.success) {
        setError(response.data.message || "Failed to load schedules");
        return;
      }

      const formattedEvents = response.data.data.map((schedule) => {
        const start = new Date(schedule.startTime);
        const end = new Date(schedule.endTime);

        return {
          id: schedule._id,
          title: `${schedule.subject?.subject_name || "Unknown"} - ${
            schedule.teacher?.name || "Unknown"
          }`,
          start,
          end,
          resource: schedule,
          subjectId: schedule.subject?._id,
          teacherId: schedule.teacher?._id,
          classId: schedule.class?._id,
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setError(
        error.response?.data?.message || "Failed to load schedule data."
      );
    } finally {
      setLoading(false);
    }
  }, [studentClass]);

  // Fetch classes (for admin view or if student can switch classes)
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/class/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data.success) {
        setError(response.data.message || "Failed to load classes");
        return;
      }

      const fetchedClasses = response.data.data;
      setClasses(fetchedClasses);

      if (fetchedClasses.length > 0) {
        setSelectedClass(fetchedClasses[0]._id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError(error.response?.data?.message || "Failed to load classes.");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (studentClass) {
      refreshSchedules();
    }
  }, [studentClass, refreshSchedules]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };

  const handleCloseEventDetails = () => {
    setEventDetailsOpen(false);
    setSelectedEvent(null);
  };

  const handleCloseError = () => setError(null);
  const handleCloseSuccess = () => setSuccess(null);

  const eventStyleGetter = (event) => {
    // Use subject-based color if available, otherwise fall back to a default
    const subjectColor = event.resource.subject?.color || '#3f51b5';
    
    return {
      style: {
        backgroundColor: subjectColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        cursor: "pointer",
        boxShadow: theme.shadows[1],
        transition: "all 0.2s ease",
        "&:hover": {
          opacity: 1,
          boxShadow: theme.shadows[3],
          transform: 'translateY(-1px)',
        },
      },
    };
  };

  // Extract unique subjects and teachers for filtering
  const { subjects, teachers } = useMemo(() => {
    const subjectsMap = new Map();
    const teachersMap = new Map();

    events.forEach(event => {
      if (event.resource.subject) {
        subjectsMap.set(event.resource.subject._id, {
          ...event.resource.subject,
          color: event.resource.subject.color || '#3f51b5'
        });
      }
      if (event.resource.teacher) {
        teachersMap.set(event.resource.teacher._id, event.resource.teacher);
      }
    });

    return {
      subjects: Array.from(subjectsMap.values()),
      teachers: Array.from(teachersMap.values())
    };
  }, [events]);

  const toggleSubjectFilter = (subjectId) => {
    setFilteredSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId) 
        : [...prev, subjectId]
    );
  };

  const toggleTeacherFilter = (teacherId) => {
    setFilteredTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId) 
        : [...prev, teacherId]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilteredSubjects([]);
    setFilteredTeachers([]);
    setShowWeekends(true);
  };

  const hasActiveFilters = searchTerm || filteredSubjects.length > 0 || filteredTeachers.length > 0 || !showWeekends;

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', p: { xs: 1, sm: 2 } }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ScheduleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Schedule
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          My Classes
        </Typography>
      </Breadcrumbs>

      <Paper
        elevation={0}
        sx={{
          height: "100%",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          bgcolor: 'background.default',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            p: 2,
            backgroundColor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SchoolIcon color="primary" fontSize="large" />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                My Class Schedule
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title="View statistics">
                <Button
                  variant="outlined"
                  startIcon={<InfoIcon />}
                  onClick={() => setStatsOpen(true)}
                  disabled={!events.length}
                  size="small"
                >
                  Stats
                </Button>
              </Tooltip>

              <Tooltip title="Refresh schedule">
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={refreshSchedules}
                  disabled={!studentClass || loading}
                  size="small"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Quick Filter Bar */}
        <Box
          sx={{
            p: 1,
            backgroundColor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            size="small"
            placeholder="Search classes..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              sx: { 
                backgroundColor: 'background.paper',
                width: 200,
              }
            }}
          />

          <Tooltip title="Toggle weekends">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showWeekends}
                  onChange={(e) => setShowWeekends(e.target.checked)}
                  color="primary"
                />
              }
              label="Weekends"
              labelPlacement="start"
              sx={{ ml: 0 }}
            />
          </Tooltip>

          <Button
            variant="text"
            size="small"
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersOpen(!filtersOpen)}
            sx={{ ml: 'auto' }}
          >
            {filtersOpen ? 'Hide Filters' : 'More Filters'}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="text"
              size="small"
              onClick={clearAllFilters}
              color="error"
            >
              Clear All
            </Button>
          )}
        </Box>

        {/* Expanded Filters Section */}
        {filtersOpen && (
          <Box
            sx={{
              p: 2,
              backgroundColor: 'background.paper',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Filter Classes
            </Typography>
            
            {subjects.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                  By Subject:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {subjects.map(subject => (
                    <Chip
                      key={subject._id}
                      label={subject.subject_name}
                      onClick={() => toggleSubjectFilter(subject._id)}
                      color={filteredSubjects.includes(subject._id) ? "primary" : "default"}
                      variant={filteredSubjects.includes(subject._id) ? "filled" : "outlined"}
                      icon={<SubjectIcon />}
                      size="small"
                      sx={{
                        '&.MuiChip-filledPrimary': {
                          backgroundColor: subject.color,
                          color: 'white',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {teachers.length > 0 && (
              <Box>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                  By Teacher:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {teachers.map(teacher => (
                    <Chip
                      key={teacher._id}
                      label={teacher.name}
                      onClick={() => toggleTeacherFilter(teacher._id)}
                      color={filteredTeachers.includes(teacher._id) ? "secondary" : "default"}
                      variant={filteredTeachers.includes(teacher._id) ? "filled" : "outlined"}
                      icon={<PersonIcon />}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Status Indicators */}
        {hasActiveFilters && (
          <Box
            sx={{
              p: 1,
              backgroundColor: theme.palette.action.selected,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                Active Filters:
              </Typography>
              
              {!showWeekends && (
                <Chip
                  label="No weekends"
                  size="small"
                  onDelete={() => setShowWeekends(true)}
                />
              )}
              
              {searchTerm && (
                <Chip
                  label={`Search: "${searchTerm}"`}
                  size="small"
                  onDelete={() => setSearchTerm('')}
                />
              )}
              
              {filteredSubjects.length > 0 && (
                <Chip
                  label={`${filteredSubjects.length} subject(s)`}
                  size="small"
                  onDelete={() => setFilteredSubjects([])}
                />
              )}
              
              {filteredTeachers.length > 0 && (
                <Chip
                  label={`${filteredTeachers.length} teacher(s)`}
                  size="small"
                  onDelete={() => setFilteredTeachers([])}
                />
              )}
            </Stack>
          </Box>
        )}

        {error && (
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={handleCloseError}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={handleCloseError}
              severity="error"
              sx={{ width: "100%" }}
              variant="filled"
            >
              {error}
            </Alert>
          </Snackbar>
        )}

        {success && (
          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={handleCloseSuccess}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={handleCloseSuccess}
              severity="success"
              sx={{ width: "100%" }}
              variant="filled"
            >
              {success}
            </Alert>
          </Snackbar>
        )}

        {/* Main Calendar Content */}
        <Box sx={{ flex: 1, overflow: "hidden", position: 'relative' }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                p: 2,
              }}
            >
              <Skeleton variant="rectangular" width="100%" height={80} />
              <Skeleton variant="rectangular" width="100%" height="80%" />
            </Box>
          ) : (
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              view={currentView}
              onView={setCurrentView}
              views={{ week: true, day: true, agenda: true }}
              defaultView="week"
              step={30}
              timeslots={2}
              min={new Date(new Date().setHours(7, 0))}
              max={new Date(new Date().setHours(21, 0))}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              onSelectEvent={handleEventClick}
              showMultiDayTimes
              eventPropGetter={eventStyleGetter}
              style={{
                height: "100%",
                backgroundColor: theme.palette.background.paper,
              }}
              components={{
                toolbar: CustomToolbar,
                event: StudentEvent,
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Event Details Dialog */}
      <Dialog
        open={eventDetailsOpen}
        onClose={handleCloseEventDetails}
        fullWidth
        maxWidth="sm"
      >
        {selectedEvent && (
          <>
            <DialogTitle sx={{ 
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
              <EventIcon />
              <Typography variant="h6">Class Details</Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: selectedEvent.resource.subject?.color || theme.palette.primary.main,
                      color: 'white',
                    }}>
                      <SubjectIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Subject"
                    secondary={selectedEvent.resource.subject?.subject_name || "Unknown"}
                    secondaryTypographyProps={{ color: 'text.primary' }}
                  />
                </ListItem>

                <Divider component="li" variant="inset" />

                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.secondary.main, color: 'white' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Teacher"
                    secondary={selectedEvent.resource.teacher?.name || "Unknown"}
                    secondaryTypographyProps={{ color: 'text.primary' }}
                  />
                </ListItem>

                <Divider component="li" variant="inset" />

                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.success.main, color: 'white' }}>
                      <ClassIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Class"
                    secondary={selectedEvent.resource.class?.class_text || "Unknown"}
                    secondaryTypographyProps={{ color: 'text.primary' }}
                  />
                </ListItem>

                <Divider component="li" variant="inset" />

                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main, color: 'white' }}>
                      <TimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Time"
                    secondary={`${moment(selectedEvent.start).format("h:mm A")} - ${moment(selectedEvent.end).format("h:mm A")}`}
                    secondaryTypographyProps={{ color: 'text.primary' }}
                  />
                </ListItem>

                <Divider component="li" variant="inset" />

                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.info.main, color: 'white' }}>
                      <CalendarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Date"
                    secondary={moment(selectedEvent.start).format("dddd, MMMM Do YYYY")}
                    secondaryTypographyProps={{ color: 'text.primary' }}
                  />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEventDetails}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Stats Dialog */}
      <Dialog
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <InfoIcon />
          <Typography variant="h6">Schedule Statistics</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {stats ? (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {stats.totalEvents}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        color="text.secondary"
                      >
                        Total Classes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {stats.totalHours}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        color="text.secondary"
                      >
                        Total Hours
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {stats.averagePerDay}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        color="text.secondary"
                      >
                        Avg Hours/Day
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Classes by Subject
                  </Typography>
                  {Object.entries(stats.subjectCounts).map(([subject, count]) => {
                    const percentage = (count / stats.totalEvents) * 100;
                    return (
                      <Box key={subject} sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {subject}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} ({percentage.toFixed(1)}%)
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: theme.palette.primary.main,
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Classes by Teacher
                  </Typography>
                  {Object.entries(stats.teacherCounts).map(([teacher, count]) => {
                    const percentage = (count / stats.totalEvents) * 100;
                    return (
                      <Box key={teacher} sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {teacher}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} ({percentage.toFixed(1)}%)
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: theme.palette.secondary.main,
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Grid>
              </Grid>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No statistics available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}