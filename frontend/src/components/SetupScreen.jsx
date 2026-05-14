import React, { useState, useEffect } from 'react';
import { fetchElders, setupDay, addElder, updateElder, deleteElder } from '../utils/api.js';
import ScheduleManager from './ScheduleManager';
import '../styles/tablet.css';

export default function SetupScreen({ onDaySetup }) {
  const [elders, setElders] = useState([]);
  const [selectedElders, setSelectedElders] = useState([]);
  const [newElderName, setNewElderName] = useState('');
  const [newElderId, setNewElderId] = useState('');
  const [newElderTrackPooPee, setNewElderTrackPooPee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [selectedElderForSchedule, setSelectedElderForSchedule] = useState(null);
  const [editingElder, setEditingElder] = useState(null);

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
      const result = await addElder(newElderName, newElderId, newElderTrackPooPee);
      setElders([...elders, { id: result.id, name: newElderName, identification_number: newElderId, track_poo_pee: newElderTrackPooPee ? 1 : 0 }]);
      setSelectedElders([...selectedElders, result.id]);
      setNewElderName('');
      setNewElderId('');
      setNewElderTrackPooPee(false);
      setError('');
    } catch (err) {
      setError('Failed to add elder: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditElder = (elder) => {
    setEditingElder(elder);
    setNewElderName(elder.name);
    setNewElderId(elder.identification_number);
    setNewElderTrackPooPee(elder.track_poo_pee === 1);
  };

  const handleSaveEdit = async () => {
    if (!newElderName || !newElderId || !editingElder) {
      setError('Please enter both name and ID');
      return;
    }

    try {
      setSubmitting(true);
      await updateElder(editingElder.id, newElderName, newElderId, newElderTrackPooPee);
      setElders(elders.map(e => e.id === editingElder.id 
        ? { ...e, name: newElderName, identification_number: newElderId, track_poo_pee: newElderTrackPooPee ? 1 : 0 } 
        : e
      ));
      setEditingElder(null);
      setNewElderName('');
      setNewElderId('');
      setNewElderTrackPooPee(false);
      setError('');
    } catch (err) {
      setError('Failed to update elder: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteElder = async (elder) => {
    if (!window.confirm(`Delete elder "${elder.name}"? This will also delete their schedules and toileting records.`)) {
      return;
    }

    try {
      setSubmitting(true);
      await deleteElder(elder.id);
      setElders(elders.filter(e => e.id !== elder.id));
      setSelectedElders(selectedElders.filter(id => id !== elder.id));
      setError('');
    } catch (err) {
      setError('Failed to delete elder: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingElder(null);
    setNewElderName('');
    setNewElderId('');
    setNewElderTrackPooPee(false);
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
                  style={{ minWidth: '80px' }}
                >
                  📅
                </button>
                <button
                  onClick={() => handleEditElder(elder)}
                  className="btn btn-secondary btn-small"
                  style={{ minWidth: '60px' }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteElder(elder)}
                  className="btn btn-small"
                  style={{ minWidth: '60px', backgroundColor: '#e53e3e', color: 'white' }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#222' }}>
              {editingElder ? 'Edit Elder' : 'Add New Elder'}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 1rem' }}>
                <input
                  type="checkbox"
                  checked={newElderTrackPooPee}
                  onChange={(e) => setNewElderTrackPooPee(e.target.checked)}
                />
                Track Poo/Pee instead of timing
              </label>
              {editingElder ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ minWidth: '100px' }}
                  >
                    {submitting ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-secondary"
                    style={{ minWidth: '80px' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddElder}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ minWidth: '120px' }}
                >
                  {submitting ? '...' : 'Add'}
                </button>
              )}
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
