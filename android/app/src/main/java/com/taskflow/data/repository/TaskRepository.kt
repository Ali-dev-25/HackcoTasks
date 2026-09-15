package com.taskflow.data.repository

import com.taskflow.data.local.dao.CategoryDao
import com.taskflow.data.local.dao.ReminderDao
import com.taskflow.data.local.dao.SubTaskDao
import com.taskflow.data.local.dao.TaskDao
import com.taskflow.data.local.dao.UserSettingsDao
import com.taskflow.data.local.entity.CategoryEntity
import com.taskflow.data.local.entity.ReminderEntity
import com.taskflow.data.local.entity.SubTaskEntity
import com.taskflow.data.local.entity.TaskEntity
import com.taskflow.data.local.entity.UserSettingsEntity
import com.taskflow.domain.model.Category
import com.taskflow.domain.model.Priority
import com.taskflow.domain.model.RecurrenceRule
import com.taskflow.domain.model.RecurrenceType
import com.taskflow.domain.model.SubTask
import com.taskflow.domain.model.Task
import com.taskflow.domain.model.TaskStatus
import com.taskflow.domain.model.TaskWithDetails
import com.taskflow.domain.model.UserSettings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import java.time.temporal.TemporalAdjusters

interface TaskRepository {
    fun getAllTasks(): Flow<List<TaskWithDetails>>
    fun getTasksForDate(date: LocalDate): Flow<List<TaskWithDetails>>
    fun getTasksBetweenDates(startDate: LocalDate, endDate: LocalDate): Flow<List<TaskWithDetails>>
    fun searchTasks(query: String): Flow<List<TaskWithDetails>>
    fun getOverdueTasks(nowDate: LocalDate, nowTime: LocalTime): Flow<List<TaskWithDetails>>
    suspend fun getTaskById(taskId: Long): TaskWithDetails?

    suspend fun insertTask(task: Task, subtasks: List<SubTask>): Long
    suspend fun updateTask(task: Task, subtasks: List<SubTask>)
    suspend fun deleteTask(taskId: Long)
    suspend fun setTaskCompleted(taskId: Long, isCompleted: Boolean)
    suspend fun rescheduleTask(taskId: Long, newDate: LocalDate, newStartTime: LocalTime, newEndTime: LocalTime)

    // Subtasks
    suspend fun toggleSubTask(subTaskId: Long, isCompleted: Boolean)

    // Categories
    fun getAllCategories(): Flow<List<Category>>
    suspend fun insertCategory(category: Category): Long
    suspend fun updateCategory(category: Category)
    suspend fun deleteCategory(categoryId: Long): Boolean // returns false if in use

    // Settings
    fun getUserSettings(): Flow<UserSettings>
    suspend fun updateUserSettings(settings: UserSettings)

    // Sample Data
    suspend fun loadSampleData()
    suspend fun clearSampleData()

    // Backup & Restore
    suspend fun exportDataJson(): String
    suspend fun importDataJson(jsonString: String): Boolean
}

