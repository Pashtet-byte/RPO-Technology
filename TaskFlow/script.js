class Task {
    constructor(title, description, dueDate, priority) {
        this.id = Date.now().toString();
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = 'pending';
    }
    toJSON() { return {...this}; }
}

class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadFromStorage();
    }

    addTask(title, description, dueDate, priority) {
        const task = new Task(title, description, dueDate, priority);
        this.tasks.push(task);
        this.saveToStorage();
        this.render();
        this.updateDashboard();
    }

    getTasks(filter = 'all') {
        if (filter === 'pending') return this.tasks.filter(t => t.status === 'pending');
        if (filter === 'completed') return this.tasks.filter(t => t.status === 'completed');
        return this.tasks;
    }

    markCompleted(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = 'completed';
            this.saveToStorage();
            this.render();
            this.updateDashboard();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();
        this.render();
        this.updateDashboard();
    }

    updateTask(id, newData) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, newData);
            this.saveToStorage();
            this.render();
            this.updateDashboard();
        }
    }

    getStatistics() {
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const completed = this.tasks.length - pending;
        return { pending, completed };
    }

    saveToStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            this.tasks = JSON.parse(saved).map(data => {
                const task = new Task(data.title, data.description, data.dueDate, data.priority);
                task.id = data.id;
                task.status = data.status;
                return task;
            });
        }
    }

    render() {
        const list = document.getElementById('task-list');
        list.innerHTML = '';
        const filter = document.getElementById('filter').value;
        const filtered = this.getTasks(filter);

        filtered.forEach(task => {
            const prioText = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }[task.priority];
            const div = document.createElement('div');
            div.className = `task-card ${task.priority}`;
            div.innerHTML = `
                <div>
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <p>До: ${task.dueDate} | Приоритет: ${prioText}</p>
                </div>
                <div>
                    <button onclick="completeTask('${task.id}')">✅ Завершить</button>
                    <button onclick="editTask('${task.id}')">✏️ Редактировать</button>
                    <button onclick="deleteTask('${task.id}')">🗑️ Удалить</button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    updateDashboard() {
        const stats = this.getStatistics();
        document.getElementById('pending').textContent = stats.pending;
        document.getElementById('completed').textContent = stats.completed;
    }
}

// Глобальный экземпляр
const taskManager = new TaskManager();
let editingId = null;

// Обработчик формы
document.getElementById('task-form').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const dueDate = document.getElementById('dueDate').value;
    const priority = document.getElementById('priority').value;

    if (editingId) {
        taskManager.updateTask(editingId, { title, description, dueDate, priority });
        editingId = null;
        document.getElementById('submit-btn').textContent = 'Добавить задачу';
    } else {
        taskManager.addTask(title, description, dueDate, priority);
    }

    e.target.reset();
});

// Фильтр
document.getElementById('filter').addEventListener('change', () => taskManager.render());

// Глобальные функции для кнопок
window.completeTask = id => taskManager.markCompleted(id);
window.deleteTask = id => taskManager.deleteTask(id);
window.editTask = id => {
    const task = taskManager.tasks.find(t => t.id === id);
    if (!task) return;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('dueDate').value = task.dueDate;
    document.getElementById('priority').value = task.priority;
    editingId = id;
    document.getElementById('submit-btn').textContent = 'Сохранить изменения';
};

// Инициализация
window.onload = () => {
    taskManager.render();
    taskManager.updateDashboard();
};