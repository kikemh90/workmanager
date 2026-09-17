const WorkManagerDB = (() => {
  const DB_NAME = "workmanager-db";
  const DB_VERSION = 2;

  const BUILTIN_STATUSES = [
    {
      id: "pending",
      label: "Pendiente",
      order: 1,
      isActive: true,
      isBuiltIn: true,
      mapsToComplete: false
    },
    {
      id: "in-progress",
      label: "En curso",
      order: 2,
      isActive: true,
      isBuiltIn: true,
      mapsToComplete: false
    },
    {
      id: "blocked",
      label: "Bloqueada",
      order: 3,
      isActive: true,
      isBuiltIn: true,
      mapsToComplete: false
    },
    {
      id: "completed",
      label: "Completada",
      order: 4,
      isActive: true,
      isBuiltIn: true,
      mapsToComplete: true
    }
  ];
  const PROJECT_CATALOG_MIGRATION_KEY = "migration-shared-project-catalog-v1";

  let dbPromise = null;

  function createId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains("projects")) {
          const store = database.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("byName", "name", { unique: false });
          store.createIndex("byIsActive", "isActive", { unique: false });
          store.createIndex("byUpdatedAt", "updatedAt", { unique: false });
        }

        if (!database.objectStoreNames.contains("tasks")) {
          const store = database.createObjectStore("tasks", { keyPath: "id" });
          store.createIndex("byProjectId", "projectId", { unique: false });
          store.createIndex("byStatusId", "statusId", { unique: false });
          store.createIndex("byPriority", "priority", { unique: false });
          store.createIndex("byDueDate", "dueDate", { unique: false });
          store.createIndex("byReminderDate", "reminderDate", { unique: false });
          store.createIndex("byResponsibleName", "responsibleName", { unique: false });
          store.createIndex("byCompletedAt", "completedAt", { unique: false });
          store.createIndex("byUpdatedAt", "updatedAt", { unique: false });
        }

        if (!database.objectStoreNames.contains("taskStatuses")) {
          const store = database.createObjectStore("taskStatuses", { keyPath: "id" });
          store.createIndex("byOrder", "order", { unique: false });
          store.createIndex("byIsActive", "isActive", { unique: false });
        }

        if (!database.objectStoreNames.contains("appSettings")) {
          database.createObjectStore("appSettings", { keyPath: "key" });
        }

        if (!database.objectStoreNames.contains("journalClients")) {
          const store = database.createObjectStore("journalClients", { keyPath: "id" });
          store.createIndex("byName", "name", { unique: false });
          store.createIndex("byUpdatedAt", "updatedAt", { unique: false });
        }

        if (!database.objectStoreNames.contains("journalProjects")) {
          const store = database.createObjectStore("journalProjects", { keyPath: "id" });
          store.createIndex("byClientId", "clientId", { unique: false });
          store.createIndex("byName", "name", { unique: false });
          store.createIndex("byUpdatedAt", "updatedAt", { unique: false });
        }

        if (!database.objectStoreNames.contains("journalEntries")) {
          const store = database.createObjectStore("journalEntries", { keyPath: "id" });
          store.createIndex("byProjectId", "projectId", { unique: false });
          store.createIndex("byCreatedAt", "createdAt", { unique: false });
          store.createIndex("byUpdatedAt", "updatedAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("IndexedDB upgrade blocked"));
    });
  }

  async function ensureSeedData(database) {
    const transaction = database.transaction(["taskStatuses"], "readwrite");
    const store = transaction.objectStore("taskStatuses");
    const existingCount = await requestToPromise(store.count());

    if (existingCount === 0) {
      for (const status of BUILTIN_STATUSES) {
        store.put({ ...status, createdAt: nowIso(), updatedAt: nowIso() });
      }
    }

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Seed transaction aborted"));
    });
  }

  async function ensureSharedProjectCatalogMigration(database) {
    const transaction = database.transaction(["appSettings", "projects", "journalProjects", "journalEntries"], "readwrite");
    const settingsStore = transaction.objectStore("appSettings");
    const projectsStore = transaction.objectStore("projects");
    const journalProjectsStore = transaction.objectStore("journalProjects");
    const journalEntriesStore = transaction.objectStore("journalEntries");

    const migrationFlag = await requestToPromise(settingsStore.get(PROJECT_CATALOG_MIGRATION_KEY));
    if (migrationFlag && migrationFlag.value === true) {
      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error("Migration transaction aborted"));
      });
      return;
    }

    const [existingProjects, legacyJournalProjects, journalEntries] = await Promise.all([
      requestToPromise(projectsStore.getAll()),
      requestToPromise(journalProjectsStore.getAll()),
      requestToPromise(journalEntriesStore.getAll())
    ]);

    const normalizeName = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
    const projectsById = new Map(existingProjects.map((project) => [project.id, project]));
    const projectsByName = new Map(existingProjects.map((project) => [normalizeName(project.name), project]));
    const projectIdRemap = new Map();

    for (const legacyProject of legacyJournalProjects) {
      let targetProject = projectsById.get(legacyProject.id) || null;

      if (!targetProject) {
        const nameKey = normalizeName(legacyProject.name);
        const sameNameProject = nameKey ? projectsByName.get(nameKey) || null : null;
        if (sameNameProject && !sameNameProject.clientId) {
          targetProject = sameNameProject;
        }
      }

      if (targetProject) {
        const needsUpdate = targetProject.clientId !== legacyProject.clientId;
        if (needsUpdate) {
          targetProject = {
            ...targetProject,
            clientId: legacyProject.clientId || targetProject.clientId || null,
            updatedAt: nowIso()
          };
          projectsStore.put(targetProject);
          projectsById.set(targetProject.id, targetProject);
          projectsByName.set(normalizeName(targetProject.name), targetProject);
        }

        projectIdRemap.set(legacyProject.id, targetProject.id);
        continue;
      }

      const migratedProject = {
        id: legacyProject.id || createId(),
        name: legacyProject.name,
        description: "",
        color: "",
        clientId: legacyProject.clientId || null,
        isActive: true,
        archivedAt: null,
        createdAt: legacyProject.createdAt || nowIso(),
        updatedAt: nowIso()
      };

      projectsStore.put(migratedProject);
      projectsById.set(migratedProject.id, migratedProject);
      projectsByName.set(normalizeName(migratedProject.name), migratedProject);
      projectIdRemap.set(legacyProject.id, migratedProject.id);
    }

    for (const entry of journalEntries) {
      const remappedProjectId = entry.projectId ? (projectIdRemap.get(entry.projectId) || entry.projectId) : null;
      if (remappedProjectId !== entry.projectId) {
        journalEntriesStore.put({
          ...entry,
          projectId: remappedProjectId,
          updatedAt: nowIso()
        });
      }
    }

    settingsStore.put({
      key: PROJECT_CATALOG_MIGRATION_KEY,
      value: true
    });

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Migration transaction aborted"));
    });
  }

  async function getDatabase() {
    if (!dbPromise) {
      dbPromise = openDatabase().then(async (database) => {
        await ensureSeedData(database);
        await ensureSharedProjectCatalogMigration(database);
        return database;
      });
    }

    return dbPromise;
  }

  async function run(storeName, mode, callback) {
    const database = await getDatabase();
    const transaction = database.transaction([storeName], mode);
    const store = transaction.objectStore(storeName);
    const result = await callback(store);

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
    });

    return result;
  }

  return {
    init: getDatabase,
    createId,
    nowIso,
    getAll(storeName) {
      return run(storeName, "readonly", (store) => requestToPromise(store.getAll()));
    },
    getById(storeName, id) {
      return run(storeName, "readonly", (store) => requestToPromise(store.get(id)));
    },
    put(storeName, value) {
      return run(storeName, "readwrite", (store) => requestToPromise(store.put(value)));
    },
    delete(storeName, id) {
      return run(storeName, "readwrite", (store) => requestToPromise(store.delete(id)));
    },
    count(storeName) {
      return run(storeName, "readonly", (store) => requestToPromise(store.count()));
    },
    async getSummary() {
      const [projects, tasks, taskStatuses] = await Promise.all([
        WorkManagerDB.count("projects"),
        WorkManagerDB.count("tasks"),
        WorkManagerDB.count("taskStatuses")
      ]);

      return {
        projects,
        tasks,
        taskStatuses
      };
    },
    getBuiltinStatuses() {
      return BUILTIN_STATUSES.map((status) => ({ ...status }));
    },
    async getProjects() {
      const [projects, clients] = await Promise.all([this.getAll("projects"), this.getJournalClients()]);
      const clientMap = new Map(clients.map((client) => [client.id, client.name]));
      return projects.slice().sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1;
        }

        const leftClient = clientMap.get(left.clientId) || "";
        const rightClient = clientMap.get(right.clientId) || "";
        const clientCompare = leftClient.localeCompare(rightClient, "es");
        if (clientCompare !== 0) {
          return clientCompare;
        }

        return left.name.localeCompare(right.name, "es");
      });
    },
    async saveProject(project) {
      const existing = project.id ? await this.getById("projects", project.id) : null;
      const description = typeof project.description === "string" ? project.description.trim() : "";
      const color = typeof project.color === "string" ? project.color : "";
      const clientId = typeof project.clientId === "string" && project.clientId.trim() ? project.clientId.trim() : null;
      const record = {
        id: project.id || createId(),
        name: project.name.trim(),
        description,
        color,
        clientId,
        isActive: typeof project.isActive === "boolean" ? project.isActive : true,
        archivedAt: project.isActive === false ? project.archivedAt || nowIso() : project.archivedAt || null,
        createdAt: existing && existing.createdAt ? existing.createdAt : nowIso(),
        updatedAt: nowIso()
      };

      if (!record.name) {
        throw new Error("Project name is required");
      }

      await this.put("projects", record);
      return record;
    },
    async archiveProject(projectId) {
      const existing = await this.getById("projects", projectId);
      if (!existing) {
        throw new Error("Project not found");
      }

      return this.put("projects", {
        ...existing,
        isActive: false,
        archivedAt: existing.archivedAt || nowIso(),
        updatedAt: nowIso()
      });
    },
    async reactivateProject(projectId) {
      const existing = await this.getById("projects", projectId);
      if (!existing) {
        throw new Error("Project not found");
      }

      return this.put("projects", {
        ...existing,
        isActive: true,
        archivedAt: null,
        updatedAt: nowIso()
      });
    },
    async getTaskStatuses() {
      const statuses = await this.getAll("taskStatuses");
      return statuses.slice().sort((left, right) => left.order - right.order);
    },
    async saveTaskStatus(status) {
      const existing = status.id ? await this.getById("taskStatuses", status.id) : null;
      const label = typeof status.label === "string" ? status.label.trim() : "";
      if (!label) {
        throw new Error("Status label is required");
      }

      const allStatuses = await this.getTaskStatuses();
      const nextOrder = Number.isFinite(Number(status.order)) ? Number(status.order) : (allStatuses.length ? Math.max(...allStatuses.map((item) => item.order)) + 1 : 1);
      const record = {
        id: status.id || createId(),
        label,
        order: nextOrder,
        isActive: typeof status.isActive === "boolean" ? status.isActive : true,
        isBuiltIn: existing ? existing.isBuiltIn : false,
        mapsToComplete: typeof status.mapsToComplete === "boolean" ? status.mapsToComplete : existing ? existing.mapsToComplete : false,
        createdAt: existing && existing.createdAt ? existing.createdAt : nowIso(),
        updatedAt: nowIso()
      };

      if (record.mapsToComplete) {
        record.isActive = true;
      }

      if (existing && existing.isBuiltIn && existing.mapsToComplete) {
        record.mapsToComplete = true;
        record.isActive = true;
      }

      if (record.mapsToComplete) {
        const others = allStatuses.filter((item) => item.id !== record.id);
        for (const other of others) {
          if (other.mapsToComplete) {
            await this.put("taskStatuses", {
              ...other,
              mapsToComplete: false,
              updatedAt: nowIso()
            });
          }
        }
      }

      await this.put("taskStatuses", record);
      return record;
    },
    async deleteTaskStatus(statusId) {
      const existing = await this.getById("taskStatuses", statusId);
      if (!existing) {
        throw new Error("Status not found");
      }

      if (existing.mapsToComplete) {
        throw new Error("Completed status cannot be deleted");
      }

      const tasks = await this.getAll("tasks");
      const inUse = tasks.some((task) => task.statusId === statusId);
      if (inUse) {
        return this.put("taskStatuses", {
          ...existing,
          isActive: false,
          updatedAt: nowIso()
        });
      }

      return this.delete("taskStatuses", statusId);
    },
    async toggleTaskStatusActive(statusId, isActive) {
      const existing = await this.getById("taskStatuses", statusId);
      if (!existing) {
        throw new Error("Status not found");
      }

      if (existing.mapsToComplete) {
        throw new Error("Completed status cannot be deactivated");
      }

      return this.put("taskStatuses", {
        ...existing,
        isActive: Boolean(isActive),
        updatedAt: nowIso()
      });
    },
    async reorderTaskStatus(statusId, direction) {
      const statuses = await this.getTaskStatuses();
      const index = statuses.findIndex((status) => status.id === statusId);
      if (index === -1) {
        throw new Error("Status not found");
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= statuses.length) {
        return statuses[index];
      }

      const current = statuses[index];
      const target = statuses[targetIndex];
      const currentOrder = current.order;

      await this.put("taskStatuses", {
        ...current,
        order: target.order,
        updatedAt: nowIso()
      });
      await this.put("taskStatuses", {
        ...target,
        order: currentOrder,
        updatedAt: nowIso()
      });

      return this.getById("taskStatuses", statusId);
    },
    async getTasks() {
      const [tasks, statuses] = await Promise.all([this.getAll("tasks"), this.getTaskStatuses()]);
      const statusMap = new Map(statuses.map((status) => [status.id, status]));
      const priorityWeight = { high: 0, medium: 1, low: 2 };

      return tasks.slice().sort((left, right) => {
        const leftCompleted = statusMap.get(left.statusId)?.mapsToComplete === true;
        const rightCompleted = statusMap.get(right.statusId)?.mapsToComplete === true;

        if (leftCompleted !== rightCompleted) {
          return leftCompleted ? 1 : -1;
        }

        const leftDue = left.dueDate || "";
        const rightDue = right.dueDate || "";
        if (leftDue !== rightDue) {
          if (!leftDue) {
            return 1;
          }

          if (!rightDue) {
            return -1;
          }

          return leftDue.localeCompare(rightDue);
        }

        const leftPriority = priorityWeight[left.priority] ?? 1;
        const rightPriority = priorityWeight[right.priority] ?? 1;
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return (right.updatedAt || "").localeCompare(left.updatedAt || "");
      });
    },
    async saveTask(task) {
      const existing = task.id ? await this.getById("tasks", task.id) : null;
      const statuses = await this.getTaskStatuses();
      const completedStatus = statuses.find((status) => status.mapsToComplete) || statuses[statuses.length - 1];
      const pendingStatus = statuses.find((status) => status.id === "pending" && status.isActive) || statuses.find((status) => !status.mapsToComplete && status.isActive) || statuses[0];

      if (!pendingStatus) {
        throw new Error("No task statuses are available");
      }

      const title = typeof task.title === "string" ? task.title.trim() : "";
      if (!title) {
        throw new Error("Task title is required");
      }

      const description = typeof task.description === "string" ? task.description.trim() : "";
      const responsibleName = typeof task.responsibleName === "string" ? task.responsibleName.trim() : "";
      const projectId = task.projectId ? task.projectId : null;
      const priority = ["high", "medium", "low"].includes(task.priority) ? task.priority : "medium";
      const reminderMode = ["dueDate", "manual", "both"].includes(task.reminderMode) ? task.reminderMode : "dueDate";
      const statusId = task.statusId && statuses.some((status) => status.id === task.statusId) ? task.statusId : (existing && existing.statusId) || pendingStatus.id;
      const dueDate = typeof task.dueDate === "string" && task.dueDate.trim() ? task.dueDate.trim() : null;
      const reminderDate = typeof task.reminderDate === "string" && task.reminderDate.trim() ? task.reminderDate.trim() : null;
      const isStarred = task.isStarred === true || (task.isStarred !== false && existing ? existing.isStarred === true : false);
      const isCompleted = completedStatus ? statusId === completedStatus.id : false;
      const record = {
        id: task.id || createId(),
        title,
        description,
        projectId,
        responsibleName: responsibleName || null,
        priority,
        statusId,
        dueDate,
        reminderDate,
        reminderMode,
        isStarred,
        previousStatusId: existing ? existing.previousStatusId || null : null,
        completedAt: existing ? existing.completedAt || null : null,
        createdAt: existing && existing.createdAt ? existing.createdAt : nowIso(),
        updatedAt: nowIso()
      };

      if (isCompleted) {
        if (!record.previousStatusId && existing && existing.statusId && existing.statusId !== statusId) {
          record.previousStatusId = existing.statusId;
        }

        if (!record.completedAt) {
          record.completedAt = nowIso();
        }
      } else {
        record.completedAt = null;
        if (existing && existing.statusId && completedStatus && existing.statusId === completedStatus.id) {
          record.previousStatusId = null;
        }
      }

      await this.put("tasks", record);
      return record;
    },
    async toggleTaskStar(taskId, isStarred) {
      const existing = await this.getById("tasks", taskId);
      if (!existing) {
        throw new Error("Task not found");
      }

      const record = {
        ...existing,
        isStarred: isStarred === true,
        updatedAt: nowIso()
      };
      await this.put("tasks", record);
      return record;
    },
    async deleteTask(taskId) {
      return this.delete("tasks", taskId);
    },
    async completeTask(taskId) {
      const existing = await this.getById("tasks", taskId);
      if (!existing) {
        throw new Error("Task not found");
      }

      const statuses = await this.getTaskStatuses();
      const completedStatus = statuses.find((status) => status.mapsToComplete);
      if (!completedStatus) {
        throw new Error("Completed status not found");
      }

      return this.put("tasks", {
        ...existing,
        previousStatusId: existing.statusId,
        statusId: completedStatus.id,
        completedAt: existing.completedAt || nowIso(),
        updatedAt: nowIso()
      });
    },
    async reopenTask(taskId) {
      const existing = await this.getById("tasks", taskId);
      if (!existing) {
        throw new Error("Task not found");
      }

      const statuses = await this.getTaskStatuses();
      const pendingStatus = statuses.find((status) => status.id === "pending" && status.isActive) || statuses.find((status) => !status.mapsToComplete && status.isActive) || statuses[0];
      if (!pendingStatus) {
        throw new Error("No task status available to reopen the task");
      }

      return this.put("tasks", {
        ...existing,
        statusId: existing.previousStatusId || pendingStatus.id,
        previousStatusId: null,
        completedAt: null,
        updatedAt: nowIso()
      });
    },
    async getJournalClients() {
      const clients = await this.getAll("journalClients");
      return clients.slice().sort((left, right) => left.name.localeCompare(right.name, "es"));
    },
    async saveJournalClient(client) {
      const existing = client.id ? await this.getById("journalClients", client.id) : null;
      const name = typeof client.name === "string" ? client.name.trim() : "";
      if (!name) {
        throw new Error("Client name is required");
      }

      const record = {
        id: client.id || createId(),
        name,
        createdAt: existing && existing.createdAt ? existing.createdAt : nowIso(),
        updatedAt: nowIso()
      };

      await this.put("journalClients", record);
      return record;
    },
    async deleteJournalClient(clientId) {
      const projects = await this.getAll("projects");
      const inUse = projects.some((project) => project.clientId === clientId);
      if (inUse) {
        throw new Error("Client has projects assigned");
      }

      return this.delete("journalClients", clientId);
    },
    async getJournalProjects() {
      const [projects, clients] = await Promise.all([this.getAll("projects"), this.getJournalClients()]);
      const clientMap = new Map(clients.map((client) => [client.id, client]));
      return projects.slice().sort((left, right) => {
        const leftClient = clientMap.get(left.clientId)?.name || "";
        const rightClient = clientMap.get(right.clientId)?.name || "";
        const clientCompare = leftClient.localeCompare(rightClient, "es");
        if (clientCompare !== 0) {
          return clientCompare;
        }

        return left.name.localeCompare(right.name, "es");
      });
    },
    async saveJournalProject(project) {
      const name = typeof project.name === "string" ? project.name.trim() : "";
      const clientId = typeof project.clientId === "string" && project.clientId.trim() ? project.clientId.trim() : null;
      if (!name) {
        throw new Error("Diary project name is required");
      }

      if (!clientId) {
        throw new Error("Diary project client is required");
      }

      return this.saveProject({
        id: project.id || undefined,
        name,
        clientId,
        description: typeof project.description === "string" ? project.description : "",
        color: typeof project.color === "string" ? project.color : "",
        isActive: typeof project.isActive === "boolean" ? project.isActive : true,
        archivedAt: project.archivedAt || null
      });
    },
    async deleteJournalProject(projectId) {
      const entries = await this.getAll("journalEntries");
      const inUse = entries.some((entry) => entry.projectId === projectId);
      if (inUse) {
        throw new Error("Diary project has entries assigned");
      }

      return this.delete("projects", projectId);
    },
    async getJournalEntries() {
      const entries = await this.getAll("journalEntries");
      return entries.slice().sort((left, right) => (right.createdAt || "").localeCompare(left.createdAt || ""));
    },
    async saveJournalEntry(entry) {
      const existing = entry.id ? await this.getById("journalEntries", entry.id) : null;
      const projectId = typeof entry.projectId === "string" && entry.projectId.trim() ? entry.projectId.trim() : null;
      const title = typeof entry.title === "string" ? entry.title.trim() : "";
      const content = typeof entry.content === "string" ? entry.content.trim() : "";
      if (!content) {
        throw new Error("Journal entry content is required");
      }

      const record = {
        id: entry.id || createId(),
        projectId,
        title: title || null,
        content,
        createdAt: existing && existing.createdAt ? existing.createdAt : nowIso(),
        updatedAt: nowIso()
      };

      await this.put("journalEntries", record);
      return record;
    },
    async deleteJournalEntry(entryId) {
      return this.delete("journalEntries", entryId);
    }
  };
})();

window.WorkManagerDB = WorkManagerDB;
