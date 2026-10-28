import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { 
  X, 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  FileCode2, 
  ExternalLink, 
  Sparkles, 
  FolderArchive,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ANDROID_MAIN_ACTIVITY = `package com.dukan.udharikhata

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.input.KeyboardType
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.text.NumberFormat
import java.util.Locale

data class Customer(
    val id: String = "",
    val name: String = "",
    val phone: String = "",
    val balance: Long = 0L
)

class MainActivity : ComponentActivity() {
    private val auth by lazy { FirebaseAuth.getInstance() }
    private val db by lazy { FirebaseFirestore.getInstance() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        FirebaseApp.initializeApp(this)
        setContent { MaterialTheme { AppScreen() } }
    }

    @Composable
    private fun AppScreen() {
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        var loggedIn by remember { mutableStateOf(auth.currentUser != null) }
        var error by remember { mutableStateOf("") }

        if (!loggedIn) {
            Column(
                Modifier.fillMaxSize().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Udhari Khata", style = MaterialTheme.typography.headlineMedium)
                OutlinedTextField(email, { email = it }, label = { Text("Email") })
                OutlinedTextField(password, { password = it }, label = { Text("Password") })
                Button(onClick = {
                    auth.signInWithEmailAndPassword(email.trim(), password)
                        .addOnSuccessListener {
                            loggedIn = true
                            error = ""
                        }.addOnFailureListener {
                            error = it.localizedMessage ?: "Login nahi hua"
                        }
                }) { Text("Login") }
                OutlinedButton(onClick = {
                    auth.createUserWithEmailAndPassword(email.trim(), password)
                        .addOnSuccessListener {
                            loggedIn = true
                            error = ""
                        }.addOnFailureListener {
                            error = it.localizedMessage ?: "Account nahi bana"
                        }
                }) { Text("Naya account banayein") }
                if (error.isNotEmpty()) {
                    Text(error, color = MaterialTheme.colorScheme.error)
                }
            }
        } else {
            Ledger(
                db = db,
                uid = auth.currentUser!!.uid,
                onLogout = {
                    auth.signOut()
                    loggedIn = false
                },
                openWhatsApp = { phone, message ->
                    val digits = phone.filter { it.isDigit() }
                    val url = if (digits.isBlank()) {
                        "https://wa.me/?text=" + Uri.encode(message)
                    } else {
                        "https://wa.me/$digits?text=" + Uri.encode(message)
                    }
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                },
                openUpi = { uri ->
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(uri)))
                }
            )
        }
    }
}

private fun rupees(amount: Long): String =
    NumberFormat.getCurrencyInstance(Locale("en", "IN")).format(amount)

@Composable
private fun Ledger(
    db: FirebaseFirestore,
    uid: String,
    onLogout: () -> Unit,
    openWhatsApp: (String, String) -> Unit,
    openUpi: (String) -> Unit
) {
    var customers by remember { mutableStateOf(listOf<Customer>()) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var upi by remember { mutableStateOf("") }
    var shop by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf<Customer?>(null) }
    var status by remember { mutableStateOf("") }

    val customerRef = remember(uid) {
        db.collection("users").document(uid).collection("customers")
    }
    val settingsRef = remember(uid) {
        db.collection("users").document(uid).collection("settings").document("shop")
    }

    DisposableEffect(uid) {
        val registration: ListenerRegistration =
            customerRef.addSnapshotListener { snapshot, e ->
                if (e != null) {
                    status = "Cloud error: \${e.localizedMessage}"
                } else if (snapshot != null) {
                    customers = snapshot.documents.mapNotNull { d ->
                        val n = d.getString("name") ?: return@mapNotNull null
                        Customer(
                            id = d.id,
                            name = n,
                            phone = d.getString("phone") ?: "",
                            balance = d.getLong("balance") ?: 0L
                        )
                    }
                }
            }

        val settingsListener = settingsRef.addSnapshotListener { doc, _ ->
            if (doc != null && doc.exists()) {
                upi = doc.getString("upi") ?: ""
                shop = doc.getString("shop") ?: ""
            }
        }
        onDispose {
            registration.remove()
            settingsListener.remove()
        }
    }

    val total = customers.sumOf { it.balance }

    LazyColumn(
        Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Text("📒 Udhari Khata", style = MaterialTheme.typography.headlineMedium)
            Text("Kul baaki: \${rupees(total)}")
            Text("Grahak: \${customers.size}")
            if (status.isNotEmpty()) {
                Text(status, color = MaterialTheme.colorScheme.primary)
            }
            OutlinedButton(onClick = onLogout) { Text("Logout") }
        }

        item {
            HorizontalDivider()
            Text("Dukaan aur UPI setting", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(shop, { shop = it }, label = { Text("Dukaan ka naam") })
            OutlinedTextField(upi, { upi = it }, label = { Text("UPI ID") })
            Button(onClick = {
                settingsRef.set(mapOf("shop" to shop, "upi" to upi))
                    .addOnSuccessListener { status = "Settings saved" }
                    .addOnFailureListener { status = it.localizedMessage ?: "Save failed" }
            }) { Text("Settings save karein") }
        }

        item {
            HorizontalDivider()
            Text("Naya grahak / udhari", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(name, { name = it }, label = { Text("Naam") })
            OutlinedTextField(phone, { phone = it }, label = { Text("WhatsApp number, country code ke saath") })
            OutlinedTextField(amount, { amount = it }, label = { Text("Udhari ₹") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            Button(onClick = {
                val n = name.trim()
                val p = phone.trim()
                val a = amount.toLongOrNull()
                if (n.isBlank() || a == null || a <= 0) {
                    status = "Naam aur sahi rakam bharein"
                } else {
                    customerRef.add(mapOf(
                        "name" to n,
                        "phone" to p,
                        "balance" to a,
                        "createdAt" to System.currentTimeMillis()
                    )).addOnSuccessListener {
                        name = ""; phone = ""; amount = ""
                        status = "Grahak save ho gaya"
                    }.addOnFailureListener {
                        status = it.localizedMessage ?: "Save failed"
                    }
                }
            }) { Text("Udhari save karein") }
        }

        items(customers, key = { it.id }) { c ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(c.name, style = MaterialTheme.typography.titleMedium)
                    Text("Mobile: \${c.phone}")
                    Text("Baaki: \${rupees(c.balance)}")

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { selected = c }) { Text("QR / Payment") }
                        OutlinedButton(onClick = {
                            val msg = "Namaste \${c.name}, aapki udhari \${rupees(c.balance)} baaki hai. UPI ID: \$upi. Dhanyavaad!"
                            openWhatsApp(c.phone, msg)
                        }) { Text("WhatsApp") }
                    }

                    OutlinedButton(onClick = {
                        val raw = amount.toLongOrNull()
                        if (raw == null || raw <= 0 || raw > c.balance) {
                            status = "Pehle upar rakam bharein; jama rakam baaki se zyada nahi ho sakti"
                        } else {
                            status = "Jama rakam confirm karein"
                            selected = c.copy(id = c.id, balance = c.balance)
                            amount = raw.toString()
                        }
                    }) { Text("Jama entry ke liye select karein") }

                    if (selected?.id == c.id) {
                        Text("Jama rakam: ₹\${amount}")
                        Button(onClick = {
                            val paid = amount.toLongOrNull()
                            if (paid == null || paid <= 0 || paid > c.balance) {
                                status = "Jama rakam sahi nahi hai"
                            } else {
                                AlertDialog(
                                    onDismissRequest = {},
                                    title = { Text("Payment verify karein") },
                                    text = { Text("Apne bank/UPI app mein receipt verify karne ke baad hi confirm karein.") },
                                    confirmButton = {
                                        TextButton(onClick = {
                                            customerRef.document(c.id)
                                                .update("balance", c.balance - paid)
                                                .addOnSuccessListener {
                                                    status = "Jama rakam record hui"
                                                    amount = ""
                                                    selected = null
                                                }
                                        }) { Text("Verified, confirm") }
                                    },
                                    dismissButton = {
                                        TextButton(onClick = { selected = null }) { Text("Cancel") }
                                    }
                                )
                            }
                        }) { Text("Verified payment record karein") }
                    }
                }
            }
        }
    }

    selected?.let { c ->
        if (c.balance > 0 && upi.contains("@")) {
            AlertDialog(
                onDismissRequest = { selected = null },
                title = { Text("UPI Payment") },
                text = {
                    Column {
                        Text("Grahak: \${c.name}")
                        Text("Baaki: \${rupees(c.balance)}")
                        Text("UPI ID: \$upi")
                        val uri = remember(c.id, upi, shop) {
                            Uri.Builder().scheme("upi").authority("pay")
                                .appendQueryParameter("pa", upi)
                                .appendQueryParameter("pn", shop.ifBlank { "Dukaan" })
                                .appendQueryParameter("cu", "INR")
                                .build().toString()
                        }
                        val bitmap = remember(uri) { qrBitmap(uri) }
                        if (bitmap != null) {
                            Image(bitmap.asImageBitmap(), null,
                                Modifier.fillMaxWidth().height(220.dp))
                        }
                        Text("QR mein amount fix nahi hai. Grahak apni rakam bhar sakta hai.")
                        Button(onClick = { openUpi(uri) }) { Text("UPI app kholein") }
                    }
                },
                confirmButton = { TextButton(onClick = { selected = null }) { Text("Band karein") } }
            )
        }
    }
}

private fun qrBitmap(value: String): Bitmap? = try {
    val matrix = QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 500, 500)
    Bitmap.createBitmap(500, 500, Bitmap.Config.RGB_565).also { bmp ->
        for (x in 0 until 500) {
            for (y in 0 until 500) {
                bmp.setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
            }
        }
    }
} catch (_: Exception) {
    null
}`;

const ANDROID_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.dukan.udharikhata">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Queries for WhatsApp & UPI apps -->
    <queries>
        <package android:name="com.whatsapp" />
        <package android:name="com.whatsapp.w4b" />
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="upi" />
        </intent>
    </queries>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Udhari Khata"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.UdhariKhata">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.UdhariKhata">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`;

const ANDROID_BUILD_GRADLE = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.google.gms.google.services)
}

