const domainInput = document.getElementById("domainInput");
const addDomainBtn = document.getElementById("addDomain");
const exclusionList = document.getElementById("exclusionList");
const autoCollapse = document.getElementById("autoCollapse");
const removeDuplicates = document.getElementById("removeDuplicates");

const DEFAULT_SETTINGS = {
  autoGroup: true,
  excludedDomains: [],
  autoCollapse: false,
  removeDuplicates: false,
  customRules: [],
};

const rulePattern = document.getElementById("rulePattern");
const ruleName = document.getElementById("ruleName");
const ruleColor = document.getElementById("ruleColor");
const addRuleBtn = document.getElementById("addRule");
const ruleList = document.getElementById("ruleList");
const exportRulesBtn = document.getElementById("exportRules");
const importRulesBtn = document.getElementById("importRules");
const importFile = document.getElementById("importFile");
const cancelEditBtn = document.getElementById("cancelEdit");

let editingIndex = null;
let dragStartIndex = null;

// 設定の読み込みと表示
async function loadSettings() {
  const data = await chrome.storage.local.get(["settings"]);
  const settings = data.settings || DEFAULT_SETTINGS;

  autoCollapse.checked = settings.autoCollapse;
  removeDuplicates.checked = settings.removeDuplicates;

  renderExclusionList(settings.excludedDomains);
  renderRuleList(settings.customRules || []);
}

// 除外リストの描画
function renderExclusionList(domains) {
  exclusionList.innerHTML = "";
  domains.forEach((domain) => {
    const li = document.createElement("li");
    li.className = "exclusion-item";
    li.innerHTML = `
            <span>${domain}</span>
            <span class="btn-remove" data-domain="${domain}">削除</span>
        `;
    exclusionList.appendChild(li);
  });
}

