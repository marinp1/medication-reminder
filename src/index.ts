import express from 'express';
import { Request, Response } from 'express';
import axios from 'axios';
import Camunda from './camunda';

const app = express();

const { PORT = 3000 } = process.env;

class CamundaError extends Error {
  constructor() {
    super('Error with sending message to Camunda');
  }
}

app.get('/', (req: Request, res: Response) => {
  res.sendStatus(200);
});

app.post(
  '/response/:telegramResponseId',
  async (req: Request, res: Response) => {
    const { telegramResponseId } = req.params;
    try {
      if (!telegramResponseId) {
        throw new Error('Invalid response ID');
      }

      const endpoint = Camunda.engineEndpoint + '/message';
      const response = await axios.post(
        endpoint,
        Camunda.generateMessage(telegramResponseId, 'YES'),
      );

      if (response.status !== 200 || !response.data || !response.data.length) {
        throw new CamundaError();
      }

      const executionId = response.data[0].execution.id;
      console.log(`Message send successfully to ${executionId}`);
      res.sendStatus(200);
    } catch (e) {
      const message = e.response ? e.response.data.message : e.message;
      const statusCode = e.response ? e.response.status : 500;
      console.error(new Error(statusCode + ': ' + message));
      res.status(statusCode).send({
        message,
        status: statusCode,
      });
    }
  },
);

if (require.main === module) {
  // true if file is executed
  app.listen(PORT, () => {
    console.log('server started at http://localhost:' + PORT);
  });
}

const CamundaWorker = new Camunda();
CamundaWorker.init();

export default app;
