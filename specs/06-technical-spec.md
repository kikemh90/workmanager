# Technical Specification - WorkManager V1

## 1. Technical objective

Build a static PWA that runs on GitHub Pages, stores business data locally in the browser, and supports fast CRUD plus filtering for tasks and journal entries.

## 2. Architecture overview

Recommended stack:

- HTML for structure;
- CSS for layout and responsive presentation;
- vanilla JavaScript for application logic;
- IndexedDB for persistent domain data;
- localStorage for lightweight UI preferences only;
- Service Worker for offline shell caching;
- Web App Manifest for installability.

## 3. Application structure

The application should behave as a single-page app with internal view switching.

Core UI areas:

- dashboard workspace for KPI summaries;
- persistent top navigation for the five top-level areas;
- daily task workspace as the default landing view;
- gestor workspace for clients and shared projects;
- diary workspace for knowledge entries;
- configuration workspace for statuses and app preferences;
- inline editor/table inside the daily workspace for task create/edit flows.
- task table read mode plus global edit mode toggle.

The app must not depend on server-side routing.

### 3.1 Navigation model

Recommended top-level views:

- `dashboard`;
- `daily`;
- `gestor`;
- `diary`;
- `config`.

Recommended subviews:

- within `config`: `statuses` and optional future settings sections.

Implementation rules:

- the daily view is the default route/state on first load;
- the active top-level view should be stored locally for convenience;
- navigation should use hash-based routing or equivalent stateful routing compatible with GitHub Pages;
- navigation must be state-driven, not page-reload driven;
- daily task rows should render as an actual table with one column per field and a prominent project column;
- the daily view should include a top-row creation line and inline editing for existing tasks, gated by a global edit mode;
- the daily view should include a left-most clickable star column for `Mi día`;
- the daily view should default to non-completed tasks only;
- the daily view should expose the quick views `all`, `my-day`, `today`, `upcoming`, and `overdue`;
- the task sorting pipeline should always apply the starred-state boost first and then the currently selected sort field;
- the daily view should expose show/hide completed and sortable headers for due date, priority, status, and `Cliente - Proyecto`;
- the daily view should use native date inputs when edit mode is active and formatted labels in read mode;
- the gestor workspace should expose CRUD for clients and the shared project catalog;
- the diary workspace should expose CRUD for entries plus project filter and content search.

## 4. Domain model

### 4.1 Project

Suggested fields:

- `id` string, generated UUID;
- `name` string, required;
- `clientId` string | null;
- `description` string, optional;
- `color` string, optional;
- `isActive` boolean;
- `archivedAt` string | null;
- `createdAt` string ISO timestamp;
- `updatedAt` string ISO timestamp.

Behavior:

- active projects appear in selectors and project lists;
- projects are the shared catalog consumed by both Tasks and Diary;
- archived projects remain readable for historical tasks;
- archived projects are excluded from default create flows unless explicitly requested;
- archived projects can be reactivated by setting `isActive` back to true and clearing `archivedAt`.

### 4.2 Task

Suggested fields:

- `id` string, generated UUID;
- `title` string, required;
- `description` string, optional;
- `projectId` string | null;
- `responsibleName` string | null, defaulting to `Kike` for new task creation rows;
- `priority` string, one of `high`, `medium`, `low`;
- `isStarred` boolean, default `false`, used by the `Mi día` quick filter;
- `statusId` string;
- `dueDate` string | null, stored as ISO date;
- `reminderDate` string | null, stored as ISO date;
- `reminderMode` string, `dueDate` by default and `manual` when the user overrides the calculated reminder;
- `completedAt` string | null;
- `createdAt` string ISO timestamp;
- `updatedAt` string ISO timestamp;
- `isArchived` boolean.

Behavior:

- `projectId` is optional;
- `responsibleName` is optional and free-text;
- project selectors in the task table should reuse the same `Cliente - Proyecto` labeling convention as Diary when client data exists;
- priority should remain visually encoded through color in both read and edit modes;
- the star marker should remain clickable in read mode because it acts as a day-focus toggle, not as a full edit action;
- due date should preserve urgency colors in the task table;
- the task table should not use a green success row state; neutral rows remain unaccented while warning rows use stronger amber/red contrast;
- completion toggles the task status to the completed status and sets `completedAt`;
- reopening clears `completedAt` and restores the previous active status when possible.

### 4.3 Task status catalog

Because the user can redefine task statuses, statuses should be stored as data instead of hardcoded UI strings.

Suggested fields:

- `id` string, stable internal identifier;
- `label` string, display name;
- `order` number;
- `isActive` boolean;
- `isBuiltIn` boolean;
- `mapsToComplete` boolean.

Default seed:

- pending;
- in progress;
- blocked;
- completed.

Rules:

- users can rename and reorder statuses;
- users can add new statuses;
- users can deactivate statuses that are not needed;
- deleting a status that is in use should deactivate it instead of removing it;
- renaming a status updates the display label only and keeps the id stable;
- the completed built-in status must remain mapped even if its label changes.
- the completed status is protected from deletion and deactivation.

### 4.4 App settings

Suggested fields:

- `key` string;
- `value` any JSON-serializable payload.

Use this store for:

- reminder window days;
- default priority;
- last selected top-level view;
- last selected entity subview;
- optional UI preferences.
- task table preferences for sorting, completed visibility, and edit mode.
- diary filter state and content search state.

### 4.5 Journal model

Suggested stores:

- `journalClients`;
- `journalEntries`.
- `journalProjects` may remain as a legacy compatibility store, but the live shared project catalog is `projects`.

