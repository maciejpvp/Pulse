export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized");

    console.log("Arguments: ", event.arguments)
    console.log("Source: ", event.source)

    return [];
};
