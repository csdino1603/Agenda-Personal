document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const taskForm = document.getElementById('taskForm');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const dueDateInput = document.getElementById('dueDate');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const tasksContainer = document.getElementById('tasksContainer');
    const filterButtons = document.querySelectorAll('.filter-options button');
    const notification = document.getElementById('notification');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let editingTaskId = null;
    let currentFilter = 'all';
    
    // Inicializar la aplicación
    function init() {
        renderTasks();
        setupEventListeners();
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        taskForm.addEventListener('submit', handleFormSubmit);
        cancelBtn.addEventListener('click', cancelEdit);
        
        // Filtros
        document.getElementById('allTasks').addEventListener('click', () => filterTasks('all'));
        document.getElementById('pendingTasks').addEventListener('click', () => filterTasks('pending'));
        document.getElementById('completedTasks').addEventListener('click', () => filterTasks('completed'));
    }
    
    // Manejar el envío del formulario
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const dueDate = dueDateInput.value;
        
        // Validación
        if (!title || !dueDate) {
            showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }
        
        if (editingTaskId !== null) {
            // Editar tarea existente
            updateTask(editingTaskId, title, description, dueDate);
            showNotification('Tarea actualizada con éxito', 'success');
        } else {
            // Crear nueva tarea
            addTask(title, description, dueDate);
            showNotification('Tarea agregada con éxito', 'success');
        }
        
        // Resetear formulario
        resetForm();
        renderTasks();
    }
    
    // Agregar nueva tarea
    function addTask(title, description, dueDate) {
        const newTask = {
            id: Date.now(),
            title,
            description,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
    }
    
    // Actualizar tarea existente
    function updateTask(id, title, description, dueDate) {
        tasks = tasks.map(task => 
            task.id === id 
                ? { ...task, title, description, dueDate } 
                : task
        );
        
        saveTasks();
        editingTaskId = null;
        cancelBtn.style.display = 'none';
        saveBtn.textContent = 'Guardar Tarea';
    }
    
    // Eliminar tarea
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        showNotification('Tarea eliminada', 'warning');
    }
    
    // Marcar tarea como completada/incompleta
    function toggleTaskCompletion(id) {
        tasks = tasks.map(task => 
            task.id === id 
                ? { ...task, completed: !task.completed } 
                : task
        );
        
        saveTasks();
        renderTasks();
    }
    
    // Editar tarea
    function editTask(id) {
        const taskToEdit = tasks.find(task => task.id === id);
        if (taskToEdit) {
            titleInput.value = taskToEdit.title;
            descriptionInput.value = taskToEdit.description || '';
            dueDateInput.value = taskToEdit.dueDate;
            
            editingTaskId = id;
            cancelBtn.style.display = 'inline-block';
            saveBtn.textContent = 'Actualizar Tarea';
            
            titleInput.focus();
        }
    }
    
    // Cancelar edición
    function cancelEdit() {
        resetForm();
        editingTaskId = null;
        cancelBtn.style.display = 'none';
        saveBtn.textContent = 'Guardar Tarea';
    }
    
    // Resetear formulario
    function resetForm() {
        taskForm.reset();
    }
    
    // Filtrar tareas
    function filterTasks(filter) {
        currentFilter = filter;
        
        // Actualizar botones activos
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === `${filter}Tasks`) {
                btn.classList.add('active');
            }
        });
        
        renderTasks();
    }
    
    // Renderizar tareas
    function renderTasks() {
        tasksContainer.innerHTML = '';
        
        let filteredTasks = [...tasks];
        
        // Aplicar filtro
        if (currentFilter === 'pending') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        // Ordenar por fecha de vencimiento (las más próximas primero)
        filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = '<p class="no-tasks">No hay tareas para mostrar.</p>';
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''} ${isOverdue(task.dueDate) && !task.completed ? 'overdue' : ''}`;
            
            taskElement.innerHTML = `
                <h3 class="task-title">${task.title}</h3>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                <p class="task-due-date">
                    <strong>Vence:</strong> ${formatDate(task.dueDate)}
                    ${isOverdue(task.dueDate) && !task.completed ? ' <span class="overdue-text">(Vencida)</span>' : ''}
                </p>
                <div class="task-actions">
                    <button class="complete-btn" data-id="${task.id}">
                        ${task.completed ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                    </button>
                    <button class="edit-btn" data-id="${task.id}">Editar</button>
                    <button class="delete-btn" data-id="${task.id}">Eliminar</button>
                </div>
            `;
            
            tasksContainer.appendChild(taskElement);
        });
        
        // Agregar event listeners a los botones de cada tarea
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                toggleTaskCompletion(id);
            });
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                editTask(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                    deleteTask(id);
                }
            });
        });
    }
    
    // Guardar tareas en localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Mostrar notificación
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Formatear fecha
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }
    
    // Verificar si la tarea está vencida
    function isOverdue(dueDate) {
        return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    }
    
    // Inicializar la aplicación
    init();
});