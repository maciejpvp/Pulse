import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

const credentials = defaultProvider();
const region = process.env.AWS_REGION || "eu-central-1";

const signer = new SignatureV4({
    credentials,
    region,
    service: "appsync",
    sha256: Sha256,
});

/**
 * Executes a signed GraphQL request to AppSync using IAM authentication.
 * 
 * @template T The expected type of the data returned by the query.
 * @param query The GraphQL query or mutation string.
 * @param variables Optional variables for the GraphQL operation.
 * @returns The data returned by AppSync.
 * @throws Error if environment variables are missing, the request fails, or AppSync returns errors.
 */
export const executeAppSyncRequest = async <T = any>(
    query: string,
    variables: Record<string, any> = {}
): Promise<T> => {
    const endpointUrl = process.env.APPSYNC_GRAPHQL_ENDPOINT;
    if (!endpointUrl) {
        throw new Error("APPSYNC_GRAPHQL_ENDPOINT environment variable is not set");
    }

    const endpoint = new URL(endpointUrl);

    const request = new HttpRequest({
        method: "POST",
        hostname: endpoint.host,
        path: endpoint.pathname,
        body: JSON.stringify({ query, variables }),
        headers: {
            "Content-Type": "application/json",
            host: endpoint.host,
        },
    });

    const signedRequest = await signer.sign(request);

    const response = await fetch(endpoint.href, {
        method: signedRequest.method,
        headers: signedRequest.headers as Record<string, string>,
        body: signedRequest.body,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`AppSync HTTP Error ${response.status}: ${errorText}`);
    }

    let result: any;
    try {
        result = await response.json();
    } catch (e) {
        throw new Error(`Failed to parse AppSync response as JSON: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (result.errors && result.errors.length > 0) {
        throw new Error(`AppSync Error: ${JSON.stringify(result.errors)}`);
    }

    if (result.data === undefined) {
        throw new Error("AppSync response missing data field");
    }

    return result.data as T;
};
