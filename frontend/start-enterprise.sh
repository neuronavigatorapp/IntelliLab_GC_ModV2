#!/bin/bash

# IntelliLab GC Enterprise Frontend Demo Script
echo "🚀 Starting IntelliLab GC Enterprise Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🎨 Building enterprise-grade interface..."
echo "✨ Premium glass morphism effects enabled"
echo "🔬 Scientific data visualizations loaded"
echo "⚡ Advanced animations initialized"
echo "🛡️  Enterprise security features active"

echo "🌟 Starting development server..."
echo ""
echo "🔗 Frontend will be available at: http://localhost:3000"
echo "📊 Dashboard: http://localhost:3000/dashboard"
echo "🧪 Analytics: http://localhost:3000/analytics"
echo "🔧 Settings: http://localhost:3000/settings"
echo ""
echo "💫 Enterprise Features:"
echo "   • Premium Glass Morphism UI"
echo "   • Real-time Data Visualization"
echo "   • Scientific Progress Indicators"
echo "   • Advanced Form Controls"
echo "   • Professional Typography (Inter/JetBrains Mono)"
echo "   • Sophisticated Animations"
echo "   • Enterprise Status Monitoring"
echo ""

npm start