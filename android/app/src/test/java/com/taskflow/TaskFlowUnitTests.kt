package com.taskflow

import com.taskflow.data.repository.TaskRepositoryImpl
import com.taskflow.domain.model.*
import org.junit.Assert.*
import org.junit.Test
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime

class TaskFlowUnitTests {

    @Test
    fun testSubTaskCompletionPercentageCalculation() {
        val task = Task(
            id = 1,
            title = "Build Native App",
            date = LocalDate.of(2026, 9, 15),
            startTime = LocalTime.of(9, 0),
            endTime = LocalTime.of(10, 0),
            status = TaskStatus.PENDING
        )
        val subtasks = listOf(
            SubTask(id = 1, taskId = 1, title = "Setup Room", isCompleted = true),
            SubTask(id = 2, taskId = 1, title = "Write DAOs", isCompleted = true),
            SubTask(id = 3, taskId = 1, title = "Build Compose UI", isCompleted = false),
            SubTask(id = 4, taskId = 1, title = "Test Notifications", isCompleted = false)
        )
        val taskWithDetails = TaskWithDetails(task, null, subtasks)
        assertEquals(0.5f, taskWithDetails.completionPercentage, 0.001f)
    }

    @Test
    fun testRecurrenceDailyCalculation() {
        val current = LocalDate.of(2026, 9, 15)
        val rule = RecurrenceRule(type = RecurrenceType.DAILY, interval = 1)
        val next = TaskRepositoryImpl.calculateNextOccurrence(current, rule)
        assertEquals(LocalDate.of(2026, 9, 16), next)
    }

    @Test
    fun testRecurrenceEveryNDaysCalculation() {
        val current = LocalDate.of(2026, 9, 15)
        val rule = RecurrenceRule(type = RecurrenceType.EVERY_N_DAYS, interval = 3)
        val next = TaskRepositoryImpl.calculateNextOccurrence(current, rule)
        assertEquals(LocalDate.of(2026, 9, 18), next)
    }

    @Test
    fun testRecurrenceWeekdayMaskCalculationSkipsWeekend() {
        // Friday Sept 18, 2026
        val friday = LocalDate.of(2026, 9, 18)
        assertEquals(DayOfWeek.FRIDAY, friday.dayOfWeek)

        val rule = RecurrenceRule(type = RecurrenceType.WEEKDAY_MASK)
        val next = TaskRepositoryImpl.calculateNextOccurrence(friday, rule)
        // Should skip Saturday & Sunday and jump to Monday Sept 21
        assertEquals(LocalDate.of(2026, 9, 21), next)
        assertEquals(DayOfWeek.MONDAY, next?.dayOfWeek)
    }

    @Test
    fun testRecurrenceWeeklySpecificDays() {
        // Tuesday Sept 15
        val tuesday = LocalDate.of(2026, 9, 15)
        // Repeat on Thursdays (4) and Saturdays (6)
        val rule = RecurrenceRule(type = RecurrenceType.WEEKLY, interval = 1, daysOfWeek = setOf(4, 6))
        val next = TaskRepositoryImpl.calculateNextOccurrence(tuesday, rule)
        // Next should be Thursday Sept 17
        assertEquals(LocalDate.of(2026, 9, 17), next)
        assertEquals(DayOfWeek.THURSDAY, next?.dayOfWeek)
    }

    @Test
    fun testRecurrenceMonthlyDayOfMonth() {
        val current = LocalDate.of(2026, 9, 15)
        val rule = RecurrenceRule(type = RecurrenceType.MONTHLY, interval = 1, dayOfMonth = 15)
        val next = TaskRepositoryImpl.calculateNextOccurrence(current, rule)
        assertEquals(LocalDate.of(2026, 10, 15), next)
    }
}
