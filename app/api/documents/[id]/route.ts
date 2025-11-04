import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import { getSignedUrl, deleteFromS3 } from '@/lib/s3';

interface Params {
  params: {
    id: string;
  };
}

// GET - Get a specific document by ID
async function getHandler(request: AuthenticatedRequest, { params }: Params) {
  try {
    await dbConnect();

    const document = await DocumentModel.findOne({
      _id: params.id,
      userId: request.user?.userId,
    }).lean();

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate signed URL for secure access
    const signedUrl = await getSignedUrl(document.s3Key, 3600); // 1 hour expiry

    return NextResponse.json(
      {
        success: true,
        data: {
          document: {
            ...document,
            signedUrl,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get Document Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a document
async function deleteHandler(request: AuthenticatedRequest, { params }: Params) {
  try {
    await dbConnect();

    const document = await DocumentModel.findOne({
      _id: params.id,
      userId: request.user?.userId,
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from S3
    await deleteFromS3(document.s3Key);

    // Delete from database
    await DocumentModel.findByIdAndDelete(params.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Document deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete Document Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const DELETE = withAuth(deleteHandler);
