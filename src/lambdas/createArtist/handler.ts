import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../utils/dynamoClient";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const { name } = event.arguments;

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const artistId = uuidv4();
    const now = new Date().toISOString();

    const searchKey = name.toLowerCase().trim().replace(/\s+/g, "-");

    const item = {
        PK: `ARTIST#${artistId}`,
        SK: "METADATA",
        name,
        userId,
        createdAt: now,
        GSI1PK: "ARTIST",
        GSI1SK: searchKey,
    };

    await docClient.send(new PutCommand({ TableName: musicTable, Item: item }));

    return {
        id: artistId,
    };
};
