import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const setTokenCookie = (response: NextResponse, token: string) => {
  const cookie = serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  response.headers.set('Set-Cookie', cookie);
  return response;
};

export const removeTokenCookie = (response: NextResponse) => {
  const cookie = serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  response.headers.set('Set-Cookie', cookie);
  return response;
};

export const getTokenFromRequest = (request: NextRequest): string | null => {
  const cookies = parse(request.headers.get('cookie') || '');
  const token = cookies.token;
  
  if (token) return token;

  // Check Authorization header as fallback
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

export const getUserFromRequest = (request: NextRequest): JWTPayload | null => {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
};
