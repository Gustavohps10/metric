import { describe, expect, it } from 'vitest'

import { Entity } from './Entity'

class UserTestEntity extends Entity {
  private _id: string
  private _name: string
  private _isActive: boolean

  private constructor(id: string, name: string, isActive: boolean) {
    super()
    this._id = id
    this._name = name
    this._isActive = isActive
  }

  get id() {
    return this._id
  }
  get name() {
    return this._name
  }
  get isActive() {
    return this._isActive
  }

  doSomething() {
    return true
  }
}

describe('Entity (Abstract Base Class)', () => {
  it('should instantiate and hydrate a subclass mapping keys to _keys', () => {
    // Arrange
    const payload = {
      id: 'usr-123',
      name: 'Jane Doe',
      isActive: true,
    }

    // Act
    const entity = UserTestEntity.hydrate(payload)

    // Assert
    expect(entity).toBeInstanceOf(UserTestEntity)
    expect(entity).toBeInstanceOf(Entity)

    expect(entity.id).toBe('usr-123')
    expect(entity.name).toBe('Jane Doe')
    expect(entity.isActive).toBe(true)
  })

  it('should bypass the constructor logic via Object.create', () => {
    // Arrange
    class StrictEntity extends Entity {
      private _status: string

      private constructor() {
        super()
        this._status = 'INITIALIZED_BY_CONSTRUCTOR'
      }

      get status() {
        return this._status
      }
    }

    const payload = { status: 'HYDRATED_FROM_DATABASE' }

    // Act
    const entity = StrictEntity.hydrate(payload)

    // Assert
    expect(entity.status).toBe('HYDRATED_FROM_DATABASE')
  })
})
