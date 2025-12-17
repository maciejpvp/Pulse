import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../utils/dynamoClient";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const { name, artistId } = event.arguments;

    const albumId = uuidv4();
    const now = new Date().toISOString();

    const item = {
        PK: `ARTIST#${artistId}`,
        SK: `ALBUM#${albumId}`,
        name,
    };

    await docClient.send(new PutCommand({ TableName: musicTable, Item: item }));

    return {
        id: albumId,
        name,
        artist: {
            id: artistId,
        },
        songs: [],
    };
};

