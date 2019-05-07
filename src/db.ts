import nedb from 'nedb';
import dayjs from 'dayjs';
import logger from './logger';

interface IReminderDocument {
  id: string;
  startDateTime: Date;
  endDateTime: Date;
  status: 'YES' | 'NO';
  expired: boolean;
}

class Database {
  public static instance: Database;
  private readonly datastore: nedb;

  constructor() {
    this.datastore = new nedb({
      filename: 'datastore.db',
      autoload: true,
    });
    return this;
  }

  public markDone = (
    id: string,
    startDateTime: string,
    status: 'YES' | 'NO',
    expired: boolean = false,
  ) => {
    const doc: IReminderDocument = {
      id,
      startDateTime: dayjs(startDateTime, 'YYYY-MM-DDTHH:mm:ss').toDate(),
      endDateTime: dayjs().toDate(),
      status,
      expired,
    };

    return new Promise((resolve, reject) => {
      return this.datastore.insert(doc, (err, res) => {
        if (err) {
          return reject(new Error(err.message));
        }
        logger.info(
          `${dayjs().format('YYYY-MM-DDTHH:mm:ss')} ${
            res.id
          } added successfully`,
        );
        return resolve(true);
      });
    });
  };
}

export default Database;
