import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const musicTable = process.env.musicTable!;

export const checkIsItemBookmarked = async (userId: string, itemId: string): Promise<boolean> => {
    const response = await docClient.send(new GetCommand({
        TableName: musicTable,
        Key: {
            PK: `USER#${userId}`,
            SK: `BOOKMARK#${itemId}`,
        },
    }));
    const item = response.Item || {};
    console.log("Item: ", item);
    return item.PK !== undefined;
}

