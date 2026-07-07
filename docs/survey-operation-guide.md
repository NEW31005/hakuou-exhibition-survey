# 展示会アンケート GAS運用ガイド

## 公開URL

GAS WebアプリのURLを1つ公開すれば、トップページ、展示会別アンケート、集計ダッシュボードを使えます。

```txt
公開アンケート: {SURVEY_WEB_APP_URL}
展示会別フォーム: {SURVEY_WEB_APP_URL}?eventSlug={eventSlug}
社員用集計ダッシュボード: {DASHBOARD_WEB_APP_URL}?page=dashboard
```

## 新しい展示会を追加する

スプレッドシートの `展示会マスタ` に1行追加します。

```txt
eventSlug: 半角英数字とハイフン。例: fooma2026
eventName: フォームタイトルに表示する展示会名
venue: 会場
boothName: ブース名
startDate/endDate: yyyy-mm-dd
status: draft / published / closed / hidden
description: 管理用メモ
createdAt/updatedAt: 更新日時
```

公開前は `draft`、公開時に `published`、受付終了後は `closed` にします。

## 回答保存

GASフォームから送信された回答は、自動で次の2か所に保存されます。

```txt
全回答
{eventSlug} と同名の展示会別タブ
```

`eventSlug` を切り替えるだけで、フォーム表示、保存先タブ、集計対象が切り替わります。

## 回答確認

社員用の集計ダッシュボードを開きます。

```txt
{DASHBOARD_WEB_APP_URL}?page=dashboard
```

集計ダッシュボードはハクオウ社員のGoogleアカウント限定です。

確認できる内容：

```txt
展示会一覧
展示会別集計
展示会別回答一覧
回答詳細
全展示会横断集計
```

絞り込み条件：

```txt
展示会
leadRank
希望対応
導入時期
連絡可否
キーワード
```

## CSV出力

集計画面のCSVボタンから出力します。

```txt
展示会別CSV
全回答CSV
S/AランクのみCSV
現地調査希望のみCSV
見積希望のみCSV
```

CSVは日本語がExcelで文字化けしにくいBOM付きUTF-8です。

## 公開後に設定するプロパティ

GASのスクリプトプロパティで必要に応じて設定します。

```txt
SPREADSHEET_ID: 集計スプレッドシートID
PUBLIC_FORM_BASE_URL: 公開アンケート用GAS WebアプリURL
SURVEY_API_KEY: 外部POSTや集計閲覧を制限する場合のキー
```

`PUBLIC_FORM_BASE_URL` を設定すると、集計画面のフォームリンクもGAS WebアプリのフルURLで表示されます。

## 運用上の注意

回答結果には個人情報が含まれます。集計ダッシュボードのURL、閲覧キー、CSVの共有先は必要最小限にしてください。
