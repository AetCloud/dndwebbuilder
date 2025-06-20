document.addEventListener("DOMContentLoaded", () => {
  let project = {
    pages: [],
    activePageIndex: 0,
    settings: {
      title: "My Awesome Site",
    },
    headerComponents: [],
    footerComponents: [],
  };

  let selectedComponentId = null;

  const sidebarToggle = document.getElementById("sidebar-toggle");
  const settingsToggle = document.getElementById("settings-toggle");
  const pageTabsContainer = document.getElementById("page-tabs");
  const canvasWrapper = document.getElementById("canvas-wrapper");
  const propertiesPanel = document.getElementById("properties-panel");
  const settingsPanel = document.getElementById("settings-panel");
  const saveStatus = document.getElementById("save-status");

  function init() {
    loadProject();
    if (project.pages.length === 0) {
      addNewPage();
    }
    initComponents();
    initToggles();
    initSettingsPanel();
    renderAll();
  }

  function addNewPage() {
    const newPageName = `Page ${project.pages.length + 1}`;
    project.pages.push({
      id: `page-${crypto.randomUUID()}`,
      name: newPageName,
      components: [],
      settings: {
        backgroundColor: "#FFFFFF",
        padding: "20px",
        justifyContent: "flex-start",
      },
    });
    project.activePageIndex = project.pages.length - 1;
  }

  function saveProject() {
    try {
      localStorage.setItem("siteBuilderProjectV4", JSON.stringify(project));
      saveStatus.textContent = `Saved: ${new Date().toLocaleTimeString()}`;
      setTimeout(() => (saveStatus.textContent = ""), 3000);
    } catch (e) {
      console.error("Failed to save project:", e);
      saveStatus.textContent = "Error saving project!";
    }
  }

  function loadProject() {
    const savedProject = localStorage.getItem("siteBuilderProjectV4");
    if (savedProject) {
      project = JSON.parse(savedProject);
    }
  }

  function initToggles() {
    sidebarToggle.addEventListener("click", () =>
      document.getElementById("sidebar").classList.toggle("collapsed")
    );
    settingsToggle.addEventListener("click", () =>
      settingsPanel.classList.toggle("open")
    );
  }

  function initSettingsPanel() {
    document.getElementById("setting-title").value = project.settings.title;
    document.getElementById("setting-title").addEventListener("input", (e) => {
      project.settings.title = e.target.value;
      document.getElementById("page-title").textContent =
        project.settings.title;
    });

    document.getElementById("save-btn").addEventListener("click", saveProject);
    document.getElementById("load-btn").addEventListener("click", () => {
      if (confirm("Loading will overwrite any unsaved changes. Continue?")) {
        loadProject();
        initSettingsPanel();
        renderAll();
      }
    });
    document.getElementById("export-btn").addEventListener("click", () => {});
  }

  function initComponents() {
    document.querySelectorAll(".draggable-component").forEach((comp) => {
      comp.addEventListener("dragstart", (e) =>
        e.dataTransfer.setData("text/plain", comp.dataset.type)
      );
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const closestDropzone = e.target.closest(".dropzone");
    if (closestDropzone) {
      closestDropzone.classList.remove("drag-over");
    }

    const type = e.dataTransfer.getData("text/plain");

    if (type === "page") {
      addNewPage();
      renderAll();
      return;
    }

    const newComp = createComponent(type);

    if (closestDropzone) {
      const parentId = closestDropzone.dataset.parentId;
      const columnIndex = closestDropzone.dataset.columnIndex;
      const isHeader = closestDropzone.id === "header-dropzone";
      const isFooter = closestDropzone.id === "footer-dropzone";

      if (isHeader) {
        project.headerComponents.push(newComp);
      } else if (isFooter) {
        project.footerComponents.push(newComp);
      } else if (parentId) {
        const parentComp = findComponent(
          parentId,
          project.pages[project.activePageIndex].components
        );
        if (parentComp && parentComp.columns) {
          parentComp.columns[columnIndex].push(newComp);
        }
      } else {
        project.pages[project.activePageIndex].components.push(newComp);
      }
    }
    renderAll();
  }

  function createComponent(type) {
    const base = {
      id: `comp-${crypto.randomUUID()}`,
      type: type,
      styles: {
        padding: "10px",
        margin: "10px 0",
        borderRadius: "0px",
        border: "0px solid #000000",
        boxShadow: "none",
      },
    };
    switch (type) {
      case "container-1col":
      case "container-2col":
      case "container-3col":
        const colCount = parseInt(type.split("-")[1]);
        return {
          ...base,
          type: "container",
          columns: Array.from({ length: colCount }, () => []),
          styles: {
            ...base.styles,
            display: "flex",
            gap: "1rem",
            alignItems: "flex-start",
          },
        };
      case "text":
        return {
          ...base,
          content: "Editable Text Block",
          styles: { ...base.styles, color: "#000000", textAlign: "left" },
        };
      case "button":
        return {
          ...base,
          content: "Click Me",
          href: "#",
          styles: {
            ...base.styles,
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            textDecoration: "none",
          },
        };
      case "image":
        return {
          ...base,
          src: "https://placehold.co/300x200",
          styles: { ...base.styles, maxWidth: "100%", height: "auto" },
        };
      case "spacer":
        return {
          ...base,
          styles: { height: "50px", padding: "0", margin: "0" },
        };
      default:
        throw new Error(`Unknown component type: ${type}`);
    }
  }

  function findComponent(id, componentArray) {
    for (const component of componentArray) {
      if (component.id === id) return component;
      if (component.columns) {
        for (const col of component.columns) {
          const found = findComponent(id, col);
          if (found) return found;
        }
      }
    }
    return null;
  }

  function renderAll() {
    renderPageTabs();
    const activePage = project.pages[project.activePageIndex];
    if (!activePage) return;

    canvasWrapper.innerHTML = `<div id="canvas-${activePage.id}" class="canvas dropzone"></div>`;
    const canvas = document.getElementById(`canvas-${activePage.id}`);
    const pageSettings = activePage.settings;
    canvas.style.backgroundColor = pageSettings.backgroundColor;
    canvas.style.padding = pageSettings.padding;
    canvas.style.justifyContent = pageSettings.justifyContent;

    activePage.components.forEach((comp) => renderComponent(comp, canvas));

    initAllDropzones();
    renderPropertiesPanel(null);
  }

  function renderComponent(component, parentElement) {
    const el = createDOMElement(component);

    if (component.type === "container" && component.columns) {
      component.columns.forEach((column, index) => {
        const colEl = document.createElement("div");
        colEl.className = "column-dropzone dropzone";
        colEl.dataset.parentId = component.id;
        colEl.dataset.columnIndex = index;
        column.forEach((childComp) => renderComponent(childComp, colEl));
        el.appendChild(colEl);
      });
    }

    parentElement.appendChild(el);
  }

  function createDOMElement(component) {
    let el;
    switch (component.type) {
      case "text":
        el = document.createElement("p");
        el.textContent = component.content;
        break;
      case "button":
        el = document.createElement("a");
        el.textContent = component.content;
        el.href = component.href;
        el.style.display = "inline-block";
        break;
      case "image":
        el = document.createElement("img");
        el.src = component.src;
        break;
      case "container":
        el = document.createElement("div");
        el.className = "multi-column-container";
        break;
      case "spacer":
        el = document.createElement("div");
        break;
      default:
        el = document.createElement("div");
    }

    el.className += " editable-component";
    el.dataset.id = component.id;
    Object.assign(el.style, component.styles);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedComponentId = component.id;
      document
        .querySelectorAll(".selected")
        .forEach((s) => s.classList.remove("selected"));
      e.currentTarget.classList.add("selected");
      renderPropertiesPanel(component);
    });
    return el;
  }

  function renderPageTabs() {
    pageTabsContainer.innerHTML = "";
    project.pages.forEach((page, index) => {
      const tab = document.createElement("div");
      tab.className = "page-tab";
      if (index === project.activePageIndex) tab.classList.add("active");
      tab.textContent = page.name;
      tab.addEventListener("click", () => {
        project.activePageIndex = index;
        selectedComponentId = null;
        renderAll();
      });
      pageTabsContainer.appendChild(tab);
    });
  }

  function initAllDropzones() {
    document.querySelectorAll(".dropzone").forEach((el) => {
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add("drag-over");
      });
      el.addEventListener("dragleave", (e) => {
        e.stopPropagation();
        e.currentTarget.classList.remove("drag-over");
      });
      el.addEventListener("drop", handleDrop);
    });
  }

  function renderPropertiesPanel(component) {
    propertiesPanel.innerHTML = "";
    const targetComponent =
      component ||
      findComponent(
        selectedComponentId,
        project.pages[project.activePageIndex].components
      );

    if (!targetComponent) {
      const page = project.pages[project.activePageIndex];
      propertiesPanel.innerHTML = `
                <h3 class="text-xl font-bold mb-4">Page: ${page.name}</h3>
                ${createPropInput(page, "name", "Page Name", "text", "page")}
                ${createPropInput(
                  page.settings,
                  "backgroundColor",
                  "Background Color",
                  "color"
                )}
                ${createPropInput(
                  page.settings,
                  "padding",
                  "Padding (e.g., 20px 40px)",
                  "text"
                )}
                ${createPropSelect(
                  page.settings,
                  "justifyContent",
                  "Content Align",
                  ["flex-start", "center", "flex-end"],
                  "page"
                )}
            `;
    } else {
      let propsHtml = `<h3 class="text-xl font-bold mb-4 capitalize">${targetComponent.type} Component</h3>`;
      if (targetComponent.hasOwnProperty("content"))
        propsHtml += createPropInput(
          targetComponent,
          "content",
          "Content",
          "text"
        );
      if (targetComponent.hasOwnProperty("href"))
        propsHtml += createPropInput(
          targetComponent,
          "href",
          "Link URL",
          "text"
        );
      if (targetComponent.type === "container") {
        propsHtml += createPropSelect(
          targetComponent,
          "columns",
          "Columns",
          [1, 2, 3, 4],
          "columns"
        );
      }

      propsHtml += `<h4 class="text-lg font-semibold mt-4 pt-4 border-t border-gray-700">Styling</h4>`;
      if (targetComponent.styles.hasOwnProperty("textAlign"))
        propsHtml += createPropSelect(
          targetComponent.styles,
          "textAlign",
          "Text Align",
          ["left", "center", "right"]
        );
      propsHtml += createPropInput(
        targetComponent.styles,
        "margin",
        "Margin",
        "text"
      );
      propsHtml += createPropInput(
        targetComponent.styles,
        "padding",
        "Padding",
        "text"
      );
      propsHtml += createPropInput(
        targetComponent.styles,
        "borderRadius",
        "Corner Radius (e.g., 8px)",
        "text"
      );
      propsHtml += createPropInput(
        targetComponent.styles,
        "border",
        "Border (e.g., 1px solid #ccc)",
        "text"
      );
      propsHtml += createPropInput(
        targetComponent.styles,
        "boxShadow",
        "Box Shadow",
        "text"
      );
      if (targetComponent.styles.hasOwnProperty("backgroundColor"))
        propsHtml += createPropInput(
          targetComponent.styles,
          "backgroundColor",
          "Background Color",
          "color"
        );
      if (targetComponent.styles.hasOwnProperty("color"))
        propsHtml += createPropInput(
          targetComponent.styles,
          "color",
          "Text Color",
          "color"
        );
      if (targetComponent.styles.hasOwnProperty("height"))
        propsHtml += createPropInput(
          targetComponent.styles,
          "height",
          "Height",
          "text"
        );
      propertiesPanel.innerHTML = propsHtml;
    }

    propertiesPanel.querySelectorAll(".prop-input").forEach((input) => {
      const { targetObj, key, reparse } = JSON.parse(input.dataset.meta);
      input.addEventListener("input", (e) => {
        if (reparse === "columns") {
          const newColCount = parseInt(e.target.value);
          const oldColCount = targetObj.columns.length;
          if (newColCount > oldColCount) {
            for (let i = 0; i < newColCount - oldColCount; i++)
              targetObj.columns.push([]);
          } else if (newColCount < oldColCount) {
            const allChildren = targetObj.columns.flat();
            targetObj.columns.length = newColCount;
            targetObj.columns[0] = allChildren;
            for (let i = 1; i < newColCount; i++) targetObj.columns[i] = [];
          }
        } else if (reparse === "page") {
          const page = project.pages.find((p) => p.id === targetObj.id);
          if (page) page[key] = e.target.value;
        } else {
          targetObj[key] = e.target.value;
        }
        renderAll();
      });
    });
  }

  function createPropInput(obj, key, label, type) {
    const meta = { targetObj: obj, key: key };
    return `
            <div class="prop-input-group">
                <label>${label}</label>
                <input type="${type}" value="${
      obj[key] || ""
    }" class="prop-input" data-meta='${JSON.stringify(meta)}'>
            </div>`;
  }

  function createPropSelect(obj, key, label, options, reparse = null) {
    const meta = { targetObj: obj, key: key, reparse: reparse };
    const optionsHtml = options
      .map(
        (o) =>
          `<option value="${o}" ${
            obj[key] == o ? "selected" : ""
          }>${o}</option>`
      )
      .join("");
    return `
            <div class="prop-input-group">
                <label>${label}</label>
                <select class="prop-input" data-meta='${JSON.stringify(
                  meta
                )}'>${optionsHtml}</select>
            </div>`;
  }

  init();
});
