import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TimeEntry } from './TimeEntry'

describe('TimeEntry Entity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('crypto', {
      randomUUID: () => 'mock-uuid-1234',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const makeValidProps = () => ({
    task: { id: 'task-1' },
    activity: { id: 'act-1' },
    user: { id: 'usr-1', name: 'John Doe' },
  })

  describe('Creation', () => {
    it('should create successfully with standalone timeSpent (no dates)', () => {
      // Arrange
      const now = new Date('2024-05-01T10:00:00Z')
      vi.setSystemTime(now)
      const props = { ...makeValidProps(), timeSpent: 3600 }

      // Act
      const result = TimeEntry.create(props)

      // Assert
      expect(result.isSuccess()).toBe(true)
      const entry = result.success

      expect(entry.id).toBe('mock-uuid-1234')
      expect(entry.task.id).toBe('task-1')
      expect(entry.activity.id).toBe('act-1')
      expect(entry.user.id).toBe('usr-1')
      expect(entry.timeSpent).toBe(3600)
      expect(entry.startDate).toBeUndefined()
      expect(entry.endDate).toBeUndefined()
      expect(entry.createdAt).toEqual(now)
      expect(entry.updatedAt).toEqual(now)
    })

    it('should create successfully and calculate timeSpent based on dates', () => {
      // Arrange
      const startDate = new Date('2024-05-01T10:00:00Z')
      const endDate = new Date('2024-05-01T11:00:00Z')
      const props = { ...makeValidProps(), startDate, endDate }

      // Act
      const result = TimeEntry.create(props)

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(result.success.timeSpent).toBe(3600)
      expect(result.success.startDate).toEqual(startDate)
      expect(result.success.endDate).toEqual(endDate)
    })

    it('should fail creation if Zod schema is invalid (missing user.id)', () => {
      // Arrange
      const invalidProps = {
        task: { id: 'task-1' },
        activity: { id: 'act-1' },
        user: { id: '' }, // String vazia quebra no min(1)
        timeSpent: 100,
      }

      // Act
      const result = TimeEntry.create(invalidProps as any)

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CAMPOS_INVALIDOS')
      expect(result.failure.details).toHaveProperty('user.id')
    })

    it('should fail creation if domain rule fails (startDate without endDate)', () => {
      // Arrange
      const props = {
        ...makeValidProps(),
        startDate: new Date('2024-05-01T10:00:00Z'),
        timeSpent: 3600,
      }

      // Act
      const result = TimeEntry.create(props)

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CAMPOS_INVALIDOS')
      expect(result.failure.details).toHaveProperty('endDate')
    })
  })

  describe('updateHours (Domain Logic)', () => {
    let entry: TimeEntry

    beforeEach(() => {
      const result = TimeEntry.create({ ...makeValidProps(), timeSpent: 0 })
      entry = result.success
    })

    it('should fail if only startDate is provided', () => {
      // Act
      const result = entry.updateHours(new Date(), undefined, undefined)

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('DATAS_INCOMPLETAS')
      expect(result.failure.details?.endDate).toBeDefined()
    })

    it('should fail if only endDate is provided', () => {
      // Act
      const result = entry.updateHours(undefined, new Date(), undefined)

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('DATAS_INCOMPLETAS')
      expect(result.failure.details?.startDate).toBeDefined()
    })

    it('should fail if endDate is before startDate', () => {
      // Arrange
      const start = new Date('2024-05-01T10:00:00Z')
      const end = new Date('2024-05-01T09:00:00Z')

      // Act
      const result = entry.updateHours(start, end)

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('DATA_INVALIDA')
    })

    it('should fail if provided timeSpent conflicts with date difference', () => {
      // Arrange
      const start = new Date('2024-05-01T10:00:00Z')
      const end = new Date('2024-05-01T11:00:00Z')
      const wrongTimeSpent = 1800

      // Act
      const result = entry.updateHours(start, end, wrongTimeSpent)

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('TEMPO_INCONSISTENTE')
    })

    it('should update successfully with matching dates and timeSpent, touching updatedAt', () => {
      // Arrange
      const start = new Date('2024-05-01T10:00:00Z')
      const end = new Date('2024-05-01T10:30:00Z')

      const updateTime = new Date('2024-05-02T00:00:00Z')
      vi.setSystemTime(updateTime)

      // Act
      const result = entry.updateHours(start, end, 1800)

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(entry.timeSpent).toBe(1800)
      expect(entry.startDate).toEqual(start)
      expect(entry.endDate).toEqual(end)
      expect(entry.updatedAt).toEqual(updateTime)
    })

    it('should fail if no dates and no timeSpent are provided', () => {
      // Act
      const result = entry.updateHours(undefined, undefined, undefined)

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('TEMPO_FALTANDO')
    })

    it('should clear dates and update timeSpent when only timeSpent is provided', () => {
      const start = new Date('2024-05-01T10:00:00Z')
      const end = new Date('2024-05-01T11:00:00Z')
      entry.updateHours(start, end)

      const result = entry.updateHours(undefined, undefined, 7200)

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(entry.timeSpent).toBe(7200)
      expect(entry.startDate).toBeUndefined()
      expect(entry.endDate).toBeUndefined()
    })
  })

  describe('updateComments', () => {
    let entry: TimeEntry

    beforeEach(() => {
      const result = TimeEntry.create({ ...makeValidProps(), timeSpent: 60 })
      entry = result.success
    })

    it('should update comment and touch updatedAt', () => {
      // Arrange
      const updateTime = new Date('2024-05-10T00:00:00Z')
      vi.setSystemTime(updateTime)

      // Act
      const result = entry.updateComments('   Working on refactoring   ')

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(entry.comments).toBe('Working on refactoring')
      expect(entry.updatedAt).toEqual(updateTime)
    })

    it('should fail if comment exceeds 255 characters', () => {
      // Arrange
      const hugeComment = 'a'.repeat(256)

      // Act
      const result = entry.updateComments(hugeComment)

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('COMENTARIO_INVALIDO')
      expect(result.failure.details?.comments).toBeDefined()
    })
  })
})
