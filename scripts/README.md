# Scripts helper

This folder contains maintenance scripts used during migrations, backups and diagnostics.

Available scripts (high level):

- `convert-uploads-to-api.ts` — Migration script that scans the DB for values referencing `/uploads/` and converts them to `/api/uploads/`. Supports dry-run (default) and `--apply` to perform DB updates.

- `backup-affected-uploads.ts` — Exports the rows that reference `/uploads/` to a JSON file under `scripts/backups/` for safe storage before applying migrations.

- `rollback-restore-affected-uploads.ts` — Rollback tool that reads a backup JSON (example: `scripts/backups/affected-uploads-backup-1760705848119.json`) and restores DB fields. Supports dry-run (default) and `--apply` to write changes.

- `find-uploads-starts.ts` — Helper to list rows whose fields start with `/uploads/` (useful to find exact candidates).

- `integration-upload-test.ts` — Small integration script that POSTs a test image to `/api/empresas` and verifies the saved `logo` and served image.

How to use (examples)

- Dry-run the migration:

```bash
npx tsx scripts/convert-uploads-to-api.ts
```

- Apply the migration (CAREFUL: writes to DB):

```bash
npm run migrate:apply
# or
npx tsx scripts/convert-uploads-to-api.ts --apply
```

- Create a JSON backup of affected rows:

```bash
npx tsx scripts/backup-affected-uploads.ts
# Output saved under scripts/backups/
```

- Dry-run the rollback (prints updates that WOULD be applied):

```bash
npx tsx scripts/rollback-restore-affected-uploads.ts
```

- Apply the rollback (CAREFUL: writes to DB):

```bash
npm run rollback:uploads
# or
npx tsx scripts/rollback-restore-affected-uploads.ts --apply
```

Notes and safety

- Always keep the backup JSON file in a secure location (CI artifact store or protected storage) before applying any DB-altering scripts in production.
- Test scripts in a staging environment first.
- The rollback script expects the backup file to be named `affected-uploads-backup-1760705848119.json` — adjust the filename or copy the correct backup before running.
