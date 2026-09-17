const appName = "WorkManager";

let projectElements = {};
let taskElements = {};
let filterElements = {};
let statusElements = {};
let journalElements = {};
let backupElements = {};
let cachedProjects = [];
let cachedTaskStatuses = [];
let cachedJournalClients = [];
let cachedJournalProjects = [];
let cachedJournalEntries = [];
let taskViewState = {
  view: "all",
  projectId: "",
  responsible: "",
  priority: "",
  statusId: "",
  dueWindowDays: 5,
  showCompleted: false,
  sortBy: "dueDate",
  sortDirection: "asc",
  editMode: false
};
const TASK_VIEW_STATE_KEY = "workmanager-task-view-state";
const APP_VIEW_STATE_KEY = "workmanager-app-view-state";
const DIARY_VIEW_STATE_KEY = "workmanager-diary-view-state";
const APP_VIEWS = ["dashboard", "daily", "gestor", "diary", "config"];
const TASK_VIEWS = ["all", "my-day", "today", "upcoming", "overdue"];
const TASK_SORT_FIELDS = ["dueDate", "priority", "status"];
const DEFAULT_REMINDER_DAYS = 5;
const DEFAULT_TASK_RESPONSIBLE = "Kike";
let diaryViewState = {
  projectId: "",
  searchText: ""
};
let appViewState = {
  view: "daily"
};
let pendingEntityFocus = "";

function setStatus(message) {
  const status = document.getElementById("pwa-status");
  if (status) {
    status.textContent = message;
  }
}

function setSummary(message) {
  const summary = document.getElementById("dashboard-summary");
  if (summary) {
    summary.textContent = message;
  }
}

function setProjectCount(message) {
  const count = document.getElementById("projects-count");
  if (count) {
    count.textContent = message;
  }
}

function setTaskCount(message) {
  const count = document.getElementById("tasks-count");
  if (count) {
    count.textContent = message;
  }
}

function setStatusCount(message) {
  const count = document.getElementById("status-count");
  if (count) {
    count.textContent = message;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadTaskViewState() {
  const raw = localStorage.getItem(TASK_VIEW_STATE_KEY);
  if (!raw) {
    return { ...taskViewState };
  }

  try {
    return normalizeTaskViewState(JSON.parse(raw));
  } catch (_error) {
    return { ...taskViewState };
  }
}

function saveTaskViewState() {
  localStorage.setItem(TASK_VIEW_STATE_KEY, JSON.stringify(taskViewState));
}

function loadDiaryViewState() {
  const raw = localStorage.getItem(DIARY_VIEW_STATE_KEY);
  if (!raw) {
    return { ...diaryViewState };
  }

  try {
    return normalizeDiaryViewState(JSON.parse(raw));
  } catch (_error) {
    return { ...diaryViewState };
  }
}

function saveDiaryViewState() {
  localStorage.setItem(DIARY_VIEW_STATE_KEY, JSON.stringify(diaryViewState));
}

function normalizeAppView(value) {
  return APP_VIEWS.includes(value) ? value : "daily";
}

function normalizeTaskView(value) {
  return TASK_VIEWS.includes(value) ? value : "all";
}

function normalizeTaskSortBy(value) {
  return TASK_SORT_FIELDS.includes(value) ? value : "dueDate";
}

function normalizeSortDirection(value) {
  return value === "desc" ? "desc" : "asc";
}

function normalizeTaskViewState(value) {
  const parsed = value && typeof value === "object" ? value : {};
  return {
    view: normalizeTaskView(typeof parsed.view === "string" ? parsed.view : "all"),
    projectId: typeof parsed.projectId === "string" ? parsed.projectId : "",
    responsible: typeof parsed.responsible === "string" ? parsed.responsible : "",
    priority: typeof parsed.priority === "string" ? parsed.priority : "",
    statusId: typeof parsed.statusId === "string" ? parsed.statusId : "",
    dueWindowDays: Number.isFinite(Number(parsed.dueWindowDays)) ? Math.max(1, Math.min(60, Number(parsed.dueWindowDays))) : 5,
    showCompleted: parsed.showCompleted === true,
    sortBy: normalizeTaskSortBy(typeof parsed.sortBy === "string" ? parsed.sortBy : "dueDate"),
    sortDirection: normalizeSortDirection(typeof parsed.sortDirection === "string" ? parsed.sortDirection : "asc"),
    editMode: parsed.editMode === true
  };
}

function normalizeDiaryViewState(value) {
  const parsed = value && typeof value === "object" ? value : {};
  return {
    projectId: typeof parsed.projectId === "string" ? parsed.projectId : "",
    searchText: typeof parsed.searchText === "string" ? parsed.searchText : ""
  };
}

function loadAppViewState() {
  const raw = localStorage.getItem(APP_VIEW_STATE_KEY);
  if (!raw) {
    return { view: "daily" };
  }

  try {
    return normalizeAppViewState(JSON.parse(raw));
  } catch (_error) {
    return { view: "daily" };
  }
}

function saveAppViewState() {
  localStorage.setItem(APP_VIEW_STATE_KEY, JSON.stringify(appViewState));
}

function normalizeAppViewState(value) {
  const parsed = value && typeof value === "object" ? value : {};
  return {
    view: normalizeAppView(typeof parsed.view === "string" ? parsed.view : "daily")
  };
}

function buildUiStateSnapshot() {
  return {
    appViewState: { ...appViewState },
    taskViewState: { ...taskViewState },
    diaryViewState: { ...diaryViewState }
  };
}

function applyImportedUiState(uiState) {
  const source = uiState && typeof uiState === "object" ? uiState : {};
  appViewState = source.appViewState ? normalizeAppViewState(source.appViewState) : { ...appViewState };
  taskViewState = source.taskViewState ? normalizeTaskViewState(source.taskViewState) : { ...taskViewState };
  diaryViewState = source.diaryViewState ? normalizeDiaryViewState(source.diaryViewState) : { ...diaryViewState };
  saveAppViewState();
  saveTaskViewState();
  saveDiaryViewState();
}

function getBackupFileName() {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  return `workmanager-backup-${timestamp}.json`;
}

function triggerJsonDownload(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function getViewFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const segment = hash.split("/")[0];
  return normalizeAppView(segment);
}

function syncAppView() {
  const navButtons = document.querySelectorAll(".app-nav [data-app-view]");
  navButtons.forEach((button) => {
    button.classList.toggle("button--active", button.getAttribute("data-app-view") === appViewState.view);
  });

  const sections = document.querySelectorAll(".app-view[data-app-view]");
  sections.forEach((section) => {
    section.hidden = section.getAttribute("data-app-view") !== appViewState.view;
  });
}

function setHashForView(view) {
  const nextHash = `#/${view}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
    return;
  }

  routeAppViewFromHash();
}

async function refreshWorkspaceData() {
  await loadLookupData();
  await updateDashboardSummary();
  await refreshProjects();
  await refreshTasks();
  await refreshDiary();
  await renderStatuses();
}

function focusRequestedEntityForm() {
  if (!pendingEntityFocus) {
    return;
  }

  const focusTarget = pendingEntityFocus;
  pendingEntityFocus = "";

  window.requestAnimationFrame(() => {
    if (focusTarget === "project" && projectElements.projectName) {
      projectElements.projectName.focus();
      return;
    }

    if (focusTarget === "task" && taskElements.taskTitle) {
      taskElements.taskTitle.focus();
    }
  });
}

async function applyAppView(view) {
  const nextView = normalizeAppView(view);
  appViewState.view = nextView;
  saveAppViewState();
  syncAppView();

  await refreshWorkspaceData();
  focusRequestedEntityForm();
}

async function routeAppViewFromHash() {
  await applyAppView(getViewFromHash());
}

async function exportWorkspaceBackup() {
  const payload = await window.WorkManagerDB.exportBackup();
  payload.uiState = buildUiStateSnapshot();
  triggerJsonDownload(getBackupFileName(), payload);
}

async function importWorkspaceBackupFromText(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error("El archivo no contiene un JSON valido");
  }

  const normalized = await window.WorkManagerDB.importBackup(parsed);
  applyImportedUiState(normalized.uiState);
  history.replaceState(null, "", `#/${appViewState.view}`);
  syncAppView();
  await refreshWorkspaceData();
  clearProjectForm();
  clearTaskForm();
  clearStatusForm();
  focusRequestedEntityForm();
}

function syncTaskViewButtons() {
  const buttons = document.querySelectorAll("button[data-view]");
  buttons.forEach((button) => {
    button.classList.toggle("button--active", button.getAttribute("data-view") === taskViewState.view);
  });
}

function applyTaskFilterControls() {
  if (filterElements.project) filterElements.project.value = taskViewState.projectId;
  if (filterElements.responsible) filterElements.responsible.value = taskViewState.responsible;
  if (filterElements.priority) filterElements.priority.value = taskViewState.priority;
  if (filterElements.status) filterElements.status.value = taskViewState.statusId;
  if (filterElements.dueWindowDays) filterElements.dueWindowDays.value = String(taskViewState.dueWindowDays);
  syncTaskViewButtons();
  syncTaskTableToolbarButtons();
}

function setTaskView(view) {
  taskViewState.view = normalizeTaskView(view);
  saveTaskViewState();
  syncTaskViewButtons();
}

function setDueWindowDays(value) {
  const numeric = Number(value);
  taskViewState.dueWindowDays = Number.isFinite(numeric) ? Math.max(1, Math.min(60, Math.floor(numeric))) : 5;
  saveTaskViewState();
  if (filterElements.dueWindowDays) {
    filterElements.dueWindowDays.value = String(taskViewState.dueWindowDays);
  }
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "";
  }

  const isoDate = parseIsoDateValue(dateValue);
  if (!isoDate) {
    return dateValue;
  }

  const parts = isoDate.split("-");
  return [parts[2], parts[1], parts[0]].join("/");
}

function formatDateTimeLabel(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString("es-ES");
}

function toDateTimeLocalValue(isoValue) {
  if (!isoValue) {
    return "";
  }

  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes())
  ].join("");
}

function getStatusLabel(statusId) {
  const status = cachedTaskStatuses.find((item) => item.id === statusId);
  return status ? status.label : statusId;
}

function getCompletedStatusId() {
  const completed = cachedTaskStatuses.find((status) => status.mapsToComplete);
  return completed ? completed.id : "completed";
}

function getDefaultTaskStatusId() {
  const pending = cachedTaskStatuses.find((status) => status.id === "pending" && status.isActive);
  if (pending) {
    return pending.id;
  }

  const active = cachedTaskStatuses.find((status) => status.isActive && !status.mapsToComplete);
  if (active) {
    return active.id;
  }

  const first = cachedTaskStatuses.find((status) => status.isActive) || cachedTaskStatuses[0];
  return first ? first.id : "";
}

function getPriorityLabel(priority) {
  if (priority === "high") {
    return "Alta";
  }

  if (priority === "low") {
    return "Baja";
  }

  return "Media";
}

