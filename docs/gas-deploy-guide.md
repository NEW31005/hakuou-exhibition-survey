# GAS デプロイガイド

## 1. GASプロジェクトを作成する

保存先スプレッドシートを開きます。

```txt
https://docs.google.com/spreadsheets/d/1m8tRnUM7Y0XkIwjkyG6pv0kGqhjj5PV0zGzwJ5YLJ2Y/edit
```

メニューから `拡張機能` → `Apps Script` を開きます。スプレッドシートに紐づいたGASプロジェクトとして作成してください。

## 2. ファイルを配置する

このリポジトリの `gas/` 配下のファイルをGASプロジェクトへ配置します。

```txt
gas/Code.gs
gas/index.html
gas/app.html
gas/styles.html
gas/client.html
gas/appsscript.json
```

Apps Scriptエディタで手作業登録する場合は、HTMLファイル名を `index`、`app`、`styles`、`client` として作成します。

## 3. Script Propertiesを設定する

Apps Scriptエディタのプロジェクト設定から、必要に応じて次を設定します。

```txt
SPREADSHEET_ID=1m8tRnUM7Y0XkIwjkyG6pv0kGqhjj5PV0zGzwJ5YLJ2Y
PUBLIC_FORM_BASE_URL=https://script.google.com/macros/s/xxxxx/exec
SURVEY_API_KEY=任意の共有キー
```

`SPREADSHEET_ID` は未設定でも既定値として指定スプレッドシートIDを使います。`PUBLIC_FORM_BASE_URL` は公開アンケート用Web App URLを入れます。`SURVEY_API_KEY` は未設定ならキー検証を行いません。

## 4. 初期セットアップを実行する

Apps Scriptエディタで `ensureSheet` または `doGet` を一度実行し、権限を承認します。初回実行で次のタブとヘッダーが作成されます。

```txt
展示会マスタ
全回答
```

`展示会マスタ` には初期展示会データが追加されます。

## 5. 公開アンケートをWebアプリとしてデプロイする

`デプロイ` → `新しいデプロイ` → 種類で `ウェブアプリ` を選択します。

推奨設定：

```txt
実行ユーザー: 自分
アクセスできるユーザー: 全員 / Anyone
```

展示会場の来場者端末から送信するため、ログイン必須の組織内限定にはしないでください。

## 6. 社員用集計アプリをデプロイする

同じGASコードを、集計用として別デプロイします。

推奨設定：

```txt
実行ユーザー: 自分
アクセスできるユーザー: 自分のドメイン内 / hakuou.co.jp
```

集計取得関数は `@hakuou.co.jp` のGoogleアカウント以外へデータを返しません。

## 7. 公開URL

公開アンケートのWeb App URLが、そのままアンケートHPのトップページになります。

```txt
トップページ: https://script.google.com/macros/s/xxxxx/exec
展示会別フォーム: https://script.google.com/macros/s/xxxxx/exec?eventSlug=prologis-kasugai-2026
社員用集計ダッシュボード: https://script.google.com/macros/s/yyyyy/exec?page=dashboard
```

デプロイ後、同じURLを `PUBLIC_FORM_BASE_URL` に設定すると、集計画面内のフォームリンクもフルURLになります。

## 8. 初回テスト

1. `展示会マスタ` の対象展示会が `published` であることを確認します。
2. `{SURVEY_WEB_APP_URL}?eventSlug=prologis-kasugai-2026` からテスト回答を送信します。
3. スプレッドシートに該当 `eventSlug` のタブが作成され、1行追記されることを確認します。
4. `全回答` タブにも同じ回答が追記されることを確認します。
5. `{DASHBOARD_WEB_APP_URL}?page=dashboard` をハクオウ社員アカウントで開き、集計画面に回答が表示されることを確認します。
6. CSVボタンからBOM付きUTF-8のCSVが出力できることを確認します。
