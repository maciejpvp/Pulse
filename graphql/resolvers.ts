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
            fieldName: "playlistCreate",
            lambda: lambdas.createPlaylist.lambdaFunction,
        },
        {
            typeName: "Mutation",
            fieldName: "playlistAddToPlaylist",
            lambda: lambdas.addToPlaylist.lambdaFunction,
        },
        {
            typeName: "Mutation",
            fieldName: "playlistRemoveFromPlaylist",
            lambda: lambdas.removeFromPlaylist.lambdaFunction,
        },
        {
            typeName: "Mutation",
            fieldName: "artistCreate",
            lambda: lambdas.createArtist.lambdaFunction,
        },
        {
            typeName: "Mutation",
            fieldName: "albumCreate",
            lambda: lambdas.createAlbum.lambdaFunction,
        },
        {
            typeName: "Mutation",
            fieldName: "songPlay",
            lambda: lambdas.songPlay.lambdaFunction,
        },
        {
            typeName: "Query",
            fieldName: "artist",
            lambda: lambdas.getArtist.lambdaFunction,
        },
        {
            typeName: "Query",
            fieldName: "playlist",
            lambda: lambdas.getPlaylist.lambdaFunction,
        },
        {
            typeName: "Query",
            fieldName: "album",
            lambda: lambdas.getAlbum.lambdaFunction,
        },
        {
            typeName: "Query",
            fieldName: "recentPlayed",
            lambda: lambdas.getRecent.lambdaFunction,
        },
        {
            typeName: "Artist",
            fieldName: "songs",
            lambda: lambdas.getArtistSongs.lambdaFunction,
        },
        {
            typeName: "Playlist",
            fieldName: "songs",
            lambda: lambdas.getPlaylistSongs.lambdaFunction,
        },
        {
            typeName: "Album",
            fieldName: "songs",
            lambda: lambdas.getAlbumSongs.lambdaFunction,
        }
    ]
}