Suggested fields:

`journalClients`

- `id` string;
- `name` string, required;
- `createdAt` string ISO timestamp;
- `updatedAt` string ISO timestamp.

`journalEntries`

- `id` string;
- `projectId` string | null;
- `title` string | null;
- `content` string, required;
- `createdAt` string ISO timestamp;
- `updatedAt` string ISO timestamp.

## 5. IndexedDB design

Recommended database name:

- `workmanager-db`

Recommended version:

- `2`

Recommended object stores:

### 5.1 `projects`

Key path:

- `id`

Indexes:

- `byName`
- `byIsActive`
- `byUpdatedAt`

### 5.2 `tasks`

Key path:

- `id`

Indexes:

- `byProjectId`
- `byStatusId`
- `byPriority`
- `byDueDate`
- `byReminderDate`
- `byResponsibleName`
- `byCompletedAt`
- `byUpdatedAt`

### 5.3 `taskStatuses`

Key path:

- `id`

Indexes:

- `byOrder`
- `byIsActive`

### 5.4 `appSettings`

Key path:

- `key`

Use this store for:

- reminder window days, default 5;
- default priority;
- last selected view;
- last selected top-level area;
- last selected subview inside config;
- optional UI preferences.
- diary filter state and free-text search state.

Backup rule:

- data export/import should use a JSON payload containing tasks, projects, task statuses, journal clients, legacy journal projects if present, journal entries, and app settings;
- import should validate the payload before replacing local data.
- the backup payload should also carry local UI state for app view, task table view, and diary filters when available.
- import should clear and replace all object-store data for the active origin in one write transaction.

## 6. UX refinement requirements

The current product iteration focuses on reducing layout waste without changing the domain model or removing previously approved behaviors.

Implementation rules:

- the app shell must keep navigation grouped into primary and secondary sections;
- the top-level route state remains hash-based and continues to be persisted in localStorage;
- the task table remains the main interaction surface, with dense spacing and compact controls;
- the diary modal is implemented as a DOM overlay using the same data model and form validation as the previous inline entry form;
- the modal flow is a UI enhancement only and must not introduce a server dependency;
- the reminder calculation must avoid timezone drift by using local date arithmetic instead of UTC serialization when computing the default reminder date.

This requirement set ensures that the final UX remains compact and fast while preserving the product's business logic and local-first model.

## 6. Filtering and derived views

Derived views should be computed in application code from persisted data.

Required derived views:

- all tasks;
- today;
- upcoming;
- overdue;
- tasks by project;
- completed archive.

Filtering rules:

- filters are combinable;
- missing project means the task appears in the uncategorized view or in all-tasks views;
- overdue means due date earlier than today and task not completed;
- upcoming means due date is after today and within the configured window;
- task view/filter state should persist locally in browser preferences so the user can resume the same view after reload.
- the task table should sort in-memory from the currently filtered dataset.
- the diary view should support project filtering including `Sin proyecto`;
- the diary content search should match the free-text body of each entry.

UI state persistence rule:

- top-level navigation state should persist separately from task filters;
- task filters should restore the last daily workspace state without forcing the user back into edit/config screens;
- task table state should persist edit mode, completed visibility, and sort selection.
- diary filter/search state should persist independently from the task table state.

## 7. Reminder strategy

V1 reminder behavior is in-app only.

Implementation rule:

- when the app loads or becomes active, it should evaluate due dates and reminder dates against the current date/time;
- overdue tasks should be visually emphasized immediately;
- reminder banners/toasts must be driven from local state, not push delivery.

Reminder modes:

- due-date reminder based with a fixed 5-day offset;
- manual reminder override stored per task when the user changes the derived date.

Date handling rule:

- dates are persisted as ISO `yyyy-mm-dd` values;
- dates are rendered in the UI as `dd/mm/yyyy`;
- read-mode task cells show `dd/mm/yyyy`;
- edit-mode task cells use native `type="date"` controls and persist ISO values;
- reminder dates default to `dueDate - 5 days` unless the user overrides them manually.

Migration rule:

- startup should run a one-time migration that can merge legacy `journalProjects` into the shared `projects` catalog;
- the migration state should be persisted in `appSettings`;
- existing journal entries should keep valid project links after migration.

Urgency window:

- tasks with due dates within 5 days are considered near due date by default;
- the window should be stored as a configurable setting;
- overdue tasks remain in the red state regardless of the window.

## 8. PWA and offline strategy

### 8.1 Manifest

Include:

- app name;
- short name;
- icons;
- start URL;
- display mode `standalone`;
- theme color;
- background color.

### 8.2 Service Worker

The service worker should cache:

- the app shell;
- CSS;
- JavaScript;
- icons;
- manifest.

It should not attempt to cache user data.

### 8.3 Offline behavior

Expected offline behavior:

- first load may require network;
- after installation or at least one successful load, the app shell should open offline;
- persisted data should remain available from IndexedDB.

## 9. UI and accessibility constraints

- all create/edit actions should be reachable from keyboard;
- forms should use clear labels and inline validation;
- color must not be the only cue for overdue or urgent items;
- focus must be managed when opening and closing dialogs;
- responsive layout must work on smaller screens.

## 10. Validation strategy

Minimum validation for this phase:

- IndexedDB read/write cycle works;
- project/task CRUD works;
- status customization persists;
- reminder evaluation is correct on load;
- offline shell loads after caching;
- filters behave consistently;
- export and import round-trip preserves core records.
