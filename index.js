const dgram = require("dgram");
const WebSocket = require("ws");
const EventEmitter = require("events");

// NTP epoch starts Jan 1, 1900; Unix epoch starts Jan 1, 1970 (70 years = 2208988800s)
const NTP_DELTA_MS = 2208988800000;

function readNtpTimestamp(buf, pos) {
  let intpart = 0, fractpart = 0;
  for (let i = 0; i < 4; i++) intpart = (intpart * 256) + buf[pos + i];
  for (let i = 4; i < 8; i++) fractpart = (fractpart * 256) + buf[pos + i];
  return intpart * 1000 + Math.round((fractpart * 1000) / 0x100000000) - NTP_DELTA_MS;
}

/**
 * TimeSync - Class for precise time synchronization
 * Simple and intuitive API for synchronizing time with NTP servers
 */
class TimeSync extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Synchronization state
    this.isSync = false;
    this.lastSyncTime = null;
    this.systemOffset = 0;
    this.syncDate = null;
    this.lastRtt = null;
    
    // Smooth correction
    this.targetOffset = 0;           // Target offset to reach
    this.currentOffset = 0;          // Current offset (gradually corrected)
    this.correctionInProgress = false;
    this.correctionStartTime = null; // For correction timeout
    
    // Default configuration
    this.config = {
      servers: [
        "pool.ntp.org",
        "time.google.com", 
        "time.cloudflare.com",
      ],
      timeout: 5000,
      retries: 3,
      autoSync: false,
      autoSyncInterval: 300000, // 5 minutes
      locale: undefined,        // undefined = system locale
      // New options for smooth correction
      smoothCorrection: true,        // Enable smooth correction
      maxCorrectionJump: 1000,      // Max brutal correction (1s)
      correctionRate: 0.1,          // Smooth correction rate (10%/sync)
      maxOffsetThreshold: 5000,     // Threshold to force brutal correction (5s)
      coherenceValidation: true,    // Server coherence validation
      ...options
    };
    
    // WebSocket for real-time (optional)
    this.wsServer = null;
    this.wsClients = new Set();
    
    // Auto-sync
    this.autoSyncTimer = null;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.on('sync', (data) => {
      console.log(`✅ Synchronized with ${data.server} (offset: ${data.offset}ms)`);
    });
    
    this.on('error', (error) => {
      console.log(`❌ Synchronization error: ${error.message}`);
    });
    
    // Advanced events
    this.on('coherenceWarning', (data) => {
      console.log(`⚠️  Server coherence issue: variance ${data.variance}ms`);
    });
    
    this.on('driftWarning', (data) => {
      console.log(`📈 Long elapsed time: ${(data.elapsed / 60000).toFixed(1)} minutes`);
    });
  }

  /**
   * Synchronize time with NTP server
   * @param {Object} options - Synchronization options
   * @returns {Promise<Object>} Synchronization info
   */
  async sync(options = {}) {
    const config = { ...this.config, ...options };
    const serverResults = [];
    
    // Test multiple servers for coherence validation
    const serversToTest = config.coherenceValidation !== false ? 
      config.servers.slice(0, Math.min(3, config.servers.length)) : 
      config.servers;
    
    for (const server of serversToTest) {
      try {
        const { offset: newOffset, rtt } = await this.getNtpTime(server, config.timeout);

        serverResults.push({
          server,
          offset: newOffset,
          rtt,
          ntpTime: new Date(Date.now() + newOffset),
          systemTime: Date.now()
        });
        
      } catch (error) {
        const ntpError = new Error(`[${server}] ${error.message}`);
        ntpError.server = server;
        this.emit('error', ntpError);
        continue; // Try next server
      }
    }
    
    if (serverResults.length === 0) {
      throw new Error('Unable to synchronize with any NTP server');
    }
    
    // Coherence validation between servers
    let selectedResult = serverResults[0];
    if (serverResults.length > 1) {
      const offsets = serverResults.map(r => r.offset);
      const variance = Math.max(...offsets) - Math.min(...offsets);
      
      if (variance > 100) { // Variance > 100ms is suspicious
        this.emit('coherenceWarning', {
          variance,
          servers: serverResults.map(r => ({ server: r.server, offset: r.offset }))
        });
        
        // Use median for better robustness
        offsets.sort((a, b) => a - b);
        const medianOffset = offsets[Math.floor(offsets.length / 2)];
        selectedResult = serverResults.find(r => r.offset === medianOffset) || selectedResult;
      }
    }
    
    const newOffset = selectedResult.offset;
    
    // Smooth correction management
    const isFirstSync = !this.isSync;
    const offsetDiff = Math.abs(newOffset - this.currentOffset);
    
    if (isFirstSync || !config.smoothCorrection || 
        offsetDiff <= config.maxCorrectionJump ||
        offsetDiff >= config.maxOffsetThreshold) {
      // Brutal correction
      this.systemOffset = newOffset;
      this.currentOffset = newOffset;
      this.targetOffset = newOffset;
      this.correctionInProgress = false;
      this.correctionStartTime = null; // Reset correction timer
    } else {
      // Smooth correction
      this.targetOffset = newOffset;
      this.systemOffset = newOffset; // Keep real offset for stats
      this.correctionInProgress = true;
      this.correctionStartTime = null; // Will be set in applyGradualCorrection
      this.applyGradualCorrection(config.correctionRate);
    }
    
    this.isSync = true;
    this.lastSyncTime = performance.now();
    this.syncDate = new Date();
    this.lastRtt = selectedResult.rtt;

    const result = {
      server: selectedResult.server,
      offset: this.systemOffset,
      rtt: selectedResult.rtt,
      correctedOffset: this.currentOffset,
      time: selectedResult.ntpTime,
      systemTime: new Date(selectedResult.systemTime),
      gradualCorrection: this.correctionInProgress,
      offsetDiff: isFirstSync ? 0 : offsetDiff,
      serverResults: serverResults.length > 1 ? serverResults : undefined,
      coherenceVariance: serverResults.length > 1 ?
        Math.max(...serverResults.map(r => r.offset)) - Math.min(...serverResults.map(r => r.offset)) : 0
    };
    
    this.emit('sync', result);
    
    // Start auto-sync if requested
    if (config.autoSync && !this.autoSyncTimer) {
      this.startAutoSync(config.autoSyncInterval);
    }
    
    return result;
  }

  /**
   * Queries an NTP server and returns offset + RTT using the 4-timestamp algorithm.
   * offset = ((t2 - t1) + (t3 - t4)) / 2  — compensates for network latency
   * rtt    = (t4 - t1) - (t3 - t2)
   * @private
   */
  getNtpTime(server, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket("udp4");
      const packet = Buffer.alloc(48);
      packet[0] = 0x1B; // LI=0, VN=3, Mode=3 (client)

      let done = false;
      const finish = (err, result) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { client.close(); } catch (_) {}
        err ? reject(err) : resolve(result);
      };

      const timer = setTimeout(
        () => finish(new Error(`Timeout after ${timeout}ms`)),
        timeout
      );

      client.on("error", (err) => finish(err));

      const t1 = Date.now();
      client.send(packet, 0, 48, 123, server, (err) => {
        if (err) return finish(err);

        client.once("message", (msg) => {
          const t4 = Date.now();
          if (msg.length < 48) return finish(new Error("Invalid NTP response"));

          const t2 = readNtpTimestamp(msg, 32); // server receive timestamp
          const t3 = readNtpTimestamp(msg, 40); // server transmit timestamp

          const offset = Math.round(((t2 - t1) + (t3 - t4)) / 2);
          const rtt = (t4 - t1) - (t3 - t2);

          finish(null, { offset, rtt });
        });
      });
    });
  }

  /**
   * Returns current synchronized time
   * @returns {Date} Precise time
   */
  now() {
    if (!this.isSync) {
      throw new Error('Clock not synchronized. Call sync() first.');
    }
    
    const currentPerf = performance.now();
    const elapsed = currentPerf - this.lastSyncTime;
    
    // Detect significant drift for automatic recalculation
    if (elapsed > 3600000) { // More than 1 hour since last sync
      console.log('⚠️  Long elapsed time detected, consider re-syncing');
      this.emit('driftWarning', { elapsed });
    }
    
    // Use gradually corrected offset if available
    const activeOffset = this.correctionInProgress ? this.currentOffset : this.systemOffset;

    return new Date(Date.now() + activeOffset);
  }

  /**
   * Returns time in ISO format
   * @returns {string} ISO timestamp
   */
  timestamp() {
    return this.now().toISOString();
  }

  /**
   * Returns the offset from system time
   * @returns {number} Offset in milliseconds
   */
  offset() {
    if (!this.isSync) return 0;
    // Return gradually corrected offset if available
    return this.correctionInProgress ? this.currentOffset : this.systemOffset;
  }

  /**
   * Checks if clock is synchronized
   * @returns {boolean}
   */
  isSynchronized() {
    return this.isSync;
  }

  /**
   * Returns synchronization statistics
   * @returns {Object}
   */
  stats() {
    return {
      synchronized: this.isSync,
      lastSync: this.syncDate,
      offset: this.systemOffset,
      rtt: this.lastRtt,
      correctedOffset: this.currentOffset,
      targetOffset: this.targetOffset,
      correctionInProgress: this.correctionInProgress,
      uptime: this.isSync ? performance.now() - this.lastSyncTime : 0,
      config: {
        smoothCorrection: this.config.smoothCorrection,
        maxCorrectionJump: this.config.maxCorrectionJump,
        correctionRate: this.config.correctionRate,
        maxOffsetThreshold: this.config.maxOffsetThreshold
      }
    };
  }

  /**
   * Starts automatic synchronization
   * @param {number} interval - Interval in milliseconds
   */
  startAutoSync(interval = 300000) {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }
    
    this.autoSyncTimer = setInterval(() => {
      this.sync().catch(err => {
        this.emit('error', err);
      });
    }, interval);
    
    console.log(`🔄 Auto-sync enabled (${interval / 1000}s)`);
  }

  /**
   * Stops automatic synchronization
   */
  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      console.log('🛑 Auto-sync disabled');
    }
  }
  /**
   * Starts a WebSocket server to broadcast time in real-time
   * @param {number} port - WebSocket server port
   * @returns {number} Port used
   */
  startWebSocketServer(port = 8080) {
    if (this.wsServer) {
      throw new Error('WebSocket server already started');
    }
    
    this.wsServer = new WebSocket.Server({ port });
    
    this.wsServer.on('connection', (ws) => {
      this.wsClients.add(ws);
      console.log(`🔌 WebSocket client connected (${this.wsClients.size} total)`);
      
      // Send time immediately
      if (this.isSync) {
        ws.send(JSON.stringify({
          type: 'time',
          data: {
            timestamp: this.timestamp(),
            offset: this.offset(),
            synchronized: true
          }
        }));
      }
      
      ws.on('close', () => {
        this.wsClients.delete(ws);
        console.log(`🔌 WebSocket client disconnected (${this.wsClients.size} remaining)`);
      });
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid JSON format'
          }));
        }
      });
    });
    
    // Broadcast time every second
    this.wsTimer = setInterval(() => {
      if (this.isSync && this.wsClients.size > 0) {
        this.broadcastTime();
      }
    }, 1000);
    
    console.log(`🌐 WebSocket server started on port ${port}`);
    return port;
  }

  /**
   * Stops the WebSocket server
   */
  stopWebSocketServer() {
    if (this.wsTimer) {
      clearInterval(this.wsTimer);
      this.wsTimer = null;
    }
    
    if (this.wsServer) {
      this.wsServer.close();
      this.wsClients.clear();
      this.wsServer = null;
      console.log('🌐 WebSocket server stopped');
    }
  }

  /**
   * Handles WebSocket messages
   * @private
   */
  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'getTime':
        if (this.isSync) {
          ws.send(JSON.stringify({
            type: 'time',
            data: {
              timestamp: this.timestamp(),
              offset: this.offset(),
              synchronized: true
            }
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Clock not synchronized'
          }));
        }
        break;
        
      case 'sync':
        this.sync().then(() => {
          ws.send(JSON.stringify({
            type: 'syncComplete',
            message: 'Synchronization complete'
          }));
        }).catch(error => {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        });
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown command. Use: getTime, sync'
        }));
    }
  }

  /**
   * Broadcasts time to all WebSocket clients
   * @private
   */
  broadcastTime() {
    const message = JSON.stringify({
      type: 'time',
      data: {
        timestamp: this.timestamp(),
        offset: this.offset(),
        synchronized: this.isSync
      }
    });
    
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Formats a date/time
   * @param {Date|string|number} date - Date to format
   * @param {string} format - Output format
   * @returns {string}
   */
  format(date = null, format = 'iso', locale = undefined) {
    const time = date ? new Date(date) : this.now();
    const loc = locale ?? this.config.locale;

    switch (format) {
      case 'iso':
        return time.toISOString();
      case 'locale':
        return time.toLocaleString(loc);
      case 'timestamp':
        return time.getTime().toString();
      case 'utc':
        return time.toUTCString();
      case 'date':
        return time.toLocaleDateString(loc);
      case 'time':
        return time.toLocaleTimeString(loc);
      default:
        return time.toString();
    }
  }

  /**
   * Calculates the difference between two dates
   * @param {Date|string|number} date1 
   * @param {Date|string|number} date2 
   * @returns {number} Difference in milliseconds
   */
  diff(date1, date2 = null) {
    const d1 = new Date(date1);
    const d2 = date2 ? new Date(date2) : this.now();
    return Math.abs(d2.getTime() - d1.getTime());
  }

  /**
   * Displays a message with precise time
   * @param {string} message 
   */
  log(message) {
    const time = this.isSync ? this.timestamp() : new Date().toISOString();
    console.log(`[${time}] ${message}`);
  }
  
  /**
   * Applies gradual offset correction
   * @private
   */
  applyGradualCorrection(rate = 0.1) {
    if (!this.correctionInProgress) return;
    
    const diff = this.targetOffset - this.currentOffset;
    
    // Convergence threshold to avoid infinite oscillations
    if (Math.abs(diff) < 0.5) { // Convergence within 0.5ms
      this.currentOffset = this.targetOffset;
      this.correctionInProgress = false;
      this.emit('correctionComplete', {
        finalOffset: this.currentOffset,
        targetReached: true,
        converged: true
      });
      return;
    }
    
    // Timeout verification to avoid infinite corrections
    if (!this.correctionStartTime) {
      this.correctionStartTime = performance.now();
    }
    
    const elapsed = performance.now() - this.correctionStartTime;
    if (elapsed > 30000) { // 30 second timeout
      console.log('⚠️  Correction timeout, applying final offset');
      this.currentOffset = this.targetOffset;
      this.correctionInProgress = false;
      this.correctionStartTime = null;
      this.emit('correctionComplete', {
        finalOffset: this.currentOffset,
        targetReached: true,
        timeout: true
      });
      return;
    }
    
    const correction = diff * rate;
    this.currentOffset += correction;
    
    // Adaptive interval based on correction size
    const nextInterval = Math.max(50, Math.min(200, Math.abs(diff) * 0.1));
    
    // Schedule next correction
    setTimeout(() => {
      this.applyGradualCorrection(rate);
    }, nextInterval);
  }

  /**
   * Enables or disables gradual correction
   * @param {boolean} enabled - Enable gradual correction
   * @param {Object} options - Correction options
   */
  setSmoothCorrection(enabled, options = {}) {
    this.config.smoothCorrection = enabled;
    
    if (options.maxCorrectionJump !== undefined) {
      this.config.maxCorrectionJump = options.maxCorrectionJump;
    }
    if (options.correctionRate !== undefined) {
      this.config.correctionRate = options.correctionRate;
    }
    if (options.maxOffsetThreshold !== undefined) {
      this.config.maxOffsetThreshold = options.maxOffsetThreshold;
    }
    
    console.log(`🔧 Smooth correction: ${enabled ? 'enabled' : 'disabled'}`);
    if (enabled) {
      console.log(`   - Max jump: ${this.config.maxCorrectionJump}ms`);
      console.log(`   - Rate: ${this.config.correctionRate * 100}%`);
      console.log(`   - Brutal threshold: ${this.config.maxOffsetThreshold}ms`);
    }
  }

  /**
   * Forces brutal correction (ignores gradual correction)
   */
  forceCorrection() {
    if (this.correctionInProgress) {
      this.currentOffset = this.targetOffset;
      this.correctionInProgress = false;
      this.emit('correctionComplete', {
        finalOffset: this.currentOffset,
        forced: true
      });
      console.log('⚡ Forced correction applied');
    }
  }
}