function getProjectLabel(projectId) {
  if (!projectId) {
    return "Sin proyecto";
  }

  const project = cachedProjects.find((item) => item.id === projectId);
  if (!project) {
    return "Proyecto eliminado";
  }

  return project.isActive ? project.name : `${project.name} (Archivado)`;
}

function getProjectClientLabel(projectId) {
  if (!projectId) {
    return "Sin proyecto";
  }

  const project = cachedProjects.find((item) => item.id === projectId) || cachedJournalProjects.find((item) => item.id === projectId);
  if (!project) {
    return "Proyecto eliminado";
  }

  const clientName = project.clientId ? getJournalClientName(project.clientId) : "";
  return clientName ? `${clientName} - ${project.name}` : project.name;
}

function getTaskProjectOptionLabel(project) {
  if (!project) {
    return "Sin proyecto";
  }

  const baseLabel = getProjectClientLabel(project.id);
  return project.isActive ? baseLabel : `${baseLabel} (Archivado)`;
}

function getProjectById(projectId) {
  return cachedProjects.find((item) => item.id === projectId) || null;
}

function getTaskDueDiffDays(task) {
  if (!task.dueDate) {
    return null;
  }

  const isoDate = parseIsoDateValue(task.dueDate);
  if (!isoDate) {
    return null;
  }

  const due = new Date(isoDate + "T00:00:00");
  if (Number.isNaN(due.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - today.getTime()) / 86400000);
}

function parseIsoDateValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return "";
  }

  return trimmed;
}

function parseUserDateValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const isoDate = parseIsoDateValue(trimmed);
  if (isoDate) {
    return isoDate;
  }

  const displayMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!displayMatch) {
    return null;
  }

  return parseIsoDateValue(`${displayMatch[3]}-${displayMatch[2]}-${displayMatch[1]}`) || null;
}

function formatLocalIsoDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getCalculatedReminderIso(dueDate) {
  const isoDate = parseIsoDateValue(dueDate);
  if (!isoDate) {
    return "";
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  due.setDate(due.getDate() - DEFAULT_REMINDER_DAYS);
  return formatLocalIsoDate(due);
}

function getTaskReminderLabel(task) {
  const reminderIso = getTaskReminderIso(task);
  return reminderIso ? formatDateLabel(reminderIso) : "—";
}

function getTaskReminderIso(task) {
  if (task.reminderMode === "manual" && task.reminderDate) {
    return parseIsoDateValue(task.reminderDate) || "";
  }

  if (task.dueDate) {
    return getCalculatedReminderIso(task.dueDate);
  }

  return parseIsoDateValue(task.reminderDate || "") || "";
}

function buildTaskProjectOptions(selectedProjectId) {
  return ["<option value=\"\">Sin proyecto</option>"].concat(
    cachedProjects.map((project) => {
      const label = getTaskProjectOptionLabel(project);
      const selected = project.id === selectedProjectId ? " selected" : "";
      return `<option value="${escapeHtml(project.id)}"${selected}>${escapeHtml(label)}</option>`;
    })
  ).join("");
}

function buildTaskStatusOptions(selectedStatusId) {
  return cachedTaskStatuses.map((status) => {
    const selected = status.id === selectedStatusId ? " selected" : "";
    const disabled = status.isActive ? "" : " disabled";
    const label = `${status.label}${status.mapsToComplete ? " ✓" : status.id === "in-progress" ? " ↻" : status.id === "blocked" ? " ■" : " •"}`;
    return `<option value="${escapeHtml(status.id)}"${selected}${disabled}>${escapeHtml(label)}</option>`;
  }).join("");
}

function buildTaskPriorityOptions(selectedPriority) {
  const options = [
    { value: "high", label: "Alta" },
    { value: "medium", label: "Media" },
    { value: "low", label: "Baja" }
  ];

  return options.map((option) => {
    const selected = option.value === selectedPriority ? " selected" : "";
    return `<option value="${option.value}"${selected}>${option.label}</option>`;
  }).join("");
}

function getTaskRowClass(task) {
  if (task.statusId === getCompletedStatusId()) {
    return "task-table__row--completed";
  }

  const urgency = getTaskUrgency(task);
  return `task-table__row--${urgency}`;
}

function isStarredTask(task) {
  return task && task.isStarred === true;
}

function isCompletedTask(task) {
  return task.statusId === getCompletedStatusId();
}

function getPriorityWeight(priority) {
  const weights = { high: 0, medium: 1, low: 2 };
  return weights[priority] ?? 1;
}

function getStatusSortWeight(statusId) {
  const status = cachedTaskStatuses.find((item) => item.id === statusId);
  return status ? status.order : Number.MAX_SAFE_INTEGER;
}

function getTaskUrgency(task) {
  if (isCompletedTask(task)) {
    return "completed";
  }

  const diffDays = getTaskDueDiffDays(task);
  if (diffDays === null) {
    return "neutral";
  }

  if (diffDays < 0) {
    return "danger";
  }

  if (diffDays <= taskViewState.dueWindowDays) {
    return "warning";
  }

  return "success";
}

function getTaskFormProjects(selectedProjectId) {
  const activeProjects = cachedProjects.filter((project) => project.isActive);
  const selectedProject = selectedProjectId ? cachedProjects.find((project) => project.id === selectedProjectId) : null;
  const projects = activeProjects.slice();

  if (selectedProject && !selectedProject.isActive) {
    projects.push(selectedProject);
  }

  return projects;
}

function matchesTaskView(task) {
  if (isCompletedTask(task) && !taskViewState.showCompleted) {
    return false;
  }

  if (taskViewState.view === "my-day") {
    return isStarredTask(task);
  }

  const diffDays = getTaskDueDiffDays(task);

  if (taskViewState.view === "today") {
    return diffDays === 0;
  }

  if (taskViewState.view === "upcoming") {
    return diffDays !== null && diffDays > 0 && diffDays <= taskViewState.dueWindowDays;
  }

  if (taskViewState.view === "overdue") {
    return diffDays !== null && diffDays < 0;
  }

  return true;
}

function matchesTaskFilters(task) {
  if (taskViewState.projectId && task.projectId !== taskViewState.projectId) {
    return false;
  }

  if (taskViewState.responsible) {
    const responsible = (task.responsibleName || "").toLowerCase();
    if (!responsible.includes(taskViewState.responsible.toLowerCase())) {
      return false;
    }
  }

  if (taskViewState.priority && task.priority !== taskViewState.priority) {
    return false;
  }

  if (taskViewState.statusId && task.statusId !== taskViewState.statusId) {
    return false;
  }

  return true;
}

function filterTasks(tasks) {
  return sortTasks(tasks.filter((task) => matchesTaskView(task) && matchesTaskFilters(task)));
}

function sortTasks(tasks) {
  const direction = taskViewState.sortDirection === "desc" ? -1 : 1;

  return tasks.slice().sort((left, right) => {
    const leftStarred = isStarredTask(left);
    const rightStarred = isStarredTask(right);
    if (leftStarred !== rightStarred) {
      return leftStarred ? -1 : 1;
    }

    let comparison = 0;

    if (taskViewState.sortBy === "priority") {
      comparison = getPriorityWeight(left.priority) - getPriorityWeight(right.priority);
    } else if (taskViewState.sortBy === "status") {
      comparison = getStatusSortWeight(left.statusId) - getStatusSortWeight(right.statusId);
      if (comparison === 0) {
        comparison = getStatusLabel(left.statusId).localeCompare(getStatusLabel(right.statusId), "es");
      }
    } else {
      const leftDue = parseIsoDateValue(left.dueDate || "");
      const rightDue = parseIsoDateValue(right.dueDate || "");
      if (leftDue !== rightDue) {
        if (!leftDue) {
          return 1;
        } else if (!rightDue) {
          return -1;
        } else {
          comparison = leftDue.localeCompare(rightDue);
        }
      }
    }

    if (comparison !== 0) {
      return comparison * direction;
    }

    return (right.updatedAt || "").localeCompare(left.updatedAt || "");
  });
}

function populateTaskFilterOptions() {
  if (filterElements.project) {
    const projectOptions = ["<option value=\"\">Todos</option>"].concat(
      cachedProjects.map((project) => {
        const label = project.isActive ? project.name : `${project.name} (Archivado)`;
        return `<option value="${escapeHtml(project.id)}">${escapeHtml(label)}</option>`;
      })
    );
    filterElements.project.innerHTML = projectOptions.join("");
  }

  if (filterElements.status) {
    const statusOptions = ["<option value=\"\">Todos</option>"].concat(
      cachedTaskStatuses.map((status) => {
        const suffix = status.isActive ? "" : " (inactivo)";
        return `<option value="${escapeHtml(status.id)}">${escapeHtml(status.label + suffix)}</option>`;
      })
    );
    filterElements.status.innerHTML = statusOptions.join("");
  }
}

function readTaskFilterControls() {
  return {
    projectId: filterElements.project ? filterElements.project.value : "",
    responsible: filterElements.responsible ? filterElements.responsible.value.trim() : "",
    priority: filterElements.priority ? filterElements.priority.value : "",
    statusId: filterElements.status ? filterElements.status.value : "",
    dueWindowDays: filterElements.dueWindowDays ? filterElements.dueWindowDays.value : "5"
  };
}

function clearTaskFilters() {
  taskViewState = {
    ...taskViewState,
    view: "all",
    projectId: "",
    responsible: "",
    priority: "",
    statusId: "",
    dueWindowDays: 5
  };
  saveTaskViewState();
  applyTaskFilterControls();
}

function setTaskSort(sortBy) {
  const nextSort = normalizeTaskSortBy(sortBy);
  if (taskViewState.sortBy === nextSort) {
    taskViewState.sortDirection = taskViewState.sortDirection === "asc" ? "desc" : "asc";
  } else {
    taskViewState.sortBy = nextSort;
    taskViewState.sortDirection = "asc";
  }

  saveTaskViewState();
}

function syncTaskTableToolbarButtons() {
  const completedButton = document.getElementById("toggle-completed-button");
  if (completedButton) {
    completedButton.textContent = taskViewState.showCompleted ? "Ocultar completadas" : "Mostrar completadas";
  }

  const editButton = document.getElementById("toggle-task-edit-button");
  if (editButton) {
    editButton.textContent = taskViewState.editMode ? "Desactivar edición" : "Activar edición";
  }
}

function buildTaskSortHeaderMarkup(label, sortBy) {
  const isActive = taskViewState.sortBy === sortBy;
  const directionIcon = isActive ? (taskViewState.sortDirection === "asc" ? "↑" : "↓") : "↕";
  const activeClass = isActive ? " task-table__sort-button--active" : "";
  return `
    <button type="button" class="task-table__sort-button${activeClass}" data-task-sort="${escapeHtml(sortBy)}" aria-label="Ordenar por ${escapeHtml(label)}">
      <span>${escapeHtml(label)}</span>
      <span class="task-table__sort-icon" aria-hidden="true">${directionIcon}</span>
    </button>
  `;
}

function readProjectForm() {
  return {
    id: projectElements.projectId ? projectElements.projectId.value : "",
    name: projectElements.projectName ? projectElements.projectName.value : "",
    clientId: projectElements.projectClient ? projectElements.projectClient.value : "",
    description: "",
    color: ""
  };
}

function clearProjectForm() {
  if (projectElements.projectId) projectElements.projectId.value = "";
  if (projectElements.projectName) projectElements.projectName.value = "";
  if (projectElements.projectClient) projectElements.projectClient.value = "";
  if (projectElements.saveButton) projectElements.saveButton.textContent = "Guardar proyecto";
  setStatus("Modo nuevo proyecto");
}

function fillProjectForm(project) {
  if (projectElements.projectId) projectElements.projectId.value = project.id;
  if (projectElements.projectName) projectElements.projectName.value = project.name || "";
  if (projectElements.projectClient) projectElements.projectClient.value = project.clientId || "";
  if (projectElements.saveButton) projectElements.saveButton.textContent = "Actualizar proyecto";
  setStatus("Editando proyecto");
}

function readTaskForm() {
  const reminderDateValue = taskElements.taskReminderDate ? taskElements.taskReminderDate.value : "";
  const dueDateValue = taskElements.taskDueDate ? taskElements.taskDueDate.value : "";

  return {
    id: taskElements.taskId ? taskElements.taskId.value : "",
    title: taskElements.taskTitle ? taskElements.taskTitle.value : "",
    description: taskElements.taskDescription ? taskElements.taskDescription.value : "",
    projectId: taskElements.taskProject ? taskElements.taskProject.value : "",
    responsibleName: taskElements.taskResponsible ? taskElements.taskResponsible.value : "",
    priority: taskElements.taskPriority ? taskElements.taskPriority.value : "medium",
    statusId: taskElements.taskStatus ? taskElements.taskStatus.value : getDefaultTaskStatusId(),
    dueDate: dueDateValue ? parseUserDateValue(dueDateValue) || "" : "",
    reminderMode: taskElements.taskReminderMode ? taskElements.taskReminderMode.value : "dueDate",
    reminderDate: reminderDateValue ? parseUserDateValue(reminderDateValue) || "" : ""
  };
}

function populateTaskSelects(selectedProjectId, selectedStatusId) {
  if (projectElements.projectClient) {
    const selectedClientId = projectElements.projectClient.value;
    projectElements.projectClient.innerHTML = cachedJournalClients.length
      ? ['<option value="">Selecciona un cliente</option>'].concat(cachedJournalClients.map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(client.name)}</option>`)).join("")
      : '<option value="">No hay clientes</option>';
    projectElements.projectClient.value = selectedClientId || "";
  }

  if (taskElements.taskProject) {
    const projectOptions = ["<option value=\"\">Sin proyecto</option>"].concat(
      getTaskFormProjects(selectedProjectId).map((project) => {
        const label = getTaskProjectOptionLabel(project);
        return `<option value="${escapeHtml(project.id)}">${escapeHtml(label)}</option>`;
      })
    );

    taskElements.taskProject.innerHTML = projectOptions.join("");
    taskElements.taskProject.value = selectedProjectId || "";
  }

  if (taskElements.taskStatus) {
    const statusOptions = cachedTaskStatuses.length
      ? cachedTaskStatuses.map((status) => {
          const suffix = status.isActive ? "" : " (inactivo)";
          const selected = status.id === selectedStatusId ? " selected" : "";
          const disabled = status.isActive ? "" : " disabled";
          return `<option value="${escapeHtml(status.id)}"${selected}${disabled}>${escapeHtml(status.label + suffix)}</option>`;
        })
      : [`<option value="">Sin estados disponibles</option>`];

    taskElements.taskStatus.innerHTML = statusOptions.join("");
    if (selectedStatusId) {
      taskElements.taskStatus.value = selectedStatusId;
    } else if (cachedTaskStatuses.length) {
      taskElements.taskStatus.value = getDefaultTaskStatusId();
    }
  }
}

function clearTaskForm() {
  if (taskElements.taskId) taskElements.taskId.value = "";
  if (taskElements.taskTitle) taskElements.taskTitle.value = "";
  if (taskElements.taskDescription) taskElements.taskDescription.value = "";
  if (taskElements.taskResponsible) taskElements.taskResponsible.value = DEFAULT_TASK_RESPONSIBLE;
  if (taskElements.taskPriority) taskElements.taskPriority.value = "medium";
  if (taskElements.taskDueDate) taskElements.taskDueDate.value = "";
  if (taskElements.taskReminderMode) taskElements.taskReminderMode.value = "dueDate";
  if (taskElements.taskReminderDate) taskElements.taskReminderDate.value = "";
  if (taskElements.saveButton) taskElements.saveButton.textContent = "Guardar tarea";
  populateTaskSelects("", getDefaultTaskStatusId());
  setStatus("Modo nueva tarea");
}

function readStatusForm() {
  return {
    id: statusElements.statusId ? statusElements.statusId.value : "",
    label: statusElements.statusLabel ? statusElements.statusLabel.value : "",
    order: statusElements.statusOrder ? statusElements.statusOrder.value : "",
    isActive: statusElements.statusActive ? statusElements.statusActive.checked : true,
    mapsToComplete: statusElements.statusComplete ? statusElements.statusComplete.checked : false
  };
}

function clearStatusForm() {
  if (statusElements.statusId) statusElements.statusId.value = "";
  if (statusElements.statusLabel) statusElements.statusLabel.value = "";
  if (statusElements.statusOrder) statusElements.statusOrder.value = String(cachedTaskStatuses.length ? Math.max(...cachedTaskStatuses.map((item) => item.order)) + 1 : 1);
  if (statusElements.statusActive) statusElements.statusActive.checked = true;
  if (statusElements.statusComplete) statusElements.statusComplete.checked = false;
  if (statusElements.saveButton) statusElements.saveButton.textContent = "Guardar estado";
  setStatus("Modo nuevo estado");
}

function fillStatusForm(status) {
  if (statusElements.statusId) statusElements.statusId.value = status.id;
  if (statusElements.statusLabel) statusElements.statusLabel.value = status.label || "";
  if (statusElements.statusOrder) statusElements.statusOrder.value = String(status.order || 1);
  if (statusElements.statusActive) statusElements.statusActive.checked = Boolean(status.isActive);
  if (statusElements.statusComplete) statusElements.statusComplete.checked = Boolean(status.mapsToComplete);
  if (statusElements.saveButton) statusElements.saveButton.textContent = "Actualizar estado";
  setStatus("Editando estado");
}

function fillTaskForm(task) {
  if (taskElements.taskId) taskElements.taskId.value = task.id;
  if (taskElements.taskTitle) taskElements.taskTitle.value = task.title || "";
  if (taskElements.taskDescription) taskElements.taskDescription.value = task.description || "";
  if (taskElements.taskResponsible) taskElements.taskResponsible.value = task.responsibleName || "";
  if (taskElements.taskPriority) taskElements.taskPriority.value = task.priority || "medium";
  if (taskElements.taskDueDate) taskElements.taskDueDate.value = task.dueDate || "";
  if (taskElements.taskReminderMode) taskElements.taskReminderMode.value = task.reminderMode || "dueDate";
  if (taskElements.taskReminderDate) taskElements.taskReminderDate.value = toDateTimeLocalValue(task.reminderDate);
  if (taskElements.saveButton) taskElements.saveButton.textContent = "Actualizar tarea";
  populateTaskSelects(task.projectId || "", task.statusId || getDefaultTaskStatusId());
  setStatus("Editando tarea");
}

async function updateDashboardSummary() {
  const summary = await window.WorkManagerDB.getSummary();
  const tasks = await window.WorkManagerDB.getTasks();
  const projects = await window.WorkManagerDB.getProjects();
  const completedStatusId = getCompletedStatusId();
  const dueWindowDays = taskViewState.dueWindowDays;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const counts = {
    completed: 0,
    overdue: 0,
    today: 0,
    upcoming: 0,
    noDueDate: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  tasks.forEach((task) => {
    if (task.priority === "high") counts.high += 1;
    else if (task.priority === "low") counts.low += 1;
    else counts.medium += 1;

    if (task.statusId === completedStatusId) {
      counts.completed += 1;
      return;
    }

    const diffDays = getTaskDueDiffDays(task);
    if (diffDays === null) {
      counts.noDueDate += 1;
      return;
    }

    if (diffDays < 0) {
      counts.overdue += 1;
    } else if (diffDays === 0) {
      counts.today += 1;
    } else if (diffDays <= dueWindowDays) {
      counts.upcoming += 1;
    }
  });

  const activeProjects = projects.filter((project) => project.isActive).length;
  const projectRows = projects
    .map((project) => ({
      name: project.name,
      count: tasks.filter((task) => task.projectId === project.id).length,
      active: project.isActive
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);

  const priorityRows = [
    { label: "Alta", count: counts.high },
    { label: "Media", count: counts.medium },
    { label: "Baja", count: counts.low }
  ];

  const dateRows = [
    { label: "Vencidas", count: counts.overdue, tone: "danger" },
    { label: "Hoy", count: counts.today, tone: "warning" },
    { label: "Próximas", count: counts.upcoming, tone: "success" },
    { label: "Sin fecha", count: counts.noDueDate, tone: "neutral" }
  ];

  const kpiContainer = document.getElementById("dashboard-kpis");
  const projectContainer = document.getElementById("dashboard-projects");
  const priorityContainer = document.getElementById("dashboard-priorities");
  const dateContainer = document.getElementById("dashboard-dates");

  if (kpiContainer) {
    kpiContainer.innerHTML = [
      { label: "Proyectos activos", value: activeProjects, tone: "neutral" },
      { label: "Tareas totales", value: summary.tasks, tone: "neutral" },
      { label: "Completadas", value: counts.completed, tone: "success" },
      { label: "Vencidas", value: counts.overdue, tone: "danger" },
      { label: "Hoy", value: counts.today, tone: "warning" },
      { label: "Próximas", value: counts.upcoming, tone: "success" }
    ].map((item) => `
      <article class="dashboard-metric dashboard-metric--${item.tone}">
        <span class="dashboard-metric__label">${escapeHtml(item.label)}</span>
        <strong class="dashboard-metric__value">${escapeHtml(item.value)}</strong>
      </article>
    `).join("");
  }

  if (projectContainer) {
    projectContainer.innerHTML = projectRows.length
      ? projectRows.map((row) => `
        <div class="dashboard-row">
          <span>${escapeHtml(row.name)}${row.active ? "" : " (Archivado)"}</span>
          <strong>${escapeHtml(row.count)}</strong>
        </div>
      `).join("")
      : '<div class="empty-state"><p>No hay proyectos todavía.</p></div>';
  }

  if (priorityContainer) {
    priorityContainer.innerHTML = priorityRows.map((row) => `
      <div class="dashboard-row dashboard-row--${row.count === 0 ? "neutral" : "active"}">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(row.count)}</strong>
      </div>
    `).join("");
  }

  if (dateContainer) {
    dateContainer.innerHTML = dateRows.map((row) => `
      <div class="dashboard-row dashboard-row--${row.tone}">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(row.count)}</strong>
      </div>
    `).join("");
  }

  const summaryElement = document.getElementById("dashboard-summary");
  if (summaryElement) {
    summaryElement.textContent = `Base local lista: ${summary.projects} proyectos, ${summary.tasks} tareas y ${summary.taskStatuses} estados.`;
  }

  setProjectCount(`${summary.projects} proyecto${summary.projects === 1 ? "" : "s"}`);
}

function formatProjectCard(project) {
  const statusLabel = project.isActive ? "Activo" : "Archivado";
  const statusClass = project.isActive ? "chip--active" : "chip--archived";
  const actionLabel = project.isActive ? "Archivar" : "Reactivar";
  const actionType = project.isActive ? "archive" : "reactivate";
  const clientLabel = project.clientId ? `<p class="project-card__description">${escapeHtml(getJournalClientName(project.clientId))}</p>` : '<p class="project-card__description">Sin cliente asignado</p>';

  return `
    <article class="project-card">
      <div class="project-card__meta">
        <div>
          <h3 class="project-card__title">${escapeHtml(project.name)}</h3>
          <span class="chip ${statusClass}">${statusLabel}</span>
        </div>
        <div class="project-card__actions">
          <button type="button" class="button button--secondary" data-action="edit-project" data-project-id="${escapeHtml(project.id)}">Editar</button>
          <button type="button" class="button button--secondary" data-action="${actionType}-project" data-project-id="${escapeHtml(project.id)}">${actionLabel}</button>
        </div>
      </div>
      ${clientLabel}
    </article>
  `;
}

function buildTaskRowMarkup(task, isNew) {
  const urgency = getTaskUrgency(task);
  const reminderLabel = isNew ? "" : getTaskReminderLabel(task);
  const statusId = task.statusId || getDefaultTaskStatusId();
  const priority = task.priority || "medium";
  const isStarred = task.isStarred === true;
  const rowClass = isNew ? "task-table__row--new" : `task-table__row--${urgency}`;
  const completedClass = !isNew && isCompletedTask(task) ? " task-table__row--completed" : "";
  const readOnlyClass = taskViewState.editMode ? "" : " task-table__row--readonly";
  const projectOptions = buildTaskProjectOptions(task.projectId || "");
  const statusOptions = buildTaskStatusOptions(statusId);
  const priorityOptions = buildTaskPriorityOptions(priority);
  const taskIdAttr = isNew ? " data-task-new=\"true\"" : ` data-task-id="${escapeHtml(task.id)}"`;
  const textReadOnlyAttr = !taskViewState.editMode ? " readonly" : "";
  const textAreaReadOnlyAttr = !taskViewState.editMode ? " readonly" : "";
  const selectDisabledAttr = !taskViewState.editMode ? " disabled" : "";
  const rowReminderMode = !isNew && task.reminderMode === "manual" ? "manual" : "dueDate";
  const dueValue = formatDateLabel(task.dueDate || "");
  const reminderValue = reminderLabel === "—" ? "" : reminderLabel;
  const duePickerValue = task.dueDate || "";
  const reminderPickerValue = getTaskReminderIso(task) || "";
  const dateEditControls = taskViewState.editMode
    ? `
          <button type="button" class="button button--secondary button--compact task-table__date-picker-button" data-task-date-picker-toggle="true" aria-label="Abrir calendario">
            <span class="task-table__action-icon" aria-hidden="true">📅</span>
          </button>
      `
    : "";
  const actionButton = isNew
    ? '<button type="button" class="button button--secondary button--compact" data-task-action="create" aria-label="Crear tarea"><span class="task-table__action-icon" aria-hidden="true">＋</span></button>'
    : isCompletedTask(task)
      ? '<button type="button" class="button button--secondary button--compact" data-task-action="reopen" aria-label="Reabrir tarea"><span class="task-table__action-icon" aria-hidden="true">↺</span></button>'
      : '<button type="button" class="button button--secondary button--compact" data-task-action="complete" aria-label="Marcar completada"><span class="task-table__action-icon" aria-hidden="true">✓</span></button>';
  const starButtonClass = isStarred ? " task-table__star-button--active" : "";
  const starAriaLabel = isStarred ? "Quitar de Mi día" : "Marcar para Mi día";

  return `
    <tr class="task-table__row ${rowClass}${completedClass}${readOnlyClass}"${taskIdAttr} data-reminder-mode="${rowReminderMode}" data-starred="${isStarred ? "true" : "false"}"${isNew && !taskViewState.editMode ? " hidden" : ""}>
      <td class="task-table__cell task-table__cell--star">
        <button type="button" class="button button--secondary button--compact task-table__star-button${starButtonClass}" data-task-action="toggle-star" aria-label="${starAriaLabel}" title="Mi día">
          <span class="task-table__action-icon" aria-hidden="true">★</span>
        </button>
      </td>
      <td class="task-table__cell task-table__cell--project">
        <select class="task-table__select task-table__select--project" data-task-field="projectId"${selectDisabledAttr}>${projectOptions}</select>
      </td>
      <td class="task-table__cell task-table__cell--title">
        <input class="task-table__input task-table__input--title" data-task-field="title" type="text" maxlength="180" placeholder="Título" value="${escapeHtml(task.title || "")}"${textReadOnlyAttr} />
      </td>
      <td class="task-table__cell task-table__cell--description">
        <textarea class="task-table__textarea" data-task-field="description" rows="2" maxlength="1000" placeholder="Descripción"${textAreaReadOnlyAttr}>${escapeHtml(task.description || "")}</textarea>
      </td>
      <td class="task-table__cell">
        <input class="task-table__input" data-task-field="responsibleName" type="text" maxlength="120" placeholder="Responsable" value="${escapeHtml(task.responsibleName || "")}"${textReadOnlyAttr} />
      </td>
      <td class="task-table__cell">
        <div class="task-table__date-control">
          <input class="task-table__input task-table__input--date task-table__input--due task-table__input--due-${escapeHtml(urgency)}" data-task-field="dueDate" type="text"${taskViewState.editMode ? ' inputmode="numeric" maxlength="10" placeholder="dd/mm/yyyy"' : ""} value="${escapeHtml(dueValue)}"${textReadOnlyAttr} />
          ${taskViewState.editMode ? `<input class="task-table__date-picker-native" data-task-picker-field="dueDate" type="date" tabindex="-1" aria-hidden="true" value="${escapeHtml(duePickerValue)}" />` : ""}
          ${dateEditControls}
        </div>
      </td>
      <td class="task-table__cell task-table__cell--reminder">
        <div class="task-table__date-control">
          <input class="task-table__input task-table__input--date" data-task-field="reminderDate" type="text"${taskViewState.editMode ? ' inputmode="numeric" maxlength="10" placeholder="dd/mm/yyyy"' : ""} value="${escapeHtml(reminderValue)}"${textReadOnlyAttr} />
          ${taskViewState.editMode ? `<input class="task-table__date-picker-native" data-task-picker-field="reminderDate" type="date" tabindex="-1" aria-hidden="true" value="${escapeHtml(reminderPickerValue)}" />` : ""}
          ${dateEditControls}
        </div>
      </td>
      <td class="task-table__cell">
        <select class="task-table__select task-table__select--priority task-table__select--priority-${escapeHtml(priority)}" data-task-field="priority"${selectDisabledAttr}>
          ${priorityOptions}
        </select>
      </td>
      <td class="task-table__cell">
        <select class="task-table__select task-table__select--status task-table__select--status-${escapeHtml(statusId)}" data-task-field="statusId"${selectDisabledAttr}>
          ${statusOptions}
        </select>
      </td>
      <td class="task-table__cell task-table__cell--actions">
        <div class="task-table__actions">
          ${actionButton}
          ${!isNew ? '<button type="button" class="button button--secondary button--compact" data-task-action="delete" aria-label="Borrar tarea"><span class="task-table__action-icon" aria-hidden="true">🗑</span></button>' : ""}
        </div>
      </td>
    </tr>
  `;
}

function normalizeTaskDateFieldValue(control) {
  if (!control) {
    return;
  }

  const parsed = parseUserDateValue(control.value);
  if (parsed) {
    control.value = formatDateLabel(parsed);
  }
}

function getTaskRowDatePicker(row, fieldName) {
  return row ? row.querySelector(`[data-task-picker-field="${fieldName}"]`) : null;
}

function setDateControlValue(control, isoDate) {
  if (!control) {
    return;
  }

  control.value = isoDate ? formatDateLabel(isoDate) : "";
  const row = getTaskTableRowElement(control);
  const fieldName = control.getAttribute("data-task-field");
  const picker = row && fieldName ? getTaskRowDatePicker(row, fieldName) : null;
  if (picker) {
    picker.value = isoDate || "";
  }
}

function syncTaskReminderMode(row) {
  if (!row) {
    return;
  }

  const dueDateControl = getTaskRowField(row, "dueDate");
  const reminderControl = getTaskRowField(row, "reminderDate");
  if (!dueDateControl || !reminderControl) {
    return;
  }

  const dueDate = parseUserDateValue(dueDateControl.value);
  const reminderDate = parseUserDateValue(reminderControl.value);
  const calculatedReminder = dueDate ? getCalculatedReminderIso(dueDate) : "";

  if (!reminderControl.value.trim()) {
    row.dataset.reminderMode = dueDate ? "dueDate" : "manual";
    if (dueDate) {
      setDateControlValue(reminderControl, calculatedReminder);
    }
    return;
  }

  row.dataset.reminderMode = reminderDate && calculatedReminder && reminderDate === calculatedReminder ? "dueDate" : "manual";
}

function updateTaskReminderPreview(row) {
  if (!row) {
    return;
  }

  const dueDateControl = getTaskRowField(row, "dueDate");
  const reminderControl = getTaskRowField(row, "reminderDate");
  if (!dueDateControl || !reminderControl) {
    return;
  }

  const dueDate = parseUserDateValue(dueDateControl.value);
  if (dueDate === null) {
    return;
  }

  if (row.dataset.reminderMode !== "manual") {
    setDateControlValue(reminderControl, dueDate ? getCalculatedReminderIso(dueDate) : "");
  }

  syncTaskReminderMode(row);
}

function syncTaskDatePickerFromText(row, fieldName) {
  const control = getTaskRowField(row, fieldName);
  const picker = getTaskRowDatePicker(row, fieldName);
  if (!control || !picker) {
    return;
  }

  const parsed = parseUserDateValue(control.value);
  picker.value = parsed || "";
}

function syncTaskDateTextFromPicker(row, fieldName) {
  const control = getTaskRowField(row, fieldName);
  const picker = getTaskRowDatePicker(row, fieldName);
  if (!control || !picker) {
    return;
  }

  control.value = picker.value ? formatDateLabel(picker.value) : "";
}

function readTaskRowData(row) {
  const taskId = row && row.getAttribute("data-task-id") ? row.getAttribute("data-task-id") : "";
  const projectId = getTaskRowField(row, "projectId");
  const title = getTaskRowField(row, "title");
  const description = getTaskRowField(row, "description");
  const responsibleName = getTaskRowField(row, "responsibleName");
  const dueDate = getTaskRowField(row, "dueDate");
  const reminderDate = getTaskRowField(row, "reminderDate");
  const priority = getTaskRowField(row, "priority");
  const statusId = getTaskRowField(row, "statusId");

  const dueDateRaw = dueDate ? dueDate.value.trim() : "";
  const dueDateValue = parseUserDateValue(dueDateRaw);
  if (dueDateValue === null) {
    return { error: "La fecha de vencimiento debe seguir el formato dd/mm/yyyy" };
  }

  const reminderRaw = reminderDate ? reminderDate.value.trim() : "";
  const reminderValue = parseUserDateValue(reminderRaw);
  if (reminderValue === null) {
    return { error: "La fecha de recordatorio debe seguir el formato dd/mm/yyyy" };
  }

  const calculatedReminder = dueDateValue ? getCalculatedReminderIso(dueDateValue) : "";
  const finalReminderDate = reminderValue || calculatedReminder || null;
  const finalReminderMode = reminderValue && (!calculatedReminder || reminderValue !== calculatedReminder) ? "manual" : (finalReminderDate ? "dueDate" : "manual");

  return {
    id: taskId,
    title: title ? title.value : "",
    description: description ? description.value : "",
    projectId: projectId && projectId.value ? projectId.value : null,
    responsibleName: responsibleName ? responsibleName.value : "",
    priority: priority ? priority.value : "medium",
    statusId: statusId ? statusId.value : getDefaultTaskStatusId(),
    dueDate: dueDateValue || null,
    reminderDate: finalReminderDate,
    reminderMode: finalReminderMode,
    isStarred: row.dataset.starred === "true"
  };
}

async function saveTaskRow(row, options = {}) {
  const data = readTaskRowData(row);
  if (data.error) {
    setStatus(data.error);
    return false;
  }

  const title = data.title.trim();
  if (!title) {
    setStatus("El título de la tarea es obligatorio");
    return false;
  }

  try {
    const saved = await window.WorkManagerDB.saveTask({
      id: data.id || undefined,
      title,
      description: data.description,
      projectId: data.projectId,
      responsibleName: data.responsibleName,
      priority: data.priority,
      statusId: data.statusId,
      dueDate: data.dueDate,
      reminderDate: data.reminderDate,
      reminderMode: data.reminderMode,
      isStarred: data.isStarred
    });

    if (options.silent !== true) {
      setStatus(saved.statusId === getCompletedStatusId() ? "Tarea completada" : data.id ? "Tarea actualizada" : "Tarea creada");
    }

    if (options.refresh !== false) {
      await refreshTasks();
      await updateDashboardSummary();
    }

    return true;
  } catch (error) {
    setStatus("No se pudo guardar la tarea");
    console.error(`${appName}: inline task save failed`, error);
    return false;
  }
}

function formatStatusCard(status) {
  const cardClass = status.mapsToComplete ? "status-card--success" : status.isActive ? "status-card--neutral" : "status-card--danger";
  const stateLabel = status.mapsToComplete
    ? "Completado"
    : status.isActive
      ? "Activo"
      : "Inactivo";
  const builtInLabel = status.isBuiltIn ? '<span class="chip chip--built-in">Sistema</span>' : "";
  const completeLabel = status.mapsToComplete ? '<span class="chip chip--success">Finaliza tarea</span>' : "";
  const deleteLabel = status.mapsToComplete ? "Protegido" : "Eliminar";
  const deleteDisabled = status.mapsToComplete ? " disabled" : "";
  const activeDisabled = status.mapsToComplete ? " disabled" : "";
  const activeToggleLabel = status.mapsToComplete ? "Fijo" : (status.isActive ? "Desactivar" : "Activar");
  const directionUpDisabled = status.order <= 1 ? " disabled" : "";
  const directionDownDisabled = status.order >= cachedTaskStatuses.length ? " disabled" : "";
  const description = status.label ? escapeHtml(status.label) : "";

  return `
    <article class="status-card ${cardClass}">
      <div class="status-card__meta">
        <div>
          <h3 class="status-card__title">${description}</h3>
          <div class="status-card__details">
            <span class="chip chip--neutral">Orden: ${escapeHtml(status.order)}</span>
            <span class="chip chip--neutral">${escapeHtml(stateLabel)}</span>
            ${builtInLabel}
            ${completeLabel}
          </div>
        </div>
        <div class="status-card__actions">
          <button type="button" class="button button--secondary" data-action="edit-status" data-status-id="${escapeHtml(status.id)}">Editar</button>
          <button type="button" class="button button--secondary" data-action="status-up" data-status-id="${escapeHtml(status.id)}"${directionUpDisabled}>↑</button>
          <button type="button" class="button button--secondary" data-action="status-down" data-status-id="${escapeHtml(status.id)}"${directionDownDisabled}>↓</button>
          <button type="button" class="button button--secondary" data-action="toggle-status" data-status-id="${escapeHtml(status.id)}"${activeDisabled}>${activeToggleLabel}</button>
          <button type="button" class="button button--secondary" data-action="delete-status" data-status-id="${escapeHtml(status.id)}"${deleteDisabled}>${deleteLabel}</button>
        </div>
      </div>
    </article>
  `;
}

async function renderStatuses() {
  const list = document.getElementById("status-list");
  if (!list) {
    return;
  }

  cachedTaskStatuses = await window.WorkManagerDB.getTaskStatuses();
  setStatusCount(`${cachedTaskStatuses.length} estado${cachedTaskStatuses.length === 1 ? "" : "s"}`);
  populateTaskSelects(taskElements.taskProject ? taskElements.taskProject.value : "", taskElements.taskStatus ? taskElements.taskStatus.value : getDefaultTaskStatusId());
  populateTaskFilterOptions();

  if (cachedTaskStatuses.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No hay estados configurados.</p></div>';
    return;
  }

  list.innerHTML = cachedTaskStatuses.map(formatStatusCard).join("");
}

async function refreshProjects() {
  const list = document.getElementById("project-list");
  if (!list) {
    return;
  }

  cachedProjects = await window.WorkManagerDB.getProjects();

  if (list) {
    if (cachedProjects.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>No hay proyectos todavía. Crea el primero con el formulario.</p></div>';
    } else {
      list.innerHTML = cachedProjects.map(formatProjectCard).join("");
    }
  }

  setProjectCount(`${cachedProjects.length} proyecto${cachedProjects.length === 1 ? "" : "s"}`);
  populateTaskSelects(taskElements.taskProject ? taskElements.taskProject.value : "", taskElements.taskStatus ? taskElements.taskStatus.value : getDefaultTaskStatusId());
  populateTaskFilterOptions();
  applyTaskFilterControls();
}

async function refreshTasks() {
  const list = document.getElementById("task-list");
  if (!list) {
    return;
  }

  const tasks = await window.WorkManagerDB.getTasks();
  const filteredTasks = filterTasks(tasks);
  setTaskCount(`${filteredTasks.length} tarea${filteredTasks.length === 1 ? "" : "s"}`);

  const emptyNote = filteredTasks.length === 0
   ? `<div class="empty-state"><p>${escapeHtml(tasks.length === 0 ? (taskViewState.editMode ? "No hay tareas todavía. Usa la primera fila para crear la primera tarea." : "No hay tareas todavía. Activa la edición para crear la primera tarea.") : "No hay tareas que coincidan con la vista o los filtros actuales.")}</p></div>`
    : "";

  const headers = [
   { label: "", className: "task-table__header--star" },
   { label: "Cliente - Proyecto" },
   { label: "Título" },
   { label: "Descripción" },
   { label: "Responsable" },
   { label: "Vence", sortBy: "dueDate" },
   { label: "Recordatorio" },
   { label: "Prioridad", sortBy: "priority" },
   { label: "Estado", sortBy: "status" },
   { label: "Acciones" }
  ];

  list.innerHTML = `
   <div class="task-table-wrap ${taskViewState.editMode ? "task-table-wrap--editing" : "task-table-wrap--readonly"}">
     <table class="task-table">
       <colgroup>
         <col style="width: 4%" />
         <col style="width: 10%" />
         <col style="width: 14%" />
         <col style="width: 22%" />
         <col style="width: 10%" />
         <col style="width: 10%" />
         <col style="width: 10%" />
         <col style="width: 6%" />
         <col style="width: 8%" />
         <col style="width: 6%" />
       </colgroup>
       <thead>
         <tr>
           ${headers.map((header) => `<th scope="col"${header.className ? ` class="${escapeHtml(header.className)}"` : ""}>${header.sortBy ? buildTaskSortHeaderMarkup(header.label, header.sortBy) : escapeHtml(header.label)}</th>`).join("")}
         </tr>
       </thead>
       <tbody>
         ${buildTaskRowMarkup({
           isStarred: false,
           projectId: "",
           title: "",
           description: "",
           responsibleName: DEFAULT_TASK_RESPONSIBLE,
           dueDate: "",
           reminderDate: "",
           priority: "medium",
           statusId: getDefaultTaskStatusId()
         }, true)}
         ${filteredTasks.map((task) => buildTaskRowMarkup(task, false)).join("")}
       </tbody>
     </table>
   </div>
   ${emptyNote}
  `;

  syncTaskTableToolbarButtons();
}

function getTaskTableRowElement(node) {
  return node ? node.closest("tr[data-task-id], tr[data-task-new]") : null;
}

function getTaskRowField(row, fieldName) {
  return row ? row.querySelector(`[data-task-field="${fieldName}"]`) : null;
}

function updateTaskRowSelectClasses(row) {
  if (!row) {
    return;
  }

  const starButton = row.querySelector(".task-table__star-button");
  if (starButton) {
    const isStarred = row.dataset.starred === "true";
    starButton.classList.toggle("task-table__star-button--active", isStarred);
    starButton.setAttribute("aria-label", isStarred ? "Quitar de Mi día" : "Marcar para Mi día");
  }

  const priority = getTaskRowField(row, "priority");
  if (priority) {
    priority.className = `task-table__select task-table__select--priority task-table__select--priority-${priority.value || "medium"}`;
  }

  const status = getTaskRowField(row, "statusId");
  if (status) {
    status.className = `task-table__select task-table__select--status task-table__select--status-${status.value || getDefaultTaskStatusId()}`;
  }

  const dueDate = getTaskRowField(row, "dueDate");
  if (dueDate) {
    const previewTask = {
      dueDate: parseUserDateValue(dueDate.value) || "",
      statusId: status ? status.value : getDefaultTaskStatusId()
    };
    const urgency = getTaskUrgency(previewTask);
    dueDate.className = `task-table__input task-table__input--date task-table__input--due task-table__input--due-${urgency}`;
  }
}

async function loadLookupData() {
  cachedProjects = await window.WorkManagerDB.getProjects();
  cachedTaskStatuses = await window.WorkManagerDB.getTaskStatuses();
  cachedJournalClients = await window.WorkManagerDB.getJournalClients();
  populateTaskFilterOptions();
  populateTaskSelects(taskElements.taskProject ? taskElements.taskProject.value : "", taskElements.taskStatus ? taskElements.taskStatus.value : getDefaultTaskStatusId());
  applyTaskFilterControls();
  setStatusCount(`${cachedTaskStatuses.length} estado${cachedTaskStatuses.length === 1 ? "" : "s"}`);
}

function getJournalClientName(clientId) {
  const client = cachedJournalClients.find((item) => item.id === clientId);
  return client ? client.name : "Cliente eliminado";
}

function getJournalProjectName(projectId) {
  if (!projectId) {
    return "Sin proyecto";
  }

  const project = cachedJournalProjects.find((item) => item.id === projectId) || cachedProjects.find((item) => item.id === projectId);
  if (!project) {
    return "Proyecto eliminado";
  }

  return getProjectClientLabel(project.id);
}

function buildJournalClientOptions(selectedClientId) {
  return cachedJournalClients.length
    ? cachedJournalClients.map((client) => `<option value="${escapeHtml(client.id)}"${client.id === selectedClientId ? " selected" : ""}>${escapeHtml(client.name)}</option>`).join("")
    : '<option value="">No hay clientes</option>';
}

function buildJournalProjectOptions(selectedProjectId) {
  const options = ['<option value="">Sin proyecto</option>'].concat(
    cachedJournalProjects.map((project) => `<option value="${escapeHtml(project.id)}"${project.id === selectedProjectId ? " selected" : ""}>${escapeHtml(getJournalProjectName(project.id))}</option>`)
  );
  return options.join("");
}

function renderJournalClientCard(client) {
  return `
    <article class="journal-card">
      <div class="journal-card__body">
        <strong>${escapeHtml(client.name)}</strong>
      </div>
      <div class="journal-card__actions">
        <button type="button" class="button button--secondary button--compact" data-journal-action="edit-client" data-journal-id="${escapeHtml(client.id)}" aria-label="Editar cliente">✎</button>
        <button type="button" class="button button--secondary button--compact" data-journal-action="delete-client" data-journal-id="${escapeHtml(client.id)}" aria-label="Borrar cliente">🗑</button>
      </div>
    </article>
  `;
}

function syncJournalSelects() {
  if (journalElements.entryProject) {
    journalElements.entryProject.innerHTML = buildJournalProjectOptions(journalElements.entryProject.value || "");
  }

  if (journalElements.filterProject) {
    const options = ['<option value="">Todos</option>', '<option value="__none__">Sin proyecto</option>'].concat(
      cachedJournalProjects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(getJournalProjectName(project.id))}</option>`)
    );
    journalElements.filterProject.innerHTML = options.join("");
    journalElements.filterProject.value = diaryViewState.projectId;
  }

  if (journalElements.filterSearch) {
    journalElements.filterSearch.value = diaryViewState.searchText;
  }
}

