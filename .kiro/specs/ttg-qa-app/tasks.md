# Implementation Plan: TTG QA App

## Overview

Implement the TTG QA real-time classroom Q&A application incrementally. Each task produces working, integrated code. Tests are sub-tasks placed immediately after the code they exercise. The stack is Next.js 14 (App Router) + TypeScript + Tailwind CSS, with a `QuestionRepository` abstraction backed by SQLite (dev) and Postgres (prod).

---

## Tasks

- [x] 1. Scaffold the Next.js project and configure tooling
  - Initialise a Next.js 14 App Router project with TypeScript and Tailwind CSS (`npx create-next-app@latest --ts --tailwind --app --src-dir`)
  - Add runtime dependencies: `pg`, `better-sqlite3`, `uuid`
  - Add dev dependencies: `jest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jest-axe`, `fast-check`, `@types/better-sqlite3`, `@types/pg`, `@types/uuid`, `@lhci/cli`
  - Configure `jest.config.ts` with `ts-jest`, `jsdom` environment, and `moduleNameMapper` for path aliases
  - Create `tsconfig.json` path alias `@/*` → `src/*`
  - Create `.env.local` template with `DATABASE_URL` placeholder
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Define the shared `Question` type and validation utilities
  - [x] 2.1 Create `src/types/question.ts` exporting the `Question` interface and `CreateQuestionDTO` interface
    - Fields: `id: string`, `text: string`, `author: string | null`, `timestamp: string`
    - `CreateQuestionDTO`: `{ text: string; author: string | null }`
    - _Requirements: 4.1_

  - [x] 2.2 Create `src/lib/validation.ts` exporting `validateQuestionText(text: unknown): { isValid: boolean; error?: string }`
    - Returns `isValid: false` for empty/whitespace-only strings and strings exceeding 500 chars
    - Returns `isValid: true` for valid strings (1–500 non-whitespace-padded chars)
    - _Requirements: 1.4, 1.5, 4.4_

  - [ ]* 2.3 Write property test for `validateQuestionText` (Property 3a)
    - **Property 3: Invalid text is rejected at client and API** (client half)
    - **Validates: Requirements 1.4, 1.5, 4.4**
    - `// Feature: ttg-qa-app, Property 3: Invalid text is rejected at client and API`
    - Generate empty strings, whitespace-only strings, and strings `> 500` chars; assert `isValid: false` for all
    - Generate strings of length 1–500 with at least one non-whitespace char; assert `isValid: true`

- [x] 3. Implement the database schema and `QuestionRepository` interface
  - [x] 3.1 Create `src/lib/db/repository.ts` exporting the `QuestionRepository` interface
    - Methods: `findAll(): Promise<Question[]>` and `create(dto: CreateQuestionDTO): Promise<Question>`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.2 Create `src/lib/db/sqlite.ts` implementing `SQLiteQuestionRepository`
    - Use `better-sqlite3`; expose `initSchema()` to run `CREATE TABLE IF NOT EXISTS questions`
    - `create`: generate UUID v4 id, UTC ISO 8601 timestamp, insert row, return `Question`
    - `findAll`: query `ORDER BY timestamp DESC`, normalise timestamp to ISO string
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 3.3 Write unit + property tests for `SQLiteQuestionRepository` against `:memory:` database
    - **Property 2: GET returns all persisted questions, newest first**
    - **Validates: Requirements 2.2, 4.2**
    - `// Feature: ttg-qa-app, Property 2: GET returns all persisted questions, newest first`
    - Generate arbitrary arrays of `CreateQuestionDTO` values, insert all, call `findAll()`, assert descending timestamp order
    - **Property 4: Null author stored and returned correctly**
    - **Validates: Requirements 1.8, 4.1**
    - `// Feature: ttg-qa-app, Property 4: Null author stored and returned correctly`
    - Generate valid texts with null/undefined/empty author; assert returned `author === null`
    - Unit tests: `create` returns record with matching text/author and valid UUID + ISO timestamp; `findAll` returns `[]` when table is empty

  - [x] 3.4 Create `src/lib/db/postgres.ts` implementing `PostgresQuestionRepository`
    - Use `pg` Pool; same `findAll`/`create` contract as SQLite implementation
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.5 Create `src/lib/db/index.ts` exporting `getRepository(): QuestionRepository`
    - Return `SQLiteQuestionRepository` when `NODE_ENV === 'test'` or `DATABASE_URL` is absent
    - Return `PostgresQuestionRepository` otherwise
    - _Requirements: 4.1_

