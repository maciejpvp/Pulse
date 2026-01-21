import { docClient } from "../../utils/dynamoClient";
import { UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import * as Joi from "joi";

type Props = {
    userId: string;
    deviceId: string;
    metadata: {
        name: string;
        type: "DESKTOP" | "MOBILE" | "TV";
    };
}

export const generateUpdateDeviceMetadataCommand = (props: Props): UpdateCommandInput => {
    validateProps(props);
    const epochMs = Date.now();
    const epochSeconds = Math.floor(epochMs / 1000);

    const deviceMetadata = {
        name: props.metadata.name,
        type: props.metadata.type,
        updated_at: epochSeconds,
        ttl: epochSeconds + 24 * 60 * 60, // 24 hours
    };

    return {
        TableName: process.env.musicTable!,
        Key: {
            PK: `USER#${props.userId}`,
            SK: `DEVICE#${props.deviceId}`,
        },
        UpdateExpression: "SET #name = :name, #type = :type, #updated_at = :updated_at, #ttl = :ttl",
        ExpressionAttributeNames: {
            "#name": "name",
            "#type": "type",
            "#updated_at": "updated_at",
            "#ttl": "ttl",
        },
        ExpressionAttributeValues: {
            ":name": deviceMetadata.name,
            ":type": deviceMetadata.type,
            ":updated_at": deviceMetadata.updated_at,
            ":ttl": deviceMetadata.ttl,
        },
    };
}

export const updateDeviceMetadata = async (props: Props) => {
    const commandInput = generateUpdateDeviceMetadataCommand(props);
    return docClient.send(new UpdateCommand(commandInput));
}

function validateProps(props: Props): void {
    const schema = Joi.object({
        userId: Joi.string().uuid().required(),
        deviceId: Joi.string().required(),
        metadata: Joi.object({
            name: Joi.string().min(1).max(255).required(),
            type: Joi.string().valid("DESKTOP", "MOBILE", "TV").required(),
        }).required(),
    });

    const { error } = schema.validate(props);
    if (error) throw error;
}