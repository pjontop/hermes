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
import { useRouter, useSearchParams } from "next/navigation";

interface TypingData {
  averageSpeed: number;
  speedVariance: number;
  keyTimingProfile: number[];
  sampleCount: number;
}

interface SmashVerificationProps {
  className?: string;
  onVerify?: (pattern: string, typingData?: TypingData) => void;
  onBack?: () => void;
  userEmail?: string;
  standalone?: boolean;
}

export function SmashVerification({ 
  className, 
  onVerify, 
  onBack, 
  userEmail: propUserEmail,
  standalone = false
}: SmashVerificationProps) {
  const { verifySmashPattern } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pattern, setPattern] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get email from URL params if in standalone mode
  const userEmail = standalone ? (searchParams.get('email') || '') : (propUserEmail || '');
  
  const {
    currentSpeed,
    averageSpeed,
    pressedKeys,
    startTracking,
    stopTracking,
    resetTracking,
    getTypingPattern
  } = useTypingTracker();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    e.preventDefault();
    const key = e.key;
    
    if (key === "Enter") {
      setIsRecording(false);
      stopTracking();
      handleVerify();
      return;
    }
    
    if (key === "Backspace") {
      setPattern(prev => prev.slice(0, -1));
      return;
    }
    
    if (key.length === 1) {
      setPattern(prev => prev + key);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setError("");
    setPattern("");
    resetTracking();
    startTracking();
  };

  const stopRecording = () => {
    setIsRecording(false);
    stopTracking();
  };

    const handleVerify = async () => {
    stopTracking();
    
    if (!pattern.trim()) {
      setError("Please enter your smash pattern");
      return;
    }

    const typingPattern = getTypingPattern();
    console.log('Verification typing pattern:', typingPattern);
    
    // Convert typing pattern to expected format
    const typingData: TypingData | undefined = typingPattern ? {
      averageSpeed: averageSpeed,
      speedVariance: typingPattern.variance,
      keyTimingProfile: typingPattern.intervals,
      sampleCount: typingPattern.intervals.length
    } : undefined;
    
    setAttempts(prev => prev + 1);
    
    if (standalone) {
      // Handle standalone verification
      setLoading(true);
      setError("");
      
      try {
        // Create a proper TempUser object with minimal required fields
        const tempUser = { 
          id: '', // This will be resolved in the backend 
          email: userEmail,
          name: '' // This will be resolved in the backend
        };
        const success = await verifySmashPattern(pattern, tempUser, typingData);
        if (success) {
          router.push('/dashboard');
        } else {
          setError("Invalid smash pattern. Please try again.");
        }
      } catch (error) {
        setError("Verification failed. Please try again.");
      } finally {
        setLoading(false);
      }
    } else if (onVerify) {
      // Handle callback mode
      onVerify(pattern, typingData);
    }
  };

  const handleBack = () => {
    if (standalone) {
      router.push('/auth/login');
    } else if (onBack) {
      onBack();
    }
  };

  const handleTryAgain = () => {
    setPattern("");
    setError("");
  };

  return (
    <div className={cn(
      standalone 
        ? "w-full max-w-4xl mx-auto space-y-6" 
        : "flex flex-col gap-6 max-w-2xl mx-auto px-4", 
      className
    )}>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
          <Shield className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Verify Your Smash Pattern</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your keyboard smashing pattern to complete login
        </p>
        {userEmail && (
          <Badge variant="outline" className="text-xs">
            {userEmail}
          </Badge>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {isRecording && (
        <div className="flex gap-4 justify-center p-3 bg-blue-50 rounded-lg border border-blue-200">
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

      <VirtualKeyboard 
        pressedKeys={pressedKeys}
        showSpeed={false}
        currentSpeed={currentSpeed}
        averageSpeed={averageSpeed}
        className="mx-auto"
      />

      <div className={standalone ? "flex justify-center w-full" : ""}>
        <Card className={standalone ? "w-full max-w-2xl" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Ready to smash?
            </CardTitle>
            <CardDescription>
              Click &lsquo;Start Recording&rsquo; and recreate your pattern while watching the virtual keyboard light up.
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verifyPattern">Your Smash Pattern</Label>
            <div className="relative">
              <Input
                id="verifyPattern"
                type="password"
                value={pattern}
                placeholder="Click 'Start Recording' and enter your pattern"
                readOnly
                onKeyDown={handleKeyDown}
                className={cn(
                  "font-mono pr-32",
                  isRecording && "ring-2 ring-blue-500 border-blue-500"
                )}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {!isRecording ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startRecording}
                    className="text-xs"
                  >
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopRecording}
                    className="text-xs bg-red-50 text-red-600 border-red-200"
                  >
                    Stop Recording
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Pattern length: {pattern.length} characters
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleVerify} 
              className="flex-1" 
              disabled={!pattern || loading}
            >
              {loading ? "Verifying..." : "Verify Pattern"}
            </Button>
            <Button variant="outline" onClick={handleTryAgain}>
              Clear
            </Button>
          </div>
          
          <Button variant="ghost" onClick={handleBack} className="w-full">
            Back to Login
          </Button>
        </CardContent>
      </Card>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Attempt {attempts + 1}/5 • Pattern verification adds an extra layer of security
        </p>
      </div>
    </div>
  );
}

