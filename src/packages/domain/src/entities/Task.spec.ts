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
      const task = Task.create({
        title: 'Review PR',
        description: 'Review the payment gateway integration',
        workspaceId: 'ws-100',
      })

      // Assert
      expect(task.id).toBe('mocked-uuid-1234-5678')
      expect(task.title).toBe('Review PR')
      expect(task.description).toBe('Review the payment gateway integration')
      expect(task.workspaceId).toBe('ws-100')
      expect(task.isFallback).toBe(false)
      expect(task.externalId).toBeUndefined()
      expect(task.externalType).toBeUndefined()

      expect(task.createdAt).toEqual(now)
      expect(task.updatedAt).toEqual(now)
    })

    it('should create a task mapped to an external integration', () => {
      // Arrange & Act
      const task = Task.create({
        title: 'Fix Login',
        description: 'Users cannot login',
        workspaceId: 'ws-100',
        externalId: 'JIRA-899',
        externalType: 'JIRA',
        isFallback: false,
      })

      // Assert
      expect(task.externalId).toBe('JIRA-899')
      expect(task.externalType).toBe('JIRA')
    })

    it('should create a predefined fallback task', () => {
      // Arrange & Act
      const task = Task.createFallback('ws-999')

      // Assert
      expect(task.title).toBe('General Task')
      expect(task.description).toBe(
        'Fallback task for time entries without specific tasks',
      )
      expect(task.workspaceId).toBe('ws-999')
      expect(task.isFallback).toBe(true)
    })
  })

  describe('Updates (Setters)', () => {
    it('should update the title and refresh updatedAt', () => {
      // Arrange
      const creationTime = new Date('2024-03-01T10:00:00Z')
      vi.setSystemTime(creationTime)

      const task = Task.create({
        title: 'Initial Title',
        description: 'Some description',
        workspaceId: 'ws-1',
      })

      const updateTime = new Date('2024-03-02T14:30:00Z')
      vi.setSystemTime(updateTime)

      // Act
      task.title = 'Updated Title'

      // Assert
      expect(task.title).toBe('Updated Title')
      expect(task.createdAt).toEqual(creationTime)
      expect(task.updatedAt).toEqual(updateTime)
    })

    it('should update the description and refresh updatedAt', () => {
      // Arrange
      const creationTime = new Date('2024-03-01T10:00:00Z')
      vi.setSystemTime(creationTime)

      const task = Task.create({
        title: 'Task Title',
        description: 'Old Description',
        workspaceId: 'ws-1',
      })

      const updateTime = new Date('2024-03-05T09:15:00Z')
      vi.setSystemTime(updateTime)

      // Act
      task.description = 'New detailed description'

      // Assert
      expect(task.description).toBe('New detailed description')
      expect(task.createdAt).toEqual(creationTime)
      expect(task.updatedAt).toEqual(updateTime)
    })
  })
})
