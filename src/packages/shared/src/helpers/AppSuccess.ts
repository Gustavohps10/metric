export class AppSuccess<Data = void> {
  constructor(
    public readonly data?: Data,
    public readonly statusCode: number = 200,
  ) {}

  static ok<Data>(data: Data): AppSuccess<Data> {
    return new AppSuccess(data, 200)
  }

  static created<Data>(data: Data): AppSuccess<Data> {
    return new AppSuccess(data, 201)
  }

  static accepted<Data>(data: Data): AppSuccess<Data> {
    return new AppSuccess(data, 202)
  }

  static noContent(): AppSuccess<void> {
    return new AppSuccess(undefined, 204)
  }
}
