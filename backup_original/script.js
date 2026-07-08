// ========== FIREBASE CONFIGURATION ==========
let db, storage, auth;
let currentUser = null;
let isFirebaseConnected = false;

// ========== GLOBAL STATE ==========
let charts = {
  gradesChart: null,
  studyChart: null,
  gradesFullChart: null,
  studyHistoryChart: null,
};
let studyTimerInterval = null;
let studySecondsRemaining = 25 * 60;
let isStudyRunning = false;

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", () => {
  initializeFirebase();
  initNavigation();
  loadFromLocalStorage();
  setupEventListeners();
  setupTheme();
  initQuickTimer();
  initStudyTimer();
  checkAuthStatus();
});

function initializeFirebase() {
  // Check if Firebase config is set in localStorage
  const savedConfig = localStorage.getItem("firebaseConfig");
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      // Validate config has required fields
      if (config.apiKey && config.projectId) {
        initializeFirebaseApp(config);
      } else {
        console.warn("Invalid Firebase config - missing apiKey or projectId");
        isFirebaseConnected = false;
      }
    } catch (e) {
      console.error("Invalid saved config", e);
      isFirebaseConnected = false;
    }
  } else {
    console.log("Running in local-only mode (Firebase not configured)");
    isFirebaseConnected = false;
  }
}

function initializeFirebaseApp(config) {
  try {
    // Check if Firebase is already initialized
    if (typeof firebase !== "undefined" && !firebase.apps.length) {
      firebase.initializeApp(config);
      db = firebase.firestore();
      storage = firebase.storage();
      auth = firebase.auth();
      isFirebaseConnected = true;

      const statusEl = document.getElementById("firebaseStatus");
      if (statusEl) {
        statusEl.innerHTML =
          '<span style="color:#00b894">✓ Connected to Firebase</span>';
      }

      // Listen to auth state
      auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
          const userNameEl = document.getElementById("userName");
          const userEmailEl = document.getElementById("userEmail");
          const welcomeNameEl = document.getElementById("welcomeName");

          if (userNameEl)
            userNameEl.textContent =
              user.displayName || user.email.split("@")[0];
          if (userEmailEl) userEmailEl.textContent = user.email;
          if (welcomeNameEl)
            welcomeNameEl.textContent =
              user.displayName || user.email.split("@")[0];

          await loadUserDataFromFirestore();
          showToast(`Welcome back, ${user.displayName || user.email}!`);
        } else {
          // Only show auth modal if user explicitly wants to use Firebase
          const hasFirebaseConfig = localStorage.getItem("firebaseConfig");
          if (hasFirebaseConfig) {
            showAuthModal();
          }
        }
      });
    } else if (typeof firebase === "undefined") {
      console.warn("Firebase SDK not loaded");
      isFirebaseConnected = false;
    }
  } catch (e) {
    console.error("Firebase init error:", e);
    const statusEl = document.getElementById("firebaseStatus");
    if (statusEl) {
      statusEl.innerHTML =
        '<span style="color:#ff4757">✗ Not connected. Enter valid credentials.</span>';
    }
    isFirebaseConnected = false;
  }
}

// ========== LOCAL STORAGE FALLBACK ==========
function loadFromLocalStorage() {
  if (!localStorage.getItem("courses")) {
    localStorage.setItem(
      "courses",
      JSON.stringify([
        {
          id: "1",
          name: "Web Development",
          code: "CSCD 301",
          creditHours: 3,
          instructor: "Dr. Mensah",
          semester: "Fall 2024",
          grade: 85,
        },
        {
          id: "2",
          name: "Database Systems",
          code: "CSCD 302",
          creditHours: 3,
          instructor: "Prof. Asare",
          semester: "Fall 2024",
          grade: 78,
        },
        {
          id: "3",
          name: "Network Security",
          code: "CSCD 303",
          creditHours: 3,
          instructor: "Dr. Owusu",
          semester: "Fall 2024",
          grade: 72,
        },
      ]),
    );
  }
  if (!localStorage.getItem("tasks"))
    localStorage.setItem("tasks", JSON.stringify([]));
  if (!localStorage.getItem("studySessions"))
    localStorage.setItem("studySessions", JSON.stringify([]));
  if (!localStorage.getItem("vaultItems"))
    localStorage.setItem("vaultItems", JSON.stringify([]));

  loadCourses();
  loadTasks();
  loadVaultItems();
  updateDashboardStats();
  updateAllCharts();
}

// ========== FIRESTORE SYNC ==========
async function loadUserDataFromFirestore() {
  if (!currentUser || !db) return;

  showToast("Syncing data from cloud...");

  try {
    // Load courses
    const coursesSnapshot = await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("courses")
      .get();
    const cloudCourses = coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    if (cloudCourses.length > 0) {
      localStorage.setItem("courses", JSON.stringify(cloudCourses));
      loadCourses();
    }

    // Load tasks
    const tasksSnapshot = await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("tasks")
      .get();
    const cloudTasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    if (cloudTasks.length > 0) {
      localStorage.setItem("tasks", JSON.stringify(cloudTasks));
      loadTasks();
    }

    // Load study sessions
    const sessionsSnapshot = await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("studySessions")
      .get();
    const cloudSessions = sessionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    if (cloudSessions.length > 0) {
      localStorage.setItem("studySessions", JSON.stringify(cloudSessions));
      renderStudyHistoryChart();
    }

    // Load vault items
    const vaultSnapshot = await db
      .collection("users")
      .doc(currentUser.uid)
      .collection("vault")
      .get();
    const cloudVault = vaultSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    if (cloudVault.length > 0) {
      localStorage.setItem("vaultItems", JSON.stringify(cloudVault));
      loadVaultItems();
    }

    updateDashboardStats();
    updateAllCharts();
    showToast("Cloud sync complete!");
  } catch (error) {
    console.error("Sync error:", error);
    showToast("Sync failed: " + error.message, "error");
  }
}

