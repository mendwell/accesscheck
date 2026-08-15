# AccessCheck architecture

## First release

- Mobile-first Next.js interface
- Device-local draft saving, so a field review survives refreshes or poor connectivity
- JSON export and print/PDF summary
- No account or sensitive cloud data required for the prototype

## Recommended production stack

- **GitHub:** one private repository dedicated to AccessCheck
- **Netlify:** preview deployments for branches and production hosting from `main`
- **Supabase:** authentication, organizations, sites, assessments, answers, and optional photo storage
- **WordPress:** not recommended for the assessment workflow; use only later if a separate public content site is needed

Before enabling Supabase, choose whether data belongs to individual reviewers or shared organizations. That decision determines row-level security and should not be guessed.
