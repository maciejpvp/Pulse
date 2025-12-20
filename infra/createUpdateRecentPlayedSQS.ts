import { Stack } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambda from "aws-cdk-lib/aws-lambda";

type Props = {
    stage: string;
    updateRecentPlayedLambda: lambda.Function;
    lambdasWithAccessToSQS: lambda.Function[];
};

export const createUpdateRecentPlayedSQS = (stack: Stack, {
    stage,
    updateRecentPlayedLambda,
    lambdasWithAccessToSQS,
}: Props) => {
    const dlq = new sqs.Queue(stack, `UpdateRecentPlayedDLQ-${stage}`, {
        queueName: `UpdateRecentPlayedDLQ-${stage}`,
        visibilityTimeout: cdk.Duration.seconds(30),
        retentionPeriod: cdk.Duration.seconds(60),
    });

    const queue = new sqs.Queue(stack, `UpdateRecentPlayedQueue-${stage}`, {
        queueName: `UpdateRecentPlayedQueue-${stage}`,
        visibilityTimeout: cdk.Duration.seconds(30),
        retentionPeriod: cdk.Duration.seconds(120),
        deadLetterQueue: {
            maxReceiveCount: 2,
            queue: dlq,
        },
    });

    updateRecentPlayedLambda.addEventSource(
        new lambdaEventSources.SqsEventSource(queue, {
            batchSize: 10,
        }),
    );

    lambdasWithAccessToSQS.forEach(lambda => {
        queue.grantSendMessages(lambda);
        lambda.addEnvironment("UPDATE_RECENT_PLAYED_QUEUE_URL", queue.queueUrl);
    });


    return queue;
};