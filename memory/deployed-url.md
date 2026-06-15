---
name: deployed-url
description: Live deployed URL and AWS hosting details for the fractions tutorial
metadata:
  type: project
---

The fractions tutorial (Babushka's Fractions) is deployed as a static site at **https://dcw267drgkdg2.cloudfront.net**.

Hosting: AWS S3 (private bucket) + CloudFront via OAC, defined by CDK TypeScript in `infra/` (stack `FractionsTutorialStack`, account 066756666605, region us-east-1, AWS profile `workflow-harness`). Deploy/redeploy with `cd infra && npx cdk deploy`; tear down with `npx cdk destroy`. It's a fully client-side app (state in localStorage), so no database/VPC/backend.

**Why:** User asked for the deployed URL repeatedly; this is the canonical answer.
**How to apply:** Re-running `cdk deploy` after a `vite build` in `web/` republishes. The CDK `BucketDeployment` upload Lambda needs `memoryLimit: 1024` + 1 GB ephemeral storage because the asset bundle is ~84 MB (music/voice) — the default 128 MB OOMs and wedges the deploy.
