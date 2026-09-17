# Change Plan - WorkManager V1

## 1. Objective

Translate the functional and technical specifications into a small, ordered implementation sequence with low-risk increments.

## 2. Planning principles

- each step should be independently verifiable;
- no step should mix persistence, UI, and PWA concerns unless required;
- data model work should come before CRUD screens;
- settings and reminder behavior should come after the core CRUD path is stable;
- documentation is updated at the end of each completed increment.

## 3. Recommended implementation sequence

Execution status:

- step 1 complete;
- step 2 complete;
- step 3 complete;
- step 4 complete;
- step 5 complete;
- step 6 complete;
- step 7 complete;
- step 8 pending;
- step 9 in progress.

### Step 1 - Project skeleton

Deliverables:

- folder structure;
- base HTML entry point;
- base CSS foundation;
- app bootstrap JavaScript;
- manifest and service worker placeholders.

Done when:

- the app loads;
- the shell renders;
- the project can be served as static files.

### Step 2 - Local data layer

Deliverables:

- IndexedDB wrapper;
- database schema;
- initial seed for task statuses;
- helper utilities for timestamps and UUIDs.

Done when:

- data can be created, read, updated, and deleted locally;
- status catalog is persisted;
- schema versioning exists.

### Step 3 - Project management

Deliverables:

- create client;
- create project;
- edit project;
- archive project;
- list projects;
- validation and empty state handling.

Done when:

- projects can be managed end to end;
- clients can be managed end to end;
- archived projects remain available for historical reference;
- selectors only show active projects by default.

### Step 4 - Task management

Deliverables:

- create task;
- edit task;
- complete/reopen task;
- archive/delete task if required by the UI model;
- task detail rendering.

Done when:

- tasks persist correctly;
- tasks can exist without a project;
- responsible name, priority, due date, and reminder date are editable.

### Step 5 - Views and filters

Deliverables:

- compact dashboard/KPI area;
- all tasks view;
- today view;
- upcoming view;
- overdue view;
- project-scoped view;
- combined filters by project, responsible, priority, and status.
- inline task table on the daily screen;
- gestor screen for clients and shared projects;
- diary screen for knowledge entries plus filters/search;
- separated screen model for daily review, gestor, diary, and configuration.
- compact task table controls for sorting, completed visibility, and edit-mode toggle.
- split title and description into separate task-table columns.
- manual override support for reminder date while preserving the default 5-day calculation.
- shared project catalog consumed by both tasks and diary entries.
- day-focus marker with star toggle plus `Mi día` quick filter.

Done when:

- filters compose correctly;
- views update from the same underlying dataset;
- overdue detection is consistent.
- dashboard metrics are readable without pushing the daily list below the fold.
- the daily screen stays editable inline without a separate task management screen.
- the table can return completed tasks into view on demand.
- visible task-table dates remain in `dd/mm/yyyy`.
- diary entries can be created with or without project association.
- diary filtering/search and task project selectors consume the same shared project catalog.
- the user can isolate starred same-day focus tasks without changing the standard priority model.

### Step 6 - Status customization

Deliverables:

- settings UI for task statuses;
- reorder, rename, add, deactivate, and reassignment flow;
- persistence of custom statuses.

Done when:

- status changes survive reload;
- tasks continue to render correctly after status edits;
- completed status mapping remains functional.

### Step 7 - Reminder and urgency UI

Deliverables:

- due date urgency colors;
- fixed 5-day reminder date calculation;
- in-app reminder banner/toast behavior;
- overdue highlighting.

Done when:

- overdue, near-due, and normal states are visually distinct;
- reminder evaluation runs on load or when the app becomes active;
- priority remains color-coded without reintroducing noisy icons.

### Step 8 - PWA and offline polish

Deliverables:

- manifest completion;
- service worker caching;
- offline launch validation;
- icons and metadata.

Done when:

- the app can be installed;
- the shell works offline after the first successful load;
- user data remains available from IndexedDB.

### Step 9 - Validation and documentation

Deliverables:

- manual acceptance checklist;
- targeted automated tests when implementation begins;
- README and spec updates;
- known limitations log.
- browser validation for shared Gestor/Diario/Tareas flows.

Done when:

- core flows are validated against the spec;
- documentation matches the shipped behavior.

### Step 10 - Compact UX and journal modal refinement

Deliverables:

- navigation and spacing cleanup for a denser daily workflow;
- removal of redundant section title cards while preserving clear context via top-level navigation;
- compact header and filter arrangement for the daily task view;
- `Nuevo registro` modal in Diario backed by the same journal entry model;
- reminder-date logic corrected to avoid local-time drift.

Done when:

- the user sees the daily workflow without wasted vertical space;
- the diary entry modal opens, saves, and refreshes the list correctly;
- the reminder calculation remains stable and matches the requirement across one-day boundaries.

### Step 11 - My day star workflow

Deliverables:

- task model support for a persisted star flag;
- clickable left-side star button in the task table;
- `Mi día` quick filter integrated with the existing daily views;
- automatic top-of-list ordering for starred tasks plus a visually blank header cell for the star column;
- documentation and browser validation for the new workflow.

Done when:

- the star can be toggled without activating full edit mode;
- starred tasks persist after refresh;
- the `Mi día` filter returns only starred tasks and preserves the existing completed-task behavior.

### Step 12 - Data export and import

Deliverables:

- configuration-area controls for exporting the local workspace as JSON;
- file-based import flow with explicit replacement confirmation;
- payload validation for required stores before replacing local data;
- restoration of saved UI state when present in the imported payload.

Done when:

- a backup exported from `localhost` can be imported into GitHub Pages;
- invalid files are rejected safely;
- the UI refreshes immediately after a successful import.

## 4. Suggested agent mapping

- Orchestrator: selects the next step and checks entry/exit criteria;
- Prompt Optimizer / Spec Refiner: refines any new user input into crisp requirements;
- Functional Spec Writer: expands any new behavior into scenarios and acceptance criteria;
- Technical Planner: updates data model or architecture decisions;
- Change Planner: keeps this plan updated;
- Implementer: builds the current step;
- Tester: defines and runs validation for the step;
- Documentation Keeper: updates markdown after each accepted increment.

## 5. Dependency order

1. project skeleton;
2. local data layer;
3. project management;
4. task management;
5. views and filters;
6. status customization;
7. reminder and urgency UI;
8. PWA and offline polish;
9. validation and documentation.
