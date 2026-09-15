import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  ChevronRight,
  Code
} from 'lucide-react';
import { LocaleStrings } from '../locales/strings';

interface ProjectExplorerProps {
  strings: LocaleStrings;
  isDark: boolean;
}

interface AndroidFile {
  path: string;
  name: string;
  category: string;
  language: string;
  description: string;
  code: string;
}

const ANDROID_FILES: AndroidFile[] = [
  {
    path: 'android/app/src/main/java/com/taskflow/domain/model/Models.kt',
    name: 'Models.kt',
    category: 'Domain Layer',
    language: 'kotlin',
    description: 'Core Domain models: Task, SubTask, Category, RecurrenceRule, Priority, ReminderOption',
    code: `package com.taskflow.domain.model

import java.time.LocalDate
import java.time.LocalTime

enum class Priority { LOW, MEDIUM, HIGH }
enum class TaskStatus { PENDING, COMPLETED, CANCELLED }
enum class ReminderOption { NONE, AT_TIME, MIN_5, MIN_10, MIN_15, MIN_30, HOUR_1, DAY_1 }
enum class RecurrenceType { NONE, DAILY, WEEKLY, WEEKDAY_MASK, EVERY_N_DAYS, EVERY_N_WEEKS, MONTHLY, YEARLY }

data class RecurrenceRule(
    val type: RecurrenceType = RecurrenceType.NONE,
    val interval: Int = 1,
    val daysOfWeek: Set<Int> = emptySet(), // 1=Mon, 7=Sun
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
    val icon: String = "default",
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
            if (subtasks.isEmpty()) return if (task.status == TaskStatus.COMPLETED) 1f else 0f
            val completed = subtasks.count { it.isCompleted }
            return completed.toFloat() / subtasks.size
        }
}`
  },
  {
    path: 'android/app/src/main/java/com/taskflow/data/local/dao/TaskDao.kt',
    name: 'TaskDao.kt',
    category: 'Data Layer (DAOs)',
    language: 'kotlin',
    description: 'Room Data Access Objects with Flow observables for reactive updates',
    code: `package com.taskflow.data.local.dao

import androidx.room.*
import com.taskflow.data.local.entity.*
import com.taskflow.domain.model.TaskStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Transaction
    @Query("SELECT * FROM tasks ORDER BY date ASC, startTime ASC")
    fun getAllTasksWithDetails(): Flow<List<TaskWithDetailsEntity>>

    @Transaction
    @Query("SELECT * FROM tasks WHERE date = :date ORDER BY startTime ASC")
    fun getTasksForDate(date: String): Flow<List<TaskWithDetailsEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity): Long

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)

    @Query("UPDATE tasks SET status = :status, completedAt = :completedAt WHERE id = :taskId")
    suspend fun updateTaskStatus(taskId: Long, status: TaskStatus, completedAt: Long?)
}`
  },
  {
    path: 'android/app/src/main/java/com/taskflow/data/repository/TaskRepository.kt',
    name: 'TaskRepository.kt',
    category: 'Repository Layer',
    language: 'kotlin',
    description: 'Offline-First repository with automatic recurring task generation',
    code: `package com.taskflow.data.repository

import com.taskflow.data.local.dao.*
import com.taskflow.domain.model.*
import kotlinx.coroutines.flow.*
import java.time.LocalDate

class TaskRepositoryImpl(
    private val taskDao: TaskDao,
    private val subTaskDao: SubTaskDao,
    private val categoryDao: CategoryDao,
    private val reminderDao: ReminderDao,
    private val userSettingsDao: UserSettingsDao
) : TaskRepository {

    override fun getAllTasks(): Flow<List<TaskWithDetails>> =
        taskDao.getAllTasksWithDetails().map { list -> list.map { it.toDomain() } }

    override suspend fun saveTask(task: Task): Long {
        val entity = task.toEntity()
        return if (task.id == 0L) taskDao.insertTask(entity)
        else { taskDao.updateTask(entity); task.id }
    }

    override suspend fun setTaskCompleted(taskId: Long, isCompleted: Boolean) {
        val status = if (isCompleted) TaskStatus.COMPLETED else TaskStatus.PENDING
        val completedAt = if (isCompleted) System.currentTimeMillis() else null
        taskDao.updateTaskStatus(taskId, status, completedAt)
    }

    companion object {
        fun calculateNextOccurrence(current: LocalDate, rule: RecurrenceRule): LocalDate? {
            return when (rule.type) {
                RecurrenceType.NONE -> null
                RecurrenceType.DAILY -> current.plusDays(rule.interval.toLong())
                RecurrenceType.EVERY_N_DAYS -> current.plusDays(rule.interval.toLong())
                RecurrenceType.WEEKDAY_MASK -> {
                    var next = current.plusDays(1)
                    while (next.dayOfWeek.value in 6..7) { next = next.plusDays(1) }
                    next
                }
                RecurrenceType.WEEKLY -> current.plusWeeks(rule.interval.toLong())
                RecurrenceType.MONTHLY -> current.plusMonths(rule.interval.toLong())
                RecurrenceType.YEARLY -> current.plusYears(rule.interval.toLong())
                else -> null
            }
        }
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/taskflow/presentation/screens/Screens.kt',
    name: 'Screens.kt',
    category: 'Presentation (Jetpack Compose)',
    language: 'kotlin',
    description: 'Jetpack Compose Material 3 UI: HomeScreen, TaskCard, PriorityBadges, Progress',
    code: `package com.taskflow.presentation.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.taskflow.domain.model.*
import com.taskflow.presentation.viewmodel.TaskViewModel

@Composable
fun HomeScreen(
    taskViewModel: TaskViewModel,
    onNavigateToTasks: () -> Unit,
    onEditTask: (Task) -> Unit,
    onOpenCreateTask: () -> Unit
) {
    val uiState by taskViewModel.uiState.collectAsState()
    Scaffold { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                ProductivityHeroCard(tasks = uiState.tasks)
            }
            items(uiState.tasks, key = { it.task.id }) { item ->
                TaskCard(
                    taskWithDetails = item,
                    onToggleComplete = { taskViewModel.toggleTaskComplete(item.task.id, it) },
                    onEdit = { onEditTask(item.task) }
                )
            }
        }
    }
}`
  },
  {
    path: 'android/app/src/main/res/values-ar/strings.xml',
    name: 'values-ar/strings.xml',
    category: 'Localization (Arabic RTL)',
    language: 'xml',
    description: 'Complete Arabic localization string resources for native RTL support',
    code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">HackcoTasks</string>
    <string name="nav_home">الرئيسية</string>
    <string name="nav_tasks">المهام</string>
    <string name="nav_calendar">التقويم</string>
    <string name="nav_statistics">الإحصائيات</string>
    <string name="nav_settings">الإعدادات</string>
    <string name="action_create_task">مهمة جديدة</string>
    <string name="today_progress">إنجاز اليوم</string>
    <string name="completed_tasks">المكتملة</string>
    <string name="remaining_tasks">المتبقية</string>
    <string name="priority_high">عالية</string>
    <string name="priority_medium">متوسطة</string>
    <string name="priority_low">منخفضة</string>
</resources>`
  },
  {
    path: 'android/app/src/test/java/com/hackcotasks/HackcoTasksUnitTests.kt',
    name: 'HackcoTasksUnitTests.kt',
    category: 'Unit Tests',
    language: 'kotlin',
    description: 'JUnit tests for Recurrence calculations, weekday mask, subtask percentages',
    code: `package com.hackcotasks

import com.hackcotasks.data.repository.TaskRepositoryImpl
import com.hackcotasks.domain.model.*
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class HackcoTasksUnitTests {
    @Test
    fun testRecurrenceWeekdayMaskSkipsWeekend() {
        val friday = LocalDate.of(2026, 9, 18)
        val rule = RecurrenceRule(type = RecurrenceType.WEEKDAY_MASK)
        val next = TaskRepositoryImpl.calculateNextOccurrence(friday, rule)
        assertEquals(LocalDate.of(2026, 9, 21), next)
    }

    @Test
    fun testSubTaskPercentage() {
        val task = Task(title = "Test", date = LocalDate.now(), startTime = LocalTime.now(), endTime = LocalTime.now())
        val subtasks = listOf(
            SubTask(taskId = 1, title = "A", isCompleted = true),
            SubTask(taskId = 1, title = "B", isCompleted = false)
        )
        val details = TaskWithDetails(task, null, subtasks)
        assertEquals(0.5f, details.completionPercentage, 0.001f)
    }
}`
  },
  {
    path: 'android/app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    category: 'Build System (Gradle)',
    language: 'kotlin',
    description: 'Android Gradle plugin, Compose BOM, Room KSP, Material3 dependencies',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.hackcotasks"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.hackcotasks"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.01.00"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.room:room-runtime:2.7.0-alpha12")
    implementation("androidx.room:room-ktx:2.7.0-alpha12")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("androidx.work:work-runtime-ktx:2.10.0")
}`
  }
];

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ strings, isDark }) => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const data = JSON.stringify(ANDROID_FILES, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hackcotasks-android-project-source.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-4xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-black tracking-tight">{strings.projectExplorerTitle}</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {strings.projectExplorerSubtitle}
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          className="px-4 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 self-start sm:self-auto active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{strings.downloadProject}</span>
        </button>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Files List */}
        <div className="md:col-span-4 space-y-2">
          <div
            className={`p-3.5 rounded-3xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-1">
              <Folder className="w-4 h-4 text-indigo-500" />
              <span>هيكلية ملفات التطبيق (Android M3)</span>
            </div>

            <div className="space-y-1.5">
              {ANDROID_FILES.map(file => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-start p-3 rounded-2xl text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold shadow-md shadow-indigo-500/20'
                        : isDark
                        ? 'hover:bg-slate-800/80 text-slate-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileCode className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />
                      <div className="truncate">
                        <div className="truncate font-bold">{file.name}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {file.category}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 rtl:rotate-180 ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="md:col-span-8">
          <div
            className={`rounded-3xl border overflow-hidden flex flex-col h-[560px] shadow-lg ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-950 border-slate-900 text-slate-200'
            }`}
          >
            {/* Code Header */}
            <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400 truncate">
                    {selectedFile.path}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400">
                    {selectedFile.language}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {selectedFile.description}
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 flex-shrink-0 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{strings.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{strings.copyFile}</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-300 select-text">
              <pre>
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
