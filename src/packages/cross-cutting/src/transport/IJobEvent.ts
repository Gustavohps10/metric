export interface IJobProgressEvent {
  status: 'progress'
  value: number
}

export interface IJobDataEvent<T = unknown> {
  status: 'data'
  data: T
}

export interface IJobErrorEvent {
  status: 'error'
  error: string
}

export interface IJobDoneEvent {
  status: 'done'
}

export type IJobEvent<T = unknown> =
  | IJobProgressEvent
  | IJobDataEvent<T>
  | IJobErrorEvent
  | IJobDoneEvent

export interface IJobEvents<T = unknown> {
  [jobId: string]: IJobEvent<T>
}

export interface IJobResult {
  jobId: string
}
