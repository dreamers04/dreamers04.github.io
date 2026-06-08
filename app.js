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
  characters: [
    {
      id: "char-elia",
      title: "엘리아 베른",
      category: "캐릭터",
      body: "침묵을 기록하는 사서. 잃어버린 왕국의 마지막 목격자.",
      image: "./assets/portrait-elia.png",
      tags: "#침착함 #비밀 #달빛",
      updatedAt: new Date().toISOString(),
    },
  ],
  lore: [
    {
      id: "lore-lumen",
      title: "루멘 항구",
      category: "지역",
      body: "달이 바다에 낮게 걸리는 밤이면, 항구의 등대는 빛 대신 오래된 이름들을 비춘다.",
      updatedAt: new Date().toISOString(),
    },
  ],
  notes: [
    {
      id: "note-ending",
      title: "엔딩 후보 세 가지",
      category: "비공개 메모",
      body: "기록을 태우는 결말, 기록을 공유하는 결말, 아무도 읽지 않는 결말.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "note-scene",
      title: "북쪽 정원에서의 재회",
      category: "시나리오 초안",
      body: "2막 후반, 오래된 편지를 발견하는 장면.",
      updatedAt: new Date().toISOString(),
    },
  ],
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

function loadState() {
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(localStorage.getItem(storeKey)) };
  } catch {
    return structuredClone(defaultState);
  }
}

function persist(message = "자동 저장됨") {
  localStorage.setItem(storeKey, JSON.stringify(state));
  saveState.textContent = message;
  showToast(message);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1300);
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

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
    characters: "캐릭터 추가",
    lore: `${state.activeLoreCategory} 문서 추가`,
    builder: "페이지 섹션 추가",
    gallery: "이미지 업로드",
    embed: "임베드 저장",
    notes: `${state.activeNoteCategory} 추가`,
    settings: "설정 저장",
  };
  $(".fab").setAttribute("aria-label", labels[state.activeView] || "빠른 추가");
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
  state.characters.forEach((item) => {
    list.append(renderContentCard("characters", item, true));
  });
}

function renderLore() {
  $("#loreTitle").textContent = `세계관 · ${state.activeLoreCategory}`;
  renderPills($("#loreCategoryPills"), state.loreCategories, state.activeLoreCategory, (category) => {
    state.activeLoreCategory = category;
    renderAll();
    persist("카테고리 선택됨");
  });

  const list = $("#loreList");
  list.innerHTML = "";
  state.lore
    .filter((item) => item.category === state.activeLoreCategory)
    .forEach((item) => list.append(renderContentCard("lore", item)));
}

function renderNotes() {
  $("#notesTitle").textContent = state.activeNoteCategory;
  const list = $("#noteList");
  list.querySelectorAll(".editable-note").forEach((note) => note.remove());
  state.notes
    .filter((note) => state.activeNoteCategory === "아이디어 노트" || note.category === state.activeNoteCategory)
    .forEach((note) => list.prepend(renderNoteCard(note)));
}

function renderGallery() {
  renderPills($("#galleryPills"), state.galleryCategories, state.activeGalleryCategory, (category) => {
    state.activeGalleryCategory = category;
    renderAll();
    persist("갤러리 분류 선택됨");
  });

  $$(".gallery-item").forEach((item) => item.remove());
  const grid = $("#galleryGrid");
  state.gallery
    .filter((item) => item.category === state.activeGalleryCategory)
    .forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "gallery-item";
      wrapper.dataset.id = item.id;
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.title;
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "삭제";
      del.addEventListener("click", () => {
        state.gallery = state.gallery.filter((image) => image.id !== item.id);
        renderGallery();
        persist("이미지 삭제됨");
      });
      wrapper.append(img, del);
      grid.prepend(wrapper);
    });
}

