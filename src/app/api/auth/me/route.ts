import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from '@/lib/appwrite';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token found' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch complete user data from database
    try {
      const user = await databases.getDocument(DATABASE_ID!, USERS_COLLECTION_ID!, payload.userId);
      
      return NextResponse.json(
        { 
          user: { 
            id: user.$id, 
            email: user.email, 
            name: user.name,
            signupStep: user.signupStep || 1
          } 
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fallback to token data if database fetch fails
      return NextResponse.json(
        { 
          user: { 
            id: payload.userId, 
            email: payload.email, 
            name: payload.name,
            signupStep: 1 // Default fallback
          } 
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
