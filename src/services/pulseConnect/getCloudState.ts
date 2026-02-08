import { GetCommand, GetCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

export const getCloudState = async (userId: string) => {
    const commandInput: GetCommandInput = {
        TableName: process.env.musicTable!,
        Key: {
            PK: `USER#${userId}`,
            SK: `CLOUDSTATE`,
        },
    };

    const command = new GetCommand(commandInput);
    const response = await docClient.send(command);

    const item = response.Item;
    if (!item) throw new Error("Cloud state not found");

    return item;
}