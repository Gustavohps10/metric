import { describe, expect, it } from 'vitest'

import { AppSuccess } from './AppSuccess'

describe('AppSuccess', () => {
  describe('Static Factories (Points of Entry)', () => {
    it('should create an ok response with status 200', () => {
      const data = { id: '1', name: 'Workspace' }

      const success = AppSuccess.ok(data)

      expect(success.data).toEqual(data)
      expect(success.statusCode).toBe(200)
    })

    it('should create a created response with status 201', () => {
      const data = { id: '1' }

      const success = AppSuccess.created(data)

      expect(success.data).toEqual(data)
      expect(success.statusCode).toBe(201)
    })

    it('should create an accepted response with status 202', () => {
      const data = { queued: true }

      const success = AppSuccess.accepted(data)

      expect(success.data).toEqual(data)
      expect(success.statusCode).toBe(202)
    })

    it('should create a noContent response with status 204', () => {
      const success = AppSuccess.noContent()

      expect(success.data).toBeUndefined()
      expect(success.statusCode).toBe(204)
    })
  })

  describe('Constructor', () => {
    it('should allow explicit statusCode override', () => {
      const data = { message: 'custom' }

      const success = new AppSuccess(data, 299)

      expect(success.data).toEqual(data)
      expect(success.statusCode).toBe(299)
    })

    it('should default to status 200 when statusCode is omitted', () => {
      const data = { ok: true }

      const success = new AppSuccess(data)

      expect(success.data).toEqual(data)
      expect(success.statusCode).toBe(200)
    })

    it('should support void payload', () => {
      const success = new AppSuccess()

      expect(success.data).toBeUndefined()
      expect(success.statusCode).toBe(200)
    })
  })
})
