# AccessCheck

AccessCheck is a mobile-first, novice-friendly screening tool for identifying common physical accessibility barriers in about 20–30 minutes.

The guided review covers:

- accessible parking
- the arrival route
- the building entrance
- public restrooms
- access to primary goods and services

It saves an in-progress assessment on the reviewer's device and produces a follow-up summary that can be exported as JSON or printed to PDF.

> AccessCheck is a preliminary screening aid. It does not provide a full ADA compliance determination or legal opinion.

## Local development

Requirements: Node.js 22 or later and pnpm.

```bash
pnpm install
pnpm dev
```

Create a production build with:

```bash
pnpm build
```

## Production plan

- GitHub: source control and change review
- Netlify: branch previews and production hosting
- Supabase: future authentication, shared organizations, assessments, answers, and optional photos

The current release deliberately uses device-local storage. Supabase should be enabled only after deciding whether assessments belong to individual reviewers or shared organizations, because that choice controls row-level security.

WordPress is not needed for the assessment workflow.

## Source basis

The short screening flow was adapted from the 2010 ADA Standards-based *ADA Checklist for Existing Facilities* and U.S. Department of Justice polling-place accessibility guidance. Refer to the complete standards and a qualified accessibility professional for compliance decisions.
