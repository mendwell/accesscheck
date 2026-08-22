# AccessCheck architecture

## First release

- Mobile-first Next.js interface
- Supabase-backed draft and submission saving through server-only API routes
- JSON export and print/PDF summary
- Private edit links for anonymous reviewers; each checkup is a separate record

## Recommended production stack

- **GitHub:** one private repository dedicated to AccessCheck
- **Netlify:** preview deployments for branches and production hosting from `main`
- **Supabase:** central checkup storage now; authentication, organizations, and optional photo storage can be added later
- **WordPress:** not recommended for the assessment workflow; use only later if a separate public content site is needed

The public Supabase roles have no direct table access. Netlify's server-side API verifies a private edit token before reading or updating a record. A future account model can add reviewer and organization ownership without exposing existing anonymous records.
