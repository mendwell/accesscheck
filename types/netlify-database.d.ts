declare module "@netlify/database" {
  type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;
  export function getDatabase(): { sql: Sql };
}
