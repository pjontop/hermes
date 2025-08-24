'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VirtualKeyboardProps {
  className?: string;
  pressedKeys: Set<string>;
  showSpeed?: boolean;
  currentSpeed?: number;
  averageSpeed?: number;
}

const KEYBOARD_LAYOUT = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', ' ', 'Alt', 'Ctrl']
];

const KEY_WIDTHS: Record<string, string> = {
  'Backspace': 'w-10 sm:w-16',
  'Tab': 'w-8 sm:w-12',
  'CapsLock': 'w-12 sm:w-14',
  'Enter': 'w-12 sm:w-16',
  'Shift': 'w-14 sm:w-20',
  'Ctrl': 'w-8 sm:w-12',
  'Alt': 'w-8 sm:w-12',
  ' ': 'w-24 sm:w-32'
};

export function VirtualKeyboard({ 
  className, 
  pressedKeys, 
  showSpeed = false, 
  currentSpeed = 0, 
  averageSpeed = 0 
}: VirtualKeyboardProps) {
  const [recentKeys, setRecentKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (pressedKeys.size > 0) {
      setRecentKeys(new Set(pressedKeys));
      const timer = setTimeout(() => {
        setRecentKeys(new Set());
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pressedKeys]);

  const getKeyDisplayText = (key: string) => {
    switch (key) {
      case ' ': return 'Space';
      case 'Backspace': return '⌫';
      case 'Tab': return '⇥';
      case 'CapsLock': return '⇪';
      case 'Enter': return '⏎';
      case 'Shift': return '⇧';
      case 'Ctrl': return '⌃';
      case 'Alt': return '⌥';
      default: return key;
    }
  };

  const isKeyPressed = (key: string) => {
    const normalizedKey = key.toLowerCase();
    return pressedKeys.has(normalizedKey) || 
           pressedKeys.has(key) || 
           recentKeys.has(normalizedKey) || 
           recentKeys.has(key);
  };

  const getKeyClassName = (key: string) => {
    const baseClass = cn(
      "relative flex items-center justify-center h-8 sm:h-10 rounded border-2 transition-all duration-75 font-mono text-xs sm:text-sm font-medium shrink-0",
      KEY_WIDTHS[key] || "w-8 sm:w-10",
      isKeyPressed(key)
        ? "bg-blue-500 border-blue-400 text-white shadow-lg scale-95 shadow-blue-200"
        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
    );
    return baseClass;
  };

  return (
    <div className={cn("w-full mx-auto", className)}>
      {showSpeed && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center mb-4 p-3 bg-gray-50 rounded-lg border max-w-2xl mx-auto">
          <div className="text-sm text-center sm:text-left">
            <span className="text-gray-600">Current Speed:</span>
            <span className="ml-2 font-mono font-bold text-blue-600">
              {currentSpeed.toFixed(1)} WPM
            </span>
          </div>
          <div className="text-sm text-center sm:text-left">
            <span className="text-gray-600">Average Speed:</span>
            <span className="ml-2 font-mono font-bold text-green-600">
              {averageSpeed.toFixed(1)} WPM
            </span>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <div className="flex flex-col items-center gap-1 p-4" style={{ minWidth: 'max-content' }}>
          {KEYBOARD_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1" style={{ minWidth: 'max-content' }}>
              {row.map((key, keyIndex) => (
                <div
                  key={`${rowIndex}-${keyIndex}`}
                  className={getKeyClassName(key)}
                >
                  {getKeyDisplayText(key)}
                  {isKeyPressed(key) && (
                    <div className="absolute inset-0 bg-blue-400 opacity-20 rounded animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 mt-2">
        Virtual Keyboard - Keys light up as you type
      </div>
    </div>
  );
}
