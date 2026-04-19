export class Either<Failure, Success> {
  private readonly _isSuccess: boolean

  private constructor(
    private readonly _failure: Failure | undefined,
    private readonly _success: Success | undefined,
    isSuccess: boolean,
  ) {
    this._isSuccess = isSuccess
  }

  forwardFailure<Success>(): Either<Failure, Success> {
    return Either.failure<Failure>(this.failure)
  }

  // ========= Success Factory Methods =========
  static success(): Either<never, void>
  static success<Success>(value: Success): Either<never, Success>
  static success<Success>(value?: Success): Either<never, Success | void> {
    return new Either<never, any>(undefined, value, true)
  }

  // ========= Failure Factory Methods =========
  static failure<Failure, Success = never>(
    value: Failure,
  ): Either<Failure, Success> {
    return new Either<Failure, Success>(value, undefined, false)
  }

  // ========= Status Checkers =========
  isFailure(): boolean {
    return !this._isSuccess
  }

  isSuccess(): boolean {
    return this._isSuccess
  }

  // ========= Value Getters =========
  get failure(): Failure {
    if (!this.isFailure()) throw new Error('No failure value')
    return this._failure!
  }

  get success(): Success {
    if (!this.isSuccess()) throw new Error('No success value')
    return this._success!
  }

  // ========= Transformations =========
  map<U>(fn: (s: Success) => U): Either<Failure, U> {
    return this.isSuccess()
      ? new Either<Failure, U>(undefined, fn(this.success), true)
      : new Either<Failure, U>(this.failure, undefined, false)
  }

  flatMap<U>(fn: (s: Success) => Either<Failure, U>): Either<Failure, U> {
    return this.isSuccess()
      ? fn(this.success)
      : new Either<Failure, U>(this.failure, undefined, false)
  }

  getOrElse(defaultValue: Success): Success {
    return this.isSuccess() ? this.success : defaultValue
  }

  unwrap(): Failure | Success {
    return this.isSuccess() ? this.success : this.failure!
  }
}
