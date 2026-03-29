import React, { useState, useEffect } from 'react';
import { getDailyRoster, checkOverdue, updateToiletingStatus, addElderManual, fetchElders, getDailyLogs } from '../utils/api.js';
import { toggleAudio, isAudioEnabled, triggerAlert } from '../utils/alerts.js';
import ElderCard from './ElderCard';
import '../styles/tablet.css';

export default function MainTracking({ onExit }) {
  const [roster, setRoster] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [allElders, setAllElders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(isAudioEnabled());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadRoster();
    loadAllElders();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    const rosterInterval = setInterval(loadRoster, 5000);
    const overdueInterval = setInterval(checkOverdueStatus, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(rosterInterval);
      clearInterval(overdueInterval);
    };
  }, []);

  useEffect(() => {
    checkOverdueStatus();
  }, [roster]);

  const loadRoster = async () => {
    try {
      const data = await getDailyRoster();
      setRoster(data);
      setError('');
    } catch (err) {
      setError('Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  const loadAllElders = async () => {
    try {
      const data = await fetchElders();
      setAllElders(data);
    } catch (err) {
      console.error('Failed to load all elders');
    }
  };

  const checkOverdueStatus = async () => {
    try {
      const data = await checkOverdue();
      setOverdue(data);
      
      if (data.length > 0) {
        const overdueElders = data.filter(d => d.urgency === 'overdue');
        if (overdueElders.length > 0) {
          triggerAlert(`${overdueElders.length} elder(s) overdue for toileting!`);
        }
      }
    } catch (err) {
      console.error('Failed to check overdue');
    }
  };

  const handleMarkDone = async (elder_id, scheduled_time) => {
    try {
      const [hour, minute] = scheduled_time.split(':').map(Number);
      const scheduledDate = new Date(currentTime);
      scheduledDate.setHours(hour, minute, 0, 0);
      const lateMinutes = Math.max(0, Math.floor((currentTime - scheduledDate) / 60000));
      const notes = lateMinutes > 0 ? `Completed late by ${lateMinutes} min` : '';

      await updateToiletingStatus(elder_id, scheduled_time, 'completed', 'Staff', notes);
      await loadRoster();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleMarkInProgress = async (elder_id, scheduled_time) => {
    try {
      await updateToiletingStatus(elder_id, scheduled_time, 'in_progress', 'Staff');
      await loadRoster();
    } catch (err) {
      setError('Failed to mark in-progress');
    }
  };

  const handleMarkUndo = async (elder_id, scheduled_time) => {
    try {
      await updateToiletingStatus(elder_id, scheduled_time, 'pending', 'Staff');
      await loadRoster();
    } catch (err) {
      setError('Failed to undo status');
    }
  };


  const handleAddElderManual = async () => {
    const available = allElders.filter(e => !roster.some(r => r.id === e.id));
    if (available.length === 0) {
      setError('All elders are already in roster');
      return;
    }

    const elderName = prompt(`Select elder:\n${available.map((e, i) => `${i}: ${e.name}`).join('\n')}`);
    if (elderName === null) return;

    const elder = available[parseInt(elderName)];
    if (!elder) {
      setError('Invalid selection');
      return;
    }

    try {
      await addElderManual(elder.id);
      await loadRoster();
    } catch (err) {
      setError('Failed to add elder');
    }
  };

  const handleViewLogs = async () => {
    try {
      const data = await getDailyLogs();
      setLogs(data);
      setShowLogs(true);
    } catch (err) {
      setError('Failed to load logs');
    }
  };

  const formatTime = (date) => {
    return date.getHours().toString().padStart(2, '0') + ':' +
           date.getMinutes().toString().padStart(2, '0');
  };

  const getPendingCount = () => {
    return roster.reduce((sum, elder) => {
      const pending = elder.total_schedules - elder.completed_count;
      return sum + pending;
    }, 0);
  };

  const getOverdueCount = () => {
    return overdue.reduce((unique, o) => {
      if (!unique.includes(o.id)) unique.push(o.id);
      return unique;
    }, []).length;
  };

  const isElderOverdue = (elder_id) => {
    return overdue.some(o => o.id === elder_id);
  };

  const isElderUrgent = (elder_id) => {
    return overdue.some(o => o.id === elder_id && (o.urgency === 'now' || o.urgency === 'overdue'));
  };

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-left">
          <div className="header-title">Toileting Tracker</div>
          <div className="header-date">{new Date().toLocaleDateString()}</div>
        </div>
        <div className="header-time" style={{ color: isElderUrgent(-1) ? '#f56565' : 'white' }}>
          {formatTime(currentTime)}
        </div>
        <div className="header-status" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="status-badge">
            {getPendingCount()} pending
          </div>
          {getOverdueCount() > 0 && (
            <div className="status-badge" style={{ backgroundColor: '#f56565', color: 'white' }}>
              {getOverdueCount()} elder{getOverdueCount() === 1 ? '' : 's'} overdue
            </div>
          )}
          <button
            onClick={() => setAudioEnabled(toggleAudio())}
            className="mute-toggle"
            title={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
          >
            {audioEnabled ? '🔊 On' : '🔇 Off'}
          </button>
        </div>
      </div>

      <div className="content">
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff5f5',
            border: '2px solid #fc8181',
            borderRadius: '8px',
            color: '#742a2a'
          }}>
            {error}
          </div>
        )}

        {showLogs ? (
          <div style={{ marginTop: '1rem' }}>
            <button onClick={() => setShowLogs(false)} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
              Back to Tracking
            </button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Daily Logs</h2>
            {logs.length === 0 ? (
              <p style={{ color: '#666' }}>No completed tasks yet</p>
            ) : (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {logs.map((log, i) => (
                  <div key={i} style={{
                    paddingBottom: '1rem',
                    marginBottom: '1rem',
                    borderBottom: i < logs.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div style={{ fontWeight: '600' }}>{log.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      Scheduled: {log.scheduled_time} | Actual: {log.actual_time}
                    </div>
                    {log.notes && <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>Notes: {log.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button onClick={handleAddElderManual} className="btn btn-primary btn-small">
                + Add Elder
              </button>
              <button onClick={handleViewLogs} className="btn btn-secondary btn-small">
                📋 Logs
              </button>
              <button onClick={onExit} className="btn btn-danger btn-small">
                Exit
              </button>
            </div>

            <div className="tracking-screen">
              {roster.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#666'
                }}>
                  <p style={{ fontSize: '1.1rem' }}>No elders in roster for today</p>
                </div>
              ) : (
                roster.map(elder => (
                  <ElderCard
                    key={elder.id}
                    elder={elder}
                    currentTime={currentTime}
                    isOverdue={isElderOverdue(elder.id)}
                    onMarkInProgress={handleMarkInProgress}
                    onMarkDone={handleMarkDone}
                    onMarkUndo={handleMarkUndo}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
