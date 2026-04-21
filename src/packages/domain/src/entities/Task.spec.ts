import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Task } from './Task'

describe('Task Entity', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    vi.stubGlobal('crypto', {
      randomUUID: () => 'mocked-uuid-1234-5678',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('Creation', () => {
    it('should create a new task with minimal props and default fallback to false', () => {
      // Arrange
      const now = new Date('2024-03-01T10:00:00Z')
      vi.setSystemTime(now)

      // Act
      const result = Task.create({
        title: 'Review PR',
        description: 'Review the payment gateway integration',
        workspaceId: 'ws-100',
      })

      // Assert
      expect(result.isSuccess()).toBe(true)
      const task = result.success

      expect(task.id).toBe('mocked-uuid-1234-5678')
      expect(task.title).toBe('Review PR')
      expect(task.description).toBe('Review the payment gateway integration')
      expect(task.workspaceId).toBe('ws-100')
      expect(task.isFallback).toBe(false)
      expect(task.createdAt).toEqual(now)
      expect(task.updatedAt).toEqual(now)
    })

    it('should create a task mapped to an external integration', () => {
      // Act
      const result = Task.create({
        title: 'Fix Login',
        description: 'Users cannot login',
        workspaceId: 'ws-100',
        externalId: 'JIRA-899',
        externalType: 'JIRA',
      })

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(result.success.externalId).toBe('JIRA-899')
      expect(result.success.externalType).toBe('JIRA')
    })

    it('should create a predefined fallback task', () => {
      // Act
      const result = Task.createFallback('ws-999')

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(result.success.title).toBe('General Task')
      expect(result.success.isFallback).toBe(true)
    })

    it('should fail creation if Zod schema is invalid (title too short)', () => {
      // Act
      const result = Task.create({
        title: 'Ab',
        description: 'Valid description',
        workspaceId: 'ws-1',
      })

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('CAMPOS_INVALIDOS')
      expect(result.failure.details).toHaveProperty('title')
    })
  })

  describe('Mutations', () => {
    it('should update the title and refresh updatedAt', () => {
      // Arrange
      const creationTime = new Date('2024-03-01T10:00:00Z')
      vi.setSystemTime(creationTime)

      const task = Task.create({
        title: 'Initial Title',
        description: 'Some description',
        workspaceId: 'ws-1',
      }).success

      const updateTime = new Date('2024-03-02T14:30:00Z')
      vi.setSystemTime(updateTime)

      // Act
      const result = task.updateTitle('Updated Title')

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(task.title).toBe('Updated Title')
      expect(task.updatedAt).toEqual(updateTime)
    })

    it('should fail to update title if validation fails', () => {
      const task = Task.create({
        title: 'Initial Title',
        description: 'Some description',
        workspaceId: 'ws-1',
      }).success

      // Act
      const result = task.updateTitle('')

      // Assert
      expect(result.isFailure()).toBe(true)
      expect(result.failure.messageKey).toBe('TITULO_INVALIDO')
    })

    it('should update the description and refresh updatedAt', () => {
      // Arrange
      const creationTime = new Date('2024-03-01T10:00:00Z')
      vi.setSystemTime(creationTime)

      const task = Task.create({
        title: 'Task Title',
        description: 'Old Description',
        workspaceId: 'ws-1',
      }).success

      const updateTime = new Date('2024-03-05T09:15:00Z')
      vi.setSystemTime(updateTime)

      // Act
      const result = task.updateDescription('New detailed description')

      // Assert
      expect(result.isSuccess()).toBe(true)
      expect(task.description).toBe('New detailed description')
      expect(task.updatedAt).toEqual(updateTime)
    })
  })
})
