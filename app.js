const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const sidebar = document.querySelector("#sidebar");
const openSidebar = document.querySelector("#openSidebar");
const closeSidebar = document.querySelector("#closeSidebar");
const saveState = document.querySelector("#saveState");
const embedCode = document.querySelector("#embedCode");
const embedPreview = document.querySelector("#embedPreview");
const widgetGrid = document.querySelector("#widgetGrid");

function showView(id) {
  views.forEach((view) => view.classList.toggle("active-view", view.id === id));
  navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === id));
  sidebar.classList.remove("open");
}

navItems.forEach((item) => {
  item.addEventListener("click", () => showView(item.dataset.view));
});

document.querySelectorAll(".tree a").forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = event.currentTarget.getAttribute("href").replace("#", "");
    if (document.getElementById(id)) {
      event.preventDefault();
      showView(id);
    }
  });
});

openSidebar.addEventListener("click", () => sidebar.classList.add("open"));
closeSidebar.addEventListener("click", () => sidebar.classList.remove("open"));

let saveTimer;
document.addEventListener("input", () => {
  saveState.textContent = "저장 중...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveState.textContent = "자동 저장됨";
  }, 700);
});

function updateEmbedPreview() {
  const safeFrame = `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f6f5f2;
            color: #1d1d1f;
            font-family: "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif;
          }
          .custom-widget {
            width: min(78%, 420px);
            border: 1px solid rgba(20, 20, 24, 0.12);
            border-radius: 8px;
            padding: 28px;
            background: #fff;
            box-shadow: 0 18px 50px rgba(18, 20, 25, 0.09);
          }
          h2 { margin: 0 0 10px; }
          p { color: #767676; line-height: 1.7; }
        </style>
      </head>
      <body>${embedCode.value}</body>
    </html>`;

  embedPreview.srcdoc = safeFrame;
}

embedCode.addEventListener("input", updateEmbedPreview);
updateEmbedPreview();

let draggedWidget;

widgetGrid.addEventListener("dragstart", (event) => {
  draggedWidget = event.target.closest(".widget");
  if (draggedWidget) {
    draggedWidget.style.opacity = "0.48";
  }
});

widgetGrid.addEventListener("dragend", () => {
  if (draggedWidget) {
    draggedWidget.style.opacity = "1";
  }
  draggedWidget = null;
});

widgetGrid.addEventListener("dragover", (event) => {
  event.preventDefault();
  const target = event.target.closest(".widget");
  if (!draggedWidget || !target || target === draggedWidget) return;

  const targetBox = target.getBoundingClientRect();
  const shouldPlaceAfter = event.clientY > targetBox.top + targetBox.height / 2;
  widgetGrid.insertBefore(draggedWidget, shouldPlaceAfter ? target.nextSibling : target);
});

document.querySelector(".fab").addEventListener("click", () => {
  showView("notes");
  const firstNote = document.querySelector(".note-list article");
  firstNote.animate(
    [
      { transform: "translateY(0)", boxShadow: "var(--shadow)" },
      { transform: "translateY(-4px)", boxShadow: "0 24px 70px rgba(143, 155, 179, 0.22)" },
      { transform: "translateY(0)", boxShadow: "var(--shadow)" },
    ],
    { duration: 520, easing: "ease-out" },
  );
});
