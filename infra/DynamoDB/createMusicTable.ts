import { Stack, RemovalPolicy, Duration } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { CreateLambda } from "../../constructs/CreateLambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from 'aws-cdk-lib/aws-lambda';

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
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
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

    const broadcastDevicePingLambda = registerDevicePingStream({ stack, stage, table });
    const broadcastCloudStateLambda = registerCloudStateStream({ stack, stage, table });

    return {
        table,
        broadcastDevicePingLambda,
        broadcastCloudStateLambda,
    };
};

function registerCloudStateStream({ stack, stage, table }: { stack: Stack, stage: string, table: dynamodb.Table }) {
    const broadcastCloudStateLambda = new CreateLambda(stack, {
        name: "broadcastCloudState",
        stage,
        nodeModules: ['@smithy/util-utf8', '@aws-crypto/sha256-js'],
        resources: [
            {
                grant: (fn) => table.grantStreamRead(fn),
                envName: "musicTable",
                envValue: table.tableName,
            },
        ],
    })

    const cloudStateUpdateFilter = new DynamoEventSource(table, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 5,
        maxRecordAge: Duration.minutes(1),
        bisectBatchOnError: true,
        filters: generateFilter({ pk: 'USER#', sk: 'CLOUDSTATE' })
    });

    broadcastCloudStateLambda.lambdaFunction.addEventSource(cloudStateUpdateFilter);

    return broadcastCloudStateLambda;
}

function registerDevicePingStream({ stack, stage, table }: { stack: Stack, stage: string, table: dynamodb.Table }) {
    const broadcastDevicePingLambda = new CreateLambda(stack, {
        name: "broadcastDevicePing",
        stage,
        nodeModules: ['@smithy/util-utf8', '@aws-crypto/sha256-js'],
        resources: [
            {
                grant: (fn) => table.grantStreamRead(fn),
                envName: "musicTable",
                envValue: table.tableName,
            },
        ],
    })

    const deviceUpdateFilter = new DynamoEventSource(table, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 5,
        maxRecordAge: Duration.minutes(1),
        bisectBatchOnError: true,
        filters: generateFilter({ pk: 'USER#', sk: 'DEVICE#' })
    });

    broadcastDevicePingLambda.lambdaFunction.addEventSource(deviceUpdateFilter);

    return broadcastDevicePingLambda;
}

function generateFilter(filter: { pk: string, sk?: string }) {
    const generatedFilter = lambda.FilterCriteria.filter({
        dynamodb: {
            NewImage: {
                PK: { S: lambda.FilterRule.beginsWith(filter.pk) },
                ...(filter.sk && { SK: { S: lambda.FilterRule.beginsWith(filter.sk) } })
            },
        }
    })

    return [generatedFilter]
}