import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute, { getStoredToken } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-amber-50 text-[#F97316] rounded-xl flex items-center justify-center mx-auto border border-amber-200 font-bold text-xl">
              ⚠️
            </div>
            <h2 className="text-base font-bold text-[#0F172A]">Dashboard Interface Notice</h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              A temporary display exception occurred. Click below to refresh your dashboard session.
            </p>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] font-mono text-rose-600 text-left overflow-auto max-h-24">
              {this.state.error?.toString() || 'Unknown rendering error'}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#64748B] font-semibold text-xs rounded-xl transition border border-[#E2E8F0] cursor-pointer"
              >
                Reset & Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Root Route Auth Evaluation: Ensures unauthenticated sessions ALWAYS default to /login
function RootRoute() {
  const token = getStoredToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Unauthenticated Public Login & Register Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Private Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Root Path & Wildcard Redirection Rules */}
          <Route path="/" element={<RootRoute />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}