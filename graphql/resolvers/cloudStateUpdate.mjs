import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const { attributes, version } = ctx.arguments.input;
    const userId = ctx.identity?.sub;

    if (!userId) {
        util.error("Unauthorized", "Unauthorized");
    }

    const defaults = {
        primeDeviceId: "none",
        trackId: "none",
        trackArtistId: "none",
        isPlaying: false,
        positionMs: "0",
        positionUpdatedAt: util.time.nowISO8601(),
        repeatMode: "none",
        shuffleMode: "OFF",
        volume: 50
    };

    const updateExpressions = [];
    const expressionValues = {};
    const expressionNames = {};

    // 1. Handle CloudState attributes (with defaults if missing in DB)
    const allKeys = Object.keys({ ...defaults, ...attributes });
    for (const key of allKeys) {
        const userValue = attributes[key];
        const defaultValue = defaults[key];

        expressionNames[`#${key}`] = key;

        if (userValue !== undefined) {
            // If user provided a value, set it directly
            updateExpressions.push(`#${key} = :${key}`);
            expressionValues[`:${key}`] = util.dynamodb.toDynamoDB(userValue);
        } else if (defaultValue !== undefined) {
            // If user didn't provide it, only set it if it doesn't exist in DynamoDB
            updateExpressions.push(`#${key} = if_not_exists(#${key}, :default_${key})`);
            expressionValues[`:default_${key}`] = util.dynamodb.toDynamoDB(defaultValue);
        }
    }

    // 2. Handle Versioning
    expressionNames['#version'] = 'version';
    updateExpressions.push('#version = if_not_exists(#version, :zero) + :one');
    expressionValues[':zero'] = util.dynamodb.toDynamoDB(0);
    expressionValues[':one'] = util.dynamodb.toDynamoDB(1);

    const update = {
        operation: 'UpdateItem',
        key: util.dynamodb.toMapValues({ PK: `USER#${userId}`, SK: 'CLOUDSTATE' }),
        update: {
            expression: `SET ${updateExpressions.join(', ')}`,
            expressionNames,
            expressionValues,
        },
    };

    // 3. Conditional update based on version if provided
    if (version !== undefined) {
        update.condition = {
            expression: 'attribute_not_exists(#version) OR #version = :expectedVersion',
            expressionNames: { '#version': 'version' },
            expressionValues: { ':expectedVersion': util.dynamodb.toDynamoDB(version) },
        };
    }

    return update;
}

export function response(ctx) {
    if (ctx.error) {
        util.error(ctx.error.message, ctx.error.type);
    }
    return true;
}