- [x] 4. Checkpoint — run tests and verify the data layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement the API route handlers
  - [x] 5.1 Create `src/app/api/questions/route.ts` with `GET` and `POST` handlers
    - `GET`: call `repo.findAll()`, return `NextResponse.json(questions, { status: 200 })`; catch DB errors → 503; catch unexpected errors → 500
    - `POST`: parse JSON body, validate `text` with `validateQuestionText`, call `repo.create(dto)`, return 201; return 400 on validation failure or malformed body; return 503 on DB error
    - _Requirements: 1.3, 1.6, 1.7, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.2 Write property test for POST route handler (Property 1)
    - **Property 1: Question submission round-trip**
    - **Validates: Requirements 1.3, 1.6, 4.3**
    - `// Feature: ttg-qa-app, Property 1: Question submission round-trip`
    - Generate arbitrary valid `{ text, author }` pairs; call the POST handler with a mock repo; assert HTTP 201, response body contains same text/author, a UUID `id`, and a parseable ISO 8601 UTC timestamp

  - [ ]* 5.3 Write property test for POST route handler — invalid inputs (Property 3b)
    - **Property 3: Invalid text is rejected at client and API** (API half)
    - **Validates: Requirements 1.4, 1.5, 4.4**
    - `// Feature: ttg-qa-app, Property 3: Invalid text is rejected at client and API`
    - Generate empty strings, whitespace-only strings, strings > 500 chars; call POST handler directly; assert HTTP 400 and `error` field present

  - [ ]* 5.4 Write unit tests for route handlers
    - Test all success paths (GET 200, POST 201)
    - Test all error paths: 400 missing text, 400 empty text, 400 text > 500 chars, 400 malformed JSON, 503 DB unavailable
    - Mock `QuestionRepository` with `jest.mock`
    - _Requirements: 1.3, 1.6, 1.7, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement UI components
  - [x] 6.1 Create `src/components/QuestionCard.tsx`
    - Props: `question: Question`
    - Render `text`, `timestamp` formatted with `toLocaleString()`, and `author ?? "Anonymous"`
    - Use semantic HTML (`<article>`, `<time dateTime={timestamp}>`)
    - _Requirements: 2.3, 5.1_

  - [ ]* 6.2 Write property test for `QuestionCard` (Property 6)
    - **Property 6: Question card displays all required fields**
    - **Validates: Requirements 2.3**
    - `// Feature: ttg-qa-app, Property 6: Question card displays all required fields`
    - Generate random `Question` objects with varying text, timestamp, and nullable author; render `QuestionCard`; assert rendered output contains the text, a timestamp string, and either the author value or "Anonymous"

  - [x] 6.3 Create `src/components/QuestionList.tsx`
    - Props: `QuestionListProps` (questions, loading, error, hasPriorData)
    - Render loading skeleton when `loading && !hasPriorData`
    - Render empty-state message when `!loading && questions.length === 0 && !error`
    - Render non-blocking error banner when `error && hasPriorData`; render full-page error when `error && !hasPriorData`
    - Map over `questions` rendering `<QuestionCard>` for each
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

  - [ ]* 6.4 Write unit tests for `QuestionList`
    - Test: loading indicator renders; empty-state message renders; error banner renders when prior data exists; full-page error renders when no prior data; list of `QuestionCard` elements renders
    - _Requirements: 2.1, 2.4, 2.5, 2.6_

  - [x] 6.5 Create `src/components/QuestionForm.tsx`
    - Props: `QuestionFormProps` (`onSubmitted: (q: Question) => void`)
    - Controlled inputs for `questionText` (max 500) and `author` (max 100) with visible `<label>` / `htmlFor`
    - Submission state machine: `idle | submitting | success | error`
    - Client-side validation using `validateQuestionText` before fetch; display error adjacent to field
    - On success: clear `questionText`, call `onSubmitted(newQuestion)`, restore button label
    - On submission in-progress: disable submit button, show loading indicator in button
    - On API error (non-2xx): display error message, re-enable button
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.6 Write property test for `QuestionForm` reset behaviour (Property 8)
    - **Property 8: Form resets after successful submission**
    - **Validates: Requirements 5.4**
    - `// Feature: ttg-qa-app, Property 8: Form resets after successful submission`
    - Generate arbitrary valid question submissions; simulate a 201 API response via `fetch` mock; assert form text field is cleared, button is enabled, and button label is restored to default

  - [ ]* 6.7 Write unit tests for `QuestionForm`
    - Test: empty submit shows validation error; text > 500 chars shows character-limit error; button disabled and loading indicator shown during submission; field cleared and button re-enabled on success; error message shown on 503; label/input associations present
    - _Requirements: 1.4, 1.5, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Checkpoint — run tests and verify all UI components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement `usePoller` hook
  - [x] 8.1 Create `src/hooks/usePoller.ts`
    - Accept `{ onQuestions, onError, onStopped, intervalMs = 5000, maxConsecutiveFailures = 6 }`
    - Use `setTimeout` (not `setInterval`) — measure interval from response completion
    - Track `consecutiveFailures`; at `maxConsecutiveFailures` call `onStopped()` and cancel timer
    - `restart()` resets counter and resumes polling
    - Return `{ stopped: boolean; restart: () => void }`
    - Clean up timer in `useEffect` cleanup
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 8.2 Write property test for `usePoller` stop behaviour (Property 7)
    - **Property 7: Poller stops after N consecutive failures**
    - **Validates: Requirements 3.5**
    - `// Feature: ttg-qa-app, Property 7: Poller stops after N consecutive failures`
    - Generate `n ≥ 6` consecutive failures (via `fc.integer({ min: 6, max: 20 })`); simulate that many failed fetches using `jest.spyOn(global, 'fetch')`; assert `onStopped` was called and no further fetch is scheduled after stop

  - [ ]* 8.3 Write unit tests for `usePoller`
    - Test: `onStopped` called after exactly 6 consecutive failures; `restart()` resets counter and resumes; timer cleaned up on unmount; `consecutiveFailures` resets to 0 on successful fetch
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [x] 9. Implement the Page component and wire everything together
  - [x] 9.1 Create `src/app/page.tsx` as a Client Component (`"use client"`)
    - Own state: `questions: Question[]`, `loadingInitial: boolean`, `fetchError: string | null`, `hasPriorData: boolean`, `pollerStopped: boolean`, `connectivityBanner: string | null`
    - Wire `usePoller`: `onQuestions` merges incoming questions using ID-based deduplication (Property 5), `onError` sets connectivity banner and increments failure state, `onStopped` sets `pollerStopped: true`
    - Wire `QuestionForm.onSubmitted`: inject new question at index 0 of the list
    - Render connectivity banner at page top (non-blocking, visible without scrolling) when `connectivityBanner` is set
    - Render "Connection lost. [Retry]" UI with `restart()` callback when `pollerStopped` is true
    - Render `<QuestionForm>` and `<QuestionList>` with all props
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 3.2, 3.3, 3.4, 3.5, 5.1_

  - [x] 9.2 Implement the deduplication merge utility in `src/lib/mergeQuestions.ts`
    - `mergeQuestions(existing: Question[], incoming: Question[]): Question[]`
    - Append incoming questions whose `id` is not already in the existing list, preserving existing relative order
    - Return result ordered by `timestamp` descending
    - _Requirements: 3.2_

  - [ ]* 9.3 Write property test for deduplication merge (Property 5)
    - **Property 5: Poller deduplication preserves list integrity**
    - **Validates: Requirements 3.2**
    - `// Feature: ttg-qa-app, Property 5: Poller deduplication preserves list integrity`
    - Generate arbitrary existing question lists and incoming poll arrays with overlapping IDs; apply `mergeQuestions`; assert no duplicate IDs and relative order of pre-existing questions is preserved

  - [ ]* 9.4 Write unit tests for `page.tsx`
    - Test: `onSubmitted` prepends new question; connectivity banner appears on poll error; "Connection lost" message + Retry button appears when `pollerStopped`; Retry calls `restart()`
    - _Requirements: 3.4, 3.5_

