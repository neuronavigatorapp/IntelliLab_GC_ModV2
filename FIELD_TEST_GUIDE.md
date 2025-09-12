# IntelliLab GC - Field Testing Guide

## �� Quick Start

1. **Try the basic startup script first:**
   ```bash
   start_basic.bat
   ```

2. **If that doesn't work, use manual startup:**
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

3. **Open your browser** to `http://localhost:3000`

## 🛠️ Core Tools Available

### 1. Detection Limit Calculator
- **Purpose**: Calculate detection limits for your GC method
- **Use Case**: Optimize method sensitivity for trace analysis
- **Access**: Dashboard → Detection Limit Calculator

### 2. Oven Ramp Visualizer  
- **Purpose**: Design temperature programs for optimal separation
- **Use Case**: Create efficient temperature ramps for complex samples
- **Access**: Dashboard → Oven Ramp Visualizer

### 3. Inlet Simulator
- **Purpose**: Simulate inlet performance and transfer efficiency
- **Use Case**: Troubleshoot inlet issues and optimize conditions
- **Access**: Dashboard → Inlet Simulator

### 4. Instrument Management
- **Purpose**: Track your GC instruments and maintenance
- **Use Case**: Monitor instrument health and maintenance schedules
- **Access**: Dashboard → Instrument Management

## 📱 Mobile-Friendly Design

- **Touch-optimized**: Large buttons and clear navigation
- **ADHD-friendly**: Simple, focused interface
- **Field-ready**: Works on tablets and phones
- **Offline-capable**: PWA features for field use

## 🎯 Recommended Workflow

1. **Start with Detection Limit Calculator** to optimize your GC method sensitivity
2. **Use Oven Ramp Visualizer** to design efficient temperature programs  
3. **Run Inlet Simulator** to troubleshoot any inlet issues
4. **Track instruments** in the management section

## 💡 Tips for Field Use

- **Large buttons** make it easy to use with gloves
- **Clear navigation** helps you find tools quickly
- **Sample data** is included for immediate testing
- **No complex setup** required - just run and use

## 🔧 Troubleshooting

### If the frontend won't start:

#### Option 1: Use Basic React Scripts (Recommended)
```bash
cd frontend
copy package_simple.json package.json
npm install
npm start
```

#### Option 2: Clear Cache and Reinstall
```bash
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm start
```

#### Option 3: Check for Port Conflicts
```bash
# Kill any processes on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### If the backend won't start:
1. Make sure Python 3.8+ is installed
2. Check that port 8000 is available
3. Try running `python main.py` directly in the backend folder

### If tools don't work:
- The app includes sample data for testing
- All calculations work offline
- No internet connection required for core features

## 📊 What's Working

✅ **Detection Limit Calculator** - Full ASTM-compliant calculations  
✅ **Oven Ramp Visualizer** - Multi-step temperature programming  
✅ **Inlet Simulator** - Real-world performance simulation  
✅ **Instrument Management** - Complete instrument tracking  
✅ **Mobile Interface** - Touch-optimized design  
✅ **Offline Capability** - PWA features  

## 🎯 Field-Ready Features

- **No complex setup** - Just run and use
- **Sample data included** - Test immediately
- **Large, clear interface** - Easy to use in the field
- **Core calculations** - All essential GC tools
- **Mobile optimized** - Works on tablets and phones

## 🚀 Ready for Field Testing!

The application is designed to be immediately usable for field testing. All core GC calculation tools are implemented and ready to use. The interface is optimized for field conditions with large buttons, clear navigation, and mobile-friendly design.

**Start testing now by running `start_basic.bat`!**

## 🔍 Quick Debug

If you encounter issues:

1. **Check the console** for specific error messages
2. **Try the basic startup script** - `start_basic.bat`
3. **Use simplified package.json** to avoid craco issues
4. **Check if backend is running** on port 8000
5. **Clear browser cache** and try again

**The application works best with basic React scripts. The craco configuration is optional and may cause issues on some systems.**
