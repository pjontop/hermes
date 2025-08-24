import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { databases, DATABASE_ID, USERS_COLLECTION_ID, ID } from './appwrite.js';
import { Query } from 'appwrite';

const JWT_SECRET = process.env.JWT_SECRET || 'skibikey';

export interface User {
  $id: string;
  email: string;
  name: string;
  signupStep: number;
  password?: string;
  smashPattern?: string;
  typingSpeedProfile?: {
    averageSpeed: number;
    speedVariance: number;
    keyTimingProfile: number[];
    sampleCount: number;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const createUser = async (email: string, password: string, name: string): Promise<User> => {
  console.log('Creating user with email:', email);
  
  // Check if user already exists
  console.log('Checking for existing user...');
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    console.log('User already exists with email:', email);
    const error = new Error('User already exists') as any;
    error.code = 409;
    throw error;
  }
  console.log('No existing user found, proceeding with creation...');
  
  const hashedPassword = await hashPassword(password);
  console.log('Password hashed successfully');
  
  console.log('Creating document in database...');
  console.log('Database ID:', DATABASE_ID);
  console.log('Collection ID:', USERS_COLLECTION_ID);
  
  const user = await databases.createDocument(
    DATABASE_ID!,
    USERS_COLLECTION_ID!,
    ID.unique(),
    {
      email: email.toLowerCase().trim(), // Normalize email
      password: hashedPassword,
      name: name.trim(),
      signupStep: 1, // Initial signup step
      createdAt: new Date()
    }
  );

  console.log('User created successfully:', { id: user.$id, email: user.email, name: user.name });
  
  return {
    $id: user.$id,
    email: user.email,
    name: user.name,
    signupStep: user.signupStep
  };
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Searching for user with email:', normalizedEmail);
    console.log('Database ID:', DATABASE_ID);
    console.log('Collection ID:', USERS_COLLECTION_ID);
    
    const response = await databases.listDocuments(
      DATABASE_ID!,
      USERS_COLLECTION_ID!,
      [
        Query.equal('email', normalizedEmail)
      ]
    );

    console.log('Database query response:', response.documents.length, 'documents found');
    
    if (response.documents.length === 0) {
      console.log('No user found with email:', normalizedEmail);
      return null;
    }

    const user = response.documents[0];
    console.log('User found:', { id: user.$id, email: user.email, name: user.name });
    
    return {
      $id: user.$id,
      email: user.email,
      name: user.name,
      signupStep: user.signupStep || 1, // Default to step 1 for existing users
      password: user.password
    };
  } catch (error) {
    console.error('getUserByEmail error:', error);
    return null;
  }
};

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  console.log('authenticateUser called for:', email);
  
  const user = await getUserByEmail(email);
  if (!user) {
    console.log('User not found for email:', email);
    return null;
  }
  
  if (!user.password) {
    console.log('User found but no password stored');
    return null;
  }

  console.log('Verifying password...');
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    console.log('Password verification failed');
    return null;
  }

  console.log('Password verified successfully');
  return {
    $id: user.$id,
    email: user.email,
    name: user.name,
    signupStep: user.signupStep || 1 // Default to step 1 for existing users
  };
};

export const hashSmashPattern = async (pattern: string): Promise<string> => {
  return bcrypt.hash(pattern.toLowerCase().trim(), 10);
};

export const verifySmashPattern = async (pattern: string, hashedPattern: string): Promise<boolean> => {
  return bcrypt.compare(pattern.toLowerCase().trim(), hashedPattern);
};

export const setUserSmashPattern = async (userId: string, pattern: string): Promise<boolean> => {
  try {
    const hashedPattern = await hashSmashPattern(pattern);
    
    await databases.updateDocument(
      DATABASE_ID!,
      USERS_COLLECTION_ID!,
      userId,
      {
        smashPattern: hashedPattern,
        signupStep: 3 // Mark as completed signup
      }
    );
    
    console.log('Smash pattern set and signup completed for user:', userId);
    return true;
  } catch (error) {
    console.error('Error setting smash pattern:', error);
    return false;
  }
};

export const verifyUserSmashPattern = async (userId: string, pattern: string): Promise<boolean> => {
  try {
    const user = await databases.getDocument(DATABASE_ID!, USERS_COLLECTION_ID!, userId);
    
    if (!user.smashPattern) {
      console.log('No smash pattern set for user');
      return false;
    }
    
    const isValid = await verifySmashPattern(pattern, user.smashPattern);
    console.log('Smash pattern verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error verifying smash pattern:', error);
    return false;
  }
};

export const userHasSmashPattern = async (userId: string): Promise<boolean> => {
  try {
    const user = await databases.getDocument(DATABASE_ID!, USERS_COLLECTION_ID!, userId);
    return !!user.smashPattern;
  } catch (error) {
    console.error('Error checking smash pattern:', error);
    return false;
  }
};

