import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const db = new DynamoDBClient();
const s3 = new S3Client();
const songsTable = process.env.songsTable!;

export const handler = async (event: any) => {
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;

        const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        const artist = head.Metadata?.artist || "Unknown Artist";
        const title = head.Metadata?.title || "Unknown Title";

        const id = uuidv4();

        await db.send(
            new PutItemCommand({
                TableName: songsTable,
                Item: {
                    id: { S: id },
                    title: { S: title },
                    artist: { S: artist },
                    fileKey: { S: key },
                },
            })
        );

        console.log(`Saved song metadata: ${title} by ${artist}, id: ${id}`);
    }
};
