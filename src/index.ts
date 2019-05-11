import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import request from 'request';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import axios from 'axios';
import TelegramBot from './telegram';
import Datastore from './db';
import Camunda from './camunda';
import logger from './logger';

const app = express();
const camundaEndpoint = Camunda.engineEndpoint;

const ROOT_PATH = path.dirname((process.mainModule as NodeModule).filename);

const { PORT = 3000, AUTH_TOKEN } = process.env;
if (!AUTH_TOKEN) {
  throw new Error('Auth token not set!');
}

app.get('/health-check', (req: Request, res: Response) => {
  res.sendStatus(200);
});

interface ICamundaDeployment {
  links: any[];
  id: string;
  name: string;
  source: any;
  deploymentTime: string;
  tenantId: any;
}

app.post('/deploy', async (req: Request, res: Response) => {
  if (req.headers.authorization !== AUTH_TOKEN) {
    return res.sendStatus(403);
  }

  try {
    const getResponse = await axios.get(`${camundaEndpoint}/deployment`);
    const result = getResponse.data as ICamundaDeployment[];

    if (result && result.length > 0) {
      const { id, name } = result[0];
      console.log(`Found deployment ${name} with id ${id}`);
      await axios.delete(`${camundaEndpoint}/deployment/${id}?cascade=true`);
      console.log(`Deleted deployment ${id}`);
    }

    require('../diagram.bpmn');
    const diagramPath = `${ROOT_PATH}/diagram.bpmn`;

    const requestOptions = {
      method: 'POST',
      url: `${camundaEndpoint}/deployment/create`,
      headers: {
        'content-type': 'multipart/form-data',
      },
      formData: {
        'deployment-name': 'Medication Reminder',
        'deployment-source': 'process application',
        data: {
          value: fs.createReadStream(diagramPath),
          options: {
            filename: diagramPath,
            contentType: null,
          },
        },
      },
    };

    return request(requestOptions, (error, response, body) => {
      if (error) {
        throw new Error(error);
      }

      const data = JSON.parse(body);
      console.log(`Deployed ${data.name} with id ${data.id}`);

      return res.status(200).send({
        status: 200,
        message: 'Diagram deployed successfully',
        redeploy: result && result.length > 0,
      });
    });
  } catch (e) {
    const status = e.response ? e.response.status : 500;
    const message = e.response ? e.response.data.message : e.message;
    return res.status(status).send({
      status,
      message,
    });
  }
});

if (require.main === module) {
  // true if file is executed
  app.listen(PORT, () => {
    logger.info('Server started at http://localhost:' + PORT);
  });
}

TelegramBot.instance = new TelegramBot();
Datastore.instance = new Datastore();

export default app;
