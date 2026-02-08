import { executeAppSyncRequest } from "../../src/utils/appsyncRequest";

// Mock fetch
const globalFetch = global.fetch;
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock SignatureV4
jest.mock("@aws-sdk/signature-v4", () => {
    return {
        SignatureV4: jest.fn().mockImplementation(() => ({
            sign: jest.fn().mockResolvedValue({
                method: "POST",
                headers: { "Authorization": "signed-header" },
                body: '{"query":"query { test }","variables":{}}'
            })
        }))
    };
});

describe("appsyncRequest", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        process.env.APPSYNC_GRAPHQL_ENDPOINT = "https://example.appsync-api.us-east-1.amazonaws.com/graphql";
        mockFetch.mockReset();
    });

    afterAll(() => {
        process.env = originalEnv;
        global.fetch = globalFetch;
    });

    it("should throw if APPSYNC_GRAPHQL_ENDPOINT is not set", async () => {
        delete process.env.APPSYNC_GRAPHQL_ENDPOINT;
        await expect(executeAppSyncRequest("query { test }")).rejects.toThrow(
            "APPSYNC_GRAPHQL_ENDPOINT environment variable is not set"
        );
    });

    it("should return data on successful request", async () => {
        const mockData = { test: "success" };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: mockData }),
        });

        const result = await executeAppSyncRequest<{ test: string }>("query { test }");
        expect(result).toEqual(mockData);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("example.appsync-api.us-east-1.amazonaws.com"),
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({ "Authorization": "signed-header" }),
            })
        );
    });

    it("should throw on HTTP error", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            text: async () => "Forbidden",
        });

        await expect(executeAppSyncRequest("query { test }")).rejects.toThrow(
            "AppSync HTTP Error 403: Forbidden"
        );
    });

    it("should throw on AppSync errors", async () => {
        const mockErrors = [{ message: "Unauthorized" }];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ errors: mockErrors }),
        });

        await expect(executeAppSyncRequest("query { test }")).rejects.toThrow(
            `AppSync Error: ${JSON.stringify(mockErrors)}`
        );
    });

    it("should throw if data field is missing", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        });

        await expect(executeAppSyncRequest("query { test }")).rejects.toThrow(
            "AppSync response missing data field"
        );
    });

    it("should throw on invalid JSON", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => { throw new Error("Invalid JSON"); },
        });

        await expect(executeAppSyncRequest("query { test }")).rejects.toThrow(
            "Failed to parse AppSync response as JSON: Invalid JSON"
        );
    });
});
