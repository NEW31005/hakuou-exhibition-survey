# 展示会アンケート 運用ガイド

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

## サンクスメールに記載するURL

基本形は次です。

```txt
https://new31005.github.io/hakuou-exhibition-survey/survey/{eventSlug}/
```

例：

```txt
https://new31005.github.io/hakuou-exhibition-survey/survey/fooma2026/
```

旧形式が必要な場合は次でもアクセスできます。

```txt
https://new31005.github.io/hakuou-exhibition-survey/survey?eventId=fooma2026
```

## 回答確認

公開集計ページを開き、GAS Web App URLと閲覧キーを入力して読み込みます。

```txt
https://new31005.github.io/hakuou-exhibition-survey/dashboard/
```

GAS Web App URLをブラウザで直接開いても、同じ集計画面を確認できます。

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

集計画面上部のCSVボタンから出力します。

```txt
展示会別CSV
全回答CSV
S/AランクのみCSV
現地調査希望のみCSV
見積希望のみCSV
```

CSVは日本語がExcelで文字化けしにくいBOM付きUTF-8です。

## 回答が保存されないとき

次を確認してください。

```txt
NEXT_PUBLIC_GAS_WEB_APP_URL が正しいか
GAS Web Appが最新バージョンでデプロイされているか
展示会マスタに eventSlug が存在するか
status が published になっているか
APIキーを使う場合、Next.js側とGAS側の値が一致しているか
集計ページのGAS Web App URLと閲覧キーが正しいか
GAS実行ユーザーがスプレッドシートを編集できるか
```

## 運用上の注意

個人情報を扱うため、回答一覧やCSVの共有先を必要最小限にしてください。URLパラメータへ氏名、メールアドレス、電話番号などを含めないでください。
