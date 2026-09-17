# Functional Specification - WorkManager V1

## 1. Scope

WorkManager V1 will support personal tracking of:

- projects;
- tasks;
- task ownership;
- priority;
- due dates;
- in-app reminders when the app is opened or active;
- filters and quick views.

Out of scope for V1:

- multi-user collaboration;
- cloud sync;
- backend services;
- guaranteed background reminders with the app closed;
- complex permissions;
- integrations with Microsoft 365.

## 2. Core user goal

The user must be able to capture and review work items quickly, with minimal friction, and keep the data stored locally on the device/browser.

## 3. Functional entities

### 3.1 Project

Purpose:

- group related tasks under a meaningful unit of work.

Expected fields:

- client;
- project name;
- active/inactive flag.

Core actions:

- create project;
- edit project;
- archive or deactivate project;
- project deletion is represented as archive/deactivation in V1;
- archived projects can be reactivated later;
- list projects.

### 3.2 Task

Purpose:

- track an actionable item linked to a project or kept as standalone.

Expected fields:

- title;
- description or notes;
- project, optional;
- responsible person as a free-text name;
- priority;
- my-day marker, optional;
- due date;
- reminder flag or reminder date rule;
- status;
- created at;
- updated at;
- completed at, if applicable.

Core actions:

- create task;
- edit task;
- delete task;
- mark task complete;
- reopen task;
- move task between projects;
- list and filter tasks.

Status rule:

- V1 ships with a predefined status set;
- the application must also expose a configuration section where the user can manually reorder or redefine the status list;
- task status selection should stay simple even if the list is customized.
- a status can be renamed while keeping its internal id stable;
- when a status label changes, all tasks using that status must immediately show the new text;
- a status can be deleted only if no tasks are currently assigned to it;
- if tasks still use the status, it must be deactivated instead of deleted.

Priority rule:

- V1 uses the predefined scale: high / medium / low;
- the selected priority must be clearly visible in lists and detail views;
- the scale should remain easy to adjust later if needed.

Responsible person rule:

- each task may store a free-text responsible name;
- the field is optional in V1;
- the UI should allow quick entry without managing a separate people directory.

## 4. Functional behavior

### 4.1 Creating a project

The user can create a project with at least a name.

Acceptance:

- project name is required;
- client selection is required in Gestor;
- projects are available immediately after saving;
- invalid empty names are rejected.

### 4.2 Creating a task

The user can create a task directly from the daily table.

Acceptance:

- title is required;
- project assignment is optional unless later decided otherwise;
- when a project is assigned, it must be selected from the shared catalog created in Gestor;
- the task may exist without a project;
- responsible person is optional and can be entered as a free-text name;
- due date is optional;
- priority is set on creation or defaults to a defined value;
- task appears in the active task list after saving;
- the daily table includes a blank creation row at the top;
- due date and reminder date use the native calendar picker while the table is in edit mode.

### 4.3 Editing a task

The user can update all editable task fields inline in the daily table.

Acceptance:

- changes are persisted locally;
- the updated task keeps its identity;
- edited values are reflected in all relevant views.
- the table defaults to read mode and does not show permanent input borders;
- the user can activate and deactivate a global edit mode for the table;
- the creation row is shown only while edit mode is active;
- title and description are shown in separate columns;
- visible dates on the table use the `dd/mm/yyyy` format.

### 4.4 Deleting records

The user can delete task records and diary records.

Acceptance:

- delete actions require an explicit user action;
- deletions are reflected immediately in the UI;
- linked-task behavior is defined for project deletion.

### 4.5 Completing a task

The user can mark a task complete and later reopen it.

Acceptance:

- completion changes task status;
- completed items are hidden or separated according to the active view;
- completion date is stored if the model supports it.

### 4.6 Filtering and visibility

The user can filter tasks by:

- project;
- responsible person;
- priority;
- status;
- due date window;
- overdue state.

Acceptance:

- filters can be combined;
- filter state is easy to clear;
- the default view remains readable with many items.
- the daily table shows only non-completed tasks by default;
- the user can toggle completed tasks on and off from the task table header;
- the recordatorio column shows the calculated reminder date five days before due date by default;
- the reminder date can be manually overridden per task without losing local persistence;
- completed tasks are rendered in a subdued gray state when they are marked complete.
- the user can sort the table directly from column headers, at least by due date, priority, and status.
- priority remains color-coded in the task table using text color, without extra icons in the column.
- the due-date column keeps explicit urgency colors for overdue, near-due, and normal items.
- each task row exposes a clickable star at the left edge to mark the task as part of `Mi día`;
- the star is gray by default and yellow when active;
- the star is independent from the standard priority field and does not replace it.
- starred tasks should automatically float to the top of the visible table without disabling the existing due date, priority, and status sorting rules.

### 4.7 Reminder behavior

Reminders in V1 are in-app reminders only.

Acceptance:

- reminders are calculated from the due date using a fixed 5-day offset;
- reminders are shown when the app is opened or active;
- overdue items are highlighted with explicit color treatment;
- the app does not promise background delivery with the browser closed.

Due date visual rule:

- overdue tasks must be red;
- tasks close to due date must be amber;
- tasks not near their due date must be green or neutral;
- the visual treatment should make urgency obvious at a glance.

### 4.8 Daily dashboard

The user can inspect compact KPIs in a dedicated dashboard area.

Acceptance:

- the dashboard shows counts by project, priority, and due state;
- the dashboard is informational only;
- the dashboard does not replace the daily table.

### 4.9 Compact UX refinement and diary modal

