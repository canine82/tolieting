import express from 'express';
import { runQuery, runSingleQuery, runWrite } from '../database.js';

const router = express.Router();

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Get current time in HH:MM format
const getCurrentTime = () => {
  const now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' +
         now.getMinutes().toString().padStart(2, '0');
};

// Setup day - initialize daily roster with elders
router.post('/setup-day', async (req, res) => {
  try {
    const { elder_ids } = req.body;
    const today = getTodayDate();

    // Clear existing roster and toileting events for today (avoid duplicate re-setup counts)
    await runWrite('DELETE FROM daily_roster WHERE date = ?', [today]);
    await runWrite('DELETE FROM toileting_events WHERE date = ?', [today]);

    // Add selected elders to today's roster
    for (const elder_id of elder_ids) {
      await runWrite(
        'INSERT INTO daily_roster (date, elder_id, is_present) VALUES (?, ?, 1)',
        [today, elder_id]
      );

      // Create toileting events for this elder based on their schedule
      const schedule = await runQuery(
        'SELECT * FROM toileting_schedule WHERE elder_id = ? ORDER BY time_of_day',
        [elder_id]
      );

      for (const sched of schedule) {
        await runWrite(
          'INSERT INTO toileting_events (date, elder_id, scheduled_time, status) VALUES (?, ?, ?, ?)',
          [today, elder_id, sched.time_of_day, 'pending']
        );
      }
    }

    res.json({ success: true, message: 'Day setup complete', date: today });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily roster sorted by next toileting time
router.get('/daily-roster', async (req, res) => {
  try {
    const today = getTodayDate();

    const roster = await runQuery(`
      SELECT 
        e.id, e.name, e.identification_number,
        dr.is_present,
        (SELECT MIN(time_of_day) FROM toileting_schedule WHERE elder_id = e.id AND NOT EXISTS (SELECT 1 FROM toileting_events WHERE elder_id = toileting_schedule.elder_id AND scheduled_time = toileting_schedule.time_of_day AND date = ? AND status IN ('completed', 'in_progress'))) as next_toileting_time,
        (SELECT scheduled_time FROM toileting_events WHERE elder_id = e.id AND date = ? AND status = 'in_progress' LIMIT 1) as in_progress_time,
        (SELECT MAX(scheduled_time) FROM toileting_events WHERE elder_id = e.id AND date = ? AND status = 'completed') as last_completed_time,
        (SELECT COUNT(*) FROM toileting_events WHERE elder_id = e.id AND date = ? AND status = 'completed') as completed_count,
        (SELECT COUNT(*) FROM toileting_events WHERE elder_id = e.id AND date = ? AND status = 'in_progress') as in_progress_count,
        (SELECT COUNT(*) FROM toileting_events WHERE elder_id = e.id AND date = ? AND status = 'pending') as pending_count,
        (SELECT COUNT(*) FROM toileting_schedule WHERE elder_id = e.id) as total_schedules
      FROM daily_roster dr
      JOIN elders e ON dr.elder_id = e.id
      WHERE dr.date = ? AND dr.is_present = 1
      GROUP BY e.id
      ORDER BY e.id ASC
    `, [today, today, today, today, today, today, today]);

    res.json(roster);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check for overdue toileting tasks
router.get('/check-overdue', async (req, res) => {
  try {
    const today = getTodayDate();
    const currentTime = getCurrentTime();

    const overdue = await runQuery(`
      SELECT 
        e.id, e.name, e.identification_number,
        MIN(te.scheduled_time) AS next_pending_time,
        CASE 
          WHEN MIN(te.scheduled_time) < ? THEN 'overdue'
          WHEN MIN(te.scheduled_time) = ? THEN 'now'
          ELSE 'upcoming'
        END as urgency
      FROM toileting_events te
      JOIN elders e ON te.elder_id = e.id
      WHERE te.date = ? AND te.status = 'pending' AND te.scheduled_time <= ?
      GROUP BY e.id
      ORDER BY next_pending_time ASC
    `, [currentTime, currentTime, today, currentTime]);

    res.json(overdue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark toileting status (pending, in_progress, completed)
router.post('/update-toileting-status', async (req, res) => {
  try {
    const { elder_id, scheduled_time, status, completed_by_staff, notes } = req.body;
    const today = getTodayDate();

    if (status === 'completed') {
      const actualTime = getCurrentTime();
      await runWrite(
        'UPDATE toileting_events SET status = ?, actual_time = ?, completed_by_staff = ?, notes = ? WHERE elder_id = ? AND date = ? AND scheduled_time = ?',
        [status, actualTime, completed_by_staff, notes || null, elder_id, today, scheduled_time]
      );
    } else if (status === 'in_progress' || status === 'pending') {
      await runWrite(
        'UPDATE toileting_events SET status = ?, completed_by_staff = NULL, actual_time = NULL, notes = NULL WHERE elder_id = ? AND date = ? AND scheduled_time = ?',
        [status, elder_id, today, scheduled_time]
      );
    } else {
      return res.status(400).json({ error: 'Invalid status' });
    }

    res.json({ success: true, message: `Toileting marked as ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manually add elder to today's roster
router.post('/add-elder-manual', async (req, res) => {
  try {
    const { elder_id } = req.body;
    const today = getTodayDate();

    // Check if already in roster
    const existing = await runSingleQuery(
      'SELECT id FROM daily_roster WHERE date = ? AND elder_id = ?',
      [today, elder_id]
    );

    if (existing) {
      return res.json({ success: true, message: 'Elder already in roster' });
    }

    // Add to roster
    await runWrite(
      'INSERT INTO daily_roster (date, elder_id, is_present) VALUES (?, ?, 1)',
      [today, elder_id]
    );

    // Create toileting events for this elder
    const schedule = await runQuery(
      'SELECT * FROM toileting_schedule WHERE elder_id = ? ORDER BY time_of_day',
      [elder_id]
    );

    for (const sched of schedule) {
      await runWrite(
        'INSERT INTO toileting_events (date, elder_id, scheduled_time, status) VALUES (?, ?, ?, ?)',
        [today, elder_id, sched.time_of_day, 'pending']
      );
    }

    res.json({ success: true, message: 'Elder added to today\'s roster' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log toileting event (legacy, now handled in update-toileting-status)
router.post('/log-toileting-event', async (req, res) => {
  try {
    const { elder_id, scheduled_time, completed_by_staff, notes } = req.body;
    const today = getTodayDate();
    const actualTime = getCurrentTime();

    await runWrite(
      'INSERT INTO toileting_events (date, elder_id, scheduled_time, actual_time, completed_by_staff, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [today, elder_id, scheduled_time, actualTime, completed_by_staff, notes, 'completed']
    );

    res.json({ success: true, message: 'Toileting event logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily logs
router.get('/daily-logs', async (req, res) => {
  try {
    const today = getTodayDate();

    const logs = await runQuery(`
      SELECT 
        e.name, e.identification_number,
        te.scheduled_time, te.actual_time, te.completed_by_staff, te.notes, te.status
      FROM toileting_events te
      JOIN elders e ON te.elder_id = e.id
      WHERE te.date = ?
      ORDER BY te.scheduled_time ASC
    `, [today]);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all elders
router.get('/elders', async (req, res) => {
  try {
    const elders = await runQuery('SELECT * FROM elders ORDER BY name ASC');
    res.json(elders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new elder
router.post('/elders', async (req, res) => {
  try {
    const { name, identification_number } = req.body;
    const result = await runWrite(
      'INSERT INTO elders (name, identification_number) VALUES (?, ?)',
      [name, identification_number]
    );
    res.json({ success: true, id: result.id, message: 'Elder added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add toileting schedule for an elder
router.post('/toileting-schedule', async (req, res) => {
  try {
    const { elder_id, time_of_day, assistance_level } = req.body;
    const result = await runWrite(
      'INSERT INTO toileting_schedule (elder_id, time_of_day, assistance_level) VALUES (?, ?, ?)',
      [elder_id, time_of_day, assistance_level || 2]
    );
    res.json({ success: true, id: result.id, message: 'Schedule added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedules for an elder
router.get('/toileting-schedule/:elder_id', async (req, res) => {
  try {
    const { elder_id } = req.params;
    const schedules = await runQuery(
      'SELECT * FROM toileting_schedule WHERE elder_id = ? ORDER BY time_of_day ASC',
      [elder_id]
    );
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a schedule entry
router.put('/toileting-schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { time_of_day, assistance_level } = req.body;

    const existing = await runSingleQuery('SELECT * FROM toileting_schedule WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await runWrite(
      'UPDATE toileting_schedule SET time_of_day = ?, assistance_level = ? WHERE id = ?',
      [time_of_day, assistance_level || existing.assistance_level, id]
    );

    res.json({ success: true, message: 'Schedule updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a schedule entry
router.delete('/toileting-schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await runSingleQuery('SELECT * FROM toileting_schedule WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await runWrite('DELETE FROM toileting_schedule WHERE id = ?', [id]);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
