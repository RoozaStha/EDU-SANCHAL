import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import ScheduleEvent from "./ScheduleEvent";
import { Button, FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material";
import { useEffect } from "react";
import { baseApi } from "../../../environment";
import axios from "axios";

const localizer = momentLocalizer(moment);

export default function Schedule() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [newPeriod, setNewPeriod] = useState(false);
  const [currentView, setCurrentView] = useState("week");

  const myEventsList = [
    {
      id: 1,
      title: "Subject: History, Teacher: Hamid",
      start: new Date(new Date().setHours(11, 30, 0)),
      end: new Date(new Date().setHours(14, 30, 0)),
    },
    {
      id: 2,
      title: "Subject: English, Teacher: Hamid",
      start: new Date(new Date().setHours(15, 30, 0)),
      end: new Date(new Date().setHours(18, 30, 0)),
    },
  ];

  useEffect(() => {
    axios.get(`${baseApi}/class/all`)
      .then(resp => {
        const fetchedClasses = resp.data.data;
        setClasses(fetchedClasses);
        // Set default to first class if available
        if (fetchedClasses.length > 0) {
          setSelectedClass(fetchedClasses[0]._id);
        }
      })
      .catch(e => {
        console.log("Fetch class Err", e);
      });
  }, []);

  return (
    <div style={{ height: "80vh", padding: "20px" }}>
      <h1>Schedule</h1>

      <FormControl fullWidth>
        <Typography variant='h5'>Class</Typography>
        <InputLabel id="class-label">Class</InputLabel>
        <Select
          name="class"
          value={selectedClass}
          label="Class"
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

      <Button onClick={() => setNewPeriod(true)}>Add New Period</Button>
      {newPeriod && <ScheduleEvent selectedClass={selectedClass} />}
      
      <Calendar
        localizer={localizer}
        events={myEventsList}
        view={currentView}
        onView={setCurrentView}
        views={{
          week: true,
          day: true,
          agenda: true
        }}
        defaultView="week"
        step={30}
        timeslots={1}
        min={new Date(new Date().setHours(9, 0))}
        max={new Date(new Date().setHours(20, 0))}
        startAccessor="start"
        endAccessor="end"
        defaultDate={new Date()}
        showMultiDayTimes
        style={{ height: "100%" }}
      />
    </div>
  );
}