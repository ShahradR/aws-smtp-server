#!/usr/bin/env node

/* eslint-disable no-new */

import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { AwsSesIamRoleStack } from "../src/iam-role";

const app = new cdk.App();
new AwsSesIamRoleStack(app, "AwsSesIamRoleStack");
