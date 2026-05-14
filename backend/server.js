import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './database.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { runQuery } from './database.js';
import { sendTelegramAlert } from './telegram.js';

// Setup background job for PP alerts
const startAlertCron = () => {
  console.log('Cron job initialized');
  setInterval(async () => {
    const now = new Date();
    // Only trigger at the start of a minute
    if (now.getSeconds() !== 0) return;

    const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' +
                        now.getMinutes().toString().padStart(2, '0');
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[Cron] Checking alerts for time: ${currentHHMM}, date: ${today}`);

    try {
      const eldersToAlert = await runQuery(`
        SELECT e.name, dr.poo_count, dr.pee_count, e.track_poo_pee 
        FROM elders e
        JOIN daily_roster dr ON e.id = dr.elder_id
        WHERE e.track_poo_pee > 0 
          AND e.pp_alert_time = ? 
          AND dr.date = ? 
          AND dr.is_present = 1
      `, [currentHHMM, today]);

      console.log(`[Cron] Found ${eldersToAlert.length} elders to alert.`);

      for (const elder of eldersToAlert) {
        console.log(`[Cron] Preparing to send Telegram alert for elder: ${elder.name}`);
        const trackPoo = elder.track_poo_pee === 1 || elder.track_poo_pee === 2;
        const trackPee = elder.track_poo_pee === 1 || elder.track_poo_pee === 3;
        let details = [];
        if (trackPoo) details.push(`Poo: ${elder.poo_count}`);
        if (trackPee) details.push(`Pee: ${elder.pee_count}`);
        const detailsStr = details.join(', ');

        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const formattedDate = `${dd}/${mm}/${yyyy} ${currentHHMM}hrs`;

        await sendTelegramAlert(`⏰ Reminder: user - ${elder.name}, (${detailsStr}) as of ${formattedDate}`);
      }
    } catch (err) {
      console.error('Error in cron job:', err.message);
    }
  }, 1000);
};

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    startAlertCron();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('API endpoints available at http://localhost:5000/api');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
