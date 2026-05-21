import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Faq from './pages/Faq';
import Join from './pages/Join';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/join" element={<Join />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
