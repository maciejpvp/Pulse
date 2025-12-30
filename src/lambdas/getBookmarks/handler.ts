import { getBookmarksForUser } from "../../services/bookmark/getBookmarksForUser";

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const limit = Math.min(event.arguments?.first || 20, 25);
    const after = event.arguments?.after;

    const bookmarks = await getBookmarksForUser({ userId, limit, after });

    return bookmarks;
}