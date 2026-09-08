import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import LearnPage from './pages/LearnPage'
import SubjectsPage from './pages/SubjectsPage'
import TutorPage from './pages/TutorPage'

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/tutor/:conceptId" element={<TutorPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App