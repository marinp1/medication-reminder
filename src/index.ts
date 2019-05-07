import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Request, Response } from 'express';
import TelegramBot from './telegram';
import logger from './logger';

const app = express();

const { PORT = 3000 } = process.env;

app.get('/', (req: Request, res: Response) => {
  res.sendStatus(200);
});

if (require.main === module) {
  // true if file is executed
  app.listen(PORT, () => {
    logger.info('server started at http://localhost:' + PORT);
  });
}

TelegramBot.instance = new TelegramBot();

export default app;