async function syncToCloud() {
  if (!currentUser || !db) {
    showToast("Please connect to Firebase first", "error");
    return;
  }

  showToast("Uploading to cloud...");

  try {
    const userId = currentUser.uid;
    const userRef = db.collection("users").doc(userId);

    // Sync courses
    const courses = JSON.parse(localStorage.getItem("courses") || "[]");
    for (const course of courses) {
      await userRef.collection("courses").doc(course.id).set(course);
    }

    // Sync tasks
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    for (const task of tasks) {
      await userRef.collection("tasks").doc(task.id).set(task);
    }

    // Sync study sessions
    const sessions = JSON.parse(localStorage.getItem("studySessions") || "[]");
    for (const session of sessions) {
      await userRef.collection("studySessions").doc(session.id).set(session);
    }

    // Sync vault items
    const vault = JSON.parse(localStorage.getItem("vaultItems") || "[]");
    for (const item of vault) {
      await userRef.collection("vault").doc(item.id).set(item);
    }

    showToast("All data synced to cloud! ✓");
  } catch (error) {
    console.error("Sync error:", error);
    showToast("Sync failed: " + error.message, "error");
  }
}

// ========== VAULT (Notes & Exam Questions) ==========
function getVaultItems() {
  return JSON.parse(localStorage.getItem("vaultItems")) || [];
}

function saveVaultItems(items) {
  localStorage.setItem("vaultItems", JSON.stringify(items));
  loadVaultItems();
  updateVaultStats();
}

async function uploadVaultFile(file, metadata) {
  if (!currentUser) {
    showToast("Please sign in to upload files", "error");
    return;
  }

  if (!storage) {
    showToast(
      "Firebase storage not configured. Please connect Firebase first.",
      "error",
    );
    return;
  }

  const fileId = Date.now().toString();
  const storageRef = storage
    .ref()
    .child(`users/${currentUser.uid}/vault/${fileId}_${file.name}`);

  showToast("Uploading...");

  try {
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();

    const vaultItem = {
      id: fileId,
      name: metadata.title || file.name,
      originalName: file.name,
      type: metadata.type || "other",
      course: metadata.course || "",
      tags: metadata.tags || [],
      description: metadata.description || "",
      url: downloadURL,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
    };

    const items = getVaultItems();
    items.push(vaultItem);
    saveVaultItems(items);

    // Sync to Firestore if connected
    if (db && currentUser) {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("vault")
        .doc(fileId)
        .set(vaultItem);
    }

    showToast("File uploaded successfully!");
  } catch (e) {
    console.error("Upload error:", e);
    showToast("Upload failed: " + e.message, "error");
  }
}

