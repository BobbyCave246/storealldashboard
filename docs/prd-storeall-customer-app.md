# PRD — Store All Barbados Customer App (Flutter)

*Status: draft for review · Generated via /grill-me + /to-prd · Source of truth: SiteLink*

## Problem Statement

Store All Barbados runs three self-storage sites (Central, South, Lears) but has
no way for customers to transact online. Almost all move-ins come from walk-ins
and repeat business; the website is "a brochure, not a funnel." A person who
wants a unit today must phone or visit during office hours, and an existing
tenant who wants to pay, see their balance, or find their gate code has to call
or come in. The business also wants to grow beyond self-storage over time, but
has no digital surface a future product could attach to.

From the customer's perspective: *"I can't rent a storage unit, or manage the
one I already have, without dealing with a person during office hours."*

## Solution

A native **Flutter mobile app** (iOS + Android) that lets a customer:

1. **Book and fully move in online, with zero desk interaction** — browse live
   availability and pricing by site and unit type, reserve a unit type, pay the
   deposit and prorated first month in-app, e-sign the lease, and immediately
   receive an assigned unit number and PTI gate code. They drive to the site and
   let themselves in.
2. **Manage their account** — see their unit(s), gate code, lease, and balance,
   and (fast-follow) pay in-app and enrol in autopay.

The app never talks to SiteLink directly. It talks to a **StoreAll backend** that
speaks the business's own vocabulary (units, bookings, accounts, payments), and
that backend integrates with SiteLink through a **swappable provider adapter**.
SiteLink remains the authoritative system of record for units, rates, tenants,
ledgers, tax, and gate access. This adapter boundary is deliberate: it lets Store
All swap storage-management systems later, or plug a *different* backend behind a
*different* future product, without rebuilding the app.

From the customer's perspective: *"I found a unit, paid, signed, and was storing
my things the same night — and I can manage everything from my phone."*

## User Stories

### Prospective customer — discovery & booking

1. As a prospective customer, I want to choose a site (Central, South, or Lears), so that I rent near where I live or work.
2. As a prospective customer, I want to browse unit types by size (e.g. 5×8, 8×8, 8×10, 8×16, 10×8, 20×8, 40×8), so that I can pick a unit that fits my belongings.
3. As a prospective customer, I want to see live availability for each unit type at each site, so that I only consider units I can actually rent right now.
4. As a prospective customer, I want to see the price for each unit type in BBD, so that I know what it costs before committing.
5. As a prospective customer, I want a simple guide to what each size holds, so that I can choose confidently without visiting.
6. As a prospective customer, I want to select a unit type (not a specific unit), so that booking is fast and I don't worry about which exact unit I get.
7. As a prospective customer, I want to see a clear breakdown of my move-in cost (deposit + prorated first month + optional contents protection + VAT), so that there are no surprises at checkout.
8. As a prospective customer moving in mid-month, I want my first month's rent prorated, so that I only pay for the days I actually have the unit.

### Prospective customer — account creation & identity

