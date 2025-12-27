import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { CreateLambda } from "../../constructs/CreateLambda";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

type Props = {
    table: ddb.Table;
}

export function createPicturesBucket(stack: Stack, { table }: Props): s3.Bucket {
    const bucket = new s3.Bucket(stack, "PicturesBucket", {
        publicReadAccess: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,

        encryption: s3.BucketEncryption.S3_MANAGED,

        cors: [
            {
                allowedMethods: [
                    s3.HttpMethods.GET,
                    s3.HttpMethods.PUT,
                    s3.HttpMethods.POST,
                ],
                allowedOrigins: [
                    "http://localhost:5173",
                ],
                allowedHeaders: ["*"],
                exposedHeaders: ["ETag"],
                maxAge: 3000,
            },
        ],
    });

    const lambda = new CreateLambda(stack, {
        name: "imageProcessing",
        stage: "dev",
        nodeModules: ["sharp"],
        resources: [
            {
                grant: (fn) => bucket.grantReadWrite(fn),
                envName: "picturesBucket",
                envValue: bucket.bucketName,
            },
            {
                grant: (fn) => table.grantWriteData(fn),
                envName: "musicTable",
                envValue: table.tableName,
            }
        ],
    })

    bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(lambda.lambdaFunction),
        {
            prefix: "raw/",
        }
    )

    return bucket;
}
