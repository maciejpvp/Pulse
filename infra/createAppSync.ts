import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as fs from "fs";
import * as path from "path";

export type AppSyncResolver = {
  typeName: string;
  fieldName: string;
  lambda?: lambda.IFunction;
  code?: appsync.Code;
  runtime?: appsync.FunctionRuntime;
  dataSource?: appsync.BaseDataSource;
};

type AppSyncApiProps = {
  name: string;
  schemaDir: string;
  resolvers?: AppSyncResolver[];

  // optional Cognito
  userPool?: cognito.IUserPool;
  userPoolClient?: cognito.IUserPoolClient;

  // enable API key if needed
  enableApiKey?: boolean;

  additionalAuthorizationModes?: appsync.AuthorizationMode[];
};

export class AppSyncApi extends Construct {
  public readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: AppSyncApiProps) {
    super(scope, id);

    const {
      name,
      schemaDir,
      resolvers = [],
      userPool,
      enableApiKey = false,
      additionalAuthorizationModes = [],
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

    authModes.push(...additionalAuthorizationModes);

    const defaultAuth =
      authModes.length > 0
        ? authModes[0]
        : {
          authorizationType: appsync.AuthorizationType.API_KEY,
        };

    const additionalAuth =
      authModes.length > 1 ? authModes.slice(1) : undefined;

    // Merge schema files
    const schemaFiles = fs.readdirSync(schemaDir).filter(file => file.endsWith('.graphql'));
    const mergedSchema = schemaFiles.map(file => fs.readFileSync(path.join(schemaDir, file), 'utf8')).join('\n');
    const generatedSchemaPath = path.join(schemaDir, '../schema.generated.graphql');
    fs.writeFileSync(generatedSchemaPath, mergedSchema);

    this.api = new appsync.GraphqlApi(this, `${name}Api`, {
      name,
      definition: appsync.Definition.fromFile(generatedSchemaPath),
      authorizationConfig: {
        defaultAuthorization: defaultAuth,
        additionalAuthorizationModes: additionalAuth,
      },
      xrayEnabled: true,
    });

    new appsync.CfnGraphQLSchema(this, "SchemaOverride", {
      apiId: this.api.apiId,
      definition: mergedSchema,
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

  public attachResolver(resolver: AppSyncResolver) {
    let ds: appsync.BaseDataSource;

    if (resolver.dataSource) {
      ds = resolver.dataSource;
    } else if (resolver.lambda) {
      ds = this.api.addLambdaDataSource(
        `${resolver.typeName}${resolver.fieldName}DS`,
        resolver.lambda,
      );
    } else {
      throw new Error(`Resolver ${resolver.typeName}.${resolver.fieldName} must have either a lambda or a dataSource`);
    }

    ds.createResolver(`${resolver.typeName}${resolver.fieldName}Resolver`, {
      typeName: resolver.typeName,
      fieldName: resolver.fieldName,
      code: resolver.code,
      runtime: resolver.runtime,
    });
  }

}
