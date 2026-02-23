import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import CourseProgress from './pages/CourseProgress';
import ProjectHub from './pages/ProjectHub';
import ProjectLibrary from './pages/ProjectLibrary';
import ProjectDetail from './pages/ProjectDetail';
import ProjectMentor from './pages/ProjectMentor';
import Mentor from './pages/Mentor';
import DeliverableCalendar from './pages/DeliverableCalendar';
import { useStudentStore } from './store/studentStore';
import { useEffect } from 'react';

function App() {
  const initialize = useStudentStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/course" element={<CourseProgress />} />
          <Route path="/project" element={<ProjectHub />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/project/:projectId/mentor" element={<ProjectMentor />} />
          <Route path="/projects" element={<ProjectLibrary />} />
          <Route path="/mentor" element={<Mentor />} />
          <Route path="/calendar" element={<DeliverableCalendar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
