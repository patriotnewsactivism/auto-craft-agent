/**
 * TIME ESTIMATION SYSTEM
 * 
 * Intelligently estimates task completion time based on:
 * - Task complexity
 * - Historical performance data
 * - File count and types
 * - Current system performance
 */

export interface TimeEstimate {
  totalEstimatedSeconds: number;
  estimatedEndTime: Date;
  breakdown: {
    analysis: number;
    planning: number;
    generation: number;
    validation: number;
    learning: number;
  };
  confidence: number; // 0-1
}

export interface TaskMetrics {
  complexity: 'low' | 'medium' | 'high' | 'enterprise';
  fileCount: number;
  features: string[];
  techStack: string[];
}

export class TimeEstimator {
  private historicalData: Array<{
    complexity: string;
    fileCount: number;
    actualTime: number;
    timestamp: number;
  }> = [];

  constructor() {
    this.loadHistoricalData();
  }

  /**
   * Estimate time for a task
   */
  estimate(metrics: TaskMetrics): TimeEstimate {
    const baseTime = this.getBaseTime(metrics.complexity);
    const fileMultiplier = this.getFileMultiplier(metrics.fileCount);
    const featureMultiplier = this.getFeatureMultiplier(metrics.features);
    const historicalAdjustment = this.getHistoricalAdjustment(metrics);

    // Calculate phase times
    const totalSeconds = Math.floor(
      baseTime * fileMultiplier * featureMultiplier * historicalAdjustment
    );

    const breakdown = {
      analysis: Math.floor(totalSeconds * 0.15),      // 15% - Analysis
      planning: Math.floor(totalSeconds * 0.10),       // 10% - Planning
      generation: Math.floor(totalSeconds * 0.50),     // 50% - Generation
      validation: Math.floor(totalSeconds * 0.15),     // 15% - Validation
      learning: Math.floor(totalSeconds * 0.10)        // 10% - Learning
    };

    const estimatedEndTime = new Date(Date.now() + totalSeconds * 1000);
    const confidence = this.calculateConfidence(metrics);

    return {
      totalEstimatedSeconds: totalSeconds,
      estimatedEndTime,
      breakdown,
      confidence
    };
  }

  /**
   * Update estimate based on actual progress
   */
  updateEstimate(
    originalEstimate: TimeEstimate,
    currentProgress: number,
    elapsedSeconds: number
  ): TimeEstimate {
    if (currentProgress === 0) return originalEstimate;

    // Calculate actual rate vs estimated rate
    const expectedElapsed = (currentProgress / 100) * originalEstimate.totalEstimatedSeconds;
    const actualRate = currentProgress / elapsedSeconds;
    const expectedRate = currentProgress / expectedElapsed;
    const rateRatio = actualRate / expectedRate;

    // Adjust remaining time based on actual performance
    const remainingProgress = 100 - currentProgress;
    const adjustedRemainingTime = Math.floor(
      (remainingProgress / actualRate) * (rateRatio < 1 ? 0.9 : 1.1)
    );

    const newTotalEstimate = elapsedSeconds + adjustedRemainingTime;
    const estimatedEndTime = new Date(Date.now() + adjustedRemainingTime * 1000);

    // Adjust breakdown proportionally
    const scaleFactor = newTotalEstimate / originalEstimate.totalEstimatedSeconds;
    const breakdown = {
      analysis: Math.floor(originalEstimate.breakdown.analysis * scaleFactor),
      planning: Math.floor(originalEstimate.breakdown.planning * scaleFactor),
      generation: Math.floor(originalEstimate.breakdown.generation * scaleFactor),
      validation: Math.floor(originalEstimate.breakdown.validation * scaleFactor),
      learning: Math.floor(originalEstimate.breakdown.learning * scaleFactor)
    };

    return {
      totalEstimatedSeconds: newTotalEstimate,
      estimatedEndTime,
      breakdown,
      confidence: Math.min(originalEstimate.confidence + 0.1, 0.95)
    };
  }

  /**
   * Record actual completion time for learning
   */
  recordCompletion(metrics: TaskMetrics, actualSeconds: number): void {
    this.historicalData.push({
      complexity: metrics.complexity,
      fileCount: metrics.fileCount,
      actualTime: actualSeconds,
      timestamp: Date.now()
    });

    // Keep only last 100 records
    if (this.historicalData.length > 100) {
      this.historicalData = this.historicalData.slice(-100);
    }

    this.saveHistoricalData();
  }

  /**
   * Format time for display
   */
  static formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Get human-readable time remaining
   */
  static getTimeRemainingText(seconds: number): string {
    if (seconds < 30) {
      return 'Almost done';
    } else if (seconds < 60) {
      return 'Less than a minute';
    } else if (seconds < 120) {
      return 'About a minute';
    } else if (seconds < 300) {
      return 'A few minutes';
    } else {
      return `About ${Math.ceil(seconds / 60)} minutes`;
    }
  }

  // Private helper methods

  private getBaseTime(complexity: string): number {
    const baseTimes = {
      low: 30,        // 30 seconds
      medium: 90,     // 1.5 minutes
      high: 180,      // 3 minutes
      enterprise: 360 // 6 minutes
    };
    return baseTimes[complexity as keyof typeof baseTimes] || 90;
  }

  private getFileMultiplier(fileCount: number): number {
    // Each file adds about 8 seconds
    return 1 + (fileCount * 0.25);
  }

  private getFeatureMultiplier(features: string[]): number {
    // Complex features increase time
    const complexFeatures = [
      'authentication',
      'database',
      'api',
      'real-time',
      'payment',
      'admin'
    ];

    const complexCount = features.filter(f =>
      complexFeatures.some(cf => f.toLowerCase().includes(cf))
    ).length;

    return 1 + (complexCount * 0.15);
  }

  private getHistoricalAdjustment(metrics: TaskMetrics): number {
    if (this.historicalData.length < 5) return 1;

    // Find similar past tasks
    const similarTasks = this.historicalData.filter(
      h => h.complexity === metrics.complexity &&
           Math.abs(h.fileCount - metrics.fileCount) <= 3
    );

    if (similarTasks.length === 0) return 1;

    // Calculate average actual vs estimated ratio
    const avgActualTime = similarTasks.reduce((sum, t) => sum + t.actualTime, 0) / similarTasks.length;
    const baseEstimate = this.getBaseTime(metrics.complexity) * this.getFileMultiplier(metrics.fileCount);

    return Math.max(0.5, Math.min(2, avgActualTime / baseEstimate));
  }

  private calculateConfidence(metrics: TaskMetrics): number {
    // Base confidence
    let confidence = 0.5;

    // Increase confidence if we have historical data
    const similarTasks = this.historicalData.filter(
      h => h.complexity === metrics.complexity
    );

    if (similarTasks.length > 10) {
      confidence += 0.3;
    } else if (similarTasks.length > 5) {
      confidence += 0.2;
    } else if (similarTasks.length > 0) {
      confidence += 0.1;
    }

    // Increase confidence for simpler tasks
    if (metrics.complexity === 'low') {
      confidence += 0.1;
    } else if (metrics.complexity === 'high' || metrics.complexity === 'enterprise') {
      confidence -= 0.1;
    }

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private loadHistoricalData(): void {
    try {
      const saved = localStorage.getItem('time_estimation_history');
      if (saved) {
        this.historicalData = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }

  private saveHistoricalData(): void {
    try {
      localStorage.setItem('time_estimation_history', JSON.stringify(this.historicalData));
    } catch (error) {
      console.error('Failed to save historical data:', error);
    }
  }
}

// Export singleton
export const timeEstimator = new TimeEstimator();
