# Database Design

JC-AppはSupabase PostgreSQLを利用します。青年会議所は年度ごとに役職・委員会・権限が変わるため、会員の基本情報と年度ごとの所属情報を分けて管理します。

## 基本方針

- LOMは `loms` で管理する。
- 年度は `fiscal_years` で管理する。
- 会員の氏名、連絡先、入会年度などは `members` に保持する。
- 年度ごとの委員会、役職、権限は `annual_member_assignments` で管理する。
- 新年度作成時は、前年度の `committees`、`positions`、`annual_member_assignments` をコピーする。
- すべての業務データは原則 `lom_id` を持ち、将来的な複数LOM展開に備える。

## Tables

### loms

LOMを管理します。

- `id`: uuid primary key
- `name`: text
- `slug`: text unique
- `prefecture`: text
- `city`: text
- `created_at`: timestamptz

### fiscal_years

年度を管理します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `year`: integer
- `name`: text
- `starts_on`: date
- `ends_on`: date
- `status`: planned / current / closed
- `is_current`: boolean
- `copied_from_year_id`: uuid references `fiscal_years.id`
- `created_at`: timestamptz

### members

年度をまたいで引き継ぐ会員基本情報を管理します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `auth_user_id`: uuid
- `invitation_status`: not_invited / invited / active / failed
- `invited_at`: timestamptz
- `activated_at`: timestamptz
- `invitation_last_sent_at`: timestamptz
- `last_name`: text
- `first_name`: text
- `last_name_kana`: text
- `first_name_kana`: text
- `email`: text
- `phone`: text
- `joined_year`: integer
- `status`: active / inactive / graduated
- `created_at`: timestamptz
- `updated_at`: timestamptz

### committees

年度ごとの委員会を管理します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `fiscal_year_id`: uuid references `fiscal_years.id`
- `name`: text
- `sort_order`: integer
- `created_at`: timestamptz

### auth_invitation_audit_logs

会員招待とAuth自動紐付けの監査ログを管理します。サービスロールだけが書き込み、RLSによりブラウザからは直接参照・更新しません。

- `id`: uuid primary key
- `member_id`: uuid references `members.id`
- `actor_auth_user_id`: uuid references `auth.users.id`
- `action`: invited / resent / activated / failed
- `metadata`: jsonb
- `created_at`: timestamptz

### positions

年度ごとの役職を管理します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `fiscal_year_id`: uuid references `fiscal_years.id`
- `name`: text
- `sort_order`: integer
- `created_at`: timestamptz

### annual_member_assignments

会員の年度ごとの所属、役職、権限を管理します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `fiscal_year_id`: uuid references `fiscal_years.id`
- `member_id`: uuid references `members.id`
- `committee_id`: uuid references `committees.id`
- `position_id`: uuid references `positions.id`
- `role`: member / vice_chair / chair / secretary / president / admin
- `is_board_member`: boolean
- `created_at`: timestamptz
- `updated_at`: timestamptz

### events

スケジュールを管理します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `fiscal_year_id`: uuid references `fiscal_years.id`
- `title`: text
- `event_type`: regular_meeting / board_meeting / committee / project / block / jci_japan / other
- `starts_at`: timestamptz
- `ends_at`: timestamptz
- `venue`: text
- `address`: text
- `target_audience`: text
- `description`: text
- `requires_attendance`: boolean
- `attendance_deadline`: timestamptz
- `created_by`: uuid references `members.id`
- `created_at`: timestamptz
- `updated_at`: timestamptz

### attendance_responses

出欠回答を管理します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `event_id`: uuid references `events.id`
- `member_id`: uuid references `members.id`
- `status`: attending / absent / late / unanswered
- `comment`: text
- `responded_at`: timestamptz
- `reply_deadline`: timestamptz
- `is_overdue`: boolean
- `created_at`: timestamptz
- `updated_at`: timestamptz

### documents

資料共有を管理します。実ファイルは将来的にSupabase Storageへ保存します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `fiscal_year_id`: uuid references `fiscal_years.id`
- `event_id`: uuid references `events.id`
- `title`: text
- `file_name`: text
- `file_type`: pdf / word / excel / powerpoint / image / other
- `category`: agenda / minutes / bylaws / project / meeting / other
- `storage_path`: text
- `visibility`: all / board / admins
- `uploaded_by`: uuid references `members.id`
- `uploaded_at`: timestamptz
- `created_at`: timestamptz
- `updated_at`: timestamptz

