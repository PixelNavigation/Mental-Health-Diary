import NavBar from './Components/NavBar'
import { Route, Routes } from "react-router-dom"
import Dashboard from './Components/Dashboard'
import Diary from './Components/Diary'

function App() {
  return (
    <div className="Container">
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/diary" element={<Diary />} />
      </Routes>
    </div>
  );
}

export default App