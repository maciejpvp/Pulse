import { docClient } from "../../utils/dynamoClient";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const { albumId, artistId } = event.arguments.input;

    const response = await docClient.send(new GetCommand({
        TableName: musicTable,
        Key: {
            PK: `ARTIST#${artistId}`,
            SK: `ALBUM#${albumId}`,
        },
    }));

    const item = response.Item || {};

    console.log(item);

    const album = {
        id: item.SK.split("#")[1],
        name: item.name,
        artist: {
            id: item.PK.split("#")[1],
        },
    };

    return album;
};


