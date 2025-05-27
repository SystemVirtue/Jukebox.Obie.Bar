import { useRef, useEffect } from 'react';
type RefObject<T> = { current: T | null };
import { LogEntry, useLogs } from '../../hooks/useLogs';

export interface LogsPanelProps {
  logs: LogEntry[];
  autoScroll: boolean;
  onClearLogs: () => void;
  onToggleAutoScroll: () => void;
  containerRef: RefObject<HTMLDivElement>;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({
  logs,
  autoScroll,
  onClearLogs,
  onToggleAutoScroll,
  containerRef
}) => {
  return (
    <div className="logs-panel">
      <div className="logs-header">
        <h3>System Logs</h3>
        <div className="log-actions">
          <button 
            onClick={onToggleAutoScroll}
            className={`btn btn-sm ${autoScroll ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          </button>
          <button 
            onClick={onClearLogs}
            className="btn btn-sm btn-outline-danger"
          >
            Clear Logs
          </button>
        </div>
      </div>
      <div className="logs-container" ref={containerRef}>
        {logs.length === 0 ? (
          <div className="no-logs">No logs available</div>
        ) : (
          logs.map((log, index) => (
            <div key={`${log.time}-${index}`} className={`log-entry log-${log.level}`}>
              <span className="log-time">
                {new Date(log.time).toLocaleTimeString()}
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogsPanel;
