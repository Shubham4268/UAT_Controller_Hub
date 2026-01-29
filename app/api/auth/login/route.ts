import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { connectDB } from '@/lib/db/mongo';
import { signJWT } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/auth';
import { successResponse, errorResponse } from '@/utils/apiResponse';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return errorResponse('Username and password are required', 400);
    }

    await connectDB();

    // Normalize username for case-insensitive login
    const normalizedUsername = username.trim().toLowerCase();

    // Look up user by normalized username and explicitly select password
    const user = await User.findOne({ username: normalizedUsername }).select('+password');

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const isValid = await bcrypt.compare(password, user.password!);

    if (!isValid) {
      return errorResponse('Invalid credentials', 401);
    }

    // Generate token
    const token = await signJWT({
      userId: user._id.toString(),
      role: user.role,
      username: user.username,
      name: user.name,
      image: user.image,
    });

    // Set cookie
    await setAuthCookie(token);

    // Return user info (excluding password)
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return successResponse({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
