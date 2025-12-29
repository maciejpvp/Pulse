import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const musicTable = process.env.musicTable!;

export const checkPlaylistOwnership = async (playlistId: string, userId: string): Promise<boolean> => {
    const key = {
        PK: `PLAYLIST#${playlistId}`,
        SK: "METADATA"
    }

    const command = new GetCommand({ TableName: musicTable, Key: key });
    const result = await docClient.send(command);

    const item = result.Item;

    console.log("Item: ", item);

    if (!item) return false;

    return item.creatorId === userId;
}