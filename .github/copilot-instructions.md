<!-- Custom copilot instructions for Elder Care Toileting Tracking System -->

## Project Overview
This is a full-stack web application for elder care centers to track toileting schedules and assistance levels. Built with Node.js/Express backend and React frontend, using SQLite for local data persistence.

## Key Technology Stack
- Backend: Node.js + Express.js
- Frontend: React 18 + Vite
- Database: SQLite3
- Real-time: Polling-based sync (5-10 sec intervals)
- Target: Tablet-optimized single-page application

## Development Setup
Run both backend and frontend concurrently:
1. Backend: `cd backend && npm start` (runs on port 5000)
2. Frontend: `cd frontend && npm run dev` (runs on port 5173)

## Project Structure
```
.
├── backend/               # Express API server & SQLite
│   ├── server.js         # Express app, routes setup
│   ├── database.js       # SQLite schema & initialization
│   ├── routes/
│   │   └── api.js        # All API endpoints
│   ├── package.json
│   ├── .env
│   └── data/
│       └── eldercaredb.sqlite3  # SQLite database file
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── utils/        # Helper functions (alerts, API calls)
│   │   ├── styles/       # Tablet-responsive CSS
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
├── README.md
└── .github/copilot-instructions.md  # This file
```

## Core Database Schema
- `elders` - Elder profiles (id, name, identification_number)
- `daily_roster` - Which elders are present today (date, elder_id, is_present)
- `toileting_schedule` - Default toileting times per elder (elder_id, time_of_day, assistance_level)
- `toileting_events` - Historical log of all toileting events (date, elder_id, scheduled_time, actual_time, completed_by_staff, notes)
- `staff` - Staff members (id, name)

## Main API Endpoints
- `POST /api/setup-day` - Initialize daily roster with present elders
- `GET /api/daily-roster` - Get elders for today sorted by next toileting time
- `POST /api/update-toileting-status` - Mark toileting as done or in progress
- `POST /api/add-elder-manual` - Manually add elder to today's roster
- `GET /api/check-overdue` - Check for overdue toileting tasks
- `POST /api/log-toileting-event` - Log completion of toileting task
- `GET /api/daily-logs` - Get event logs for the day

## Key UI Components
- `SetupScreen` - Morning staff setup (select present elders)
- `MainTracking` - Primary tracking view (elder list by time)
- `ElderCard` - Individual elder status display
- Alert system - Visual + audio notifications for overdue tasks

## Important Notes
- SQLite database file persists in `backend/data/eldercaredb.sqlite3`
- All times are local (12-hour or 24-hour based on center preference)
- Audio alerts are optional and can be muted
- System is designed for 1-3 concurrent tablet users on local network
- No external cloud dependency—completely self-contained for privacy
