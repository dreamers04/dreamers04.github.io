const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const storeKey = "archive-yuwol-workspace-v4"; // 캐시 충돌 방지를 위해 키 업데이트
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
let draggedBlock = null; // 빌더 드래그 앤 드롭을 위한 전역 변수

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

// 세계관 렌더링
function renderLore() {
  $("#loreTitle").textContent = `세계관 · ${state.activeLoreCategory}`;
  renderPills($("#loreCategoryPills"), state.loreCategories, state.activeLoreCategory, (category) => {
    state.activeLoreCategory = category;
    state.activeLoreId = null; 
    renderAll();
  });
  
  const list = $("#loreList");
  list.innerHTML = "";
  const filteredLore = state.lore.filter((item) => item.category === state.activeLoreCategory);

  if (!state.activeLoreId && filteredLore.length > 0) {
    state.activeLoreId = filteredLore[0].id;
  }

  filteredLore.forEach((item) => {
    const card = renderContentCard("lore", item);
    card.style.cursor = "pointer";
    if (item.id === state.activeLoreId) {
      card.style.borderColor = "var(--text)";
      card.style.boxShadow = "0 0 0 1px var(--text)";
    }
    
    card.addEventListener("click", (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('.card-actions')) return;
      state.activeLoreId = item.id;
      renderLore(); 
    });
    list.append(card);
  });

  const editor = $(".document");
  const activeItem = state.lore.find(i => i.id === state.activeLoreId);

  if (activeItem) {
    editor.dataset.id = activeItem.id;
    editor.dataset.collection = "lore";
    editor.innerHTML = `
      <p class="doc-category">세계관 / ${escapeHTML(activeItem.category)}</p>
      <h3 contenteditable="true" data-field="title">${escapeHTML(activeItem.title)}</h3>
      <div class="doc-body" contenteditable="true" data-field="body" style="outline:none; min-height:100px;">${activeItem.body}</div>
    `;
  } else {
    editor.removeAttribute("data-id");
    editor.removeAttribute("data-collection");
    editor.innerHTML = `<p style="color:var(--muted); text-align:center; padding: 40px 0;">이 카테고리에 등록된 문서가 없습니다. 새 문서를 추가해주세요.</p>`;
  }
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

