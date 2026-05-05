import { MemberViewModel } from '@/view-models/MemberViewModel'

export interface AuthenticationViewModel {
  member: MemberViewModel
  token: string
}
