import Worker from 'camunda-worker-node';
import { IWorker } from 'camunda-worker-node/lib/worker';
import Backoff from 'camunda-worker-node/lib/backoff';
import dayjs from 'dayjs';
import { IMessageResponse, CamundaTask, STATUS } from './types';
import TelegramBot from './telegram';
import Datastore from './db';
import logger from './logger';

// Override Worker completeTask to include errorMessage
// I'm too lazy to fork the repo
Worker.prototype.completeTask = async function(
  task: any,
  newContext: any = {},
) {
  const taskId = task.id;
  const workerId = this.options.workerId;

  const newVariables = newContext.variables || {};
  const errorCode = newContext.errorCode;
  const errorMessage = newContext.errorMessage;

  if (errorCode) {
    console.log(errorCode, errorMessage);
    await this.engineApi.bpmnError(taskId, {
      workerId,
      errorCode,
      variables: {
        message: {
          value: JSON.stringify(errorMessage),
          type: 'String',
        },
      },
    });
  } else {
    await this.engineApi.taskCompleted(taskId, {
      workerId,
      variables: this.engineApi.serializeVariables(
        newVariables,
        task.variables,
      ),
    });
  }
};

const getCurrentDate = () => dayjs().format('YYYY-MM-DDTHH:mm:ss');

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
          `${getCurrentDate()} Performing task: ${
            CamundaTask.SendReminder
          } for id ${context.processInstanceId}`,
        );
        try {
          const telegramResponseId = await TelegramBot.instance.remind();
          return {
            variables: {
              startDateTime:
                context.variables.startDateTime || getCurrentDate(),
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
          `${getCurrentDate()} Performing task: ${
            CamundaTask.HandleTimeout
          } for id ${context.processInstanceId}`,
        );
        try {
          const { response, startDateTime } = context.variables;

          await Datastore.instance.markDone(
            context.processInstanceId,
            startDateTime,
            response,
            true,
          );

          return;
        } catch (e) {
          return Camunda.generateError('DatabaseError', e.message);
        }
      },
    );

    this.engineWorker.subscribe(
      CamundaTask.SaveResponse,
      async (context: any) => {
        logger.info(
          `${getCurrentDate()} Performing task: ${
            CamundaTask.SaveResponse
          } for id ${context.processInstanceId}`,
        );
        try {
          const { response, startDateTime } = context.variables;

          await Datastore.instance.markDone(
            context.processInstanceId,
            startDateTime,
            response,
          );

          return;
        } catch (e) {
          return Camunda.generateError('DatabaseError', e.message);
        }
      },
    );

    this.engineWorker.subscribe(
      CamundaTask.InformUser,
      async (context: any) => {
        logger.info(
          `${getCurrentDate()} Performing task: ${
            CamundaTask.InformUser
          } for id ${context.processInstanceId}`,
        );
        try {
          await TelegramBot.instance.inform(
            context.processInstanceId,
            context.variables.message,
          );
          return;
        } catch (e) {
          return Camunda.generateError('TelegramError', e.message);
        }
      },
    );

    this.engineWorker.subscribe(CamundaTask.LogError, async (context: any) => {
      const { errorCode, message } = context.variables;
      const timestamp = dayjs().format('YYYY-MM-DDTHH:mm:ss');
      logger.error({ timestamp, errorCode, message, context });
    });
    logger.info(getCurrentDate(), ' Started Camunda workers...');
  };
}

export default Camunda;
