import { NextRequest, NextResponse } from 'next/server';
import { verifyUserSmashPattern, generateToken, verifyTypingPattern } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { pattern, tempUserId, tempUserEmail, tempUserName, typingData } = await request.json();
    
    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern is required' },
        { status: 400 }
      );
    }

    if (!tempUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Verifying smash pattern for user:', tempUserId);
    const isValid = await verifyUserSmashPattern(tempUserId, pattern);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid smash pattern' },
        { status: 401 }
      );
    }

    // Verify typing pattern if provided
    let typingValid = true;
    let confidence = 1.0;
    
    if (typingData) {
      const typingResult = await verifyTypingPattern(tempUserId, typingData);
      typingValid = typingResult.isValid;
      confidence = typingResult.confidence;
      
      if (!typingValid) {
        return NextResponse.json(
          { 
            error: 'Typing pattern does not match your profile',
            confidence: confidence 
          },
          { status: 401 }
        );
      }
    }

    // Pattern is valid, create final auth token
    const token = generateToken({
      userId: tempUserId,
      email: tempUserEmail,
      name: tempUserName
    });

    const response = NextResponse.json(
      { 
        user: { 
          id: tempUserId, 
          email: tempUserEmail, 
          name: tempUserName 
        },
        message: 'Authentication complete'
      },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    console.log('Smash pattern verified, full authentication complete');
    return response;
    
  } catch (error: any) {
    console.error('Verify smash pattern error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
