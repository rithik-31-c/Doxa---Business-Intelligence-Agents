import { BrowserRouter, Routes, Route } from "react-router-dom";
import DoxaLanding from "./pages/DoxaLanding";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DoxaLanding />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;