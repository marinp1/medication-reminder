import Worker from 'camunda-worker-node';
import { IWorker } from 'camunda-worker-node/lib/worker';
import Backoff from 'camunda-worker-node/lib/backoff';
import dayjs from 'dayjs';
import { IMessageResponse, CamundaTask, STATUS } from './types';
import TelegramBot from './telegram';
import logger from './logger';

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
        logger.info(
          `Performing task: ${CamundaTask.SendReminder} for id ${
            context.processInstanceId
          }`,
        );
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
        logger.info(
          `Performing task: ${CamundaTask.HandleTimeout} for id ${
            context.processInstanceId
          }`,
        );
        return {
          variables: {
            hello: false,
          },
        };
      },
    );

    this.engineWorker.subscribe(
      CamundaTask.SaveResponse,
      async (context: any) => {
        logger.info(
          `Performing task: ${CamundaTask.SaveResponse} for id ${
            context.processInstanceId
          }`,
        );
        try {
          throw new Error('Database error occured');
        } catch (e) {
          return Camunda.generateError('DatabaseError', e.message);
        }
      },
    );

    this.engineWorker.subscribe(
      CamundaTask.InformUser,
      async (context: any) => {
        logger.info(
          `Performing task: ${CamundaTask.InformUser} for id ${
            context.processInstanceId
          }`,
        );
        try {
          await TelegramBot.instance.inform(context);
          return;
        } catch (e) {
          return Camunda.generateError('TelegramError', e.message);
        }
      },
    );

    this.engineWorker.subscribe(CamundaTask.LogError, async (context: any) => {
      const { errorCode, errorMessage } = context.variables;
      const timestamp = dayjs().format('YYYY-MM-DDTHH:mm:ss');
      logger.error({ timestamp, errorCode, errorMessage, context });
    });
    logger.info('Started Camunda workers...');
  };
}

export default Camunda;
