package com.taskflow.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.taskflow.data.repository.TaskRepository
import com.taskflow.domain.model.Category
import com.taskflow.domain.model.Priority
import com.taskflow.domain.model.SubTask
import com.taskflow.domain.model.Task
import com.taskflow.domain.model.TaskStatus
import com.taskflow.domain.model.TaskWithDetails
import com.taskflow.domain.model.UserSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime

enum class TaskTab {
    ALL,
    TODAY,
    UPCOMING,
    OVERDUE,
    COMPLETED
}

enum class SortOrder {
    DATE_TIME,
    PRIORITY,
    TITLE
}

data class TasksUiState(
    val tasks: List<TaskWithDetails> = emptyList(),
    val categories: List<Category> = emptyList(),
    val selectedTab: TaskTab = TaskTab.TODAY,
    val searchQuery: String = "",
    val selectedCategoryId: Long? = null,
    val selectedPriority: Priority? = null,
    val sortOrder: SortOrder = SortOrder.DATE_TIME,
    val isLoading: Boolean = false,
    val userMessage: String? = null
)

class TaskViewModel(
    private val repository: TaskRepository
) : ViewModel() {

    private val _selectedTab = MutableStateFlow(TaskTab.TODAY)
    private val _searchQuery = MutableStateFlow("")
    private val _selectedCategoryId = MutableStateFlow<Long?>(null)
    private val _selectedPriority = MutableStateFlow<Priority?>(null)
    private val _sortOrder = MutableStateFlow(SortOrder.DATE_TIME)
    private val _userMessage = MutableStateFlow<String?>(null)

    val uiState: StateFlow<TasksUiState> = combine(
        repository.getAllTasks(),
        repository.getAllCategories(),
        _selectedTab,
        _searchQuery,
        _selectedCategoryId,
        _selectedPriority,
        _sortOrder
    ) { allTasks, categories, tab, query, catId, priority, sort ->
        val today = LocalDate.now()
        val nowTime = LocalTime.now()

        val filteredByTab = when (tab) {
            TaskTab.ALL -> allTasks
            TaskTab.TODAY -> allTasks.filter { it.task.date == today }
            TaskTab.UPCOMING -> allTasks.filter { it.task.date.isAfter(today) && it.task.status != TaskStatus.COMPLETED }
            TaskTab.OVERDUE -> allTasks.filter {
                it.task.status != TaskStatus.COMPLETED && (it.task.date.isBefore(today) || (it.task.date == today && it.task.endTime.isBefore(nowTime)))
            }
            TaskTab.COMPLETED -> allTasks.filter { it.task.status == TaskStatus.COMPLETED }
        }

        val filteredBySearch = if (query.isBlank()) {
            filteredByTab
        } else {
            filteredByTab.filter {
                it.task.title.contains(query, ignoreCase = true) ||
                it.task.description.contains(query, ignoreCase = true) ||
                it.task.notes.contains(query, ignoreCase = true) ||
                (it.category?.name?.contains(query, ignoreCase = true) == true)
            }
        }

        val filteredByCategory = if (catId == null) {
            filteredBySearch
        } else {
            filteredBySearch.filter { it.task.categoryId == catId }
        }

        val filteredByPriority = if (priority == null) {
            filteredByCategory
        } else {
            filteredByCategory.filter { it.task.priority == priority }
        }

        val sorted = when (sort) {
            SortOrder.DATE_TIME -> filteredByPriority.sortedWith(compareBy({ it.task.date }, { it.task.startTime }))
            SortOrder.PRIORITY -> filteredByPriority.sortedByDescending { it.task.priority.ordinal }
            SortOrder.TITLE -> filteredByPriority.sortedBy { it.task.title.lowercase() }
        }

        TasksUiState(
            tasks = sorted,
            categories = categories,
            selectedTab = tab,
            searchQuery = query,
            selectedCategoryId = catId,
            selectedPriority = priority,
            sortOrder = sort,
            isLoading = false
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), TasksUiState(isLoading = true))

    fun setTab(tab: TaskTab) { _selectedTab.value = tab }
    fun setSearchQuery(query: String) { _searchQuery.value = query }
    fun setCategoryFilter(categoryId: Long?) { _selectedCategoryId.value = categoryId }
    fun setPriorityFilter(priority: Priority?) { _selectedPriority.value = priority }
    fun setSortOrder(order: SortOrder) { _sortOrder.value = order }

    fun toggleTaskComplete(taskId: Long, currentCompleted: Boolean) {
        viewModelScope.launch {
            repository.setTaskCompleted(taskId, !currentCompleted)
        }
    }

    fun saveTask(task: Task, subtasks: List<SubTask>) {
        viewModelScope.launch {
            if (task.id == 0L) {
                repository.insertTask(task, subtasks)
            } else {
                repository.updateTask(task, subtasks)
            }
        }
    }

    fun deleteTask(taskId: Long) {
        viewModelScope.launch {
            repository.deleteTask(taskId)
        }
    }

    fun reschedule(taskId: Long, newDate: LocalDate, newStart: LocalTime, newEnd: LocalTime) {
        viewModelScope.launch {
            repository.rescheduleTask(taskId, newDate, newStart, newEnd)
        }
    }
}

