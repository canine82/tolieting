import React from 'react';
import '../styles/tablet.css';

export default function ElderCard({ elder, currentTime, isOverdue, onMarkInProgress, onMarkDone, onMarkUndo, onDelete, onUpdatePooPee }) {
  const formatTime = (time) => {
    if (typeof time === 'string') return time;
    return time.getHours().toString().padStart(2, '0') + ':' +
           time.getMinutes().toString().padStart(2, '0');
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const currentTimeStr = formatTime(currentTime);
  const currentTimeMinutes = parseTime(currentTimeStr);

  const isPooPeeMode = elder.track_poo_pee > 0;
  const trackPoo = elder.track_poo_pee === 1 || elder.track_poo_pee === 2;
  const trackPee = elder.track_poo_pee === 1 || elder.track_poo_pee === 3;

  const getEffectiveNextTime = () => {
    const nextTimeMinutes = parseTime(elder.next_toileting_time);
    if (nextTimeMinutes !== null && currentTimeMinutes >= nextTimeMinutes) {
      return currentTimeMinutes;
    }
    return nextTimeMinutes;
  };

  const getStatus = () => {
    if (isPooPeeMode) return 'pending'; // Always active in tracker mode
    if (elder.completed_count === elder.total_schedules) return 'completed';
    if (elder.in_progress_count > 0) return 'in-progress';
    const effectiveNextTime = getEffectiveNextTime();
    if (isOverdue && effectiveNextTime !== null) {
      return currentTimeMinutes >= effectiveNextTime ? 'overdue' : 'pending';
    }
    return 'pending';
  };

  const status = getStatus();
  const isOverduePending = !isPooPeeMode && (status === 'overdue' || (status === 'pending' && isOverdue));

  const getStatusBadgeClass = () => {
    return `elder-card-status status-${status}`;
  };

  // Calculate countdown display
  const getCountdownDisplay = () => {
    if (!elder.next_toileting_time) return '—';
    const nextMinutes = parseTime(elder.next_toileting_time);
    if (nextMinutes === null) return '—';
    const diff = nextMinutes - currentTimeMinutes;
    if (diff > 0) {
      return `${diff} min`;
    }
    // Countdown reached zero or negative - show GIF
    return <img src="/flashing_image 1.gif" alt="Time's up!" style={{ width: '60px', height: 'auto' }} />;
  };

  return (
    <div className={`elder-card ${status} ${isOverduePending ? 'flash-overdue' : ''}`}>
<div className="elder-card-header">
          <div className={getStatusBadgeClass()}>
            {isPooPeeMode ? '🚽 Tracker Mode' :
             status === 'overdue' ? '⚠️ Pending (Overdue)' : 
             status === 'pending' ? '⏰ Pending' :
             status === 'in-progress' ? '🚻 In Progress' :
             '✅ Done'}
          </div>
          <div style={{
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#003366',
            marginTop: '0.5rem'
          }}>
            {elder.name}
            {onDelete && (
              <span style={{ marginLeft: '0.5rem' }}>
                <button
                  onClick={() => onDelete(elder)}
                  className="btn btn-danger btn-small"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  title="Delete elder"
                >
                  🗑️
                </button>
              </span>
            )}
          </div>
        </div>

      {isPooPeeMode ? (
        <div className="elder-card-poo-pee" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trackPoo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Poo Count: {elder.poo_count || 0}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => onUpdatePooPee(elder.id, 'poo', -1)} disabled={!elder.poo_count}>-1</button>
                <button className="btn btn-primary" onClick={() => onUpdatePooPee(elder.id, 'poo', 1)}>+1</button>
              </div>
            </div>
          )}
          {trackPee && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Pee Count: {elder.pee_count || 0}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => onUpdatePooPee(elder.id, 'pee', -1)} disabled={!elder.pee_count}>-1</button>
                <button className="btn btn-primary" onClick={() => onUpdatePooPee(elder.id, 'pee', 1)}>+1</button>
              </div>
            </div>
          )}
          {elder.pp_alert_time && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555', textAlign: 'center', backgroundColor: '#f0f4f8', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              ⏰ Alert to be sent at <strong>{elder.pp_alert_time}</strong> hrs
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="elder-card-times">
            <div className="time-block">
              <div className="time-label">Countdown</div>
              <div className="time-value" style={{
                color: '#003366',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getCountdownDisplay()}
              </div>
            </div>
            <div className="time-block">
              <div className="time-label">Next Toileting</div>
              <div className="time-value" style={{
                color: '#003366',
                fontWeight: 'bold'
              }}>
                {elder.next_toileting_time ? elder.next_toileting_time : '—'}
              </div>
            </div>
          </div>

          <div className="elder-card-progress">
            Completed: {elder.completed_count} of {elder.total_schedules} toileting sessions
          </div>

          <div className="elder-card-actions">
            {(status === 'pending' || status === 'overdue') && (
              <>
                {status === 'overdue' && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#f56565',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    textAlign: 'center'
                  }}>
                    Overdue - Complete toileting
                  </div>
                )}
                <button
                  onClick={() => onMarkDone(elder.id, elder.next_toileting_time)}
                  className="btn btn-secondary btn-small"
                  style={{ width: '100%' }}
                >
                  ✓ Completed
                </button>
              </>
            )}

            {status === 'completed' && (
              <div style={{
                textAlign: 'center',
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#c6f6d5',
                borderRadius: '8px',
                color: '#22543d',
                fontWeight: '600'
              }}>
                All toileting sessions completed
                {elder.last_completed_time && (
                  <button
                    onClick={() => onMarkUndo(elder.id, elder.last_completed_time)}
                    className="btn btn-danger btn-small"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    ⟲ Undo Last
                  </button>
                )}
              </div>
            )}

            {elder.last_completed_time && status !== 'completed' && (
              <button
                onClick={() => onMarkUndo(elder.id, elder.last_completed_time)}
                className="btn btn-danger btn-small"
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                ⟲ Undo Last
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
