import { RemovalPolicy, Stack } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

type Props = {
  stack: Stack;
  stage: string;
};

export const createSongsTable = (props: Props) => {
  const { stack, stage } = props;

  const tableName = `SongsTable-${stage}`;

  const table = new dynamodb.Table(stack, tableName, {
    tableName,
    partitionKey: { name: "ArtistId", type: dynamodb.AttributeType.STRING },
    sortKey: { name: "SongId", type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  return table;
};
