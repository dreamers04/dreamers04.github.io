const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const storeKey = "archive-yuwol-workspace-v2";
const defaultState = {
  activeView: "dashboard",
  activeLoreCategory: "지역",
  activeNoteCategory: "아이디어 노트",
  activeGalleryCategory: "이미지 레퍼런스",
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
  } catch (e) {
    console.error("저장 공간이 꽉 찼거나 오류가 발생했습니다.", e);
    showToast("저장 용량 초과! 이미지를 줄여주세요.");
    return;
  }
  saveState.textContent = message;
  showToast(message);
}

function showToast(message) {
  const toast = $("#toast");
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
  sidebar.classList.remove("open");
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
  $(".fab").setAttribute("aria-label", labels[state.activeView] || "빠른 추가");
  $(".fab").title = labels[state.activeView] || "빠른 추가";
}

// Rendering Functions
function renderAll() {
  renderTree();
  renderCharacters();
  renderLore();
  renderNotes();
  renderGallery();
  renderBuilder();
  updateFabLabel();
}

function renderTree() {
  const loreGroup = $('[data-tree-group="lore"]');
  const notesGroup = $('[data-tree-group="notes"]');
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
  list.innerHTML = "";
  state.characters.forEach((item) => list.append(renderContentCard("characters", item, true)));
}

function renderLore() {
  $("#loreTitle").textContent = `세계관 · ${state.activeLoreCategory}`;
  renderPills($("#loreCategoryPills"), state.loreCategories, state.activeLoreCategory, (category) => {
    state.activeLoreCategory = category;
    renderAll();
  });
  const list = $("#loreList");
  list.innerHTML = "";
  state.lore.filter((item) => item.category === state.activeLoreCategory).forEach((item) => list.append(renderContentCard("lore", item)));
}

function renderNotes() {
  $("#notesTitle").textContent = state.activeNoteCategory;
  const list = $("#noteList");
  list.querySelectorAll(".editable-note").forEach((note) => note.remove());
  state.notes.filter((note) => note.category === state.activeNoteCategory || state.activeNoteCategory === '아이디어 노트').forEach((note) => list.prepend(renderNoteCard(note)));
}

function renderGallery() {
  renderPills($("#galleryPills"), state.galleryCategories, state.activeGalleryCategory, (category) => {
    state.activeGalleryCategory = category;
    renderAll();
  });
  $$(".gallery-item").forEach((item) => item.remove());
  const grid = $("#galleryGrid");
  state.gallery.filter((item) => item.category === state.activeGalleryCategory).forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";
    wrapper.dataset.id = item.id;
    const img = document.createElement("img");
    img.src = item.src;
    const del = document.createElement("button");
    del.textContent = "삭제";
    del.onclick = () => { state.gallery = state.gallery.filter(i => i.id !== item.id); renderGallery(); persist("삭제됨"); };
    wrapper.append(img, del);
    grid.prepend(wrapper);
  });
}

function renderBuilder() {
  const canvas = $("#builderCanvas");
  $$(".builder-block", canvas).forEach((block) => block.remove());
  
  state.builderBlocks.forEach((block) => {
    const el = document.createElement("div");
    el.className = "floating-section builder-block";
    el.draggable = true;
    el.dataset.id = block.id;
    el.innerHTML = `<strong contenteditable="true" data-field="title">${escapeHTML(block.title)}</strong><p contenteditable="true" data-field="body">${escapeHTML(block.body)}</p>`;
    
    // Page Builder Drag & Drop Logic
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", block.id);
      setTimeout(() => el.style.opacity = "0.4", 0);
    });
    el.addEventListener("dragend", () => el.style.opacity = "1");
    canvas.append(el);
  });
}

function renderContentCard(collection, item, withImage = false) {
  const card = document.createElement("article");
  card.className = "content-card";
  card.dataset.id = item.id;
  card.dataset.collection = collection;

  if (withImage) {
    const img = document.createElement("img");
    img.src = item.image || "./assets/portrait-elia.png";
    card.append(img);
  }

  const meta = document.createElement("span");
  meta.textContent = item.category || state.visibility;
  const title = document.createElement("h3");
  title.contentEditable = "true";
  title.dataset.field = "title";
  title.textContent = item.title;
  const body = document.createElement("p");
  body.contentEditable = "true";
  body.dataset.field = "body";
  body.textContent = item.body;

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const remove = document.createElement("button");
  remove.textContent = "삭제";
  remove.onclick = () => { state[collection] = state[collection].filter(e => e.id !== item.id); renderAll(); persist("삭제됨"); };
  actions.append(remove);

  card.append(meta, title, body, actions);
  return card;
}

