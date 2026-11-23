import React from 'react';
import './App.scss';
import './pages/dashboard/Dashboard.scss';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Footer from './pages/std/footer';
import Landing from './pages/Landing';
import NeedLogin from './pages/needLogin';
import Results from './pages/Results';
import Remembered from './pages/Remembered';
import FAQ from './pages/FAQ';
import Dashboard from './pages/Dashboard';
import AuthContext from './AuthContext';
import LookbackLayout from './pages/LookbackLayout';

function AppShell() {
  const location = useLocation();
  const hideFooter = location.pathname === '/dashboard';

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/landing" element={<LookbackLayout><Landing /></LookbackLayout>} />
        <Route path="/needlogin" element={<NeedLogin />} />
        <Route path="/results" element={<LookbackLayout><Results /></LookbackLayout>} />
        <Route path="/remembered" element={<Remembered />} />
        <Route path="/FAQ" element={<FAQ />} />
      </Routes>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthContext>
      <AppShell />
    </AuthContext>
  );
}