android {
    namespace = "com.dukan.udharikhata"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.dukan.udharikhata"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.1"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2023.08.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")

    // Firebase Firestore & Auth
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")

    // ZXing for UPI QR Code Generation
    implementation("com.google.zxing:core:3.5.2")
}`;

const ANDROID_SETTINGS_GRADLE = `pluginManagement {
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

rootProject.name = "UdhariKhata"
include(":app")`;

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'studio'>('pwa');
  const [selectedFile, setSelectedFile] = useState<'main' | 'manifest' | 'gradle' | 'settings'>('main');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  const { isInstallable, install, isIOS, isInstalled } = usePWAInstall();

  // Generate QR code pointing to current app URL so user can scan with Android phone
  useEffect(() => {
    if (!isOpen) return;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#0f3e2e', light: '#ffffff' },
      }).then(url => setQrUrl(url));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCode =
    selectedFile === 'main'
      ? ANDROID_MAIN_ACTIVITY
      : selectedFile === 'manifest'
      ? ANDROID_MANIFEST
      : selectedFile === 'gradle'
      ? ANDROID_BUILD_GRADLE
      : ANDROID_SETTINGS_GRADLE;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadProjectZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Root files
      zip.file('settings.gradle.kts', ANDROID_SETTINGS_GRADLE);
      zip.file(
        'build.gradle.kts',
        `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.google.gms.google.services) apply false
}`
      );
      zip.file(
        'README.md',
        `# Udhari Khata Android App

