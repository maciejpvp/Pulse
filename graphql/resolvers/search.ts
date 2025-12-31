import { createLambdas } from "../../infra/createLambdas"

export const searchResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
    {
        typeName: "Query",
        fieldName: "search",
        lambda: lambdas.searchByName.lambdaFunction,
    },
]

