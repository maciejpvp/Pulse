import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { docClient } from "../../utils/dynamoClient";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

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
        const albumId = meta.albumid;

        if (!artistId || !title) {
            console.error("Missing required S3 metadata", meta);
            continue; // skip this record
        }

        const songId = uuidv4();

        const searchKey = title.toLowerCase().trim().replace(/\s+/g, "-");

        const item = {
            PK: `ARTIST#${artistId}`,
            SK: `SONG#${songId}`,
            title: title,
            fileKey: key,
            albumId: albumId ?? undefined,
            GSI1PK: "SONG",
            GSI1SK: searchKey,
        };

        await docClient.send(
            new PutCommand({
                TableName: musicTable,
                Item: item,
            })
        );

    }
};
