import { env } from '$env/dynamic/private';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!env.BUCKET_ENDPOINT) throw new Error('BUCKET_ENDPOINT is not set');
if (!env.BUCKET_ACCESS_KEY_ID) throw new Error('BUCKET_ACCESS_KEY_ID is not set');
if (!env.BUCKET_SECRET_ACCESS_KEY) throw new Error('BUCKET_SECRET_ACCESS_KEY is not set');
if (!env.BUCKET_NAME) throw new Error('BUCKET_NAME is not set');

class Bucket {
	readonly prefix = 'profilepicture';

	constructor(
		private s3: S3Client,
		private bucketName: string
	) {}

	async getPutSignedURL(filename: string) {
		const url = await getSignedUrl(
			this.s3,
			new PutObjectCommand({ Bucket: this.bucketName, Key: `${this.prefix}/${filename}` }),
			{ expiresIn: 3600 }
		);
		return new URL(url);
	}

	async upload(filename: string, file: File) {
		const url = await this.getPutSignedURL(filename);
		const response = await fetch(url, { method: 'PUT', body: file });
		if (!response.ok) error(await response.text());
	}
}

function error(message: string): never {
	const e = new Error(message);
	e.name = 'BucketError';
	throw e;
}

const s3 = new S3Client({
	region: env.BUCKET_REGION ?? 'auto',
	endpoint: env.BUCKET_ENDPOINT,
	credentials: {
		accessKeyId: env.BUCKET_ACCESS_KEY_ID,
		secretAccessKey: env.BUCKET_SECRET_ACCESS_KEY
	}
});

export const bucket = new Bucket(s3, env.BUCKET_NAME);
