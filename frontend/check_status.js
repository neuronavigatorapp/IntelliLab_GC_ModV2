#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 IntelliLab GC - Status Check');
console.log('================================\n');

// Critical files to check
const criticalFiles = [
  'package.json',
  'src/App.tsx',
  'src/store/globalDataStore.ts',
  'src/store/index.ts',
  'src/services/apiService.ts',
  'src/theme/theme.ts',
  'src/components/Dashboard/MainDashboard.tsx',
  'src/components/Layout/ProfessionalLayout.tsx',
  'src/components/Logo/IntelliLabLogo.tsx',
  'src/components/Shell/BrandingProvider.tsx',
  'public/index.html',
  'public/manifest.json',
  'tsconfig.json'
];

// Critical components to check
const criticalComponents = [
  'src/components/Instruments/InstrumentManager.tsx',
  'src/components/Methods/MethodManager.tsx',
  'src/components/Tools/DetectionLimitCalculator/DetectionLimitCalculator.tsx',
  'src/components/Tools/OvenRampVisualizer/OvenRampVisualizer.tsx',
  'src/components/Tools/InletSimulator/InletSimulator.tsx',
  'src/components/Demo/ChromatogramSimulator.tsx',
  'src/components/Sandbox/GCSandbox.tsx',
  'src/pages/Reports.tsx',
  'src/pages/QCCompliance.tsx',
  'src/pages/Analytics.tsx',
  'src/components/Settings/Settings.tsx'
];

let allGood = true;

console.log('📁 Checking critical files...');
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allGood = false;
  }
});

console.log('\n🧩 Checking critical components...');
criticalComponents.forEach(component => {
  const componentPath = path.join(__dirname, component);
  if (fs.existsSync(componentPath)) {
    console.log(`✅ ${component}`);
  } else {
    console.log(`❌ ${component} - MISSING`);
    allGood = false;
  }
});

// Check package.json for critical dependencies
console.log('\n📦 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const criticalDeps = ['react', 'react-dom', '@mui/material', 'react-router-dom', 'redux'];
  
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]} (dev)`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allGood = false;
    }
  });
} catch (error) {
  console.log(`❌ package.json - ERROR: ${error.message}`);
  allGood = false;
}

// Check for node_modules
console.log('\n📂 Checking dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules directory exists');
} else {
  console.log('❌ node_modules directory missing - run "npm install"');
  allGood = false;
}

console.log('\n🎯 Summary:');
if (allGood) {
  console.log('✅ All critical files and dependencies are present!');
  console.log('🚀 The application should start successfully.');
  console.log('\nTo start the demo:');
  console.log('  npm start');
  console.log('  or');
  console.log('  start_demo.bat (Windows)');
} else {
  console.log('❌ Some critical files or dependencies are missing.');
  console.log('🔧 Please check the missing items above and fix them.');
}

console.log('\n📋 Next steps:');
console.log('1. Run "npm install" if node_modules is missing');
console.log('2. Run "npm start" to start the development server');
console.log('3. Open http://localhost:3000 in your browser');
console.log('4. Check the DEMO_README.md for detailed instructions');
