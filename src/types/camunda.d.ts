declare module 'camunda-worker-node/lib/backoff' {
  export class IBackoff {
    maxPollingInterval: number;
    minPollingInterval: number;
    maxActiveTasks: number;
    stepping: number;
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

declare module 'camunda-worker-node/lib/worker' {
  export enum STATE {
    STATE_NEW = 'NEW',
    STATE_RUNNING = 'RUNNING',
    STATE_STOPPED = 'STOPPED',
  }

  export interface IWorkSubscription {}
  export interface ITask {}

  export class IWorker {
    subscriptions: IWorkSubscription[];
    state: STATE;
    start: () => any;
    addSubscription: (data: { topicName: string }) => IWorkSubscription;
    removeSubscription: (subscription: IWorkSubscription) => any;
    subscribe: (
      topicName: string,
      options: { [key: string]: any },
      fn?: any,
    ) => IWorkSubscription;
    registerWorker: (a: any, b: any, c: any) => IWorkSubscription;
    poll: () => any;
    fetchTasks: (topics: any[]) => any[];
    executeTasks: (tasks: ITask[]) => any;
    executeTask: (task: ITask) => any;
    createTaskContext: (task: ITask) => any;
    completeTask: (task: ITask, newContext?: { [key: string]: any }) => any;
    configure: (newOptions: { [key: string]: any }) => void;
    stop: () => void;
    shutdown: () => void;
    extendLock: (task: ITask, newDuration: number) => void;
    reschedule: (waitMs: number) => void;
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
