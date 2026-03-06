# 🔧 VIVIM Development Environment Fix Guide

## 📋 **Problem Summary**

Your `bun run dev` command is failing due to **database authentication issues**. Here's what I found:

### **Issues Identified:**

1. ❌ **PostgreSQL Database Setup Required**
   - Database `openscroll` doesn't exist
   - User `openscroll` doesn't exist
   - Password authentication is failing

2. ⚠️ **Redis Not Running (Optional)**
   - Redis is configured but not running
   - System falls back to in-memory cache (works fine for development)

3. ⚠️ **Port Conflicts**
   - Previous dev sessions left processes running
   - Need to clean up before starting fresh

4. ⚠️ **Network Node Issues**
   - Network node initialization has a bug
   - Server can start but network features may be limited

---

## 🚀 **Quick Fix Steps**

### **Step 1: Set Up PostgreSQL Database**

You need to create the database and user with the correct credentials. Choose one method:

#### **Option A: Manual Setup (Recommended if you have postgres password)**

```bash
# Run this SQL script as the postgres superuser
psql -U postgres -h localhost -f setup-database.sql
```

If prompted for a password, enter your postgres superuser password.

#### **Option B: Windows Batch Script**

```bash
# Run the automated setup script
fix-dev-setup.bat
```

#### **Option C: Manual SQL Commands**

If you can access PostgreSQL directly, run these commands:

```sql
-- Create the openscroll user
CREATE USER openscroll WITH PASSWORD 'openscroll_dev_password';

-- Create the openscroll database
CREATE DATABASE openscroll OWNER openscroll;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE openscroll TO openscroll;

-- Connect to openscroll and grant schema privileges
\c openscroll
GRANT ALL ON SCHEMA public TO openscroll;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO openscroll;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO openscroll;
```

### **Step 2: Run Prisma Migrations**

Once the database is set up:

```bash
cd server
bun run db:generate
bun run db:migrate
```

### **Step 3: Clean Up Running Processes**

```bash
# Kill any existing processes on the ports
# (The system will automatically handle this, but you can manually clean up if needed)

# Kill processes by PID (if needed)
taskkill /PID <process_id> /F
```

### **Step 4: Start Redis (Optional)**

Redis is optional for development. The system will work with in-memory fallback.

```bash
# Start Redis with Docker (recommended)
docker run -d -p 6379:6379 --name vivim-redis redis:latest

# Or install Redis locally (see REDIS_SETUP.md)
```

### **Step 5: Start Development Server**

```bash
# From the project root
bun run dev
```

---

## 🎯 **Expected Successful Output**

When everything works correctly, you should see:

```
[PWA]   VITE v7.3.1  ready in ~5s
[PWA]   ➜  Local:   http://localhost:5173/
[SRV]   INFO: Prisma client initialized...
[SRV]   INFO: Using in-memory cache fallback (if Redis not running)
[ADM]   VITE v6.4.1  ready in ~1s
[ADM]   ➜  Local:   http://localhost:5174/
[WS]    running at '0.0.0.0' on port 1235

╔══════════════════════════════════════════════════════════════════════╗
║ 🚀 VIVIM SERVER STARTED                                                ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  🚀 ENGINE STATUS:     OPERATIONAL                                    ║
║  🎯 CAPABILITIES:      AI Content Capture & Knowledge Vault           ║
║  🔐 SECURITY LEVEL:    ENHANCED (CORS, Rate Limiting)              ║
║                                                                        ║
║  🌐 NETWORK ACCESS:    http://192.168.0.XXX:3000/api/v1             ║
║  🏠 LOCAL ACCESS:      http://localhost:3000                          ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 🔍 **Troubleshooting**

### **Issue: "psql: password authentication failed"**

**Solution:**
1. Find your postgres superuser password
2. Try common passwords: `postgres`, `password`, `root`, or check system settings
3. Or modify PostgreSQL auth to trust mode temporarily (not recommended for production)

### **Issue: "port already in use"**

**Solution:**
```bash
# Find process using the port
netstat -ano | findstr :<port>

# Kill the process
taskkill /PID <process_id> /F
```

### **Issue: "Network node initialization error"**

**Solution:**
This is a known issue. The server will still work, but P2P features may be limited. You can ignore this for now or fix the network node initialization code.

### **Issue: "Redis connection failed"**

**Solution:**
This is expected if Redis isn't running. The system works fine with in-memory fallback. Install Redis only if you need production features.

---

## 📦 **Services Overview**

| Service | Port | URL | Status |
|----------|------|-----|---------|
| PWA | 5173 | http://localhost:5173 | ✅ Main Frontend |
| Admin Panel | 5174 | http://localhost:5174 | ✅ Admin Dashboard |
| API Server | 3000 | http://localhost:3000 | ✅ Backend API |
| Network WS | 1235 | ws://localhost:1235 | ✅ P2P/WebSocket |
| PostgreSQL | 5432 | localhost:5432 | ✅ Database |
| Redis | 6379 | localhost:6379 | ⚠️ Optional |

---

## ✅ **Success Criteria**

You'll know everything is working when:

1. ✅ `bun run dev` starts without authentication errors
2. ✅ PWA loads at http://localhost:5173
3. ✅ Admin Panel loads at http://localhost:5174
4. ✅ Server shows "VIVIM SERVER STARTED" message
5. ✅ No database authentication errors in logs

---

## 🚨 **Critical Points**

- **Database Setup is REQUIRED** - The server won't work without proper database credentials
- **Redis is OPTIONAL** - System works with in-memory fallback
- **Network errors can be IGNORED** - Server works fine, just P2P features limited
- **File watching warnings are HARMLESS** - Don't affect functionality

---

## 📚 **Next Steps**

Once the database is set up:

1. **Test the PWA**: http://localhost:5173
2. **Test the Admin Panel**: http://localhost:5174
3. **Test API endpoints**: http://localhost:3000/api-docs
4. **Start development**: `bun run dev`

---

## 💡 **Pro Tips**

- Run `bun run verify-system.ts` to check system status
- Check `REDIS_SETUP.md` for Redis installation
- Database credentials are in `server/.env`
- All services can be started individually with `bun run dev:<service>`

---

**Status**: 🔄 **Ready to Fix**
**Next Action**: Set up PostgreSQL database with the provided SQL script
**Expected Time**: 5-10 minutes to complete setup