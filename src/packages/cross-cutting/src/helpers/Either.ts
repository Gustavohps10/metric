export class Either<Failure, Success> {
  private constructor(
    private readonly _failure: Failure | undefined,
    private readonly _success: Success | undefined,
  ) {}

  forwardFailure<Success>(): Either<Failure, Success> {
    return Either.failure<Failure>(this.failure)
  }

  // ========= Failure Factory Methods =========
  static success<Success>(value: Success): Either<never, Success> {
    return new Either<never, Success>(undefined, value)
  }

  static failure<Failure, Success = never>(
    value: Failure,
  ): Either<Failure, Success> {
    return new Either<Failure, Success>(value, undefined)
  }
  // ========= Succes Status Checkers =========
  isFailure(): boolean {
    return this._failure !== undefined
  }

  isSuccess(): boolean {
    return this._success !== undefined
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
      ? new Either<Failure, U>(undefined, fn(this.success))
      : new Either<Failure, U>(this.failure, undefined)
  }

  flatMap<U>(fn: (s: Success) => Either<Failure, U>): Either<Failure, U> {
    return this.isSuccess()
      ? fn(this.success)
      : new Either<Failure, U>(this.failure, undefined)
  }

  getOrElse(defaultValue: Success): Success {
    return this.isSuccess() ? this.success : defaultValue
  }

  unwrap(): Failure | Success {
    return this.isSuccess() ? this.success : this.failure
  }
}
