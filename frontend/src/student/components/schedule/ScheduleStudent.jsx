import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Material UI components
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  IconButton,
  useTheme,
  Card,
  Grid,
  Skeleton,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CardContent,
  Chip,
  Divider,
  alpha,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar
} from "@mui/material";

// Icons
import {
  Event as EventIcon,
  School as SchoolIcon,
  Info as InfoIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon,
  ViewAgenda as ViewAgendaIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  Schedule as ScheduleIcon,
  Class as ClassIcon,
  Person as PersonIcon,
  Subject as SubjectIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon
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
        background: alpha(theme.palette.primary.main, 0.08),
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title="Previous">
          <IconButton 
            onClick={() => onNavigate("PREV")}
            sx={{
              background: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          >
            <ArrowBackIcon color="primary" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Today">
          <IconButton 
            onClick={() => onNavigate("TODAY")}
            sx={{
              background: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          >
            <EventIcon color="primary" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Next">
          <IconButton 
            onClick={() => onNavigate("NEXT")}
            sx={{
              background: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          >
            <ArrowForwardIcon color="primary" />
          </IconButton>
        </Tooltip>
        
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            color: theme.palette.primary.dark,
            ml: 1,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}
        >
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
            borderRadius: 2,
            backgroundColor: theme.palette.primary.main,
          },
          "& .MuiTab-root": { 
            minHeight: 40, 
            py: 0.5,
            borderRadius: 1,
            mr: 1,
            '&.Mui-selected': {
              background: alpha(theme.palette.primary.main, 0.1)
            }
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
                  fontWeight: 600
                },
                transition: 'all 0.2s ease',
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

// Custom event component
const CustomEvent = ({ event }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        sx={{
          p: 1,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Typography
          variant="body2"
          sx={{ 
            fontWeight: 700, 
            mb: 0.5, 
            lineHeight: 1.2,
            fontSize: '0.8rem'
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
              fontWeight: 500,
              color: alpha('#fff', 0.9)
            }}
          >
            {moment(event.start).format("h:mm A")} -{" "}
            {moment(event.end).format("h:mm A")}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

export default function ScheduleStudent() {
  const theme = useTheme();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [currentView, setCurrentView] = useState("week");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statsOpen, setStatsOpen] = useState(false);
  
  // NEW STATES FOR EVENT DETAILS
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

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

  const handleCloseError = () => setError(null);

  // NEW: Event click handler
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };

  // NEW: Close event details
  const handleCloseEventDetails = () => {
    setEventDetailsOpen(false);
    setSelectedEvent(null);
  };

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
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        cursor: "pointer",
        boxShadow: theme.shadows[2],
        transition: "all 0.3s ease",
        "&:hover": {
          opacity: 1,
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)"
        },
      },
    };
  };

  return (
    <Box sx={{ height: "90vh", p: { xs: 1, sm: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          height: "100%",
          borderRadius: 4,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <SchoolIcon 
              sx={{ 
                fontSize: 40,
                color: theme.palette.primary.main,
                background: alpha(theme.palette.primary.main, 0.1),
                p: 1,
                borderRadius: 2
              }} 
            />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: -0.5
              }}
            >
              Class Schedule
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<BarChartIcon />}
                onClick={() => setStatsOpen(true)}
                disabled={!events.length}
                sx={{
                  borderRadius: 2,
                  boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                View Stats
              </Button>
            </motion.div>

            <Tooltip title="Refresh schedule data">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={refreshSchedules}
                  disabled={!selectedClass}
                  sx={{
                    borderRadius: 2,
                    borderWidth: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderWidth: 2
                    }
                  }}
                >
                  Refresh
                </Button>
              </motion.div>
            </Tooltip>
          </Box>
        </Box>

        <Box 
          sx={{ 
            display: "flex", 
            gap: 3, 
            mb: 3, 
            flexWrap: "wrap",
            alignItems: 'center'
          }}
        >
          <FormControl 
            sx={{ 
              minWidth: 220, 
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                borderWidth: 2,
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main
                }
              }
            }}
          >
            <InputLabel 
              id="class-label"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              Select Class
            </InputLabel>
            <Select
              labelId="class-label"
              label="Select Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              startAdornment={
                <ClassIcon sx={{ mr: 1, ml: -0.5, color: theme.palette.primary.main }} />
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }
              }}
            >
              {classes.map((cls) => (
                <MenuItem 
                  key={cls._id} 
                  value={cls._id}
                  sx={{
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.1)
                    },
                    '&.Mui-selected': {
                      background: alpha(theme.palette.primary.main, 0.2)
                    }
                  }}
                >
                  {cls.class_text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={showWeekends}
                onChange={(e) => setShowWeekends(e.target.checked)}
                color="primary"
                sx={{
                  '& .MuiSwitch-track': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3)
                  }
                }}
              />
            }
            label={
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Show Weekends
              </Typography>
            }
            sx={{ ml: 0 }}
          />
        </Box>

        {error && (
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={handleCloseError}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert
                onClose={handleCloseError}
                severity="error"
                sx={{ 
                  width: "100%",
                  borderRadius: 2,
                  boxShadow: theme.shadows[3],
                  alignItems: 'center'
                }}
                variant="filled"
              >
                {error}
              </Alert>
            </motion.div>
          </Snackbar>
        )}

        <Box 
          sx={{ 
            flex: 1, 
            overflow: "hidden", 
            borderRadius: 3, 
            mt: 1,
            position: 'relative',
            background: alpha(theme.palette.primary.main, 0.03),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                p: 3
              }}
            >
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height={80} 
                sx={{ borderRadius: 2 }} 
              />
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height="80%" 
                sx={{ borderRadius: 2 }} 
              />
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
              // ADDED EVENT CLICK HANDLER
              onSelectEvent={handleEventClick}
              showMultiDayTimes
              eventPropGetter={eventStyleGetter}
              style={{
                height: "100%",
                backgroundColor: theme.palette.background.paper,
                borderRadius: "12px",
              }}
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent,
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Stats Dialog */}
      <Dialog
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { 
            borderRadius: 3,
            background: theme.palette.background.paper,
            boxShadow: `0 16px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            overflow: 'hidden'
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            py: 2,
            px: 3
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <BarChartIcon fontSize="large" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Schedule Statistics
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {stats ? (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <motion.div whileHover={{ y: -2 }}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderLeft: `4px solid ${theme.palette.primary.main}`
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <ScheduleIcon color="primary" />
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Events
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            textAlign: "left",
                            fontWeight: 800,
                            color: theme.palette.primary.main
                          }}
                        >
                          {stats.totalEvents}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={6}>
                  <motion.div whileHover={{ y: -2 }}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderLeft: `4px solid ${theme.palette.secondary.main}`
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <EventIcon color="secondary" />
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Hours
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            textAlign: "left",
                            fontWeight: 800,
                            color: theme.palette.secondary.main
                          }}
                        >
                          {stats.totalHours}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mt: 2, 
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <SchoolIcon color="primary" fontSize="small" />
                Events by Subject
              </Typography>
              <Box 
                sx={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 1, 
                  mb: 3,
                  '& .MuiChip-root': {
                    borderRadius: 1,
                    fontWeight: 500
                  }
                }}
              >
                {Object.entries(stats.subjectCounts).map(([subject, count]) => (
                  <Chip
                    key={subject}
                    label={`${subject}: ${count}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderWidth: 2,
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  />
                ))}
              </Box>

              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mt: 2, 
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <ClassIcon color="secondary" fontSize="small" />
                Events by Teacher
              </Typography>
              <Box 
                sx={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 1,
                  '& .MuiChip-root': {
                    borderRadius: 1,
                    fontWeight: 500
                  }
                }}
              >
                {Object.entries(stats.teacherCounts).map(([teacher, count]) => (
                  <Chip
                    key={teacher}
                    label={`${teacher}: ${count}`}
                    color="secondary"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderWidth: 2,
                      '&:hover': {
                        background: alpha(theme.palette.secondary.main, 0.1)
                      }
                    }}
                  />
                ))}
              </Box>
            </>
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                py: 4,
                textAlign: 'center'
              }}
            >
              <InfoIcon 
                sx={{ 
                  fontSize: 48,
                  color: theme.palette.text.disabled,
                  mb: 2
                }} 
              />
              <Typography variant="body1" color="text.secondary">
                No statistics available for the selected class
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.03) }}>
          <Button 
            onClick={() => setStatsOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW: Event Details Dialog */}
      <Dialog
        open={eventDetailsOpen}
        onClose={handleCloseEventDetails}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { 
            borderRadius: 3,
            overflow: 'hidden',
            background: theme.palette.background.paper,
            boxShadow: `0 16px 32px ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        {selectedEvent && (
          <>
            <DialogTitle
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                py: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Class Details
                </Typography>
              </Box>
              <IconButton 
                onClick={handleCloseEventDetails}
                sx={{ color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <List sx={{ py: 0 }}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText 
                    }}>
                      <SubjectIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Subject"
                    secondary={selectedEvent.title.split(' - ')[0]}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                
                <Divider variant="middle" />
                
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: theme.palette.secondary.light,
                      color: theme.palette.secondary.contrastText 
                    }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Teacher"
                    secondary={selectedEvent.title.split(' - ')[1]}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                
                <Divider variant="middle" />
                
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: theme.palette.success.light,
                      color: theme.palette.success.contrastText 
                    }}>
                      <ClassIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Class"
                    secondary={selectedEvent.resource.class?.class_text || 'N/A'}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                
                <Divider variant="middle" />
                
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: theme.palette.warning.light,
                      color: theme.palette.warning.contrastText 
                    }}>
                      <TimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Time"
                    secondary={`${moment(selectedEvent.start).format('h:mm A')} - ${moment(selectedEvent.end).format('h:mm A')}`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                
                <Divider variant="middle" />
                
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: theme.palette.info.light,
                      color: theme.palette.info.contrastText 
                    }}>
                      <CalendarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Date"
                    secondary={moment(selectedEvent.start).format('dddd, MMMM D, YYYY')}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.05) }}>
              <Button 
                onClick={handleCloseEventDetails}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  textTransform: 'none',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}