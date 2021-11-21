import * as cdk from "@aws-cdk/core";
import {
  Effect,
  PolicyStatement,
  User,
  Policy,
  PolicyDocument,
} from "@aws-cdk/aws-iam";

/**
 * This CloudFormation stack creates an IAM role with the permission to send
 * e-mails via AWS Simple Email Service to Atlassian Opsgenie.
 */
export class AwsSesIamRoleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const opsgenieCustomerName = new cdk.CfnParameter(
      this,
      "opsgenieCustomerName",
      {
        type: "String",
        description: `The Opsgenie customer name. The customer name is used to\
 build the inbound e-mail address used to trigger alerts, and is used by this\
 policy to limit eligible destinations.`,
      }
    );

    const opsgenieIntegrationEmailLocalPart = new cdk.CfnParameter(
      this,
      "opsgenieIntegrationEmailLocalPart",
      {
        type: "String",
        description: `The e-mail local part name, defined in the Opsgenie e-mail\
 integration settings.`,
      }
    );

    const sourceEmailAddress = new cdk.CfnParameter(
      this,
      "sourceEmailAddress",
      {
        type: "String",
        description: `The e-mail address of the source system that will be\
 triggering Opsgenie alerts.`,
      }
    );

    /**
     * We define the policy statement to be as strict as possible. This ensures
     * that if the account is compromised, it can only be used to send e-mails
     * from a pre-defined hostname to our specific Opsgenie account, and not to
     * send spam across different domains.
     */
    const sesSendToOpsgeniePolicyStatement: PolicyStatement =
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ses:SendRawEmail"],
        resources: ["*"],
        conditions: {
          "ForAllValues:StringLike": {
            "ses:Recipients": `${opsgenieIntegrationEmailLocalPart.valueAsString}@${opsgenieCustomerName.valueAsString}.opsgenie.net`,
          },
          StringEquals: {
            "ses:FromAddress": sourceEmailAddress.valueAsString,
          },
        },
      });

    /**
     * A new user is created with access to the application. The access key and
     * secret access key assigned to that user can then be imported into
     * applications that trigger Opsgenie alerts via e-mail.
     */
    const sesSendToOpsgenieUser: User = new User(
      this,
      "sesSendToOpsgenieRole",
      {}
    );

    /**
     * Because this policy specific to a single use-case, we attach the policy
     * directly to the user.
     */
    sesSendToOpsgenieUser.attachInlinePolicy(
      new Policy(this, "sesSendToOpsgeniePolicy", {
        document: new PolicyDocument({
          statements: [sesSendToOpsgeniePolicyStatement],
        }),
      })
    );
  }
}
