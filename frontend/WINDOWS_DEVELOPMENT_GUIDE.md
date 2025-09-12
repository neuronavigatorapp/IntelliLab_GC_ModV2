# 🚨 WINDOWS-COMPATIBLE DEVELOPMENT GUIDE

## **NO UNIX COMMANDS ALLOWED ON WINDOWS!**

### **❌ NEVER USE THESE ON WINDOWS:**
- `&&` (Unix command chaining)
- `rm -rf` (Unix file removal)
- `ls` (Unix directory listing)
- `grep` (Unix text search)
- `cat` (Unix file viewing)

### **✅ ALWAYS USE THESE ON WINDOWS:**

#### **File Operations:**
```powershell
# Remove files/directories
Remove-Item filename -Force
Remove-Item directory -Recurse -Force

# List files
Get-ChildItem
Get-ChildItem -Recurse

# View file contents
Get-Content filename
```

#### **Process Management:**
```powershell
# Stop processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Kill specific processes
taskkill /f /im node.exe
taskkill /f /im npm.exe
```

#### **Navigation:**
```powershell
# Change directory
Set-Location "C:\path\to\directory"
cd "C:\path\to\directory"

# Get current location
Get-Location
pwd
```

### **🚀 QUICK START COMMANDS:**

#### **1. Emergency Cleanup:**
```powershell
# Run the nuclear cleanup script
.\reset.ps1
```

#### **2. Manual Cleanup:**
```powershell
# Stop processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Navigate to frontend
Set-Location "C:\IntelliLab_GC_ModV2\frontend"

# Clean install
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
npm install
npm start
```

#### **3. Development Workflow:**
```powershell
# Start development
npm start

# Build for production
npm run build

# Install new dependencies
npm install package-name
```

### **🔧 TROUBLESHOOTING:**

#### **If npm start fails:**
1. Run `.\reset.ps1`
2. Check for port conflicts: `netstat -ano | findstr :3000`
3. Kill conflicting processes: `taskkill /f /pid <PID>`

#### **If dependencies are corrupted:**
```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm cache clean --force
npm install
```

#### **If TypeScript errors occur:**
```powershell
npm install --save-dev @types/react @types/react-dom
```

### **📁 PROJECT STRUCTURE:**
```
frontend/
├── src/
│   ├── App.tsx          # Main application component
│   └── index.tsx        # Application entry point
├── public/
│   └── index.html       # HTML template
├── package.json         # Dependencies and scripts
├── reset.ps1           # Emergency cleanup script
├── start_clean.bat     # Windows batch file
└── WINDOWS_DEVELOPMENT_GUIDE.md
```

### **🎯 ADDING FEATURES SAFELY:**

1. **Start with minimal app** ✅ (DONE)
2. **Add ONE component at a time**
3. **Test after each addition**
4. **If something breaks, remove it immediately**
5. **Use Windows PowerShell commands only**

### **🚨 EMERGENCY CONTACTS:**
- **Nuclear Reset:** `.\reset.ps1`
- **Manual Cleanup:** See commands above
- **Process Kill:** `taskkill /f /im node.exe`

### **✅ SUCCESS INDICATORS:**
- ✅ Application loads at http://localhost:3000
- ✅ No infinite loops or crashes
- ✅ No Unix command errors
- ✅ Clean console output
- ✅ Ready for feature development

---

**Remember: Windows PowerShell is your friend! No Unix commands on Windows!** 🚀

