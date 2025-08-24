import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken, updateUserSignupStep } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);
    
    // Update to step 2 - pattern setup required
    await updateUserSignupStep(user.$id, 2);
    
    const token = generateToken({
      userId: user.$id,
      email: user.email,
      name: user.name
    });

    const response = NextResponse.json(
      { 
        user: { 
          id: user.$id, 
          email: user.email, 
          name: user.name, 
          signupStep: 2 
        } 
      },
      { status: 201 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error('Signup error:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 409) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    if (error && typeof error === 'object' && 'type' in error && error.type === 'document_invalid_structure') {
      return NextResponse.json(
        { error: 'Database configuration error. Please check your Appwrite setup.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
