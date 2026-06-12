const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

app.use(cors());
app.use(express.json());

// Native CPU load calculation setup
let lastCpuTimes = getCpuTimes();

function getCpuTimes() {
  const cpus = os.cpus();
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
  for (const cpu of cpus) {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys += cpu.times.sys;
    idle += cpu.times.idle;
    irq += cpu.times.irq;
  }
  const total = user + nice + sys + idle + irq;
  return { idle, total };
}

function getCpuLoad() {
  const current = getCpuTimes();
  const idleDiff = current.idle - lastCpuTimes.idle;
  const totalDiff = current.total - lastCpuTimes.total;
  lastCpuTimes = current;

  if (totalDiff === 0) return 0;
  return Math.round((1 - idleDiff / totalDiff) * 100);
}

// Cache disk info to prevent spawning wmic every 3 seconds (reduces CPU overhead to ~0%)
let cachedDiskInfo = { total: 500, used: 242, percentage: 47 };
let lastDiskCheck = 0;
const DISK_CACHE_TIME = 120000; // 2 minutes

function getDiskInfo() {
  const now = Date.now();
  if (now - lastDiskCheck < DISK_CACHE_TIME) {
    return Promise.resolve(cachedDiskInfo);
  }

  return new Promise((resolve) => {
    const cmd = 'wmic logicaldisk where "DeviceID=\'C:\'" get FreeSpace,Size /format:list';
    
    exec(cmd, { timeout: 1200 }, (error, stdout) => {
      lastDiskCheck = Date.now();
      if (error || !stdout) {
        return resolve(cachedDiskInfo);
      }
      
      try {
        const lines = stdout.split('\n');
        let free = 0;
        let size = 0;
        for (const line of lines) {
          if (line.trim().startsWith('FreeSpace=')) {
            free = parseInt(line.split('=')[1].trim(), 10);
          }
          if (line.trim().startsWith('Size=')) {
            size = parseInt(line.split('=')[1].trim(), 10);
          }
        }
        
        if (size > 0) {
          const used = size - free;
          const totalGB = Math.round(size / (1024 * 1024 * 1024));
          const usedGB = Math.round(used / (1024 * 1024 * 1024));
          const percentage = Math.round((used / size) * 100);
          cachedDiskInfo = { total: totalGB, used: usedGB, percentage };
        }
      } catch (e) {}
      
      resolve(cachedDiskInfo);
    });
  });
}

