import { KotlinFilePreview } from '../types';

export const KOTLIN_ANDROID_FILES: KotlinFilePreview[] = [
  {
    name: 'AppDatabase.kt',
    category: 'Database',
    description: 'Room Database dengan integrasi SQLCipher untuk enkripsi data lokal 256-bit AES secara aman.',
    code: `package com.katalog.komikmedia.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import net.sqlcipher.database.SQLiteDatabase
import net.sqlcipher.database.SupportFactory
import com.katalog.komikmedia.data.local.dao.ComicDao
import com.katalog.komikmedia.data.local.dao.MediaDao
import com.katalog.komikmedia.data.local.entity.ComicEntity
import com.katalog.komikmedia.data.local.entity.MangaFileEntity
import com.katalog.komikmedia.data.local.entity.MusicTrackEntity

@Database(
    entities = [
        ComicEntity::class,
        MangaFileEntity::class,
        MusicTrackEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun comicDao(): ComicDao
    abstract fun mediaDao(): MediaDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        // Passphrase aman untuk enkripsi database lokal dengan SQLCipher
        private val DB_PASSPHRASE = "KatalogKomikSecurePassphraseKey_2026".toByteArray()

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                // Inisialisasi library native SQLCipher
                SQLiteDatabase.loadLibs(context)
                val factory = SupportFactory(DB_PASSPHRASE)

                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "katalog_komik_encrypted.db"
                )
                    .openHelperFactory(factory) // Menggunakan SQLCipher SupportFactory
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },
  {
    name: 'ComicEntity.kt',
    category: 'Entity',
    description: 'Model Entity Room untuk Katalog Komik, status kepemilikan volume, format reguler/bind-up, dan relasi folder.',
    code: `package com.katalog.komikmedia.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "comics")
data class ComicEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val author: String,
    val totalVolumes: Int,
    val type: String, // "reguler" atau "bindup"
    val mangaLinkFolder: String = "",
    val ownedVolumes: List<Int> = emptyList(), // Disimpan via TypeConverter
    val createdAt: Long = System.currentTimeMillis()
) {
    val isCompleted: Boolean
        get() = ownedVolumes.size >= totalVolumes && totalVolumes > 0
}`
  },
  {
    name: 'MediaEntities.kt',
    category: 'Entity',
    description: 'Entity untuk file Manga (.cbz/.pdf) dan Music Track offline yang disimpan dalam database terenkripsi.',
    code: `package com.katalog.komikmedia.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "manga_files")
data class MangaFileEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val fileName: String,
    val fileSize: String,
    val folder: String,
    val filePath: String, // Path internal storage terenkripsi
    val status: String = "Belum Dibaca", // "Belum Dibaca", "Sedang Dibaca", "Selesai"
    val lastReadPage: Int = 0,
    val addedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "music_tracks")
data class MusicTrackEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val fileName: String,
    val folder: String = "Favorit",
    val filePath: String,
    val durationSeconds: Int = 0,
    val addedAt: Long = System.currentTimeMillis()
)`
  },
  {
    name: 'ComicDao.kt',
    category: 'DAO',
    description: 'Data Access Object Room untuk operasi CRUD komik dan query reaktif dengan Kotlin Coroutines & Flow.',
    code: `package com.katalog.komikmedia.data.local.dao

import androidx.room.*
import com.katalog.komikmedia.data.local.entity.ComicEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ComicDao {
    @Query("SELECT * FROM comics ORDER BY CASE WHEN type = 'bindup' THEN 0 ELSE 1 END, title ASC")
    fun getAllComics(): Flow<List<ComicEntity>>

    @Query("SELECT * FROM comics WHERE id = :id")
    suspend fun getComicById(id: Long): ComicEntity?

    @Query("SELECT * FROM comics WHERE title LIKE '%' || :query || '%' OR author LIKE '%' || :query || '%'")
    fun searchComics(query: String): Flow<List<ComicEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertComic(comic: ComicEntity): Long

    @Update
    suspend fun updateComic(comic: ComicEntity)

    @Delete
    suspend fun deleteComic(comic: ComicEntity)

    @Query("DELETE FROM comics WHERE id = :id")
    suspend fun deleteById(id: Long)
}`
  },
  {
    name: 'ComicRepository.kt',
    category: 'Repository',
    description: 'Repository layer yang menjembatani DAO lokal aman dengan ViewModel.',
    code: `package com.katalog.komikmedia.data.repository

import com.katalog.komikmedia.data.local.dao.ComicDao
import com.katalog.komikmedia.data.local.dao.MediaDao
import com.katalog.komikmedia.data.local.entity.ComicEntity
import com.katalog.komikmedia.data.local.entity.MangaFileEntity
import com.katalog.komikmedia.data.local.entity.MusicTrackEntity
import kotlinx.coroutines.flow.Flow

