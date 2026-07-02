# 展示会アンケート Google Sheets 連携設計

## 概要

ハクオウロボティクスの展示会後アンケートは、Next.jsの公開フォームとGoogle Apps Scriptの保存APIで構成します。Next.js側はDBを持たず、回答送信時にGAS Web AppへPOSTします。GAS側はGoogleスプレッドシートへ保存し、同じGAS Web Appで集計画面とCSV出力も提供します。

## URL設計

フォームは展示会ごとに以下のURLで公開します。

```txt
/survey/[eventSlug]
```

例：

```txt
/survey/fooma2026
/survey/logis-tech-2026
/survey/yamazen-private-2026
```

互換用として `/survey?eventId=fooma2026` または `/survey?eventSlug=fooma2026` でもアクセスでき、該当する `/survey/[eventSlug]` に遷移します。

## スプレッドシート構成

保存先スプレッドシート：

```txt
1m8tRnUM7Y0XkIwjkyG6pv0kGqhjj5PV0zGzwJ5YLJ2Y
```

最低限、以下のタブを利用します。

```txt
展示会マスタ
全回答
fooma2026
logis-tech-2026
yamazen-private-2026
```

展示会別タブは、回答保存時に存在しなければGASが自動作成します。

## 展示会マスタ

`展示会マスタ` には次の列を持たせます。

```txt
eventSlug
eventName
venue
boothName
startDate
endDate
status
description
createdAt
updatedAt
```

`status` は `draft`、`published`、`closed`、`hidden` のいずれかです。

フォーム表示の挙動：

```txt
published: フォーム表示・送信可能
draft/hidden: このアンケートは現在公開されていません
closed: このアンケートの受付は終了しました
未登録: 指定された展示会アンケートが見つかりません
```

## 回答保存列

展示会別タブと `全回答` タブには次の列を同じ順番で保存します。

```txt
submittedAt
eventSlug
eventName
companyName
personName
department
email
phone
interests
explanationRating
issues
automationTasks
loadWeight
loadType
transportDistance
considerationStatus
introductionTiming
budgetStatus
userRole
requestedActions
freeComment
contactPermission
leadScore
leadRank
userAgent
sourceUrl
```

複数選択項目はカンマ区切り文字列で保存します。

## API

展示会情報取得：

```txt
GET {GAS_WEB_APP_URL}?action=getEvent&eventSlug=fooma2026
```

回答送信：

```txt
POST {GAS_WEB_APP_URL}
Content-Type: text/plain;charset=utf-8
```

本文はJSON文字列です。GAS側で `eventSlug`、必須項目、展示会の公開状態、APIキーを検証します。

## leadScore / leadRank

スコアはNext.js側でも計算しますが、保存時はGAS側で再計算した値を正とします。

ランク条件：

```txt
80点以上: S
50点以上: A
25点以上: B
24点以下: C
```

## セキュリティ方針

GAS Web App URLはNext.jsの環境変数 `NEXT_PUBLIC_GAS_WEB_APP_URL` で管理します。簡易APIキーを使う場合は、Next.js側に `NEXT_PUBLIC_SURVEY_API_KEY`、GAS側のScript Propertiesに `SURVEY_API_KEY` を設定します。

個人情報をURLパラメータへ含めず、メールアドレスや電話番号をログへ過剰に出さない運用にします。
