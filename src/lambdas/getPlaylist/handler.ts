import { docClient } from "../../utils/dynamoClient";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const playlistId = event.arguments.playlistId;
    console.log("Playlist ID: ", playlistId);
    console.log("Arguments: ", event.arguments);
    console.log("Source: ", event.source);

    const response = await docClient.send(new GetCommand({
        TableName: musicTable,
        Key: {
            PK: `PLAYLIST#${playlistId}`,
            SK: "METADATA",
        },
    }));

    const item = response.Item || {};

    console.log(item);

    const playlist = {
        id: item.PK.replace("PLAYLIST#", ""),
        name: item.name,
        creator: {
            id: item.creatorId,
        },
        createdAt: item.createdAt,
        visibility: item.visibility,
    };

    return playlist;
};

