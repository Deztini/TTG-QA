# Requirements Document

## Introduction

TTG QA is a real-time classroom question-and-answer web application. Students can submit questions through a simple form, and all submitted questions are visible to everyone in reverse chronological order. The application is built with Next.js and TypeScript on the frontend, uses Tailwind CSS for styling, and persists questions in a Postgres database (or SQLite for local development) via Next.js API routes. Questions appear in the list without requiring a page refresh, achieved through polling or a real-time mechanism.

## Glossary

- **QA_App**: The TTG QA web application as a whole.
- **Question_Form**: The UI component that allows a student to type and submit a question.
- **Question_List**: The UI component that displays all submitted questions in reverse chronological order.
- **Question**: A record consisting of an `id`, `text`, `author` (optional), and `timestamp`.
- **API**: The Next.js API routes that handle question submission and retrieval.
- **Database**: The Postgres database (or SQLite in local development) that stores all questions.
- **Student**: An end user who submits or views questions via the QA_App.
- **Poller**: The client-side mechanism that periodically fetches new questions without a full page reload.

---

## Requirements

### Requirement 1: Submit a Question

**User Story:** As a student, I want to type a question into a form and submit it, so that my question is recorded and visible to everyone in the session.

#### Acceptance Criteria

1. THE Question_Form SHALL contain a text input field for the question text (max 500 characters) and a submit button.
2. THE Question_Form SHALL contain an optional text input field for the student's name (author, max 100 characters).
3. WHEN a student submits the form with a non-empty question text (1–500 characters), THE API SHALL persist the question to the Database with a server-generated `id` and UTC `timestamp`.
4. WHEN a student submits the form with an empty question text, THE Question_Form SHALL display a validation error message and SHALL NOT submit the question to the API.
5. WHEN a student submits the form with question text exceeding 500 characters, THE Question_Form SHALL display a validation error message indicating the character limit and SHALL NOT submit the question to the API.
6. WHEN the API successfully persists a question, THE API SHALL return the created question record (including `id`, `text`, `author`, and `timestamp`) with HTTP status 201.
7. IF the Database is unavailable when a question is submitted, THEN THE API SHALL return an error response with HTTP status 503, and THE Question_Form SHALL display a user-facing error message indicating the submission failed.
8. WHEN the author field is left empty, THE API SHALL store the question with a null author value.

---

### Requirement 2: View All Questions

**User Story:** As a student, I want to see all submitted questions in reverse chronological order, so that I can follow the most recent discussion.

#### Acceptance Criteria

1. WHEN the QA_App loads, THE Question_List SHALL display a loading indicator while fetching questions from the API, and SHALL render the list only after the fetch completes.
2. WHEN the QA_App loads and the fetch completes successfully, THE Question_List SHALL display all existing questions retrieved from the Database, ordered by `timestamp` descending.
3. THE Question_List SHALL display the question `text`, `timestamp`, and `author` (or "Anonymous" when author is null) for each question.
4. WHEN the Database contains no questions, THE Question_List SHALL display an empty-state message indicating no questions have been submitted yet.
5. IF the API returns an error when fetching questions AND questions were previously loaded, THEN THE Question_List SHALL display a non-blocking error message and SHALL retain the previously loaded questions.
6. IF the API returns an error when fetching questions AND no questions were previously loaded, THEN THE Question_List SHALL display an error message in place of the list.

---

### Requirement 3: Real-Time Question Updates

**User Story:** As a student, I want newly submitted questions to appear in the list without refreshing the page, so that I can follow the session in real time.

#### Acceptance Criteria

1. THE Poller SHALL periodically request the latest questions from the API, with an interval of no greater than 5 seconds measured from the completion of one response to the start of the next request.
2. WHEN the Poller receives a response, THE Question_List SHALL be updated by comparing incoming question IDs against existing IDs, appending any new questions to the top of the list while preserving the order and content of existing questions, without a full page reload.
3. WHILE the QA_App page is open and has not been navigated away from, THE Poller SHALL continue polling.
4. WHEN the Poller receives a network error, THE QA_App SHALL resume polling at the next scheduled interval and SHALL display a non-blocking connectivity indicator visible without scrolling.
5. IF the Poller has received 6 or more consecutive network errors (approximately 30 seconds of connectivity failure), THEN THE QA_App SHALL stop polling and SHALL display a message prompting the student to retry manually, including a retry button that resumes polling when clicked.

---

### Requirement 4: Question Data Model

**User Story:** As a developer, I want a well-defined question data model, so that the frontend and backend share a consistent structure.

#### Acceptance Criteria

1. THE Database SHALL store each Question with the fields: `id` (unique identifier), `text` (non-empty string, max 500 characters), `author` (nullable string, max 100 characters when provided), and `timestamp` (UTC datetime of creation).
2. THE API SHALL expose a `GET /api/questions` endpoint that returns an array of Question records ordered by `timestamp` descending, or an empty array when no questions exist.
3. THE API SHALL expose a `POST /api/questions` endpoint that accepts a JSON body containing `text` (required) and `author` (optional), and returns the created Question record including `id`, `text`, `author`, and `timestamp`.
4. IF a `POST /api/questions` request body is missing the `text` field, contains an empty `text` value, or contains `text` exceeding 500 characters, THEN THE API SHALL return an error response with HTTP status 400 and an error message identifying the failing field.
5. IF a `POST /api/questions` request body is malformed or has a non-JSON content type, THEN THE API SHALL return an error response with HTTP status 400 and a descriptive error message.

---

### Requirement 5: UI and Accessibility

**User Story:** As a student, I want the application to be easy to use and accessible, so that I can submit and view questions without difficulty.

#### Acceptance Criteria

1. THE QA_App SHALL render correctly on viewport widths from 320px to 1920px without horizontal scrolling or overlapping elements.
2. THE Question_Form SHALL associate all input fields with visible labels using HTML `for`/`id` attribute pairs or ARIA equivalents.
3. WHILE a submission request is in progress, THE Question_Form submit button SHALL be disabled and SHALL display a loading indicator in place of its default label.
4. WHEN a question is successfully submitted, THE Question_Form SHALL clear the question text field, re-enable the submit button, and restore its default label to allow a new question to be entered.
5. WHEN a student attempts to submit the Question_Form with the required question text field empty, THE Question_Form SHALL display a visible error message adjacent to the field identifying it as required.
6. THE QA_App SHALL achieve a Lighthouse accessibility score of 90 or above when tested in a standard browser environment.
