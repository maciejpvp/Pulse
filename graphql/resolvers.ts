import { createLambdas } from "../lib/createLambdas"

export const getResolvers = (lambdas: ReturnType<typeof createLambdas>) => {
    return [{
        typeName: "Mutation",
        fieldName: "getUploadUrl",
        lambda: lambdas.getUploadUrl.lambdaFunction,
    },]
}