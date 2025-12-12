import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { createCognito } from "../infra/createCognito";
import { createSongsBucket } from "../infra/createSongsBucket";
import { getResolvers } from "../graphql/resolvers";
import { createSongsTable } from "../infra/createSongsTable";
import { createLambdas } from "../infra/createLambdas";
import { AppSyncApi } from "../infra/createAppSync";

export class PulseInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { userPool, userPoolClient } = createCognito(this, "dev");

    const songsTable = createSongsTable({ stack: this, stage: "dev" });
    const songsBucket = createSongsBucket(this, { songsTable });

    const lambdas: ReturnType<typeof createLambdas> = createLambdas(this, {
      stage: "dev",
      songsTable,
      songsBucket,
    });

    new AppSyncApi(this, "SongsApi", {
      name: "SongsApi",
      schemaPath: "graphql/schema.graphql",
      resolvers: getResolvers(lambdas),
      userPool,
      userPoolClient,
      enableApiKey: false,
    });
  }
}
