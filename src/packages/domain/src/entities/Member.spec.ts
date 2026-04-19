import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Member } from './Member'

describe('Member Entity', () => {
  const makeMemberProps = () => ({
    id: 1,
    login: 'johndoe',
    firstname: 'John',
    lastname: 'Doe',
    admin: false,
    redmineApiKey: 'secret-api-key',
    customFields: [{ id: 10, name: 'Department', value: 'IT' }],
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should create a new Member with provided props and current date', () => {
    // Arrange
    const props = makeMemberProps()
    const systemTime = new Date('2024-01-01T10:00:00Z')
    vi.setSystemTime(systemTime)

    // Act
    const member = Member.create(props)

    // Assert
    expect(member.id).toBe(props.id)
    expect(member.login).toBe(props.login)
    expect(member.firstname).toBe(props.firstname)
    expect(member.lastname).toBe(props.lastname)
    expect(member.admin).toBe(props.admin)
    expect(member.redmineApiKey).toBe(props.redmineApiKey)
    expect(member.customFields).toEqual(props.customFields)

    expect(member.createdAt).toEqual(systemTime)
    expect(member.lastLoginOn).toEqual(systemTime)
  })

  it('should update login and refresh lastLoginOn (touch)', () => {
    // Arrange
    const initialTime = new Date('2024-01-01T10:00:00Z')
    vi.setSystemTime(initialTime)
    const member = Member.create(makeMemberProps())

    const updateTime = new Date('2024-01-02T15:30:00Z')
    vi.setSystemTime(updateTime)
    const newLogin = 'john.doe.updated'

    // Act
    member.updateLogin(newLogin)

    // Assert
    expect(member.login).toBe(newLogin)
    expect(member.createdAt).toEqual(initialTime)
    expect(member.lastLoginOn).toEqual(updateTime)
  })

  it('should update name and refresh lastLoginOn (touch)', () => {
    // Arrange
    const initialTime = new Date('2024-01-01T10:00:00Z')
    vi.setSystemTime(initialTime)
    const member = Member.create(makeMemberProps())

    const updateTime = new Date('2024-01-03T08:15:00Z')
    vi.setSystemTime(updateTime)

    // Act
    member.updateName('Johnny', 'Silverhand')

    // Assert
    expect(member.firstname).toBe('Johnny')
    expect(member.lastname).toBe('Silverhand')
    expect(member.createdAt).toEqual(initialTime)
    expect(member.lastLoginOn).toEqual(updateTime)
  })

  it('should update custom fields and refresh lastLoginOn (touch)', () => {
    // Arrange
    const initialTime = new Date('2024-01-01T10:00:00Z')
    vi.setSystemTime(initialTime)
    const member = Member.create(makeMemberProps())

    const updateTime = new Date('2024-01-04T12:00:00Z')
    vi.setSystemTime(updateTime)

    const newCustomFields = [
      { id: 10, name: 'Department', value: 'Engineering' },
      { id: 11, name: 'Role', value: 'Developer' },
    ]

    // Act
    member.updateCustomFields(newCustomFields)

    // Assert
    expect(member.customFields).toEqual(newCustomFields)
    expect(member.createdAt).toEqual(initialTime)
    expect(member.lastLoginOn).toEqual(updateTime)
  })
})
