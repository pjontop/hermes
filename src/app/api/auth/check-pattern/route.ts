import { NextRequest, NextResponse } from 'next/server';
import { userHasSmashPattern, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const hasPattern = await userHasSmashPattern(userId);
    
    return NextResponse.json(
      { hasPattern },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Check pattern error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
