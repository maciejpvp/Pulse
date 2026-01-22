import { Stack, RemovalPolicy } from "aws-cdk-lib";
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
        stream: dynamodb.StreamViewType.NEW_IMAGE,
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
        filters: [
            lambda.FilterCriteria.filter({
                dynamodb: {
                    NewImage: {
                        PK: { S: lambda.FilterRule.beginsWith('USER#') },
                        SK: { S: lambda.FilterRule.beginsWith('DEVICE#') }
                    }
                }
            })
        ]
    });

    broadcastDevicePingLambda.lambdaFunction.addEventSource(deviceUpdateFilter);

    return {
        table,
        broadcastDevicePingLambda,
    };
};
