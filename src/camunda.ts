import Worker from 'camunda-worker-node';
import { IWorker } from 'camunda-worker-node/lib/worker';
import Backoff from 'camunda-worker-node/lib/backoff';
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

  public static generateError = (
    error: 'TelegramError' | 'DatabaseError',
    errorMessage: string,
  ) => ({
    errorCode: error,
    errorMessage,
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
        return Camunda.generateError(
          'TelegramError',
          'Could not send reminder!',
        );
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
