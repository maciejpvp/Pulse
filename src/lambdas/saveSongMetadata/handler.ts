import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const db = new DynamoDBClient({});
const s3 = new S3Client({});
const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const { v4: uuidv4 } = await import("uuid");

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;

        const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

        const meta = head.Metadata ?? {};

        const artistId = meta.artistid;
        const title = meta.songtitle;

        if (!artistId || !title) {
            console.error("Missing required S3 metadata", meta);
            continue; // skip this record
        }

        const songId = uuidv4();

        const item = {
            PK: { S: `ARTIST#${artistId}` },
            SK: { S: `SONG#${songId}` },
            title: { S: title },
            fileKey: { S: key },
            // albumId: { S: albumId },
            // duration: { N: duration.toString() },
            // GSI1PK: { S: `ALBUM#${albumId}` },
            // GSI1SK: { S: `SONG#${songId}` },
        };

        await db.send(
            new PutItemCommand({
                TableName: musicTable,
                Item: item,
            })
        );

    }
};
