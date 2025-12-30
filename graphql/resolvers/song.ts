import { createLambdas } from "../../infra/createLambdas"

export const songResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
    {
        typeName: "Mutation",
        fieldName: "songUpload",
        lambda: lambdas.getUploadUrl.lambdaFunction,
    },
    {
        typeName: "Mutation",
        fieldName: "songPlay",
        lambda: lambdas.songPlay.lambdaFunction,
    },
    {
        typeName: "Query",
        fieldName: "song",
        lambda: lambdas.getSongItem.lambdaFunction,
    },
    {
        typeName: "Song",
        fieldName: "artist",
        lambda: lambdas.getArtist.lambdaFunction,
    },
]