// 개선된 빌더 렌더링 (Drag & Drop 및 삭제 기능 완벽 적용)
function renderBuilder() {
  const canvas = $("#builderCanvas");
  $$(".builder-block", canvas).forEach((block) => block.remove());
  
  state.builderBlocks.forEach((block) => {
    const el = document.createElement("div");
    el.className = "floating-section builder-block";
    el.draggable = true;
    el.dataset.id = block.id;
    
    // 블록 구조화 및 삭제 버튼 추가
    el.innerHTML = `
      <button class="delete-block-btn" aria-label="섹션 삭제" style="position: absolute; right: 10px; top: 10px; background: transparent; border: none; font-size: 14px; color: var(--muted); cursor: pointer; padding: 4px;">✕</button>
      <strong contenteditable="true" data-field="title">${escapeHTML(block.title)}</strong>
      <p contenteditable="true" data-field="body" style="margin-bottom: 0;">${escapeHTML(block.body)}</p>
    `;

    // 삭제 이벤트 연결
    el.querySelector(".delete-block-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      state.builderBlocks = state.builderBlocks.filter(b => b.id !== block.id);
      renderBuilder();
      persist("섹션 삭제됨");
    });
    
    // --- 드래그 앤 드롭 이벤트 ---
    el.addEventListener("dragstart", function(e) {
      draggedBlock = this;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", block.id); // 파이어폭스 호환성
      setTimeout(() => this.style.opacity = "0.4", 0);
    });

    el.addEventListener("dragover", function(e) {
      e.preventDefault(); // 드롭을 허용하기 위해 필수
      e.dataTransfer.dropEffect = "move";
      this.style.borderTop = "3px solid var(--text)"; // 드롭 위치 시각적 가이드
      return false;
    });

    el.addEventListener("dragleave", function(e) {
      this.style.borderTop = ""; // 마우스가 떠나면 가이드 제거
    });

    el.addEventListener("drop", function(e) {
      e.stopPropagation();
      this.style.borderTop = ""; // 가이드 제거

      if (draggedBlock !== this && draggedBlock) {
        const blocksArray = Array.from(canvas.querySelectorAll(".builder-block"));
        const draggedIndex = blocksArray.indexOf(draggedBlock);
        const targetIndex = blocksArray.indexOf(this);

        // state.builderBlocks 배열 순서 교체
        const movedItem = state.builderBlocks.splice(draggedIndex, 1)[0];
        state.builderBlocks.splice(targetIndex, 0, movedItem);

        renderBuilder();
        persist("섹션 순서 변경됨");
      }
      return false;
    });

    el.addEventListener("dragend", function() {
      this.style.opacity = "1";
      $$(".builder-block", canvas).forEach(b => b.style.borderTop = ""); // 모든 가이드 초기화
      draggedBlock = null;
    });

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
  const body = document.createElement("div");
  
  if(collection === "lore") {
      body.innerHTML = item.body;
      body.style.display = "none";
  } else {
      body.contentEditable = "true";
      body.dataset.field = "body";
      body.innerHTML = item.body;
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const remove = document.createElement("button");
  remove.textContent = "삭제";
  remove.onclick = (e) => { 
      e.stopPropagation();
      state[collection] = state[collection].filter(entry => entry.id !== item.id); 
      if(state.activeLoreId === item.id) state.activeLoreId = null;
      renderAll(); 
      persist("삭제됨"); 
  };
  actions.append(remove);

  card.append(meta, title);
  if(collection !== "lore") card.append(body);
  card.append(actions);
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
  $("#blankBody").innerHTML = "";
  $("#blankTitle").focus();
  showToast("새로운 빈 문서를 열었습니다.");
}

function saveBlankDocument(category = "아이디어 노트") {
  const title = $("#blankTitle").textContent.trim() || "제목 없음";
  const body = $("#blankBody").innerHTML; 
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
  const richBody = body.replace(/\n/g, '<br>');
  const item = { id: uid(mode), title, category, body: richBody, updatedAt: new Date().toISOString() };
  if (mode === "characters") { item.image = "./assets/portrait-elia.png"; state.characters.unshift(item); }
  else if (mode === "lore") { state.lore.unshift(item); state.activeLoreCategory = category; state.activeLoreId = item.id; }
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
  if(!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[m]);
}

const execCmd = (command, value = null) => document.execCommand(command, false, value);

function insertHtmlAtCursor(html) {
  const sel = window.getSelection();
  if (sel.getRangeAt && sel.rangeCount) {
    let range = sel.getRangeAt(0);
    if (!range.commonAncestorContainer.closest('.doc-body')) return;
    range.deleteContents();
    let el = document.createElement("div");
    el.innerHTML = html;
    let frag = document.createDocumentFragment(), node, lastNode;
    while ( (node = el.firstChild) ) {
      lastNode = frag.appendChild(node);
    }
    range.insertNode(frag);
    if (lastNode) {
      range = range.cloneRange();
      range.setStartAfter(lastNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
}

$$('.editor-toolbar button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const action = btn.textContent.trim();
    
    const docBody = $('.doc-body');
    if(docBody && !docBody.contains(document.activeElement)) {
        docBody.focus();
    }

    if (action === 'B') execCmd('bold');
    else if (action === 'I') execCmd('italic');
    else if (action === '표') insertHtmlAtCursor('<div class="table-like" contenteditable="false"><span contenteditable="true">새 속성</span><strong contenteditable="true">내용</strong></div><br>');
    else if (action === '인용') insertHtmlAtCursor('<blockquote contenteditable="true">인용구 입력...</blockquote><br>');
    else if (action === '접기') insertHtmlAtCursor('<details open contenteditable="false"><summary contenteditable="true">새 항목 (클릭하여 수정)</summary><p contenteditable="true">상세 내용...</p></details><br>');
    
    if (docBody) {
        docBody.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
});

// --- Event Listeners ---
navItems.forEach((item) => item.addEventListener("click", () => showView(item.dataset.view)));
$("#openSidebar").addEventListener("click", () => sidebar.classList.add("open"));
$("#closeSidebar").addEventListener("click", () => sidebar.classList.remove("open"));

$("#newDocument").addEventListener("click", openBlankDocument);
$(".fab").addEventListener("click", performFabAction);
$("#saveBlankDocument").addEventListener("click", () => saveBlankDocument("아이디어 노트"));
$("#blankToScenario").addEventListener("click", () => saveBlankDocument("시나리오 초안"));
$("#blankToMemo").addEventListener("click", () => saveBlankDocument("비공개 메모"));

$("#closeModal").addEventListener("click", closeItemModal);
$("#cancelModal").addEventListener("click", closeItemModal);
itemForm.addEventListener("submit", (e) => {
  e.preventDefault();
  createItem(modalMode, modalName.value.trim() || "무제", modalCategory.value, modalBody.value.trim());
  closeItemModal();
});

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

$("#addCharacter").onclick = () => openModal("characters", "캐릭터");
$("#addLore").onclick = () => openModal("lore", state.activeLoreCategory);
$("#newNoteInline").onclick = () => openModal("notes", state.activeNoteCategory);
$("#newScenarioDraft").onclick = () => openModal("notes", "시나리오 초안");
$("#newPrivateMemo").onclick = () => openModal("notes", "비공개 메모");

$("#uploadCharacterImage").onclick = () => $("#characterImageInput").click();
$("#characterImageInput").onchange = (e) => handleUpload(e.target.files, "character");
$("#uploadImage").onclick = () => $("#galleryUpload").click();
$("#galleryUpload").onchange = (e) => handleUpload(e.target.files, "gallery");
$(".builder-tools").addEventListener("click", (e) => {
  const a = e.target.dataset.builderAction;
  if(a === "section") { state.builderBlocks.push({ id: uid("block"), title: "새 섹션", body: "수정하세요" }); renderBuilder(); persist("섹션 추가됨"); }
  else if(a === "banner") $("#builderBannerInput").click();
});
$("#builderBannerInput").onchange = (e) => handleUpload(e.target.files, "builder");

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

document.addEventListener("input", (e) => {
  saveState.textContent = "저장 중...";
  const edit = e.target.closest("[contenteditable='true']");
  if (!edit) return;
  
  const card = edit.closest("[data-collection]");
  if (card) {
    const collection = card.dataset.collection;
    const item = state[collection].find(i => i.id === card.dataset.id);
    if (item) { 
        item[edit.dataset.field] = edit.dataset.field === 'body' ? edit.innerHTML : edit.textContent.trim(); 
        item.updatedAt = new Date().toISOString();
        persist("자동 저장됨"); 
    }
  }
  const block = edit.closest(".builder-block");
  if (block) {
    const item = state.builderBlocks.find(i => i.id === block.dataset.id);
    if (item) { 
        item[edit.dataset.field] = edit.textContent.trim(); 
        persist("페이지 저장됨"); 
    }
  }
});

// Initialize
showView(state.activeView);
renderAll();
