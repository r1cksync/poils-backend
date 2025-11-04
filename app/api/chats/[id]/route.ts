import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';

interface Params {
  params: {
    id: string;
  };
}

// GET - Get a specific chat by ID
async function getHandler(request: AuthenticatedRequest, { params }: Params) {
  try {
    await dbConnect();

    const chat = await Chat.findOne({
      _id: params.id,
      userId: request.user?.userId,
    }).lean();

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { chat },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get Chat Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a chat (add message or update title)
async function putHandler(request: AuthenticatedRequest, { params }: Params) {
  try {
    await dbConnect();

    const body = await request.json();
    const { message, title, role } = body;

    const chat = await Chat.findOne({
      _id: params.id,
      userId: request.user?.userId,
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Update title if provided
    if (title) {
      chat.title = title;
    }

    // Add message if provided
    if (message) {
      chat.messages.push({
        role: role || 'user',
        content: message,
        timestamp: new Date(),
      });
    }

    await chat.save();

    return NextResponse.json(
      {
        success: true,
        data: { chat },
        message: 'Chat updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update Chat Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a chat
async function deleteHandler(request: AuthenticatedRequest, { params }: Params) {
  try {
    await dbConnect();

    const chat = await Chat.findOneAndDelete({
      _id: params.id,
      userId: request.user?.userId,
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Chat deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete Chat Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
