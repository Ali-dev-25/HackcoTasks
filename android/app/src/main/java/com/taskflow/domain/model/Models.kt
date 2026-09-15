package com.taskflow.domain.model

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime

enum class Priority {
    LOW,
    MEDIUM,
    HIGH
}

enum class TaskStatus {
    PENDING,
    COMPLETED,
    CANCELLED
}

enum class ReminderOption(val minutesBefore: Long) {
    NONE(-1),
    AT_TIME(0),
    MIN_5(5),
    MIN_10(10),
    MIN_15(15),
    MIN_30(30),
    HOUR_1(60),
    DAY_1(1440)
}

enum class RecurrenceType {
    NONE,
    DAILY,
    WEEKLY,
    WEEKDAY_MASK,
    EVERY_N_DAYS,
    EVERY_N_WEEKS,
    MONTHLY,
    YEARLY
}

data class RecurrenceRule(
    val type: RecurrenceType = RecurrenceType.NONE,
    val interval: Int = 1,
    val daysOfWeek: Set<Int> = emptySet(), // 1 = Monday .. 7 = Sunday
    val dayOfMonth: Int? = null,
    val endDate: LocalDate? = null
)

data class Task(
    val id: Long = 0,
    val title: String,
    val description: String = "",
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val priority: Priority = Priority.MEDIUM,
    val status: TaskStatus = TaskStatus.PENDING,
    val categoryId: Long? = null,
    val location: String = "",
    val notes: String = "",
    val recurrence: RecurrenceRule = RecurrenceRule(),
    val reminder: ReminderOption = ReminderOption.NONE,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null
)

data class SubTask(
    val id: Long = 0,
    val taskId: Long,
    val title: String,
    val isCompleted: Boolean = false,
    val orderIndex: Int = 0
)

data class Category(
    val id: Long = 0,
    val name: String,
    val icon: String = "Folder",
    val colorHex: String = "#2563EB",
    val isDefault: Boolean = false
)

data class TaskWithDetails(
    val task: Task,
    val category: Category?,
    val subtasks: List<SubTask> = emptyList()
) {
    val completionPercentage: Float
        get() {
            if (subtasks.isEmpty()) return if (task.status == TaskStatus.COMPLETED) 1.0f else 0.0f
            val completed = subtasks.count { it.isCompleted }
            return completed.toFloat() / subtasks.size
        }
}

data class UserSettings(
    val themeMode: String = "SYSTEM", // LIGHT, DARK, SYSTEM
    val language: String = "en",      // en, ar
    val notificationsEnabled: Boolean = true,
    val soundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val defaultDurationMinutes: Int = 60,
    val firstDayOfWeek: Int = 1       // 1 = Monday, 7 = Sunday
)