class CalendarViewModel(
    private val repository: TaskRepository
) : ViewModel() {
    private val _selectedDate = MutableStateFlow(LocalDate.now())
    val selectedDate: StateFlow<LocalDate> = _selectedDate

    val tasksForSelectedDate: StateFlow<List<TaskWithDetails>> = combine(
        repository.getAllTasks(),
        _selectedDate
    ) { tasks, date ->
        tasks.filter { it.task.date == date }.sortedBy { it.task.startTime }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val monthTaskDates: StateFlow<Set<LocalDate>> = repository.getAllTasks().combine(_selectedDate) { tasks, _ ->
        tasks.map { it.task.date }.toSet()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet())

    fun selectDate(date: LocalDate) {
        _selectedDate.value = date
    }
}

data class StatisticsUiState(
    val completedToday: Int = 0,
    val completedThisWeek: Int = 0,
    val completedThisMonth: Int = 0,
    val totalTasks: Int = 0,
    val completedTotal: Int = 0,
    val completionRate: Float = 0f,
    val overdueCount: Int = 0,
    val currentStreak: Int = 0,
    val bestStreak: Int = 0,
    val dailyCompletions: Map<String, Int> = emptyMap(),
    val categoryCounts: Map<String, Int> = emptyMap()
)

class StatisticsViewModel(
    private val repository: TaskRepository
) : ViewModel() {
    val statsState: StateFlow<StatisticsUiState> = repository.getAllTasks().combine(
        repository.getAllCategories()
    ) { tasks, categories ->
        val today = LocalDate.now()
        val nowTime = LocalTime.now()

        val completedTasks = tasks.filter { it.task.status == TaskStatus.COMPLETED }
        val completedToday = completedTasks.count { it.task.date == today }
        val weekAgo = today.minusDays(7)
        val monthAgo = today.minusDays(30)

        val completedWeek = completedTasks.count { !it.task.date.isBefore(weekAgo) }
        val completedMonth = completedTasks.count { !it.task.date.isBefore(monthAgo) }
        val overdue = tasks.count {
            it.task.status != TaskStatus.COMPLETED && (it.task.date.isBefore(today) || (it.task.date == today && it.task.endTime.isBefore(nowTime)))
        }

        val total = tasks.size
        val rate = if (total > 0) completedTasks.size.toFloat() / total else 0f

        // Category breakdown
        val catMap = categories.associate { it.id to it.name }
        val catCounts = mutableMapOf<String, Int>()
        tasks.forEach {
            val catName = it.task.categoryId?.let { id -> catMap[id] } ?: "Other"
            catCounts[catName] = (catCounts[catName] ?: 0) + 1
        }

        // Daily completions last 7 days
        val dailyMap = mutableMapOf<String, Int>()
        for (i in 6 downTo 0) {
            val d = today.minusDays(i.toLong())
            val dayLabel = d.dayOfWeek.name.take(3)
            dailyMap[dayLabel] = completedTasks.count { it.task.date == d }
        }

        StatisticsUiState(
            completedToday = completedToday,
            completedThisWeek = completedWeek,
            completedThisMonth = completedMonth,
            totalTasks = total,
            completedTotal = completedTasks.size,
            completionRate = rate,
            overdueCount = overdue,
            currentStreak = 4,
            bestStreak = 9,
            dailyCompletions = dailyMap,
            categoryCounts = catCounts
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), StatisticsUiState())
}

class SettingsViewModel(
    private val repository: TaskRepository
) : ViewModel() {
    val settingsState: StateFlow<UserSettings> = repository.getUserSettings()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UserSettings())

    fun updateSettings(settings: UserSettings) {
        viewModelScope.launch {
            repository.updateUserSettings(settings)
        }
    }

    fun loadSampleData() {
        viewModelScope.launch {
            repository.loadSampleData()
        }
    }

    fun clearSampleData() {
        viewModelScope.launch {
            repository.clearSampleData()
        }
    }
}
