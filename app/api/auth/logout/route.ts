import { NextRequest, NextResponse } from 'next/server';
import { removeTokenCookie } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    // Remove token cookie
    return removeTokenCookie(response);
  } catch (error: any) {
    console.error('Logout Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
