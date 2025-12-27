import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Event } from "aws-lambda";
import sharp from "sharp";
import { docClient } from "../../utils/dynamoClient";

const s3 = new S3Client({});
const musicTable = process.env.musicTable!;

export const handler = async (event: S3Event) => {
    const results = [];

    for (const record of event.Records) {
        try {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

            // 1. Prevent infinite loops and ignore non-raw files
            if (!key.startsWith("raw/")) {
                console.log(`Skipping non-raw file: ${key}`);
                continue;
            }

            // 2. Fetch object (Metadata is included in the response)
            const response = await s3.send(
                new GetObjectCommand({ Bucket: bucket, Key: key })
            );

            if (!response.Body) {
                throw new Error(`Empty body for key: ${key}`);
            }

            const artistId = response.Metadata?.artistid;
            if (!artistId) {
                console.warn(`No artistId found in metadata for: ${key}`);
            }

            // 3. Convert stream to Buffer using built-in SDK v3 methods
            const byteArray = await response.Body.transformToByteArray();
            const buffer = Buffer.from(byteArray);

            // 4. Image Processing
            const optimizedBuffer = await sharp(buffer)
                .rotate()
                .resize(128, 128, { fit: "cover", withoutEnlargement: true })
                .webp({ quality: 70 })
                .toBuffer();

            const processedKey = key
                .replace(/^raw\//, "processed/")
                .replace(/\.[^.]+$/, "") + ".webp";

            // 5. Upload Optimized Image
            await s3.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: processedKey,
                    Body: optimizedBuffer,
                    ContentType: "image/webp",
                    CacheControl: "public, max-age=31536000, immutable",
                })
            );

            // 6. Update DynamoDB
            if (artistId) {
                await docClient.send(
                    new UpdateCommand({
                        TableName: musicTable,
                        Key: {
                            PK: `ARTIST#${artistId}`,
                            SK: "METADATA",
                        },
                        UpdateExpression: `
                            SET avatarUrl = :url,
                                avatarStatus = :status,
                                avatarUpdatedAt = :now
                        `,
                        ExpressionAttributeValues: {
                            ":url": processedKey,
                            ":status": "UPLOADED",
                            ":now": Date.now(),
                        },
                    })
                );
            }

            // 7. Delete raw image
            await s3.send(
                new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: key,
                })
            );

            results.push({ status: "success", key });
        } catch (error) {
            console.error(`Error processing record ${record.s3.object.key}:`, error);
            results.push({ status: "failed", key: record.s3.object.key });
        }
    }

    return results;
};