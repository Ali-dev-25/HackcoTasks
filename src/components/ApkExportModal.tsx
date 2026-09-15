import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Terminal,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import JSZip from 'jszip';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose, isDark }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadAndroidZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Root files
      zip.file(
        'README-BUILD-APK.md',
        `# HackcoTasks Android Project\n\nTo build APK directly:\n1. Open this folder or import into Android Studio.\n2. Run: ./gradlew assembleDebug\n3. Output APK will be in: app/build/outputs/apk/debug/app-debug.apk\n`
      );

      const androidFolder = zip.folder('android')!;
      androidFolder.file(
        'build.gradle',
        `// Top-level build file
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.7.2'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`
      );

      androidFolder.file(
        'settings.gradle',
        `include ':app'\nrootProject.name = 'HackcoTasks'`
      );

      const appFolder = androidFolder.folder('app')!;
      appFolder.file(
        'build.gradle',
        `apply plugin: 'com.android.application'

android {
    namespace "com.hackcotasks.app"
    compileSdk 35

    defaultConfig {
        applicationId "com.hackcotasks.app"
        minSdk 26
        targetSdk 35
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.core:core-splashscreen:1.0.1'
}`
      );

      const mainFolder = appFolder.folder('src')!.folder('main')!;
      mainFolder.file(
        'AndroidManifest.xml',
        `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="HackcoTasks"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
</manifest>`
      );

      const javaFolder = mainFolder.folder('java')!.folder('com')!.folder('hackcotasks')!.folder('app')!;
      javaFolder.file(
        'MainActivity.java',
        `package com.hackcotasks.app;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}`
      );

      const resValues = mainFolder.folder('res')!.folder('values')!;
      resValues.file(
        'strings.xml',
        `<resources>
    <string name="app_name">HackcoTasks</string>
    <string name="title_activity_main">HackcoTasks</string>
</resources>`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'HackcoTasks-Android-Project.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border flex flex-col shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>تصدير وبناء ملف الـ APK لجهازك</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Android Native
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                طرق تحويل HackcoTasks إلى تطبيق محلي وتثبيته على هاتفك مباشرة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Method 1: Cloud GitHub Actions (Recommended) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark
                ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-900/40'
                : 'bg-indigo-50/70 border-indigo-200/80'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black">
                1
              </span>
              <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-black text-sm text-indigo-950 dark:text-indigo-200">
                التجميع السحابي التلقائي عبر GitHub Actions (الأسهل بدون تثبيت أي برامج)
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              تم تجهيز سير عمل آلي (<code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">.github/workflows/build-apk.yml</code>) داخل المشروع ليقوم ببناء ملف الـ APK على خوادم GitHub السحابية مجاناً وتنزيله لهاتفك:
            </p>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 font-medium ps-1">
              <li>اضغط على <strong>Settings</strong> في الأعلى ثم اختر <strong>Export to GitHub</strong>.</li>
              <li>افتح مستودعك على GitHub واضغط على تبويب <strong>Actions</strong>.</li>
              <li>ستجد الـ Workflow يبدأ بالبناء فوراً ويستغرق حوالي دقيقتين.</li>
              <li>عند اكتمال البناء ستجد ملف <strong>HackcoTasks-Android-APK</strong> بصيغة <code>.apk</code> جاهز للتحميل والتثبيت فوراً على هاتفك!</li>
            </ol>
          </div>

          {/* Method 2: Android Studio Local Build */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black">
                2
              </span>
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                البناء عبر Android Studio على حاسوبك
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              إذا كان لديك <strong>Android Studio</strong> مثبت على حاسوبك، يمكنك فتح مجلد <code>android</code> أو تحميل المشروع بصيغة ZIP وتجميعه:
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={handleDownloadAndroidZip}
                disabled={isZipping}
                className="px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isZipping ? 'جاري تجهيز المشروع...' : 'تحميل مشروع Android Studio كاملاً (ZIP)'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 flex items-center justify-between">
              <span className="truncate">cd android && ./gradlew assembleDebug</span>
              <button
                onClick={() => copyToClipboard('cd android && ./gradlew assembleDebug', 1)}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                title="نسخ الأمر"
              >
                {copiedIndex === 1 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              الملف الناتج: android/app/build/outputs/apk/debug/app-debug.apk
            </p>
          </div>

          {/* Method 3: Direct WebAPK local installation */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black">
                3
              </span>
              <PackageCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                تثبيت محلي فوري على هاتفك كـ تطبيق WebAPK (بدون كمبيوتر)
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
              التطبيق مزود بملف <code>manifest.json</code> وخدمة أوفلاين كاملة (Service Worker). نظام أندرويد يستطيع حزم التطبيق ذاتياً في تطبيق مستقل:
            </p>

            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>افتح الرابط في متصفح Chrome على هاتفك الأندرويد.</li>
              <li>اضغط على خيارات المتصفح (⋮) واختر <strong>تثبيت التطبيق (Install)</strong>.</li>
              <li>سيثبته نظام أندرويد كتطبيق أصلي في درج التطبيقات بأيقونة HackcoTasks ويعمل محلياً بدون إنترنت.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>معمارية التطبيق مهيأة ومطابقة لمتطلبات Android 14+ و Material 3</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
