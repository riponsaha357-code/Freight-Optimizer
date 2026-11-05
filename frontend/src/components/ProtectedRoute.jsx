import React from 'react';
import { Navigate } from 'react-router-dom';

export function getStoredToken() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('navi_steel_token');
    if (!token) return null;

    // Strict JWT Payload Expiration & Validation Check
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Expired session! Purge invalid cached credentials immediately
        localStorage.removeItem('token');
        localStorage.removeItem('navi_steel_token');
        localStorage.removeItem('navi_steel_user');
        return null;
      }
    }
    return token;
  } catch (e) {
    return null;
  }
}

export default function ProtectedRoute({ children }) {
  const token = getStoredToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
