import { aws_dynamodb, aws_s3, Stack } from "aws-cdk-lib";
import { CreateLambda, CreateLambdaProps } from "../constructs/CreateLambda";

type Props = {
  songsTable: aws_dynamodb.Table;
  songsBucket: aws_s3.Bucket;
  stage: string;
};

export const createLambdas = (stack: Stack, props: Props) => {
  const { songsTable, songsBucket, stage } = props;

  const lambdaConfig: CreateLambdaProps[] = [
    {
      name: "getUploadUrl",
      stage,
      resources: [
        {
          grant: (fn) => songsBucket.grantWrite(fn),
          envName: "songsBucket",
          envValue: songsBucket.bucketName,
        },
      ],
    },
  ];

  const lambdas = Object.fromEntries(
    lambdaConfig.map((config) => [
      config.name,
      new CreateLambda(stack, config),
    ]),
  );

  return lambdas;
};