function matchesDiaryFilters(entry) {
  if (diaryViewState.projectId === "__none__" && entry.projectId) {
    return false;
  }

  if (diaryViewState.projectId && diaryViewState.projectId !== "__none__" && entry.projectId !== diaryViewState.projectId) {
    return false;
  }

  if (diaryViewState.searchText) {
    return (entry.content || "").toLowerCase().includes(diaryViewState.searchText.toLowerCase());
  }

  return true;
}

function openJournalEntryModal(entry = null) {
  const modal = document.getElementById("journal-entry-modal");
  if (!modal) {
    return;
  }

  if (journalElements.entryId) journalElements.entryId.value = entry ? entry.id || "" : "";
  if (journalElements.entryProject) journalElements.entryProject.value = entry ? (entry.projectId || "") : "";
  if (journalElements.entryTitle) journalElements.entryTitle.value = entry ? (entry.title || "") : "";
  if (journalElements.entryContent) journalElements.entryContent.value = entry ? (entry.content || "") : "";

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  if (journalElements.entryContent) {
    window.requestAnimationFrame(() => journalElements.entryContent.focus());
  }
}

function closeJournalEntryModal() {
  const modal = document.getElementById("journal-entry-modal");
  if (modal) {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }

  if (journalElements.entryId) journalElements.entryId.value = "";
  if (journalElements.entryProject) journalElements.entryProject.value = "";
  if (journalElements.entryTitle) journalElements.entryTitle.value = "";
  if (journalElements.entryContent) journalElements.entryContent.value = "";
}

