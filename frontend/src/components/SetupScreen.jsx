import React, { useState, useEffect } from 'react';
import { fetchElders, setupDay, addElder, updateElder, deleteElder, getSettings, saveSettings } from '../utils/api.js';
import ScheduleManager from './ScheduleManager';
import '../styles/tablet.css';

export default function SetupScreen({ onDaySetup }) {
  const [elders, setElders] = useState([]);
  const [selectedElders, setSelectedElders] = useState([]);
  const [newElderName, setNewElderName] = useState('');
  const [newElderId, setNewElderId] = useState('');
  const [newElderTrackPoo, setNewElderTrackPoo] = useState(false);
  const [newElderTrackPee, setNewElderTrackPee] = useState(false);
  const [newElderPpAlertTime, setNewElderPpAlertTime] = useState('');
  
  // Settings state
  const [commsName, setCommsName] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [selectedElderForSchedule, setSelectedElderForSchedule] = useState(null);
  const [editingElder, setEditingElder] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eldersData, settingsData] = await Promise.all([fetchElders(), getSettings()]);
      setElders(eldersData);
      if (settingsData.COMMS_NAME) setCommsName(settingsData.COMMS_NAME);
      if (settingsData.TELEGRAM_CHAT_ID) setTelegramChatId(settingsData.TELEGRAM_CHAT_ID);
      if (settingsData.TELEGRAM_BOT_TOKEN) setTelegramBotToken(settingsData.TELEGRAM_BOT_TOKEN);
    } catch (err) {
      setError('Failed to load initial data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsSaving(true);
      await saveSettings({
        COMMS_NAME: commsName,
        TELEGRAM_CHAT_ID: telegramChatId,
        TELEGRAM_BOT_TOKEN: telegramBotToken
      });
      setSettingsMessage('Settings saved!');
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (err) {
      setSettingsMessage('Failed to save settings');
    } finally {
      setSettingsSaving(false);
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
      let trackVal = 0;
      if (newElderTrackPoo && newElderTrackPee) trackVal = 1;
      else if (newElderTrackPoo) trackVal = 2;
      else if (newElderTrackPee) trackVal = 3;

      const result = await addElder(newElderName, newElderId, trackVal, newElderPpAlertTime);
      setElders([...elders, { id: result.id, name: newElderName, identification_number: newElderId, track_poo_pee: trackVal, pp_alert_time: newElderPpAlertTime }]);
      setSelectedElders([...selectedElders, result.id]);
      setNewElderName('');
      setNewElderId('');
      setNewElderTrackPoo(false);
      setNewElderTrackPee(false);
      setNewElderPpAlertTime('');
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
    setNewElderTrackPoo(elder.track_poo_pee === 1 || elder.track_poo_pee === 2);
    setNewElderTrackPee(elder.track_poo_pee === 1 || elder.track_poo_pee === 3);
    setNewElderPpAlertTime(elder.pp_alert_time || '');
  };

  const handleSaveEdit = async () => {
    if (!newElderName || !newElderId || !editingElder) {
      setError('Please enter both name and ID');
      return;
    }

    try {
      setSubmitting(true);
      let trackVal = 0;
      if (newElderTrackPoo && newElderTrackPee) trackVal = 1;
      else if (newElderTrackPoo) trackVal = 2;
      else if (newElderTrackPee) trackVal = 3;

      await updateElder(editingElder.id, newElderName, newElderId, trackVal, newElderPpAlertTime);
      setElders(elders.map(e => e.id === editingElder.id 
        ? { ...e, name: newElderName, identification_number: newElderId, track_poo_pee: trackVal, pp_alert_time: newElderPpAlertTime } 
        : e
      ));
      setEditingElder(null);
      setNewElderName('');
      setNewElderId('');
      setNewElderTrackPoo(false);
      setNewElderTrackPee(false);
      setNewElderPpAlertTime('');
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
    setNewElderTrackPoo(false);
    setNewElderTrackPee(false);
    setNewElderPpAlertTime('');
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
          <div className="setup-section settings-section" style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h2 style={{ borderBottom: '2px solid #edf2f7', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#2b6cb0' }}>Communication Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Comms Group Name:</label>
                <input type="text" value={commsName} onChange={(e) => setCommsName(e.target.value)} placeholder="e.g. Ward A" className="add-elder-input" />
              </div>
              <div>
                <label>Telegram Chat ID:</label>
                <input type="text" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="e.g. -10012345678" className="add-elder-input" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Telegram Bot Token:</label>
                <input type="text" value={telegramBotToken} onChange={(e) => setTelegramBotToken(e.target.value)} placeholder="e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" className="add-elder-input" />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleSaveSettings} disabled={settingsSaving} style={{ marginTop: '1rem' }}>
              {settingsSaving ? 'Saving...' : '💾 Save Settings'}
            </button>
            {settingsMessage && <span style={{ marginLeft: '1rem', color: settingsMessage.includes('Failed') ? 'red' : 'green', fontWeight: 'bold' }}>{settingsMessage}</span>}
          </div>

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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0 1rem', padding: '0.5rem 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#555' }}>Tracker Options (Instead of timing):</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={newElderTrackPoo}
                    onChange={(e) => setNewElderTrackPoo(e.target.checked)}
                  />
                  Track Poo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={newElderTrackPee}
                    onChange={(e) => setNewElderTrackPee(e.target.checked)}
                  />
                  Track Pee
                </label>
              </div>
              {(newElderTrackPoo || newElderTrackPee) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 1rem', paddingBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#555' }}>Reminder Time (24h):</label>
                  <input
                    type="time"
                    value={newElderPpAlertTime}
                    onChange={(e) => setNewElderPpAlertTime(e.target.value)}
                    className="add-elder-input"
                    style={{ width: 'auto', marginBottom: 0, padding: '0.3rem' }}
                  />
                </div>
              )}
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