function renderNoteCard(note) {
  const card = document.createElement("article");
  card.className = "note-card editable-note";
  card.dataset.id = note.id;
  card.dataset.collection = "notes";
  card.innerHTML = `<span>${escapeHTML(note.category)}</span><h3 contenteditable="true" data-field="title">${escapeHTML(note.title)}</h3><p contenteditable="true" data-field="body">${escapeHTML(note.body)}</p>`;
  const del = document.createElement("button");
  del.className = "delete-note";
  del.textContent = "삭제";
  del.onclick = () => { state.notes = state.notes.filter(e => e.id !== note.id); renderNotes(); persist("문서 삭제됨"); };
  card.append(del);
  return card;
}

// Actions & Handlers
function openBlankDocument() {
  showView("blankDocument");
  $("#blankTitle").textContent = "";
  $("#blankBody").textContent = "";
  $("#blankTitle").focus();
  showToast("새로운 빈 문서를 열었습니다.");
}

function saveBlankDocument(category = "아이디어 노트") {
  const title = $("#blankTitle").textContent.trim() || "제목 없음";
  const body = $("#blankBody").textContent.trim();
  state.notes.unshift({ id: uid("blank"), title, category, body: body || "빈 문서", updatedAt: new Date().toISOString() });
  state.activeNoteCategory = category;
  showView("notes");
  renderAll();
  persist(`${category} 저장 완료`);
}

function openModal(mode, category) {
  modalMode = mode;
  const configs = {
    characters: ["CHARACTER", "캐릭터 추가", ["캐릭터"]],
    lore: ["LORE", `${category || state.activeLoreCategory} 문서 추가`, state.loreCategories],
    notes: ["NOTE", `${category || state.activeNoteCategory} 추가`, state.noteCategories],
  };
  const [eyebrow, title, categories] = configs[mode];
  modalEyebrow.textContent = eyebrow;
  modalTitle.textContent = title;
  modalCategory.innerHTML = categories.map(c => `<option value="${c}" ${c===category?'selected':''}>${c}</option>`).join("");
  modalName.value = "";
  modalBody.value = "";
  itemModal.showModal ? itemModal.showModal() : itemModal.setAttribute("open", "");
}

function closeItemModal() {
  itemModal.close ? itemModal.close() : itemModal.removeAttribute("open");
}

function createItem(mode, title, category, body) {
  const item = { id: uid(mode), title, category, body, updatedAt: new Date().toISOString() };
  if (mode === "characters") { item.image = "./assets/portrait-elia.png"; state.characters.unshift(item); }
  else if (mode === "lore") { state.lore.unshift(item); state.activeLoreCategory = category; }
  else if (mode === "notes") { state.notes.unshift(item); state.activeNoteCategory = category; }
  showView(mode);
  renderAll();
  persist("생성 완료");
}

function performFabAction() {
  const v = state.activeView;
  if (v === "dashboard") openBlankDocument();
  else if (v === "blankDocument") saveBlankDocument(state.activeNoteCategory);
  else if (v === "characters") openModal("characters", "캐릭터");
  else if (v === "lore") openModal("lore", state.activeLoreCategory);
  else if (v === "builder") { state.builderBlocks.push({ id: uid("block"), title: "새 섹션", body: "내용 수정" }); renderBuilder(); persist("섹션 추가"); }
  else if (v === "gallery") $("#galleryUpload").click();
  else if (v === "notes") openModal("notes", state.activeNoteCategory);
  else showToast("이 화면에서는 동작하지 않습니다.");
}

function handleUpload(files, target) {
  [...files].forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (target === "gallery") {
        state.gallery.unshift({ id: uid("image"), title: file.name, category: state.activeGalleryCategory, src: reader.result });
        renderGallery();
      } else if (target === "character" && state.characters.length > 0) {
        state.characters[0].image = reader.result;
        renderCharacters();
      } else if (target === "builder") {
        $(".canvas-hero img").src = reader.result;
      }
      persist("이미지 업로드됨");
    };
    reader.readAsDataURL(file);
  });
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[m]);
}

// --- Event Listeners ---
// Sidebar & Views
navItems.forEach((item) => item.addEventListener("click", () => showView(item.dataset.view)));
$("#openSidebar").addEventListener("click", () => sidebar.classList.add("open"));
$("#closeSidebar").addEventListener("click", () => sidebar.classList.remove("open"));

