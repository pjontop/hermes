/**
 * SMASH Pattern Analyzer
 * Analyzes keyboard smashing patterns and typing dynamics for authentication
 */

export interface TypingData {
  averageSpeed: number;
  speedVariance: number;
  keyTimingProfile: number[];
  sampleCount: number;
}

export interface KeyEvent {
  key: string;
  timestamp: number;
  type: 'keydown' | 'keyup';
}

export class SmashAnalyzer {
  private keyEvents: KeyEvent[] = [];
  private startTime: number | null = null;
  private isRecording = false;

  /**
   * Start recording keyboard events
   */
  startRecording(): void {
    this.keyEvents = [];
    this.startTime = Date.now();
    this.isRecording = true;
  }

  /**
   * Stop recording keyboard events
   */
  stopRecording(): void {
    this.isRecording = false;
  }

  /**
   * Add a key event to the recording
   */
  addKeyEvent(key: string, type: 'keydown' | 'keyup'): void {
    if (!this.isRecording || !this.startTime) return;

    this.keyEvents.push({
      key,
      timestamp: Date.now() - this.startTime,
      type
    });
  }

  /**
   * Get the current pattern as a string
   */
  getPattern(): string {
    return this.keyEvents
      .filter(event => event.type === 'keydown')
      .map(event => event.key)
      .join('');
  }

  /**
   * Analyze typing dynamics from recorded events
   */
  analyzeTypingDynamics(): TypingData {
    if (this.keyEvents.length < 2) {
      return {
        averageSpeed: 0,
        speedVariance: 0,
        keyTimingProfile: [],
        sampleCount: 0
      };
    }

    const keydownEvents = this.keyEvents.filter(event => event.type === 'keydown');
    
    if (keydownEvents.length < 2) {
      return {
        averageSpeed: 0,
        speedVariance: 0,
        keyTimingProfile: [],
        sampleCount: 0
      };
    }

    // Calculate inter-key intervals
    const intervals: number[] = [];
    for (let i = 1; i < keydownEvents.length; i++) {
      const interval = keydownEvents[i].timestamp - keydownEvents[i - 1].timestamp;
      intervals.push(interval);
    }

    // Calculate average speed (keys per minute)
    const totalTime = keydownEvents[keydownEvents.length - 1].timestamp - keydownEvents[0].timestamp;
    const averageSpeed = totalTime > 0 ? (keydownEvents.length / totalTime) * 60000 : 0;

    // Calculate speed variance
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - averageInterval, 2), 0) / intervals.length;
    const speedVariance = Math.sqrt(variance);

    // Create key timing profile (normalized intervals)
    const maxInterval = Math.max(...intervals);
    const keyTimingProfile = intervals.map(interval => maxInterval > 0 ? interval / maxInterval : 0);

    return {
      averageSpeed,
      speedVariance,
      keyTimingProfile,
      sampleCount: 1
    };
  }

  /**
   * Clear all recorded data
   */
  clear(): void {
    this.keyEvents = [];
    this.startTime = null;
    this.isRecording = false;
  }

  /**
   * Check if currently recording
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Get recording duration in milliseconds
   */
  getRecordingDuration(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Get number of recorded key events
   */
  getEventCount(): number {
    return this.keyEvents.length;
  }

  /**
   * Get number of unique keys pressed
   */
  getUniqueKeyCount(): string[] {
    const uniqueKeys = new Set(
      this.keyEvents
        .filter(event => event.type === 'keydown')
        .map(event => event.key)
    );
    return Array.from(uniqueKeys);
  }

  /**
   * Validate if the pattern meets minimum requirements
   */
  validatePattern(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const pattern = this.getPattern();
    const uniqueKeys = this.getUniqueKeyCount();

    if (pattern.length < 8) {
      errors.push('Pattern must be at least 8 keys long');
    }

    if (pattern.length > 50) {
      errors.push('Pattern must be no more than 50 keys long');
    }

    if (uniqueKeys.length < 4) {
      errors.push('Pattern must contain at least 4 different keys');
    }

    const duration = this.getRecordingDuration();
    if (duration < 1000) {
      errors.push('Pattern must be typed over at least 1 second');
    }

    if (duration > 10000) {
      errors.push('Pattern must be typed within 10 seconds');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get pattern strength score (0-100)
   */
  getPatternStrength(): number {
    const pattern = this.getPattern();
    const uniqueKeys = this.getUniqueKeyCount();
    const typingData = this.analyzeTypingDynamics();

    let score = 0;

    // Length score (0-30 points)
    score += Math.min(30, (pattern.length / 20) * 30);

    // Uniqueness score (0-25 points)
    score += Math.min(25, (uniqueKeys.length / 10) * 25);

    // Timing variance score (0-25 points)
    if (typingData.speedVariance > 0) {
      score += Math.min(25, (typingData.speedVariance / 100) * 25);
    }

    // Complexity score (0-20 points)
    const hasNumbers = /\d/.test(pattern);
    const hasLetters = /[a-zA-Z]/.test(pattern);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pattern);
    
    if (hasNumbers) score += 7;
    if (hasLetters) score += 7;
    if (hasSpecial) score += 6;

    return Math.round(Math.min(100, score));
  }
}