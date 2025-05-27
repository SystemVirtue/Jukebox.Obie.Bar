/**
 * YouTube Jukebox Admin Dashboard
 * This file serves as the entry point for the admin dashboard
 * It provides controls for managing credits, system configuration, and playlist management
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SecurityConfig } from './config/security.config';
import AdminDashboard from './components/AdminDashboard.tsx';
import './components/Admin.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap is imported

// Set up Content Security Policy
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = Object.entries(SecurityConfig.csp.directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
document.head.appendChild(meta);

// Mount the application
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('admin-root');
  if (root) {
    createRoot(root).render(
      <AdminDashboard />
    );
  }
});
