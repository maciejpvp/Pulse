import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const { playlistId, songId, songArtistId } = event.arguments;

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const item = {
        PK: `PLAYLIST#${playlistId}`,
        SK: `SONG#${songId}`,
        songId,
        songArtistId,
        addedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: musicTable, Item: item }));

    return { playlistId, songId };
};
