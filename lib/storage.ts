import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StorageProvider {
  upload(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  createSignedUrl(key: string, download?: boolean, contentType?: string): Promise<string>;
}

function storageConfig() {
  const bucket = process.env.STORAGE_BUCKET?.trim();
  const region = process.env.STORAGE_REGION?.trim();
  const accessKey = process.env.STORAGE_ACCESS_KEY?.trim();
  const secretKey = process.env.STORAGE_SECRET_KEY?.trim();
  if (!bucket || !region || !accessKey || !secretKey) {
    throw new Error('Object storage is not configured. Set STORAGE_REGION, STORAGE_BUCKET, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY.');
  }
  return { bucket, region, accessKey, secretKey, endpoint: process.env.STORAGE_ENDPOINT?.trim() || undefined };
}

function clientAndBucket() {
  const config = storageConfig();
  return {
    bucket: config.bucket,
    client: new S3Client({ region: config.region, endpoint: config.endpoint, forcePathStyle: Boolean(config.endpoint), credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey } }),
  };
}

export const storage: StorageProvider = {
  async upload(key, body, contentType) {
    const { client, bucket } = clientAndBucket();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, ServerSideEncryption: 'AES256' }));
  },
  async delete(key) { const { client, bucket } = clientAndBucket(); await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); },
  async exists(key) {
    try { const { client, bucket } = clientAndBucket(); await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true; } catch { return false; }
  },
  async createSignedUrl(key, download = false, contentType) {
    const { client, bucket } = clientAndBucket();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ...(contentType ? { ResponseContentType: contentType } : {}), ResponseContentDisposition: download ? 'attachment' : 'inline' }), { expiresIn: 300 });
  },
};
