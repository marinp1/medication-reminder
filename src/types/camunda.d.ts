declare module 'camunda-worker-node/lib/backoff' {
  export class IBackoff {
    public maxPollingInterval: number;
    public minPollingInterval: number;
    public maxActiveTasks: number;
    public stepping: number;
  }

  function Backoff(
    worker: any,
    options?: {
      maxPollingInterval: number;
      minPollingInterval: number;
      maxActiveTasks: number;
      stepping: number;
    },
  ): IBackoff;

  export default IBackoff;
}

declare module 'camunda-worker-node/lib/engine/api' {
  export class IEngineAPI {
    public bpmnError: (
      taskId: string,
      body: {
        workerId: string;
        errorCode: string;
        errorMessage: string;
      },
    ) => void;
    public taskFailed: (
      taskId: string,
      body: {
        workerId: string;
        errorMessage: string;
        retries: number;
        retryTimeout: number;
      },
    ) => void;
  }
  function Api(
    baseUrl: string,
    defaultRequestOptions: any,
    apiVersion: string,
  ): IEngineAPI;
  export default Api;
}

declare module 'camunda-worker-node/lib/worker' {
  import { IEngineAPI } from 'camunda-worker-node/lib/engine/api';

  export enum STATE {
    STATE_NEW = 'NEW',
    STATE_RUNNING = 'RUNNING',
    STATE_STOPPED = 'STOPPED',
  }

  export interface ITask {
    id: string;
    [key: string]: any;
  }

  export class IWorker {
    public subscriptions: any[];
    public state: STATE;
    public engineApi: IEngineAPI;
    public start: () => any;
    public addSubscription: (data: { topicName: string }) => any;
    public removeSubscription: (subscription: any) => any;
    public error: (
      msg: string,
      err: {
        workerId: string;
        errorCode: string;
        errorMessage: string;
      },
    ) => void;
    public subscribe: (
      topicName: string,
      options: { [key: string]: any },
      fn?: any,
    ) => any;
    public registerWorker: (a: any, b: any, c: any) => any;
    public poll: () => any;
    public fetchTasks: (topics: any[]) => any[];
    public executeTasks: (tasks: ITask[]) => any;
    public executeTask: (task: ITask) => any;
    public createTaskContext: (task: ITask) => any;
    public completeTask: (
      task: ITask,
      newContext?: { [key: string]: any },
    ) => any;
    public configure: (newOptions: { [key: string]: any }) => void;
    public stop: () => void;
    public shutdown: () => void;
    public extendLock: (task: ITask, newDuration: number) => void;
    public reschedule: (waitMs: number) => void;
  }
}

declare module 'camunda-worker-node' {
  import { IWorker } from 'camunda-worker-node/lib/worker';
  namespace Worker {}
  function Worker(
    endpoint: string,
    options: {
      workerId: string;
      use: any[];
    },
  ): IWorker;
  export = Worker;
}
