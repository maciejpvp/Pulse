import { createLambdas } from "../../infra/createLambdas"

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
        fieldName: "cloudStateUpdate",
        lambda: lambdas.updateCloudState.lambdaFunction,
    },
    {
        typeName: "Mutation",
        fieldName: "devicePing",
        lambda: lambdas.devicePing.lambdaFunction,
    },
]


