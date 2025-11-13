/**
 * Metrics Collector
 * 
 * Collecte et envoie les métriques de performance et de fiabilité
 * pour monitoring et alertes.
 */

import { supabase } from './supabaseClient';

export interface Metrics {
  // Performance
  responseTime: number; // en ms
  
  // Fiabilité
  successRate: number; // 0-100
  failureRate: number; // 0-100
  
  // File d'attente
  queueSize: number;
  queueProcessingTime: number; // en ms
  
  // Retries
  averageRetries: number;
  maxRetries: number;
  
  // Timestamp
  timestamp: string;
}

interface MetricEvent {
  type: 'submission' | 'queue_process' | 'retry';
  success: boolean;
  duration: number;
  retries?: number;
  error?: string;
}

class MetricsCollector {
  private events: MetricEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Démarrer le flush automatique
    this.startAutoFlush();
  }

  /**
   * Enregistre un événement métrique
   */
  record(event: MetricEvent): void {
    this.events.push({
      ...event,
      timestamp: new Date().toISOString(),
    } as any);

    // Limiter la taille du buffer
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }
  }

  /**
   * Calcule les métriques agrégées
   */
  calculateMetrics(): Metrics {
    if (this.events.length === 0) {
      return {
        responseTime: 0,
        successRate: 100,
        failureRate: 0,
        queueSize: 0,
        queueProcessingTime: 0,
        averageRetries: 0,
        maxRetries: 0,
        timestamp: new Date().toISOString(),
      };
    }

    const successCount = this.events.filter(e => e.success).length;
    const failureCount = this.events.length - successCount;
    
    const avgResponseTime = this.events.reduce((sum, e) => sum + e.duration, 0) / this.events.length;
    
    const eventsWithRetries = this.events.filter(e => e.retries !== undefined);
    const avgRetries = eventsWithRetries.length > 0
      ? eventsWithRetries.reduce((sum, e) => sum + (e.retries || 0), 0) / eventsWithRetries.length
      : 0;
    
    const maxRetries = Math.max(...this.events.map(e => e.retries || 0), 0);
    
    const queueEvents = this.events.filter(e => e.type === 'queue_process');
    const avgQueueTime = queueEvents.length > 0
      ? queueEvents.reduce((sum, e) => sum + e.duration, 0) / queueEvents.length
      : 0;

    return {
      responseTime: Math.round(avgResponseTime),
      successRate: Math.round((successCount / this.events.length) * 100),
      failureRate: Math.round((failureCount / this.events.length) * 100),
      queueSize: 0, // À obtenir depuis offlineQueueManager
      queueProcessingTime: Math.round(avgQueueTime),
      averageRetries: Math.round(avgRetries * 10) / 10,
      maxRetries,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Envoie les métriques vers un service de monitoring
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }

    const metrics = this.calculateMetrics();
    
    try {
      // Option 1: Envoyer vers Supabase (table metrics)
      await this.sendToSupabase(metrics);
      
      // Option 2: Envoyer vers un service externe (Sentry, DataDog, etc.)
      // await this.sendToExternalService(metrics);
      
      console.debug('Métriques envoyées:', metrics);
      
      // Nettoyer les événements après envoi
      this.events = [];
    } catch (error) {
      console.error('Erreur lors de l\'envoi des métriques:', error);
    }
  }

  /**
   * Envoie les métriques vers Supabase
   */
  private async sendToSupabase(metrics: Metrics): Promise<void> {
    // Créer une table metrics si nécessaire
    const { error } = await supabase
      .from('metrics')
      .insert({
        ...metrics,
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Si la table n'existe pas, logger seulement
      console.debug('Métriques non enregistrées (table metrics non disponible)');
    }
  }

  /**
   * Démarre le flush automatique
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Arrête le flush automatique
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Obtient les métriques actuelles sans les envoyer
   */
  getMetrics(): Metrics {
    return this.calculateMetrics();
  }

  /**
   * Réinitialise les événements
   */
  reset(): void {
    this.events = [];
  }
}

// Instance singleton
const metricsCollector = new MetricsCollector();

export default metricsCollector;

// Fonctions helper pour enregistrer des événements
export function recordSubmission(success: boolean, duration: number, retries?: number, error?: string): void {
  metricsCollector.record({
    type: 'submission',
    success,
    duration,
    retries,
    error,
  });
}

export function recordQueueProcess(success: boolean, duration: number): void {
  metricsCollector.record({
    type: 'queue_process',
    success,
    duration,
  });
}

export function recordRetry(success: boolean, duration: number, retries: number): void {
  metricsCollector.record({
    type: 'retry',
    success,
    duration,
    retries,
  });
}
