import { createLambdas } from "../infra/createLambdas"
import { albumResolvers } from "./resolvers/album"
import { artistResolvers } from "./resolvers/artist"
import { playlistResolvers } from "./resolvers/playlist"
import { songResolvers } from "./resolvers/song"
import { userResolvers } from "./resolvers/user"
import { bookmarkResolvers } from "./resolvers/bookmark"
import { searchResolvers } from "./resolvers/search"

export const getResolvers = (lambdas: ReturnType<typeof createLambdas>) => {
    return [
        ...albumResolvers(lambdas),
        ...artistResolvers(lambdas),
        ...playlistResolvers(lambdas),
        ...songResolvers(lambdas),
        ...userResolvers(lambdas),
        ...bookmarkResolvers(lambdas),
        ...searchResolvers(lambdas),
    ]
}
