import { deleteBookmarkRecords } from "../../services/bookmark/deleteBookmarkRecords";
import { isValidUUID } from "../../utils/isValidUUID";

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const items: string[] = validateInput(event.arguments.input);

    await deleteBookmarkRecords({ userId, recordIds: items });

    return true;
}

function validateInput(input: any) {
    if (!input.items) throw new Error("Missing items");

    const items = input.items as string[];
    if (!items?.length) throw new Error("No items provided");

    if (items.length > 100) throw new Error("Too many items");

    if (items.some((item) => !isValidUUID(item))) throw new Error("Invalid item ID");

    return items;
}
