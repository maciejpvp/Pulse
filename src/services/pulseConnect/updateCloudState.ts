import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../utils/dynamoClient';

const musicTable = process.env.musicTable!;

const DEFAULT_VALUES = {
    primeDeviceId: "none",
    trackId: "none",
    isPlaying: false,
    positionMs: 0,
    repeatMode: "none",
    shuffleMode: "OFF",
    volume: 50,
    version: 0
};

type UpdateCloudStateParams = {
    userId: string;
    version?: number;
    attributes: {
        primeDeviceId?: string;
        trackId?: string;
        isPlaying?: boolean;
        positionMs?: string;
        positionUpdatedAt?: string;
        repeatMode?: string;
        shuffleMode?: string;
        volume?: number;
    }
}

export const generateUpdateCloudStateCommand = async (params: UpdateCloudStateParams): Promise<UpdateCommandInput> => {
    if (!params.userId) throw new Error("userId is required");
    if (Object.keys(params.attributes).length === 0) throw new Error("No attributes provided");

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Combine default keys and user provided keys to ensure all are handled
    // Exclude 'version' from manual attribute handling as it's handled separately
    const allKeys = new Set([...Object.keys(DEFAULT_VALUES), ...Object.keys(params.attributes)]);
    allKeys.delete('version');

    allKeys.forEach((key) => {
        const userValue = (params.attributes as any)[key];
        const defaultValue = (DEFAULT_VALUES as any)[key];

        expressionAttributeNames[`#${key}`] = key;

        if (userValue !== undefined) {
            // If user provided it, update it directly
            updateExpressions.push(`#${key} = :${key}`);
            expressionAttributeValues[`:${key}`] = userValue;
        } else if (defaultValue !== undefined) {
            // If missing but has a default, use if_not_exists to set the default only if it doesn't exist
            updateExpressions.push(`#${key} = if_not_exists(#${key}, :default_${key})`);
            expressionAttributeValues[`:default_${key}`] = defaultValue;
        }
    });

    // Handle version increment
    expressionAttributeNames["#version"] = "version";
    updateExpressions.push("#version = if_not_exists(#version, :zero) + :one");
    expressionAttributeValues[":zero"] = 0;
    expressionAttributeValues[":one"] = 1;

    const updateExpression = "SET " + updateExpressions.join(", ");

    const commandInput: UpdateCommandInput = {
        TableName: musicTable,
        Key: {
            PK: `USER#${params.userId}`,
            SK: `CLOUDSTATE`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    };

    if (params.version !== undefined) {
        commandInput.ConditionExpression = "attribute_not_exists(#version) OR #version = :version";
        expressionAttributeValues[":version"] = params.version;
    }

    return commandInput;
}

export const updateCloudState = async (commandInput: UpdateCommandInput) => {
    try {
        return await docClient.send(new UpdateCommand(commandInput));
    } catch (error) {
        console.error("Error updating cloud state:", error);
        throw new Error("Failed to update cloud state");
    }
}
