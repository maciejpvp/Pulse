import { Stack } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { GOOGLE_CLIENT_ID } from "../env";

export const createCognito = (stack: Stack, stage: string) => {
  const userPool = new cognito.UserPool(stack, `WhiteboardUserPool-${stage}`, {
    selfSignUpEnabled: true,
    signInAliases: { email: true },
  });

  userPool.addDomain(`UserPoolDomain-${stage}`, {
    cognitoDomain: {
      domainPrefix: `pulse-project-maciejpvp-${stage}`,
    },
  });

  const secret = secretsmanager.Secret.fromSecretNameV2(
    stack,
    "GoogleSecret",
    "prod/google/OAuthSecret",
  );

  const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
    stack,
    "Google",
    {
      clientId: GOOGLE_CLIENT_ID,
      clientSecretValue: secret.secretValueFromJson("googleSecret"),
      userPool,
      scopes: ["openid", "email", "profile"],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
      },
    },
  );

  const userPoolClient = new cognito.UserPoolClient(
    stack,
    "MyUserPoolClient2",
    {
      userPool,
      generateSecret: false,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          `https://d3otbfbbvrvpku.cloudfront.net/callback`,
          "http://localhost:5173/callback",
        ],
        logoutUrls: [
          `https://d3otbfbbvrvpku.cloudfront.net/logout`,
          "http://localhost:5173/logout",
        ],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
    },
  );

  userPoolClient.node.addDependency(googleProvider);

  return { userPool, userPoolClient };
};
