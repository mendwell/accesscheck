# AccessCheck

AccessCheck is a mobile-first, novice-friendly screening tool for identifying common physical accessibility barriers in about 20–30 minutes.

The guided review covers:

- accessible parking
- the arrival route
- the building entrance
- public restrooms
- access to primary goods and services

It saves each assessment as a separate Supabase record and produces a follow-up summary that can be exported as JSON or printed to PDF.

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

## Supabase setup

1. Create a separate Supabase project for AccessCheckUp.
2. Run `supabase/migrations/20260822090000_create_checkups.sql` in the Supabase SQL Editor.
3. In Netlify, add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` as environment variables. The secret key is server-only and must never use the `NEXT_PUBLIC_` prefix.
4. Redeploy the site.

Each checkup receives a new UUID and a hashed private edit token. The full token is only kept in the checkup's private URL. Submitted records become read-only through the application API. Row-level security blocks direct browser access to the table.

## Production stack

- GitHub: source control and change review
- Netlify: branch previews and production hosting
- Supabase: central assessment storage

WordPress is not needed for the assessment workflow.

## Source basis

The short screening flow was adapted from the 2010 ADA Standards-based *ADA Checklist for Existing Facilities* and U.S. Department of Justice polling-place accessibility guidance. Refer to the complete standards and a qualified accessibility professional for compliance decisions.
