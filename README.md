<div align="center">

[![Русский](https://img.shields.io/badge/-Русский-blue)](https://github.com/IPcorps/astalim/blob/main/README_RU.md)
# ASync TAsk LIMiter
_(Parallel manager for asynchronous tasks with a limit on the number of concurrently executing tasks)_
</div>

<h1 align="center">Usage Template</h1>

```ts
import astalim from "astalim"

// Number of concurrently running tasks
const limit: number = 5

// Create task executor
const tasks = astalim.taskPool(limit)

// Add tasks in a loop
for (const path of <paths>) {
  await tasks.addTask(async () => {
    ...
    <Some work with the current path>
    ...
  })
}

// Get processing result
const results = await tasks.waitResult()
```

<h1 align="center">Step-by-step Explanation</h1>

# 1. Creating the Executor
```ts
const tasks = astalim.taskPool(limit: number)
```
At most **limit** tasks will be running concurrently.

# 2. Adding Tasks
```ts
for (const path of <paths>) {
  await tasks.addTask(async () => {
    ...
    <Some work with the current path>
    ...
  })
}
```
The **addTask** method accepts either a **Promise** or a function that returns a **Promise**. Once the limit is reached, the next task will not start until space in the pool is freed and it's added to the pool.

**🔴 IMPORTANT:** Regardless of what happens inside a task, the main execution flow will not be interrupted. All thrown exceptions (errors) will silently be recorded in the result’s shared error array.

# 3. Getting the Result
```ts
const results = await tasks.waitResult()
```
Waits for all tasks to fully complete and returns the results. The **results** object contains two arrays:
* **successful**: results of successfully completed tasks,
* **failed**: array of errors, where each object includes:
  * **error**: the error description,
  * **index**: index of the task (in the order they were added).

⚠️ The **waitResult()** call resets the internal state, so you can reuse **addTask()** afterward without creating a new **tasks** instance.

<h1 align="center">Example</h1>

```ts
import astalim from "astalim"

// Task executor with a pool of 3 tasks
const tasks = astalim.taskPool(3)

// Generator for pseudo-random events
function* randGen() {
  let i = 0
  while (i++ < 10) yield Math.random()
}

// Task handling
for (const rand of randGen()) {
  await tasks.addTask(async () => {
    // Successful task execution, return data
    if (rand > .5) return rand
    // Failed execution, trigger error
    else JSON.parse("") // OR else throw `Error: ${rand}`
  })
}

// Get result
const results = await tasks.waitResult()

console.log("results:", results)
```
Expected Output:
```
results: {
  successful: [
    0.5774501276332757,
    0.8140335738582891,
    0.9180485044161926,
    0.9421955524500936,
    0.8163302889107125,
    0.8032588867553216,
    0.783284406112269
  ],
  failed: [
    {
      error: SyntaxError: Unexpected end of JSON input
          at JSON.parse (<anonymous>)
          ...
      index: 1
    },
    {
      error: SyntaxError: Unexpected end of JSON input
          at JSON.parse (<anonymous>)
          ...
      index: 2
    },
    {
      error: SyntaxError: Unexpected end of JSON input
          at JSON.parse (<anonymous>)
          ...
      index: 4
    }
  ]
}
```
