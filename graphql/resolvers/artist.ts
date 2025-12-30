import { createLambdas } from "../../infra/createLambdas"

export const artistResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
    {
        typeName: "Mutation",
        fieldName: "artistCreate",
        lambda: lambdas.createArtist.lambdaFunction,
    },
    {
        typeName: "Query",
        fieldName: "artist",
        lambda: lambdas.getArtist.lambdaFunction,
    },
    {
        typeName: "Artist",
        fieldName: "songs",
        lambda: lambdas.getArtistSongs.lambdaFunction,
    },
    {
        typeName: "Artist",
        fieldName: "albums",
        lambda: lambdas.getArtistAlbums.lambdaFunction,
    },
]
