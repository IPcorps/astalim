<div align="center">

[![English](https://img.shields.io/badge/-English-blue)](/../../)
# ASync TAsk LIMiter
_(Параллельный менеджер асинхронных задач с ограничением количества одновременно выполняющихся.)_
</div>

<h1 align="center">Шаблон использования</h1>

```ts
import astalim from "astalim"

// Кол-во одновременно выполняющихся заданий
const limit: number = 5

// Создаем исполнитель
const tasks = astalim.taskPool(limit)

// В цикле добавляем задачи на выполнение
for (const path of <paths>) {
  await tasks.addTask(async () => {
    ...
    <Какая-либо работа с очередным path>
    ...
  })
}

// Получаем результат обработки
const results = await tasks.waitResult()
```

<h1 align="center">Подробней по этапам</h1>

# 1. Создание исполнителя
```ts
const tasks = astalim.taskPool(limit: number)
```
Одновременно будет выполняться **limit** задач.

# 2. Добавление задач
```ts
for (const path of <paths>) {
  await tasks.addTask(async () => {
    ...
    <Какая-либо работа с очередным path>
    ...
  })
}
```
В качестве аргумента **addTask** принимает либо **Promise**, либо функцию, которая возвращает **Promise**. После достижения лимита, очередная задача не начнет выполняться, пока не освободится место в очереди и она не будет добавлена в пул.

**🔴 ВАЖНО:** Что бы не произошло в задаче, основной поток не прерывает свое выполнение. Все возникшие исключения (ошибки) тихо будут записаны в общий массив ошибок результата.

# 3. Получение результата
```ts
const results = await tasks.waitResult()
```
Ожидание полного завершения всех задач с получением результата. Объект **results** содержит два массива:
* **successful**: массив с результатом успешно выполненных задач,
* **failed**: массив ошибок, каждый объект которого содержит свойства:
  * **error**: с описанием ошибки,
  * **index**: с номером задачи в порядке добавления, в которой произошла данная ошибка.

⚠️ Так же вызов **waitResult()** сбрасывает внутреннее состояние, поэтому далее возможно повторное добавление задач **addTask()** без создания нового исполнителя **tasks**.

<h1 align="center">Пример</h1>

```ts
import astalim from "astalim"

// Исполнитель с пулом в 3 задачи
const tasks = astalim.taskPool(3)

// Генерация случайных псевдособытий
function* randGen() {
  let i = 0
  while (i++ < 10) yield Math.random()
}

// Обработка задач
for (const rand of randGen()) {
  await tasks.addTask(async () => {
    // Удачное выполнение задачи, возвращаем данные
    if (rand > .5) return rand
    // Неудачное выполнение, вызываем ошибку
    else JSON.parse("") // OR else throw `Error: ${rand}`
  })
}

// Получаем результат
const results = await tasks.waitResult()

console.log("results:", results)
```
Вывод должен быть подобен следующему:
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
