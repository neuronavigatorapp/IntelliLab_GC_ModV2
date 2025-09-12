# IntelliLab GC - Troubleshooting Guide

## 🚨 Frontend Startup Issues

### Problem: Frontend won't start with craco

**Symptoms:**
- Deprecation warnings about webpack dev server
- Frontend hangs during startup
- Error messages about middleware configuration

**Solutions:**

#### Option 1: Use Basic React Scripts (Recommended)
1. **Backup current package.json:**
   ```bash
   cd frontend
   copy package.json package.json.backup
   ```

2. **Replace with simplified package.json:**
   ```bash
   copy package_simple.json package.json
   ```

3. **Reinstall dependencies:**
   ```bash
   npm install
   ```

4. **Start with basic scripts:**
   ```bash
   npm start
   ```

#### Option 2: Fix Craco Configuration
1. **Update craco.config.js:**
   ```javascript
   // Replace the devServer section with:
   devServer: {
     setupMiddlewares: (middlewares, devServer) => {
       return middlewares;
     },
     allowedHosts: 'all',
     hot: true,
     liveReload: true,
   },
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Reinstall dependencies:**
   ```bash
   npm install
   ```

#### Option 3: Manual Startup
1. **Start backend first:**
   ```bash
   cd backend
   python main.py
   ```

2. **In new terminal, start frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 🔧 Common Issues

### Issue 1: Missing Dependencies
**Error:** `Module not found: Can't resolve 'react-beautiful-dnd'`

**Solution:**
```bash
cd frontend
npm install react-beautiful-dnd
```

### Issue 2: TypeScript Errors
**Error:** TypeScript compilation errors

**Solution:**
```bash
cd frontend
npm run type-check
```

### Issue 3: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue 4: Backend Connection Issues
**Error:** `ERR_CONNECTION_REFUSED`

**Solution:**
1. Make sure backend is running on port 8000
2. Check if backend started successfully
3. Try accessing http://localhost:8000/api/v1/health

## 🚀 Quick Fix Commands

### Reset Everything
```bash
# Stop all processes
taskkill /F /IM node.exe
taskkill /F /IM python.exe

# Clear npm cache
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Start fresh
cd ..
start_basic.bat
```

### Use Basic Mode
```bash
# Copy simplified package.json
cd frontend
copy package_simple.json package.json
npm install
npm start
```

## 📱 Mobile Testing

### Test on Mobile Device
1. **Find your computer's IP address:**
   ```bash
   ipconfig
   ```

2. **Start with host binding:**
   ```bash
   cd frontend
   set HOST=0.0.0.0
   npm start
   ```

3. **Access on mobile:**
   - Open browser on mobile device
   - Go to: `http://YOUR_IP_ADDRESS:3000`

## 🔍 Debug Information

### Check Backend Status
```bash
curl http://localhost:8000/api/v1/health
```

### Check Frontend Build
```bash
cd frontend
npm run build
```

### Check Dependencies
```bash
cd frontend
npm list --depth=0
```

## 📞 Support

If issues persist:

1. **Check the console output** for specific error messages
2. **Try the basic startup script:** `start_basic.bat`
3. **Use simplified package.json** to avoid craco issues
4. **Check if backend is running** on port 8000
5. **Clear browser cache** and try again

## 🎯 Quick Start (Simplified)

1. **Run basic startup:**
   ```bash
   start_basic.bat
   ```

2. **If that fails, manual start:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python main.py
   
   # Terminal 2 - Frontend
   cd frontend
   copy package_simple.json package.json
   npm install
   npm start
   ```

3. **Access the application:**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000

---

**The application is designed to work with basic React scripts. The craco configuration is optional and may cause issues on some systems.**
