import Worker from 'camunda-worker-node';
import { IWorker } from 'camunda-worker-node/lib/worker';
import Backoff from 'camunda-worker-node/lib/backoff';
import { IMessageResponse, CamundaTask, STATUS } from './types';

import TelegramBot from './telegram';

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
        console.log(`Task: ${CamundaTask.SendReminder} for id ${context.id}`);
        try {
          const telegramResponseId = await TelegramBot.instance.remind();
          return {
            variables: {
              telegramResponseId,
            },
          };
        } catch (e) {
          return Camunda.generateError('TelegramError', e.message);
        }
      },
    );

    this.engineWorker.subscribe(
      CamundaTask.HandleTimeout,
      async (context: any) => {
        console.log(`Task: ${CamundaTask.HandleTimeout} for id ${context.id}`);
        return {
          variables: {
            hello: false,
          },
        };
      },
    );

    console.log('Started Camunda workers...');
  };
}

export default Camunda;
