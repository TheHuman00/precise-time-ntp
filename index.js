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
   * Obtient l'heure NTP d'un serveur
   * @private
   */
  getNtpTime(server, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout après ${timeout}ms`));
      }, timeout);
      
      ntpClient.getNetworkTime(server, 123, (err, date) => {
        clearTimeout(timer);
        if (err) {
          reject(new Error(`Erreur NTP: ${err.message}`));
        } else {
          resolve(date);
        }
      });
    });
  }

  /**
   * Retourne l'heure actuelle synchronisée
   * @returns {Date} Heure précise
   */
  now() {
    if (!this.isSync) {
      throw new Error('Horloge non synchronisée. Appelez sync() d\'abord.');
    }
    
    const elapsed = performance.now() - this.lastSyncTime;
    // Utiliser l'offset corrigé graduellement si disponible
    const activeOffset = this.correctionInProgress ? this.currentOffset : this.systemOffset;
    return new Date(this.syncDate.getTime() + elapsed + activeOffset);
  }

  /**
   * Retourne l'heure au format ISO
   * @returns {string} Timestamp ISO
   */
  timestamp() {
    return this.now().toISOString();
  }

  /**
   * Retourne le décalage par rapport à l'heure système
   * @returns {number} Décalage en millisecondes
   */
  offset() {
    if (!this.isSync) return 0;
    // Retourner l'offset corrigé graduellement si disponible
    return this.correctionInProgress ? this.currentOffset : this.systemOffset;
  }

  /**
   * Vérifie si l'horloge est synchronisée
   * @returns {boolean}
   */
  isSynchronized() {
    return this.isSync;
  }

  /**
   * Retourne des statistiques de synchronisation
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
   * Démarre la synchronisation automatique
   * @param {number} interval - Intervalle en millisecondes
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
    
    console.log(`🔄 Auto-sync activé (${interval / 1000}s)`);
  }

  /**
   * Arrête la synchronisation automatique
   */
  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      console.log('🛑 Auto-sync désactivé');
    }
  }
  /**
   * Démarre un serveur WebSocket pour diffuser l'heure en temps réel
   * @param {number} port - Port du serveur WebSocket
   * @returns {number} Port utilisé
   */
  startWebSocketServer(port = 8080) {
    if (this.wsServer) {
      throw new Error('Serveur WebSocket déjà démarré');
    }
    
    this.wsServer = new WebSocket.Server({ port });
    
    this.wsServer.on('connection', (ws) => {
      this.wsClients.add(ws);
      console.log(`🔌 Client WebSocket connecté (${this.wsClients.size} total)`);
      
      // Envoyer l'heure immédiatement
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
        console.log(`🔌 Client WebSocket déconnecté (${this.wsClients.size} restant)`);
      });
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Format JSON invalide'
          }));
        }
      });
    });
    
    // Diffuser l'heure toutes les secondes
    this.wsTimer = setInterval(() => {
      if (this.isSync && this.wsClients.size > 0) {
        this.broadcastTime();
      }
    }, 1000);
    
    console.log(`🌐 Serveur WebSocket démarré sur le port ${port}`);
    return port;
  }

  /**
   * Arrête le serveur WebSocket
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
      console.log('🌐 Serveur WebSocket arrêté');
    }
  }

  /**
   * Gère les messages WebSocket
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
            message: 'Horloge non synchronisée'
          }));
        }
        break;
        
      case 'sync':
        this.sync().then(() => {
          ws.send(JSON.stringify({
            type: 'syncComplete',
            message: 'Synchronisation terminée'
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
          message: 'Commande inconnue. Utilisez: getTime, sync'
        }));
    }
  }

  /**
   * Diffuse l'heure à tous les clients WebSocket
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
   * Formate une date/heure
   * @param {Date|string|number} date - Date à formater
   * @param {string} format - Format de sortie
   * @returns {string}
   */
  format(date = null, format = 'iso') {
    const time = date ? new Date(date) : this.now();
    
    switch (format) {
      case 'iso':
        return time.toISOString();
      case 'locale':
        return time.toLocaleString('fr-FR');
      case 'timestamp':
        return time.getTime().toString();
      case 'utc':
        return time.toUTCString();
      case 'date':
        return time.toLocaleDateString('fr-FR');
      case 'time':
        return time.toLocaleTimeString('fr-FR');
      default:
        return time.toString();
    }
  }

  /**
   * Calcule la différence entre deux dates
   * @param {Date|string|number} date1 
   * @param {Date|string|number} date2 
   * @returns {number} Différence en millisecondes
   */
  diff(date1, date2 = null) {
    const d1 = new Date(date1);
    const d2 = date2 ? new Date(date2) : this.now();
    return Math.abs(d2.getTime() - d1.getTime());
  }

  /**
   * Affiche un message avec l'heure précise
   * @param {string} message 
   */
  log(message) {
    const time = this.isSync ? this.timestamp() : new Date().toISOString();
    console.log(`[${time}] ${message}`);
  }
  
  /**
   * Applique une correction graduelle de l'offset
   * @private
   */
  applyGradualCorrection(rate = 0.1) {
    if (!this.correctionInProgress) return;
    
    const diff = this.targetOffset - this.currentOffset;
    const correction = diff * rate;
    
    // Si la correction est très petite, appliquer directement
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
    
    // Programmer la prochaine correction
    setTimeout(() => {
      this.applyGradualCorrection(rate);
    }, 100); // Correction toutes les 100ms
  }

  /**
   * Active ou désactive la correction graduelle
   * @param {boolean} enabled - Activer la correction graduelle
   * @param {Object} options - Options de correction
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
    
    console.log(`🔧 Correction graduelle: ${enabled ? 'activée' : 'désactivée'}`);
    if (enabled) {
      console.log(`   - Saut max: ${this.config.maxCorrectionJump}ms`);
      console.log(`   - Taux: ${this.config.correctionRate * 100}%`);
      console.log(`   - Seuil brutal: ${this.config.maxOffsetThreshold}ms`);
    }
  }

  /**
   * Force une correction brutale (ignore la correction graduelle)
   */
  forceCorrection() {
    if (this.correctionInProgress) {
      this.currentOffset = this.targetOffset;
      this.correctionInProgress = false;
      this.emit('correctionComplete', {
        finalOffset: this.currentOffset,
        forced: true
      });
      console.log('⚡ Correction forcée appliquée');
    }
  }
}

// Instance globale pour utilisation simple
const timeSync = new TimeSync();

// API simple - fonctions directes
const api = {
  // Méthodes principales
  sync: (options) => timeSync.sync(options),
  now: () => timeSync.now(),
  timestamp: () => timeSync.timestamp(),
  offset: () => timeSync.offset(),
  stats: () => timeSync.stats(),
  isSynchronized: () => timeSync.isSynchronized(),
  
  // Auto-sync
  startAutoSync: (interval) => timeSync.startAutoSync(interval),
  stopAutoSync: () => timeSync.stopAutoSync(),
  
  // Correction graduelle
  setSmoothCorrection: (enabled, options) => timeSync.setSmoothCorrection(enabled, options),
  forceCorrection: () => timeSync.forceCorrection(),
  
  // WebSocket
  startWebSocketServer: (port) => timeSync.startWebSocketServer(port),
  stopWebSocketServer: () => timeSync.stopWebSocketServer(),
  
  // Utilitaires
  format: (date, format) => timeSync.format(date, format),
  diff: (date1, date2) => timeSync.diff(date1, date2),
  log: (message) => timeSync.log(message),
  
  // Événements
  on: (event, callback) => timeSync.on(event, callback),
  off: (event, callback) => timeSync.off(event, callback),
  
  // Classe pour usage avancé
  TimeSync
};

module.exports = api;
