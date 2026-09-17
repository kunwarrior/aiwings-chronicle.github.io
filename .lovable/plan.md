# Backend Control Panel for Admin

## Goal
Add a manual backend control section inside the Admin panel so the user can see when the hosted backend is active or sleeping, wake it up on demand, and put the public site in maintenance mode when needed.

## What is actually possible
The deployed frontend/edge function cannot directly pause/resume the Lovable Cloud infrastructure — that requires platform-level privileges. So instead of a true "Pause Cloud" button, we will build the closest practical controls:

- Show current backend status (active / waking up / paused).
- A "Wake backend now" button that runs a quick query to warm up the instance.
- A "Maintenance mode" toggle that blocks public visitors with a maintenance page, while keeping `/admin` accessible so the user can turn it back off.

## Plan

1. **Extend `site_settings` for maintenance mode**
   - Add a new `maintenance` row/key to `public.site_settings`.
   - Value shape: `{ enabled: boolean, message?: string }`.

2. **Create `CloudControlPanel.tsx`**
   - Display current backend status fetched from a new `cloud-status` edge-function action.
   - Show a "Wake backend" button that calls a `wake` edge-function action.
   - Show a "Maintenance mode" switch + optional custom message input.
   - Save the maintenance setting via the existing `update` path on `site_settings`.

3. **Add a "Cloud" tab to Admin.tsx**
   - Place it after "Settings" in the tab list.
   - Render `<CloudControlPanel password={password} />`.

4. **Extend `admin-api` edge function**
   - Add `action: "cloud-status"`: run a lightweight `select 1` query through service-role client and return `{ status: "active" | "unhealthy" | "paused", latencyMs }`.
   - Add `action: "wake"`: same lightweight query, just to trigger wake-up; return `{ ok: true }`.

5. **Gate public routes with maintenance mode**
   - In `App.tsx`, wrap public routes (`/`, `/event/:id`) with a small `MaintenanceGuard` component.
   - The guard reads `site_settings.maintenance` from Supabase on load.
   - If enabled, show a maintenance screen instead of the route.
   - Always allow `/admin`, `/reset-password`, and auth flows so the user can disable maintenance mode.

6. **Verify**
   - Check build after edits.
   - Use the preview to confirm the new Cloud tab renders, status loads, maintenance toggle saves, and the public site shows maintenance when enabled.
