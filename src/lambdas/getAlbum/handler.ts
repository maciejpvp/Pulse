import { docClient } from "../../utils/dynamoClient";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const albumId = event.arguments.albumId;
    console.log("Album ID: ", albumId);
    console.log("Arguments: ", event.arguments);
    console.log("Source: ", event.source);

    const response = await docClient.send(new GetCommand({
        TableName: musicTable,
        Key: {
            PK: `ALBUM#${albumId}`,
            SK: "METADATA",
        },
    }));

    const item = response.Item || {};

    console.log(item);

    const album = {
        id: item.PK.replace("ALBUM#", ""),
        name: item.name,
        artist: {
            id: item.artistId,
        },
    };

    return album;
};


