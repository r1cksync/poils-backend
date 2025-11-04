import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import { uploadToS3 } from '@/lib/s3';

// GET - Get all documents for a user
async function getHandler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const documents = await DocumentModel.find({ userId: request.user?.userId })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: { documents },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get Documents Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload a new document
async function postHandler(request: AuthenticatedRequest) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type (allow images and PDFs)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images and PDFs are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const uploadResult = await uploadToS3(
      buffer,
      file.name,
      file.type,
      request.user!.userId
    );

    // Create document record in database
    const document = await DocumentModel.create({
      userId: request.user?.userId,
      chatId: chatId || undefined,
      fileName: uploadResult.key,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      s3Key: uploadResult.key,
      s3Url: uploadResult.url,
      status: 'pending',
    });

    // TODO: Send to Python backend for OCR processing
    // Uncomment when Python backend is ready:
    /*
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    await axios.post(`${pythonBackendUrl}/api/ocr/process`, {
      documentId: document._id,
      s3Key: uploadResult.key,
      userId: request.user?.userId,
    });
    */

    return NextResponse.json(
      {
        success: true,
        data: { document },
        message: 'Document uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload Document Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
