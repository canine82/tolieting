# Elder Care Toileting System - Troubleshooting Guide

## Quick Restart

**If something breaks, try this first:**

```bash
cd ~/tolieting
bash reload.sh
```

This opens an interactive menu with repair options.

---

## Diagnostic Scripts

### 1. Health Check
Run a complete system diagnostic:
```bash
bash health-check.sh
```

Shows:
- Node.js & PM2 status
- App running status
- API responsiveness
- Nginx status
- Database integrity
- Disk/Memory usage
- Recent errors

### 2. Quick Restart
```bash
bash reload.sh
```

Options:
- `1` - Quick restart (just backend)
- `2` - Full rebuild (frontend + backend)
- `3` - Clean restart (complete rebuild)
- `4` - Stop the app
- `5` - View logs

---

## Maintenance Page

When the backend crashes, visitors see a **maintenance page** instead of errors.

- Auto-refreshes every 10 seconds
- Shows what's being fixed
- Automatically redirects when app comes back online
- Located at: `maintenance.html`

---

## Common Issues & Solutions

### Issue: App won't start
```bash
# Check what's wrong
pm2 logs eldercare-app

# Kill any stuck processes
pkill -f "node server.js"

# Clean restart
bash reload.sh → Option 3
```

### Issue: Port 5000 in use
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill it
sudo kill -9 <PID>

# Restart
pm2 restart eldercare-app
```

### Issue: Frontend not loading
```bash
# Rebuild frontend
cd frontend
npm run build
cd ..

# Restart backend
pm2 restart eldercare-app
```

### Issue: Database locked
```bash
# Restart clears locks
pm2 restart eldercare-app
```

### Issue: High memory/CPU usage
```bash
# Check what's consuming resources
pm2 status
top  # Press 'q' to exit

# Do a full clean restart
bash reload.sh → Option 3
```

### Issue: Nginx shows 502/503 (Bad Gateway)
This is normal during restarts! 
- The `maintenance.html` page displays automatically
- App returns to normal within 1-3 minutes
- No action needed

To manually test:
```bash
# Check if backend is running
curl http://localhost:5000/api/daily-roster

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Manual Restart Steps (If Scripts Don't Work)

```bash
# 1. Stop the app
pm2 stop eldercare-app

# 2. Check for hanging processes
ps aux | grep node

# 3. Kill any stragglers
pkill -f "node server.js"
sleep 1

# 4. Rebuild everything
cd ~/tolieting/frontend && npm run build && cd ..
cd ~/tolieting/backend && npm install && cd ..

# 5. Start fresh
pm2 start server.js --name "eldercare-app"

# 6. Check status
pm2 status
```

---

## Log Inspection

### View Live Logs
```bash
pm2 logs eldercare-app
```

### View Last 50 Lines
```bash
pm2 logs eldercare-app --lines 50 --nostream
```

### Search for Errors
```bash
pm2 logs eldercare-app --lines 100 --nostream | grep -i "error\|fatal"
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

---

## Update from GitHub

```bash
cd ~/tolieting
bash update.sh
```

This:
1. Pulls latest code
2. Rebuilds frontend
3. Restarts backend
4. Shows status

---

## Database Backup

**Before major changes, backup your database:**

```bash
cp backend/data/eldercaredb.sqlite3 backup-$(date +%Y%m%d-%H%M%S).sqlite3
```

---

## Safe Restart Sequence

Use this when things are really broken:

```bash
# Stop everything
pm2 stop all
pm2 delete all
sleep 2

# Kill any stuck processes
pkill -f node
pkill -f npm

# Clean and rebuild
cd ~/tolieting
rm -rf backend/node_modules frontend/dist
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..

# Start fresh
cd backend
pm2 start server.js --name "eldercare-app"
pm2 save

# Verify
sleep 3
curl http://localhost:5000/api/daily-roster
```

---

## Performance Tuning

### Increase PM2 Instances (for high traffic)
```bash
pm2 delete eldercare-app
pm2 start backend/server.js -i max --name "eldercare-app"
pm2 save
```

### Check Current Usage
```bash
pm2 status
pm2 monit
```

---

## Getting Help

When contacting support, include:

```bash
# Copy this output
bash health-check.sh > debug-report.txt
pm2 logs eldercare-app --lines 100 --nostream >> debug-report.txt
```

---

## Prevention Tips

1. **Restart safely**: Use `bash reload.sh` not manual kills
2. **Monitor logs**: Check `pm2 logs` periodically
3. **Backup regularly**: Monthly database backups
4. **Update code**: Pull from GitHub regularly
5. **Watch disk space**: Keep > 20% free

---

## Quick Command Reference

| Task | Command |
|------|---------|
| Check status | `pm2 status` |
| View logs | `pm2 logs eldercare-app` |
| Restart app | `pm2 restart eldercare-app` |
| Stop app | `pm2 stop eldercare-app` |
| Interactive menu | `bash reload.sh` |
| Full diagnostics | `bash health-check.sh` |
| Update from GitHub | `bash update.sh` |
| View Nginx errors | `sudo tail -f /var/log/nginx/error.log` |

---

Still having issues? Run:
```bash
bash health-check.sh
```

Then check the output carefully - it will identify the specific problem!
