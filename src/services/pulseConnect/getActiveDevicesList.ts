import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";
import * as Joi from "joi";

export const getActiveDevicesList = async (userId: string) => {
    validateUserId(userId);

    const commandInput: QueryCommandInput = {
        TableName: process.env.musicTable!,
        KeyConditionExpression: "PK = :userId and begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
            ":userId": `USER#${userId}`,
            ":prefix": "DEVICE#",
        },
    };

    const result = await docClient.send(new QueryCommand(commandInput));

    const items = result.Items || [];

    // filter old devices
    const filteredItems = items.filter(item => {
        const lastSeen = item.updated_at;
        const now = Date.now();
        const now_in_seconds = Math.floor(now / 1000);
        const TEN_MINUTES = 10 * 60;
        const isFresh = now_in_seconds - lastSeen < TEN_MINUTES;

        return isFresh;
    })


    const devices = filteredItems.map(item => ({
        deviceId: item.SK.split("#")[1],
        name: item.name,
        type: item.type,
    }));

    return devices;
}

function validateUserId(userId: string): void {
    const schema = Joi.string().uuid().required();
    const { error } = schema.validate(userId);
    if (error) throw error;
}