import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const { playlistId, songId } = event.arguments;

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    await docClient.send(new DeleteCommand({
        TableName: musicTable, Key: {
            PK: `PLAYLIST#${playlistId}`,
            SK: `SONG#${songId}`,
        }
    }));

    return { playlistId, songId };
};
