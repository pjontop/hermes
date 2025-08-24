'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TypingMetrics {
  currentSpeed: number;
  averageSpeed: number;
  pressedKeys: Set<string>;
  keyPressTimings: number[];
  totalCharacters: number;
  startTime: number | null;
}

export function useTypingTracker() {
  const [metrics, setMetrics] = useState<TypingMetrics>({
    currentSpeed: 0,
    averageSpeed: 0,
    pressedKeys: new Set(),
    keyPressTimings: [],
    totalCharacters: 0,
    startTime: null
  });

  const lastKeysRef = useRef<Set<string>>(new Set());
  const keyTimingsRef = useRef<number[]>([]);
  const isTrackingRef = useRef(false);

  const startTracking = useCallback(() => {
    isTrackingRef.current = true;
    setMetrics(prev => ({
      ...prev,
      startTime: Date.now(),
      keyPressTimings: [],
      totalCharacters: 0,
      currentSpeed: 0,
      averageSpeed: 0
    }));
    keyTimingsRef.current = [];
  }, []);

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false;
  }, []);

  const resetTracking = useCallback(() => {
    isTrackingRef.current = false;
    setMetrics({
      currentSpeed: 0,
      averageSpeed: 0,
      pressedKeys: new Set(),
      keyPressTimings: [],
      totalCharacters: 0,
      startTime: null
    });
    keyTimingsRef.current = [];
    lastKeysRef.current = new Set();
  }, []);

  const calculateSpeed = useCallback((timings: number[], totalChars: number, startTime: number) => {
    if (timings.length < 2 || totalChars === 0) return { current: 0, average: 0 };

    const now = Date.now();
    const totalTimeSeconds = (now - startTime) / 1000;
    const totalTimeMinutes = totalTimeSeconds / 60;

    // Average WPM (assuming 5 characters per word)
    const averageWPM = totalTimeMinutes > 0 ? (totalChars / 5) / totalTimeMinutes : 0;

    // Current WPM based on last 5 keystrokes
    const recentTimings = timings.slice(-5);
    if (recentTimings.length >= 2) {
      const recentTimeSpan = (recentTimings[recentTimings.length - 1] - recentTimings[0]) / 1000 / 60;
      const currentWPM = recentTimeSpan > 0 ? (recentTimings.length / 5) / recentTimeSpan : 0;
      return { current: Math.min(currentWPM, 200), average: Math.min(averageWPM, 200) };
    }

    return { current: 0, average: averageWPM };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTrackingRef.current) return;

      const key = event.key.toLowerCase();
      const now = Date.now();

      // Ignore modifier keys for speed calculation
      if (['shift', 'ctrl', 'alt', 'meta', 'capslock', 'tab'].includes(key)) {
        setMetrics(prev => ({
          ...prev,
          pressedKeys: new Set([...prev.pressedKeys, key])
        }));
        return;
      }

      // Add to pressed keys
      const newPressedKeys = new Set(lastKeysRef.current);
      newPressedKeys.add(key);
      lastKeysRef.current = newPressedKeys;

      // Record timing for speed calculation
      keyTimingsRef.current.push(now);
      
      setMetrics(prev => {
        const newTimings = [...prev.keyPressTimings, now];
        const newTotalChars = prev.totalCharacters + 1;
        const startTime = prev.startTime || now;
        
        const { current, average } = calculateSpeed(newTimings, newTotalChars, startTime);

        return {
          ...prev,
          pressedKeys: newPressedKeys,
          keyPressTimings: newTimings,
          totalCharacters: newTotalChars,
          currentSpeed: current,
          averageSpeed: average
        };
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isTrackingRef.current) return;

      const key = event.key.toLowerCase();
      
      // Remove from pressed keys after a short delay
      setTimeout(() => {
        const newPressedKeys = new Set(lastKeysRef.current);
        newPressedKeys.delete(key);
        lastKeysRef.current = newPressedKeys;
        
        setMetrics(prev => ({
          ...prev,
          pressedKeys: newPressedKeys
        }));
      }, 50);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [calculateSpeed]);

  const getTypingPattern = useCallback(() => {
    if (keyTimingsRef.current.length < 2) return null;

    const intervals = [];
    for (let i = 1; i < keyTimingsRef.current.length; i++) {
      intervals.push(keyTimingsRef.current[i] - keyTimingsRef.current[i - 1]);
    }

    return {
      intervals,
      averageInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
      variance: intervals.reduce((acc, interval, _, arr) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return acc + Math.pow(interval - mean, 2);
      }, 0) / intervals.length
    };
  }, []);

  return {
    ...metrics,
    startTracking,
    stopTracking,
    resetTracking,
    getTypingPattern
  };
}
