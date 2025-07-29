/**
 * @module astalim
 * @description Async Task Limiter.
 */

/**
 * @template T
 * @function
 * @param {number} limit - Maximum number of tasks running in parallel.
 * @returns {{
 *   addTask: (task: Promise<T> | (() => Promise<T>)) => Promise<void>,
 *   waitResult: () => Promise<{
 *     successful: T[],
 *     failed: Array<{ error: any, index: number }>
 *   }>
 * }}
 * @description Creates a task manager that queues and executes asynchronous tasks with concurrency control.
 */
export default {
  tasks_async<T>(limit: number) {
    const tasks: Promise<T>[] = []
    const executing = new Set<Promise<T>>()
    return {

      /**
       * Adds an asynchronous task to the queue. If concurrency limit is reached, waits for one to complete.
       * @param {Promise<T> | (() => Promise<T>)} task - Task or task factory to be executed.
       * @returns {Promise<void>}
       */
      async addTask(task: Promise<T> | (() => Promise<T>)): Promise<void> {
        const taskWrapper = (typeof task === "function" ? task() : task)
          .finally(() => executing.delete(taskWrapper))
        tasks.push(taskWrapper)
        executing.add(taskWrapper)
        if (executing.size >= limit) await Promise.race(executing).catch(() => { })
      },

      /**
       * Waits for all queued tasks to finish. Returns successful results and error descriptors.
       * @returns {Promise<{
       *   successful: T[],
       *   failed: Array<{ error: any, index: number }>
       * }>}
       */
      async waitResult(): Promise<{
        successful: T[],
        failed: Array<{ error: any, index: number }>
      }> {
        const settlements = await Promise.allSettled(tasks)
        tasks.length = 0
        executing.clear()
        return settlements.reduce((acc, settlement, index) => {
          if (settlement.status === "fulfilled") acc.successful.push(settlement.value as T)
          else acc.failed.push({ error: settlement.reason, index })
          return acc
        }, { successful: [] as T[], failed: [] as Array<{ error: any, index: number }> })
      },

    }
  }
}
