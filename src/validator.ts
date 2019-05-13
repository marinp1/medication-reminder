import Validator from 'better-validator';

import { IApplicationUpdate } from './types';

export const validateApplicationUpdateRequest = (req: IApplicationUpdate) => {
  const validator = Validator.create({});
  validator(req)
    .required()
    .isObject<IApplicationUpdate>(obj => {
      obj('date')
        .required()
        .isString()
        .isISO8601();
      obj('oldVersion')
        .required()
        .isString()
        .isMatch(/^\d+\.\d+.\d+$/);
      obj('newVersion')
        .required()
        .isString()
        .isMatch(/^\d+\.\d+.\d+$/);
      obj('updateNotes')
        .required()
        .isString();
      obj('diagramUpdate')
        .required()
        .isBoolean();
      obj().strict();
    });
  return validator.run();
};
