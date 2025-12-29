import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';
import User, { IUser } from '../models/User';
import connectDB from '../db';

export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
}

export const getUserFromToken = async (token: string): Promise<IUser | null> => {
  try {
    const decoded = verifyToken(token);
    await connectDB();

    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (error) {
    return null;
  }
};

export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

export const authenticateRequest = async (request: NextRequest): Promise<IUser | null> => {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  return getUserFromToken(token);
};

export const requireAuth = async (request: NextRequest): Promise<IUser> => {
  const user = await authenticateRequest(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
};

export const requireAdmin = async (request: NextRequest): Promise<IUser> => {
  const user = await requireAuth(request);

  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }

  return user;
};
