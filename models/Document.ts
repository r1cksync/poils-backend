import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  chatId?: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  processedData?: any;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
    },
    s3Url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    extractedText: {
      type: String,
    },
    processedData: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ status: 1 });

const DocumentModel: Model<IDocument> = 
  mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default DocumentModel;
