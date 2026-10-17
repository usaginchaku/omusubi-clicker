# omusubi-clicker
omusubi clicker

## 起動確認

`index.html` を静的サーバーで配信します（例: `python -m http.server 18463`）。

React / ReactDOM は UMD 版を使うため、Babel は JSX を classic runtime へ変換する
7.28.5 に固定しています。Babel 8 の既定値では `react/jsx-runtime` の import が
生成され、通常の script として実行するこのページが空白になります。
依存ライブラリを更新するときは、実ブラウザで表示・操作を確認してください。

Node.js 18 以降で起動回帰テストを実行できます。ページが指定する Babel を
ダウンロードするため、インターネット接続が必要です。

```sh
node --test tests/startup.test.cjs
```
