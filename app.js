const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// 💡 v5로 업데이트하여 기존에 꼬인 데이터를 무시하고 깨끗하게 재시작합니다.
const storeKey = "archive-yuwol-workspace-v5"; 
const defaultState = {
  activeView: "dashboard",
  activeLoreCategory: "지역",
  activeNoteCategory: "아이디어 노트",
  activeGalleryCategory: "이미지 레퍼런스",
  activeLoreId: null,
  loreCategories: ["지역", "종족", "조직", "사건", "연표"],
  noteCategories: ["아이디어 노트", "시나리오 초안", "비공개 메모"],
  galleryCategories: ["이미지 레퍼런스", "무드보드"],
  visibility: "비공개",
  characters: [],
  lore: [],
  notes: [],
  gallery: [],
  builderBlocks: [
    { id: "block-intro", title: "드래그 가능한 소개 섹션", body: "프로필 소개, 링크, 관계도 블록을 자유롭게 배치하세요." },
    { id: "block-links", title: "관계도 / 링크 / 갤러리 블록", body: "섹션 추가 버튼으로 새 블록을 만들 수 있습니다." },
  ],
  settings: {
    recoverDrafts: true,
    shortcuts: true,
    defaultVisibility: "비공개",
  },
};

let state = loadState();
let modalMode = "note";
let toastTimer;
let draggedBlock = null; 

// DOM Elements
const navItems = $$(".nav-item");
const views = $$(".view");
const sidebar = $("#sidebar");
const saveState = $("#saveState");
const itemModal = $("#itemModal");
const itemForm = $("#itemForm");
const modalTitle = $("#modalTitle");
const modalEyebrow = $("#modalEyebrow");
const modalName = $("#modalName");
const modalCategory = $("#modalCategory");
const modalBody = $("#modalBody");

// State Management
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey)) || {};
    return { ...defaultState, ...saved, settings: { ...defaultState.settings, ...(saved.settings || {}) } };
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function persist(message = "자동 저장됨") {
  try {
    localStorage.setItem(storeKey, JSON.stringify(state));
    saveState.textContent = message;
    showToast(message);
  } catch (e) {
    console.error(e);
    showToast("저장 용량 초과! 이미지를 삭제하거나 텍스트 위주로 작성해주세요.");
  }
}

function showToast(message) {
  const toast = $("#toast");
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1500);
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

// Navigation & Views
function showView(id) {
  state.activeView = id;
  views.forEach((view) => view.classList.toggle("active-view", view.id === id));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === id));
  if(sidebar) sidebar.classList.remove("open");
  updateFabLabel();
  persist("화면 이동됨");
}

function updateFabLabel() {
  const labels = {
    dashboard: "새 문서 만들기",
    blankDocument: "문서 저장",
    characters: "캐릭터 추가",
    lore: `${state.activeLoreCategory} 추가`,
    builder: "페이지 섹션 추가",
    gallery: "이미지 업로드",
    embed: "임베드 코드 복사",
    notes: `${state.activeNoteCategory} 추가`,
    settings: "설정 저장",
  };
  const fab = $(".fab");
  if(fab) {
    fab.setAttribute("aria-label", labels[state.activeView] || "빠른 추가");
    fab.title = labels[state.activeView] || "빠른 추가";
  }
}

// Rendering Functions
function renderAll() {
  try {
    renderTree();
    renderCharacters();
    renderLore();
    renderNotes();
    renderGallery();
    renderBuilder();
    updateFabLabel();
  } catch (e) {
    console.error("렌더링 중 오류 발생:", e);
  }
}

function renderTree() {
  const loreGroup = $('[data-tree-group="lore"]');
  const notesGroup = $('[data-tree-group="notes"]');
  if(!loreGroup || !notesGroup) return;
  
  loreGroup.querySelectorAll("a").forEach((link) => link.remove());
  notesGroup.querySelectorAll("a").forEach((link) => link.remove());

  state.loreCategories.forEach((category) => {
    loreGroup.append(createTreeLink("lore", "lore", category, state.activeLoreCategory === category));
  });
  state.noteCategories.forEach((category) => {
    notesGroup.append(createTreeLink("notes", "note", category, state.activeNoteCategory === category));
  });
  state.galleryCategories.forEach((category) => {
    notesGroup.append(createTreeLink("gallery", "gallery", category, state.activeView === "gallery" && state.activeGalleryCategory === category));
  });
}

function createTreeLink(view, type, category, active) {
  const link = document.createElement("a");
  link.href = `#${view}`;
  link.dataset.view = view;
  link.dataset.type = type;
  link.dataset.category = category;
  link.textContent = category;
  link.classList.toggle("active-tree", active);
  return link;
}

function renderPills(container, categories, active, onClick) {
  if(!container) return;
  container.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.classList.toggle("active", category === active);
    button.addEventListener("click", () => onClick(category));
    container.append(button);
  });
}

function renderCharacters() {
  const list = $("#characterList");
  if(!list) return;
  list.innerHTML = "";
  state.characters.forEach((item) => list.append(renderContentCard("characters", item, true)));
}

// 세계관 렌더링
function renderLore() {
  const titleEl = $("#loreTitle");
  if(titleEl) titleEl.textContent = `세계관 · ${state.activeLoreCategory}`;
  
  renderPills($("#loreCategoryPills"), state.loreCategories, state.activeLoreCategory, (category) => {
    state.activeLoreCategory = category;
    state.activeLoreId = null; 
    renderAll();
  });
  
  const list = $("#loreList");
  if(!list) return;
  list.innerHTML = "";
  const filteredLore = state.lore.filter((item) => item.category === state.activeLoreCategory);

  if (!state.activeLoreId && filteredLore.length > 0) {
    state.activeLoreId = filteredLore[0].id;
  }

  filteredLore.forEach((item) => {
    const card = renderContent
