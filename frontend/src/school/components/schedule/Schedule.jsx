import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ScheduleEvent from "./ScheduleEvent";
import axios from "axios";
import { keyframes } from "@emotion/react";

// Material UI components
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Divider,
  Badge,
  alpha,
  useTheme,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Fade,
  Grow,
  Slide,
  Zoom,
  useMediaQuery,
} from "@mui/material";

// Icons
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
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
  Menu as MenuIcon,
  Today as TodayIcon,
} from "@mui/icons-material";

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

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const localizer = momentLocalizer(moment);

// Custom calendar toolbar component
const CustomToolbar = ({ label, onNavigate, onView, view, views }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        flexWrap: "wrap",
        gap: 1,
        p: 1,
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton 
          onClick={() => onNavigate("PREV")}
          sx={{ 
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <IconButton 
          onClick={() => onNavigate("TODAY")}
          sx={{ 
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
          }}
        >
          <TodayIcon />
        </IconButton>
        <IconButton 
          onClick={() => onNavigate("NEXT")}
          sx={{ 
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
          }}
        >
          <ArrowForwardIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
          {label}
        </Typography>
      </Box>

      <Tabs
        value={view}
        onChange={(e, newView) => onView(newView)}
        sx={{
          minHeight: "unset",
          "& .MuiTabs-indicator": {
            backgroundColor: theme.palette.primary.main,
            height: 3,
          },
          "& .MuiTab-root": { 
            minHeight: 36, 
            py: 0.5,
            px: 1,
            fontSize: isMobile ? '0.7rem' : '0.875rem',
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
              label={isMobile ? icon : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {icon}
                  <span>{label}</span>
                </Box>
              )}
              sx={{
                color:
                  view === viewName
                    ? theme.palette.primary.main
                    : "text.secondary",
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

// Custom event component
const CustomEvent = ({ event, onEdit, onDelete }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 0.75,
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: 1,
        boxShadow: theme.shadows[1],
      }}
    >
      <Typography
        variant="body2"
        sx={{ 
          fontWeight: 600, 
          mb: 0.5, 
          lineHeight: 1.2,
          fontSize: '0.85rem'
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
        <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
          {moment(event.start).format("h:mm A")} -{" "}
          {moment(event.end).format("h:mm A")}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            sx={{
              color: "white",
              p: 0.25,
              backgroundColor: alpha(theme.palette.primary.contrastText, 0.2),
              "&:hover": { backgroundColor: alpha(theme.palette.primary.contrastText, 0.3) },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event);
            }}
            sx={{
              color: "white",
              p: 0.25,
              backgroundColor: alpha(theme.palette.error.contrastText, 0.2),
              "&:hover": { backgroundColor: alpha(theme.palette.error.contrastText, 0.3) },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default function Schedule() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [currentView, setCurrentView] = useState("week");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showWeekends, setShowWeekends] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statsOpen, setStatsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Stats for the selected class
  const stats = useMemo(() => {
    if (!events.length) return null;

    const subjectCounts = {};
    const teacherCounts = {};
    let totalHours = 0;

    events.forEach((event) => {
      const subjectName = event.title.split(" - ")[0];
      const teacherName = event.title.split(" - ")[1];
      const duration = (event.end - event.start) / (1000 * 60 * 60); // hours

      subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
      teacherCounts[teacherName] = (teacherCounts[teacherName] || 0) + 1;
      totalHours += duration;
    });

    return {
      totalEvents: events.length,
      totalHours: totalHours.toFixed(1),
      subjectCounts,
      teacherCounts,
    };
  }, [events]);

  const refreshSchedules = useCallback(async () => {
    if (!selectedClass) return;

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
        `http://localhost:5000/api/schedule/fetch-with-class/${selectedClass}`,
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
  }, [selectedClass]);

  useEffect(() => {
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

    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      refreshSchedules();
    }
  }, [selectedClass, refreshSchedules]);

  // Modified to ensure the dialog opens properly with null event (for adding new schedule)
  const handleOpenDialog = (event = null) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing. Please log in again.");
        return;
      }

      await axios.delete(
        `http://localhost:5000/api/schedule/${eventToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Schedule deleted successfully!");
      refreshSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setError(error.response?.data?.message || "Failed to delete schedule.");
    } finally {
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    }
  };

  const handleCloseError = () => setError(null);
  const handleCloseSuccess = () => setSuccess(null);

  const filteredEvents = useMemo(() => {
    if (!showWeekends) {
      return events.filter((event) => {
        const day = event.start.getDay();
        return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
      });
    }
    return events;
  }, [events, showWeekends]);

  const eventStyleGetter = (event) => {
    const subjectName = event.title.split(" - ")[0].toLowerCase();

    // Generate deterministic color based on subject name
    const stringToColor = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      let color = "#";
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += ("00" + value.toString(16)).substr(-2);
      }
      return color;
    };

    const baseColor = stringToColor(subjectName);

    return {
      style: {
        backgroundColor: baseColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        transition: "all 0.2s",
        "&:hover": {
          opacity: 1,
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        },
      },
    };
  };

  return (
    <Box sx={{ 
      height: "90vh", 
      p: { xs: 1, sm: 2, md: 3 },
      animation: `${fadeIn} 0.5s ease-out`,
    }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 0, sm: 2 },
          height: "100%",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          bgcolor: theme.palette.background.default,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Blue Header Bar */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
            color: "white",
            p: 2,
            borderRadius: "8px 8px 0 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            animation: `${gradientFlow} 6s ease infinite`,
            backgroundSize: '200% 200%',
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              Class Schedule Calendar
            </Typography>
          </Box>

          <Box sx={{ 
            display: "flex", 
            gap: 1, 
            flexWrap: "wrap",
            animation: `${floatAnimation} 3s ease-in-out infinite`,
          }}>
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => setStatsOpen(true)}
              disabled={!events.length}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white' }
              }}
            >
              Stats
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshSchedules}
              disabled={!selectedClass}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white' }
              }}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog(null)}
              disabled={!selectedClass}
              color="secondary"
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Add Schedule
            </Button>
          </Box>
        </Box>

        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          mb: 2, 
          flexWrap: "wrap", 
          p: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
          borderRadius: 1,
          mt: 1
        }}>
          <Box sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
            {isMobile && (
              <IconButton 
                onClick={() => setShowFilters(!showFilters)}
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <FilterListIcon />
              </IconButton>
            )}
            
            <FormControl sx={{ minWidth: 200, maxWidth: 300, flex: 1 }}>
              <InputLabel id="class-label">Class</InputLabel>
              <Select
                labelId="class-label"
                label="Class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                startAdornment={
                  <SchoolIcon sx={{ mr: 1, ml: -0.5, color: "text.secondary" }} />
                }
              >
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.class_text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {(!isMobile || showFilters) && (
            <Slide direction="left" in={!isMobile || showFilters} mountOnEnter unmountOnExit>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                gap: 1,
                width: isMobile ? '100%' : 'auto',
                p: isMobile ? 1 : 0,
                backgroundColor: isMobile ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
                borderRadius: 1
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showWeekends}
                      onChange={(e) => setShowWeekends(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show Weekends"
                />
                
                <Chip
                  icon={<EventIcon />}
                  label={`${filteredEvents.length} events`}
                  color="info"
                  variant="outlined"
                  sx={{ alignSelf: 'flex-start' }}
                />
              </Box>
            </Slide>
          )}
        </Box>

        {error && (
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={handleCloseError}
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

        <Box sx={{ 
          flex: 1, 
          overflow: "hidden", 
          borderRadius: 1, 
          mt: 1,
          position: 'relative',
        }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CircularProgress size={60} thickness={4} />
              <Typography variant="h6" color="text.secondary">
                Loading Schedule...
              </Typography>
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
              timeslots={1}
              min={new Date(new Date().setHours(8, 0))}
              max={new Date(new Date().setHours(20, 0))}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              onSelectEvent={(event) => handleOpenDialog(event)}
              showMultiDayTimes
              eventPropGetter={eventStyleGetter}
              style={{
                height: "100%",
                backgroundColor: theme.palette.background.paper,
                borderRadius: "8px",
              }}
              components={{
                toolbar: CustomToolbar,
                event: (props) => (
                  <CustomEvent
                    {...props}
                    onEdit={handleOpenDialog}
                    onDelete={handleDeleteClick}
                  />
                ),
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Schedule Event Form Dialog */}
      <ScheduleEvent
        open={dialogOpen}
        onClose={handleCloseDialog}
        event={selectedEvent}
        selectedClass={selectedClass}
        refreshSchedules={refreshSchedules}
        setError={setError}
        setSuccess={setSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, backgroundColor: theme.palette.error.light, color: 'white' }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DeleteIcon />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            Are you sure you want to delete this schedule?
          </DialogContentText>
          {eventToDelete && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: alpha(theme.palette.error.main, 0.05),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <SchoolIcon fontSize="small" /> <strong>Subject:</strong>{" "}
                {eventToDelete.title.split(" - ")[0]}
              </Typography>
              <Typography
                variant="body2"
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <PersonIcon fontSize="small" /> <strong>Teacher:</strong>{" "}
                {eventToDelete.title.split(" - ")[1]}
              </Typography>
              <Typography
                variant="body2"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <EventIcon fontSize="small" /> <strong>Time:</strong>{" "}
                {moment(eventToDelete.start).format("LLL")} -{" "}
                {moment(eventToDelete.end).format("LT")}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{ boxShadow: `0 2px 6px ${alpha(theme.palette.error.main, 0.3)}` }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InfoIcon />
            <Typography variant="h6">Schedule Statistics</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {stats ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
                <Grid item xs={6}>
                  <Card sx={{ boxShadow: theme.shadows[2] }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ textAlign: "center", fontWeight: 700 }}>
                        {stats.totalEvents}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center" }}
                      >
                        Total Events
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ boxShadow: theme.shadows[2] }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ textAlign: "center", fontWeight: 700 }}>
                        {stats.totalHours}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center" }}
                      >
                        Total Hours
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Events by Subject
              </Typography>
              <Box sx={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: 1, 
                mb: 2,
                p: 1,
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 1,
              }}>
                {Object.entries(stats.subjectCounts).map(([subject, count]) => (
                  <Chip
                    key={subject}
                    label={`${subject}: ${count}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Events by Teacher
              </Typography>
              <Box sx={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: 1,
                p: 1,
                backgroundColor: alpha(theme.palette.secondary.main, 0.03),
                borderRadius: 1,
              }}>
                {Object.entries(stats.teacherCounts).map(([teacher, count]) => (
                  <Chip
                    key={teacher}
                    label={`${teacher}: ${count}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">
                No statistics available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Schedule events to see statistics
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setStatsOpen(false)}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}