The application should keep the task table as the primary work surface while reducing wrapper chrome, redundant section headers, and vertical space wasted by visual framing.

Acceptance:

- the app header should not repeat a large page title in the main area;
- the navigation should keep the most common views on the left and secondary management areas on the right;
- section titles should not be repeated in large white cards when navigation already indicates the selected area;
- the daily task toolbar should align the view pills and the filter strip on the same visual band to reduce clutter;
- the diary area should expose a dedicated `Nuevo registro` button that opens a modal for quick capture of new entries;
- the diary modal must support a project selector, optional title, and required content; after save it closes and the updated entry list refreshes;
- the task table remains the primary daily workflow and retains sorting, filtering, default hide-completed behavior, and the small action-icon pattern.

This refinement is considered a UX optimization layer, not a change in core product intent. It must not remove the color-coded urgency or priority rules established earlier in the specification.

### 4.10 My day focus workflow

The user can mark a task with a star to indicate it is a same-day focus item.

Acceptance:

- the star can be toggled directly from the task table without entering global edit mode;
- the task remains in the same project, status, and priority when starred;
- the task table offers a quick filter named `Mi día` alongside the existing quick views;
- the `Mi día` filter only shows tasks whose star is active;
- the default hidden-completed behavior still applies unless the user explicitly enables completed tasks.
- the star column header should remain visually blank to avoid visual noise in the table header.

### 4.9 Project diary

The user can keep knowledge about a client and associated project in a diary area.

Acceptance:

- clients and projects are created in Gestor and reused from there;
- the user can create dated diary entries tied to a project or leave them as `Sin proyecto`;
- diary entries can have an optional title;
- diary entries allow long free-text content.
- the diary view shows a left column with `Cliente - Proyecto`;
- the diary view can be filtered by project and searched by free text inside entry content.

## 5. Screen model and navigation

The application will be organized into five top-level areas:

### 5.1 Daily screen

Purpose:

- the app opens on the daily screen by default;
- the daily screen prioritizes reading and triage over creation;
- task rows on the daily screen should render as a real table with one column per field;
- the project must be visually prominent in its own leading column;
- quick views and filters are available here;
- task rows can be edited directly in place after activating table edit mode, and new tasks are created from the first row of the table.

### 5.2 Dashboard / KPI screen

Purpose:

- show compact operational metrics and task distribution summaries;
- provide a quick analytical overview without affecting the daily list density.

Rules:

- the dashboard contains counts by project, priority, and due-state buckets;
- the dashboard is informational and does not replace the daily triage screen;
- dashboard cards must stay compact and scannable.

### 5.3 Gestor screen

Purpose:

- create and edit clients and projects in a shared catalog;
- keep structural master data outside the daily task table and outside the diary entries themselves.

Rules:

- client CRUD lives here;
- project CRUD lives here;
- tasks and diary entries both consume this catalog;
- archived projects remain visible for historical linkage;
- it is not the primary daily-use view.

### 5.4 Diary screen

Purpose:

- capture knowledge entries separately from tasks;
- prioritize readability of text content while preserving project context.

Rules:

- journal entry CRUD lives here;
- the project selector is optional and sourced from Gestor;
- the main list uses a `Cliente - Proyecto` leading column and a wide content column;
- project filter and content search live here.

### 5.5 Configuration screen

Purpose:

- maintain task statuses and other app-wide behavior settings;
- keep administrative concerns separate from daily task review.

Rules:

- status creation, renaming, activation, deletion, and ordering live here;
- the completed status remains protected;
- this screen is not part of the daily triage flow.

### 5.6 Navigation behavior

- navigation between the five top-level areas must be explicit and persistent;
- the active area should be clearly visible;
- the URL or app state should reflect the active area when possible;
- navigation state can be remembered locally for convenience;
- the UI should avoid presenting all modules as one long undifferentiated page.

## 6. Views

V1 should include:

- inbox or all tasks;
- today;
- upcoming due dates;
- overdue;
- projects;
- optional completed archive.

Default behavior:

- the app opens on the daily screen with the all-tasks quick view selected;
- today shows tasks due today and not completed;
- upcoming shows future tasks due within the configured window and not completed;
- overdue shows tasks due before today and not completed;
- completed is a quick derived archive view;
- filters can be combined with the selected view;
- completed tasks remain available in the completed archive view.

## 7. Data persistence

Persistent storage must be local to the device/browser.

Acceptance:

- data survives refresh and browser restart on the same device profile;
- local storage model supports CRUD and filtering;
- user can keep working offline after the first load if the app shell is cached;
- user can export and import local data as JSON for backup or migration.

## 8. Confirmed decisions

The following V1 decisions are already fixed:

- responsible person is free-text and optional;
- task statuses start with pending / in progress / blocked / completed and can be reconfigured in settings;
- priority uses high / medium / low;
- tasks may exist without a project;
- projects are archived or deactivated instead of hard-deleted and can later be reactivated;
- reminders use a fixed 5-day offset from the due date;
- overdue tasks are red, close-to-due tasks are amber, and normal tasks are neutral or green.
- the daily screen is the default and most frequently used screen;
- the dashboard is a separate top-level area for KPI summaries;
- Gestor is the canonical area for client and project maintenance;
- tasks and diary entries share the same project catalog;
- diary entries can exist as `Sin proyecto`;
- the task table keeps native date pickers in edit mode and `dd/mm/yyyy` formatting in read mode;
- priority keeps color-coded text and due dates keep urgency colors in the main table;
- status maintenance lives in a separate configuration area.
