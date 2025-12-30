import { createLambdas } from "../../infra/createLambdas"

export const userResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
    {
        typeName: "Query",
        fieldName: "recentPlayed",
        lambda: lambdas.getRecent.lambdaFunction,
    },
]
