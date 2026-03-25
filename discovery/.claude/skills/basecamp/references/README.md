# Basecamp References

Basecamp is schema-agnostic — it discovers structure from live metadata rather than relying on pre-loaded reference material.

## Go Hunt Integration

When a basecamp report exists, Go Hunt's Phase 0 (Intake) should check for it:
- Load the ERD and relationship map to avoid re-discovering schema.
- Use data profiles to prioritize which tables have enough data to test hypotheses.
- Use candidate hypotheses (`HC-<n>`) as starting points for exploration.

The basecamp report lives at: `reports/basecamp/basecamp-<project>-YYYY-MM-DD.md`

## Adding References

If domain-specific reference material is needed for a particular dataset (e.g., industry-specific action code definitions or domain glossaries), add files here. Basecamp's Phase 1 will read them if present.
