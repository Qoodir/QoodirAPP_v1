import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Layers,
  Smartphone,
  FolderTree,
  FileCode,
  Terminal
} from 'lucide-react';
import JSZip from 'jszip';
import { KOTLIN_ANDROID_FILES } from '../data/kotlinCodebase';
import { KotlinFilePreview } from '../types';

export const KotlinAndroidProjectViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<KotlinFilePreview>(KOTLIN_ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAndroidZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Root build.gradle
      zip.file(
        'build.gradle.kts',
        `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}`
      );

      zip.file(
        'settings.gradle.kts',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "KatalogKomikMedia"
include(":app")`
      );

      // App folder
      const appFolder = zip.folder('app');
      appFolder?.file(
        'build.gradle.kts',
        KOTLIN_ANDROID_FILES.find((f) => f.name === 'build.gradle.kts')?.code || ''
      );

      const srcMain = appFolder?.folder('src')?.folder('main');
      srcMain?.file(
        'AndroidManifest.xml',
        KOTLIN_ANDROID_FILES.find((f) => f.name === 'AndroidManifest.xml')?.code || ''
      );

      const javaBase = srcMain
        ?.folder('java')
        ?.folder('com')
        ?.folder('katalog')
        ?.folder('komikmedia');

      // Add entities
      const dataLocal = javaBase?.folder('data')?.folder('local');
      dataLocal?.file('AppDatabase.kt', KOTLIN_ANDROID_FILES.find((f) => f.name === 'AppDatabase.kt')?.code || '');
      
      const daoFolder = dataLocal?.folder('dao');
      daoFolder?.file('ComicDao.kt', KOTLIN_ANDROID_FILES.find((f) => f.name === 'ComicDao.kt')?.code || '');

      const entityFolder = dataLocal?.folder('entity');
      entityFolder?.file('ComicEntity.kt', KOTLIN_ANDROID_FILES.find((f) => f.name === 'ComicEntity.kt')?.code || '');
      entityFolder?.file('MediaEntities.kt', KOTLIN_ANDROID_FILES.find((f) => f.name === 'MediaEntities.kt')?.code || '');

      // Converters
      dataLocal?.file(
        'Converters.kt',
        `package com.katalog.komikmedia.data.local

import androidx.room.TypeConverter
import org.json.JSONArray

class Converters {
    @TypeConverter
    fun fromIntList(list: List<Int>): String {
        return JSONArray(list).toString()
    }

    @TypeConverter
    fun toIntList(data: String): List<Int> {
        val list = mutableListOf<Int>()
        if (data.isBlank()) return list
        val array = JSONArray(data)
        for (i in 0 until array.length()) {
            list.add(array.getInt(i))
        }
        return list
    }
}`
      );

      // Repository
      const repoFolder = javaBase?.folder('data')?.folder('repository');
      repoFolder?.file('ComicRepository.kt', KOTLIN_ANDROID_FILES.find((f) => f.name === 'ComicRepository.kt')?.code || '');

      // ViewModel & UI
      const uiFolder = javaBase?.folder('ui');
      uiFolder?.folder('viewmodel')?.file('ComicViewModel.kt', KOTLIN_ANDROID_FILES.find((f) => f.name === 'ComicViewModel.kt')?.code || '');
      javaBase?.file('MainActivity.kt', KOTLIN_ANDROID_FILES.find((f) => f.name === 'MainActivity.kt')?.code || '');

      // README instructions
      zip.file(
        'README.md',
        `# Katalog Komik & Media Offline (Android Kotlin)

Aplikasi Android native menggunakan:
- **Language**: Kotlin 1.9+
- **UI Framework**: Jetpack Compose & Material 3
- **Local Database**: Android Room Database
- **Keamanan Enkripsi**: SQLCipher (256-bit AES encryption untuk menyimpan data komik, volume, & media secara aman)
- **Media Player**: AndroidX Media3 (ExoPlayer)
- **Arsitektur**: MVVM (Model-View-ViewModel) + Coroutines Flow StateFlow

## Cara Membuka di Android Studio
1. Ekstrak file ZIP ini ke folder pilihan Anda.
2. Buka Android Studio -> Pilih **Open** -> pilih folder hasil ekstrak.
3. Tunggu Gradle sync selesai.
4. Hubungkan emulator atau perangkat Android fisik, lalu klik tombol **Run 'app'** (Shift + F10).
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KatalogKomik-Android-Kotlin-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      alert('Berhasil mengunduh source code project Android Studio lengkap (.ZIP)!');
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor project Android.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Security & Architecture Banner */}
      <div className="bg-[#161925] text-white p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3DDC84] text-[#0F111A] flex items-center justify-center font-bold shrink-0 shadow-sm shadow-[#3DDC84]/20">
              <div className="w-5 h-5 bg-[#0F111A] rotate-45 flex items-center justify-center">
                <div className="w-2 h-2 bg-[#3DDC84] rotate-45"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight font-mono">
                  KOTLIN <span className="text-[#3DDC84]">SECURE</span> BASE
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 uppercase font-bold">
                  SQLCipher Encrypted
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Android Jetpack Compose + Room ORM (AES-256 Bit Encryption)
              </p>
            </div>
          </div>

          <button
            id="btn-download-android-zip"
            onClick={handleDownloadAndroidZip}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3DDC84] hover:bg-[#32c974] active:scale-95 text-[#0F111A] font-bold font-mono text-xs shadow-md transition-all shrink-0 tracking-tight"
          >
            <Download size={15} className="stroke-[2.5]" />
            <span>{isExporting ? 'BUILDING ZIP...' : 'DOWNLOAD PROJECT ZIP'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          Arsitektur native Android berbasis <strong>Kotlin & Jetpack Compose</strong>. Data tersimpan secara aman di database lokal menggunakan <strong>Room ORM</strong> yang diproteksi enkripsi <strong>SQLCipher</strong>, menjamin keamanan data katalog dan file media offline dari pembacaan tidak sah.
        </p>

        {/* Feature Pills */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono font-bold text-slate-300 pt-1">
          <span className="px-2.5 py-1 rounded bg-[#12141F] border border-slate-700 text-slate-300">
            ROOM DB 2.6
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#3DDC84]">
            SQLCIPHER AES-256
          </span>
          <span className="px-2.5 py-1 rounded bg-[#12141F] border border-slate-700 text-slate-300">
            JETPACK COMPOSE M3
          </span>
          <span className="px-2.5 py-1 rounded bg-[#12141F] border border-slate-700 text-slate-300">
            MEDIA3 EXOPLAYER
          </span>
          <span className="px-2.5 py-1 rounded bg-[#12141F] border border-slate-700 text-slate-300">
            COROUTINES STATEFLOW
          </span>
        </div>
      </div>

      {/* Code Explorer */}
      <div className="bg-white dark:bg-[#161925] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Explorer Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#1C202F] flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30 border border-yellow-500/60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/60"></div>
            </div>
            <div className="flex items-center gap-2">
              <FileCode size={16} className="text-[#3DDC84]" />
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedFile.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#3DDC84]/15 text-emerald-800 dark:text-[#3DDC84] border border-[#3DDC84]/30">
                {selectedFile.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-[#12141F] border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-[#3DDC84]" />
                  <span className="text-[#3DDC84]">COPIED!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>SALIN KODE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* File Tabs List */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-[#12141F] border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
          {KOTLIN_ANDROID_FILES.map((file) => {
            const isSelected = selectedFile.name === file.name;

            return (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`px-3 py-1.5 rounded-md font-mono text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white dark:bg-[#161925] text-emerald-700 dark:text-[#3DDC84] font-bold shadow-xs border border-slate-200 dark:border-[#3DDC84]/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Code2 size={13} />
                <span>{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* File Description */}
        <div className="px-4 py-2 bg-emerald-50/50 dark:bg-[#12141F] border-b border-emerald-100 dark:border-slate-800 text-xs font-mono text-emerald-900 dark:text-slate-300 flex items-center gap-2">
          <span className="text-[#3DDC84]">◆</span>
          <span className="font-medium">{selectedFile.description}</span>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-[#0F111A] text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
          <pre className="leading-relaxed">
            <code>{selectedFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
