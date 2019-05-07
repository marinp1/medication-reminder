export type STATUS = 'YES' | 'NO' | 'WAIT';

export enum CamundaTask {
  SendReminder = 'send-reminder',
  ReceiveResponse = 'receive-response',
  HandleTimeout = 'handle-timeout',
  SaveResponse = 'save-response',
  InformUser = 'inform-user',
  LogError = 'log-error',
}

export interface IMessageResponse {
  messageName: 'reminder-response-message';
  correlationKeys: {
    telegramResponseId: {
      value: string;
      type: 'String';
    };
  };
  resultEnabled: boolean;
  processVariables: {
    response: {
      value: STATUS;
      type: 'String';
    };
  };
}
