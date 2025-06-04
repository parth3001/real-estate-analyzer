# Frontend Update Plan for Unified Backend (2025-06-03)

## Overview
This plan outlines the steps needed to update the frontend to align with the new unified backend API, TypeScript-first workflow, sample endpoints, and automated smoke testing.

---

## 1. Update API Service Layer
- Use the unified `/api/deals/analyze` endpoint for both SFR and MF analysis.
- Add calls to `/api/deals/sample-sfr` and `/api/deals/sample-mf` for demo/testing or form prefill.

## 2. Update Data Types and Interfaces
- Ensure the frontend sends a payload with a `propertyType` field (`'SFR'` or `'MF'`) and the correct structure for each property type.
- Update frontend types to expect the unified response:
  - `monthlyAnalysis`
  - `annualAnalysis`
  - `longTermAnalysis`
  - `keyMetrics`
  - `aiInsights`

## 3. Update Forms and Submission Logic
- Ensure both SFR and MF forms build the payload according to the backend's expected structure.
- On submit, POST to `/api/deals/analyze` with the correct `propertyType`.

## 4. Update Analysis Results Display
- Expect and render the unified analysis object.
- Handle both SFR and MF metrics and projections.
- Display `aiInsights` if present.

## 5. Update Error Handling
- Handle new error response format (with `error`, `code`, and `details` fields).
- Show user-friendly messages for validation and server errors.

## 6. Update Saved Deals (if applicable)
- Ensure saved deals use the new unified data structure.
- Update any local storage or state management logic to match the backend contract.

## 7. Update/Write Frontend Tests
- Update or add tests to verify:
  - Correct payloads are sent for both SFR and MF.
  - The UI correctly renders the unified analysis response.
  - Error handling works with the new format.

## 8. (Optional) Add Smoke Test UI
- Optionally, add a simple UI or dev tool to call the sample endpoints and display the results for quick manual verification.

---

## Summary Table

| Area                | Change Needed                                      |
|---------------------|----------------------------------------------------|
| API Service         | Use `/api/deals/analyze` for all analysis          |
| Data Types          | Update to unified response structure               |
| Forms               | Ensure correct payload with `propertyType`         |
| Results Display     | Render unified analysis object                     |
| Error Handling      | Handle new error format                            |
| Saved Deals         | Use new structure                                  |
| Tests               | Update for new API and types                       |
| (Optional) Dev UI   | Add sample endpoint viewer                         |

---

## Next Steps
1. Review and update your API service and types.
2. Update forms and results components.
3. Test end-to-end with both SFR and MF flows.

Refer to this plan whenever you resume frontend work to stay aligned with the backend changes made on 2025-06-03. 