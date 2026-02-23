import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import CourseProgress from './pages/CourseProgress';
import ProjectHub from './pages/ProjectHub';
import ProjectDetail from './pages/ProjectDetail';
import ProjectMentor from './pages/ProjectMentor';
import Mentor from './pages/Mentor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/course" element={<CourseProgress />} />
          <Route path="/project" element={<ProjectHub />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/project/:projectId/mentor" element={<ProjectMentor />} />
          <Route path="/mentor" element={<Mentor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
