import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Member } from './Member'

describe('Member Entity', () => {
  const makeMemberProps = () => ({
    id: 1,
    login: 'johndoe',
    firstname: 'John',
    lastname: 'Doe',
    admin: false,
    customFields: [{ id: 10, name: 'Department', value: 'IT' }],
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Creation', () => {
    it('should create a new Member with provided props and current date', () => {
      const props = makeMemberProps()
      const systemTime = new Date('2024-01-01T10:00:00Z')
      vi.setSystemTime(systemTime)

      const result = Member.create(props)

      expect(result.isSuccess()).toBe(true)
      const member = result.success

      expect(member.id).toBe(props.id)
      expect(member.login).toBe(props.login)
      expect(member.createdAt).toEqual(systemTime)
      expect(member.lastLoginOn).toEqual(systemTime)
    })

    it('should fail creation with invalid props (negative id)', () => {
      const result = Member.create({
        ...makeMemberProps(),
        id: -5,
      })

      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CAMPOS_INVALIDOS')
      expect(result.failure.details).toHaveProperty('id')
    })
  })

  describe('Mutations', () => {
    it('should update login and refresh lastLoginOn', () => {
      const initialTime = new Date('2024-01-01T10:00:00Z')
      vi.setSystemTime(initialTime)
      const member = Member.create(makeMemberProps()).success

      const updateTime = new Date('2024-01-02T15:30:00Z')
      vi.setSystemTime(updateTime)

      const result = member.updateLogin('new.login')

      expect(result.isSuccess()).toBe(true)
      expect(member.login).toBe('new.login')
      expect(member.lastLoginOn).toEqual(updateTime)
    })

    it('should update name and refresh lastLoginOn', () => {
      const member = Member.create(makeMemberProps()).success
      const updateTime = new Date('2024-01-03T08:00:00Z')
      vi.setSystemTime(updateTime)

      const result = member.updateName('Arthur', 'Morgan')

      expect(result.isSuccess()).toBe(true)
      expect(member.firstname).toBe('Arthur')
      expect(member.lastname).toBe('Morgan')
      expect(member.lastLoginOn).toEqual(updateTime)
    })

    it('should update custom fields and refresh lastLoginOn', () => {
      const member = Member.create(makeMemberProps()).success
      const updateTime = new Date('2024-01-04T12:00:00Z')
      vi.setSystemTime(updateTime)

      const newFields = [{ id: 99, name: 'Level', value: 'Senior' }]
      const result = member.updateCustomFields(newFields)

      expect(result.isSuccess()).toBe(true)
      expect(member.customFields).toEqual(newFields)
      expect(member.lastLoginOn).toEqual(updateTime)
    })
  })
})
