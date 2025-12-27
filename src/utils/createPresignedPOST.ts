import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost, PresignedPostOptions } from "@aws-sdk/s3-presigned-post";

const s3 = new S3Client({});

interface PresignedPostArgs {
    bucket: string;
    key: string;
    maxSizeBytes?: number;
    expiresSeconds?: number;
    contentType?: string;
    metadata?: Record<string, string>;
}

/**
 * @param bucket - S3 bucket name
 * @param key - S3 object key
 * @param maxSizeBytes - Maximum file size in bytes (default 10MB)
 * @param expiresSeconds - Expiration time in seconds (default 10 minutes)
 * @param contentType - Content type of the file (default "image/")
 * @param metadata - Custom key-value pairs to store as S3 metadata
 * @returns Object containing the presigned post url and the key 
 */
export async function createGenericPresignedPost({
    bucket,
    key,
    maxSizeBytes = 10 * 1024 * 1024,
    expiresSeconds = 600,
    contentType = "image/",
    metadata = {},
}: PresignedPostArgs) {

    // Format metadata keys to include the required 'x-amz-meta-' prefix
    const metadataFields: Record<string, string> = {};
    const metadataConditions: any[] = [];

    Object.entries(metadata).forEach(([k, v]) => {
        const metaKey = `x-amz-meta-${k.toLowerCase()}`;
        metadataFields[metaKey] = v;
        metadataConditions.push(["eq", `$${metaKey}`, v]);
    });

    const options: PresignedPostOptions = {
        Bucket: bucket,
        Key: key,
        Expires: expiresSeconds,
        Conditions: [
            ["content-length-range", 0, maxSizeBytes],
            ["starts-with", "$Content-Type", contentType],
            ...metadataConditions,
        ],
        Fields: {
            ...metadataFields,
        },
    };

    const post = await createPresignedPost(s3, options);

    const fields = JSON.stringify(post.fields);

    return {
        uploadUrl: post.url,
        fields,
        key,
    };
}