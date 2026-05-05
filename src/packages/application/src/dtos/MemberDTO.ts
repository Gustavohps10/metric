export interface MemberDTO {
  id: number
  login: string
  firstname: string
  lastname: string
  admin: boolean
  createdOn: string
  lastLoginOn: string
  avatarUrl?: string
  customFields: { id: number; name: string; value: string }[]
}
