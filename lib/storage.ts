import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StorageProvider {
  upload(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  createSignedUrl(key: string, download?: boolean, contentType?: string): Promise<string>;
}

const client = new S3Client({
  region: process.env.STORAGE_REGION || 'auto',
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.STORAGE_ENDPOINT),
  credentials: process.env.STORAGE_ACCESS_KEY ? { accessKeyId: process.env.STORAGE_ACCESS_KEY, secretAccessKey: process.env.STORAGE_SECRET_KEY || '' } : undefined,
});
const bucket = process.env.STORAGE_BUCKET || 'nattavault';

export const storage: StorageProvider = {
  async upload(key, body, contentType) {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, ServerSideEncryption: 'AES256' }));
  },
  async delete(key) { await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); },
  async exists(key) { try { await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true; } catch { return false; } },
  async createSignedUrl(key, download = false, contentType) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(contentType ? { ResponseContentType: contentType } : {}),
      ResponseContentDisposition: download ? 'attachment' : 'inline',
    });
    return getSignedUrl(client, command, { expiresIn: 300 });
  },
};
