import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { ThemeProvider } from "@mui/material/styles";
import {
  darkTheme,
  lightTheme,
} from "./basic utility components/dark theme/darkTheme";
import CssBaseline from "@mui/material/CssBaseline";
import DraggableButton from "./basic utility components/draggable/DraggableButton";

// School Components
import School from "./school/School";
import Dashboard from "./school/components/dashboard/Dashboard";
import Class from "./school/components/class/Class";
import Examinations from "./school/components/examinations/Examinations";
import Notice from "./school/components/notice/Notice";
import Schedule from "./school/components/schedule/Schedule";
import Students from "./school/components/students/Students";
import Subjects from "./school/components/subjects/Subjects";
import Teachers from "./school/components/teachers/Teachers";
import AttendanceStudentList from "./school/components/attendance/AttendanceStudentList";
import ResultSchool from "./school/components/results/resultsSchool";

// Client Components
import Client from "./client/Client";
import Home from "./client/components/home/Home";
import Login from "./client/components/login/Login";
import Register from "./client/components/register/Register";
import LogOut from "./client/components/logout/LogOut";
import ForgotPassword from "./client/components/login/ForgotPassword";
import ResetPassword from "./client/components/login/ResetPassword";

// Teacher Components
import Teacher from "./teacher/Teacher";
import TeacherDetails from "./teacher/components/teacher details/TeacherDetails";
import ScheduleTeacher from "./teacher/components/schedule/ScheduleTeacher";
import AttendanceTeacher from "./teacher/components/attendance/AttendanceTeacher";
import ExaminationsTeacher from "./teacher/components/examinations/ExaminationTeacher";
import NoticeTeacher from "./teacher/components/notice/NoticeTeacher";
import Assignment from "./teacher/components/assignment/Assignment";
import Result from "./teacher/components/result/teacherResult";

// Student Components
import Student from "./student/Student";
import StudentDetails from "./student/components/student details/StudentDetails";
import AttendanceStudent from "./student/components/attendance/AttendanceStudent";
import ScheduleStudent from "./student/components/schedule/ScheduleStudent";
import ExaminationsStudent from "./student/components/examinations/ExaminationsStudent";
import NoticeStudent from "./student/components/notice/NoticeStudent";
import AssignmentStudent from "./student/components/assignmentStudent/AssignmentStudent";
import ResultStudent from "./student/components/results/resultStudent";

import Support from "./student/components/Support/support";

// Other Components
import ProtectedRoute from "./guard/ProtectedRoute";
import { ChatbotProvider } from "./context/ChatbotContext";
import AIChatbot from "./AIChatbot";

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Client />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="logout" element={<LogOut />} />

          {/* Password reset routes (public) */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* School protected routes */}
        <Route
          path="/school"
          element={
            <ProtectedRoute allowedRoles={["SCHOOL"]}>
              <School />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="attendance" element={<AttendanceStudentList />} />
          <Route path="class" element={<Class />} />
          <Route path="examinations" element={<Examinations />} />
          <Route path="notice" element={<Notice />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="students" element={<Students />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="result" element={<ResultSchool />} />
        </Route>

        {/* Student protected routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Student />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDetails />} />
          <Route path="schedule" element={<ScheduleStudent />} />
          <Route path="attendance" element={<AttendanceStudent />} />
          <Route path="examinations" element={<ExaminationsStudent />} />
          <Route path="notice" element={<NoticeStudent />} />
          <Route path="assignment" element={<AssignmentStudent />} />
          <Route path="support" element={<Support />} />
          <Route path="results" element={<ResultStudent />} />
        </Route>

        {/* Teacher protected routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <Teacher />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDetails />} />
          <Route path="schedule" element={<ScheduleTeacher />} />
          <Route path="attendance" element={<AttendanceTeacher />} />
          <Route path="examinations" element={<ExaminationsTeacher />} />
          <Route path="notice" element={<NoticeTeacher />} />
          <Route path="assignment" element={<Assignment />} />
          <Route path="result" element={<Result />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const { dark } = useContext(AuthContext);

  return (
    <ChatbotProvider>
    <ThemeProvider theme={dark ? darkTheme : lightTheme}>
      <CssBaseline />
      <DraggableButton />
      <AppContent />
      <AIChatbot />
    </ThemeProvider>
    </ChatbotProvider>
  );
}
