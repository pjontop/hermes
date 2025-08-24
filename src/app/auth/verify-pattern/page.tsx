'use client';

import { Suspense } from 'react';
import { SmashVerification } from "@/components/auth/smashVerification";

function VerifyPatternContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl mx-auto px-4">
        <SmashVerification standalone={true} />
      </div>
    </div>
  );
}

export default function VerifyPatternPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <VerifyPatternContent />
    </Suspense>
  );
}
