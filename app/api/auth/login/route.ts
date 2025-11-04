import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, validateEmail } from '@/lib/auth';
import { generateToken, setTokenCookie } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    console.log('Login request received');
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;
    console.log('Login attempt for email:', email);

    // Validation
    if (!email || !password) {
      console.log('Validation failed: missing fields');
      return NextResponse.json(
        { success: false, error: 'Please provide email and password' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      console.log('Validation failed: invalid email');
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email' },
        { status: 400 }
      );
    }

    // Find user with password field
    console.log('Finding user...');
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Login successful for:', email);

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Create response with user data
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
        message: 'Login successful',
      },
      { status: 200 }
    );

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Set token in cookie
    return setTokenCookie(response, token);
  } catch (error: any) {
    console.error('Login Error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
