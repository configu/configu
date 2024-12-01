const isDebug = process.env.CONFIGU_DEBUG === 'true';

const logger = isDebug
  ? console
  : {
      log: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

export default logger;