// System statistics endpoint (Fully native & instant)
app.get('/api/system', async (req, res) => {
  try {
    const cpuLoad = getCpuLoad();
    
    // Memory Details (instant)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramTotal = Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100;
    const ramUsed = Math.round(usedMem / (1024 * 1024 * 1024) * 100) / 100;
    const ramPercentage = Math.round((usedMem / totalMem) * 100);

    // Disk Details (handles timeout)
    const diskInfo = await getDiskInfo();

    res.json({
      cpu: {
        load: cpuLoad,
        temp: null
      },
      ram: {
        total: ramTotal,
        used: ramUsed,
        percentage: ramPercentage
      },
      disk: {
        total: diskInfo.total,
        used: diskInfo.used,
        percentage: diskInfo.percentage
      },
      os: {
        platform: os.platform(),
        distro: os.type() === 'Windows_NT' ? 'Windows OS' : os.type(),
        release: os.release()
      }
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to retrieve system statistics' });
  }
});

// Whitelisted applications mapping
const APP_COMMANDS = {
  notepad: 'start notepad.exe',
  calculator: 'start calc.exe',
  paint: 'start mspaint.exe',
  chrome: 'start chrome.exe',
  explorer: 'start explorer.exe',
  taskmgr: 'start taskmgr.exe',
  cmd: 'start cmd.exe',
  powershell: 'start powershell.exe'
};

// Application launcher and terminal runner endpoint
app.post('/api/execute', (req, res) => {
  const { command, type } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command parameter is missing.' });
  }

  let cmdToRun = '';

  if (type === 'app') {
    const appKey = command.toLowerCase().trim();
    if (APP_COMMANDS[appKey]) {
      cmdToRun = APP_COMMANDS[appKey];
    } else {
      return res.status(400).json({ error: `Application '${command}' is not in the whitelist.` });
    }
  } else if (type === 'shell') {
    // For general shell commands, we implement safety checks.
    // Whitelist certain safe shell read-only patterns
    const safeRegex = /^(dir|ping|ipconfig|hostname|whoami|systeminfo|ver|echo)/i;
    if (safeRegex.test(command.trim())) {
      cmdToRun = command;
    } else {
      return res.status(403).json({ error: 'Command blocked. Only read-only commands (ping, dir, ipconfig, whoami, etc.) are allowed for security.' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid execution type.' });
  }

  console.log(`Executing OS Command: ${cmdToRun}`);

  exec(cmdToRun, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error}`);
      return res.status(500).json({ error: error.message, details: stderr });
    }
    res.json({ output: stdout || stderr || 'Command executed successfully.' });
  });
});

// Proxy route for Ollama chat
app.post('/api/chat', (req, res) => {
  const { model, messages, options } = req.body;
  let responseSent = false;

  const sendResponse = (statusCode, data) => {
    if (responseSent) return;
    responseSent = true;
    res.status(statusCode).json(data);
  };

  const requestData = JSON.stringify({
    model: model || 'llama3',
    messages: messages,
    stream: false,
    options: options
  });

  const urlObj = new URL(`${OLLAMA_URL}/api/chat`);
  
  const optionsHttp = {
    hostname: urlObj.hostname,
    port: urlObj.port || 80,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData)
    },
    timeout: 30000 // 30 second timeout
  };

  const proxyReq = http.request(optionsHttp, (proxyRes) => {
    let rawData = '';
    proxyRes.setEncoding('utf8');
    proxyRes.on('data', (chunk) => { rawData += chunk; });
    proxyRes.on('end', () => {
      try {
        if (proxyRes.statusCode >= 400) {
          sendResponse(proxyRes.statusCode, { error: `Ollama returned error: ${rawData}` });
        } else {
          sendResponse(200, JSON.parse(rawData));
        }
      } catch (e) {
        sendResponse(500, { error: 'Failed to parse response from Ollama', details: rawData });
      }
    });
  });

  proxyReq.on('error', (e) => {
    console.error(`Problem with request to Ollama: ${e.message}`);
    sendResponse(503, { 
      error: 'Ollama service is unreachable. Make sure Ollama is running locally on port 11434.',
      offline: true
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    sendResponse(504, { error: 'Request to Ollama timed out.' });
  });

  proxyReq.write(requestData);
  proxyReq.end();
});

// Proxy route to fetch Ollama models
app.get('/api/models', (req, res) => {
  const urlObj = new URL(`${OLLAMA_URL}/api/tags`);
  let responseSent = false;

  const sendResponse = (statusCode, data) => {
    if (responseSent) return;
    responseSent = true;
    res.status(statusCode).json(data);
  };

  const proxyReq = http.get(urlObj, (proxyRes) => {
    let rawData = '';
    proxyRes.setEncoding('utf8');
    proxyRes.on('data', (chunk) => { rawData += chunk; });
    proxyRes.on('end', () => {
      try {
        if (proxyRes.statusCode >= 400) {
          sendResponse(proxyRes.statusCode, { error: `Ollama returned error: ${rawData}` });
        } else {
          sendResponse(200, JSON.parse(rawData));
        }
      } catch (e) {
        sendResponse(500, { error: 'Failed to parse models list from Ollama' });
      }
    });
  });

  proxyReq.on('error', (e) => {
    console.error(`Problem fetching models: ${e.message}`);
    sendResponse(503, { 
      error: 'Ollama is offline or unreachable.',
      models: [],
      offline: true
    });
  });

  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`Jarvis local server running at http://localhost:${PORT}`);
});