9. As a new customer, I want to create an account with my email, so that I have a secure identity in the app.
10. As a new customer, I want to verify my email with a one-time code (OTP), so that my account is protected and my email is confirmed.
11. As a new customer, I want to enter my mobile number, so that Store All can contact me (note: the number is collected but not used for login/OTP in v1).
12. As a new customer, I want to enter my contact and billing details, so that my lease and receipts are accurate.
13. As a new customer, I want to upload one government ID (driver's licence, national ID, or passport), so that I meet the lease requirement — knowing it will not be identity-verified in v1, only stored on file.

### Prospective customer — payment & move-in

14. As a new customer, I want to pay my move-in total by card in the app, so that I can complete move-in without cash or a visit.
15. As a new customer, I want my card securely saved (tokenized), so that I can enrol in autopay without re-entering it.
16. As a new customer, I want to be offered contents protection during checkout, so that I can protect high-value goods — while still being able to decline it.
17. As a new customer, I want to review and e-sign the lease in the app, so that I complete the agreement without printing or visiting.
18. As a new customer, I want a copy of my signed lease emailed to me and available in the app, so that I keep a durable record.
19. As a new customer, once payment and signature succeed, I want to be automatically assigned a specific available unit, so that my rental is real and ready.
20. As a new customer, I want my unit number and PTI gate code shown immediately in the app (and emailed), so that I can access my unit the same day with no desk visit.
21. As a new customer, I want a confirmation with directions, site access hours, and what to bring, so that my first visit goes smoothly.
22. As a customer, I want to be told clearly if a payment fails or a unit becomes unavailable mid-checkout, so that I know what went wrong and what to do next.

### Existing tenant — account linking & self-service

23. As an existing tenant, I want to link my app account to my existing Store All record, so that I can manage the unit(s) I already rent.
24. As an existing tenant, I want the app to find my record by matching my verified email, so that linking is automatic when my details are on file.
25. As an existing tenant whose email isn't on file, I want a staff-assisted way to link my account (verified at the office), so that I'm not locked out.
26. As an existing tenant, I want to see all of my units in one place, so that I can manage multiple rentals from one account.
27. As an existing tenant, I want to see each unit's number, site, gate code, and lease, so that I have everything I need in my pocket.
28. As an existing tenant, I want to see my current balance and next payment date, so that I stay on top of what I owe.
29. As an existing tenant (fast-follow), I want to make a one-off payment in the app, so that I can settle my balance without calling or visiting.
30. As an existing tenant (fast-follow), I want to enrol in and manage autopay, so that I never miss a payment and avoid arrears.
31. As an existing tenant (fast-follow), I want to update my saved card, so that autopay keeps working when my card changes.
32. As an existing tenant, I want a receipt for every payment, in the app and by email, so that I have a record.

### Notifications

33. As a customer, I want a push notification and email confirming my move-in with my gate code, so that I have it instantly and durably.
34. As a customer, I want a push notification and email receipt after each payment, so that I know it went through.
35. As a tenant (fast-follow), I want reminders before a payment is due and alerts if autopay fails or my card is expiring, so that I avoid falling behind.

### Staff / operations

36. As front-desk staff, I want online move-ins to appear in SiteLink exactly like desk move-ins, so that my existing workflow, reporting, and gate sync are unchanged.
37. As front-desk staff, I want to manually link an existing tenant's app account after verifying them in person, so that tenants with stale contact details can still self-serve.
38. As the business, I want every in-app payment posted back to the SiteLink ledger, so that SiteLink remains the single source of truth for money.

## Implementation Decisions

### Architecture & seams
- **Three-tier with a hard adapter boundary.** Flutter app → StoreAll backend (own domain API) → provider adapters. The app and backend domain speak StoreAll's vocabulary only; SiteLink terms never leak past the adapter.
- **Two provider ports (the single high test seam):**
  - `StorageProvider` — availability, pricing, unit assignment, tenant records, move-in, ledger/balance, gate-code retrieval. First implementation: **SiteLink adapter**.
  - `PaymentGateway` — charge, tokenize card, refund, receipt. First implementation: **RBC Plug and Pay adapter**.
- **Swappability is a first-class requirement.** A future product may bind a different backend system to `StorageProvider`, or a different processor to `PaymentGateway`, without touching the app or domain layer.

### System of record
- **SiteLink is authoritative** for units, unit types, rates, availability, tenants, ledgers, **VAT/tax**, and PTI gate access. The app **never computes tax or price** — it reads them from SiteLink and, after payment, **posts the receipt back** so the ledger stays correct.
- **SiteLink API access** is a hard pre-requisite (obtainable quickly per stakeholder). The adapter isolates this dependency.

### Booking & move-in
- Customer selects **by unit type**; the system **auto-assigns a specific available unit** at successful payment (avoids checkout race conditions and matches SiteLink's model).
- **Zero-desk move-in** is possible because the sites use **PTI electronic gates already integrated with SiteLink**: on move-in, SiteLink assigns the unit and gate code; the app relays the code to the customer.
- **Move-in charge = security deposit + prorated first month + optional contents protection + VAT**, all sourced from SiteLink.
- **Contents protection** is an **optional, default-offered (opt-out) line item**, prompted more strongly for high declared value.
- **Pricing is a flexible list of line items**, not fixed fields — this same model later powers "beyond storage" products.

### Identity & accounts
- **Login = email + email OTP (passwordless).** Mobile number is collected as a contact channel but **not** used for OTP/2FA in v1.
- **Existing-tenant linking** matches on **verified email** against SiteLink; **staff-assisted linking** is the fallback when no email match exists.
- **Accounts support multiple units** per tenant.

### Lease
- Store All's **own custom lease template** is the legal instrument (not SiteLink's). The backend merges tenant/unit/pricing data into it, the app captures an **in-app e-signature** (sufficient under the Barbados Electronic Transactions Act; **no witness/notary**), and the executed PDF is emailed and stored.

### Payments & data protection
- **RBC Plug and Pay** processes cards and **tokenizes** for autopay. **No raw card number (PAN) is ever stored** by StoreAll — only the token — keeping PCI scope minimal.
- **ID images and executed lease PDFs are stored in StoreAll's own encrypted object storage**, referenced by tenant, subject to a retention policy aligned with the **Barbados Data Protection Act 2019** (default: retain during tenancy, delete a defined period after move-out — to confirm).

### Notifications
- **Push + email** for transactional events (move-in confirmation with gate code, payment receipts). **SMS** is an available channel (number on file) but is reserved; not used for OTP.

## Testing Decisions

- **What makes a good test here:** it exercises **external, observable behaviour** ("customer completes checkout and receives a unit number, gate code, and lease PDF"; "existing tenant links by email and sees their balance"), not internal implementation. Tests must be **fast and deterministic**, which the adapter seam makes possible.
- **Primary seam — the two provider ports.** The bulk of tests run the app + backend domain against a **fake `StorageProvider`** and a **fake `PaymentGateway`**, never touching real SiteLink or RBC. This covers booking, full move-in, account linking, and autopay enrolment behaviour end-to-end and offline.
- **Contract tests per adapter.** The **SiteLink adapter** and **RBC adapter** are each contract-tested against the real service (or its sandbox) in isolation, verifying the adapter honours the port contract. These are separated from the main suite so third-party availability never flakes core tests.
- **Modules under test:** booking/availability, move-in orchestration (assignment → payment → lease → gate code), identity/OTP + tenant linking, pricing/line-items, and the two adapters.
- **Prior art:** none in this repo yet (current codebase is a single static dashboard `index.html`); these are new seams established by this PRD.

## Out of Scope

- **Any product beyond self-storage.** v1 *names* the ambition and preserves the affordances (swappable provider port + generic line-item model) but builds **no** second product, catalog UI, cart, or bundling.
- **The marketing/SEO website** and web-based booking — owned by a separate team and separate build. This PRD is the **Flutter native app only** (though the shared backend is client-agnostic and could serve the site later).
- **Native web / Flutter web** target.
- **Identity verification** of uploaded ID (liveness/biometric/document checks) — ID is collected but not verified in v1.
- **Move-out / notice-to-vacate, unit transfers, referrals, support ticketing** — v2.
- **SMS-based OTP** and SMS payment reminders (SMS reserved, not wired to OTP in v1).
- **Storing documents in SiteLink attachments** — v1 uses StoreAll's own encrypted storage.

## Further Notes

**Delivery phasing (from grilling):**
- **v1:** full online booking + zero-desk move-in, and a minimal "My Storage" (units, gate code, lease, balance, saved card) that move-in produces anyway.
- **v1.1 (fast-follow, directly serves the autopay/arrears goal):** in-app one-off payment, autopay enrol/manage, update card, payment reminders + failed-autopay/card-expiring alerts.
- **v2:** move-out/notice, transfers, multi-unit self-service, support, referrals; revisit SMS reminders and native web.

**Key risks / open items to track:**
1. **SiteLink API surface** — confirm the API exposes unit assignment, gate-code retrieval, ledger posting, and tenant create/link as needed by the adapter.
2. **Contact-data quality in SiteLink** — existing tenants without a valid email on file cannot auto-link and fall to the staff-assisted path; volume of these drives staff effort.
3. **RBC Plug and Pay tokenization** — confirm token lifecycle supports recurring autopay charges.
4. **ID-image retention policy** — confirm the specific post-move-out retention window under the Data Protection Act.
5. **Admin fee** — none assumed at move-in; confirm.

**Publishing note:** the `/to-prd` flow normally publishes this to the project
issue tracker with a `ready-for-agent` label. No tracker is configured yet
(`/setup-matt-pocock-skills` not run; Linear not authorized in this session), so
this PRD is committed to the repo instead. Once a tracker is set up, it can be
published and labelled.
