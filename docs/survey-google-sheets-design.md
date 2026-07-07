# 展示会アンケート Google Sheets 連携設計

## 概要

ハクオウロボティクスの展示会後アンケートは、Google Apps ScriptのWebアプリとGoogleスプレッドシートで構成します。GAS Webアプリがトップページ、展示会別フォーム、集計ダッシュボード、CSV出力を提供し、回答保存も同じGAS内で行います。

## URL設計

GAS WebアプリのURLを起点にします。

```txt
トップページ: {GAS_WEB_APP_URL}
展示会別フォーム: {GAS_WEB_APP_URL}?page=survey&eventSlug={eventSlug}
集計ダッシュボード: {GAS_WEB_APP_URL}?page=dashboard
```

例：

```txt
{GAS_WEB_APP_URL}?page=survey&eventSlug=fooma2026
{GAS_WEB_APP_URL}?page=survey&eventSlug=prologis-kasugai-2026
```

互換用として `{GAS_WEB_APP_URL}?eventSlug=fooma2026` または `{GAS_WEB_APP_URL}?eventId=fooma2026` でもフォームを表示します。

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

## GAS関数

フォーム表示用：

```txt
getPublicEventsForWeb()
getEventForWeb(eventSlug)
submitSurveyFromWeb(payload)
```

集計表示用：

```txt
getSummaryData(filters)
GET {GAS_WEB_APP_URL}?action=summary
GET {GAS_WEB_APP_URL}?action=csv&type=all
```

外部POST互換：

```txt
POST {GAS_WEB_APP_URL}
Content-Type: text/plain;charset=utf-8
```

## leadScore / leadRank

保存時はGAS側でスコアを再計算した値を正とします。

ランク条件：

```txt
80点以上: S
50点以上: A
25点以上: B
24点以下: C
```

## セキュリティ方針

回答フォームは公開URLから送信できます。集計画面や外部POSTを制限する場合は、GASのScript Propertiesに `SURVEY_API_KEY` を設定し、集計ダッシュボードの閲覧キー欄に同じ値を入力します。

個人情報をURLパラメータへ含めず、メールアドレスや電話番号をログへ過剰に出さない運用にします。
