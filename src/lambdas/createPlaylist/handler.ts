import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../utils/dynamoClient";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import slugify from "slugify";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const { name } = event.arguments;

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const id = uuidv4();
    const now = new Date().toISOString();

    const slug = slugify(name);

    const item = {
        PK: `PLAYLIST#${id}`,
        SK: "METADATA",
        name,
        creatorId: userId,
        createdAt: now,
        visibility: "PUBLIC", // For now only public playlists are supported 
        GSI1PK: "PLAYLIST",
        GSI1SK: slug,
    };

    await docClient.send(new PutCommand({ TableName: musicTable, Item: item }));

    const playlistItem = {
        id,
        name,
        songs: [],
        creator: {
            id: userId,
        },
        createdAt: now,
        visibility: "PUBLIC",
    }

    return playlistItem;
};

