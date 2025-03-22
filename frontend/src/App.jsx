import './App.css'
import {BrowserRouter,Route, Routes } from 'react-router-dom'
import School from './school/School'
import Attendance from './school/components/attendance/Attendance'
import Class from './school/components/class/Class'
import Dashboard from './school/components/dashboard/Dashboard'
import Examinations from './school/components/examinations/Examinations'
import Notice from './school/components/notice/Notice'
import Schedule from './school/components/schedule/Schedule'
import Students from './school/components/students/Students'
import Subjects from './school/components/subjects/Subjects'
import Teachers from './school/components/teachers/Teachers'

function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      {/* SCHOOL ROUTE */}
      <Route path="/" element={<School />} />

      <Route path='school' element={<School/>}>
      <Route index element={<Dashboard/>}/> 

      <Route path='dashboard' element={<Dashboard/>}/> 

       <Route path='attendance' element={<Attendance/>}/> 
       <Route path='class' element={<Class/>}/> 
        <Route path='examinations' element={<Examinations/>}/> 
       <Route path='notice' element={<Notice/>}/> 
        <Route path='schedule' element={<Schedule/>}/> 
          <Route path='students' element={<Students/>}/> 
            <Route path='subjects' element={<Subjects/>}/> 
            <Route path='teachers' element={<Teachers/>}/> 


      </Route>
      {/* STUDENT */}
      <Route>

      </Route>
      {/* TEACHER */}
      <Route>

      </Route>
      {/* CLIENT */}
      <Route>

      </Route>

    </Routes>
    
    
    </BrowserRouter>
      
    </>
  )
}

export default App
