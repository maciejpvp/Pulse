import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});
const tableName = process.env.musicTable!;

export const handler = async (event: any) => {
    const { playlistId, songId } = event.arguments;

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const item = {
        PK: { S: `PLAYLIST#${playlistId}` },
        SK: { S: `SONG#${songId}` },
        songId: { S: songId },
        addedAt: { S: new Date().toISOString() },
    };

    await db.send(new PutItemCommand({ TableName: tableName, Item: item }));

    return { playlistId, songId };
};