function loadVaultItems() {
  const items = getVaultItems();
  const container = document.getElementById("vaultGrid");
  const courseFilter =
    document.getElementById("vaultCourseFilter")?.value || "all";
  const typeFilter = document.getElementById("vaultTypeFilter")?.value || "all";
  const searchTerm =
    document.getElementById("vaultSearch")?.value.toLowerCase() || "";

  if (!container) return;

  let filtered = items.filter((item) => {
    if (courseFilter !== "all" && item.course !== courseFilter) return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (
      searchTerm &&
      !item.name.toLowerCase().includes(searchTerm) &&
      !(item.tags || []).join(",").toLowerCase().includes(searchTerm)
    )
      return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-courses"><i class="fas fa-folder-open"></i><p>No documents yet. Upload your first note or exam question!</p></div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (item) => `
    <div class="vault-card" onclick="openVaultItem('${item.id}')">
      <div class="vault-card-icon">
        <i class="${getFileIcon(item.fileType)}"></i>
      </div>
      <div class="vault-card-info">
        <h4>${escapeHtml(item.name.length > 30 ? item.name.substring(0, 30) + "..." : item.name)}</h4>
        <p><i class="fas fa-tag"></i> ${item.type} ${item.course ? `· ${escapeHtml(item.course)}` : ""}</p>
        <p class="vault-date">${new Date(item.uploadedAt).toLocaleDateString()}</p>
      </div>
      <div class="vault-card-badge ${item.type}">${item.type}</div>
    </div>
  `,
    )
    .join("");
}

function getFileIcon(fileType) {
  if (fileType && fileType.includes("image")) return "fas fa-image";
  if (fileType && fileType.includes("pdf")) return "fas fa-file-pdf";
  return "fas fa-file-alt";
}

function openVaultItem(itemId) {
  const item = getVaultItems().find((i) => i.id === itemId);
  if (!item) return;

  document.getElementById("vaultItemTitle").textContent = item.name;
  document.getElementById("vaultDocTitle").value = item.name;
  document.getElementById("vaultDocType").value = item.type;
  document.getElementById("vaultDocTags").value = (item.tags || []).join(", ");
  document.getElementById("vaultDocDesc").value = item.description || "";

  const previewContainer = document.getElementById("vaultPreview");
  if (previewContainer) {
    previewContainer.innerHTML = `<a href="${item.url}" target="_blank"><img src="${item.url}" alt="${item.name}" style="max-width:100%; max-height:300px; border-radius:8px" onerror="this.src='https://via.placeholder.com/300?text=Preview+Not+Available'"></a>`;
  }

  // Populate course dropdown
  const courseSelect = document.getElementById("vaultDocCourse");
  if (courseSelect) {
    const courses = getCourses();
    courseSelect.innerHTML =
      '<option value="">General</option>' +
      courses
        .map(
          (c) =>
            `<option value="${escapeHtml(c.name)}" ${item.course === c.name ? "selected" : ""}>${escapeHtml(c.name)}</option>`,
        )
        .join("");
  }

  const modal = document.getElementById("vaultItemModal");
  if (modal) {
    modal.dataset.itemId = itemId;
    modal.style.display = "flex";
  }
}

async function deleteVaultItem() {
  const modal = document.getElementById("vaultItemModal");
  const itemId = modal ? modal.dataset.itemId : null;
  const item = getVaultItems().find((i) => i.id === itemId);

  if (item && confirm(`Delete "${item.name}"?`)) {
    // Delete from storage
    if (storage && currentUser && item.url) {
      try {
        const storageRef = storage.refFromURL(item.url);
        await storageRef.delete();
      } catch (e) {
        console.log("Storage delete error:", e);
      }
    }

    // Delete from local
    const items = getVaultItems().filter((i) => i.id !== itemId);
    saveVaultItems(items);

    // Delete from Firestore
    if (db && currentUser) {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("vault")
        .doc(itemId)
        .delete();
    }

    closeVaultModal();
    showToast("Document deleted");
  }
}

function updateVaultStats() {
  const items = getVaultItems();
  const totalNotesEl = document.getElementById("totalNotes");
  const totalStorageEl = document.getElementById("totalStorage");

  if (totalNotesEl) totalNotesEl.textContent = items.length;
  if (totalStorageEl) {
    const totalSize = items.reduce((sum, i) => sum + (i.fileSize || 0), 0);
    totalStorageEl.textContent = (totalSize / (1024 * 1024)).toFixed(2);
  }
}

// ========== NAVIGATION ==========
function initNavigation() {
  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) navigateTo(page);
    });
  });
}

function navigateTo(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active-page"));
  const targetPage = document.getElementById(page + "Page");
  if (targetPage) targetPage.classList.add("active-page");

  document.querySelectorAll(".nav-menu li").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === page);
  });

  if (page === "dashboard") updateDashboardStats();
  if (page === "courses") loadCourses();
  if (page === "grades") {
    loadGradesData();
    updateAllCharts();
  }
  if (page === "study") {
    loadStudyData();
    renderStudyHistoryChart();
  }
  if (page === "vault") {
    loadVaultItems();
    updateVaultStats();
    populateVaultFilters();
  }
  if (page === "goals") loadTasks();
  updateAllCharts();
}

// ========== COURSE FUNCTIONS ==========
function getCourses() {
  return JSON.parse(localStorage.getItem("courses")) || [];
}

function saveCourses(courses) {
  localStorage.setItem("courses", JSON.stringify(courses));
  loadCourses();
  updateDashboardStats();
  updateAllCharts();
  displayRecentCourses();
  syncToCloudIfNeeded();
}

function loadCourses() {
  const courses = getCourses();
  displayCourses(courses);
  updateCourseStats(courses);
}

function displayCourses(courses) {
  const container = document.getElementById("coursesList");
  if (!container) return;

  const searchTerm =
    document.getElementById("courseSearchInput")?.value.toLowerCase() || "";
  const filterValue = document.getElementById("courseFilter")?.value || "all";

  let filtered = courses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm) ||
      (c.code || "").toLowerCase().includes(searchTerm);
    const grade = c.grade || 0;
    if (filterValue === "high") return matchesSearch && grade >= 70;
    if (filterValue === "medium")
      return matchesSearch && grade >= 50 && grade < 70;
    if (filterValue === "low") return matchesSearch && grade < 50;
    return matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-courses"><i class="fas fa-book-open"></i><p>No courses found.</p><button class="btn-add" onclick="document.getElementById('openCourseModal').click()">Add Course</button></div>`;
    return;
  }

  container.innerHTML = filtered
    .map((course) => {
      const letter = getLetterGrade(course.grade || 0);
      return `<div class="course-item"><div class="course-info"><h4>${escapeHtml(course.name)}</h4><p>${course.code || "No Code"} · ${course.instructor || "TBA"}</p></div><div class="course-grade"><div class="grade-badge ${letter}">${letter}</div><div class="progress-bar"><div class="progress" style="width: ${course.grade || 0}%;"></div></div></div><div class="course-actions"><button class="btn-icon edit" onclick="editCourse('${course.id}')"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteCourse('${course.id}')"><i class="fas fa-trash"></i></button></div></div>`;
    })
    .join("");
}

function displayRecentCourses() {
  const container = document.getElementById("recentCoursesList");
  if (!container) return;
  const courses = getCourses().slice(0, 3);
  if (courses.length === 0) {
    container.innerHTML = '<div class="empty-message">No courses yet.</div>';
    return;
  }
  container.innerHTML = courses
    .map(
      (c) =>
        `<div class="course-item compact"><div class="course-info"><h4>${escapeHtml(c.name)}</h4><p>${c.code || ""}</p></div><div class="course-grade"><div class="grade-badge small ${getLetterGrade(c.grade || 0)}">${getLetterGrade(c.grade || 0)}</div></div></div>`,
    )
    .join("");
}

async function addCourse(data) {
  const courses = getCourses();
  const newCourse = {
    id: Date.now().toString(),
    ...data,
    grade: data.grade || 0,
  };
  courses.push(newCourse);
  saveCourses(courses);

  if (db && currentUser) {
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("courses")
        .doc(newCourse.id)
        .set(newCourse);
    } catch (e) {
      console.error("Firestore save error:", e);
    }
  }

  closeModal();
  showToast("Course added!");
}

async function updateCourse(id, data) {
  const courses = getCourses();
  const idx = courses.findIndex((c) => c.id === id);
  if (idx !== -1) {
    courses[idx] = { ...courses[idx], ...data };
    saveCourses(courses);

    if (db && currentUser) {
      try {
        await db
          .collection("users")
          .doc(currentUser.uid)
          .collection("courses")
          .doc(id)
          .update(data);
      } catch (e) {
        console.error("Firestore update error:", e);
      }
    }

    closeModal();
    showToast("Course updated!");
  }
}

