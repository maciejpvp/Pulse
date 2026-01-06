import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

type Props = {
    stack: Stack;
    stage: string;
};

export const createMusicTable = ({ stack, stage }: Props) => {
    const tableName = `MusicTable-${stage}`;

    const table = new dynamodb.Table(stack, tableName, {
        tableName,
        partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.DESTROY,
        timeToLiveAttribute: "ttl",
    });

    table.addGlobalSecondaryIndex({
        indexName: "SearchIndex",
        partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
        indexName: "GSI2",
        partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
    });

    return table;
};
