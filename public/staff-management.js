// ============================================
// STAFF MANAGEMENT - ENHANCED FEATURES
// ============================================

// Global variables for staff management
let allStaffData = [];
let filteredStaffData = [];
let currentPageData = [];
let selectedStaffIds = new Set();
let currentPage = 1;
let rowsPerPage = 10;
let sortColumn = "name";
let sortDirection = "asc";

// Staff Management State
const staffFilters = {
  search: "",
  unit: "",
  location: "",
  invitation: "",
};

// Tracks whether the user manually picked a jantina in the currently open
// modal, so name-based auto-detection doesn't clobber a manual choice.
let jantinaManuallySet = false;

// ============================================
// GENDER (JANTINA) HELPERS
// ============================================
// Mirrors the server-side detection in lib/db.js: BINTI -> perempuan,
// BIN -> lelaki (checked in that order since "BINTI" also contains "BIN").
function detectGenderFromName(name) {
  if (!name) return "";
  const upper = name.toUpperCase();
  if (/\bBINTI\b/.test(upper)) return "P";
  if (/\bBIN\b/.test(upper)) return "L";
  return "";
}

function getGenderIcon(jantina) {
  if (jantina === "L") {
    return '<i class="fas fa-mars text-blue-400" title="Lelaki"></i>';
  }
  if (jantina === "P") {
    return '<i class="fas fa-venus text-pink-400" title="Perempuan"></i>';
  }
  return '<i class="fas fa-genderless text-gray-600" title="Tidak diketahui"></i>';
}

// ============================================
// LOAD STAFF DATA FROM API
// ============================================
async function loadStaffData() {
  const loadingIndicator = document.getElementById("staffLoadingIndicator");
  const tableContainer = document.getElementById("staffTableContainer");
  const cardsContainer = document.getElementById("staffCardsContainer");
  const emptyState = document.getElementById("staffEmptyState");

  try {
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
    if (tableContainer) tableContainer.classList.add("hidden");
    if (cardsContainer) cardsContainer.classList.add("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    const response = await fetch("/api/get-staff");
    const data = await response.json();

    if (data.success && data.staff) {
      allStaffData = data.staff;
      filteredStaffData = [...allStaffData];

      // Populate filter dropdowns
      populateFilterDropdowns();

      // Update stats
      updateStaffStats();

      // Apply current filters and pagination
      applyStaffFilters();

      if (loadingIndicator) loadingIndicator.classList.add("hidden");

      if (allStaffData.length === 0) {
        if (emptyState) emptyState.classList.remove("hidden");
      } else {
        if (tableContainer) tableContainer.classList.remove("hidden");
        if (cardsContainer) cardsContainer.classList.remove("hidden");
      }
    } else {
      throw new Error(data.error || "Failed to load staff data");
    }
  } catch (error) {
    console.error("Error loading staff data:", error);
    if (loadingIndicator) loadingIndicator.classList.add("hidden");
    if (emptyState) emptyState.classList.remove("hidden");
    showToast("Gagal memuat data staf: " + error.message, "error");
  }
}

// ============================================
// POPULATE FILTER DROPDOWNS
// ============================================
function populateFilterDropdowns() {
  const units = [
    ...new Set(allStaffData.map((s) => s.unit).filter(Boolean)),
  ].sort();
  const locations = [
    ...new Set(allStaffData.map((s) => s.location).filter(Boolean)),
  ].sort();

  const filterUnit = document.getElementById("filterUnit");
  const filterLocation = document.getElementById("filterLocation");

  if (filterUnit) {
    filterUnit.innerHTML = '<option value="">Unit: Semua</option>';
    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      filterUnit.appendChild(option);
    });
  }

  if (filterLocation) {
    filterLocation.innerHTML = '<option value="">Lokasi: Semua</option>';
    locations.forEach((location) => {
      const option = document.createElement("option");
      option.value = location;
      option.textContent = location;
      filterLocation.appendChild(option);
    });
  }
}

