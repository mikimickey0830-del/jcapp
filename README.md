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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=your-server-only-secret-key
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
## Supabase Auth・初期パスワード発行

標準の利用開始方法は、管理者が会員登録と同時にアカウントを発行し、表示された初期ログイン情報を本人へ安全に渡す方式です。Auth User UIDのコピーや、`members.auth_user_id` の手動SQL更新は本番運用では不要です。招待メールは、アカウントを後から利用開始させる場合の補助機能として残しています。

### 1. SQLを反映する

Supabase Dashboard の **SQL Editor** を開き、次の順に実行します。

1. 初回のみ `supabase/schema.sql`
2. 初回のみ `supabase/seed.sql`
3. Auth導入済みでない場合は `supabase/auth-schema-migration.sql`
4. `supabase/auth-invitation-migration.sql`
5. `supabase/initial-password-migration.sql`
6. 本番RLSを利用する場合は、最新版の `supabase/production-rls.sql`

既存環境では、SQL Editorで手順5を実行してから、手順6を実行してください。どちらも既存会員や既存Auth連携を削除しません。

### 2. サーバー専用Secret keyを設定する

1. Supabase Dashboard の **Project Settings** → **API Keys** を開きます。
2. **Secret keys** にある `default` のコピーアイコンを押します。
3. プロジェクト直下の `.env.local` に、値を貼り付けます。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=sb_secret_...
```

`SUPABASE_SECRET_KEY` はサーバーの招待APIだけが使用します。`NEXT_PUBLIC_` を付けず、GitHub、ブラウザ、画面、ログへ絶対に出さないでください。従来形式のキーを使う場合だけ `SUPABASE_SERVICE_ROLE_KEY` を代わりに設定できます。

### 3. AuthenticationのURL設定

Supabase Dashboard の **Authentication** → **URL Configuration** を開き、以下を設定します。

- **Site URL**: ローカル開発時は `http://localhost:3000`。Vercel公開後は本番URLに変更します。
- **Redirect URLs**: `http://localhost:3000/auth/callback` と `http://localhost:3000/auth/accept-invite` を追加します。
- Vercel公開後は `https://<your-domain>/auth/callback` と `https://<your-domain>/auth/accept-invite` も追加します。

Vercelでは同じ3つの環境変数を Project Settings → Environment Variables に設定し、`NEXT_PUBLIC_SITE_URL` を本番URLへ変更して再デプロイします。

### 4. 標準の会員登録フロー

1. 管理者が `/members/new` を開きます。
2. 氏名・メールアドレスなどを入力し、**アカウントを同時発行する** をオンのまま登録します。
3. 発行完了画面に表示されるログインIDと初期パスワードを、本人へ安全な方法で渡します。この画面を閉じると初期パスワードは再表示できません。
4. 本人は `/login` からログインします。最初のログインでは必ずパスワード変更画面が表示されます。
5. 管理者は既存会員の詳細画面から、初期パスワードの発行または再発行もできます。再発行の操作履歴は監査ログに記録されます。

初期パスワードは16文字のランダムな文字列で、データベース・ログ・GitHubには保存されません。

### 5. 招待メールを確認する

Supabase Dashboard の **Authentication** → **Email Templates** → **Invite user** で件名と本文を確認します。テンプレートには招待リンク用の `{{ .ConfirmationURL }}` を残してください。

### 6. 招待メールを使う場合

1. 管理者が、アカウントを同時発行せずに会員を登録します。
2. `/members` または会員詳細の「招待メールを送る」を押します。
3. 会員はメールのリンクを開き、`/auth/accept-invite` で8文字以上のパスワードを設定します。
4. `members.auth_user_id` と招待状態がサーバー側で自動更新され、そのままダッシュボードへ移動します。

未ログイン時は `/login` へ移動します。パスワードの再発行後は、対象会員に初回パスワード変更を求めます。Supabase Authの仕様上、すでに発行済みの短時間アクセストークンは有効期限まで残る場合があるため、本番では短いJWT有効期限の設定も検討してください。