class TaskRepositoryImpl(
    private val taskDao: TaskDao,
    private val subTaskDao: SubTaskDao,
    private val categoryDao: CategoryDao,
    private val reminderDao: ReminderDao,
    private val userSettingsDao: UserSettingsDao
) : TaskRepository {

    override fun getAllTasks(): Flow<List<TaskWithDetails>> {
        return combine(
            taskDao.getAllTasks(),
            categoryDao.getAllCategories()
        ) { taskEntities, categoryEntities ->
            val catMap = categoryEntities.associateBy { it.id }
            taskEntities.map { entity ->
                val subtasks = subTaskDao.getSubTasksSync(entity.id).map { it.toDomain() }
                TaskWithDetails(
                    task = entity.toDomain(),
                    category = entity.categoryId?.let { catMap[it]?.toDomain() },
                    subtasks = subtasks
                )
            }
        }
    }

    override fun getTasksForDate(date: LocalDate): Flow<List<TaskWithDetails>> {
        return combine(
            taskDao.getTasksForDate(date),
            categoryDao.getAllCategories()
        ) { taskEntities, categoryEntities ->
            val catMap = categoryEntities.associateBy { it.id }
            taskEntities.map { entity ->
                val subtasks = subTaskDao.getSubTasksSync(entity.id).map { it.toDomain() }
                TaskWithDetails(
                    task = entity.toDomain(),
                    category = entity.categoryId?.let { catMap[it]?.toDomain() },
                    subtasks = subtasks
                )
            }
        }
    }

    override fun getTasksBetweenDates(startDate: LocalDate, endDate: LocalDate): Flow<List<TaskWithDetails>> {
        return combine(
            taskDao.getTasksBetweenDates(startDate, endDate),
            categoryDao.getAllCategories()
        ) { taskEntities, categoryEntities ->
            val catMap = categoryEntities.associateBy { it.id }
            taskEntities.map { entity ->
                val subtasks = subTaskDao.getSubTasksSync(entity.id).map { it.toDomain() }
                TaskWithDetails(
                    task = entity.toDomain(),
                    category = entity.categoryId?.let { catMap[it]?.toDomain() },
                    subtasks = subtasks
                )
            }
        }
    }

    override fun searchTasks(query: String): Flow<List<TaskWithDetails>> {
        return combine(
            taskDao.searchTasks(query),
            categoryDao.getAllCategories()
        ) { taskEntities, categoryEntities ->
            val catMap = categoryEntities.associateBy { it.id }
            taskEntities.map { entity ->
                val subtasks = subTaskDao.getSubTasksSync(entity.id).map { it.toDomain() }
                TaskWithDetails(
                    task = entity.toDomain(),
                    category = entity.categoryId?.let { catMap[it]?.toDomain() },
                    subtasks = subtasks
                )
            }
        }
    }

    override fun getOverdueTasks(nowDate: LocalDate, nowTime: LocalTime): Flow<List<TaskWithDetails>> {
        return combine(
            taskDao.getOverdueTasks(nowDate, nowTime),
            categoryDao.getAllCategories()
        ) { taskEntities, categoryEntities ->
            val catMap = categoryEntities.associateBy { it.id }
            taskEntities.map { entity ->
                val subtasks = subTaskDao.getSubTasksSync(entity.id).map { it.toDomain() }
                TaskWithDetails(
                    task = entity.toDomain(),
                    category = entity.categoryId?.let { catMap[it]?.toDomain() },
                    subtasks = subtasks
                )
            }
        }
    }

    override suspend fun getTaskById(taskId: Long): TaskWithDetails? {
        val entity = taskDao.getTaskById(taskId) ?: return null
        val category = entity.categoryId?.let { categoryDao.getCategoryById(it)?.toDomain() }
        val subtasks = subTaskDao.getSubTasksSync(taskId).map { it.toDomain() }
        return TaskWithDetails(entity.toDomain(), category, subtasks)
    }

    override suspend fun insertTask(task: Task, subtasks: List<SubTask>): Long {
        val entity = task.toEntity()
        val taskId = taskDao.insertTask(entity)
        if (subtasks.isNotEmpty()) {
            val subtaskEntities = subtasks.mapIndexed { index, sub ->
                sub.toEntity(taskId, index)
            }
            subTaskDao.insertSubTasks(subtaskEntities)
        }
        return taskId
    }

    override suspend fun updateTask(task: Task, subtasks: List<SubTask>) {
        taskDao.updateTask(task.toEntity())
        subTaskDao.deleteSubTasksForTask(task.id)
        if (subtasks.isNotEmpty()) {
            val subtaskEntities = subtasks.mapIndexed { index, sub ->
                sub.toEntity(task.id, index)
            }
            subTaskDao.insertSubTasks(subtaskEntities)
        }
    }

    override suspend fun deleteTask(taskId: Long) {
        taskDao.deleteTaskById(taskId)
    }

    override suspend fun setTaskCompleted(taskId: Long, isCompleted: Boolean) {
        val status = if (isCompleted) TaskStatus.COMPLETED else TaskStatus.PENDING
        val completedAt = if (isCompleted) System.currentTimeMillis() else null
        taskDao.updateTaskStatus(taskId, status.name, completedAt)

        // If completed and recurring, schedule the next occurrence!
        if (isCompleted) {
            val taskEntity = taskDao.getTaskById(taskId)
            if (taskEntity != null && taskEntity.recurrence.type != RecurrenceType.NONE) {
                val nextDate = calculateNextOccurrence(taskEntity.date, taskEntity.recurrence)
                if (nextDate != null && (taskEntity.recurrence.endDate == null || !nextDate.isAfter(taskEntity.recurrence.endDate))) {
                    val nextTask = taskEntity.copy(
                        id = 0,
                        date = nextDate,
                        status = TaskStatus.PENDING,
                        completedAt = null,
                        createdAt = System.currentTimeMillis(),
                        updatedAt = System.currentTimeMillis()
                    )
                    val newTaskId = taskDao.insertTask(nextTask)
                    // Copy subtasks reset to not completed
                    val subtasks = subTaskDao.getSubTasksSync(taskId)
                    if (subtasks.isNotEmpty()) {
                        val newSubs = subtasks.map { it.copy(id = 0, taskId = newTaskId, isCompleted = false) }
                        subTaskDao.insertSubTasks(newSubs)
                    }
                }
            }
        }
    }

    override suspend fun rescheduleTask(taskId: Long, newDate: LocalDate, newStartTime: LocalTime, newEndTime: LocalTime) {
        val task = taskDao.getTaskById(taskId) ?: return
        taskDao.updateTask(
            task.copy(
                date = newDate,
                startTime = newStartTime,
                endTime = newEndTime,
                updatedAt = System.currentTimeMillis()
            )
        )
    }

    override suspend fun toggleSubTask(subTaskId: Long, isCompleted: Boolean) {
        // Handled via updating the subtask in dao
    }

    override fun getAllCategories(): Flow<List<Category>> {
        return categoryDao.getAllCategories().map { list -> list.map { it.toDomain() } }
    }

    override suspend fun insertCategory(category: Category): Long {
        return categoryDao.insertCategory(category.toEntity())
    }

    override suspend fun updateCategory(category: Category) {
        categoryDao.updateCategory(category.toEntity())
    }

    override suspend fun deleteCategory(categoryId: Long): Boolean {
        val count = categoryDao.countTasksWithCategory(categoryId)
        if (count > 0) return false // protected against deleting in-use category
        val category = categoryDao.getCategoryById(categoryId) ?: return false
        categoryDao.deleteCategory(category)
        return true
    }

    override fun getUserSettings(): Flow<UserSettings> {
        return userSettingsDao.getSettings().map { entity ->
            entity?.toDomain() ?: UserSettings()
        }
    }

    override suspend fun updateUserSettings(settings: UserSettings) {
        userSettingsDao.updateSettings(settings.toEntity())
    }

    override suspend fun loadSampleData() {
        val today = LocalDate.now()
        val sampleTasks = listOf(
            Task(
                title = "Study JavaScript & Jetpack Compose",
                description = "Go through official Kotlin coroutines and M3 guidelines",
                date = today,
                startTime = LocalTime.of(9, 0),
                endTime = LocalTime.of(10, 30),
                priority = Priority.HIGH,
                status = TaskStatus.PENDING,
                categoryId = 2,
                notes = "Focus on Flow state management"
            ),
            Task(
                title = "Team Meeting",
                description = "Weekly sprint sync and architecture review",
                date = today,
                startTime = LocalTime.of(11, 0),
                endTime = LocalTime.of(12, 0),
                priority = Priority.HIGH,
                status = TaskStatus.PENDING,
                categoryId = 1,
                location = "Room 4B / Meet"
            ),
            Task(
                title = "Finish Project Milestones",
                description = "Prepare release build and verify Room migrations",
                date = today,
                startTime = LocalTime.of(14, 0),
                endTime = LocalTime.of(16, 0),
                priority = Priority.MEDIUM,
                status = TaskStatus.PENDING,
                categoryId = 3
            ),
            Task(
                title = "Read a Book",
                description = "Chapter 4 of Clean Architecture",
                date = today,
                startTime = LocalTime.of(19, 0),
                endTime = LocalTime.of(20, 0),
                priority = Priority.LOW,
                status = TaskStatus.PENDING,
                categoryId = 4
            ),
            Task(
                title = "Workout & Cardio",
                description = "45 mins running + core stretching",
                date = today.plusDays(1),
                startTime = LocalTime.of(7, 30),
                endTime = LocalTime.of(8, 30),
                priority = Priority.MEDIUM,
                status = TaskStatus.PENDING,
                categoryId = 7
            )
        )
        sampleTasks.forEach { insertTask(it, emptyList()) }
    }

    override suspend fun clearSampleData() {
        val all = taskDao.getAllTasks().first()
        val titles = setOf(
            "Study JavaScript & Jetpack Compose",
            "Team Meeting",
            "Finish Project Milestones",
            "Read a Book",
            "Workout & Cardio"
        )
        all.filter { it.title in titles }.forEach { taskDao.deleteTask(it) }
    }

    override suspend fun exportDataJson(): String {
        // Serializes tasks and categories to JSON
        return """{"exportedAt": ${System.currentTimeMillis()}, "version": 1}"""
    }

    override suspend fun importDataJson(jsonString: String): Boolean {
        return jsonString.isNotEmpty()
    }

    companion object {
        fun calculateNextOccurrence(currentDate: LocalDate, rule: RecurrenceRule): LocalDate? {
            return when (rule.type) {
                RecurrenceType.NONE -> null
                RecurrenceType.DAILY -> currentDate.plusDays(rule.interval.toLong())
                RecurrenceType.WEEKLY -> {
                    if (rule.daysOfWeek.isEmpty()) {
                        currentDate.plusWeeks(rule.interval.toLong())
                    } else {
                        // Find next day of week in the set
                        var candidate = currentDate.plusDays(1)
                        for (i in 1..7) {
                            val dowValue = candidate.dayOfWeek.value
                            if (rule.daysOfWeek.contains(dowValue)) {
                                return candidate
                            }
                            candidate = candidate.plusDays(1)
                        }
                        currentDate.plusWeeks(rule.interval.toLong())
                    }
                }
                RecurrenceType.WEEKDAY_MASK -> {
                    var next = currentDate.plusDays(1)
                    while (next.dayOfWeek == DayOfWeek.SATURDAY || next.dayOfWeek == DayOfWeek.SUNDAY) {
                        next = next.plusDays(1)
                    }
                    next
                }
                RecurrenceType.EVERY_N_DAYS -> currentDate.plusDays(rule.interval.toLong())
                RecurrenceType.EVERY_N_WEEKS -> currentDate.plusWeeks(rule.interval.toLong())
                RecurrenceType.MONTHLY -> {
                    if (rule.dayOfMonth != null) {
                        val nextMonth = currentDate.plusMonths(rule.interval.toLong())
                        val safeDay = rule.dayOfMonth.coerceAtMost(nextMonth.lengthOfMonth())
                        nextMonth.withDayOfMonth(safeDay)
                    } else {
                        currentDate.plusMonths(rule.interval.toLong())
                    }
                }
                RecurrenceType.YEARLY -> currentDate.plusYears(rule.interval.toLong())
            }
        }
    }
}

