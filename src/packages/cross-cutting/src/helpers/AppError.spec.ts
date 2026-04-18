import { describe, expect, it } from 'vitest'

import {
  AppError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './AppError'

describe('AppError', () => {
  it('should create a base error with default values', () => {
    // Arrange
    class TestError extends AppError {}

    // Act
    const error = new TestError('TEST_KEY')

    // Assert
    expect(error.messageKey).toBe('TEST_KEY')
    expect(error.details).toBeUndefined()
    expect(error.statusCode).toBe(500)
    expect(error.type).toBe('danger')
  })

  it('should create a base error with details', () => {
    // Arrange
    class TestError extends AppError {}
    const details = { field: ['error1'] }

    // Act
    const error = new TestError('TEST_KEY', details)

    // Assert
    expect(error.details).toEqual(details)
  })

  it('should create a danger error using static method', () => {
    // Arrange
    const details = { field: ['error'] }

    // Act
    const error = ValidationError.danger('VALIDATION_ERROR', details)

    // Assert
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.type).toBe('danger')
    expect(error.messageKey).toBe('VALIDATION_ERROR')
    expect(error.details).toEqual(details)
  })

  it('should create a warning error using static method', () => {
    // Arrange
    const details = { field: ['warning'] }

    // Act
    const error = ValidationError.warning('VALIDATION_WARNING', details)

    // Assert
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.type).toBe('warning')
    expect(error.messageKey).toBe('VALIDATION_WARNING')
    expect(error.details).toEqual(details)
  })
})

describe('NotFoundError', () => {
  it('should create with status 404', () => {
    // Arrange & Act
    const error = new NotFoundError('NOT_FOUND')

    // Assert
    expect(error.statusCode).toBe(404)
    expect(error.type).toBe('danger')
  })

  it('should allow custom type', () => {
    // Arrange & Act
    const error = new NotFoundError('NOT_FOUND', undefined, 'warning')

    // Assert
    expect(error.type).toBe('warning')
  })
})

describe('ValidationError', () => {
  it('should create with status 422', () => {
    // Arrange & Act
    const error = new ValidationError('VALIDATION')

    // Assert
    expect(error.statusCode).toBe(422)
  })
})

describe('UnauthorizedError', () => {
  it('should create with status 401', () => {
    // Arrange & Act
    const error = new UnauthorizedError('UNAUTHORIZED')

    // Assert
    expect(error.statusCode).toBe(401)
  })
})

describe('InternalServerError', () => {
  it('should create with status 500', () => {
    // Arrange & Act
    const error = new InternalServerError('INTERNAL')

    // Assert
    expect(error.statusCode).toBe(500)
  })
})

describe('Static factory inheritance behavior', () => {
  it('should preserve class type when using static danger', () => {
    // Arrange

    // Act
    const error = NotFoundError.danger('NOT_FOUND')

    // Assert
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.statusCode).toBe(404)
    expect(error.type).toBe('danger')
  })

  it('should preserve class type when using static warning', () => {
    // Arrange

    // Act
    const error = UnauthorizedError.warning('UNAUTHORIZED')

    // Assert
    expect(error).toBeInstanceOf(UnauthorizedError)
    expect(error.statusCode).toBe(401)
    expect(error.type).toBe('warning')
  })
})
