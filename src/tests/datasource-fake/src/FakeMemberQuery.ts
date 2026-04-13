import type {
  DataSourceContext,
  MemberDTO,
  PagedResultDTO,
  PaginationOptionsDTO,
} from '@metric-org/sdk'

import { FAKE_MEMBER } from './fakeData'

export class FakeMemberQuery {
  constructor(private readonly _context: DataSourceContext) {}

  async findByCredentials(
    _login: string,
    _password: string,
  ): Promise<MemberDTO> {
    return FAKE_MEMBER
  }

  async findAll(
    pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<MemberDTO>> {
    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 10
    return {
      items: [FAKE_MEMBER],
      total: 1,
      page,
      pageSize,
    }
  }

  async findById(id: string): Promise<MemberDTO | undefined> {
    return String(FAKE_MEMBER.id) === id ? FAKE_MEMBER : undefined
  }

  async findByIds(ids: string[]): Promise<MemberDTO[]> {
    const idSet = new Set(ids)
    return idSet.has(String(FAKE_MEMBER.id)) ? [FAKE_MEMBER] : []
  }

  async findByCondition(
    _condition: Partial<MemberDTO>,
    pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<MemberDTO>> {
    return this.findAll(pagination)
  }

  async count(): Promise<number> {
    return 1
  }

  async exists(): Promise<boolean> {
    return true
  }
}
