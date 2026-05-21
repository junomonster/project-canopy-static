import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeLang } from './i18n';
import Home from './pages/Home';
import Faq from './pages/Faq';
import Join from './pages/Join';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = normalizeLang(i18n.language);
  }, [i18n.language]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/join" element={<Join />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
