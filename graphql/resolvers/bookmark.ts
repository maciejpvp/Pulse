import { createLambdas } from "../../infra/createLambdas"

export const bookmarkResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
    {
        typeName: "Mutation",
        fieldName: "bookmarkAdd",
        lambda: lambdas.addBookmark.lambdaFunction,
    },
    {
        typeName: "Mutation",
        fieldName: "bookmarkRemove",
        lambda: lambdas.removeBookmark.lambdaFunction,
    },
    {
        typeName: "Query",
        fieldName: "bookmarks",
        lambda: lambdas.getBookmarks.lambdaFunction,
    }
]

