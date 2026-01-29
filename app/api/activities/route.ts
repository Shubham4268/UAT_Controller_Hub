import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Activity from '@/models/Activity';
import { getAuthUser } from '@/lib/auth/auth';
import { ROLES } from '@/config/roles';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  return mongoose.connect(MONGODB_URI);
}

export async function GET() {
  try {
    await connectToDatabase();
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = {};

    // Role-based filtering
    if (user.role === ROLES.TESTER) {
      // Testers only see active activities
      // Status 'in-progress' usually implies active. 
      // The prompt said "View all active test activities".
      // I'll assume active means pending or in-progress.
      query = {
        status: { $in: ['pending', 'in-progress'] },
        archivedAt: { $exists: false }
      };
    } else if (user.role === ROLES.LEAD || user.role === ROLES.ADMIN) {
      // Leads/Admins see all non-archived by default
      query = { archivedAt: { $exists: false } };
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activities = await Activity.find(query).sort({ createdAt: -1 });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Lead or Admin can create
    if (user.role !== ROLES.LEAD && user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Basic validation
    if (!body.title || !body.type) {
      return NextResponse.json({ error: 'Title and Type are required' }, { status: 400 });
    }

    const activity = await Activity.create({
      ...body,
      status: 'pending', // Default status
    });

    return NextResponse.json(activity, { status: 201 });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