function deleteCourse(id) {
  const course = getCourses().find((c) => c.id === id);
  if (course) {
    const deleteNameEl = document.getElementById("deleteCourseName");
    if (deleteNameEl) deleteNameEl.textContent = course.name;
    const deleteModal = document.getElementById("deleteModal");
    if (deleteModal) {
      deleteModal.dataset.courseId = id;
      deleteModal.style.display = "flex";
    }
  }
}

async function confirmDelete() {
  const deleteModal = document.getElementById("deleteModal");
  const id = deleteModal ? deleteModal.dataset.courseId : null;
  if (id) {
    const courses = getCourses().filter((c) => c.id !== id);
    saveCourses(courses);

    if (db && currentUser) {
      try {
        await db
          .collection("users")
          .doc(currentUser.uid)
          .collection("courses")
          .doc(id)
          .delete();
      } catch (e) {
        console.error("Firestore delete error:", e);
      }
    }

    closeDeleteModal();
    showToast("Course deleted!");
  }
}

function editCourse(id) {
  const course = getCourses().find((c) => c.id === id);
  if (course) {
    const courseIdEl = document.getElementById("courseId");
    const courseNameEl = document.getElementById("courseName");
    const courseCodeEl = document.getElementById("courseCode");
    const creditHoursEl = document.getElementById("creditHours");
    const instructorEl = document.getElementById("instructor");
    const semesterEl = document.getElementById("semester");
    const currentGradeEl = document.getElementById("currentGrade");
    const modalTitleEl = document.getElementById("modalTitle");
    const courseModal = document.getElementById("courseModal");

    if (courseIdEl) courseIdEl.value = course.id;
    if (courseNameEl) courseNameEl.value = course.name;
    if (courseCodeEl) courseCodeEl.value = course.code;
    if (creditHoursEl) creditHoursEl.value = course.creditHours;
    if (instructorEl) instructorEl.value = course.instructor || "";
    if (semesterEl) semesterEl.value = course.semester;
    if (currentGradeEl) currentGradeEl.value = course.grade || 0;

    updateGradePreview(course.grade || 0);
    if (modalTitleEl) modalTitleEl.textContent = "Edit Course";
    if (courseModal) courseModal.style.display = "flex";
  }
}

// ========== TASKS ==========
function getTasks() {
  return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  loadTasks();
  updateDashboardStats();
  displayRecentTasks();
  syncToCloudIfNeeded();
}

function loadTasks() {
  const tasks = getTasks();
  const container = document.getElementById("allTasksList");
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML =
      '<div class="empty-message"><i class="fas fa-tasks"></i><p>No tasks yet. Click "Add Task" to get started!</p></div>';
    return;
  }

  container.innerHTML = tasks
    .map(
      (task) =>
        `<div class="task-item"><input type="checkbox" onchange="toggleTask('${task.id}')" ${task.completed ? "checked" : ""}><label><span class="task-title" style="${task.completed ? "text-decoration:line-through;color:#999" : ""}">${escapeHtml(task.title)}</span><span class="task-date">${task.dueDate || "No due date"} · ${task.course || "No course"}</span></label><span class="task-priority ${task.priority}">${task.priority}</span><button class="btn-icon delete" onclick="deleteTask('${task.id}')" style="background:transparent"><i class="fas fa-trash"></i></button></div>`,
    )
    .join("");
}

async function addTask(data) {
  const tasks = getTasks();
  const newTask = { id: Date.now().toString(), completed: false, ...data };
  tasks.push(newTask);
  saveTasks(tasks);

  if (db && currentUser) {
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("tasks")
        .doc(newTask.id)
        .set(newTask);
    } catch (e) {
      console.error("Firestore save error:", e);
    }
  }

  closeTaskModal();
  showToast("Task added!");
}

async function deleteTask(id) {
  const tasks = getTasks().filter((t) => t.id !== id);
  saveTasks(tasks);

  if (db && currentUser) {
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("tasks")
        .doc(id)
        .delete();
    } catch (e) {
      console.error("Firestore delete error:", e);
    }
  }

  showToast("Task deleted!");
}

async function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks(tasks);

    if (db && currentUser) {
      try {
        await db
          .collection("users")
          .doc(currentUser.uid)
          .collection("tasks")
          .doc(id)
          .update({ completed: task.completed });
      } catch (e) {
        console.error("Firestore update error:", e);
      }
    }
  }
}

function displayRecentTasks() {
  const container = document.getElementById("recentTasksList");
  if (!container) return;
  const tasks = getTasks()
    .filter((t) => !t.completed)
    .slice(0, 3);
  if (tasks.length === 0) {
    container.innerHTML =
      '<div class="empty-message">No pending tasks. Great job!</div>';
    return;
  }
  container.innerHTML = tasks
    .map(
      (t) =>
        `<div class="task-item"><input type="checkbox" onchange="toggleTask('${t.id}')"><label><span class="task-title">${escapeHtml(t.title)}</span><span class="task-date">${t.dueDate || "No date"}</span></label><span class="task-priority ${t.priority}">${t.priority}</span></div>`,
    )
    .join("");
}

// ========== STUDY SESSIONS ==========
function getStudySessions() {
  return JSON.parse(localStorage.getItem("studySessions")) || [];
}

function saveStudySessions(sessions) {
  localStorage.setItem("studySessions", JSON.stringify(sessions));
  updateDashboardStats();
  renderStudyHistoryChart();
  syncToCloudIfNeeded();
}

function loadStudySessions() {
  renderStudyHistoryChart();
}