// Buttons & Actions
$("#newDocument").addEventListener("click", openBlankDocument); // 항상 빈 문서 열기
$(".fab").addEventListener("click", performFabAction);
$("#saveBlankDocument").addEventListener("click", () => saveBlankDocument("아이디어 노트"));
$("#blankToScenario").addEventListener("click", () => saveBlankDocument("시나리오 초안"));
$("#blankToMemo").addEventListener("click", () => saveBlankDocument("비공개 메모"));

// Modal
$("#closeModal").addEventListener("click", closeItemModal);
$("#cancelModal").addEventListener("click", closeItemModal);
itemForm.addEventListener("submit", (e) => {
  e.preventDefault();
  createItem(modalMode, modalName.value.trim() || "무제", modalCategory.value, modalBody.value.trim());
  closeItemModal();
});

// Categories & Actions mapping
const catAction = (type, isAdd) => {
  if (isAdd) {
    const n = prompt("새 카테고리 이름:");
    if (n && n.trim()) {
      state[`${type}Categories`].push(n.trim());
      state[`active${type.charAt(0).toUpperCase() + type.slice(1)}Category`] = n.trim();
      renderAll(); persist("카테고리 추가됨");
    }
  } else {
    const key = `active${type.charAt(0).toUpperCase() + type.slice(1)}Category`;
    const arrKey = `${type}Categories`;
    if (["지역", "아이디어 노트", "이미지 레퍼런스"].includes(state[key])) return showToast("기본 카테고리는 삭제 불가");
    state[arrKey] = state[arrKey].filter(c => c !== state[key]);
    state[key] = state[arrKey][0];
    renderAll(); persist("카테고리 삭제됨");
  }
}

$("#addLoreCategory").onclick = () => catAction("lore", true);
$("#removeLoreCategory").onclick = () => catAction("lore", false);
$("#addCategory").onclick = () => catAction(state.activeView === "gallery" ? "gallery" : state.activeView === "lore" ? "lore" : "note", true);
$("#deleteCategory").onclick = () => catAction(state.activeView === "gallery" ? "gallery" : state.activeView === "lore" ? "lore" : "note", false);

// Inline Add buttons
$("#addCharacter").onclick = () => openModal("characters", "캐릭터");
$("#addLore").onclick = () => openModal("lore", state.activeLoreCategory);
$("#newNoteInline").onclick = () => openModal("notes", state.activeNoteCategory);
$("#newScenarioDraft").onclick = () => openModal("notes", "시나리오 초안");
$("#newPrivateMemo").onclick = () => openModal("notes", "비공개 메모");

// Uploads
$("#uploadCharacterImage").onclick = () => $("#characterImageInput").click();
$("#characterImageInput").onchange = (e) => handleUpload(e.target.files, "character");
$("#uploadImage").onclick = () => $("#galleryUpload").click();
$("#galleryUpload").onchange = (e) => handleUpload(e.target.files, "gallery");
$(".builder-tools").addEventListener("click", (e) => {
  const a = e.target.dataset.builderAction;
  if(a === "section") { state.builderBlocks.push({ id: uid("block"), title: "새 섹션", body: "수정하세요" }); renderBuilder(); }
  else if(a === "banner") $("#builderBannerInput").click();
});
$("#builderBannerInput").onchange = (e) => handleUpload(e.target.files, "builder");

// Tree Click (Sidebar Navigation)
$("#categoryTree").addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  e.preventDefault();
  if (link.dataset.type === "lore") state.activeLoreCategory = link.dataset.category;
  if (link.dataset.type === "note") state.activeNoteCategory = link.dataset.category;
  if (link.dataset.type === "gallery") state.activeGalleryCategory = link.dataset.category;
  showView(link.dataset.view);
  renderAll();
});

// Auto-save on ContentEdit
document.addEventListener("input", (e) => {
  saveState.textContent = "저장 중...";
  const edit = e.target.closest("[contenteditable='true']");
  if (!edit) return;
  const card = edit.closest("[data-collection]");
  if (card) {
    const item = state[card.dataset.collection].find(i => i.id === card.dataset.id);
    if (item) { item[edit.dataset.field] = edit.textContent; persist("자동 저장됨"); }
  }
  const block = edit.closest(".builder-block");
  if (block) {
    const item = state.builderBlocks.find(i => i.id === block.dataset.id);
    if (item) { item[edit.dataset.field] = edit.textContent; persist("페이지 저장됨"); }
  }
});

// Initialize
showView(state.activeView);
renderAll();