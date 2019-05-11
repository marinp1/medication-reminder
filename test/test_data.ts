import dayjs from 'dayjs';
import { IReminderDocument } from '../src/types/index';

const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const SUCCESS_EARLY: IReminderDocument = {
  id: 'af76d5bf-c820-44f6-9f42-e7a2380c6042',
  startDateTime: dayjs('2019-05-05T20:00:00', DATE_FORMAT).toDate(),
  endDateTime: dayjs('2019-05-05T21:00:00', DATE_FORMAT).toDate(),
  status: 'YES',
  expired: false,
};

const SUCCESS_LATE: IReminderDocument = {
  id: '7068d44b-151e-4d6b-b96c-05f96dd8bc2c',
  startDateTime: dayjs('2019-05-06T07:00:00', DATE_FORMAT).toDate(),
  endDateTime: dayjs('2019-05-06T11:20:00', DATE_FORMAT).toDate(),
  status: 'YES',
  expired: false,
};

const FAILURE_LATE: IReminderDocument = {
  id: '6d0f1b2d-ef00-42e5-8ff0-0b3eb2bc201b',
  startDateTime: dayjs('2019-04-08T07:00:00', DATE_FORMAT).toDate(),
  endDateTime: dayjs('2019-04-08T15:20:00', DATE_FORMAT).toDate(),
  status: 'NO',
  expired: false,
};

const FAILURE_EARLY_EXPIRED: IReminderDocument = {
  id: '4884929e-30ae-4700-bfa9-82e4de3aa62b',
  startDateTime: dayjs('2019-06-06T07:00:00', DATE_FORMAT).toDate(),
  endDateTime: dayjs('2019-06-06T10:20:00', DATE_FORMAT).toDate(),
  status: 'NO',
  expired: true,
};

export const ALL_ENTRIES = [
  SUCCESS_EARLY,
  SUCCESS_LATE,
  FAILURE_LATE,
  FAILURE_EARLY_EXPIRED,
];

export default {
  SUCCESS_EARLY,
  SUCCESS_LATE,
  FAILURE_LATE,
  FAILURE_EARLY_EXPIRED,
};
