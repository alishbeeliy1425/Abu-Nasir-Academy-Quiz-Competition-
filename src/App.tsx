/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { SettingsProvider } from "./components/SettingsProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from 'sonner';

// Lazy loaded routes for better performance
const Welcome = React.lazy(() => import("./pages/Welcome"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const AdminLogin = React.lazy(() => import("./pages/auth/AdminLogin"));
const Register = React.lazy(() => import("./pages/auth/Register"));
const CandidateDashboard = React.lazy(
  () => import("./pages/candidate/Dashboard"),
);
const ExamInterface = React.lazy(
  () => import("./pages/candidate/ExamInterface"),
);
const AdminDashboard = React.lazy(() => import("./pages/admin/Dashboard"));

// Placeholders
const StaffDash = () => <div className="p-8">Staff Dashboard (WIP)</div>;

const LoadingFallback = () => (
  <div className="flex bg-slate-50 min-h-screen items-center justify-center flex-col space-y-4">
    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <p className="text-slate-500 font-medium animate-pulse">
      Loading experience...
    </p>
  </div>
);

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AdminRoute = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (user?.role === "admin") return <AdminDashboard />;
  if (user) return <Navigate to="/" replace />;
  return <AdminLogin />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/candidate/take-exam/:examId"
                element={
                  <ProtectedRoute allowedRoles={["candidate"]}>
                    <ExamInterface />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/candidate/*"
                element={
                  <ProtectedRoute allowedRoles={["candidate"]}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/staff/*"
                element={
                  <ProtectedRoute allowedRoles={["staff", "admin"]}>
                    <StaffDash />
                  </ProtectedRoute>
                }
              />

              <Route path="/admin/*" element={<AdminRoute />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
