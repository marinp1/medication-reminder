export type STATUS = 'YES' | 'NO' | 'WAIT';

export enum CamundaTask {
  SendReminder = 'send-reminder',
  ReceiveResponse = 'receive-response',
  SaveResponse = 'save-response',
  InformUser = 'inform-user',
  LogError = 'log-error',
}

export interface IMessageResponse {
  messageName: 'reminder-response-message' | 'wait-response-message';
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

export interface IReminderDocument {
  id: string;
  startDateTime: Date;
  endDateTime: Date;
  status: 'YES' | 'NO';
  expired: boolean;
}

export interface IApplicationUpdate {
  date: string;
  oldVersion: string;
  newVerson: string;
  updateNotes: string;
  diagramUpdate: boolean;
}
