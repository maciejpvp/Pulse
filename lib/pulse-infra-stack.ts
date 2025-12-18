import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { createCognito } from "../infra/createCognito";
import { createSongsBucket } from "../infra/createSongsBucket";
import { getResolvers } from "../graphql/resolvers";
import { createLambdas } from "../infra/createLambdas";
import { AppSyncApi } from "../infra/createAppSync";
import { createMusicTable } from "../infra/DynamoDB/createMusicTable";

export class PulseInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { userPool, userPoolClient } = createCognito(this, "dev");

    const musicTable = createMusicTable({ stack: this, stage: "dev" });
    const songsBucket = createSongsBucket(this, { musicTable });

    const lambdas: ReturnType<typeof createLambdas> = createLambdas(this, {
      stage: "dev",
      musicTable,
      songsBucket,
    });

    new AppSyncApi(this, "SongsApi", {
      name: "SongsApi",
      schemaDir: "graphql/schema",
      resolvers: getResolvers(lambdas),
      userPool,
      userPoolClient,
      enableApiKey: false,
    });
  }
}