// ============================================
// UPDATE STATS DASHBOARD
// ============================================
function updateStaffStats() {
  const totalStaff = filteredStaffData.length;
  const invitedStaff = filteredStaffData.filter(
    (s) => s.status === "JEMPUTAN",
  ).length;
  const proxyStaff = filteredStaffData.filter(
    (s) => s.status === "WAKIL",
  ).length;
  const noInvitationStaff = filteredStaffData.filter(
    (s) =>
      !s.status ||
      s.status === "TIADA" ||
      s.status === "" ||
      s.status === "TIADA JEMPUTAN",
  ).length;

  const elTotal = document.getElementById("totalStaffCount");
  const elInvited = document.getElementById("invitedStaffCount");
  const elProxy = document.getElementById("proxyStaffCount");
  const elNoInv = document.getElementById("noInvitationStaffCount");
  const elBulk = document.getElementById("bulkSelectedCount");

  if (elTotal) elTotal.textContent = totalStaff;
  if (elInvited) elInvited.textContent = invitedStaff;
  if (elProxy) elProxy.textContent = proxyStaff;
  if (elNoInv) elNoInv.textContent = noInvitationStaff;
  if (elBulk) elBulk.textContent = selectedStaffIds.size;
}

// ============================================
// SEARCH STAFF DATA
// ============================================
function searchStaffData() {
  const elSearch = document.getElementById("searchStaf");
  if (elSearch) {
    staffFilters.search = elSearch.value.toLowerCase();
    applyStaffFilters();
  }
}

// ============================================
// APPLY ALL FILTERS
// ============================================
function applyStaffFilters() {
  filteredStaffData = allStaffData.filter((staff) => {
    // Search filter
    const searchMatch =
      !staffFilters.search ||
      staff.id.toLowerCase().includes(staffFilters.search) ||
      staff.name.toLowerCase().includes(staffFilters.search) ||
      (staff.position &&
        staff.position.toLowerCase().includes(staffFilters.search)) ||
      (staff.location &&
        staff.location.toLowerCase().includes(staffFilters.search)) ||
      (staff.unit && staff.unit.toLowerCase().includes(staffFilters.search));

    // Unit filter
    const unitMatch = !staffFilters.unit || staff.unit === staffFilters.unit;

    // Location filter
    const locationMatch =
      !staffFilters.location || staff.location === staffFilters.location;

    // Invitation filter
    let invitationMatch = true;
    if (staffFilters.invitation === "TIADA JEMPUTAN") {
      invitationMatch =
        !staff.status ||
        staff.status === "TIADA" ||
        staff.status === "" ||
        staff.status === "TIADA JEMPUTAN";
    } else if (staffFilters.invitation) {
      invitationMatch = staff.status === staffFilters.invitation;
    }

    return searchMatch && unitMatch && locationMatch && invitationMatch;
  });

  currentPage = 1;
  updateStaffStats();
  renderPaginatedStaff();
}

// ============================================
// CLEAR ALL FILTERS
// ============================================
function clearStaffFilters() {
  const elSearch = document.getElementById("searchStaf");
  const elUnit = document.getElementById("filterUnit");
  const elLoc = document.getElementById("filterLocation");
  const elInv = document.getElementById("filterInvitation");

  if (elSearch) elSearch.value = "";
  if (elUnit) elUnit.value = "";
  if (elLoc) elLoc.value = "";
  if (elInv) elInv.value = "";

  staffFilters.search = "";
  staffFilters.unit = "";
  staffFilters.location = "";
  staffFilters.invitation = "";

  applyStaffFilters();
}

// ============================================
// QUICK FILTER FROM STATS CARDS
// ============================================
function quickFilterStaff(status) {
  clearStaffFilters();
  if (status) {
    staffFilters.invitation = status;
    const elInv = document.getElementById("filterInvitation");
    if (elInv) elInv.value = status;
    applyStaffFilters();
  }
}

function applyInvitationFilter() {
  const elInv = document.getElementById("filterInvitation");
  if (elInv) {
    staffFilters.invitation = elInv.value;
    applyStaffFilters();
  }
}