// カスタムルールリストの描画
function renderRuleList(rules) {
  ruleList.innerHTML = "";
  rules.forEach((rule, index) => {
    const li = document.createElement("li");
    li.className = "exclusion-item";
    li.draggable = true;
    li.dataset.index = index;

    // Drag events
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    li.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span class="drag-handle" title="ドラッグして並び替え">☰</span>
                <span style="font-weight: bold; color: ${
                  rule.color === "grey" ? "#64748b" : rule.color
                }; margin-right: 8px;">●</span>
                <span title="${rule.pattern}">${rule.name}</span>
                <span style="font-size: 11px; color: #64748b; margin-left: 8px;">(${
                  rule.pattern
                })</span>
            </div>
            <div>
                <span class="btn-edit-rule" data-index="${index}">編集</span>
                <span class="btn-remove-rule" data-index="${index}" style="color: #ef4444; cursor: pointer; font-size: 14px;">削除</span>
            </div>
        `;
    ruleList.appendChild(li);
  });
}

// Drag & Drop Handlers
function handleDragStart(e) {
  dragStartIndex = +this.dataset.index;
  e.dataTransfer.effectAllowed = "move";
  this.classList.add("dragging");
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  return false;
}

async function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  const dragEndIndex = +this.dataset.index;
  if (dragStartIndex !== dragEndIndex) {
    const data = await chrome.storage.local.get(["settings"]);
    const settings = data.settings || DEFAULT_SETTINGS;
    const rules = [...(settings.customRules || [])];

    // Remove from old position and insert at new position
    const [movedItem] = rules.splice(dragStartIndex, 1);
    rules.splice(dragEndIndex, 0, movedItem);

    const updated = await updateSettings({ customRules: rules });
    renderRuleList(updated.customRules);
  }
  return false;
}

function handleDragEnd() {
  this.classList.remove("dragging");
}

// 設定の保存
async function updateSettings(updates) {
  const data = await chrome.storage.local.get(["settings"]);
  const settings = data.settings || DEFAULT_SETTINGS;
  const newSettings = { ...settings, ...updates };
  await chrome.storage.local.set({ settings: newSettings });
  return newSettings;
}

// イベントリスナー
autoCollapse.addEventListener("change", () => {
  updateSettings({ autoCollapse: autoCollapse.checked });
});

removeDuplicates.addEventListener("change", () => {
  updateSettings({ removeDuplicates: removeDuplicates.checked });
});

addDomainBtn.addEventListener("click", async () => {
  const domain = domainInput.value.trim().toLowerCase();
  if (domain) {
    const data = await chrome.storage.local.get(["settings"]);
    const settings = data.settings || DEFAULT_SETTINGS;

    if (!settings.excludedDomains.includes(domain)) {
      const newList = [...settings.excludedDomains, domain];
      const updated = await updateSettings({ excludedDomains: newList });
      renderExclusionList(updated.excludedDomains);
      domainInput.value = "";
    }
  }
});

exclusionList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-remove")) {
    const domainToRemove = e.target.dataset.domain;
    const data = await chrome.storage.local.get(["settings"]);
    const settings = data.settings || DEFAULT_SETTINGS;

    const newList = settings.excludedDomains.filter(
      (d) => d !== domainToRemove
    );
    const updated = await updateSettings({ excludedDomains: newList });
    renderExclusionList(updated.excludedDomains);
  }
});

// 編集モードのリセット
function resetEditMode() {
  editingIndex = null;
  rulePattern.value = "";
  ruleName.value = "";
  ruleColor.value = "grey";
  addRuleBtn.textContent = "ルールを追加";
  cancelEditBtn.style.display = "none";
}

cancelEditBtn.addEventListener("click", resetEditMode);

// イベントリスナー
addRuleBtn.addEventListener("click", async () => {
  const pattern = rulePattern.value.trim().toLowerCase();
  const name = ruleName.value.trim();
  const color = ruleColor.value;

  if (pattern && name) {
    const data = await chrome.storage.local.get(["settings"]);
    const settings = data.settings || DEFAULT_SETTINGS;
    const customRules = settings.customRules || [];

    let newRules;
    if (editingIndex !== null) {
      // 既存ルールの更新
      newRules = [...customRules];
      newRules[editingIndex] = { pattern, name, color };
    } else {
      // 新規ルールの追加
      newRules = [...customRules, { pattern, name, color }];
    }

    const updated = await updateSettings({ customRules: newRules });
    renderRuleList(updated.customRules);

    // フォームとモードのリセット
    resetEditMode();
  }
});

ruleList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-remove-rule")) {
    const index = parseInt(e.target.dataset.index);
    if (!confirm("このルールを削除しますか？")) return;

    const data = await chrome.storage.local.get(["settings"]);
    const settings = data.settings || DEFAULT_SETTINGS;

    const newRules = settings.customRules.filter((_, i) => i !== index);
    const updated = await updateSettings({ customRules: newRules });
    renderRuleList(updated.customRules);

    // 編集中のアイテムが削除された場合はリセット
    if (editingIndex === index) {
      resetEditMode();
    }
  } else if (e.target.classList.contains("btn-edit-rule")) {
    const index = parseInt(e.target.dataset.index);
    const data = await chrome.storage.local.get(["settings"]);
    const settings = data.settings || DEFAULT_SETTINGS;
    const rule = settings.customRules[index];

    if (rule) {
      rulePattern.value = rule.pattern;
      ruleName.value = rule.name;
      ruleColor.value = rule.color;
      
      editingIndex = index;
      addRuleBtn.textContent = "変更を保存";
      cancelEditBtn.style.display = "inline-block"; // flex item but button style applies
      
      // フォームへスクロール（必要であれば）
      rulePattern.focus();
    }
  }
});

// エクスポート機能
exportRulesBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(['settings']);
    const settings = data.settings || DEFAULT_SETTINGS;
    const rules = settings.customRules || [];

    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tab-grouper-rules.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// インポート機能
importRulesBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const importedRules = JSON.parse(event.target.result);
            
            if (!Array.isArray(importedRules)) {
                throw new Error('Invalid format: Root must be an array');
            }

            // 基本的なバリデーション
            const validRules = importedRules.filter(rule => 
                rule.pattern && typeof rule.pattern === 'string' &&
                rule.name && typeof rule.name === 'string' &&
                rule.color && typeof rule.color === 'string'
            );

            if (validRules.length === 0) {
                alert('有効なルールが見つかりませんでした。');
                return;
            }

            const data = await chrome.storage.local.get(['settings']);
            const settings = data.settings || DEFAULT_SETTINGS;
            const currentRules = settings.customRules || [];

            // 既存のルールとマージ
            const newRules = [...currentRules, ...validRules];
            
            const updated = await updateSettings({ customRules: newRules });
            renderRuleList(updated.customRules);
            
            alert(`${validRules.length}件のルールをインポートしました。`);
            importFile.value = ''; // Reset input to allow same file selection again

        } catch (error) {
            console.error('Import error:', error);
            alert('ファイルの読み込みに失敗しました。JSON形式が正しいか確認してください。');
        }
    };
    reader.readAsText(file);
});

// 初期化
loadSettings();
