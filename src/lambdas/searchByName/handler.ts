import Joi from "joi";
import { searchItems } from "../../services/search/useSearchIndex";
import { normalizeName } from "../../utils/normalizeName";

export const handler = async (event: any) => {
    const { query, type } = validateInput(event);

    const normalizedQuery = normalizeName(query);

    const items = await searchItems({ query: normalizedQuery, type });

    console.log(items);

    return {
        items
    };
}

function validateInput(event: any): { query: string; type: "SONG" | "ALBUM" | "PLAYLIST" | "ARTIST" } {
    const input = event.arguments.input;

    const query = input.query;
    const type = input.type;

    const schema = Joi.object({
        query: Joi.string().required().min(3).max(100),
        type: Joi.string().required().valid("SONG", "ALBUM", "PLAYLIST", "ARTIST"),
    });

    const { error, value } = schema.validate({ query, type });

    if (error) throw new Error(error.message);

    return value;
}