function applyUnitFilter() {
  const elUnit = document.getElementById("filterUnit");
  if (elUnit) {
    staffFilters.unit = elUnit.value;
    applyStaffFilters();
  }
}

function applyLocationFilter() {
  const elLoc = document.getElementById("filterLocation");
  if (elLoc) {
    staffFilters.location = elLoc.value;
    applyStaffFilters();
  }
}

// ============================================
// PAGINATION
// ============================================
function renderPaginatedStaff() {
  const totalRecords = filteredStaffData.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRecords);

  currentPageData = filteredStaffData.slice(startIndex, endIndex);

  // Update pagination UI
  const elFrom = document.getElementById("showingFrom");
  const elTo = document.getElementById("showingTo");
  const elTotal = document.getElementById("totalRecords");
  const elCurrent = document.getElementById("currentPage");
  const elTotalPages = document.getElementById("totalPages");
  const elPrev = document.getElementById("prevPageBtn");
  const elNext = document.getElementById("nextPageBtn");

  if (elFrom) elFrom.textContent = totalRecords > 0 ? startIndex + 1 : 0;
  if (elTo) elTo.textContent = endIndex;
  if (elTotal) elTotal.textContent = totalRecords;
  if (elCurrent) elCurrent.textContent = currentPage;
  if (elTotalPages) elTotalPages.textContent = totalPages;

  if (elPrev) elPrev.disabled = currentPage === 1;
  if (elNext) elNext.disabled = currentPage >= totalPages;

  renderStaffTable();
  renderStaffCards();

  const emptyState = document.getElementById("staffEmptyState");
  const tableContainer = document.getElementById("staffTableContainer");
  const cardsContainer = document.getElementById("staffCardsContainer");
  const paginationControls = document.getElementById("paginationControls");

  if (totalRecords === 0) {
    if (emptyState) emptyState.classList.remove("hidden");
    if (tableContainer) tableContainer.classList.add("hidden");
    if (cardsContainer) cardsContainer.classList.add("hidden");
    if (paginationControls) paginationControls.classList.add("hidden");
  } else {
    if (emptyState) emptyState.classList.add("hidden");
    if (tableContainer) tableContainer.classList.remove("hidden");
    if (cardsContainer) cardsContainer.classList.remove("hidden");
    if (paginationControls) paginationControls.classList.remove("hidden");
  }
}

function changeRowsPerPage() {
  const elRows = document.getElementById("rowsPerPage");
  if (elRows) {
    rowsPerPage = parseInt(elRows.value);
    currentPage = 1;
    renderPaginatedStaff();
  }
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderPaginatedStaff();
  }
}

function nextPage() {
  const totalPages = Math.ceil(filteredStaffData.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderPaginatedStaff();
  }
}

