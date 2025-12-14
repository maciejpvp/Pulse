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
    });

    // // GSI for fetching all songs in an album quickly
    table.addGlobalSecondaryIndex({
        indexName: "AlbumSongsIndex",
        partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
    });

    // // // GSI for recently played items per user
    table.addGlobalSecondaryIndex({
        indexName: "RecentlyPlayedIndex",
        partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING }, // timestamp for sorting
        projectionType: dynamodb.ProjectionType.ALL,
    });

    return table;
};
