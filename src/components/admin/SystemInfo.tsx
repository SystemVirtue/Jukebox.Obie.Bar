import React from 'react';

export interface SystemInfoProps {
  systemUptime: string;
  activeUsers: number;
  playedVideos: number;
  credits: number;
  coinProcessorConnected: boolean;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const SystemInfo: React.FC<SystemInfoProps> = ({
  systemUptime,
  activeUsers,
  playedVideos,
  credits,
  coinProcessorConnected,
  isSimulating,
  onToggleSimulation
}) => {
  return (
    <div className="system-info">
      <h3>System Information</h3>
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Uptime:</span>
          <span className="info-value">{systemUptime}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Active Users:</span>
          <span className="info-value">{activeUsers}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Videos Played:</span>
          <span className="info-value">{playedVideos}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Credits:</span>
          <span className="info-value">{credits}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Coin Acceptor:</span>
          <span className={`info-value ${coinProcessorConnected ? 'text-success' : 'text-danger'}`}>
            {coinProcessorConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Simulation Mode:</span>
          <span className={`info-value ${isSimulating ? 'text-warning' : ''}`}>
            {isSimulating ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      
      <div className="mt-3">
        <button 
          className={`btn btn-sm ${isSimulating ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={onToggleSimulation}
        >
          {isSimulating ? 'Disable Simulation' : 'Enable Simulation'}
        </button>
      </div>
    </div>
  );
};

export default SystemInfo;
