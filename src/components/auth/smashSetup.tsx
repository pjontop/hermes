'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyboard, Shield, Timer, Zap } from "lucide-react";
import { VirtualKeyboard } from "@/components/ui/virtual-keyboard";
import { useTypingTracker } from "@/hooks/useTypingTracker";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface SmashSetupProps {
  className?: string;
  onPatternSet?: (pattern: string, typingData?: any) => void;
  onBack?: () => void;
  userEmail?: string;
}

export function SmashSetup({ className, onPatternSet, onBack, userEmail }: SmashSetupProps) {
  const { user, setSmashPattern } = useAuth();
  const router = useRouter();
  
  const [pattern, setPattern] = useState("");
  const [confirmPattern, setConfirmPattern] = useState("");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [currentField, setCurrentField] = useState<'pattern' | 'confirm'>('pattern');
  
  const {
    currentSpeed,
    averageSpeed,
    pressedKeys,
    startTracking,
    stopTracking,
    resetTracking,
    getTypingPattern
  } = useTypingTracker();

  const handleKeyDown = (e: React.KeyboardEvent, fieldType: 'pattern' | 'confirm') => {
    if (!isRecording || currentField !== fieldType) return;
    
    e.preventDefault();
    const key = e.key;
    
    if (key === "Enter") {
      setIsRecording(false);
      stopTracking();
      return;
    }
    
    if (key === "Backspace") {
      if (fieldType === 'confirm') {
        setConfirmPattern(prev => prev.slice(0, -1));
      } else {
        setPattern(prev => prev.slice(0, -1));
      }
      return;
    }
    
    if (key.length === 1) {
      if (fieldType === 'confirm') {
        setConfirmPattern(prev => prev + key);
      } else {
        setPattern(prev => prev + key);
      }
    }
  };

  const startRecording = (fieldType: 'pattern' | 'confirm') => {
    setCurrentField(fieldType);
    setIsRecording(true);
    setError("");
    resetTracking();
    startTracking();
  };

  const stopRecording = () => {
    setIsRecording(false);
    stopTracking();
  };

  const handleSubmit = async () => {
    setError("");
    
    if (pattern.length < 5) {
      setError("Pattern must be at least 5 characters long");
      return;
    }
    
    if (pattern !== confirmPattern) {
      setError("Patterns don't match");
      return;
    }

    const typingPattern = getTypingPattern();
    console.log('Typing pattern:', typingPattern);
    
    // Check if we're in standalone mode (user is already logged in)
    if (user && (!onPatternSet || onPatternSet.toString() === '() => {}')) {
      // Standalone mode - set pattern for logged-in user
      const success = await setSmashPattern(pattern, user, typingPattern);
      if (success) {
        router.push('/dashboard');
      } else {
        setError("Failed to set pattern. Please try again.");
      }
    } else {
      // Callback mode - during signup flow
      onPatternSet && onPatternSet(pattern, typingPattern);
    }
  };

  const generateSample = () => {
    const samples = ["asdfjkl;", "qwertyuiop", "zxcvbnm,./", "asdfghjkl", "1234567890"];
    return samples[Math.floor(Math.random() * samples.length)];
  };

  return (
    <div className={cn("w-full mx-auto space-y-6", className)}>
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Set Your Smash Pattern</h1>
        </div>
        <p className="text-muted-foreground text-sm text-balance">
          Create a unique keyboard smashing pattern for enhanced security
        </p>
        {(userEmail || user?.email) && (
          <Badge variant="outline" className="text-xs">
            Setting up for {userEmail || user?.email}
          </Badge>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded-lg border border-red-200 mx-4">
          {error}
        </div>
      )}

      {isRecording && (
        <div className="flex gap-4 justify-center p-3 bg-blue-50 rounded-lg border border-blue-200 mx-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Current Speed:</span>
            <Badge variant="secondary">{currentSpeed.toFixed(1)} WPM</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Average Speed:</span>
            <Badge variant="secondary">{averageSpeed.toFixed(1)} WPM</Badge>
          </div>
        </div>
      )}

      <div className="w-full">
        <VirtualKeyboard 
          pressedKeys={pressedKeys}
          showSpeed={false}
          currentSpeed={currentSpeed}
          averageSpeed={averageSpeed}
        />
      </div>

      <div className="flex justify-center w-full px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Keyboard className="h-5 w-5" />
              Pattern Setup
            </CardTitle>
            <CardDescription>
              Type your pattern while watching the virtual keyboard light up.
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pattern" className="text-sm font-medium">
                Your Smash Pattern
              </Label>
              <div className="relative">
                <Input
                  id="pattern"
                  type="password"
                  value={pattern}
                  placeholder="Click 'Start Recording' and smash away!"
                  readOnly
                  onKeyDown={(e) => handleKeyDown(e, 'pattern')}
                  className={cn(
                    "font-mono pr-32",
                    isRecording && currentField === 'pattern' && "ring-2 ring-blue-500 border-blue-500"
                  )}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {!isRecording ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startRecording('pattern')}
                      className="text-xs"
                    >
                      Start Recording
                    </Button>
                  ) : currentField === 'pattern' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={stopRecording}
                      className="text-xs bg-red-50 text-red-600 border-red-200"
                    >
                      Stop Recording
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {pattern && (
              <div className="space-y-2">
                <Label htmlFor="confirmPattern" className="text-sm font-medium">
                  Confirm Your Pattern
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPattern"
                    type="password"
                    value={confirmPattern}
                    placeholder="Type your pattern again to confirm"
                    readOnly
                    onKeyDown={(e) => handleKeyDown(e, 'confirm')}
                    className={cn(
                      "font-mono pr-32",
                      isRecording && currentField === 'confirm' && "ring-2 ring-blue-500 border-blue-500"
                    )}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {!isRecording ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startRecording('confirm')}
                        className="text-xs"
                      >
                        Start Recording
                      </Button>
                    ) : currentField === 'confirm' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={stopRecording}
                        className="text-xs bg-red-50 text-red-600 border-red-200"
                      >
                        Stop Recording
                      </Button>
                    ) : null}
                  </div>
                </div>
                {pattern === confirmPattern && confirmPattern && (
                  <p className="text-xs text-green-600">✓ Patterns match!</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Keyboard className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Need inspiration?</p>
                <p className="text-xs text-gray-600 mb-2">
                  Try: <code className="bg-gray-200 px-1 rounded text-xs">{generateSample()}</code>
                </p>
                <p className="text-xs text-gray-500">
                  • Minimum 5 characters • Mix letters, numbers, symbols
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="flex gap-3 max-w-2xl mx-auto">
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={!pattern || !confirmPattern || pattern !== confirmPattern}
        >
          Set Pattern
        </Button>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        {user && (!onPatternSet || onPatternSet.toString() === '() => {}') && (
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Skip for Now
          </Button>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Your typing speed and rhythm are analyzed for additional security
        </p>
      </div>
    </div>
  );
}
