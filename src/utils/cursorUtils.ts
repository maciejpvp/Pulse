export const encodeCursor = (key: any) => {
    // Convert object to string → base64
    return Buffer.from(JSON.stringify(key)).toString("base64");
}

export const decodeCursor = (cursor: string) => {
    // Decode base64 → JSON object
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
}
