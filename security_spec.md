# Security Specification - Cold Storage Management System

## Data Invariants
1. Every document must have a `organizationId` matching the user's `organizationId`.
2. Users can only read/write documents belonging to their own organization.
3. Roles (Admin, Operator, Accountant, Client) restrict specific operations.
4. Stock cannot be updated directly; it must be modified through Incoming/Outgoing shipment records (handled by server-side rules or strict client validation helpers).

## The Dirty Dozen Payloads (Rejection Tests)

1. **Identity Spoofing**: Attempt to create a shipment with another company's `organizationId`.
2. **Privilege Escalation**: An 'operator' attempting to delete a client record.
3. **Stock Tampering**: Directly updating a stock document's bag count without a shipment record.
4. **Orphaned Writes**: Creating a shipment for a `locationId` that doesn't exist.
5. **Cross-Tenant Read**: A user from Org A trying to `get()` a client from Org B.
6. **Self-Promotion**: A user trying to change their own `role` to 'admin'.
7. **Negative Stock**: Attempting to dispatch more bags than available (prevented by `isValidStockUpdate` rule).
8. **PII Leak**: A client-role user trying to read the `users` collection to see other employees' emails.
9. **History Deletion**: An operator trying to delete an `incomingShipment` record after it's been processed.
10. **ID Poisoning**: Using a 2MB string as a document ID.
11. **Shadow Field**: Adding a `isVerified: true` field to a product doc.
12. **Relationship Bypass**: Creating a shipment for a `clientId` that belongs to Org B while the user is in Org A.

## Test Runner (TDD)
(See `firestore.rules.test.ts` for implementation)
