import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect, useCallback } from "react";
import ScheduleEvent from "./ScheduleEvent";
import { 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography,
  Box,
  Alert,
  Snackbar,
  CircularProgress
} from "@mui/material";
import axios from "axios";

const localizer = momentLocalizer(moment);

export default function Schedule() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [newPeriod, setNewPeriod] = useState(false);
  const [currentView, setCurrentView] = useState("week");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

      console.log(`Fetching schedules for class: ${selectedClass}`);
      
      const response = await axios.get(
        `http://localhost:5000/api/schedule/fetch-with-class/${selectedClass}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Schedule data received:", response.data);

      if (!response.data.success) {
        setError(response.data.message || "Failed to load schedules");
        setLoading(false);
        return;
      }

      const formattedEvents = response.data.data.map((schedule) => {
        // Ensure proper date objects for calendar
        const start = new Date(schedule.startTime);
        const end = new Date(schedule.endTime);
        
        return {
          id: schedule._id,
          title: `${schedule.subject?.subject_name || 'Unknown Subject'} - ${schedule.teacher?.name || 'Unknown Teacher'}`,
          start,
          end,
          resource: schedule
        };
      });

      console.log("Formatted events:", formattedEvents);
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      
      let errorMessage = "Failed to load schedule data.";
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
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
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        console.log("Classes data:", response.data);
        
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
        
        let errorMessage = "Failed to load classes.";
        if (error.response) {
          errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        } else if (error.request) {
          errorMessage = "No response from server. Please check your connection.";
        } else {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      refreshSchedules();
    }
  }, [selectedClass, refreshSchedules]);

  const handleCloseError = () => {
    setError(null);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: '#3174ad',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const handleEventSelect = (event) => {
    console.log("Selected event:", event);
    // You can add functionality to edit or view event details here
  };

  return (
    <Box sx={{ height: "80vh", padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Schedule
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="class-label">Class</InputLabel>
        <Select
          labelId="class-label"
          label="Class"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          {classes.length === 0 ? (
            <MenuItem disabled value="">
              Loading classes...
            </MenuItem>
          ) : (
            classes.map((x) => (
              <MenuItem key={x._id} value={x._id}>
                {x.class_text}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <Button
        onClick={() => setNewPeriod(true)}
        variant="contained"
        sx={{ mb: 2 }}
        disabled={!selectedClass}
      >
        Add New Period
      </Button>

      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {newPeriod && (
        <ScheduleEvent
          selectedClass={selectedClass}
          refreshSchedules={refreshSchedules}
          onClose={() => {
            setNewPeriod(false);
          }}
        />
      )}

      <Calendar
        localizer={localizer}
        events={events}
        view={currentView}
        onView={setCurrentView}
        views={{
          week: true,
          day: true,
          agenda: true,
        }}
        defaultView="week"
        step={30}
        timeslots={1}
        min={new Date(new Date().setHours(9, 0))}
        max={new Date(new Date().setHours(20, 0))}
        startAccessor="start"
        endAccessor="end"
        defaultDate={new Date()}
        onSelectEvent={handleEventSelect}
        showMultiDayTimes
        eventPropGetter={eventStyleGetter}
        style={{
          height: "calc(100% - 120px)",
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "16px",
        }}
      />
    </Box>
  );
}