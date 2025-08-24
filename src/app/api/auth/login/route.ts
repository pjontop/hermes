import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Attempting to authenticate user...');
    const user = await authenticateUser(email, password);
    
    if (!user) {
      console.log('Authentication failed for email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User authenticated successfully:', user.email);
    const token = generateToken({
      userId: user.$id,
      email: user.email,
      name: user.name
    });

    const response = NextResponse.json(
      { user: { id: user.$id, email: user.email, name: user.name } },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    console.log('Login successful, token set');
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.type === 'collection_not_found') {
      return NextResponse.json(
        { error: 'Database configuration error. Please check your Appwrite setup.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
