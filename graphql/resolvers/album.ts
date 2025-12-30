import { createLambdas } from "../../infra/createLambdas"

export const albumResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
    {
        typeName: "Mutation",
        fieldName: "albumCreate",
        lambda: lambdas.createAlbum.lambdaFunction,
    },
    {
        typeName: "Query",
        fieldName: "album",
        lambda: lambdas.getAlbum.lambdaFunction,
    },
    {
        typeName: "Album",
        fieldName: "songs",
        lambda: lambdas.getAlbumSongs.lambdaFunction,
    },
]
