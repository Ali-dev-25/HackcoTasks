package com.taskflow.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
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
import com.taskflow.domain.model.Priority
import com.taskflow.domain.model.RecurrenceRule
import com.taskflow.domain.model.RecurrenceType
import com.taskflow.domain.model.ReminderOption
import com.taskflow.domain.model.TaskStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

class Converters {
    private val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE
    private val timeFormatter = DateTimeFormatter.ISO_LOCAL_TIME

    @TypeConverter
    fun fromLocalDate(date: LocalDate?): String? = date?.format(dateFormatter)

    @TypeConverter
    fun toLocalDate(value: String?): LocalDate? = value?.let { LocalDate.parse(it, dateFormatter) }

    @TypeConverter
    fun fromLocalTime(time: LocalTime?): String? = time?.format(timeFormatter)

    @TypeConverter
    fun toLocalTime(value: String?): LocalTime? = value?.let { LocalTime.parse(it, timeFormatter) }

    @TypeConverter
    fun fromPriority(priority: Priority): String = priority.name

    @TypeConverter
    fun toPriority(value: String): Priority = Priority.valueOf(value)

    @TypeConverter
    fun fromStatus(status: TaskStatus): String = status.name

    @TypeConverter
    fun toStatus(value: String): TaskStatus = TaskStatus.valueOf(value)

    @TypeConverter
    fun fromReminder(reminder: ReminderOption): String = reminder.name

    @TypeConverter
    fun toReminder(value: String): ReminderOption = ReminderOption.valueOf(value)

    @TypeConverter
    fun fromRecurrence(rule: RecurrenceRule): String {
        val json = JSONObject()
        json.put("type", rule.type.name)
        json.put("interval", rule.interval)
        val daysArray = JSONArray()
        rule.daysOfWeek.forEach { daysArray.put(it) }
        json.put("daysOfWeek", daysArray)
        rule.dayOfMonth?.let { json.put("dayOfMonth", it) }
        rule.endDate?.let { json.put("endDate", it.format(dateFormatter)) }
        return json.toString()
    }

    @TypeConverter
    fun toRecurrence(value: String): RecurrenceRule {
        return try {
            val json = JSONObject(value)
            val type = RecurrenceType.valueOf(json.getString("type"))
            val interval = json.optInt("interval", 1)
            val daysArray = json.optJSONArray("daysOfWeek")
            val days = mutableSetOf<Int>()
            if (daysArray != null) {
                for (i in 0 until daysArray.length()) {
                    days.add(daysArray.getInt(i))
                }
            }
            val dayOfMonth = if (json.has("dayOfMonth")) json.getInt("dayOfMonth") else null
            val endDate = if (json.has("endDate")) LocalDate.parse(json.getString("endDate"), dateFormatter) else null
            RecurrenceRule(type, interval, days, dayOfMonth, endDate)
        } catch (e: Exception) {
            RecurrenceRule()
        }
    }
}

@Database(
    entities = [
        TaskEntity::class,
        CategoryEntity::class,
        SubTaskEntity::class,
        ReminderEntity::class,
        UserSettingsEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class TaskFlowDatabase : RoomDatabase() {

    abstract fun taskDao(): TaskDao
    abstract fun categoryDao(): CategoryDao
    abstract fun subTaskDao(): SubTaskDao
    abstract fun reminderDao(): ReminderDao
    abstract fun userSettingsDao(): UserSettingsDao

    companion object {
        @Volatile
        private var INSTANCE: TaskFlowDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): TaskFlowDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    TaskFlowDatabase::class.java,
                    "taskflow_database.db"
                )
                    .addCallback(DatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialData(database.categoryDao(), database.userSettingsDao())
                    }
                }
            }

            suspend fun populateInitialData(categoryDao: CategoryDao, settingsDao: UserSettingsDao) {
                val defaultCategories = listOf(
                    CategoryEntity(name = "Work", icon = "Briefcase", colorHex = "#2563EB", isDefault = true),
                    CategoryEntity(name = "Study", icon = "GraduationCap", colorHex = "#7C3AED", isDefault = true),
                    CategoryEntity(name = "Programming", icon = "Code", colorHex = "#059669", isDefault = true),
                    CategoryEntity(name = "Personal", icon = "User", colorHex = "#D97706", isDefault = true),
                    CategoryEntity(name = "Home", icon = "Home", colorHex = "#DC2626", isDefault = true),
                    CategoryEntity(name = "Shopping", icon = "ShoppingCart", colorHex = "#DB2777", isDefault = true),
                    CategoryEntity(name = "Health", icon = "Heart", colorHex = "#10B981", isDefault = true),
                    CategoryEntity(name = "Other", icon = "Folder", colorHex = "#64748B", isDefault = true)
                )
                categoryDao.insertAll(defaultCategories)

                settingsDao.updateSettings(
                    UserSettingsEntity(
                        id = 1,
                        themeMode = "SYSTEM",
                        language = "en",
                        notificationsEnabled = true,
                        soundEnabled = true,
                        vibrationEnabled = true,
                        defaultDurationMinutes = 60,
                        firstDayOfWeek = 1
                    )
                )
            }
        }
    }
}
