import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { docClient } from "../../utils/dynamoClient";

const musicTable = process.env.musicTable!;
const musicBucket = process.env.songsBucket!;
const urlTTL = 60;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized");

    const { artistId, songId } = event.arguments.input;
    if (!artistId || !songId) throw new Error("artistId and songId are required");

    const response = await docClient.send(
        new GetCommand({
            TableName: musicTable,
            Key: {
                PK: `ARTIST#${artistId}`,
                SK: `SONG#${songId}`,
            },
        })
    );

    if (!response.Item) throw new Error("Song not found");

    const fileKey = response.Item.fileKey;
    if (!fileKey) throw new Error("fileKey missing for song");

    const s3 = new S3Client({});
    const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: musicBucket,
            Key: fileKey,
        }),
        { expiresIn: urlTTL }
    );

    return url;
};
