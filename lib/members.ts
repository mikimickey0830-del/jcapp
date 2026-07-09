import type { LegacyAnnualRole } from "@/types/common";
import type { Member, MemberStatus } from "@/types/member";

export const statusLabels: Record<MemberStatus, string> = {
  active: "在籍",
  inactive: "休会",
  graduated: "卒業"
};

export const roleLabels: Record<LegacyAnnualRole, string> = {
  owner: "LOM管理者",
  admin: "管理者",
  committee_manager: "委員会管理",
  member: "会員"
};

export const members: Member[] = [
  {
    id: "m001",
    lastName: "山田",
    firstName: "太郎",
    lastNameKana: "ヤマダ",
    firstNameKana: "タロウ",
    email: "taro.yamada@example.com",
    phone: "090-1234-5678",
    lomName: "玉島青年会議所",
    joinedYear: 2021,
    status: "active",
    annualProfiles: [
      {
        fiscalYear: 2026,
        committee: "総務広報委員会",
        position: "委員長",
        role: "committee_manager"
      },
      {
        fiscalYear: 2025,
        committee: "会員交流委員会",
        position: "副委員長",
        role: "member"
      }
    ]
  },
  {
    id: "m002",
    lastName: "佐藤",
    firstName: "花子",
    lastNameKana: "サトウ",
    firstNameKana: "ハナコ",
    email: "hanako.sato@example.com",
    phone: "080-2345-6789",
    lomName: "玉島青年会議所",
    joinedYear: 2020,
    status: "active",
    annualProfiles: [
      {
        fiscalYear: 2026,
        committee: "例会委員会",
        position: "副委員長",
        role: "member"
      }
    ]
  },
  {
    id: "m003",
    lastName: "田中",
    firstName: "健一",
    lastNameKana: "タナカ",
    firstNameKana: "ケンイチ",
    email: "kenichi.tanaka@example.com",
    phone: "070-3456-7890",
    lomName: "玉島青年会議所",
    joinedYear: 2018,
    status: "graduated",
    annualProfiles: [
      {
        fiscalYear: 2026,
        committee: "監事",
        position: "直前理事長",
        role: "admin"
      }
    ]
  },
  {
    id: "m004",
    lastName: "小林",
    firstName: "美咲",
    lastNameKana: "コバヤシ",
    firstNameKana: "ミサキ",
    email: "misaki.kobayashi@example.com",
    phone: "090-4567-8901",
    lomName: "玉島青年会議所",
    joinedYear: 2024,
    status: "inactive",
    annualProfiles: [
      {
        fiscalYear: 2026,
        committee: "地域事業委員会",
        position: "委員",
        role: "member"
      }
    ]
  }
];

export function getMember(memberId: string) {
  return members.find((member) => member.id === memberId);
}

export function getCurrentAnnualProfile(member: Member) {
  return member.annualProfiles.find((profile) => profile.fiscalYear === 2026);
}
