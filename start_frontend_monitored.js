#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const logFile = path.join(__dirname, 'frontend_debug.log');

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logEntry.trim());
    fs.appendFileSync(logFile, logEntry);
}

function startFrontendWithMonitoring() {
    log('Starting frontend with enhanced monitoring');
    
    // Clear previous log
    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }
    
    const frontendProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'frontend'),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
    });
    
    let startTime = Date.now();
    let hasStarted = false;
    
    frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        log(`STDOUT: ${output.trim()}`);
        
        if (output.includes('Compiled successfully') && !hasStarted) {
            hasStarted = true;
            log('Frontend compilation successful - server should be ready');
        }
        
        if (output.includes('webpack compiled successfully')) {
            log('Webpack compilation completed');
        }
        
        if (output.includes('ERROR')) {
            log(`Compilation error detected: ${output}`, 'ERROR');
        }
    });
    
    frontendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        log(`STDERR: ${error.trim()}`, 'ERROR');
    });
    
    frontendProcess.on('error', (error) => {
        log(`Process error: ${error.message}`, 'ERROR');
    });
    
    frontendProcess.on('exit', (code, signal) => {
        const elapsed = Date.now() - startTime;
        log(`Process exited after ${elapsed}ms with code: ${code}, signal: ${signal}`, 'ERROR');
        
        if (code !== 0) {
            log('Restarting frontend in 5 seconds...', 'WARNING');
            setTimeout(() => startFrontendWithMonitoring(), 5000);
        }
    });
    
    frontendProcess.on('close', (code) => {
        const elapsed = Date.now() - startTime;
        log(`Process closed after ${elapsed}ms with code: ${code}`, 'WARNING');
    });
    
    // Monitor process health every 10 seconds
    const healthCheck = setInterval(() => {
        if (frontendProcess.killed) {
            log('Process detected as killed', 'ERROR');
            clearInterval(healthCheck);
            return;
        }
        
        const elapsed = Date.now() - startTime;
        log(`Health check: Process alive, elapsed: ${elapsed}ms, PID: ${frontendProcess.pid}`);
        
        // Test if port 3000 is responding
        const net = require('net');
        const client = new net.Socket();
        
        client.setTimeout(2000);
        
        client.on('connect', () => {
            log('Port 3000 connection test: SUCCESS');
            client.destroy();
        });
        
        client.on('timeout', () => {
            log('Port 3000 connection test: TIMEOUT', 'WARNING');
            client.destroy();
        });
        
        client.on('error', (err) => {
            log(`Port 3000 connection test: ERROR - ${err.message}`, 'ERROR');
        });
        
        client.connect(3000, '127.0.0.1');
        
    }, 10000);
    
    // Kill handler
    process.on('SIGINT', () => {
        log('Received SIGINT, cleaning up...');
        clearInterval(healthCheck);
        frontendProcess.kill('SIGTERM');
        process.exit(0);
    });
    
    log(`Frontend process started with PID: ${frontendProcess.pid}`);
    return frontendProcess;
}

if (require.main === module) {
    startFrontendWithMonitoring();
}