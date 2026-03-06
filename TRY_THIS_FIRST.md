# 🎯 TRY THIS FIRST - Simple Password Reset

## ⚡ Quick Solution (2 minutes)

Since your database was working before, we just need to reset the password. Here's the easiest way:

### **Step 1: Open pgAdmin**

1. Press `Win + R`, type `pgAdmin4`, and press Enter
2. Or search for "pgAdmin" in Windows Start menu

### **Step 2: Connect to Your Server**

1. In pgAdmin, you should see your PostgreSQL server listed
2. Double-click to connect (may ask for password - try common ones: `postgres`, `password`, `root`, or leave empty)

### **Step 3: Find and Reset the openscroll User**

1. Expand your server → Databases → `openscroll`
2. Go to **Login/Group Roles** (under the server)
3. Find `openscroll` user
4. **Right-click → Properties → Definition**
5. Change **Password** to: `openscroll_dev_password`
6. Click **Save**

### **Step 4: Test the Connection**

```bash
cd "C:\0-BlackBoxProject-0\vivim-app-og\vivim-app\server"
bun run test-db-connection.js
```

### **Step 5: Run Development**

```bash
cd "C:\0-BlackBoxProject-0\vivim-app-og\vivim-app"
bun run dev
```

---

## 🔑 If pgAdmin Password Doesn't Work

### **Option A: Reset postgres password via pg_hba.conf**

1. **Stop PostgreSQL Service**:
   - Press `Win + R`, type `services.msc`, find "postgresql-x64-18", right-click → Stop

2. **Edit pg_hba.conf**:
   - Open: `C:/Program Files/PostgreSQL/18/data/pg_hba.conf`
   - Find the first line that says: `local all all scram-sha-256`
   - Change it to: `local all all trust`

3. **Start PostgreSQL Service** (same services.msc window)

4. **Reset your postgres password**:
   ```bash
   psql -U postgres -h localhost
   ALTER USER postgres WITH PASSWORD 'your_new_password';
   \q
   ```

5. **Restore pg_hba.conf** (change `trust` back to `scram-sha-256`)

6. **Restart PostgreSQL Service**

### **Option B: Use the Automated Script**

```bash
cd "C:\0-BlackBoxProject-0\vivim-app-og\vivim-app"
reset-password.bat
```

This tries common passwords and resets the openscroll user.

---

## ✅ You'll Know It Works When

- `bun run test-db-connection.js` shows: `✅ Connected successfully!`
- `bun run dev` starts without database errors
- You see the big "VIVIM SERVER STARTED" message

---

## 🚨 Important Reminders

- **Your data is safe** - this is just a password reset
- **No rebuild needed** - database and migrations are intact
- **Fast process** - should take 2-10 minutes
- **pgAdmin is your friend** - easiest way to manage PostgreSQL on Windows

---

**Which method would you like to try first?**

1. **pgAdmin** (recommended - easiest)
2. **pg_hba.conf trust mode** (if pgAdmin doesn't work)
3. **Automated script** (tries common passwords)

Let me know if you need help with any of these steps!