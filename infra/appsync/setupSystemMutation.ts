import { aws_appsync, aws_lambda } from "aws-cdk-lib";
import { MappingTemplate } from "aws-cdk-lib/aws-appsync";

type Props = {
    api: aws_appsync.GraphqlApi
    lambda: aws_lambda.Function
    mutationName: string
    noneDS: aws_appsync.NoneDataSource
}

export const setupSystemMutation = ({ api, lambda, mutationName, noneDS }: Props) => {
    lambda.addEnvironment("APPSYNC_GRAPHQL_ENDPOINT", api.graphqlUrl);
    api.grantMutation(lambda, mutationName);

    noneDS.createResolver(`${mutationName}Resolver`, {
        typeName: 'Mutation',
        fieldName: mutationName,
        requestMappingTemplate: MappingTemplate.fromString(`{
      "version": "2018-05-29",
      "payload": $util.toJson($context.arguments.input)
    }`),
        responseMappingTemplate: MappingTemplate.fromString('$util.toJson($context.result)'),
    });
};