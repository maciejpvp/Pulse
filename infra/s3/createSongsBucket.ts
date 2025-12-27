import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { CreateLambda } from "../../constructs/CreateLambda";
import * as aws_dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";

type Props = {
  musicTable: aws_dynamodb.Table;
}

export function createSongsBucket(stack: Stack, { musicTable }: Props): s3.Bucket {
  const bucket = new s3.Bucket(stack, "SongsBucket", {
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    cors: [
      {
        allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        exposedHeaders: ["ETag"],
        maxAge: 3000,
      },
    ],
  });

  const saveSongMetadataLambda = new CreateLambda(stack, {
    name: "saveSongMetadata",
    stage: "dev",
    resources: [
      {
        grant: (fn) => bucket.grantRead(fn),
        envName: "songsBucket",
        envValue: bucket.bucketName,
      },
      {
        grant: (fn) => musicTable.grantWriteData(fn),
        envName: "musicTable",
        envValue: musicTable.tableName,
      }
    ],
  });

  bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED_PUT,
    new s3n.LambdaDestination(saveSongMetadataLambda.lambdaFunction)
  );

  return bucket;
}
