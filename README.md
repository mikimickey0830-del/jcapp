# JC-App

青年会議所向けのレスポンシブWebアプリです。玉島青年会議所での利用を初期想定としつつ、将来的に他LOMでも使えるよう `loms` を起点にした設計にしています。

## 技術構成

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- iPhone対応レスポンシブUI

## セットアップ

```bash
pnpm install
pnpm dev
```

起動後、ブラウザで `http://localhost:3000` を開きます。環境によって別ポートで起動した場合は、表示されたURLを開いてください。

## 環境変数

`.env.example` を参考に `.env.local` を作成します。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

`.env.local` はGitにコミットしません。

## Supabase設定手順

1. Supabaseでプロジェクトを作成します。
2. Supabase SQL Editorで `supabase/schema.sql` を実行します。
3. 続けて `supabase/seed.sql` を実行し、玉島青年会議所の開発用データを投入します。
4. `permission denied for table members` が出る場合は `supabase/dev-grants.sql` を実行します。
5. Project SettingsからProject URLとPublishable keyを確認し、`.env.local` に設定します。
6. 開発サーバーを再起動します。

## Supabase接続確認

会員管理はSupabase接続済みです。

```text
/members
/members/20000000-0000-0000-0000-000000000001
```

`/members` に山田太郎、佐藤花子などのseedデータが表示され、画面上に「仮データ」や「Supabaseから取得できませんでした」という警告が出なければ接続成功です。

## 主なテーブル

- `loms`
- `fiscal_years`
- `members`
- `committees`
- `positions`
- `annual_member_assignments`
- `events`
- `attendance_responses`
- `documents`
- `notifications`
- `announcements`

## 主なディレクトリ

- `app/`: Next.js App Routerの画面
- `components/`: 共通UIとフォーム
- `hooks/`: 画面から使う取得処理
- `services/`: Supabase接続へ差し替えるためのサービス層
- `lib/`: Supabaseクライアントとfallback用仮データ
- `types/`: ドメイン型定義
- `docs/`: 設計書
- `supabase/`: DB schema、seed、開発用grant

## 開発手順

```bash
pnpm dev
```

品質確認:

```bash
pnpm lint
npx tsc --noEmit
```

この環境では `npx` を使わず、Node.jsから直接TypeScriptを実行して確認する場合があります。

## ブランチ戦略

- `main`: 本番相当の安定ブランチ
- `feature/<short-name>`: 新機能
- `fix/<short-name>`: 不具合修正
- `docs/<short-name>`: ドキュメント更新

基本的な流れ:

1. `main` から作業ブランチを作成
2. 変更
3. lintと型チェック
4. commit
5. GitHubへpush
6. Pull Requestを作成
7. 確認後に `main` へmerge

## GitHubへPushする手順

初回のみ:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-account>/<your-repo>.git
git push -u origin main
```

2回目以降:

```bash
git add .
git commit -m "Describe your change"
git push
```

## Ver.1対象機能

1. ログイン
2. ホーム
3. 会員管理
4. 年度管理
5. スケジュール管理
6. 出欠管理
7. 資料共有
8. 通知・リマインド
9. 管理画面
10. お知らせ

## Ver.1では扱わない機能

- 議案承認フロー
- AI機能
- AI議事録
- 会費決済
- QR受付
