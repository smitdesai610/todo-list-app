document.addEventListener("DOMContentLoaded", function () {
  const theamIcon = document.querySelector(".theamIcon");
  const theamIconImage = document.querySelector(".moon");
  const todoInput = document.getElementById("todoInput");
  const todoListWrapper = document.getElementById("todoListWrapper");
  const itemsLeftSpan = document.querySelector(".leftItem span");
  const clearCompletedBtn = document.querySelector(".clearCompleted");
  const newTodoInput = document.querySelector(".inputText input");

  // Updated selectors for both toolboxes
  const allBtns = document.querySelectorAll(".all");
  const activeBtns = document.querySelectorAll(".active");
  const completedBtns = document.querySelectorAll(".Completed");

  let todos = [];
  let currentFilter = "all";
  let isDragging = false;
  let scrollInterval;

  theamIcon.addEventListener("click", () => {
    document.body.classList.toggle("dark-themes");
    if (document.body.classList.contains("dark-themes")) {
      theamIconImage.src = "./images/icon-sun.svg";
    } else {
      theamIconImage.src = "./images/icon-moon.svg";
    }
  });

  todoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const inputValue = todoInput.value.trim();
      if (inputValue === "") {
        alert("Empty entry is not allowed.");
        e.preventDefault();
        return;
      }
      addTodo(inputValue);
      todoInput.value = "";
      e.preventDefault();
    }
  });
  newTodoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const inputValue = todoInput.value.trim();
      if (inputValue !== "") {
        addTodo(inputValue);
        todoInput.value = "";
      }
      e.preventDefault();
    }
  });

  function addTodo(text) {
    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
    };

    todos.push(todo);
    renderTodos();
    updateItemsLeft();
  }

  function renderTodos() {
    const filteredTodos = filterTodos();
    todoListWrapper.innerHTML = "";

    if (filteredTodos.length === 0) {
      const message = document.createElement("p");
      message.textContent = `No ${currentFilter} tasks available.`;
      message.style.textAlign = "center";
      message.style.padding = "20px";
      message.style.color = "var(--secondary-color)";
      todoListWrapper.appendChild(message);
      return;
    }

    filteredTodos.forEach((todo) => {
      const todoItem = document.createElement("li");
      todoItem.classList.add("todo-item");
      todoItem.draggable = true;
      todoItem.dataset.id = todo.id;
      todoItem.innerHTML = `
        <label class="checkBox">
          <input type="checkbox" ${todo.completed ? "checked" : ""}>
          <span class="checkMark">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="9"><path fill="none" stroke="var(--icon-color)" stroke-width="2" d="M1 4.304L3.696 7l6-6"/></svg>
          </span>
        </label>
        <span class="todo-text ${
          todo.completed ? "completed" : ""
        }" style="color: var(--secondary-color)">${todo.text}</span>
        <span class="close-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="#494C6B" fill-rule="evenodd" d="M16.97 0l.708.707L9.546 8.84l8.132 8.132-.707.707-8.132-8.132-8.132 8.132L0 16.97l8.132-8.132L0 .707.707 0 8.84 8.132 16.971 0z"/></svg>
        </span>
      `;

      const checkbox = todoItem.querySelector("input[type='checkbox']");
      checkbox.addEventListener("change", () => {
        todo.completed = checkbox.checked;
        todoItem
          .querySelector(".todo-text")
          .classList.toggle("completed", todo.completed);
        updateItemsLeft();
        if (currentFilter !== "all") {
          renderTodos();
        }
      });

      const closeIcon = todoItem.querySelector(".close-icon");
      closeIcon.addEventListener("click", () => {
        todos = todos.filter((t) => t.id !== todo.id);
        renderTodos();
        updateItemsLeft();
      });

      todoItem.addEventListener("dragstart", dragStart);
      todoItem.addEventListener("dragover", dragOver);
      todoItem.addEventListener("drop", drop);
      todoItem.addEventListener("dragend", dragEnd);

      todoListWrapper.appendChild(todoItem);
    });
  }

  function filterTodos() {
    switch (currentFilter) {
      case "active":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }

  function updateItemsLeft() {
    const activeItems = todos.filter((todo) => !todo.completed).length;
    itemsLeftSpan.textContent = `${activeItems} item${
      activeItems !== 1 ? "s" : ""
    } left`;
  }

  // Clear completed tasks
  clearCompletedBtn.addEventListener("click", () => {
    todos = todos.filter((todo) => !todo.completed);
    renderTodos();
    updateItemsLeft();
  });

  // Filter buttons for both toolboxes
  allBtns.forEach((btn) => {
    btn.addEventListener("click", () => setFilter("all"));
  });

  activeBtns.forEach((btn) => {
    btn.addEventListener("click", () => setFilter("active"));
  });

  completedBtns.forEach((btn) => {
    btn.addEventListener("click", () => setFilter("completed"));
  });

  function setFilter(filter) {
    currentFilter = filter;
    renderTodos();
    updateActiveFilter();
  }

  function updateActiveFilter() {
    allBtns.forEach((btn) => btn.classList.remove("active-filter"));
    activeBtns.forEach((btn) => btn.classList.remove("active-filter"));
    completedBtns.forEach((btn) => btn.classList.remove("active-filter"));

    switch (currentFilter) {
      case "all":
        allBtns.forEach((btn) => btn.classList.add("active-filter"));
        break;
      case "active":
        activeBtns.forEach((btn) => btn.classList.add("active-filter"));
        break;
      case "completed":
        completedBtns.forEach((btn) => btn.classList.add("active-filter"));
        break;
    }
  }

  // Drag and Drop Logic with Auto Scroll
  function dragStart(e) {
    isDragging = true;
    e.dataTransfer.setData("text/plain", e.target.dataset.id);
    e.target.classList.add("dragging");
    startAutoScroll();
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const draggingElement = document.querySelector(`[data-id="${id}"]`);
    const dropTarget = e.target.closest(".todo-item");

    if (dropTarget && draggingElement !== dropTarget) {
      const items = Array.from(todoListWrapper.querySelectorAll(".todo-item"));
      const fromIndex = todos.findIndex((todo) => todo.id === parseInt(id));
      const toIndex = items.indexOf(dropTarget);

      const [reorderedItem] = todos.splice(fromIndex, 1);
      todos.splice(toIndex, 0, reorderedItem);

      renderTodos();
    }

    stopAutoScroll();
    isDragging = false;
  }

  function dragEnd(e) {
    e.target.classList.remove("dragging");
    stopAutoScroll();
    isDragging = false;
  }

  function startAutoScroll() {
    clearInterval(scrollInterval);
    scrollInterval = setInterval(() => {
      if (!isDragging) return;

      const boundingRect = todoListWrapper.getBoundingClientRect();
      const scrollThreshold = 50;

      if (mouseY < boundingRect.top + scrollThreshold) {
        todoListWrapper.scrollTop -= 10;
      }

      if (mouseY > boundingRect.bottom - scrollThreshold) {
        todoListWrapper.scrollTop += 10;
      }
    }, 50);
  }

  function stopAutoScroll() {
    clearInterval(scrollInterval);
  }

  renderTodos();
  updateItemsLeft();
  updateActiveFilter();
});
