# Elder Care Toileting Tracking System

A tablet-optimized web application for elder care centers to track toileting schedules and assistance levels in real-time.

## Features

- **Morning Setup**: Staff selects which elders are present each day
- **Auto-Population**: System automatically shows scheduled toileting times based on elder profiles
- **Manual Addition**: Add elders not in auto-populated list
- **Real-Time Tracking**: View current time and next toileting time for each elder
- **Automatic Alerts**: Visual + audio notifications when toileting is overdue
- **Progress Tracking**: See which elders have completed their toileting sessions
- **Event Logging**: Historical record of all toileting events
- **Audio Toggle**: Mute/unmute alerts as needed

## Technology Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React 18 + Vite
- **Database**: SQLite3 (local file-based)
- **Real-Time**: Polling-based sync (5-10 second intervals)
- **Target**: Tablet-optimized responsive UI

## Installation

### Prerequisites
- Node.js 16+ (check with `node --version`)
- npm (comes with Node.js)

### Setup

1. **Clone/Extract the project** to your working directory

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

You need to run both the backend server and frontend development server concurrently.

### Option 1: Separate Terminals

**Terminal 1 - Backend Server**:
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend Dev Server**:
```bash
cd frontend
npm run dev
# Open http://localhost:5173 in your browser (or 5174 if 5173 is in use)
```

### Option 2: Single Terminal with Concurrency



```

## First Time Setup

1. **Start the application** (backend + frontend)
2. **Morning Setup Screen** will appear
3. **Select elders** who are present today
   - Checkbox next to each elder name
4. **Set up toileting schedules** for each elder:
   - Click the "📅 Schedule" button next to each elder
   - Add toileting times (e.g., 9:00 AM, 12:00 PM, 3:00 PM, 6:00 PM)
   - Set assistance level (1-3) for each time slot
   - Level 1: Minimal assistance, Level 2: Standard assistance, Level 3: Maximum assistance
5. **Click "Start Day"** to begin tracking

## Database Initialization

The SQLite database is automatically created on first run with all necessary tables:
- `elders` - Elder profiles
- `staff` - Staff members
- `toileting_schedule` - Default toileting times
- `daily_roster` - Which elders are present each day
- `toileting_events` - Historical log of events

Database file location: `backend/data/eldercaredb.sqlite3`

## Usage

### Main Tracking View

After morning setup, the main tracking screen shows:
- **Current Time** (live, updates every second)
- **Next Toileting Time** for each elder
- **Completed Sessions** count
- **Status Indicator** (Pending, In Progress, Overdue, Done)

### Actions

1. **Bring to Toileting**: Click the "🚻 Bringing" button to mark elder as in-progress
2. **Mark Done**: Click the "✓ Done" button when toileting is complete
3. **Add Elder**: Use "+ Add Elder" to manually add someone not in the auto-populated list
4. **Manage Schedules**: Click "📅 Schedule" next to any elder to add/edit toileting times
5. **View Logs**: Check "📋 Logs" to see daily event history

### Alerts

- **Visual Alert**: Color highlight and title bar flash when toileting is overdue
- **Audio Alert**: Beep sequence plays (if audio enabled)
- **Mute Toggle**: Use "🔊 On/Off" button in header to enable/disable audio

## API Endpoints

### Setup & Configuration
- `POST /api/setup-day` - Initialize daily roster
- `POST /api/elders` - Add new elder
- `POST /api/toileting-schedule` - Add toileting schedule for elder
- `GET /api/toileting-schedule/:elder_id` - Get schedule for specific elder

### Daily Operations
- `GET /api/daily-roster` - Get today's elders sorted by next toileting time
- `POST /api/update-toileting-status` - Mark toileting as in-progress or completed
- `POST /api/add-elder-manual` - Manually add elder to today's roster
- `GET /api/check-overdue` - Check for overdue toileting tasks

### Information
- `GET /api/elders` - Get all registered elders
- `GET /api/toileting-schedule/:elder_id` - Get schedule for specific elder
- `GET /api/daily-logs` - Get today's event logs

## Building for Production

To create an optimized production build:

```bash
cd frontend
npm run build
# Output goes to frontend/dist/
```

Then serve the `dist` folder using any static web server.

## Database Management

### Backup Database
```bash
cp backend/data/eldercaredb.sqlite3 backend/data/eldercaredb.sqlite3.backup
```

### Reset Database
Delete `backend/data/eldercaredb.sqlite3` and restart the server to recreate with default schema.

## Troubleshooting

### Port Already in Use
- Backend won't start: Change PORT in `backend/.env` (default: 5000)
- Frontend won't start: Use different port in `frontend/vite.config.js` (default: 5173)

### Database Not Creating
- Ensure `backend/data/` directory exists
- Check file permissions in the backend directory
- Delete any corrupted database file and restart

### Alerts Not Working
- Check browser notification permissions
- Ensure "Audio enabled" in header is toggled on
- Some browsers require user interaction before audio can play

### Connection Issues
- Verify backend is running: visit `http://localhost:5000/health`
- Check frontend proxy settings in `frontend/vite.config.js`
- Ensure CORS is enabled in `backend/server.js`

## Configuration

### Backend (.env)
```
PORT=5000
NODE_ENV=development
```

### Frontend (vite.config.js)
```javascript
server: {
  port: 5173, // or 5174 if 5173 is in use
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

## Notes

- The system is designed for 1-3 concurrent tablet users on a local network
- No external internet required—completely self-contained
- All data stored locally in SQLite
- System uses 12-hour time format (can be modified in components)
- Audio alerts can be disabled for quiet environments

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify both backend and frontend services are running
3. Check browser console for error messages
4. Review `backend` terminal output for API errors

