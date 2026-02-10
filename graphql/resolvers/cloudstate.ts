import { createLambdas } from "../../infra/createLambdas"
import * as appsync from "aws-cdk-lib/aws-appsync"
import * as path from "path"

export const cloudstateResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
    {
        typeName: "Query",
        fieldName: "cloudState",
        lambda: lambdas.getCloudState.lambdaFunction,
    },
    {
        typeName: "Query",
        fieldName: "devices",
        lambda: lambdas.getDevices.lambdaFunction,
    },
    {
        typeName: "Mutation",
        fieldName: "devicePing",
        lambda: lambdas.devicePing.lambdaFunction,
    },
]

export const cloudStateUpdateResolver = (dbDataSource: appsync.BaseDataSource) => ({
    typeName: "Mutation",
    fieldName: "cloudStateUpdate",
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    code: appsync.Code.fromAsset(path.join(__dirname, 'cloudStateUpdate.mjs')),
    dataSource: dbDataSource,
});


