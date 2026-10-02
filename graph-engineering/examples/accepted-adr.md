---
title: Route network calls through the platform gateway
type: adr
status: accepted
policies:
  - id: no-direct-requests
    kind: forbidden_import
    value: requests
    paths: ["*.py"]
    severity: error
    rationale: Use the reviewed platform gateway instead of direct requests calls.
  - id: avoid-unbounded-debug
    kind: forbidden_text
    value: "DEBUG = True"
    paths: ["*.py"]
    severity: warning
    rationale: Do not enable debug mode in deployable configuration.
---
# Platform gateway boundary

This is a demonstration rule, not an organization-wide compliance policy.
Only a human governance owner should mark a real ADR as accepted.
