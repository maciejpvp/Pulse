import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as fs from "fs";

export type AppSyncResolver = {
  typeName: string;
  fieldName: string;
  lambda: lambda.IFunction;
};

type AppSyncApiProps = {
  name: string;
  schemaPath: string;
  resolvers?: AppSyncResolver[];

  // optional Cognito
  userPool?: cognito.IUserPool;
  userPoolClient?: cognito.IUserPoolClient;

  // enable API key if needed
  enableApiKey?: boolean;
};

export class AppSyncApi extends Construct {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncApiProps) {
    super(scope, id);

    const {
      name,
      schemaPath,
      resolvers = [],
      userPool,
      enableApiKey = false,
    } = props;

    const authModes: appsync.AuthorizationMode[] = [];

    if (userPool) {
      authModes.push({
        authorizationType: appsync.AuthorizationType.USER_POOL,
        userPoolConfig: { userPool },
      });
    }

    if (enableApiKey) {
      authModes.push({
        authorizationType: appsync.AuthorizationType.API_KEY,
      });
    }

    const defaultAuth =
      authModes.length > 0
        ? authModes[0]
        : {
          authorizationType: appsync.AuthorizationType.API_KEY,
        };

    const additionalAuth =
      authModes.length > 1 ? authModes.slice(1) : undefined;

    this.api = new appsync.GraphqlApi(this, `${name}Api`, {
      name,
      definition: appsync.Definition.fromFile('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: defaultAuth,
        additionalAuthorizationModes: additionalAuth,
      },
      xrayEnabled: true,
    });

    new appsync.CfnGraphQLSchema(this, "SchemaOverride", {
      apiId: this.api.apiId,
      definition: fs.readFileSync(schemaPath, "utf8"),
    });

    for (const resolver of resolvers) {
      this.attachResolver(resolver);
    }

    if (this.api.apiKey) {
      new cdk.CfnOutput(this, "AppSyncApiKey", {
        value: this.api.apiKey,
      });
    }

    new cdk.CfnOutput(this, "AppSyncApiUrl", {
      value: this.api.graphqlUrl,
    });
  }

  private attachResolver(resolver: AppSyncResolver) {
    const ds = this.api.addLambdaDataSource(
      `${resolver.fieldName}DS`,
      resolver.lambda,
    );

    ds.createResolver(`${resolver.fieldName}Resolver`, {
      typeName: resolver.typeName,
      fieldName: resolver.fieldName,
    });
  }
}
