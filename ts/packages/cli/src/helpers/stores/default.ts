import _ from 'lodash';
import inquirer, { Question } from 'inquirer';
import { capitalCase } from 'change-case';
import { StoreType, STORE_CONFIGURATION } from '@configu/lib';

export const defaultInteractiveSession = async (store: StoreType) => {
  const storeConfigurationDefinition = STORE_CONFIGURATION[store];
  const storeConfigurationQuestions = _(storeConfigurationDefinition)
    .entries()
    .map<Question>(([key, settings]) => {
      return {
        type: 'input',
        name: key,
        message: `Enter ${capitalCase(key)} (${settings.required ? 'required' : 'optional'})`,
        validate(input) {
          if (settings.required && !input) {
            return `${capitalCase(key)} is required`;
          }
          return true;
        },
      };
    })
    .value();
  const storeConfigurationAnswers = await inquirer.prompt(storeConfigurationQuestions);
  return _(storeConfigurationAnswers).omitBy(_.isEmpty).value();
};
