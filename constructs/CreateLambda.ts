import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as cdk from "aws-cdk-lib";

export interface ResourceConfig {
  grant: (lambdaFn: lambda.IFunction) => void;
  envName?: string;
  envValue?: string;
}

export interface CreateLambdaProps {
  name: string;
  stage: string;
  grantWsAccess?: boolean;
  grantWsSQS?: boolean;
  env?: Record<string, string>;
  resources?: ResourceConfig[];
  timeoutSec?: number;
}

export class CreateLambda extends Construct {
  public readonly lambdaFunction: NodejsFunction;
  public readonly grantWsAccess: boolean;
  public readonly grantWsSQS: boolean;

  constructor(scope: Construct, props: CreateLambdaProps) {
    super(scope, props.name);

    this.grantWsAccess = props.grantWsAccess ?? false;
    this.grantWsSQS = props.grantWsSQS ?? false;

    const { name, stage, env = {}, resources = [], timeoutSec = 3 } = props;

    this.lambdaFunction = new NodejsFunction(this, `${name}-${stage}`, {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, `../src/lambdas/${name}/handler.ts`),
      handler: "handler",
      environment: {
        STAGE: stage,
        ...env,
      },
      timeout: cdk.Duration.seconds(timeoutSec),
    });

    for (const { grant, envName, envValue } of resources) {
      if (envName && envValue) {
        this.lambdaFunction.addEnvironment(envName, envValue);
      }
      grant(this.lambdaFunction);
    }
  }
}