function renderJournalEntryRow(entry) {
  return `
    <tr>
      <td class="journal-table__context">${escapeHtml(getJournalProjectName(entry.projectId))}</td>
      <td class="journal-table__title">${escapeHtml(entry.title || "Sin título")}</td>
      <td class="journal-table__content">${escapeHtml(entry.content)}</td>
      <td class="journal-table__date">${escapeHtml(formatDateTimeLabel(entry.updatedAt || entry.createdAt || ""))}</td>
      <td class="journal-table__actions">
        <div class="task-table__actions">
          <button type="button" class="button button--secondary button--compact" data-journal-action="edit-entry" data-journal-id="${escapeHtml(entry.id)}" aria-label="Editar entrada"><span class="task-table__action-icon" aria-hidden="true">✎</span></button>
          <button type="button" class="button button--secondary button--compact" data-journal-action="delete-entry" data-journal-id="${escapeHtml(entry.id)}" aria-label="Borrar entrada"><span class="task-table__action-icon" aria-hidden="true">🗑</span></button>
        </div>
      </td>
    </tr>
  `;
}

async function refreshDiary() {
  const [clients, projects, entries] = await Promise.all([
    window.WorkManagerDB.getJournalClients(),
    window.WorkManagerDB.getJournalProjects(),
    window.WorkManagerDB.getJournalEntries()
  ]);

  cachedJournalClients = clients;
  cachedJournalProjects = projects;
  cachedJournalEntries = entries;
  syncJournalSelects();

  const clientsCount = document.getElementById("journal-clients-count");
  const projectsCount = document.getElementById("journal-projects-count");
  const entriesCount = document.getElementById("journal-entries-count");
  const diarySummary = document.getElementById("diary-summary");
  const gestorSummary = document.getElementById("gestor-summary");
  const filteredEntries = entries.filter(matchesDiaryFilters);

  if (clientsCount) clientsCount.textContent = `${clients.length} cliente${clients.length === 1 ? "" : "s"}`;
  if (projectsCount) projectsCount.textContent = `${projects.length} proyecto${projects.length === 1 ? "" : "s"}`;
  if (entriesCount) entriesCount.textContent = `${filteredEntries.length} de ${entries.length} entrada${entries.length === 1 ? "" : "s"}`;
  if (diarySummary) diarySummary.textContent = `${filteredEntries.length} de ${entries.length} entradas`;
  if (gestorSummary) gestorSummary.textContent = `${clients.length} clientes · ${projects.length} proyectos`;

  const clientList = document.getElementById("journal-client-list");
  const projectList = document.getElementById("project-list");
  const entryList = document.getElementById("journal-entry-list");

  if (clientList) {
    clientList.innerHTML = clients.length ? clients.map(renderJournalClientCard).join("") : '<div class="empty-state">No hay clientes todavía.</div>';
  }

  if (projectList) {
    projectList.innerHTML = projects.length ? projects.map(formatProjectCard).join("") : '<div class="empty-state">No hay proyectos todavía.</div>';
  }

  if (entryList) {
    entryList.innerHTML = filteredEntries.length ? `
      <div class="journal-table-wrap">
        <table class="journal-table">
          <colgroup>
            <col style="width: 20%" />
            <col style="width: 16%" />
            <col style="width: 48%" />
            <col style="width: 10%" />
            <col style="width: 6%" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Cliente - Proyecto</th>
              <th scope="col">Título</th>
              <th scope="col">Entrada</th>
              <th scope="col">Actualizado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEntries.map(renderJournalEntryRow).join("")}
          </tbody>
        </table>
      </div>
    ` : '<div class="empty-state">No hay entradas que coincidan con los filtros actuales.</div>';
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    setStatus("Navegador sin Service Worker");
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
    setStatus("PWA preparada");
  } catch (error) {
    setStatus("PWA no disponible");
    console.error(`${appName}: service worker registration failed`, error);
  }
}