function renderBuilder() {
  $$(".builder-block", $("#builderCanvas")).forEach((block) => block.remove());
  state.builderBlocks.forEach((block) => {
    const el = document.createElement("div");
    el.className = "floating-section builder-block";
    el.draggable = true;
    el.dataset.id = block.id;
    el.innerHTML = `<strong contenteditable="true" data-field="title">${escapeHTML(block.title)}</strong><p contenteditable="true" data-field="body">${escapeHTML(block.body)}</p>`;
    $("#builderCanvas").append(el);
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
    img.alt = item.title;
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
  const tags = document.createElement("div");
  tags.className = "tag-row";
  (item.tags || "#로컬저장").split(" ").forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    tags.append(span);
  });

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "삭제";
  remove.addEventListener("click", () => {
    state[collection] = state[collection].filter((entry) => entry.id !== item.id);
    renderAll();
    persist("삭제됨");
  });
  actions.append(remove);
  card.append(meta, title, body, tags, actions);
  return card;
}

function renderNoteCard(note) {
  const card = document.createElement("article");
  card.className = "note-card editable-note";
  card.dataset.id = note.id;
  card.dataset.collection = "notes";
  card.innerHTML = `
    <span>${escapeHTML(note.category)}</span>
    <h3 contenteditable="true" data-field="title">${escapeHTML(note.title)}</h3>
    <p contenteditable="true" data-field="body">${escapeHTML(note.body)}</p>
    <div class="note-meta">로컬 저장 · ${new Date(note.updatedAt).toLocaleDateString("ko-KR")}</div>
  `;
  const del = document.createElement("button");
  del.className = "delete-note";
  del.type = "button";
  del.textContent = "삭제";
  del.addEventListener("click", () => {
    state.notes = state.notes.filter((entry) => entry.id !== note.id);
    renderNotes();
    persist("문서 삭제됨");
  });
  card.append(del);
  return card;
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
  modalCategory.innerHTML = "";
  categories.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    option.selected = name === category;
    modalCategory.append(option);
  });
  modalName.value = "";
  modalBody.value = "";
  itemModal.showModal();
  modalName.focus();
}

function createItem(mode, title, category, body) {
  const item = {
    id: uid(mode),
    title,
    category,
    body,
    tags: mode === "characters" ? "#새캐릭터" : "#새문서",
    updatedAt: new Date().toISOString(),
  };
  if (mode === "characters") {
    item.image = "./assets/portrait-elia.png";
    state.characters.unshift(item);
    state.activeView = "characters";
  }
  if (mode === "lore") {
    state.lore.unshift(item);
    state.activeLoreCategory = category;
    state.activeView = "lore";
  }
  if (mode === "notes") {
    state.notes.unshift(item);
    state.activeNoteCategory = category;
    state.activeView = "notes";
  }
  showView(state.activeView);
  renderAll();
  persist("새 항목 생성됨");
}

function addCategory(kind) {
  const name = prompt("새 카테고리 이름을 입력하세요.");
  if (!name) return;
  const clean = name.trim();
  if (!clean) return;
  const key = kind === "lore" ? "loreCategories" : kind === "gallery" ? "galleryCategories" : "noteCategories";
  if (!state[key].includes(clean)) state[key].push(clean);
  if (kind === "lore") state.activeLoreCategory = clean;
  if (kind === "gallery") state.activeGalleryCategory = clean;
  if (kind === "notes") state.activeNoteCategory = clean;
  renderAll();
  persist("카테고리 추가됨");
}

function removeCategory(kind) {
  const key = kind === "lore" ? "loreCategories" : kind === "gallery" ? "galleryCategories" : "noteCategories";
  const activeKey = kind === "lore" ? "activeLoreCategory" : kind === "gallery" ? "activeGalleryCategory" : "activeNoteCategory";
  const protectedNames = ["지역", "아이디어 노트", "이미지 레퍼런스"];
  const current = state[activeKey];
  if (protectedNames.includes(current)) {
    showToast("기본 카테고리는 삭제하지 않았어요");
    return;
  }
  state[key] = state[key].filter((name) => name !== current);
  state[activeKey] = state[key][0];
  renderAll();
  persist("카테고리 삭제됨");
}

