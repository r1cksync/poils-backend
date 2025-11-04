import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
};

const s3 = new AWS.S3(s3Config);
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'hindi-ocr-documents';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export const uploadToS3 = async (
  file: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<UploadResult> => {
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${userId}/${uuidv4()}.${fileExtension}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: uniqueFileName,
    Body: file,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
  };

  try {
    const result = await s3.upload(params).promise();
    
    return {
      key: uniqueFileName,
      url: result.Location,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export const getSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };

  try {
    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('S3 Signed URL Error:', error);
    throw new Error('Failed to generate signed URL');
  }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export const listUserFiles = async (userId: string): Promise<AWS.S3.Object[]> => {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: `${userId}/`,
  };

  try {
    const result = await s3.listObjectsV2(params).promise();
    return result.Contents || [];
  } catch (error) {
    console.error('S3 List Error:', error);
    throw new Error('Failed to list files from S3');
  }
};