async function logStudySession(courseId, minutes) {
  const sessions = getStudySessions();
  const course = getCourses().find((c) => c.id === courseId);
  const newSession = {
    id: Date.now().toString(),
    courseId,
    courseName: course ? course.name : "Unknown",
    minutes,
    date: new Date().toISOString(),
  };
  sessions.push(newSession);
  saveStudySessions(sessions);

  if (db && currentUser) {
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .collection("studySessions")
        .doc(newSession.id)
        .set(newSession);
    } catch (e) {
      console.error("Firestore save error:", e);
    }
  }

  showToast(
    `Logged ${minutes} minutes of study for ${course?.name || "course"}!`,
  );
}

function getTotalStudyHours() {
  return (
    getStudySessions().reduce((sum, s) => sum + s.minutes, 0) / 60
  ).toFixed(1);
}

function getTasksCompleted() {
  return getTasks().filter((t) => t.completed).length;
}

function getTotalTasks() {
  return getTasks().length;
}

// ========== GPA CALCULATION ==========
function calculateGPA() {
  const courses = getCourses();
  if (courses.length === 0) return 0;
  let totalPoints = 0,
    totalCredits = 0;
  courses.forEach((c) => {
    const grade = c.grade || 0;
    let gradePoint = 0;
    if (grade >= 90) gradePoint = 4.0;
    else if (grade >= 85) gradePoint = 3.7;
    else if (grade >= 80) gradePoint = 3.3;
    else if (grade >= 75) gradePoint = 3.0;
    else if (grade >= 70) gradePoint = 2.7;
    else if (grade >= 65) gradePoint = 2.3;
    else if (grade >= 60) gradePoint = 2.0;
    else if (grade >= 55) gradePoint = 1.7;
    else if (grade >= 50) gradePoint = 1.0;
    else gradePoint = 0;
    totalPoints += gradePoint * (c.creditHours || 3);
    totalCredits += c.creditHours || 3;
  });
  return (totalPoints / totalCredits).toFixed(2);
}

// ========== DASHBOARD ==========
function updateDashboardStats() {
  const totalCoursesEl = document.getElementById("totalCourses");
  const currentGPAEl = document.getElementById("currentGPA");
  const assignmentsDoneEl = document.getElementById("assignmentsDone");
  const studyHoursEl = document.getElementById("studyHours");

  if (totalCoursesEl) totalCoursesEl.textContent = getCourses().length;
  if (currentGPAEl) currentGPAEl.textContent = calculateGPA();
  if (assignmentsDoneEl)
    assignmentsDoneEl.textContent = `${getTasksCompleted()}/${getTotalTasks()}`;
  if (studyHoursEl) studyHoursEl.textContent = getTotalStudyHours() + "h";
}

function getLetterGrade(percentage) {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C+";
  if (percentage >= 50) return "C";
  if (percentage >= 45) return "D";
  return "F";
}

function loadGradesData() {
  const courses = getCourses();
  const tbody = document.getElementById("gradeTableBody");
  if (!tbody) return;

  if (courses.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="empty-message">No courses yet.</td></tr>';
    return;
  }

  tbody.innerHTML = courses
    .map((c) => {
      const grade = c.grade || 0;
      const letter = getLetterGrade(grade);
      const status =
        grade >= 70 ? "Good" : grade >= 50 ? "Average" : "Needs Improvement";
      return `<tr><td>${escapeHtml(c.name)}</td><td>${grade}%</td><td><span class="grade-badge small ${letter}">${letter}</span></td><td><span class="status-badge ${status.toLowerCase().replace(" ", "-")}">${status}</span></td></tr>`;
    })
    .join("");
}

function updateCourseStats(courses) {
  const container = document.getElementById("courseStats");
  if (!container) return;

  const total = courses.length;
  const avg = total
    ? (courses.reduce((s, c) => s + (c.grade || 0), 0) / total).toFixed(1)
    : 0;
  const hours = courses.reduce((s, c) => s + (c.creditHours || 3), 0);
  const high = courses.filter((c) => (c.grade || 0) >= 70).length;
  const medium = courses.filter(
    (c) => (c.grade || 0) >= 50 && (c.grade || 0) < 70,
  ).length;
  const low = courses.filter((c) => (c.grade || 0) < 50).length;

  container.innerHTML = `<div class="stat-item"><div class="stat-label">Total Courses</div><div class="stat-value">${total}</div></div><div class="stat-item"><div class="stat-label">Avg. Grade</div><div class="stat-value ${avg >= 70 ? "high" : avg >= 50 ? "medium" : "low"}">${avg}%</div></div><div class="stat-item"><div class="stat-label">Credit Hours</div><div class="stat-value">${hours}</div></div><div class="stat-item"><div class="stat-label">Grade Distribution</div><div class="stat-value"><span class="high">${high}</span> / <span class="medium">${medium}</span> / <span class="low">${low}</span></div></div>`;
}

// ========== CHARTS ==========
function destroyChart(chartName) {
  if (charts[chartName]) {
    charts[chartName].destroy();
    charts[chartName] = null;
  }
}