// Global instance for simple usage
const timeSync = new TimeSync();

// Simple API - direct functions
const api = {
  // Main methods
  sync: (options) => timeSync.sync(options),
  now: () => timeSync.now(),
  timestamp: () => timeSync.timestamp(),
  offset: () => timeSync.offset(),
  stats: () => timeSync.stats(),
  isSynchronized: () => timeSync.isSynchronized(),
  
  // Auto-sync
  startAutoSync: (interval) => timeSync.startAutoSync(interval),
  stopAutoSync: () => timeSync.stopAutoSync(),
  
  // Gradual correction
  setSmoothCorrection: (enabled, options) => timeSync.setSmoothCorrection(enabled, options),
  forceCorrection: () => timeSync.forceCorrection(),
  
  // WebSocket
  startWebSocketServer: (port) => timeSync.startWebSocketServer(port),
  stopWebSocketServer: () => timeSync.stopWebSocketServer(),
  
  // Utilities
  format: (date, format, locale) => timeSync.format(date, format, locale),
  diff: (date1, date2) => timeSync.diff(date1, date2),
  log: (message) => timeSync.log(message),
  
  // Events
  on: (event, callback) => timeSync.on(event, callback),
  off: (event, callback) => timeSync.off(event, callback),
  
  // Class for advanced usage
  TimeSync
};

module.exports = api;
