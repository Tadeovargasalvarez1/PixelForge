import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { TopNav } from './components/layout/TopNav';
import { Toaster } from './components/ui/Toaster';
import { Home } from './pages/Home';
import { Studio } from './pages/Studio';
import { Tools } from './pages/Tools';
import { Projects } from './pages/Projects';
import { SettingsPage } from './pages/Settings';
import { EditorPro } from './pages/EditorPro';

export function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app">
      <TopNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/editor" element={<EditorPro />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
}