- [x] 10. Add accessibility and integration tests
  - [x] 10.1 Write `jest-axe` accessibility tests for `QuestionForm` and `QuestionList`
    - Assert `toHaveNoViolations()` for both components in all significant render states (idle, loading, error, non-empty list)
    - _Requirements: 5.2, 5.6_

  - [x] 10.2 Write integration tests using SQLite `:memory:` wired to the route handlers
    - End-to-end POST → GET round trip: submitted question appears in subsequent GET response (Property 1, integration variant)
    - GET returns `[]` when no questions exist
    - GET returns questions ordered by timestamp descending when multiple exist (Property 2, integration variant)
    - POST with DB throwing connection error → route handler returns 503
    - _Requirements: 1.3, 1.6, 2.2, 4.2, 4.3_

  - [x] 10.3 Create Lighthouse CI configuration file `lighthouserc.json` at project root
    - Target `http://localhost:3000`; assert `categories.accessibility >= 0.9`
    - _Requirements: 5.6_

- [x] 11. Final checkpoint — full test suite and build verification
  - Ensure all tests pass, ask the user if questions arise.
  - Run `next build` and confirm zero TypeScript errors and a successful production build.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Each task references specific requirements clauses for traceability
- Property tests use `fast-check` with a minimum of 100 iterations per property
- All property tests include the required comment tag: `// Feature: ttg-qa-app, Property N: <description>`
- The `SQLiteQuestionRepository` is used for all automated tests (`:memory:` mode); `PostgresQuestionRepository` is tested by the integration environment only
- The Lighthouse CI config (task 10.3) is a static file; running Lighthouse CI requires the app to be served — instruct the user to run `npx lhci autorun` manually after starting the dev server

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["2.3", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.4"] },
    { "id": 3, "tasks": ["3.3", "3.5"] },
    { "id": 4, "tasks": ["5.1", "6.1", "8.1", "9.2"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "6.2", "9.3"] },
    { "id": 6, "tasks": ["6.3", "6.5"] },
    { "id": 7, "tasks": ["6.4", "6.6", "6.7", "8.2", "8.3"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.4"] },
    { "id": 10, "tasks": ["10.1", "10.2", "10.3"] }
  ]
}
```
