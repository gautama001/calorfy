# Calorfy Pro foundation

## Product decision

Calorfy Pro starts as a desktop-first web dashboard for nutritionists and personal trainers. The existing Expo application remains the consumer client. Both surfaces share Supabase Auth, the domain model and the curated nutrition graph; they do not share navigation or expose the service-role key.

A separate professional mobile application is a later product decision. It is justified only if validated workflows require frequent mobile review, messaging or notifications.

## Trust boundary

A professional profile does not grant access to another user's information. Access requires all of the following:

1. The professional creates a short-lived, single-use invitation.
2. The authenticated client previews the professional identity and verification status.
3. The client explicitly accepts the relationship and selects scopes.
4. The relationship remains active.
5. The requested operation is permitted by the selected scope.

The invitation stores only a SHA-256 hash. Calorfy never stores the raw invitation token. A client or professional can end the relationship, and the client owns all permission changes.

The foundation migration intentionally does **not** change RLS on meals, goals, weights or images. Health-data access will be enabled one resource at a time after the consent UI and access tests exist.

## First data model

- `professional_profiles`: professional type, public identity and verification state.
- `professional_invites`: expiring single-use invitation hashes.
- `professional_client_relationships`: durable relationship lifecycle.
- `professional_client_permissions`: client-controlled diary, weight, goals and photo scopes.
- `professional_access_audit`: immutable relationship and permission history visible to both participants.

Professional verification cannot be self-assigned. Profile writes go through an RPC that preserves or resets verification when credentials change.

## Role boundary

The first professional types are:

- `nutritionist`: may eventually propose nutrition goals, meal plans and food corrections within the professional's legal scope.
- `personal_trainer`: may eventually review consented adherence summaries and coordinate training-related habits, but is not represented as providing clinical nutrition treatment.

Capabilities must be checked per action. A global account role is insufficient because the same person may be a consumer, a professional and a client of another professional.

## MVP dashboard

The first useful vertical slice is deliberately small:

1. Professional creates or updates their profile.
2. Professional generates an invitation link.
3. Client previews the invitation inside the consumer app.
4. Client selects scopes and accepts.
5. Professional sees the client in a desktop list.
6. Client can change scopes or end access.

Only after this flow is tested should the dashboard add:

- weekly adherence summary;
- consented diary timeline;
- weight and goal trends;
- professional comments and check-ins;
- Sidekick-generated draft summaries requiring professional review.

## Sidekick boundary

Sidekick prepares evidence and drafts; it does not diagnose, prescribe or silently modify a client's plan. Every generated statement must keep:

- the observation window;
- the supporting product events;
- confidence or data completeness;
- the professional action that approved, edited or dismissed it.

AI providers are replaceable. Calorfy's durable assets are the nutrition graph, correction history, behavioral features, professional workflow and measured outcomes.

## Repository direction

Do not split the current repository before the first professional workflow is validated. The target structure after validation is:

```text
apps/
  consumer-mobile/
  professional-web/
packages/
  domain/
  data/
  i18n/
  design-system/
  analytics/
```

The professional dashboard can begin as a small web client while domain types and Supabase repositories remain extractable. Prematurely moving the current app would add launch risk without validating professional demand.

## Validation partners

Before expanding the dashboard, recruit three nutritionists and three personal trainers. Observe their existing weekly workflow and measure:

- time spent preparing a client review;
- number of tools used per client;
- information missing before a consultation;
- percentage of invited clients who share data;
- weekly active professionals;
- time saved by a Sidekick summary;
- percentage of generated observations approved, edited or dismissed.

The professional product is validated when it saves recurring work and improves the quality of a real consultation, not merely when the dashboard contains many features.
