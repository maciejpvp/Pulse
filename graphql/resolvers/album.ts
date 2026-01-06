import { createLambdas } from "../../infra/createLambdas"

export const albumResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
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
    {
        typeName: "Mutation",
        fieldName: "albumCreate",
        lambda: lambdas.createAlbum.lambdaFunction,
    },
    {
        typeName: "Mutation",
        fieldName: "albumRemove",
        lambda: lambdas.removeAlbum.lambdaFunction,
    },
]
