import TelegramService from 'node-telegram-bot-api';
import CamundaService from './camunda';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';

import { STATUS } from './types';

class TelegramBot {
  public static instance: TelegramBot;
  public readonly VALID_USER_ID: string;
  private readonly bot: TelegramService;
  private readonly Camunda: CamundaService;

  constructor() {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID } = process.env;
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_USER_ID) {
      throw new Error('Required environment variables missing');
    }
    this.VALID_USER_ID = TELEGRAM_USER_ID;
    this.bot = new TelegramService(TELEGRAM_BOT_TOKEN);
    this.Camunda = new CamundaService();
    this.init();
    return this;
  }

  public async remind() {
    try {
      const id = uuidv4();
      await this.bot.sendMessage(
        this.VALID_USER_ID,
        '*Reminder: Have you taken meds?*',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            force_reply: true,
            inline_keyboard: [
              [
                {
                  text: 'Wait',
                  callback_data: JSON.stringify({ id, response: 'WAIT' }),
                },
              ],
              [
                {
                  text: 'Yes',
                  callback_data: JSON.stringify({ id, response: 'YES' }),
                },
                {
                  text: 'No',
                  callback_data: JSON.stringify({ id, response: 'NO' }),
                },
              ],
            ],
          },
        },
      );
      return id;
    } catch (e) {
      throw e;
    }
  }

  public async inform(context: string) {
    try {
      await this.bot.sendMessage(
        this.VALID_USER_ID,
        'Database error for following context:\n:```' +
          JSON.stringify(context) +
          '```',
        {
          parse_mode: 'Markdown',
        },
      );
    } catch (e) {
      throw e;
    }
  }

  private unauthorised(chatId: string) {
    return this.bot.sendMessage(
      chatId,
      'You are not authorised to use this bot.',
    );
  }

  private init() {
    this.bot.onText(/^\/start$/, (msg, match) => {
      const chatId = String(msg.chat.id);
      if (chatId !== this.VALID_USER_ID || !msg.from) {
        return this.unauthorised(chatId);
      } else {
        return this.bot.sendMessage(
          chatId,
          `Hello ${msg.from && msg.from.first_name} (${msg.from.id})`,
        );
      }
    });
    this.bot.on('callback_query', async query => {
      try {
        const { id, response } = JSON.parse(query.data as string);
        if (!id || !response) {
          throw new Error('Invalid answer');
        }
        await this.respond(id, response);
        switch (response as STATUS) {
          case 'YES':
            this.bot.sendMessage(this.VALID_USER_ID, `Alright, noted.`);
            break;
          case 'NO':
            this.bot.sendMessage(this.VALID_USER_ID, `Shame on you.`);
            break;
          case 'WAIT':
            this.bot.sendMessage(
              this.VALID_USER_ID,
              `I will remind you again in 30 minutes.`,
            );
            break;
          default:
            this.bot.sendMessage(
              this.VALID_USER_ID,
              `I don't know how to respond`,
            );
        }
        this.bot.answerCallbackQuery(query.id, {
          text: 'Response saved',
        });
      } catch (e) {
        if (e.message.startsWith('400:')) {
          this.bot.answerCallbackQuery(query.id, {
            text: 'Task has expired or you have responsed to it already.',
          });
        } else {
          this.bot.sendMessage(this.VALID_USER_ID, e.message);
          console.error(e);
        }
      }
    });
    logger.info('Started to poll Telegram...');
    this.bot.startPolling();
    this.Camunda.init();
  }

  private async respond(id: string, result: STATUS) {
    try {
      if (!id) {
        throw new Error('Invalid response ID');
      }

      const endpoint = CamundaService.engineEndpoint + '/message';
      const response = await axios.post(
        endpoint,
        CamundaService.generateMessage(id, result),
      );

      if (response.status !== 200 || !response.data || !response.data.length) {
        throw new Error('Could not reach Camunda!');
      }
    } catch (e) {
      const message = e.response ? e.response.data.message : e.message;
      const statusCode = e.response ? e.response.status : 500;
      throw new Error(statusCode + ': ' + message);
    }
  }
}

export default TelegramBot;
