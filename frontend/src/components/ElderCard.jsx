import React from 'react';
import '../styles/tablet.css';

export default function ElderCard({ elder, currentTime, isOverdue, onMarkInProgress, onMarkDone, onMarkUndo }) {
  const formatTime = (time) => {
    if (typeof time === 'string') return time;
    return time.getHours().toString().padStart(2, '0') + ':' +
           time.getMinutes().toString().padStart(2, '0');
  };

  const currentTimeStr = formatTime(currentTime);

  const getStatus = () => {
    if (elder.completed_count === elder.total_schedules) return 'completed';
    if (elder.in_progress_count > 0) return 'in-progress';
    if (isOverdue) {
      return currentTimeStr >= elder.next_toileting_time ? 'overdue' : 'pending';
    }
    return 'pending';
  };

  const status = getStatus();
  const isOverduePending = status === 'overdue' || (status === 'pending' && isOverdue);

  const getStatusBadgeClass = () => {
    return `elder-card-status status-${status}`;
  };

  return (
    <div className={`elder-card ${status} ${isOverduePending ? 'flash-overdue' : ''}`}>
      <div className="elder-card-header">
        <div className={getStatusBadgeClass()}>
          {status === 'overdue' ? '⚠️ Pending (Overdue)' : 
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
        </div>
      </div>

      <div className="elder-card-times">
        <div className="time-block">
          <div className="time-label">Current Time</div>
          <div className="time-value" style={{
            color: '#003366',
            fontWeight: 'bold'
          }}>{currentTimeStr}</div>
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
    </div>
  );
}