async function initializeDataLayer() {
  if (!window.WorkManagerDB) {
    setStatus("Capa de datos no disponible");
    setSummary("IndexedDB no está disponible en este navegador.");
    return;
  }

  try {
    appViewState = loadAppViewState();
    taskViewState = loadTaskViewState();
    diaryViewState = loadDiaryViewState();
    await window.WorkManagerDB.init();
    const initialView = window.location.hash ? getViewFromHash() : appViewState.view;
    appViewState.view = initialView;
    saveAppViewState();
    syncAppView();
    if (!window.location.hash) {
      history.replaceState(null, "", `#/${initialView}`);
    }
    await refreshWorkspaceData();
    clearProjectForm();
    clearTaskForm();
    clearStatusForm();
    focusRequestedEntityForm();
    setStatus("Datos locales listos");
  } catch (error) {
    setStatus("Error en IndexedDB");
    setSummary("No se pudo inicializar la base de datos local.");
    console.error(`${appName}: IndexedDB initialization failed`, error);
  }
}

function wireActions() {
  projectElements = {
    form: document.getElementById("project-form"),
    projectId: document.getElementById("project-id"),
    projectName: document.getElementById("project-name"),
    projectClient: document.getElementById("project-client"),
    saveButton: document.getElementById("save-project-button"),
    cancelButton: document.getElementById("cancel-project-button"),
    projectList: document.getElementById("project-list")
  };

  taskElements = {
    form: document.getElementById("task-form"),
    taskId: document.getElementById("task-id"),
    taskTitle: document.getElementById("task-title"),
    taskDescription: document.getElementById("task-description"),
    taskProject: document.getElementById("task-project"),
    taskResponsible: document.getElementById("task-responsible"),
    taskPriority: document.getElementById("task-priority"),
    taskStatus: document.getElementById("task-status"),
    taskDueDate: document.getElementById("task-due-date"),
    taskReminderMode: document.getElementById("task-reminder-mode"),
    taskReminderDate: document.getElementById("task-reminder-date"),
    saveButton: document.getElementById("save-task-button"),
    cancelButton: document.getElementById("cancel-task-button"),
    taskList: document.getElementById("task-list")
  };

  filterElements = {
    project: document.getElementById("task-filter-project"),
    responsible: document.getElementById("task-filter-responsible"),
    priority: document.getElementById("task-filter-priority"),
    status: document.getElementById("task-filter-status"),
    dueWindowDays: document.getElementById("task-filter-due-window"),
    clearButton: document.getElementById("clear-task-filters")
  };

  statusElements = {
    form: document.getElementById("status-form"),
    statusId: document.getElementById("status-id"),
    statusLabel: document.getElementById("status-label"),
    statusOrder: document.getElementById("status-order"),
    statusActive: document.getElementById("status-active"),
    statusComplete: document.getElementById("status-complete"),
    saveButton: document.getElementById("save-status-button"),
    cancelButton: document.getElementById("cancel-status-button"),
    statusList: document.getElementById("status-list")
  };

  backupElements = {
    exportButton: document.getElementById("export-data-button"),
    importButton: document.getElementById("import-data-button"),
    importFile: document.getElementById("import-data-file")
  };

  if (filterElements.project) {
    filterElements.project.addEventListener("change", async () => {
      taskViewState.projectId = filterElements.project.value;
      saveTaskViewState();
      await refreshTasks();
    });
  }

  if (filterElements.responsible) {
    filterElements.responsible.addEventListener("input", async () => {
      taskViewState.responsible = filterElements.responsible.value.trim();
      saveTaskViewState();
      await refreshTasks();
    });
  }

  if (filterElements.priority) {
    filterElements.priority.addEventListener("change", async () => {
      taskViewState.priority = filterElements.priority.value;
      saveTaskViewState();
      await refreshTasks();
    });
  }

  if (filterElements.status) {
    filterElements.status.addEventListener("change", async () => {
      taskViewState.statusId = filterElements.status.value;
      saveTaskViewState();
      await refreshTasks();
    });
  }

  if (filterElements.dueWindowDays) {
    filterElements.dueWindowDays.addEventListener("change", async () => {
      setDueWindowDays(filterElements.dueWindowDays.value);
      await refreshTasks();
      await refreshProjects();
    });
  }

  if (filterElements.clearButton) {
    filterElements.clearButton.addEventListener("click", async () => {
      clearTaskFilters();
      await refreshTasks();
      await refreshProjects();
    });
  }

  if (statusElements.form) {
    statusElements.form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = readStatusForm();
      const label = data.label.trim();
      if (!label) {
        setStatus("El texto visible del estado es obligatorio");
        return;
      }

      try {
        await window.WorkManagerDB.saveTaskStatus({
          id: data.id || undefined,
          label,
          order: data.order,
          isActive: data.isActive,
          mapsToComplete: data.mapsToComplete
        });

        await loadLookupData();
        await renderStatuses();
        await refreshTasks();
        await updateDashboardSummary();
        clearStatusForm();
        setStatus(data.id ? "Estado actualizado" : "Estado creado");
      } catch (error) {
        setStatus("No se pudo guardar el estado");
        console.error(`${appName}: status save failed`, error);
      }
    });
  }

  if (statusElements.cancelButton) {
    statusElements.cancelButton.addEventListener("click", () => {
      clearStatusForm();
    });
  }

  if (backupElements.exportButton) {
    backupElements.exportButton.addEventListener("click", async () => {
      try {
        await exportWorkspaceBackup();
        setStatus("Copia JSON exportada");
      } catch (error) {
        setStatus("No se pudo exportar la copia");
        console.error(`${appName}: backup export failed`, error);
      }
    });
  }

  if (backupElements.importButton && backupElements.importFile) {
    backupElements.importButton.addEventListener("click", () => {
      backupElements.importFile.value = "";
      backupElements.importFile.click();
    });

    backupElements.importFile.addEventListener("change", async () => {
      const file = backupElements.importFile.files && backupElements.importFile.files[0] ? backupElements.importFile.files[0] : null;
      backupElements.importFile.value = "";
      if (!file) {
        return;
      }

      const confirmed = window.confirm("La importación reemplazará todos los datos locales actuales de esta URL. ¿Deseas continuar?");
      if (!confirmed) {
        setStatus("Importación cancelada");
        return;
      }

      try {
        const rawText = await file.text();
        await importWorkspaceBackupFromText(rawText);
        setStatus("Datos importados correctamente");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "No se pudo importar la copia");
        console.error(`${appName}: backup import failed`, error);
      }
    });
  }

  if (statusElements.statusList) {
    statusElements.statusList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }

      const statusId = button.getAttribute("data-status-id");
      const action = button.getAttribute("data-action");

      try {
        if (action === "edit-status") {
          const status = cachedTaskStatuses.find((item) => item.id === statusId);
          if (status) {
            fillStatusForm(status);
          }
          return;
        }

        if (action === "status-up") {
          await window.WorkManagerDB.reorderTaskStatus(statusId, "up");
        } else if (action === "status-down") {
          await window.WorkManagerDB.reorderTaskStatus(statusId, "down");
        } else if (action === "toggle-status") {
          const status = cachedTaskStatuses.find((item) => item.id === statusId);
          if (status) {
            await window.WorkManagerDB.toggleTaskStatusActive(statusId, !status.isActive);
          }
        } else if (action === "delete-status") {
          const confirmed = window.confirm("¿Seguro que quieres borrar este estado?");
          if (!confirmed) {
            return;
          }

          await window.WorkManagerDB.deleteTaskStatus(statusId);
        }

        await loadLookupData();
        await renderStatuses();
        await refreshProjects();
        await refreshTasks();
        await updateDashboardSummary();
        setStatus("Estado actualizado");
      } catch (error) {
        setStatus("No se pudo actualizar el estado");
        console.error(`${appName}: status action failed`, error);
      }
    });
  }

  const appViewButtons = document.querySelectorAll(".app-nav [data-app-view]");
  appViewButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const targetView = normalizeAppView(button.getAttribute("data-app-view"));
      setHashForView(targetView);
    });
  });

  const jumpButtons = document.querySelectorAll("button[data-jump-form]");
  jumpButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const targetForm = button.getAttribute("data-jump-form");
      pendingEntityFocus = targetForm === "project" ? "project" : "task";
      if (targetForm === "project") {
        clearProjectForm();
      } else {
        clearTaskForm();
      }
      setHashForView("entities");
    });
  });

  const viewButtons = document.querySelectorAll("button[data-view]");
  viewButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      setTaskView(button.getAttribute("data-view"));
      await refreshTasks();
    });
  });

  journalElements = {
    clientForm: document.getElementById("journal-client-form"),
    clientId: document.getElementById("journal-client-id"),
    clientName: document.getElementById("journal-client-name"),
    clientCancel: document.getElementById("journal-client-cancel"),
    clientList: document.getElementById("journal-client-list"),
    entryForm: document.getElementById("journal-entry-form"),
    entryId: document.getElementById("journal-entry-id"),
    entryProject: document.getElementById("journal-entry-project"),
    entryTitle: document.getElementById("journal-entry-title"),
    entryContent: document.getElementById("journal-entry-content"),
    entryCancel: document.getElementById("journal-entry-cancel"),
    entryList: document.getElementById("journal-entry-list"),
    filterProject: document.getElementById("journal-filter-project"),
    filterSearch: document.getElementById("journal-filter-search"),
    clearFilters: document.getElementById("clear-journal-filters"),
    newEntryButton: document.getElementById("new-journal-button"),
    modal: document.getElementById("journal-entry-modal")
  };

  const taskTable = document.getElementById("task-list");
  if (taskTable) {
    taskTable.addEventListener("input", (event) => {
      const control = event.target.closest("[data-task-field]");
      const row = getTaskTableRowElement(control);
      if (!control || !row) {
        return;
      }

      const fieldName = control.getAttribute("data-task-field");
      if (fieldName === "dueDate" || fieldName === "reminderDate") {
        syncTaskDatePickerFromText(row, fieldName);
      }
      if (fieldName === "dueDate") {
        updateTaskReminderPreview(row);
      } else if (fieldName === "reminderDate") {
        syncTaskReminderMode(row);
      }

      updateTaskRowSelectClasses(row);
    });

    taskTable.addEventListener("change", async (event) => {
      const control = event.target.closest("[data-task-field]");
      const row = getTaskTableRowElement(control);
      if (!control || !row) {
        return;
      }

      const fieldName = control.getAttribute("data-task-field");
      if (fieldName === "dueDate" || fieldName === "reminderDate") {
        normalizeTaskDateFieldValue(control);
        syncTaskDatePickerFromText(row, fieldName);
      }

      updateTaskReminderPreview(row);
      updateTaskRowSelectClasses(row);

      if (taskViewState.editMode && row.hasAttribute("data-task-id")) {
        await saveTaskRow(row, { silent: true });
      }
    });

    taskTable.addEventListener("click", async (event) => {
      const sortButton = event.target.closest("button[data-task-sort]");
      if (sortButton) {
        setTaskSort(sortButton.getAttribute("data-task-sort"));
        await refreshTasks();
        return;
      }

      const datePickerButton = event.target.closest("button[data-task-date-picker-toggle]");
      if (datePickerButton) {
        const row = getTaskTableRowElement(datePickerButton);
        const control = datePickerButton.closest(".task-table__date-control");
        const picker = control ? control.querySelector("[data-task-picker-field]") : null;
        if (row && picker) {
          if (typeof picker.showPicker === "function") {
            picker.showPicker();
          } else {
            picker.click();
          }
        }
        return;
      }

      const button = event.target.closest("button[data-task-action]");
      if (!button) {
        return;
      }

      const row = getTaskTableRowElement(button);
      if (!row) {
        return;
      }

      const action = button.getAttribute("data-task-action");

      if (action === "create") {
        await saveTaskRow(row);
        return;
      }

      if (action === "toggle-star") {
        const nextStarred = row.dataset.starred !== "true";
        row.dataset.starred = nextStarred ? "true" : "false";
        updateTaskRowSelectClasses(row);

        if (row.hasAttribute("data-task-id")) {
          const taskId = row.getAttribute("data-task-id");
          if (!taskId) {
            return;
          }

          await window.WorkManagerDB.toggleTaskStar(taskId, nextStarred);
          await refreshTasks();
          setStatus(nextStarred ? "Tarea marcada para Mi día" : "Tarea retirada de Mi día");
        }
        return;
      }

      if (action === "complete") {
        const taskId = row.getAttribute("data-task-id");
        if (!taskId) {
          return;
        }

        await window.WorkManagerDB.completeTask(taskId);
        await refreshTasks();
        await updateDashboardSummary();
        setStatus("Tarea completada");
        return;
      }

      if (action === "reopen") {
        const taskId = row.getAttribute("data-task-id");
        if (!taskId) {
          return;
        }

        await window.WorkManagerDB.reopenTask(taskId);
        await refreshTasks();
        await updateDashboardSummary();
        setStatus("Tarea reabierta");
        return;
      }

      if (action === "delete") {
        const confirmed = window.confirm("¿Seguro que quieres borrar esta tarea?");
        if (!confirmed) {
          return;
        }

        const taskId = row.getAttribute("data-task-id");
        if (taskId) {
          await window.WorkManagerDB.deleteTask(taskId);
          await refreshTasks();
          await updateDashboardSummary();
          setStatus("Tarea borrada");
        }
      }
    });

    taskTable.addEventListener("change", async (event) => {
      const picker = event.target.closest("[data-task-picker-field]");
      const row = getTaskTableRowElement(picker);
      if (!picker || !row) {
        return;
      }

      const fieldName = picker.getAttribute("data-task-picker-field");
      syncTaskDateTextFromPicker(row, fieldName);
      if (fieldName === "dueDate") {
        updateTaskReminderPreview(row);
      } else if (fieldName === "reminderDate") {
        syncTaskReminderMode(row);
      }

      updateTaskRowSelectClasses(row);

      if (taskViewState.editMode && row.hasAttribute("data-task-id")) {
        await saveTaskRow(row, { silent: true });
      }
    });
  }

  if (journalElements.clientForm) {
    journalElements.clientForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = journalElements.clientName ? journalElements.clientName.value.trim() : "";
      if (!name) {
        setStatus("El nombre del cliente es obligatorio");
        return;
      }

      try {
        await window.WorkManagerDB.saveJournalClient({
          id: journalElements.clientId ? journalElements.clientId.value : "",
          name
        });
        if (journalElements.clientId) journalElements.clientId.value = "";
        if (journalElements.clientName) journalElements.clientName.value = "";
        await loadLookupData();
        await refreshDiary();
        setStatus("Cliente guardado");
      } catch (error) {
        setStatus("No se pudo guardar el cliente");
        console.error(`${appName}: client save failed`, error);
      }
    });
  }

  if (journalElements.clientCancel) {
    journalElements.clientCancel.addEventListener("click", () => {
      if (journalElements.clientId) journalElements.clientId.value = "";
      if (journalElements.clientName) journalElements.clientName.value = "";
    });
  }

  if (journalElements.clientList) {
    journalElements.clientList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-journal-action]");
      if (!button) {
        return;
      }

      const action = button.getAttribute("data-journal-action");
      const id = button.getAttribute("data-journal-id");
      const client = cachedJournalClients.find((item) => item.id === id);

      try {
        if (action === "edit-client" && client) {
          if (journalElements.clientId) journalElements.clientId.value = client.id;
          if (journalElements.clientName) journalElements.clientName.value = client.name;
          return;
        }

        if (action === "delete-client") {
          const confirmed = window.confirm("¿Seguro que quieres borrar este cliente?");
          if (!confirmed) {
            return;
          }

          await window.WorkManagerDB.deleteJournalClient(id);
          await loadLookupData();
          await refreshDiary();
          setStatus("Cliente borrado");
        }
      } catch (error) {
        setStatus("No se pudo actualizar el cliente");
        console.error(`${appName}: client action failed`, error);
      }
    });
  }

  if (journalElements.entryForm) {
    journalElements.entryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const projectId = journalElements.entryProject ? journalElements.entryProject.value : "";
      const content = journalElements.entryContent ? journalElements.entryContent.value.trim() : "";
      const title = journalElements.entryTitle ? journalElements.entryTitle.value.trim() : "";

      if (!content) {
        setStatus("El contenido de la entrada es obligatorio");
        return;
      }

      try {
        await window.WorkManagerDB.saveJournalEntry({
          id: journalElements.entryId ? journalElements.entryId.value : "",
          projectId: projectId || null,
          title,
          content
        });
        closeJournalEntryModal();
        await refreshDiary();
        setStatus("Entrada guardada");
      } catch (error) {
        setStatus("No se pudo guardar la entrada");
        console.error(`${appName}: journal entry save failed`, error);
      }
    });
  }

  if (journalElements.newEntryButton) {
    journalElements.newEntryButton.addEventListener("click", () => {
      openJournalEntryModal();
    });
  }

  if (journalElements.entryCancel) {
    journalElements.entryCancel.addEventListener("click", () => {
      closeJournalEntryModal();
    });
  }

  if (journalElements.modal) {
    journalElements.modal.addEventListener("click", (event) => {
      const closeTarget = event.target.closest("[data-close-modal]");
      if (closeTarget) {
        closeJournalEntryModal();
      }
    });
  }

  if (journalElements.filterProject) {
    journalElements.filterProject.addEventListener("change", async () => {
      diaryViewState.projectId = journalElements.filterProject.value;
      saveDiaryViewState();
      await refreshDiary();
    });
  }

  if (journalElements.filterSearch) {
    journalElements.filterSearch.value = diaryViewState.searchText;
    journalElements.filterSearch.addEventListener("input", async () => {
      diaryViewState.searchText = journalElements.filterSearch.value.trim();
      saveDiaryViewState();
      await refreshDiary();
    });
  }

  if (journalElements.clearFilters) {
    journalElements.clearFilters.addEventListener("click", async () => {
      diaryViewState = {
        projectId: "",
        searchText: ""
      };
      saveDiaryViewState();
      if (journalElements.filterProject) journalElements.filterProject.value = "";
      if (journalElements.filterSearch) journalElements.filterSearch.value = "";
      await refreshDiary();
    });
  }

  if (journalElements.entryList) {
    journalElements.entryList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-journal-action]");
      if (!button) {
        return;
      }

      const action = button.getAttribute("data-journal-action");
      const id = button.getAttribute("data-journal-id");
      const entry = cachedJournalEntries.find((item) => item.id === id);

      try {
        if (action === "edit-entry" && entry) {
          openJournalEntryModal(entry);
          return;
        }

        if (action === "delete-entry") {
          const confirmed = window.confirm("¿Seguro que quieres borrar esta entrada?");
          if (!confirmed) {
            return;
          }

          await window.WorkManagerDB.deleteJournalEntry(id);
          await refreshDiary();
          setStatus("Entrada borrada");
        }
      } catch (error) {
        setStatus("No se pudo actualizar la entrada");
        console.error(`${appName}: journal entry action failed`, error);
      }
    });
  }

  if (projectElements.form) {
    projectElements.form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = readProjectForm();
      const name = data.name.trim();
      if (!name) {
        setStatus("El nombre del proyecto es obligatorio");
        return;
      }

      if (!data.clientId) {
        setStatus("Debes seleccionar un cliente");
        return;
      }

      try {
        const existing = data.id ? await window.WorkManagerDB.getById("projects", data.id) : null;
        await window.WorkManagerDB.saveProject({
          id: data.id || undefined,
          name,
          clientId: data.clientId,
          description: data.description,
          color: data.color,
          isActive: existing ? existing.isActive : true,
          archivedAt: existing ? existing.archivedAt : null
        });

        await loadLookupData();
        await refreshProjects();
        await refreshTasks();
        await refreshDiary();
        await updateDashboardSummary();
        clearProjectForm();
        setStatus(data.id ? "Proyecto actualizado" : "Proyecto creado");
      } catch (error) {
        setStatus("No se pudo guardar el proyecto");
        console.error(`${appName}: project save failed`, error);
      }
    });
  }

  if (projectElements.cancelButton) {
    projectElements.cancelButton.addEventListener("click", () => {
      clearProjectForm();
    });
  }

  if (projectElements.projectList) {
    projectElements.projectList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }

      const projectId = button.getAttribute("data-project-id");
      const action = button.getAttribute("data-action");

      try {
        if (action === "edit-project") {
          const project = await window.WorkManagerDB.getById("projects", projectId);
          if (project) {
            fillProjectForm(project);
          }
          return;
        }

        if (action === "archive-project") {
          await window.WorkManagerDB.archiveProject(projectId);
        } else if (action === "reactivate-project") {
          await window.WorkManagerDB.reactivateProject(projectId);
        }

        await loadLookupData();
        await refreshProjects();
        await refreshTasks();
        await refreshDiary();
        await updateDashboardSummary();
        setStatus("Proyecto actualizado");
      } catch (error) {
        setStatus("No se pudo actualizar el proyecto");
        console.error(`${appName}: project action failed`, error);
      }
    });
  }

  if (taskElements.form) {
    taskElements.form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = readTaskForm();
      const title = data.title.trim();
      if (!title) {
        setStatus("El título de la tarea es obligatorio");
        return;
      }

      try {
        await window.WorkManagerDB.saveTask({
          id: data.id || undefined,
          title,
          description: data.description,
          projectId: data.projectId || null,
          responsibleName: data.responsibleName,
          priority: data.priority,
          statusId: data.statusId,
          dueDate: data.dueDate || null,
          reminderDate: data.reminderDate || null,
          reminderMode: data.reminderMode
        });

        await refreshTasks();
        await updateDashboardSummary();
        clearTaskForm();
        setStatus(data.id ? "Tarea actualizada" : "Tarea creada");
      } catch (error) {
        setStatus("No se pudo guardar la tarea");
        console.error(`${appName}: task save failed`, error);
      }
    });
  }

  if (taskElements.cancelButton) {
    taskElements.cancelButton.addEventListener("click", () => {
      clearTaskForm();
    });
  }

  if (taskElements.taskList) {
    taskElements.taskList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }

      const taskId = button.getAttribute("data-task-id");
      const action = button.getAttribute("data-action");

      try {
        if (action === "edit-task") {
          const task = await window.WorkManagerDB.getById("tasks", taskId);
          if (task) {
            fillTaskForm(task);
          }
          return;
        }

        if (action === "complete-task") {
          await window.WorkManagerDB.completeTask(taskId);
        } else if (action === "reopen-task") {
          await window.WorkManagerDB.reopenTask(taskId);
        } else if (action === "delete-task") {
          const confirmed = window.confirm("¿Seguro que quieres borrar esta tarea?");
          if (!confirmed) {
            return;
          }

          await window.WorkManagerDB.deleteTask(taskId);
        }

        await refreshTasks();
        await updateDashboardSummary();
        setStatus("Tarea actualizada");
      } catch (error) {
        setStatus("No se pudo actualizar la tarea");
        console.error(`${appName}: task action failed`, error);
      }
    });
  }

  const refreshButton = document.getElementById("refresh-button");
  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      try {
        await refreshWorkspaceData();
        setStatus("Interfaz lista");
      } catch (error) {
        setStatus("Error al leer datos");
        console.error(`${appName}: summary refresh failed`, error);
      }
    });
  }
}

const toggleCompletedButton = document.getElementById("toggle-completed-button");
if (toggleCompletedButton) {
  toggleCompletedButton.addEventListener("click", async () => {
    taskViewState.showCompleted = !taskViewState.showCompleted;
    saveTaskViewState();
    syncTaskTableToolbarButtons();
    await refreshTasks();
  });
}

const toggleTaskEditButton = document.getElementById("toggle-task-edit-button");
if (toggleTaskEditButton) {
  toggleTaskEditButton.addEventListener("click", async () => {
    taskViewState.editMode = !taskViewState.editMode;
    saveTaskViewState();
    syncTaskTableToolbarButtons();
    await refreshTasks();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  wireActions();
  window.addEventListener("hashchange", routeAppViewFromHash);
  initializeDataLayer();
  registerServiceWorker();
});