// ============================================
// RENDER STAFF TABLE (DESKTOP)
// ============================================
function renderStaffTable() {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  currentPageData.forEach((staff) => {
    const isSelected = selectedStaffIds.has(staff.id);
    const row = document.createElement("tr");
    if (isSelected) row.className = "bg-blue-600/20";

    row.innerHTML = `
      <td class="p-4 text-center">
        <input type="checkbox" onchange="toggleStaffSelection('${staff.id}')" ${isSelected ? "checked" : ""} class="w-4 h-4 rounded cursor-pointer" />
      </td>
      <td class="p-4 font-mono font-medium text-blue-400 text-xs">${staff.id}</td>
      <td class="p-4 font-semibold text-white">${staff.name}</td>
      <td class="p-4 text-[11px] font-medium text-gray-400">${staff.position || "-"}</td>
      <td class="p-4 text-[11px] font-medium text-gray-400">${staff.location || "-"}</td>
      <td class="p-4 text-[11px] font-medium text-gray-400">${staff.unit || "-"}</td>
      <td class="p-4 text-center text-base">${getGenderIcon(staff.jantina)}</td>
      <td class="p-4 text-center">${getInvitationToggle(staff)}</td>
      <td class="p-4 text-center">${getStatusBadge(staff.status)}</td>
      <td class="p-4 text-center whitespace-nowrap">
        <button onclick="showEditStaffModal('${staff.id}')" class="p-2 text-blue-400/70 hover:text-blue-400 transition-all"><i class="fas fa-edit"></i></button>
        <button onclick="deleteStaffConfirm('${staff.id}')" class="p-2 text-red-500/70 hover:text-red-500 transition-all"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(row);
  });

  updateSelectAllCheckbox();
}

// ============================================
// RENDER STAFF CARDS (MOBILE)
// ============================================
function renderStaffCards() {
  const container = document.getElementById("staffCardsBody");
  if (!container) return;
  container.innerHTML = "";

  currentPageData.forEach((staff) => {
    const isSelected = selectedStaffIds.has(staff.id);
    const card = document.createElement("div");
    card.className = `staff-card glass-card p-4 ${isSelected ? "selected" : ""}`;
    card.onclick = (e) => {
      if (
        e.target.tagName !== "BUTTON" &&
        e.target.tagName !== "I" &&
        e.target.tagName !== "INPUT"
      ) {
        toggleStaffSelection(staff.id);
      }
    };

    card.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <div class="flex items-center gap-3">
          <input type="checkbox" ${isSelected ? "checked" : ""} class="w-5 h-5 rounded cursor-pointer" onclick="event.stopPropagation(); toggleStaffSelection('${staff.id}')" />
          <div>
            <span class="text-[9px] font-bold text-blue-400/80 block uppercase tracking-wider">${staff.id}</span>
            <h4 class="font-bold text-white text-sm leading-tight">${getGenderIcon(staff.jantina)} ${staff.name}</h4>
          </div>
        </div>
        <div class="flex items-center gap-2">${getStatusBadge(staff.status)}${getInvitationToggle(staff)}</div>
      </div>
      <div class="grid grid-cols-1 gap-1.5 mb-4 text-[10px] text-gray-400 font-medium">
        <div class="flex items-center gap-2"><i class="fas fa-briefcase w-3 opacity-40"></i> ${staff.position || "-"}</div>
        <div class="flex items-center gap-2"><i class="fas fa-map-marker-alt w-3 opacity-40"></i> ${staff.location || "-"}</div>
        <div class="flex items-center gap-2"><i class="fas fa-building w-3 opacity-40"></i> ${staff.unit || "-"}</div>
      </div>
      <div class="flex gap-2 pt-3 border-t border-white/5">
        <button onclick="event.stopPropagation(); showEditStaffModal('${staff.id}')" class="flex-1 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase tracking-wider border border-blue-500/20"><i class="fas fa-edit mr-1 opacity-70"></i> Edit</button>
        <button onclick="event.stopPropagation(); deleteStaffConfirm('${staff.id}')" class="flex-1 py-1.5 rounded-md bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-wider border border-red-500/20"><i class="fas fa-trash mr-1 opacity-70"></i> Padam</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================================
// STATUS BADGE HELPER
// ============================================
function getStatusBadge(status) {
  if (status === "JEMPUTAN") {
    return '<span class="status-badge bg-green-500/20 text-green-400">JEMPUTAN</span>';
  }
  if (status === "WAKIL") {
    return '<span class="status-badge bg-blue-500/20 text-blue-400">WAKIL</span>';
  }
  if (
    !status ||
    status === "TIADA" ||
    status === "" ||
    status === "TIADA JEMPUTAN"
  ) {
    return '<span class="status-badge bg-purple-500/20 text-purple-400">TIADA JEMPUTAN</span>';
  }
  return '<span class="status-badge bg-gray-500/20 text-gray-400">PILIH...</span>';
}

// ============================================
// QUICK INVITATION TOGGLE (TICK / UNTICK)
// ============================================
// One-click alternative to opening the edit modal: ticked = JEMPUTAN,
// unticked = TIADA.
function getInvitationToggle(staff) {
  const invited = staff.status === "JEMPUTAN";
  const title = invited ? "Buang jemputan" : "Tandakan sebagai jemputan";
  const cls = invited
    ? "bg-green-500 border-green-500 text-white"
    : "bg-transparent border-gray-500 text-transparent hover:border-green-400";
  return `<button type="button" title="${title}" onclick="event.stopPropagation(); toggleInvitation('${staff.id}')" class="inline-flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all ${cls}"><i class="fas fa-check text-[11px]"></i></button>`;
}

async function toggleInvitation(staffId) {
  const staff = allStaffData.find((s) => s.id === staffId);
  if (!staff) return;

  const previous = staff.status;
  const next = previous === "JEMPUTAN" ? "TIADA" : "JEMPUTAN";

  // Optimistic update: re-render in place so the current page/filter stays put.
  staff.status = next;
  updateStaffStats();
  renderStaffTable();
  renderStaffCards();

  try {
    const response = await fetch("/api/bulk-update-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [staffId], field: "status", value: next }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
  } catch (error) {
    staff.status = previous;
    updateStaffStats();
    renderStaffTable();
    renderStaffCards();
    showToast("Gagal kemaskini jemputan: " + error.message, "error");
  }
}

// ============================================
// BULK SELECTION
// ============================================
function toggleStaffSelection(staffId) {
  if (staffId) {
    if (selectedStaffIds.has(staffId)) {
      selectedStaffIds.delete(staffId);
    } else {
      selectedStaffIds.add(staffId);
    }
  }

  const elBar = document.getElementById("bulkActionsBar");
  const elCount = document.getElementById("bulkSelectedCount");
  if (elBar) elBar.classList.toggle("hidden", selectedStaffIds.size === 0);
  if (elCount) elCount.textContent = selectedStaffIds.size;

  updateStaffStats();
  renderStaffTable();
  renderStaffCards();
}

function toggleSelectAll() {
  const isDesktop = window.innerWidth >= 1024;
  const checkbox = document.getElementById(
    isDesktop ? "selectAllStaff" : "selectAllStaffMobile",
  );
  if (!checkbox) return;

  if (checkbox.checked) {
    currentPageData.forEach((s) => selectedStaffIds.add(s.id));
  } else {
    currentPageData.forEach((s) => selectedStaffIds.delete(s.id));
  }

  toggleStaffSelection(); // Refresh UI
}

function updateSelectAllCheckbox() {
  const elDesk = document.getElementById("selectAllStaff");
  const elMob = document.getElementById("selectAllStaffMobile");

  const allInPage =
    currentPageData.length > 0 &&
    currentPageData.every((s) => selectedStaffIds.has(s.id));

  if (elDesk) elDesk.checked = allInPage;
  if (elMob) elMob.checked = allInPage;
}

// Selects every staff matching the current filters, across all pages.
function selectAllFiltered() {
  filteredStaffData.forEach((s) => selectedStaffIds.add(s.id));
  toggleStaffSelection(); // Refresh UI
}

function clearBulkSelection() {
  selectedStaffIds.clear();
  toggleStaffSelection();
}

// ============================================
// BULK ACTIONS
// ============================================
async function bulkUpdateInvitation(status) {
  if (selectedStaffIds.size === 0) return;
  if (!confirm(`Setkan ${selectedStaffIds.size} staf kepada ${status}?`))
    return;

  try {
    const ids = Array.from(selectedStaffIds);
    const response = await fetch("/api/bulk-update-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, field: "status", value: status }),
    });

    const data = await response.json();
    if (data.success) {
      showToast(
        `${selectedStaffIds.size} rekod berjaya dikemaskini`,
        "success",
      );
      clearBulkSelection();
      loadStaffData();
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast("Gagal kemaskini pukal: " + error.message, "error");
  }
}

// Removes the invitation from every JEMPUTAN staff matching the current
// filters (all staff when no filter is set), no selection needed.
async function removeAllInvitations() {
  const ids = filteredStaffData
    .filter((s) => s.status === "JEMPUTAN")
    .map((s) => s.id);

  if (ids.length === 0) {
    showToast("Tiada staf berstatus JEMPUTAN untuk dibuang", "info");
    return;
  }
  if (!confirm(`Buang jemputan bagi ${ids.length} staf?`)) return;

  try {
    const response = await fetch("/api/bulk-update-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, field: "status", value: "TIADA" }),
    });

    const data = await response.json();
    if (data.success) {
      showToast(`Jemputan dibuang bagi ${ids.length} staf`, "success");
      clearBulkSelection();
      loadStaffData();
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast("Gagal buang jemputan: " + error.message, "error");
  }
}

async function bulkDeleteStaff() {
  if (selectedStaffIds.size === 0) return;
  if (!confirm(`PADAM ${selectedStaffIds.size} staf secara kekal?`)) return;

  try {
    const ids = Array.from(selectedStaffIds);
    const response = await fetch("/api/bulk-delete-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    const data = await response.json();
    if (data.success) {
      showToast(`${selectedStaffIds.size} rekod berjaya dipadam`, "success");
      clearBulkSelection();
      loadStaffData();
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast("Gagal padam pukal: " + error.message, "error");
  }
}

// ============================================
// SORTING
// ============================================
function sortStaffTable(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDirection = "asc";
  }

  filteredStaffData.sort((a, b) => {
    let aVal = a[column] || "";
    let bVal = b[column] || "";
    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (sortDirection === "asc") return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  renderPaginatedStaff();
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function showAddStaffModal() {
  const elTitle = document.getElementById("staffModalTitle");
  const elId = document.getElementById("modalStaffId");
  const elName = document.getElementById("modalStaffName");
  const elPos = document.getElementById("modalStaffPosition");
  const elLoc = document.getElementById("modalStaffLocation");
  const elUnit = document.getElementById("modalStaffUnit");
  const elInv = document.getElementById("modalStaffInvitation");
  const elModal = document.getElementById("staffModal");

  if (elTitle) elTitle.textContent = "TAMBAH STAF BARU";
  if (elId) {
    elId.value = "";
    elId.disabled = false;
  }
  if (elName) elName.value = "";
  if (elPos) elPos.value = "";
  if (elLoc) elLoc.value = "";
  if (elUnit) elUnit.value = "";
  if (elInv) elInv.value = "";
  jantinaManuallySet = false;
  setModalJantina("");
  if (elModal) elModal.classList.remove("hidden");
}

function showEditStaffModal(staffId) {
  const staff = allStaffData.find((s) => s.id === staffId);
  if (!staff) return;

  const elTitle = document.getElementById("staffModalTitle");
  const elId = document.getElementById("modalStaffId");
  const elName = document.getElementById("modalStaffName");
  const elPos = document.getElementById("modalStaffPosition");
  const elLoc = document.getElementById("modalStaffLocation");
  const elUnit = document.getElementById("modalStaffUnit");
  const elInv = document.getElementById("modalStaffInvitation");
  const elModal = document.getElementById("staffModal");

  if (elTitle) elTitle.textContent = "KEMASKINI DATA STAF";
  if (elId) {
    elId.value = staff.id;
    elId.disabled = true;
  }
  if (elName) elName.value = staff.name;
  if (elPos) elPos.value = staff.position || "";
  if (elLoc) elLoc.value = staff.location || "";
  if (elUnit) elUnit.value = staff.unit || "";
  if (elInv) elInv.value = staff.status || "";
  jantinaManuallySet = true;
  setModalJantina(staff.jantina || "");
  if (elModal) elModal.classList.remove("hidden");
}

function closeStaffModal() {
  const elModal = document.getElementById("staffModal");
  if (elModal) elModal.classList.add("hidden");
}

// ============================================
// JANTINA TOGGLE (MODAL)
// ============================================
// Called from the Lelaki/Perempuan buttons — a user click always counts as
// a manual override so auto-detection stops touching the field.
function selectModalJantina(value) {
  jantinaManuallySet = true;
  setModalJantina(value);
}

function setModalJantina(value) {
  const elHidden = document.getElementById("modalStaffJantina");
  const elBtnL = document.getElementById("jantinaBtnL");
  const elBtnP = document.getElementById("jantinaBtnP");

  if (elHidden) elHidden.value = value;

  // Inline styles are used (rather than Tailwind utility classes) because
  // this modal's .glass-input dark-mode rule outranks single-class Tailwind
  // utilities in specificity and would otherwise silently win the cascade.
  if (elBtnL) {
    if (value === "L") {
      elBtnL.style.borderColor = "#3b82f6";
      elBtnL.style.color = "#60a5fa";
    } else {
      elBtnL.style.borderColor = "";
      elBtnL.style.color = "";
    }
  }
  if (elBtnP) {
    if (value === "P") {
      elBtnP.style.borderColor = "#ec4899";
      elBtnP.style.color = "#f472b6";
    } else {
      elBtnP.style.borderColor = "";
      elBtnP.style.color = "";
    }
  }
}

// Auto-suggests jantina from the name (BIN/BINTI) while the user is typing
// in the Add modal, unless they've already picked one manually.
function autoDetectModalJantina() {
  if (jantinaManuallySet) return;
  const elName = document.getElementById("modalStaffName");
  if (!elName) return;
  const detected = detectGenderFromName(elName.value);
  if (detected) setModalJantina(detected);
}

async function saveStaffData() {
  const id = document.getElementById("modalStaffId").value.trim();
  const name = document.getElementById("modalStaffName").value.trim();
  const position = document.getElementById("modalStaffPosition").value.trim();
  const location = document.getElementById("modalStaffLocation").value.trim();
  const unit = document.getElementById("modalStaffUnit").value.trim();
  const status = document.getElementById("modalStaffInvitation").value;
  const jantina = document.getElementById("modalStaffJantina").value;
  const isEdit = document.getElementById("modalStaffId").disabled;

  if (!id || !name) {
    showToast("ID dan Nama adalah wajib", "warning");
    return;
  }

  const indicator = document.getElementById("staffSaveIndicator");
  if (indicator) indicator.classList.remove("hidden");

  try {
    const endpoint = isEdit ? "/api/update-staff" : "/api/add-staff";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name,
        position,
        location,
        unit,
        status,
        jantina,
      }),
    });

    const data = await response.json();
    if (data.success) {
      showToast(
        isEdit ? "Data berjaya dikemaskini" : "Borang berjaya disimpan",
        "success",
      );
      closeStaffModal();
      loadStaffData();
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast("Gagal simpan data: " + error.message, "error");
  } finally {
    if (indicator) indicator.classList.add("hidden");
  }
}

async function deleteStaffConfirm(staffId) {
  const staff = allStaffData.find((s) => s.id === staffId);
  if (!staff) return;

  if (
    !confirm(
      `Padam staf "${staff.name}" (${staffId})?\nTindakan ini tidak boleh dibatalkan!`,
    )
  )
    return;

  try {
    const response = await fetch("/api/delete-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: staffId }),
    });

    const data = await response.json();
    if (data.success) {
      showToast("Rekod berjaya dipadam", "success");
      loadStaffData();
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast("Gagal padam rekod: " + error.message, "error");
  }
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 right-4 z-[9999] glass-card p-4 rounded-xl shadow-2xl max-w-sm border-l-4 transition-all duration-300 transform translate-x-full`;

  const colors = {
    success: "border-green-500 bg-green-500/10",
    error: "border-red-500 bg-red-500/10",
    warning: "border-yellow-500 bg-yellow-500/10",
    info: "border-blue-500 bg-blue-500/10",
  };
  const icons = {
    success: "fa-check-circle text-green-500",
    error: "fa-exclamation-circle text-red-500",
    warning: "fa-exclamation-triangle text-yellow-500",
    info: "fa-info-circle text-blue-500",
  };

  toast.classList.add(...(colors[type] || colors.info).split(" "));
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas ${icons[type] || icons.info} text-xl"></i>
      <div class="flex-1">
        <p class="text-sm font-bold text-white">${message}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-white/50 hover:text-white transition-all">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // Animation
  setTimeout(() => toast.classList.remove("translate-x-full"), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.add("translate-x-full");
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}
