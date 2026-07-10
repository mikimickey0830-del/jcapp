# Ver.1 Operation Test

Tested on 2026-07-10 against the configured Supabase project.

## Result

| Scenario | Result | Verification |
| --- | --- | --- |
| Create a fiscal year | Pass | The fiscal year was saved to `fiscal_years`. |
| Register a member | Pass | The member was saved to `members`. |
| Create a committee | Pass | The committee was saved to `committees`. |
| Assign multiple committees | Pass | Two active `committee_memberships` were saved for one member and fiscal year. |
| Create an event | Pass | The event was saved to `events` and appeared in the schedule list and detail page. |
| Generate attendance | Pass | An `attendance_responses` row was generated for the target member. |
| Answer attendance | Pass | The iPhone-width response form saved an attending response and redirected to the event detail page. |
| Check attendance summary | Pass | The detail page showed a 100% response rate and one attending member. |
| Register a document | Not implemented | The upload screen is intentionally UI-only; Supabase Storage and metadata save are not connected. |
| Create an announcement | Not implemented | The creation screen is intentionally UI-only; Supabase save and notification linkage are not connected. |

## Issues Found And Fixed

1. Newly created events could remain hidden because schedule-related pages were statically generated or reused cached Supabase GET responses.
   - Added dynamic rendering and `noStore()` to the home, schedule, attendance, detail, edit, and form-option pages that read operational data.

2. The schedule list selected the first fiscal year in the returned data, which could hide events in another fiscal year.
   - The schedule list now shows events across fiscal years and groups the calendar view by year and month.

3. Several operation forms and UI-only screens needed clearer Japanese labels and an explicit non-saving state.
   - Updated the member, fiscal-year, committee, assignment, document, and announcement forms. Document and announcement forms now clearly state that saving is not implemented and keep the save button disabled.

## iPhone Check

Checked at a 390px viewport on the schedule, assignment editor, attendance response, document upload, and announcement creation screens. No horizontal overflow was detected.

## Remaining Work Before Production

- Implement document metadata save and Supabase Storage upload/download.
- Implement announcement save, publication control, and notification linkage.
- Add Supabase Auth and replace development-wide RLS policies with LOM-scoped role policies.
- Add automated end-to-end tests and a repeatable test-data cleanup procedure.