## How to build APK:
1. Open Android Studio -> Open this folder.
2. Connect your Firebase project (add google-services.json to app/ folder).
3. Click Menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Android Studio will generate your **app-debug.apk** in \`app/build/outputs/apk/debug/\`!
5. Transfer \`app-debug.apk\` to your phone or send it via WhatsApp to install!`
      );

      // App module
      const app = zip.folder('app');
      app?.file('build.gradle.kts', ANDROID_BUILD_GRADLE);
      
      const main = app?.folder('src')?.folder('main');
      main?.file('AndroidManifest.xml', ANDROID_MANIFEST);

      const javaPkg = main?.folder('java')?.folder('com')?.folder('dukan')?.folder('udharikhata');
      javaPkg?.file('MainActivity.kt', ANDROID_MAIN_ACTIVITY);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'UdhariKhata-Android-Source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create zip', e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F3E2E] via-[#14532D] to-[#0A261D] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">Android App (.APK) & Installation</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Android Ready
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Install directly on your phone or build the native APK in 1 minute
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pwa'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Install on Android Phone (Direct WebAPK)</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'studio'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-emerald-700" />
            <span>Build .APK File (Android Studio Project)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'pwa' ? (
            <div className="space-y-6">
              
              {/* Recommendation Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-amber-50/50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">
                    Khabar dar: APK file ki zaroorat ke bina phone me install karein!
                  </h4>
                  <p className="text-xs text-emerald-900/80 mt-1 leading-relaxed">
                    Modern Android phones me Google Chrome is app ko automatically <strong>WebAPK</strong> bana kar install kar deta hai. Isse aapke phone ke app drawer aur home screen par ek dam native app jaisa icon ban jata hai aur bina address bar ke full screen chalta hai.
                  </p>
                </div>
              </div>

              {/* Install Action Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                
                {/* Phone QR Scan */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-gray-700 mb-2">
                    1. Phone camera se Scan karein
                  </span>
                  {qrUrl ? (
                    <img src={qrUrl} alt="App URL QR Code" className="w-40 h-40 rounded-xl border border-gray-200 bg-white p-2 shadow-xs" />
                  ) : (
                    <div className="w-40 h-40 bg-gray-200 rounded-xl animate-pulse" />
                  )}
                  <span className="text-[11px] text-gray-500 mt-2">
                    Apne Android phone ke browser (Chrome) me open hoga
                  </span>
                </div>

                {/* Direct Button & Steps */}
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
                    <span className="text-xs font-bold text-gray-800 block mb-1">
                      2. Screen par 'Install' tap karein
                    </span>
                    <p className="text-xs text-gray-600 mb-3">
                      Agar aap is page ko Android Chrome me dekh rahe hain, to niche diye button par click karein:
                    </p>

                    {isInstalled ? (
                      <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>App already aapke device me installed hai!</span>
                      </div>
                    ) : isInstallable ? (
                      <button
                        onClick={install}
                        className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Abhi Install Karein (One-Click)</span>
                      </button>
                    ) : (
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        Chrome ke <strong className="text-gray-800">3-Dots (⋮) Menu</strong> par tap karke <strong className="text-emerald-800">'Install App'</strong> ya <strong className="text-emerald-800">'Add to Home Screen'</strong> chunein.
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-[11px] text-amber-900">
                    💡 <strong>Fayde:</strong> Zero download size, offline functioning, instant automatic updates, aur WhatsApp / UPI links ekdam smoothly kaam karte hain.
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Studio Instructions */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">
                      Android Studio me 30-Second me .APK compile karein:
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sabhi files already pre-configured hain. Zip download karke Android Studio me open karein.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadProjectZip}
                    disabled={isZipping}
                    className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isZipping ? 'Creating zip...' : 'Download Project (.ZIP)'}</span>
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-700 font-medium bg-white p-3 rounded-xl border border-gray-200/80">
                  <li>Niche diye hue button se <strong>UdhariKhata-Android-Source.zip</strong> download karke extract karein.</li>
                  <li><strong>Android Studio</strong> open karein aur <em>'Open an existing project'</em> me jakar ye folder select karein.</li>
                  <li>Android Studio ke top menu me jayein: <strong className="text-emerald-800">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
                  <li>Khatam! Android Studio <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-emerald-900 font-mono">app-debug.apk</code> file de dega jise aap kisi bhi phone me install kar sakte hain!</li>
                </ol>
              </div>

              {/* Code viewer tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1">
                    {[
                      { key: 'main', label: 'MainActivity.kt' },
                      { key: 'manifest', label: 'AndroidManifest.xml' },
                      { key: 'gradle', label: 'app/build.gradle.kts' },
                      { key: 'settings', label: 'settings.gradle.kts' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setSelectedFile(tab.key as any)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          selectedFile === tab.key
                            ? 'bg-emerald-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy File</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-gray-900 text-gray-100 p-4 rounded-2xl text-xs font-mono max-h-64 overflow-y-auto leading-relaxed border border-gray-800">
                  <pre className="whitespace-pre-wrap">{currentCode}</pre>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>Kisi bhi query ya help ke liye support ready hai</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Band karein (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
