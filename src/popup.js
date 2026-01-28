document.addEventListener('DOMContentLoaded', async () => {
    const autoGroupToggle = document.getElementById('autoGroupToggle');
    const organizeBtn = document.getElementById('organizeBtn');
    const optionsBtn = document.getElementById('optionsBtn');

    // キャッシュから現在の設定を読み込む
    const data = await chrome.storage.local.get(['settings']);
    const settings = data.settings || { autoGroup: true };
    autoGroupToggle.checked = settings.autoGroup;

    // トグルの変更
    autoGroupToggle.addEventListener('change', async () => {
        const currentData = await chrome.storage.local.get(['settings']);
        const newSettings = { ...(currentData.settings || {}), autoGroup: autoGroupToggle.checked };
        await chrome.storage.local.set({ settings: newSettings });
    });

    // 整理ボタン
    organizeBtn.addEventListener('click', async () => {
        organizeBtn.disabled = true;
        organizeBtn.textContent = '整理中...';
        
        chrome.runtime.sendMessage({ action: 'organizeAll' }, (response) => {
            setTimeout(() => {
                organizeBtn.disabled = false;
                organizeBtn.textContent = '今すぐ全てのタブを整理';
            }, 500);
        });
    });

    // 設定ページを開く
    optionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
