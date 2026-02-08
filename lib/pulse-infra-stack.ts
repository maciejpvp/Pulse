import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { createCognito } from "../infra/createCognito";
import { createSongsBucket } from "../infra/createSongsBucket";
import { getResolvers } from "../graphql/resolvers";
import { createLambdas } from "../infra/createLambdas";
import { AppSyncApi } from "../infra/createAppSync";
import { createMusicTable } from "../infra/DynamoDB/createMusicTable";
import { createUpdateRecentPlayedSQS } from "../infra/createUpdateRecentPlayedSQS";
import { createPicturesBucket } from "../infra/s3/createPicturesBucket";
import { AuthorizationType } from "aws-cdk-lib/aws-appsync";
import { setupSystemMutation } from "../infra/appsync/setupSystemMutation";

export class PulseInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { userPool, userPoolClient } = createCognito(this, "dev");

    const { table: musicTable, broadcastDevicePingLambda, broadcastCloudStateLambda } = createMusicTable({ stack: this, stage: "dev" });
    const songsBucket = createSongsBucket(this, { musicTable });
    const picturesBucket = createPicturesBucket(this, { table: musicTable });

    const lambdas: ReturnType<typeof createLambdas> = createLambdas(this, {
      stage: "dev",
      musicTable,
      songsBucket,
      picturesBucket,
    });

    const updateRecentPlayedSQS = createUpdateRecentPlayedSQS(this, {
      stage: "dev",
      updateRecentPlayedLambda: lambdas.updateUserRecentPlayed.lambdaFunction,
      lambdasWithAccessToSQS: [lambdas.songPlay.lambdaFunction],
    });

    const api = new AppSyncApi(this, "SongsApi", {
      name: "SongsApi",
      schemaDir: "graphql/schema",
      resolvers: getResolvers(lambdas),
      userPool,
      userPoolClient,
      enableApiKey: true,
      additionalAuthorizationModes: [
        { authorizationType: AuthorizationType.IAM }
      ],
    });

    const graphqlApi = api.api;

    const noneDS = graphqlApi.addNoneDataSource('NoneDS');

    setupSystemMutation({ api: graphqlApi, lambda: broadcastDevicePingLambda.lambdaFunction, mutationName: "_publishDevicePing", noneDS });
    setupSystemMutation({ api: graphqlApi, lambda: broadcastCloudStateLambda.lambdaFunction, mutationName: "_publishCloudState", noneDS });
  }
}
