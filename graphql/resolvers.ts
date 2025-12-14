import { createLambdas } from "../infra/createLambdas"

export const getResolvers = (lambdas: ReturnType<typeof createLambdas>) => {
    return [
        {
            typeName: "Mutation",
            fieldName: "songUpload",
            lambda: lambdas.getUploadUrl.lambdaFunction,
        },
        {
            typeName: "Mutation",
            fieldName: "createPlaylist",
            lambda: lambdas.createPlaylist.lambdaFunction,
        },
        {
            typeName: "Mutation",
            fieldName: "addToPlaylist",
            lambda: lambdas.addToPlaylist.lambdaFunction,
        },
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
            typeName: "Query",
            fieldName: "songPlay",
            lambda: lambdas.songPlay.lambdaFunction,
        },
        {
            typeName: "Artist",
            fieldName: "songs",
            lambda: lambdas.getArtistSongs.lambdaFunction,
        },
    ]
}
