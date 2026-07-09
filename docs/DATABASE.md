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
