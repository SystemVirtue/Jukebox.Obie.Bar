import React, { useState, useEffect } from 'react';
import { SerialPortInfo } from '../../types/web-serial';

export interface HardwareControlsProps {
  availablePorts: SerialPortInfo[];
  isRefreshingPorts: boolean;
  selectedPort: string | null;
  onPortSelect: (portIndex: number) => void;
  onRefreshPorts: () => void;
  onToggleSimulation: () => void;
  isSimulating: boolean;
  onTestCoinAcceptor: () => void;
  onTestButtonPress: (button: string) => void;
  onResetCredits: () => void;
  onAddCredits: (amount: number) => void;
}

export const HardwareControls: React.FC<HardwareControlsProps> = ({
  availablePorts,
  isRefreshingPorts,
  selectedPort,
  onPortSelect,
  onRefreshPorts,
  onToggleSimulation,
  isSimulating,
  onTestCoinAcceptor,
  onTestButtonPress,
  onResetCredits,
  onAddCredits
}) => {
  return (
    <div className="hardware-controls">
      <h3>Hardware Controls</h3>
      
      <div className="form-group">
        <label>Serial Port</label>
        <div className="input-group">
          <select
            className="form-control"
            value={selectedPort || ''}
            onChange={(e) => onPortSelect(Number(e.target.value))}
            disabled={isRefreshingPorts}
          >
            <option value="">Select a port</option>
            {availablePorts.map((port, index) => (
              <option key={port.path} value={index}>
                {port.path} - {port.manufacturer || 'Unknown'}
              </option>
            ))}
          </select>
          <div className="input-group-append">
            <button 
              className="btn btn-outline-secondary" 
              onClick={onRefreshPorts}
              disabled={isRefreshingPorts}
            >
              {isRefreshingPorts ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="form-group">
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="simulationMode"
            checked={isSimulating}
            onChange={onToggleSimulation}
          />
          <label className="form-check-label" htmlFor="simulationMode">
            Enable Simulation Mode
          </label>
        </div>
      </div>

      <div className="btn-group d-flex mb-3">
        <button 
          className="btn btn-primary"
          onClick={onTestCoinAcceptor}
        >
          Test Coin Acceptor
        </button>
        <button 
          className="btn btn-warning"
          onClick={() => onTestButtonPress('A')}
        >
          Test Button A
        </button>
        <button 
          className="btn btn-warning"
          onClick={() => onTestButtonPress('B')}
        >
          Test Button B
        </button>
      </div>

      <div className="btn-group d-flex mb-3">
        <button 
          className="btn btn-success"
          onClick={() => onAddCredits(1)}
        >
          Add 1 Credit
        </button>
        <button 
          className="btn btn-success"
          onClick={() => onAddCredits(3)}
        >
          Add 3 Credits
        </button>
        <button 
          className="btn btn-danger"
          onClick={onResetCredits}
        >
          Reset Credits
        </button>
      </div>
    </div>
  );
};

export default HardwareControls;
