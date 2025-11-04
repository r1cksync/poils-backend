import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth';
import { generateToken, setTokenCookie } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    console.log('Signup request received');
    await dbConnect();

    const body = await request.json();
    const { email, password, name } = body;
    console.log('Signup attempt for email:', email);

    // Validation
    if (!email || !password || !name) {
      console.log('Validation failed: missing fields');
      return NextResponse.json(
        { success: false, error: 'Please provide email, password, and name' },
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

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log('Validation failed: weak password');
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await hashPassword(password);

    // Create user
    console.log('Creating user...');
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'user',
    });
    console.log('User created successfully:', user._id);

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
        message: 'User registered successfully',
      },
      { status: 201 }
    );

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Set token in cookie
    return setTokenCookie(response, token);
  } catch (error: any) {
    console.error('Signup Error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