### notifications

アプリ内通知を管理します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `fiscal_year_id`: uuid references `fiscal_years.id`
- `member_id`: uuid references `members.id`
- `title`: text
- `body`: text
- `notification_type`: attendance_deadline / event_today / document_added / announcement / system
- `related_href`: text
- `read_at`: timestamptz
- `created_at`: timestamptz

### announcements

お知らせを管理します。通知機能と連動できるよう、通知側には `notification_type = announcement` と `related_href` を保存します。

- `id`: uuid primary key
- `lom_id`: uuid references `loms.id`
- `fiscal_year_id`: uuid references `fiscal_years.id`
- `title`: text
- `body`: text
- `announcement_type`: general / regular_meeting / board_meeting / committee / deadline / document_added / other
- `target_lom`: text
- `target_committee_id`: uuid references `committees.id`
- `visibility`: all / members / board / committee / admins
- `importance`: normal / important / urgent
- `publish_start_at`: timestamptz
- `publish_end_at`: timestamptz
- `author_member_id`: uuid references `members.id`
- `created_at`: timestamptz
- `updated_at`: timestamptz

## RLS方針

`supabase/schema.sql` では全テーブルでRLSを有効化します。初期段階では開発用のselect policyのみ作成します。

本番運用前に以下へ差し替えます。

- `members.auth_user_id = auth.uid()` でログインユーザーを特定する。
- `lom_id` で所属LOMのデータだけ参照できるようにする。
- `annual_member_assignments.role` で作成、更新、削除の権限を制御する。
- お知らせ、資料、出欠は `visibility` と年度所属を組み合わせて参照範囲を制御する。

## Storage方針

- bucket: `documents`
- path: `{lom_id}/{fiscal_year_id}/{event_id_or_general}/{file_name}`
- 閲覧権限は `documents.visibility` と年度所属・役職で制御する。
## Supabase Authと本番RLS

- `auth.users.id` と `members.auth_user_id` を1対1で紐付けます。
- ログイン会員のLOMは `members.lom_id` から判定します。
- 一般会員は同一LOMの会員を閲覧でき、自分のプロフィールだけ更新できます。
- 出欠回答は本人だけ更新できます。
- 現在年度の `admin`、`president`、`secretary` はLOM内の管理対象を更新できます。
- 通知は本人宛て、または管理役職だけが閲覧できます。
- ブラウザには公開キーだけを置きます。SupabaseのSecret keyまたは従来のservice role keyは、招待メール送信のRoute Handlerだけでサーバー側に限定して使用します。
- 招待メール送信で使うSecret keyは、ブラウザ、Client Component、ログ、GitHubへは渡しません。
- 招待の自動紐付けは `user_metadata.member_id` を優先し、招待メールとの一致を確認します。該当しない場合のみメールアドレスで1件に特定できる会員へ紐付けます。

## 初期パスワード発行

`members.must_change_password` は、初回ログイン後にパスワード変更を必須にする認証状態です。初期アカウントの発行または再発行時に `true`、本人が変更を完了した時に `false` になります。平文の初期パスワードはこのテーブルを含むデータベースへ保存しません。

認証状態の更新には、RLSを迂回して任意の会員を変更できないよう、次のSecurity Definer RPCを使います。

- `complete_initial_password_change()`: ログイン本人の状態だけを完了にし、`initial_password_changed` を監査ログへ記録します。
- `link_issued_member_account(...)`: 現在年度の有効な管理者だけが、同一LOMの会員へAuthユーザーを紐付け、初回変更を必須にできます。
- `record_account_credential_event(...)`: 初期発行・再発行の監査イベントだけを記録します。パスワードは引数・ログ・metadataに含めません。

監査ログの追加操作種別は `account_issued`、`initial_password_reissued`、`initial_password_changed` です。

`supabase/auth-schema-migration.sql` はAuth導入時に実行します。
`supabase/production-rls.sql` は全利用者のAuth紐付けと本番検証が完了してから実行します。
開発用の `dev_*` policy は本番公開前に必ず削除します。