function updateAllCharts() {
  const courses = getCourses();

  destroyChart("gradesChart");
  const ctx = document.getElementById("gradesChart")?.getContext("2d");
  if (ctx && courses.length) {
    charts.gradesChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: courses.map((c) => c.name.substring(0, 10)),
        datasets: [
          {
            label: "Grade (%)",
            data: courses.map((c) => c.grade || 0),
            backgroundColor: "rgba(67, 97, 238, 0.7)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });
  }

  destroyChart("gradesFullChart");
  const ctxFull = document.getElementById("gradesFullChart")?.getContext("2d");
  if (ctxFull && courses.length) {
    charts.gradesFullChart = new Chart(ctxFull, {
      type: "doughnut",
      data: {
        labels: courses.map((c) => c.name),
        datasets: [
          {
            data: courses.map((c) => c.grade || 0),
            backgroundColor: [
              "#4361ee",
              "#3f37c9",
              "#4cc9f0",
              "#f72585",
              "#fdcb6e",
            ],
          },
        ],
      },
    });
  }
}

function renderStudyHistoryChart() {
  const sessions = getStudySessions();
  const last7Days = [...Array(7)]
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    })
    .reverse();
  const hoursPerDay = last7Days.map(
    (day) =>
      sessions
        .filter((s) => s.date && s.date.split("T")[0] === day)
        .reduce((sum, s) => sum + s.minutes, 0) / 60,
  );

  destroyChart("studyHistoryChart");
  const ctx = document.getElementById("studyHistoryChart")?.getContext("2d");
  if (ctx) {
    charts.studyHistoryChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: last7Days.map((d) => d.slice(5)),
        datasets: [
          {
            label: "Study Hours",
            data: hoursPerDay,
            borderColor: "#4361ee",
            backgroundColor: "rgba(67, 97, 238, 0.1)",
            fill: true,
          },
        ],
      },
    });
  }

  const totalLoggedHoursEl = document.getElementById("totalLoggedHours");
  if (totalLoggedHoursEl) {
    totalLoggedHoursEl.textContent = (
      sessions.reduce((sum, sess) => sum + sess.minutes, 0) / 60
    ).toFixed(1);
  }
}

function loadStudyData() {
  const select = document.getElementById("studyCourseSelect");
  if (select) {
    select.innerHTML =
      '<option value="">Select Course</option>' +
      getCourses()
        .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
        .join("");
  }
  renderStudyHistoryChart();
}

function populateVaultFilters() {
  const courseSelect = document.getElementById("vaultCourseFilter");
  if (courseSelect) {
    courseSelect.innerHTML =
      '<option value="all">All Courses</option>' +
      getCourses()
        .map(
          (c) =>
            `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`,
        )
        .join("");
  }
}

// ========== TIMERS ==========
function initStudyTimer() {
  const minutesSpan = document.getElementById("studyMinutes");
  const secondsSpan = document.getElementById("studySeconds");

  function updateDisplay() {
    if (minutesSpan) {
      minutesSpan.textContent = Math.floor(studySecondsRemaining / 60)
        .toString()
        .padStart(2, "0");
    }
    if (secondsSpan) {
      secondsSpan.textContent = (studySecondsRemaining % 60)
        .toString()
        .padStart(2, "0");
    }
  }

  const startBtn = document.getElementById("studyStart");
  const pauseBtn = document.getElementById("studyPause");
  const resetBtn = document.getElementById("studyReset");
  const logBtn = document.getElementById("logStudyBtn");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (isStudyRunning) return;
      isStudyRunning = true;
      studyTimerInterval = setInterval(() => {
        if (studySecondsRemaining <= 0) {
          clearInterval(studyTimerInterval);
          isStudyRunning = false;
          showToast("Study session complete! 🎉");
        } else {
          studySecondsRemaining--;
          updateDisplay();
        }
      }, 1000);
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      clearInterval(studyTimerInterval);
      isStudyRunning = false;
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearInterval(studyTimerInterval);
      isStudyRunning = false;
      studySecondsRemaining = 25 * 60;
      updateDisplay();
    });
  }

  if (logBtn) {
    logBtn.addEventListener("click", () => {
      const courseSelect = document.getElementById("studyCourseSelect");
      const courseId = courseSelect ? courseSelect.value : null;
      if (!courseId) {
        showToast("Select a course first!", "error");
        return;
      }
      const minutesElapsed = 25 - Math.ceil(studySecondsRemaining / 60);
      const minutesLogged = minutesElapsed > 0 ? minutesElapsed : 25;
      if (minutesLogged > 0) logStudySession(courseId, minutesLogged);
      else showToast("Study at least 1 minute to log", "error");
    });
  }

  updateDisplay();
}

function initQuickTimer() {
  let minutes = 25;
  let seconds = 0;
  let timerInterval = null;
  let isRunning = false;

  const minutesDisplay = document.getElementById("minutes");
  const secondsDisplay = document.getElementById("seconds");
  const startBtn = document.getElementById("startTimer");
  const pauseBtn = document.getElementById("pauseTimer");
  const resetBtn = document.getElementById("resetTimer");

  function updateDisplay() {
    if (minutesDisplay)
      minutesDisplay.textContent = minutes.toString().padStart(2, "0");
    if (secondsDisplay)
      secondsDisplay.textContent = seconds.toString().padStart(2, "0");
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (isRunning) return;
      isRunning = true;
      timerInterval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(timerInterval);
            isRunning = false;
            showToast("Study session completed! Great job! 🎉");
            return;
          }
          minutes--;
          seconds = 59;
        } else {
          seconds--;
        }
        updateDisplay();
      }, 1000);
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      clearInterval(timerInterval);
      isRunning = false;
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      clearInterval(timerInterval);
      isRunning = false;
      minutes = 25;
      seconds = 0;
      updateDisplay();
    });
  }

  updateDisplay();
}

// ========== AUTHENTICATION ==========
function showAuthModal() {
  const authModal = document.getElementById("authModal");
  if (authModal) authModal.style.display = "flex";
}

function closeAuthModal() {
  const authModal = document.getElementById("authModal");
  if (authModal) authModal.style.display = "none";
}

function setupAuth() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal();
        showToast("Signed in successfully!");
        await loadUserDataFromFirestore();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("registerName").value;
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;
      try {
        const result = await auth.createUserWithEmailAndPassword(
          email,
          password,
        );
        await result.user.updateProfile({ displayName: name });
        closeAuthModal();
        showToast("Account created! Welcome!");
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".auth-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const loginFormEl = document.getElementById("loginForm");
      const registerFormEl = document.getElementById("registerForm");
      if (loginFormEl)
        loginFormEl.style.display =
          tab.dataset.auth === "login" ? "block" : "none";
      if (registerFormEl)
        registerFormEl.style.display =
          tab.dataset.auth === "register" ? "block" : "none";
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await auth.signOut();
      showToast("Signed out");
      location.reload();
    });
  }
}

