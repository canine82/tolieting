import React, { useState, useEffect } from 'react';
import { getToiletingSchedule, addToiletingSchedule, updateToiletingSchedule, deleteToiletingSchedule } from '../utils/api.js';
import '../styles/tablet.css';

export default function ScheduleManager({ elder, onClose }) {
  const [schedules, setSchedules] = useState([]);
  const [newTime, setNewTime] = useState('');
  const [newLevel, setNewLevel] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editedTime, setEditedTime] = useState('');
  const [editedLevel, setEditedLevel] = useState(2);

  useEffect(() => {
    loadSchedules();
  }, [elder.id]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await getToiletingSchedule(elder.id);
      setSchedules(data);
    } catch (err) {
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!newTime) {
      setError('Please select a time');
      return;
    }

    try {
      setSaving(true);
      await addToiletingSchedule(elder.id, newTime, newLevel);
      setNewTime('');
      setNewLevel(2);
      await loadSchedules();
      setError('');
    } catch (err) {
      setError('Failed to add schedule');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (timeString) => {
    // Convert HH:MM to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getLevelDescription = (level) => {
    switch (level) {
      case 1: return 'Minimal assistance needed';
      case 2: return 'Standard assistance required';
      case 3: return 'Maximum assistance required';
      default: return 'Unknown level';
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setEditedTime(schedule.time_of_day);
    setEditedLevel(schedule.assistance_level);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setEditedTime('');
    setEditedLevel(2);
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;
    if (!editedTime) {
      setError('Please select a valid time');
      return;
    }

    try {
      setSaving(true);
      await updateToiletingSchedule(editingSchedule.id, editedTime, editedLevel);
      setEditingSchedule(null);
      setEditedTime('');
      setEditedLevel(2);
      await loadSchedules();
      setError('');
    } catch (err) {
      setError('Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this schedule entry?')) return;
    try {
      await deleteToiletingSchedule(scheduleId);
      await loadSchedules();
    } catch (err) {
      setError(`Failed to delete schedule: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-title">Loading schedules...</div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-title">
          Toileting Schedule for {elder.name}
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff5f5',
            border: '2px solid #fc8181',
            borderRadius: '8px',
            color: '#742a2a',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <div className="modal-body">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#222' }}>
              Current Schedules
            </h3>

            {schedules.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                No toileting schedules set up yet
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.75rem'
              }}>
                {schedules.map((schedule, index) => (
                  <div key={index} style={{
                    padding: '0.75rem',
                    backgroundColor: '#f7fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    minWidth: '0',
                    fontSize: '0.9rem'
                  }}>
                    {editingSchedule && editingSchedule.id === schedule.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <input
                            type="time"
                            value={editedTime}
                            onChange={(e) => setEditedTime(e.target.value)}
                            className="add-elder-input"
                            style={{ width: '100%', padding: '0.35rem', fontSize: '0.8rem' }}
                          />
                          <select
                            value={editedLevel}
                            onChange={(e) => setEditedLevel(parseInt(e.target.value))}
                            className="add-elder-input"
                            style={{ width: '100%', padding: '0.35rem', fontSize: '0.8rem' }}
                          >
                            <option value={1}>L1</option>
                            <option value={2}>L2</option>
                            <option value={3}>L3</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-small" onClick={handleSaveEdit} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button className="btn btn-danger btn-small" onClick={handleCancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.2rem' }}>
                          {formatTime(schedule.time_of_day)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.5rem' }}>
                          Assistant level: {schedule.assistance_level} ({schedule.assistance_level === 1 ? 'Minimal' : schedule.assistance_level === 2 ? 'Normal' : 'Maximum'})
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-primary btn-small" onClick={() => handleEditSchedule(schedule)}>
                            Edit
                          </button>
                          <button className="btn btn-danger btn-small" onClick={() => handleDeleteSchedule(schedule.id)}>
                            Del
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#222' }}>
              Add New Schedule
            </h3>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="add-elder-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Assistance Level
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(parseInt(e.target.value))}
                  className="add-elder-input"
                  style={{ width: '100%' }}
                >
                  <option value={1}>Level 1 - Minimal assistance</option>
                  <option value={2}>Level 2 - Standard assistance</option>
                  <option value={3}>Level 3 - Maximum assistance</option>
                </select>
              </div>

              <button
                onClick={handleAddSchedule}
                disabled={saving}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                {saving ? 'Adding...' : 'Add Time'}
              </button>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>Assistance Levels:</strong><br />
              • Level 1: Elder can manage with minimal help<br />
              • Level 2: Standard assistance required (your default)<br />
              • Level 3: Maximum assistance needed
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
