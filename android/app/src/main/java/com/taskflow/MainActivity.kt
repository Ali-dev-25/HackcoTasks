package com.taskflow

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.core.content.ContextCompat
import com.taskflow.domain.model.Task
import com.taskflow.presentation.screens.HomeScreen
import com.taskflow.presentation.theme.TaskFlowTheme
import com.taskflow.presentation.viewmodel.CalendarViewModel
import com.taskflow.presentation.viewmodel.SettingsViewModel
import com.taskflow.presentation.viewmodel.StatisticsViewModel
import com.taskflow.presentation.viewmodel.TaskViewModel

enum class NavigationItem(val titleRes: Int, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    HOME(R.string.nav_home, Icons.Default.Home),
    TASKS(R.string.nav_tasks, Icons.Default.CheckCircle),
    CALENDAR(R.string.nav_calendar, Icons.Default.DateRange),
    STATISTICS(R.string.nav_statistics, Icons.Default.BarChart),
    SETTINGS(R.string.nav_settings, Icons.Default.Settings)
}

class MainActivity : ComponentActivity() {

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Notification permission result handled
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        checkNotificationPermission()

        val app = application as TaskFlowApplication
        val repository = app.repository
        val taskViewModel = TaskViewModel(repository)
        val calendarViewModel = CalendarViewModel(repository)
        val statsViewModel = StatisticsViewModel(repository)
        val settingsViewModel = SettingsViewModel(repository)

        setContent {
            val settings by settingsViewModel.settingsState.collectAsState()
            val isDark = when (settings.themeMode) {
                "DARK" -> true
                "LIGHT" -> false
                else -> androidx.compose.foundation.isSystemInDarkTheme()
            }

            TaskFlowTheme(darkTheme = isDark) {
                var currentNav by remember { mutableStateOf(NavigationItem.HOME) }
                var showCreateDialog by remember { mutableStateOf(false) }
                var editingTask by remember { mutableStateOf<Task?>(null) }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        NavigationBar {
                            NavigationItem.entries.forEach { item ->
                                NavigationBarItem(
                                    selected = currentNav == item,
                                    onClick = { currentNav = item },
                                    icon = { Icon(item.icon, contentDescription = stringResource(item.titleRes)) },
                                    label = { Text(stringResource(item.titleRes)) }
                                )
                            }
                        }
                    },
                    floatingActionButton = {
                        FloatingActionButton(
                            onClick = {
                                editingTask = null
                                showCreateDialog = true
                            },
                            containerColor = MaterialTheme.colorScheme.primary
                        ) {
                            Icon(Icons.Default.Add, contentDescription = stringResource(R.string.action_create_task))
                        }
                    }
                ) { innerPadding ->
                    Surface(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        when (currentNav) {
                            NavigationItem.HOME -> HomeScreen(
                                taskViewModel = taskViewModel,
                                onNavigateToTasks = { currentNav = NavigationItem.TASKS },
                                onEditTask = {
                                    editingTask = it
                                    showCreateDialog = true
                                },
                                onOpenCreateTask = {
                                    editingTask = null
                                    showCreateDialog = true
                                }
                            )
                            NavigationItem.TASKS -> {
                                // Task management view
                            }
                            NavigationItem.CALENDAR -> {
                                // Calendar view
                            }
                            NavigationItem.STATISTICS -> {
                                // Statistics view
                            }
                            NavigationItem.SETTINGS -> {
                                // Settings view
                            }
                        }
                    }
                }
            }
        }
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}