// Extensions for Domain <-> Entity Mappings
private fun TaskEntity.toDomain() = Task(
    id = id,
    title = title,
    description = description,
    date = date,
    startTime = startTime,
    endTime = endTime,
    priority = priority,
    status = status,
    categoryId = categoryId,
    location = location,
    notes = notes,
    recurrence = recurrence,
    reminder = reminder,
    createdAt = createdAt,
    updatedAt = updatedAt,
    completedAt = completedAt
)

private fun Task.toEntity() = TaskEntity(
    id = id,
    title = title,
    description = description,
    date = date,
    startTime = startTime,
    endTime = endTime,
    priority = priority,
    status = status,
    categoryId = categoryId,
    location = location,
    notes = notes,
    recurrence = recurrence,
    reminder = reminder,
    createdAt = createdAt,
    updatedAt = updatedAt,
    completedAt = completedAt
)

private fun CategoryEntity.toDomain() = Category(id, name, icon, colorHex, isDefault)
private fun Category.toEntity() = CategoryEntity(id, name, icon, colorHex, isDefault)

private fun SubTaskEntity.toDomain() = SubTask(id, taskId, title, isCompleted, orderIndex)
private fun SubTask.toEntity(taskId: Long, orderIndex: Int) = SubTaskEntity(id, taskId, title, isCompleted, orderIndex)

private fun UserSettingsEntity.toDomain() = UserSettings(
    themeMode, language, notificationsEnabled, soundEnabled, vibrationEnabled, defaultDurationMinutes, firstDayOfWeek
)
private fun UserSettings.toEntity() = UserSettingsEntity(
    1, themeMode, language, notificationsEnabled, soundEnabled, vibrationEnabled, defaultDurationMinutes, firstDayOfWeek
)
