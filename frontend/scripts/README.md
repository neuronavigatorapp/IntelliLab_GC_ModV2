# IntelliLab GC Demo Automation

This directory contains scripts for generating automated demo GIFs of the IntelliLab GC application.

## Scripts

### `generate-demo-gif.js`
Basic demo script that simulates the user flow and creates a placeholder GIF file.

### `generate-demo-gif-advanced.js`
Advanced demo script with FFmpeg integration for actual screen recording.

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Generate basic demo GIF:**
   ```bash
   npm run demo:gif
   ```

3. **Generate advanced demo GIF (requires FFmpeg):**
   ```bash
   npm run demo:gif:advanced
   ```

## Demo Flow

The automated demo follows this sequence:

1. **Dashboard** → Click "Try Live Chromatogram Demo"
2. **Step 1** → Select Methane/Ethane mixture
3. **Step 2** → Choose default oven ramp
4. **Step 3** → Watch animated chromatogram
5. **Detection Limit** → Navigate to calculator
6. **Fill Form** → Enter example values (1000 mV, 50 mV, 10 mg/L, 1 µL)
7. **Calculate** → Click "Calculate Detection Limit"
8. **Return** → Navigate back to Dashboard

## Requirements

### Basic Demo
- Node.js
- Puppeteer (installed as dev dependency)

### Advanced Demo
- Node.js
- Puppeteer
- FFmpeg (for screen recording)

### FFmpeg Installation

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
# Using Homebrew
brew install ffmpeg
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

## Output

The demo scripts generate:
- `public/intellilab_demo.gif` - The final demo GIF (8-12 seconds, 1280×720)
- Console output showing the demo flow progress

## Customization

You can modify the demo flow by editing the `demoSteps` array in the scripts:

```javascript
const demoSteps = [
  { action: 'click', selector: 'button:has-text("Try Live Chromatogram Demo")', delay: 1000 },
  { action: 'click', selector: 'text=Methane/Ethane', delay: 500 },
  // ... more steps
];
```

## Troubleshooting

### Common Issues

1. **"Navigation timeout"** - Make sure the dev server is running on localhost:3000
2. **"Element not found"** - Check that the selectors match the current UI
3. **FFmpeg errors** - Ensure FFmpeg is properly installed and accessible from PATH

### Debug Mode

To run with debug output:
```bash
DEBUG=puppeteer:* npm run demo:gif
```

## Notes

- The basic script creates a placeholder file with instructions
- The advanced script requires proper FFmpeg setup for actual screen recording
- Demo duration is approximately 12 seconds
- Resolution is set to 1280×720 for optimal quality
- Frame rate is 10 FPS for smooth animation
