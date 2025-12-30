import { insertBookmarkRecords } from "../../services/bookmark/insertBookmarkRecords";
import { isValidUUID } from "../../utils/isValidUUID";

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const items = validateInput(event.arguments.input);

    await insertBookmarkRecords({ userId, records: items });

    return true;
}

type Item = {
    itemId: string;
    itemType: "ALBUM" | "ARTIST" | "PLAYLIST" | "SONG";
    artistId?: string;
}

function validateInput(input: any) {
    if (!input.items) throw new Error("Missing items");

    const items = input.items as Item[];
    if (!items?.length) throw new Error("No items provided");

    if (items.length > 100) throw new Error("Too many items");

    if (items.some((item) => !isValidUUID(item.itemId))) throw new Error("Invalid item ID");
    // artistId is required for songs and albums
    if (items.some((item) => item.itemType === "SONG" || item.itemType === "ALBUM") && !items.some((item) => !isValidUUID(item.artistId))) throw new Error("Invalid artist ID");

    return items;
}