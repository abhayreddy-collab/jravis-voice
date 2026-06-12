import React, { useEffect, useState } from 'react';
import { Cpu, HardDrive, LayoutGrid, AlertTriangle } from 'lucide-react';

export default function SystemStats({ backendOnline }) {
  const [stats, setStats] = useState({
    cpu: { load: 0 },
    ram: { total: 16, used: 0, percentage: 0 },
    disk: { total: 500, used: 0, percentage: 0 },
    os: { platform: 'unknown', distro: 'Loading OS...', release: '' }
  });
  const [usingSimulation, setUsingSimulation] = useState(false);

  useEffect(() => {
    let intervalId;

    const fetchStats = async () => {
      if (!backendOnline) {
        // Fallback to simulation if backend is offline
        simulateStats();
        setUsingSimulation(true);
        return;
      }

      try {
        const res = await fetch('/api/system');
        if (!res.ok) throw new Error('Backend failed');
        const data = await res.json();
        setStats(data);
        setUsingSimulation(false);
      } catch (err) {
        console.warn('System API failed, using simulation instead');
        simulateStats();
        setUsingSimulation(true);
      }
    };

    const simulateStats = () => {
      setStats(prev => {
        // Generate minor random fluctuations for futuristic realism
        const simCpu = Math.min(100, Math.max(2, Math.round(prev.cpu.load + (Math.random() * 10 - 5))));
        const simRamPerc = Math.min(95, Math.max(10, Math.round(prev.ram.percentage + (Math.random() * 4 - 2))));
        
        return {
          cpu: { load: simCpu === 0 ? 12 : simCpu },
          ram: {
            total: 16,
            used: Math.round((simRamPerc / 100) * 16 * 10) / 10,
            percentage: simRamPerc === 0 ? 45 : simRamPerc
          },
          disk: {
            total: 512,
            used: 242,
            percentage: 47
          },
          os: {
            platform: 'win32',
            distro: 'Windows 11 Local',
            release: '22H2'
          }
        };
      });
    };

    fetchStats();
    intervalId = setInterval(fetchStats, 3000);

    return () => clearInterval(intervalId);
  }, [backendOnline]);

  // Dasharray math for circular SVG progress dials
  // Radius = 35. Circumference = 2 * PI * r = ~219.9
  const radius = 35;
  const strokeDash = 2 * Math.PI * radius;

  const getStrokeOffset = (percentage) => {
    const safePercentage = Math.min(100, Math.max(0, percentage));
    return strokeDash - (safePercentage / 100) * strokeDash;
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>
          <Cpu size={18} style={{ color: 'var(--color-cyan)' }} />
          Diagnostics Console
        </h2>
        {usingSimulation && (
          <span className="title-badge" style={{ color: 'var(--color-magenta)', borderColor: 'var(--color-magenta)', background: 'rgba(255,0,85,0.08)', display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 4px' }}>
            <AlertTriangle size={10} /> SIM
          </span>
        )}
      </div>

      <div className="metrics-grid">
        {/* CPU Load Metric */}
        <div className="metric-card">
          <div className="metric-circle-container">
            <svg viewBox="0 0 80 80" width="100%" height="100%">
              <circle cx="40" cy="40" r={radius} className="metric-circle-bg" />
              <circle 
                cx="40" 
                cy="40" 
                r={radius} 
                className={`metric-circle-fill ${stats.cpu.load > 85 ? 'warning' : ''}`}
                strokeDasharray={strokeDash}
                strokeDashoffset={getStrokeOffset(stats.cpu.load)}
              />
            </svg>
            <div className="metric-center-text">{stats.cpu.load}%</div>
          </div>
          <span className="metric-label">CPU CORE</span>
          <span className="metric-value-text" style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>SYS CORE LOAD</span>
        </div>

        {/* RAM Usage Metric */}
        <div className="metric-card">
          <div className="metric-circle-container">
            <svg viewBox="0 0 80 80" width="100%" height="100%">
              <circle cx="40" cy="40" r={radius} className="metric-circle-bg" />
              <circle 
                cx="40" 
                cy="40" 
                r={radius} 
                className={`metric-circle-fill ${stats.ram.percentage > 85 ? 'warning' : ''}`}
                strokeDasharray={strokeDash}
                strokeDashoffset={getStrokeOffset(stats.ram.percentage)}
              />
            </svg>
            <div className="metric-center-text">{stats.ram.percentage}%</div>
          </div>
          <span className="metric-label">MEMORY</span>
          <span className="metric-value-text" style={{ color: 'var(--color-text-dim)' }}>
            {stats.ram.used} / {stats.ram.total} GB
          </span>
        </div>

        {/* Disk Space Metric */}
        <div className="metric-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '15px', padding: '0 5px' }}>
            <HardDrive size={24} style={{ color: 'var(--color-cyan)', opacity: 0.8 }} />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'between', width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-bright)' }}>DISK OVERVIEW</span>
                <span style={{ float: 'right', color: 'var(--color-cyan)' }}>{stats.disk.percentage}% USED</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(0,240,255,0.06)', borderRadius: '3px', border: '1px solid rgba(0,240,255,0.1)', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${stats.disk.percentage}%`, 
                    backgroundColor: 'var(--color-cyan)', 
                    boxShadow: '0 0 5px var(--color-cyan-glow)',
                    transition: 'width 0.8s ease'
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '3px' }}>
                <span>{stats.disk.used} GB USED</span>
                <span>{stats.disk.total} GB TOTAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '15px', 
        paddingTop: '12px', 
        borderTop: '1px solid rgba(0,240,255,0.06)', 
        fontFamily: 'var(--font-mono)', 
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <LayoutGrid size={14} style={{ color: 'var(--color-text-dim)' }} />
        <div>
          <span style={{ color: 'var(--color-text-dim)', marginRight: '5px' }}>OS:</span>
          <span style={{ color: 'var(--color-text-bright)' }}>{stats.os.distro} ({stats.os.platform})</span>
        </div>
      </div>
    </div>
  );
}
