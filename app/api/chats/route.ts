import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';

// GET - Get all chats for a user
async function getHandler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const chats = await Chat.find({ userId: request.user?.userId })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt messages')
      .lean();

    // Transform chats to include message count and last message
    const transformedChats = chats.map((chat) => ({
      id: chat._id,
      title: chat.title,
      messageCount: chat.messages?.length || 0,
      lastMessage: chat.messages?.[chat.messages.length - 1]?.content || '',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: { chats: transformedChats },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get Chats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new chat
async function postHandler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { title, message } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create new chat with initial message
    const chat = await Chat.create({
      userId: request.user?.userId,
      title: title || 'New Chat',
      messages: [
        {
          role: 'user',
          content: message,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        data: { chat },
        message: 'Chat created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create Chat Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
