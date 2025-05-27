import React from 'react';
import AdminDashboardNew from './AdminDashboardNew';

export type { 
  LogEntry,
  LogsPanelProps,
  HardwareControlsProps,
  PlaylistManagerProps,
  SystemInfoProps,
  PlaylistInfo,
  SerialPortInfo
} from './AdminDashboardNew';

/**
 * This is a thin wrapper around AdminDashboardNew to maintain backward compatibility
 * with existing imports. All the actual implementation has been moved to AdminDashboardNew.tsx
 */
const AdminDashboard: React.FC = () => {
  return <AdminDashboardNew />;
};

// Re-export all types and interfaces for backward compatibility
export * from './AdminDashboardNew';

// Explicitly export the default component
export default AdminDashboard;
