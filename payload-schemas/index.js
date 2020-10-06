const Ajv = require('ajv');
const ajv = new Ajv();

// Root schema
ajv.addSchema(require('./schemas/index.json'));

// Common schemas
ajv.addSchema(require('./schemas/common/installation.schema.json'));
ajv.addSchema(require('./schemas/common/organization.schema.json'));
ajv.addSchema(require('./schemas/common/repository.schema.json'));
ajv.addSchema(require('./schemas/common/sender.schema.json'));

// Webhook schemas
ajv.addSchema(require('./schemas/check_run.schema.json'));
ajv.addSchema(require('./schemas/check_suite.schema.json'));
ajv.addSchema(require('./schemas/code_scanning_alert.schema.json'));
ajv.addSchema(require('./schemas/commit_comment.schema.json'));
ajv.addSchema(require('./schemas/content_reference.schema.json'));
ajv.addSchema(require('./schemas/create.schema.json'));
ajv.addSchema(require('./schemas/delete.schema.json'));
ajv.addSchema(require('./schemas/deploy_key.schema.json'));
ajv.addSchema(require('./schemas/deployment.schema.json'));
ajv.addSchema(require('./schemas/deployment_status.schema.json'));
ajv.addSchema(require('./schemas/fork.schema.json'));
ajv.addSchema(require('./schemas/github_app_authorization.schema.json'));
ajv.addSchema(require('./schemas/gollum.schema.json'));
ajv.addSchema(require('./schemas/installation.schema.json'));
ajv.addSchema(require('./schemas/installation_repositories.schema.json'));
ajv.addSchema(require('./schemas/integration_installation.schema.json'));
ajv.addSchema(require('./schemas/integration_installation_repositories.schema.json'));
ajv.addSchema(require('./schemas/issue_comment.schema.json'));
ajv.addSchema(require('./schemas/issues.schema.json'));
ajv.addSchema(require('./schemas/label.schema.json'));
ajv.addSchema(require('./schemas/marketplace_purchase.schema.json'));
ajv.addSchema(require('./schemas/member.schema.json'));
ajv.addSchema(require('./schemas/membership.schema.json'));
ajv.addSchema(require('./schemas/meta.schema.json'));
ajv.addSchema(require('./schemas/milestone.schema.json'));
ajv.addSchema(require('./schemas/org_block.schema.json'));
ajv.addSchema(require('./schemas/organization.schema.json'));
ajv.addSchema(require('./schemas/package.schema.json'));
ajv.addSchema(require('./schemas/page_build.schema.json'));
ajv.addSchema(require('./schemas/ping.schema.json'));
ajv.addSchema(require('./schemas/project.schema.json'));
ajv.addSchema(require('./schemas/project_card.schema.json'));
ajv.addSchema(require('./schemas/project_column.schema.json'));
ajv.addSchema(require('./schemas/public.schema.json'));
ajv.addSchema(require('./schemas/pull_request.schema.json'));
ajv.addSchema(require('./schemas/pull_request_review.schema.json'));
ajv.addSchema(require('./schemas/pull_request_review_comment.schema.json'));
ajv.addSchema(require('./schemas/push.schema.json'));
ajv.addSchema(require('./schemas/release.schema.json'));
ajv.addSchema(require('./schemas/repository.schema.json'));
ajv.addSchema(require('./schemas/repository_dispatch.schema.json'));
ajv.addSchema(require('./schemas/repository_import.schema.json'));
ajv.addSchema(require('./schemas/repository_vulnerability_alert.schema.json'));
ajv.addSchema(require('./schemas/security_advisory.schema.json'));
ajv.addSchema(require('./schemas/sponsorship.schema.json'));
ajv.addSchema(require('./schemas/star.schema.json'));
ajv.addSchema(require('./schemas/status.schema.json'));
ajv.addSchema(require('./schemas/team.schema.json'));
ajv.addSchema(require('./schemas/team_add.schema.json'));
ajv.addSchema(require('./schemas/watch.schema.json'));
ajv.addSchema(require('./schemas/workflow_dispatch.schema.json'));
ajv.addSchema(require('./schemas/workflow_run.schema.json'));

module.exports = function (schema, file) {
  return ajv.validate(schema, file);
}
