import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";

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
  Chip

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
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={() => onNavigate("PREV")}>
          <ArrowBackIcon />
        </IconButton>
        <IconButton onClick={() => onNavigate("TODAY")}>
          <EventIcon />
        </IconButton>
        <IconButton onClick={() => onNavigate("NEXT")}>
          <ArrowForwardIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
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
          },
          "& .MuiTab-root": { minHeight: 40, py: 0.5 },
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
                    : "text.secondary",
                "&.Mui-selected": { color: theme.palette.primary.main },
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
    <Box
      sx={{
        p: 0.75,
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.2 }}
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
      </Box>
    </Box>
  );
};

export default function ScheduleTeacher() {
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
    const backgroundColor =
      theme.palette.primary.main;

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
    <Box sx={{ height: "90vh", p: { xs: 1, sm: 2, md: 3 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          height: "100%",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          bgcolor: theme.palette.background.default,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolIcon color="primary" fontSize="large" />
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Class Schedule
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => setStatsOpen(true)}
              disabled={!events.length}
            >
              Stats
            </Button>

            <Tooltip title="Refresh schedule">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshSchedules}
                disabled={!selectedClass}
              >
                Refresh
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
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

        <Box sx={{ flex: 1, overflow: "hidden", borderRadius: 1, mt: 1 }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
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
              timeslots={1}
              min={new Date(new Date().setHours(8, 0))}
              max={new Date(new Date().setHours(20, 0))}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              showMultiDayTimes
              eventPropGetter={eventStyleGetter}
              style={{
                height: "100%",
                backgroundColor: theme.palette.background.paper,
                borderRadius: "8px",
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
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Schedule Statistics</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {stats ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" sx={{ textAlign: "center" }}>
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
                  <Card>
                    <CardContent>
                      <Typography variant="h4" sx={{ textAlign: "center" }}>
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

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Events by Subject
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {Object.entries(stats.subjectCounts).map(([subject, count]) => (
                  <Chip
                    key={subject}
                    label={`${subject}: ${count}`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Events by Teacher
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {Object.entries(stats.teacherCounts).map(([teacher, count]) => (
                  <Chip
                    key={teacher}
                    label={`${teacher}: ${count}`}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </>
          ) : (
            <Typography variant="body1">No statistics available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}