function handleUpload(files, target) {
  [...files].forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (target === "gallery") {
        state.gallery.unshift({
          id: uid("image"),
          title: file.name,
          category: state.activeGalleryCategory,
          src: reader.result,
          updatedAt: new Date().toISOString(),
        });
        renderGallery();
      }
      if (target === "character") {
        const character = state.characters[0];
        if (character) character.image = reader.result;
        renderCharacters();
      }
      if (target === "builder") {
        const banner = $(".canvas-hero img");
        banner.src = reader.result;
      }
      persist("이미지 업로드됨");
    };
    reader.readAsDataURL(file);
  });
}

function performFabAction() {
  const view = state.activeView;
  if (view === "characters") return openModal("characters", "캐릭터");
  if (view === "lore") return openModal("lore", state.activeLoreCategory);
  if (view === "builder") return addBuilderBlock();
  if (view === "gallery") return $("#galleryUpload").click();
  if (view === "embed") return persist("임베드 저장됨");
  if (view === "settings") return persist("설정 저장됨");
  return openModal("notes", state.activeNoteCategory);
}

function addBuilderBlock() {
  state.builderBlocks.push({
    id: uid("block"),
    title: "새 페이지 섹션",
    body: "내용을 클릭해서 편집하세요.",
  });
  renderBuilder();
  persist("섹션 추가됨");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function renderAll() {
  renderTree();
  renderCharacters();
  renderLore();
  renderNotes();
  renderGallery();
  renderBuilder();
  updateFabLabel();
}

navItems.forEach((item) => item.addEventListener("click", () => showView(item.dataset.view)));
$("#openSidebar").addEventListener("click", () => sidebar.classList.add("open"));
$("#closeSidebar").addEventListener("click", () => sidebar.classList.remove("open"));
$("#newDocument").addEventListener("click", () => performFabAction());
$(".fab").addEventListener("click", performFabAction);
$("#addCharacter").addEventListener("click", () => openModal("characters", "캐릭터"));
$("#uploadCharacterImage").addEventListener("click", () => $("#characterImageInput").click());
$("#characterImageInput").addEventListener("change", (event) => handleUpload(event.target.files, "character"));
$("#addLore").addEventListener("click", () => openModal("lore", state.activeLoreCategory));
$("#addLoreCategory").addEventListener("click", () => addCategory("lore"));
$("#removeLoreCategory").addEventListener("click", () => removeCategory("lore"));
$("#addCategory").addEventListener("click", () => addCategory(state.activeView === "gallery" ? "gallery" : state.activeView === "lore" ? "lore" : "notes"));
$("#deleteCategory").addEventListener("click", () => removeCategory(state.activeView === "gallery" ? "gallery" : state.activeView === "lore" ? "lore" : "notes"));
$("#uploadImage").addEventListener("click", () => $("#galleryUpload").click());
$("#galleryUpload").addEventListener("change", (event) => handleUpload(event.target.files, "gallery"));
$("#addFolder").addEventListener("click", () => addCategory("gallery"));
$("#addTag").addEventListener("click", () => addCategory("gallery"));
$("#newMoodboard").addEventListener("click", () => {
  if (!state.galleryCategories.includes("무드보드")) state.galleryCategories.push("무드보드");
  state.activeGalleryCategory = "무드보드";
  renderAll();
  persist("무드보드 준비됨");
});
$("#newNoteInline").addEventListener("click", () => openModal("notes", state.activeNoteCategory));
$("#newScenarioDraft").addEventListener("click", () => openModal("notes", "시나리오 초안"));
$("#newPrivateMemo").addEventListener("click", () => openModal("notes", "비공개 메모"));
$("#clearDrafts").addEventListener("click", () => {
  state.notes = [];
  renderNotes();
  persist("로컬 문서 비움");
});
$("#visibilityButton").addEventListener("click", () => {
  state.visibility = state.visibility === "비공개" ? "링크 공개" : state.visibility === "링크 공개" ? "전체 공개" : "비공개";
  $("#visibilityButton").textContent = state.visibility;
  persist(`공개 범위 · ${state.visibility}`);
});
$("#closeModal").addEventListener("click", () => itemModal.close());
$("#cancelModal").addEventListener("click", () => itemModal.close());
itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createItem(modalMode, modalName.value.trim() || "무제", modalCategory.value, modalBody.value.trim() || "내용을 입력하세요.");
  itemModal.close();
});

