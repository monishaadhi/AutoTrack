import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { Dashboard } from './pages/Dashboard';
import { ProductionLines } from './pages/ProductionLines';
import { Production } from './pages/Production';
import { QualityIssues } from './pages/QualityIssues';
import { Login } from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<App />}>
              <Route index element={<Dashboard />} />
              <Route path="lines" element={<ProductionLines />} />
              <Route path="production" element={<Production />} />
              <Route path="quality" element={<QualityIssues />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
