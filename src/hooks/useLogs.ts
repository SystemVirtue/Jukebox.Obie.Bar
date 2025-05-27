import { useState, useRef, useEffect } from 'react';

type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface LogEntry {
  time: string;
  level: LogLevel;
  message: string;
  category: string;
  formattedMessage: string;
}

export const useLogs = (maxLogs: number = 500) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  const addLog = (log: Omit<LogEntry, 'time' | 'formattedMessage'>) => {
    const timestamp = new Date().toISOString();
    const formattedLog: LogEntry = {
      ...log,
      time: timestamp,
      formattedMessage: `[${log.level}] ${log.category}: ${log.message}`
    };

    setLogs(prevLogs => {
      const newLogs = [...prevLogs, formattedLog];
      return newLogs.slice(-maxLogs);
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      const container = logsContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, autoScroll]);

  return {
    logs,
    addLog,
    clearLogs,
    autoScroll,
    setAutoScroll,
    logsContainerRef
  };
};
