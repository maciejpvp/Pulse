import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const userId = ctx.identity?.sub;
    const input = ctx.arguments.input;

    if (!userId) {
        util.error("Unauthorized", "Unauthorized");
    }

    validateProps({ userId, ...input });

    const epochSeconds = Math.floor(util.time.nowEpochMilliSeconds() / 1000);
    const ttl = epochSeconds + 24 * 60 * 60; // 24 hours

    return {
        operation: "UpdateItem",
        key: util.dynamodb.toMapValues({
            PK: `USER#${userId}`,
            SK: `DEVICE#${input.deviceId}`,
        }),
        update: {
            expression: "SET #name = :name, #type = :type, #updated_at = :updated_at, #ttl = :ttl",
            expressionNames: {
                "#name": "name",
                "#type": "type",
                "#updated_at": "updated_at",
                "#ttl": "ttl",
            },
            expressionValues: util.dynamodb.toMapValues({
                ":name": input.name,
                ":type": input.type,
                ":updated_at": epochSeconds,
                ":ttl": ttl,
            }),
        },
    };
}

export function response(ctx) {
    if (ctx.error) {
        util.error(ctx.error.message, ctx.error.type);
    }
    return true;
}
function validateProps(props) {
    const { userId, deviceId, name, type } = props;

    if (!userId || typeof userId !== 'string') {
        util.error("Invalid userId", "ValidationError");
    }
    if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 1 || deviceId.length > 100) {
        util.error("Invalid deviceId", "ValidationError");
    }
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
        util.error("Invalid name", "ValidationError");
    }
    const validTypes = ["DESKTOP", "MOBILE", "TV"];
    if (!type || !validTypes.includes(type)) {
        util.error("Invalid type", "ValidationError");
    }
}