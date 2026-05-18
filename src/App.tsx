import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InferencePlayground from './pages/PlayGround';
import DiffPage from './pages/DiffPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InferencePlayground />} />
        <Route path="/diff" element={<DiffPage />} />
      </Routes>
    </Router>
  );
}

export default App;