// Typing speed and pattern analysis functions
export const storeTypingProfile = async (
  userId: string, 
  typingData: {
    averageSpeed: number;
    speedVariance: number;
    keyTimingProfile: number[];
  }
): Promise<boolean> => {
  try {
    const user = await databases.getDocument(DATABASE_ID!, USERS_COLLECTION_ID!, userId);
    
    // Update or create typing profile
    const currentProfile = user.typingSpeedProfile || { sampleCount: 0 };
    const newSampleCount = currentProfile.sampleCount + 1;
    
    // Calculate weighted average for more samples
    const weight = Math.min(newSampleCount, 10) / newSampleCount; // Limit influence of new samples
    
    const updatedProfile = {
      averageSpeed: currentProfile.averageSpeed 
        ? (currentProfile.averageSpeed * (1 - weight)) + (typingData.averageSpeed * weight)
        : typingData.averageSpeed,
      speedVariance: currentProfile.speedVariance
        ? (currentProfile.speedVariance * (1 - weight)) + (typingData.speedVariance * weight)
        : typingData.speedVariance,
      keyTimingProfile: typingData.keyTimingProfile, // Store latest timing profile
      sampleCount: newSampleCount
    };

    await databases.updateDocument(
      DATABASE_ID!,
      USERS_COLLECTION_ID!,
      userId,
      { typingSpeedProfile: JSON.stringify(updatedProfile) }
    );

    console.log('Typing profile updated for user:', userId);
    return true;
  } catch (error) {
    console.error('Error storing typing profile:', error);
    return false;
  }
};

export const verifyTypingPattern = async (
  userId: string,
  currentTypingData: {
    averageSpeed: number;
    speedVariance: number;
    keyTimingProfile: number[];
  }
): Promise<{ isValid: boolean; confidence: number }> => {
  try {
    const user = await databases.getDocument(DATABASE_ID!, USERS_COLLECTION_ID!, userId);
    
    if (!user.typingSpeedProfile) {
      console.log('No typing profile stored for user');
      return { isValid: true, confidence: 0.5 }; // Default pass for new users
    }

    const storedProfile = JSON.parse(user.typingSpeedProfile);
    
    // Speed verification (allow ±30% variance)
    const speedDifference = Math.abs(currentTypingData.averageSpeed - storedProfile.averageSpeed);
    const speedTolerance = storedProfile.averageSpeed * 0.3;
    const speedMatch = speedDifference <= speedTolerance;
    
    // Variance verification (allow ±50% variance)
    const varianceDifference = Math.abs(currentTypingData.speedVariance - storedProfile.speedVariance);
    const varianceTolerance = storedProfile.speedVariance * 0.5;
    const varianceMatch = varianceDifference <= varianceTolerance;
    
    // Calculate confidence score (0-1)
    const speedConfidence = Math.max(0, 1 - (speedDifference / speedTolerance));
    const varianceConfidence = Math.max(0, 1 - (varianceDifference / varianceTolerance));
    const overallConfidence = (speedConfidence + varianceConfidence) / 2;
    
    // Consider it valid if confidence > 0.3 (fairly lenient)
    const isValid = overallConfidence > 0.3;
    
    console.log('Typing pattern verification:', {
      speedMatch,
      varianceMatch,
      overallConfidence,
      isValid
    });
    
    return { isValid, confidence: overallConfidence };
  } catch (error) {
    console.error('Error verifying typing pattern:', error);
    return { isValid: true, confidence: 0.5 }; // Default pass on error
  }
};

export const getTypingProfile = async (userId: string) => {
  try {
    const user = await databases.getDocument(DATABASE_ID!, USERS_COLLECTION_ID!, userId);
    return user.typingSpeedProfile ? JSON.parse(user.typingSpeedProfile) : null;
  } catch (error) {
    console.error('Error getting typing profile:', error);
    return null;
  }
};

// Update user signup step
export const updateUserSignupStep = async (userId: string, step: number): Promise<boolean> => {
  try {
    await databases.updateDocument(
      DATABASE_ID!,
      USERS_COLLECTION_ID!,
      userId,
      { signupStep: step }
    );
    console.log(`User ${userId} signup step updated to ${step}`);
    return true;
  } catch (error) {
    console.error('Error updating signup step:', error);
    return false;
  }
};

// Get user signup step
export const getUserSignupStep = async (userId: string): Promise<number | null> => {
  try {
    const user = await databases.getDocument(DATABASE_ID!, USERS_COLLECTION_ID!, userId);
    return user.signupStep || 1;
  } catch (error) {
    console.error('Error getting user signup step:', error);
    return null;
  }
};





