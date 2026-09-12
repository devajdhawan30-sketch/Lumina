import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
//import LearnPage from './pages/LearnPage'
import SubjectsPage from './pages/SubjectsPage'
import SubjectTopicsPage from './pages/SubjectTopicsPage'
import SubjectRoadmapPage from './pages/SubjectRoadmapPage'
import TutorPage from './pages/TutorPage'
import TrigonometryLandingPage from './pages/TrigonometryLandingPage'
import TopicModulePage from './pages/TopicModulePage'
import TrigonometryApplicationsPage from './pages/TrigonometryApplicationsPage'
import PageMotion from './components/PageMotion'
import PageTransition from './components/PageTransition'
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <PageTransition />
      <PageMotion>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* <Route path="/learn" element={<LearnPage />} /> */}
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:subjectId" element={<SubjectTopicsPage />} />
          <Route path="/roadmap" element={<Navigate to="/roadmap/subject/mathematics" replace />} />
          <Route path="/explore/applications/trigonometry" element={<TrigonometryApplicationsPage />}/>
          <Route path="/topics/:topicId" element={<TrigonometryLandingPage />} />
          <Route path="/topics/:topicId/module/:moduleId" element={<TopicModulePage />} />
          <Route path="/roadmap/subject/:subjectId" element={<SubjectRoadmapPage />} />
          <Route path="/tutor/:conceptId" element={<TutorPage />} />
        </Routes>
      </PageMotion>
    </BrowserRouter>
  )
}

export default App
