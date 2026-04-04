# 🧹 VIVIM Development Cleanup Guide

## Problem
The WebSocket server (y-websocket on port 1235) was not properly exiting when you stopped the development server, leaving zombie processes running.

## Solution ✅
Added forced cleanup commands that ensure all VIVIM processes are killed when the server exits.

---

## 🚀 New Commands

### **1. Development with Automatic Cleanup**
```bash
# Cross-platform (Node.js script)
bun run dev:clean

# Windows (Batch file)
dev-with-cleanup.bat
```

These start the development server and **automatically force-kill all processes** when you press Ctrl+C or close the terminal.

### **2. Manual Cleanup Commands**
```bash
# Force kill all VIVIM processes
bun run dev:cleanup

# Or use the stop command (alias for cleanup)
bun run stop

# Windows version
cleanup-dev.bat
```

### **3. Regular Development (No Auto-Cleanup)**
```bash
# Original dev command (without auto cleanup)
bun run dev
```

**Note**: The regular `bun run dev` command still uses `concurrently --kill-others`, but the WebSocket server may not respond properly to termination signals.

---

## 🔧 What's Included

### **Scripts Added:**

1. **`scripts/force-cleanup.js`**
   - Force-kills processes on ports: 3000, 5173, 5174, 1235
   - Works on Windows and Unix systems
   - Uses both PowerShell and taskkill fallbacks

2. **`scripts/dev-with-cleanup.js`**
   - Starts development server
   - Handles SIGINT/SIGTERM signals
   - Automatically runs force cleanup on exit

3. **`cleanup-dev.bat`**
   - Windows batch version
   - Simple cleanup for VIVIM ports

### **Package.json Scripts Added:**

```json
{
  "dev:clean": "node scripts/dev-with-cleanup.js",
  "dev:cleanup": "node scripts/force-cleanup.js",
  "stop": "node scripts/force-cleanup.js"
}
```

---

## 🎯 How It Works

### **Automatic Cleanup (Recommended)**
1. Run `bun run dev:clean`
2. All services start normally
3. Press Ctrl+C or close terminal
4. **Automatically force-kills** all VIVIM processes
5. Clean exit every time

### **Manual Cleanup**
- Run `bun run dev:cleanup` anytime to kill stuck processes
- Useful if you forget to use `dev:clean`
- Also available as `bun run stop` for convenience

### **Port Cleanup**
The cleanup script targets these specific ports:
- **3000**: API Server
- **5173**: PWA Frontend
- **5174**: Admin Panel
- **5175**: Alt Admin Panel (if 5174 in use)
- **1235**: WebSocket Server (y-websocket)

---

## ✅ Benefits

1. **No Zombie Processes**: WebSocket server properly exits
2. **Clean Port Availability**: No "address already in use" errors
3. **Reliable Restarts**: Can start/stop without manual cleanup
4. **Cross-Platform**: Works on Windows, Mac, and Linux
5. **Signal Handling**: Proper SIGINT/SIGTERM handling

---

## 🚨 Troubleshooting

### **Issue: "Access denied" errors**
**Solution**: Run terminal as Administrator

### **Issue: Cleanup doesn't kill all processes**
**Solution**: Manually run `taskkill //F //PID <pid>` for stuck processes

### **Issue: Processes restart immediately**
**Solution**: Ensure no other terminals or IDEs are running VIVIM

---

## 📋 Usage Examples

### **Normal Development**
```bash
# Recommended - with automatic cleanup
bun run dev:clean

# Or traditional - requires manual cleanup
bun run dev
```

### **Stop Development**
```bash
# If using dev:clean - just press Ctrl+C
# If using regular dev - run cleanup command
bun run dev:cleanup
```

### **Force Stop Stuck Processes**
```bash
# Kill all VIVIM processes immediately
bun run stop
```

---

## 🔍 Verification

To verify all processes are cleaned:

```bash
# Check ports
netstat -ano | findstr "LISTENING"

# Or use the cleanup script (it will report what it found/killed)
bun run dev:cleanup
```

**Expected**: No processes on ports 3000, 5173, 5174, 1235

---

## 🎯 Recommendation

**Use `bun run dev:clean` as your default development command.**

This ensures:
- ✅ Clean startup every time
- ✅ Clean exit every time
- ✅ No zombie processes
- ✅ No port conflicts
- ✅ Reliable development workflow

---

**Status**: ✅ Implemented and ready to use
**Next Step**: Start using `bun run dev:clean` instead of `bun run dev`
**Impact**: All VIVIM processes will properly exit when you stop the server