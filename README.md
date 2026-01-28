# Tab Grouping Chrome Extension

ドメインごとにタブを自動的にグループ化するChrome拡張機能です。

## 機能

- タブを開くと、自動的にドメインごとにグループ化されます
- 同じドメインのタブは同じグループにまとめられます
- グループの色やラベルをカスタマイズできます

## プロジェクト構造

```
Tab-Grouping/
├── src/              # 開発用ソースコード
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── options.html
│   └── options.js
├── assets/           # アイコンなどの素材
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── dist/             # Chrome拡張機能として読み込むフォルダ
└── README.md
```

## 開発方法

1. `src/` フォルダ内のファイルを編集します
2. 変更後、`dist/` フォルダにファイルをコピーします:
   ```powershell
   Copy-Item -Path src/* -Destination dist/ -Recurse -Force
   Copy-Item -Path assets/* -Destination dist/icons/ -Recurse -Force
   ```

## Chromeへのインストール方法

1. Chromeで `chrome://extensions/` を開きます
2. 右上の「デベロッパーモード」を有効にします
3. 「パッケージ化されていない拡張機能を読み込む」をクリックします
4. **`dist/` フォルダ**を選択します

## 注意事項

- Chromeには必ず `dist/` フォルダを読み込んでください
- `src/` フォルダは開発用です
- `dist/` フォルダはGitで管理されません（.gitignoreで除外）

## ライセンス

MIT License