$("#categoryTree").addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  event.preventDefault();
  if (link.dataset.type === "lore") state.activeLoreCategory = link.dataset.category;
  if (link.dataset.type === "note") state.activeNoteCategory = link.dataset.category;
  if (link.dataset.type === "gallery") state.activeGalleryCategory = link.dataset.category;
  showView(link.dataset.view);
  renderAll();
});

document.addEventListener("input", (event) => {
  saveState.textContent = "저장 중...";
  const editable = event.target.closest("[contenteditable='true']");
  if (!editable) return;
  const card = editable.closest("[data-collection]");
  if (card) {
    const collection = card.dataset.collection;
    const item = state[collection].find((entry) => entry.id === card.dataset.id);
    if (item) {
      item[editable.dataset.field] = editable.textContent.trim();
      item.updatedAt = new Date().toISOString();
      persist("자동 저장됨");
    }
  }
  const block = editable.closest(".builder-block");
  if (block) {
    const item = state.builderBlocks.find((entry) => entry.id === block.dataset.id);
    if (item) {
      item[editable.dataset.field] = editable.textContent.trim();
      persist("페이지 섹션 저장됨");
    }
  }
});

$("#searchInput").addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  $$(".content-card, .editable-note, .gallery-item").forEach((card) => {
    card.style.display = card.textContent.toLowerCase().includes(query) || !query ? "" : "none";
  });
});

$(".builder-tools").addEventListener("click", (event) => {
  const action = event.target.dataset.builderAction;
  if (!action) return;
  if (action === "section") addBuilderBlock();
  if (action === "banner") $("#builderBannerInput").click();
  if (action === "font") $("#builderCanvas").style.fontFamily = '"Noto Serif KR", serif';
  if (action === "palette") $("#builderCanvas").style.backgroundColor = "rgba(184, 168, 155, 0.12)";
  if (action === "motion") {
    $$(".floating-section", $("#builderCanvas")).forEach((block) => block.animate([{ transform: "translateY(0)" }, { transform: "translateY(-8px)" }, { transform: "translateY(0)" }], 620));
  }
  persist("페이지 빌더 변경됨");
});
$("#builderBannerInput").addEventListener("change", (event) => handleUpload(event.target.files, "builder"));

function updateEmbedPreview() {
  const embedPreview = $("#embedPreview");
  const embedCode = $("#embedCode");
  embedPreview.srcdoc = `<!doctype html><html lang="ko"><meta charset="UTF-8"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f5f2;color:#1d1d1f;font-family:system-ui,sans-serif}.custom-widget{width:min(78%,420px);border:1px solid rgba(20,20,24,.12);border-radius:8px;padding:28px;background:#fff;box-shadow:0 18px 50px rgba(18,20,25,.09)}p{color:#767676;line-height:1.7}</style><body>${embedCode.value}</body></html>`;
}
$("#embedCode").addEventListener("input", () => {
  updateEmbedPreview();
  persist("임베드 저장됨");
});
updateEmbedPreview();

let draggedWidget;
$("#widgetGrid").addEventListener("dragstart", (event) => {
  draggedWidget = event.target.closest(".widget");
  if (draggedWidget) draggedWidget.style.opacity = "0.48";
});
$("#widgetGrid").addEventListener("dragend", () => {
  if (draggedWidget) draggedWidget.style.opacity = "1";
  draggedWidget = null;
});
$("#widgetGrid").addEventListener("dragover", (event) => {
  event.preventDefault();
  const target = event.target.closest(".widget");
  if (!draggedWidget || !target || target === draggedWidget) return;
  const box = target.getBoundingClientRect();
  $("#widgetGrid").insertBefore(draggedWidget, event.clientY > box.top + box.height / 2 ? target.nextSibling : target);
});

$("#visibilityButton").textContent = state.visibility;
showView(state.activeView);
renderAll();
