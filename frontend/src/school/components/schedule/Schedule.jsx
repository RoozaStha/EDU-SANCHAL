import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import ScheduleEvent from "./ScheduleEvent";
import { Button } from "@mui/material";

const localizer = momentLocalizer(moment);

export default function Schedule() {
  const [newPeriod, setNewPeriod] = useState(false);
  const [currentView, setCurrentView] = useState("week"); // Track current view
  
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

  return (
    <div style={{ height: "80vh", padding: "20px" }}>
      <h1>Schedule</h1>

      <Button onClick={() => setNewPeriod(true)}>Add New Period</Button>
      {newPeriod && <ScheduleEvent />}
      
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