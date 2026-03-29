import React, { useState, useEffect } from 'react';
import { fetchElders, setupDay, addElder } from '../utils/api.js';
import ScheduleManager from './ScheduleManager';
import '../styles/tablet.css';

export default function SetupScreen({ onDaySetup }) {
  const [elders, setElders] = useState([]);
  const [selectedElders, setSelectedElders] = useState([]);
  const [newElderName, setNewElderName] = useState('');
  const [newElderId, setNewElderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [selectedElderForSchedule, setSelectedElderForSchedule] = useState(null);

  useEffect(() => {
    loadElders();
  }, []);

  const loadElders = async () => {
    try {
      setLoading(true);
      const data = await fetchElders();
      setElders(data);
      setSelectedElders([]);
    } catch (err) {
      setError('Failed to load elders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleElder = (elder_id) => {
    setSelectedElders(prev =>
      prev.includes(elder_id)
        ? prev.filter(id => id !== elder_id)
        : [...prev, elder_id]
    );
  };

  const handleAddElder = async () => {
    if (!newElderName || !newElderId) {
      setError('Please enter both name and ID');
      return;
    }

    try {
      setSubmitting(true);
      const result = await addElder(newElderName, newElderId);
      setElders([...elders, { id: result.id, name: newElderName, identification_number: newElderId }]);
      setSelectedElders([...selectedElders, result.id]);
      setNewElderName('');
      setNewElderId('');
      setError('');
    } catch (err) {
      setError('Failed to add elder: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageSchedule = (elder) => {
    setSelectedElderForSchedule(elder);
    setShowScheduleManager(true);
  };

  const handleCloseScheduleManager = () => {
    setShowScheduleManager(false);
    setSelectedElderForSchedule(null);
  };

  const handleSetupDay = async () => {
    if (selectedElders.length === 0) {
      setError('Please select at least one elder');
      return;
    }

    try {
      setSubmitting(true);
      await setupDay(selectedElders);
      onDaySetup();
    } catch (err) {
      setError('Failed to setup day: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="setup-screen" style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading elders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <div>
          <div className="header-title">Morning Setup</div>
          <div className="header-date">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="content">
        <div className="setup-screen">
          <div className="setup-title">Select Present Elders</div>
          <p className="setup-subtitle">Choose which elders are present today</p>

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

          <div className="elder-list">
            {elders.map(elder => (
              <div key={elder.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label className="elder-checkbox-item" style={{ flex: 1, margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={selectedElders.includes(elder.id)}
                    onChange={() => handleToggleElder(elder.id)}
                  />
                  <div className="elder-checkbox-label">
                    <div>{elder.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                      ID: {elder.identification_number}
                    </div>
                  </div>
                </label>
                <button
                  onClick={() => handleManageSchedule(elder)}
                  className="btn btn-secondary btn-small"
                  style={{ minWidth: '100px' }}
                >
                  📅 Schedule
                </button>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#222' }}>
              Add New Elder
            </p>
            <div className="add-elder-section">
              <input
                type="text"
                placeholder="Elder name"
                value={newElderName}
                onChange={(e) => setNewElderName(e.target.value)}
                className="add-elder-input"
              />
              <input
                type="text"
                placeholder="ID number"
                value={newElderId}
                onChange={(e) => setNewElderId(e.target.value)}
                className="add-elder-input"
              />
              <button
                onClick={handleAddElder}
                disabled={submitting}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                {submitting ? '...' : 'Add'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={handleSetupDay}
              disabled={submitting || selectedElders.length === 0}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '1.1rem' }}
            >
              {submitting ? 'Starting...' : `Start Day (${selectedElders.length} elders)`}
            </button>
          </div>
        </div>
      </div>

      {showScheduleManager && selectedElderForSchedule && (
        <ScheduleManager
          elder={selectedElderForSchedule}
          onClose={handleCloseScheduleManager}
        />
      )}
    </div>
  );
}
