import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import axios from 'axios';

interface Params {
  params: {
    id: string;
  };
}

// POST - Send a message to Python backend and get response
async function postHandler(request: AuthenticatedRequest, { params }: Params) {
  try {
    await dbConnect();

    const body = await request.json();
    const { message, documentId } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Find the chat
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

    // Add user message to chat
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // TODO: Call Python backend for RAG response
    // For now, we'll create a placeholder response
    // In production, uncomment and configure this:
    /*
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await axios.post(`${pythonBackendUrl}/api/chat`, {
      message,
      chatId: params.id,
      documentId,
      userId: request.user?.userId,
    });
    const assistantMessage = response.data.message;
    */

    // Placeholder response (remove when Python backend is ready)
    const assistantMessage = 
      'This is a placeholder response. The Python backend will provide RAG-based responses and OCR text extraction once implemented.';

    // Add assistant response to chat
    chat.messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date(),
    });

    await chat.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          message: assistantMessage,
          chat,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Send Message Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);
