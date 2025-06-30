const ntpClient = require("ntp-client");
const WebSocket = require("ws");
const EventEmitter = require("events");

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
    
    // Smooth correction
    this.targetOffset = 0;           // Target offset to reach
    this.currentOffset = 0;          // Current offset (gradually corrected)
    this.correctionInProgress = false;
    
    // Default configuration
    this.config = {
      servers: [
        "pool.ntp.org",
        "time.google.com", 
        "time.cloudflare.com",
        "fr.pool.ntp.org"
      ],
      timeout: 5000,
      retries: 3,
      autoSync: false,
      autoSyncInterval: 300000, // 5 minutes
      // New options for smooth correction
      smoothCorrection: true,        // Enable smooth correction
      maxCorrectionJump: 1000,      // Max brutal correction (1s)
      correctionRate: 0.1,          // Smooth correction rate (10%/sync)
      maxOffsetThreshold: 5000,     // Threshold to force brutal correction (5s)
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
  }

  /**
   * Synchronize time with NTP server
   * @param {Object} options - Synchronization options
   * @returns {Promise<Object>} Synchronization info
   */
  async sync(options = {}) {
    const config = { ...this.config, ...options };
    
    for (const server of config.servers) {
      try {
        const ntpTime = await this.getNtpTime(server, config.timeout);
        const systemTime = Date.now();
        const newOffset = ntpTime.getTime() - systemTime;
        
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
        } else {
          // Smooth correction
          this.targetOffset = newOffset;
          this.systemOffset = newOffset; // Keep real offset for stats
          this.correctionInProgress = true;
          this.applyGradualCorrection(config.correctionRate);
        }
        
        this.isSync = true;
        this.lastSyncTime = performance.now();
        this.syncDate = new Date();
        
        const result = {
          server,
          offset: this.systemOffset,
          correctedOffset: this.currentOffset,
          time: ntpTime,
          systemTime: new Date(systemTime),
          gradualCorrection: this.correctionInProgress,
          offsetDiff: isFirstSync ? 0 : offsetDiff
        };
        
        this.emit('sync', result);
        
        // Start auto-sync if requested
        if (config.autoSync && !this.autoSyncTimer) {
          this.startAutoSync(config.autoSyncInterval);
        }
        
        return result;
        
      } catch (error) {
        this.emit('error', { server, error });
        continue; // Try next server
      }
    }
    
    throw new Error('Unable to synchronize with any NTP server');
  }

  /**
   * Gets NTP time from a server
   * @private
   */
  getNtpTime(server, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms`));
      }, timeout);
      
      ntpClient.getNetworkTime(server, 123, (err, date) => {
        clearTimeout(timer);
        if (err) {
          reject(new Error(`NTP error: ${err.message}`));
        } else {
          resolve(date);
        }
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
    
    const elapsed = performance.now() - this.lastSyncTime;
    // Use gradually corrected offset if available
    const activeOffset = this.correctionInProgress ? this.currentOffset : this.systemOffset;
    return new Date(this.syncDate.getTime() + elapsed + activeOffset);
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
  format(date = null, format = 'iso') {
    const time = date ? new Date(date) : this.now();
    
    switch (format) {
      case 'iso':
        return time.toISOString();
      case 'locale':
        return time.toLocaleString('en-US');
      case 'timestamp':
        return time.getTime().toString();
      case 'utc':
        return time.toUTCString();
      case 'date':
        return time.toLocaleDateString('en-US');
      case 'time':
        return time.toLocaleTimeString('en-US');
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
    const correction = diff * rate;
    
    // If correction is very small, apply directly
    if (Math.abs(diff) < 1) {
      this.currentOffset = this.targetOffset;
      this.correctionInProgress = false;
      this.emit('correctionComplete', {
        finalOffset: this.currentOffset,
        targetReached: true
      });
      return;
    }
    
    this.currentOffset += correction;
    
    // Schedule next correction
    setTimeout(() => {
      this.applyGradualCorrection(rate);
    }, 100); // Correction every 100ms
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
  format: (date, format) => timeSync.format(date, format),
  diff: (date1, date2) => timeSync.diff(date1, date2),
  log: (message) => timeSync.log(message),
  
  // Events
  on: (event, callback) => timeSync.on(event, callback),
  off: (event, callback) => timeSync.off(event, callback),
  
  // Class for advanced usage
  TimeSync
};

module.exports = api;
