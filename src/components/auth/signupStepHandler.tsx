'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function SignupStepHandler() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user) return;

    // Check signup step and redirect accordingly
    if (user.signupStep === 2) {
      // User needs to set up pattern - redirect unless already on pattern setup
      if (pathname !== '/auth/pattern-setup') {
        console.log('User needs to complete pattern setup, redirecting...');
        router.push('/auth/pattern-setup');
      }
    } else if (user.signupStep === 3) {
      // User has completed signup, check if they're trying to access auth routes
      if (pathname === '/' || pathname === '/auth/login' || pathname === '/auth/signup') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  return null; // This component doesn't render anything
}
