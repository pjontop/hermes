import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from '@/lib/appwrite.js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    console.log('Database ID:', DATABASE_ID);
    console.log('Collection ID:', USERS_COLLECTION_ID);
    
    // First, try to list all documents (without any filters)
    const allUsers = await databases.listDocuments(
      DATABASE_ID!,
      USERS_COLLECTION_ID!
    );
    
    console.log('Total users in collection:', allUsers.documents.length);
    
    // Log each user's email (without password)
    allUsers.documents.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user.$id,
        email: user.email,
        name: user.name
      });
    });
    
    return NextResponse.json({
      success: true,
      totalUsers: allUsers.documents.length,
      users: allUsers.documents.map(user => ({
        id: user.$id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }))
    });
    
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.type || 'unknown'
    }, { status: 500 });
  }
}