class ComicRepository(
    private val comicDao: ComicDao,
    private val mediaDao: MediaDao
) {
    val allComics: Flow<List<ComicEntity>> = comicDao.getAllComics()

    fun searchComics(query: String): Flow<List<ComicEntity>> {
        return comicDao.searchComics(query)
    }

    suspend fun addComic(comic: ComicEntity): Long {
        return comicDao.insertComic(comic)
    }

    suspend fun updateComic(comic: ComicEntity) {
        comicDao.updateComic(comic)
    }

    suspend fun toggleVolumeOwned(comicId: Long, volume: Int) {
        val comic = comicDao.getComicById(comicId) ?: return
        val currentOwned = comic.ownedVolumes.toMutableList()
        if (currentOwned.contains(volume)) {
            currentOwned.remove(volume)
        } else {
            currentOwned.add(volume)
        }
        comicDao.updateComic(comic.copy(ownedVolumes = currentOwned))
    }

    suspend fun deleteComic(id: Long) {
        comicDao.deleteById(id)
    }

    // Media
    val allMangaFiles: Flow<List<MangaFileEntity>> = mediaDao.getAllManga()
    val allMusicTracks: Flow<List<MusicTrackEntity>> = mediaDao.getAllMusic()
}`
  },
  {
    name: 'ComicViewModel.kt',
    category: 'ViewModel',
    description: 'Android ViewModel dengan StateFlow dan Kotlin Coroutines untuk reactive UI state.',
    code: `package com.katalog.komikmedia.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.katalog.komikmedia.data.local.entity.ComicEntity
import com.katalog.komikmedia.data.repository.ComicRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class CatalogUiState(
    val comics: List<ComicEntity> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val selectedComic: ComicEntity? = null
)

class ComicViewModel(
    private val repository: ComicRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    val uiState: StateFlow<CatalogUiState> = _searchQuery
        .debounce(200)
        .flatMapLatest { query ->
            if (query.isBlank()) {
                repository.allComics
            } else {
                repository.searchComics(query)
            }
        }
        .map { list -> CatalogUiState(comics = list, searchQuery = _searchQuery.value) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = CatalogUiState(isLoading = true)
        )

    fun onSearchQueryChanged(newQuery: String) {
        _searchQuery.value = newQuery
    }

    fun addComic(title: String, author: String, totalVolumes: Int, type: String, folder: String) {
        viewModelScope.launch {
            val entity = ComicEntity(
                title = title,
                author = author,
                totalVolumes = totalVolumes,
                type = type,
                mangaLinkFolder = folder
            )
            repository.addComic(entity)
        }
    }

    fun toggleVolume(comicId: Long, volume: Int) {
        viewModelScope.launch {
            repository.toggleVolumeOwned(comicId, volume)
        }
    }

    fun deleteComic(id: Long) {
        viewModelScope.launch {
            repository.deleteComic(id)
        }
    }
}`
  },
  {
    name: 'MainActivity.kt',
    category: 'UI Screen',
    description: 'Entry point Jetpack Compose untuk aplikasi Android dengan navigasi bottom bar, tema Material 3, dan FAB.',
    code: `package com.katalog.komikmedia

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.katalog.komikmedia.ui.screens.MainAppNavigation
import com.katalog.komikmedia.ui.theme.KatalogKomikTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KatalogKomikTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    MainAppNavigation(navController = navController)
                }
            }
        }
    }
}`
  },
  {
    name: 'build.gradle.kts',
    category: 'Gradle',
    description: 'Konfigurasi dependencies Room, SQLCipher, Jetpack Compose, Media3/ExoPlayer, dan Coil.',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.kapt)
}

android {
    namespace = "com.katalog.komikmedia"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.katalog.komikmedia"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Room Database dengan SQLCipher (Enkripsi Lokal Aman)
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    implementation("net.zetetic:android-database-sqlcipher:4.5.4")
    implementation("androidx.sqlite:sqlite-ktx:2.4.0")

    // Media Player (ExoPlayer Media3) untuk audio & video
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-ui:1.2.1")

    // Image loading (Coil) & Zip/CBZ uncompress
    implementation("io.coil-kt:coil-compose:2.5.0")
    implementation("org.apache.commons:commons-compress:1.26.0")
}`
  },
  {
    name: 'AndroidManifest.xml',
    category: 'Manifest',
    description: 'Manifest Android dengan permission file media, foreground service audio, dan orientasi layar.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:name=".KatalogApplication"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="Katalog Komik &amp; Media"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.KatalogKomik">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.MusicPlaybackService"
            android:foregroundServiceType="mediaPlayback"
            android:exported="false" />
    </application>
</manifest>`
  }
];
