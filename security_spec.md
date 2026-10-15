# Security Specification & Threat Model for GasoilPro

## 1. Data Invariants
- Each fuel dispense (`fuel_dispenses`) must reference an existing citerne (`citerneId`) and vehicle (`vehiculeId`).
- Citernes must have a positive or zero `stockActuel` not exceeding `capaciteTotale`.
- Stock entries must have a positive `quantiteLivree`.
- Audit logs are append-only; existing records cannot be edited or erased.
- Subscriptions and Master Security configurations require Super Administrator access.

## 2. The "Dirty Dozen" Test Payloads
1. Unauthorized modification of stock entries by unauthenticated client.
2. Fuel dispense with negative volume or corrupted counter.
3. Injection of ghost fields (`__escalate_role: true`) during user updates.
4. Attempt to delete audit log history.
5. Attempt to forge subscription expiration date.
6. Attempt to modify citerne capacity beyond allowable bounds.
7. Spoofing user identity by setting arbitrary `id` or `uid`.
8. Overwriting someone else's fuel reception signature.
9. Attempting denial-of-wallet with 2MB string payload in vehicle code.
10. Attempt to list unassigned tenant data across client organizations.
11. Attempt to bypass emergency lockdown with forged client states.
12. Unverified user attempting write operations.

## 3. Rules Strategy
- Default deny catch-all `match /{document=**} { allow read, write: if false; }`.
- Validations on id sizes (`<= 128`), required keys, and payload boundaries.
- Audit logs append-only: allow create, deny update/delete.
