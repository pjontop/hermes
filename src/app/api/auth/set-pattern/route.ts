import { NextRequest, NextResponse } from 'next/server';
import { setUserSmashPattern, generateToken, storeTypingProfile } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { pattern, userId, userEmail, userName, typingData } = await request.json();
    
    if (!pattern || pattern.length < 5) {
      return NextResponse.json(
        { error: 'Pattern must be at least 5 characters long' },
        { status: 400 }
      );
    }

    if (!userId || !userEmail || !userName) {
      return NextResponse.json(
        { error: 'User data required' },
        { status: 400 }
      );
    }

    // Set the pattern for the user
    const success = await setUserSmashPattern(userId, pattern);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to set pattern' },
        { status: 500 }
      );
    }

    // Store typing profile if provided
    if (typingData) {
      const typingSuccess = await storeTypingProfile(userId, typingData);
      if (!typingSuccess) {
        console.warn('Failed to store typing profile, but continuing...');
      }
    }

    // Generate token and set cookie
    const token = generateToken({ userId, email: userEmail, name: userName });
    const user = { id: userId, email: userEmail, name: userName };
    
    const response = NextResponse.json({ 
      success: true,
      user 
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    console.error('Set pattern error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
