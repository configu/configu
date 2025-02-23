/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { spinner } from '@clack/prompts';

export type Task = {
  /**
   * Task title
   */
  title: string;
  /**
   * Task function
   */
  task: (message: (string: string) => void) => string | Promise<string> | void | Promise<void>;

  /**
   * If enabled === true the task will be ran
   */
  enabled: boolean;
};

/**
 * Define a group of tasks to be executed
 */
export const tasks = async (taskDefs: Task[]) => {
  for (const task of taskDefs) {
    if (task.enabled === true) {
      const s = spinner();
      try {
        s.start(task.title);
        const result = await task.task(s.message);
        s.stop(result || task.title);
      } catch (error) {
        s.stop(task.title, 1);
        throw error;
      }
    }
  }
};
