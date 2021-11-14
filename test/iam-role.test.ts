/* eslint-disable jest/expect-expect, jest/prefer-expect-assertions */

import {
  expect as expectCDK,
  haveResource,
  haveResourceLike,
  countResources,
  Capture,
  anything,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { AwsSesIamRoleStack } from "../src/iam-role";

const app = new cdk.App();
const stack = new AwsSesIamRoleStack(app, "MyAwsSesIamRoleStack");

describe("the CloudFormation stack", () => {
  it("has an AWS IAM policy resource", () => {
    expectCDK(stack).to(haveResource("AWS::IAM::Policy"));
  });

  it("contains no more than one AWS IAM policy resource", () => {
    expectCDK(stack).to(countResources("AWS::IAM::Policy", 1));
  });

  it("has an AWS IAM user resource", () => {
    expectCDK(stack).to(haveResource("AWS::IAM::User"));
  });
});

describe("the IAM policy", () => {
  it("should only contain a single statement", () => {
    const iamStatements = Capture.anyType();

    expectCDK(stack).to(
      haveResource("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: iamStatements.capture(),
          Version: anything(),
        },
      })
    );

    expect(iamStatements.capturedValue).toHaveLength(1);
  });

  it("should only allow the ses:SendRawEmail action", () => {
    expectCDK(stack).to(
      haveResource("AWS::IAM::Policy", {
        PolicyDocument: {
          Version: anything(),
          Statement: [
            {
              Action: "ses:SendRawEmail",
              Condition: anything(),
              Effect: anything(),
              Resource: anything(),
            },
          ],
        },
      })
    );
  });

  it("should only be allowed to send e-mails to an Opsgenie e-mail address", () => {
    const recipientEmailDomain = Capture.anyType();

    expectCDK(stack).to(
      haveResourceLike("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: [
            {
              Condition: {
                "ForAllValues:StringLike": {
                  "ses:Recipients": {
                    "Fn::Join": ["", recipientEmailDomain.capture()],
                  },
                },
              },
            },
          ],
        },
      })
    );

    expect(recipientEmailDomain.capturedValue).toStrictEqual(
      expect.arrayContaining([".opsgenie.net"])
    );
  });

  it("should restrict the e-mail addresses from which messages are sent", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: [
            {
              Condition: {
                StringEquals: {
                  "ses:FromAddress": anything(),
                },
              },
            },
          ],
        },
      })
    );
  });
});
