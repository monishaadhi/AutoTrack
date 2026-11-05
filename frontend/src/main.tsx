import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { Dashboard } from './pages/Dashboard';
import { ProductionLines } from './pages/ProductionLines';
import { Production } from './pages/Production';
import { QualityIssues } from './pages/QualityIssues';
import { WorkOrders } from './pages/WorkOrders';
import { EquipmentMonitoring } from './pages/EquipmentMonitoring';
import { RoadmapModule } from './pages/RoadmapModule';
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
              <Route path="work-orders" element={<WorkOrders />} />
              <Route path="equipment" element={<EquipmentMonitoring />} />
              <Route
                path="analytics"
                element={
                  <RoadmapModule
                    moduleName="Analytics & Advanced Manufacturing Reports"
                    description="Cross-plant benchmarking, predictive scrap modeling, automated shift reports, and OEE trend exports."
                    features={[
                      'Multi-facility cross-comparison & benchmarking',
                      'Automated shift OEE & scrap reports (PDF & Excel export)',
                      'Predictive machine learning defect rate forecasting',
                      'Shift-over-shift scrap Pareto distribution',
                    ]}
                    type="analytics"
                  />
                }
              />
              <Route
                path="users"
                element={
                  <RoadmapModule
                    moduleName="User & Access Control Management"
                    description="Role-based permissions management, shift supervisor assignments, and plant-level security policies."
                    features={[
                      'SSO & Okta/Azure AD enterprise directory integration',
                      'Granular line-level operator authorization',
                      'Comprehensive audit logging of quota & parameter overrides',
                      'Multi-factor authentication (MFA) enforcement',
                    ]}
                    type="users"
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <RoadmapModule
                    moduleName="Manufacturing System Settings"
                    description="Configure ideal cycle times per vehicle model, plant calendars, and IoT telemetry thresholds."
                    features={[
                      'Vehicle model ideal cycle time (seconds) calibration',
                      'Plant timezone & standard shift duration rules',
                      'MQTT / OPC-UA real-time IoT gateway integration',
                      'Quality defect category severity threshold configuration',
                    ]}
                    type="settings"
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
