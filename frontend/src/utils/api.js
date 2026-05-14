const API_BASE = '/api';

export const fetchElders = async () => {
  const response = await fetch(`${API_BASE}/elders`);
  if (!response.ok) throw new Error('Failed to fetch elders');
  return response.json();
};

export const addElder = async (name, identification_number, track_poo_pee = false, pp_alert_time = '') => {
  const response = await fetch(`${API_BASE}/elders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, identification_number, track_poo_pee, pp_alert_time })
  });
  if (!response.ok) throw new Error('Failed to add elder');
  return response.json();
};

export const updateElder = async (id, name, identification_number, track_poo_pee = false, pp_alert_time = '') => {
  const response = await fetch(`${API_BASE}/elders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, identification_number, track_poo_pee, pp_alert_time })
  });
  if (!response.ok) throw new Error('Failed to update elder');
  return response.json();
};

export const deleteElder = async (id) => {
  const response = await fetch(`${API_BASE}/elders/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete elder');
  return response.json();
};

export const updatePooPeeCount = async (elder_id, type, amount) => {
  const response = await fetch(`${API_BASE}/update-poo-pee-count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elder_id, type, amount })
  });
  if (!response.ok) throw new Error('Failed to update count');
  return response.json();
};

export const setupDay = async (elder_ids) => {
  const response = await fetch(`${API_BASE}/setup-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elder_ids })
  });
  if (!response.ok) throw new Error('Failed to setup day');
  return response.json();
};

export const getDailyRoster = async () => {
  const response = await fetch(`${API_BASE}/daily-roster`);
  if (!response.ok) throw new Error('Failed to fetch roster');
  return response.json();
};

export const checkOverdue = async () => {
  const response = await fetch(`${API_BASE}/check-overdue`);
  if (!response.ok) throw new Error('Failed to check overdue');
  return response.json();
};

export const updateToiletingStatus = async (elder_id, scheduled_time, status, completed_by_staff = '', notes = '') => {
  const payload = { elder_id, scheduled_time, status, completed_by_staff };
  if (notes) payload.notes = notes;
  const response = await fetch(`${API_BASE}/update-toileting-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to update status');
  return response.json();
};

export const updateToiletingEvent = async (id, payload) => {
  const response = await fetch(`${API_BASE}/toileting-events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to update toileting event');
  return response.json();
};

export const getSettings = async () => {
  const response = await fetch(`${API_BASE}/settings`);
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
};

export const saveSettings = async (settings) => {
  const response = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!response.ok) throw new Error('Failed to save settings');
  return response.json();
};

export const addElderManual = async (elder_id) => {
  const response = await fetch(`${API_BASE}/add-elder-manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elder_id })
  });
  if (!response.ok) throw new Error('Failed to add elder');
  return response.json();
};

export const getToiletingSchedule = async (elder_id) => {
  const response = await fetch(`${API_BASE}/toileting-schedule/${elder_id}`);
  if (!response.ok) throw new Error('Failed to fetch schedule');
  return response.json();
};

export const addToiletingSchedule = async (elder_id, time_of_day, assistance_level = 2) => {
  const response = await fetch(`${API_BASE}/toileting-schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elder_id, time_of_day, assistance_level })
  });
  if (!response.ok) throw new Error('Failed to add schedule');
  return response.json();
};

export const updateToiletingSchedule = async (id, time_of_day, assistance_level) => {
  const response = await fetch(`${API_BASE}/toileting-schedule/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time_of_day, assistance_level })
  });
  if (!response.ok) throw new Error('Failed to update schedule');
  return response.json();
};

export const deleteToiletingSchedule = async (id) => {
  const response = await fetch(`${API_BASE}/toileting-schedule/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete schedule');
  return response.json();
};

export const getDailyLogs = async () => {
  const response = await fetch(`${API_BASE}/daily-logs`);
  if (!response.ok) throw new Error('Failed to fetch logs');
  return response.json();
};