function checkAuthStatus() {
  if (auth) {
    setupAuth();
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      if (!user && isFirebaseConnected) {
        const hasFirebaseConfig = localStorage.getItem("firebaseConfig");
        if (hasFirebaseConfig) {
          showAuthModal();
        }
      }
    });
  }
}

// ========== UTILITIES ==========
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function updateGradePreview(grade) {
  const preview = document.getElementById("gradePreview");
  if (preview) {
    const letter = getLetterGrade(grade);
    preview.textContent = letter;
    preview.className = `grade-preview ${letter}`;
  }
}

function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type === "error" ? "#ff4757" : "#00b894"};color:white;padding:12px 20px;border-radius:8px;z-index:2000;animation:fadeInOut 2s ease`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function closeModal() {
  const courseModal = document.getElementById("courseModal");
  if (courseModal) courseModal.style.display = "none";
}

function closeDeleteModal() {
  const deleteModal = document.getElementById("deleteModal");
  if (deleteModal) deleteModal.style.display = "none";
}

function closeTaskModal() {
  const taskModal = document.getElementById("taskModal");
  if (taskModal) taskModal.style.display = "none";
}

function closeVaultModal() {
  const vaultModal = document.getElementById("vaultItemModal");
  if (vaultModal) vaultModal.style.display = "none";
}

function saveSettings() {
  const nameInput = document.getElementById("settingsName");
  if (nameInput) {
    localStorage.setItem("profileName", nameInput.value);
    showToast("Settings saved!");
  }
}

function setupTheme() {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark-mode");

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark-mode"),
      );
    });
  }
}

function exportData() {
  const data = {
    courses: getCourses(),
    tasks: getTasks(),
    studySessions: getStudySessions(),
    vault: getVaultItems(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gradeguardian-backup.json";
  a.click();
  showToast("Data exported!");
}

function resetAllData() {
  if (
    confirm(
      "WARNING: This will delete ALL your local data. Cloud data will remain.",
    )
  ) {
    localStorage.clear();
    location.reload();
  }
}

function syncToCloudIfNeeded() {
  if (db && currentUser) {
    setTimeout(() => syncToCloud(), 3000);
  }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Course modal
  const openCourseBtn = document.getElementById("openCourseModal");
  if (openCourseBtn) {
    openCourseBtn.addEventListener("click", () => {
      const courseForm = document.getElementById("courseForm");
      const courseIdEl = document.getElementById("courseId");
      const modalTitleEl = document.getElementById("modalTitle");
      const courseModal = document.getElementById("courseModal");

      if (courseForm) courseForm.reset();
      if (courseIdEl) courseIdEl.value = "";
      if (modalTitleEl) modalTitleEl.textContent = "Add New Course";
      if (courseModal) courseModal.style.display = "flex";
    });
  }

  const closeModalBtn = document.getElementById("closeModal");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  const cancelModalBtn = document.getElementById("cancelModalBtn");
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

  const closeDeleteBtn = document.getElementById("closeDeleteModal");
  if (closeDeleteBtn)
    closeDeleteBtn.addEventListener("click", closeDeleteModal);

  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  if (cancelDeleteBtn)
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);

  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  if (confirmDeleteBtn)
    confirmDeleteBtn.addEventListener("click", confirmDelete);

  const closeTaskBtn = document.getElementById("closeTaskModal");
  if (closeTaskBtn) closeTaskBtn.addEventListener("click", closeTaskModal);

  const cancelTaskBtn = document.getElementById("cancelTaskBtn");
  if (cancelTaskBtn) cancelTaskBtn.addEventListener("click", closeTaskModal);

  const closeVaultBtn = document.getElementById("closeVaultModal");
  if (closeVaultBtn) closeVaultBtn.addEventListener("click", closeVaultModal);

  const cancelVaultBtn = document.getElementById("cancelVaultBtn");
  if (cancelVaultBtn) cancelVaultBtn.addEventListener("click", closeVaultModal);

  const deleteVaultBtn = document.getElementById("deleteVaultItemBtn");
  if (deleteVaultBtn) deleteVaultBtn.addEventListener("click", deleteVaultItem);

  const saveVaultBtn = document.getElementById("saveVaultItemBtn");
  if (saveVaultBtn) {
    saveVaultBtn.addEventListener("click", async () => {
      const vaultModal = document.getElementById("vaultItemModal");
      const itemId = vaultModal ? vaultModal.dataset.itemId : null;
      const items = getVaultItems();
      const idx = items.findIndex((i) => i.id === itemId);

      if (idx !== -1) {
        const titleInput = document.getElementById("vaultDocTitle");
        const typeSelect = document.getElementById("vaultDocType");
        const courseSelect = document.getElementById("vaultDocCourse");
        const tagsInput = document.getElementById("vaultDocTags");
        const descTextarea = document.getElementById("vaultDocDesc");

        items[idx].name = titleInput ? titleInput.value : items[idx].name;
        items[idx].type = typeSelect ? typeSelect.value : items[idx].type;
        items[idx].course = courseSelect
          ? courseSelect.value
          : items[idx].course;
        items[idx].tags = tagsInput
          ? tagsInput.value.split(",").map((t) => t.trim())
          : items[idx].tags;
        items[idx].description = descTextarea
          ? descTextarea.value
          : items[idx].description;

        saveVaultItems(items);

        if (db && currentUser) {
          await db
            .collection("users")
            .doc(currentUser.uid)
            .collection("vault")
            .doc(itemId)
            .update(items[idx]);
        }

        closeVaultModal();
        showToast("Document updated");
      }
    });
  }

  // Course form submit
  const courseForm = document.getElementById("courseForm");
  if (courseForm) {
    courseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("courseName");
      const codeInput = document.getElementById("courseCode");
      const hoursInput = document.getElementById("creditHours");
      const instructorInput = document.getElementById("instructor");
      const semesterSelect = document.getElementById("semester");
      const gradeInput = document.getElementById("currentGrade");
      const courseIdEl = document.getElementById("courseId");

      const data = {
        name: nameInput ? nameInput.value : "",
        code: codeInput ? codeInput.value : "",
        creditHours: hoursInput ? parseInt(hoursInput.value) : 3,
        instructor: instructorInput ? instructorInput.value : "",
        semester: semesterSelect ? semesterSelect.value : "Fall 2024",
        grade: gradeInput ? parseFloat(gradeInput.value) || 0 : 0,
      };
      const id = courseIdEl ? courseIdEl.value : "";
      id ? updateCourse(id, data) : addCourse(data);
    });
  }

  // Grade preview
  const currentGradeInput = document.getElementById("currentGrade");
  if (currentGradeInput) {
    currentGradeInput.addEventListener("input", (e) =>
      updateGradePreview(e.target.value),
    );
  }

  // Search and filter
  const courseSearch = document.getElementById("courseSearchInput");
  if (courseSearch) courseSearch.addEventListener("input", () => loadCourses());

  const courseFilter = document.getElementById("courseFilter");
  if (courseFilter)
    courseFilter.addEventListener("change", () => loadCourses());

  const vaultCourseFilter = document.getElementById("vaultCourseFilter");
  if (vaultCourseFilter)
    vaultCourseFilter.addEventListener("change", () => loadVaultItems());

  const vaultTypeFilter = document.getElementById("vaultTypeFilter");
  if (vaultTypeFilter)
    vaultTypeFilter.addEventListener("change", () => loadVaultItems());

  const vaultSearch = document.getElementById("vaultSearch");
  if (vaultSearch)
    vaultSearch.addEventListener("input", () => loadVaultItems());

  // Close modals on overlay click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
        closeDeleteModal();
        closeTaskModal();
        closeVaultModal();
        const authModal = document.getElementById("authModal");
        if (authModal) authModal.style.display = "none";
      }
    });
  });

  // Add task button
  const addTaskBtn = document.getElementById("addTaskBtn");
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => {
      const taskCourse = document.getElementById("taskCourse");
      if (taskCourse) {
        taskCourse.innerHTML =
          '<option value="">All Courses</option>' +
          getCourses()
            .map(
              (c) =>
                `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`,
            )
            .join("");
      }
      const taskForm = document.getElementById("taskForm");
      const taskIdEl = document.getElementById("taskId");
      const taskModalTitle = document.getElementById("taskModalTitle");
      const taskModal = document.getElementById("taskModal");

      if (taskForm) taskForm.reset();
      if (taskIdEl) taskIdEl.value = "";
      if (taskModalTitle) taskModalTitle.textContent = "Add Task";
      if (taskModal) taskModal.style.display = "flex";
    });
  }

  // Task form submit
  const taskForm = document.getElementById("taskForm");
  if (taskForm) {
    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const titleInput = document.getElementById("taskTitle");
      const courseSelect = document.getElementById("taskCourse");
      const dueDateInput = document.getElementById("taskDueDate");
      const prioritySelect = document.getElementById("taskPriority");

      const data = {
        title: titleInput ? titleInput.value : "",
        course: courseSelect ? courseSelect.value : "",
        dueDate: dueDateInput ? dueDateInput.value : "",
        priority: prioritySelect ? prioritySelect.value : "medium",
      };
      addTask(data);
      closeTaskModal();
    });
  }

  // Data management buttons
  const exportBtn = document.getElementById("exportDataBtn");
  if (exportBtn) exportBtn.addEventListener("click", exportData);

  const syncBtn = document.getElementById("syncCloudBtn");
  if (syncBtn) syncBtn.addEventListener("click", syncToCloud);

  const clearBtn = document.getElementById("clearDataBtn");
  if (clearBtn) clearBtn.addEventListener("click", resetAllData);

  // Connect Firebase button
  const connectBtn = document.getElementById("connectFirebaseBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", () => {
      const projectIdInput = document.getElementById("firebaseProjectId");
      const apiKeyInput = document.getElementById("firebaseApiKey");
      const projectId = projectIdInput ? projectIdInput.value : "";
      const apiKey = apiKeyInput ? apiKeyInput.value : "";

      if (projectId && apiKey) {
        const config = {
          apiKey,
          authDomain: `${projectId}.firebaseapp.com`,
          projectId,
          storageBucket: `${projectId}.appspot.com`,
        };
        localStorage.setItem("firebaseConfig", JSON.stringify(config));
        initializeFirebaseApp(config);
      } else {
        showToast("Enter Project ID and API Key", "error");
      }
    });
  }

  // File upload
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const browseBtn = document.getElementById("browseBtn");

  if (browseBtn) {
    browseBtn.addEventListener("click", () => {
      if (fileInput) fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach((file) => {
          const courseFilter = document.getElementById("vaultCourseFilter");
          uploadVaultFile(file, {
            title: file.name,
            type: "note",
            course:
              courseFilter && courseFilter.value !== "all"
                ? courseFilter.value
                : "",
          });
        });
      }
    });
  }

  if (uploadArea) {
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#4361ee";
    });

    uploadArea.addEventListener("dragleave", (e) => {
      uploadArea.style.borderColor = "#ddd";
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#ddd";
      const files = e.dataTransfer.files;
      if (files) {
        Array.from(files).forEach((file) => {
          if (
            file.type.startsWith("image/") ||
            file.type === "application/pdf"
          ) {
            uploadVaultFile(file, { title: file.name, type: "note" });
          } else {
            showToast("Only images and PDFs allowed", "error");
          }
        });
      }
    });
  }
}
