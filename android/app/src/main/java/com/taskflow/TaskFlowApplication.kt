package com.taskflow

import android.app.Application
import com.taskflow.data.local.database.TaskFlowDatabase
import com.taskflow.data.repository.TaskRepository
import com.taskflow.data.repository.TaskRepositoryImpl
import com.taskflow.notification.NotificationHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class TaskFlowApplication : Application() {
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val database by lazy { TaskFlowDatabase.getDatabase(this, applicationScope) }
    val repository: TaskRepository by lazy {
        TaskRepositoryImpl(
            database.taskDao(),
            database.subTaskDao(),
            database.categoryDao(),
            database.reminderDao(),
            database.userSettingsDao()
        )
    }

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannel(this)
    }
}
