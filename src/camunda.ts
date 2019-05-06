import Worker from 'camunda-worker-node';
import { IWorker } from 'camunda-worker-node/lib/worker';
import Backoff from 'camunda-worker-node/lib/backoff';
import { v4 as uuidv4 } from 'uuid';
import { IMessageResponse, CamundaTask, STATUS } from './types';

class Camunda {
  public static readonly engineEndpoint = 'http://localhost:8080/engine-rest';

  public static generateMessage = (
    telegramResponseId: string,
    responseStatus: STATUS,
  ): IMessageResponse => ({
    messageName: 'reminder-response-message',
    resultEnabled: true,
    correlationKeys: {
      telegramResponseId: {
        value: telegramResponseId,
        type: 'String',
      },
    },
    processVariables: {
      response: { value: responseStatus, type: 'String' },
    },
  });

  private engineWorker: IWorker;

  constructor() {
    this.engineWorker = Worker(Camunda.engineEndpoint, {
      workerId: 'engine-worker',
      use: [Backoff],
    });
  }

  public init = () => {
    this.engineWorker.subscribe(
      CamundaTask.SendReminder,
      async (context: any) => {
        console.log(context);
        return {
          variables: {
            telegramResponseId: uuidv4(),
          },
        };
      },
    );
    this.engineWorker.subscribe(
      CamundaTask.HandleTimeout,
      async (context: any) => {
        console.log(context);
        return {
          variables: {
            hello: false,
          },
        };
      },
    );
  };
}

export default Camunda;
