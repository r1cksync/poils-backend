import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, JWTPayload } from '@/lib/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export const withAuth = (
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) => {
  return async (request: NextRequest) => {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Attach user to request
    const authRequest = request as AuthenticatedRequest;
    authRequest.user = user;

    return handler(authRequest);
  };
};

export const withAdmin = (
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) => {
  return async (request: NextRequest) => {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const authRequest = request as AuthenticatedRequest;
    authRequest.user = user;

    return handler(authRequest);
  };
};
