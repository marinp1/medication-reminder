import nedb from 'nedb';
import dayjs from 'dayjs';
import logger from './logger';

import { IReminderDocument } from './types';

class Database {
  public static instance: Database;
  private readonly datastore: nedb;

  constructor() {
    this.datastore =
      process.env.NODE_ENV === 'production'
        ? new nedb({
            filename: 'datastore.db',
            autoload: true,
          })
        : new nedb();
    return this;
  }

  public markDone = (
    id: string,
    startDateTime: string,
    status: 'YES' | 'NO',
    expired: boolean = false,
  ): Promise<true> => {
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

  public getLatestSuccess = (): Promise<IReminderDocument> =>
    new Promise((resolve, reject) => {
      return this.datastore
        .find<IReminderDocument>({ status: 'YES' })
        .sort({ endDateTime: -1 })
        .exec((err, docs) => {
          if (err) {
            return reject(new Error(err.message));
          }
          return resolve(docs[0]);
        });
    });

  public insertDocument = (document: IReminderDocument): Promise<true> =>
    new Promise((resolve, reject) => {
      return this.datastore.insert<IReminderDocument>(document, (err, doc) => {
        if (err) {
          return reject(new Error(err.message));
        }
        return resolve(true);
      });
    });

  public getDocumentCount = (): Promise<number> =>
    new Promise((resolve, reject) => {
      return this.datastore.count({}).exec((err, count: number) => {
        if (err) {
          return reject(new Error(err.message));
        }
        return resolve(count);
      });
    });
}

export default Database;
