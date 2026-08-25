# CrossSync — Comprehensive Native Compilation & Download Guide 🚀

This document provides step-by-step instructions to compile, package, install, and run **CrossSync** natively on your **Windows Laptop** (`.exe` / `.msi`) and your **Android Phone** (`.apk`).

---

## 💻 Part 1: Windows Laptop Native App (.exe / .msi)

CrossSync's Windows desktop app is engineered using **Tauri v2 + Rust** with low-overhead Win32 clipboard hooks and native Bluetooth radio management.

### Prerequisites
1. **Node.js (v18+) & npm / bun**: Download from [nodejs.org](https://nodejs.org/).
2. **Rust Toolchain**:
   - Install Rust via [rustup.rs](https://rustup.rs/):
     ```bash
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
     ```
   - On Windows, ensure **C++ Build Tools** (via Visual Studio Installer) are installed.
3. **WebView2**: Pre-installed on Windows 10/11.

---

### Step-by-Step Build Commands for Windows

1. **Export or Clone the Project** to your laptop:
   - In Google AI Studio, click the top-right menu > **Export as ZIP** (or push to GitHub).
   - Extract the ZIP on your laptop.

2. **Navigate into the desktop directory**:
   ```bash
   cd desktop
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run in Live Development Mode**:
   ```bash
   npm run tauri dev
   ```
   *This launches the native Windows window with hot-reload, native system tray minimization, and Win32 clipboard monitoring.*

5. **Build the Standalone Windows Installer (`.exe` / `.msi`)**:
   ```bash
   npm run tauri build
   ```

6. **Locate and Install**:
   Once compiled, find your ready-to-run binaries in:
   - **MSI Installer**: `desktop/src-tauri/target/release/bundle/msi/CrossSync_1.0.0_x64_en-US.msi`
   - **NSIS / EXE Setup**: `desktop/src-tauri/target/release/bundle/nsis/CrossSync_1.0.0_x64-setup.exe`
   - **Standalone Executable**: `desktop/src-tauri/target/release/crosssync-desktop.exe`

   Double-click the `.msi` or `.exe` to install CrossSync into your Windows `Program Files` and Start Menu.

---

## 📱 Part 2: Android Mobile Native App (.apk)

CrossSync's Android companion is built with **Flutter**, featuring low-power background foreground services, Bluetooth RFCOMM streams, and SQLite history.

### Prerequisites
1. **Flutter SDK (v3.0+)**:
   - Download and install Flutter from [flutter.dev](https://docs.flutter.dev/get-started/install).
   - Verify installation:
     ```bash
     flutter doctor
     ```
2. **Android Studio & Android SDK**:
   - Install [Android Studio](https://developer.android.com/studio).
   - Open SDK Manager and install **Android SDK Build-Tools (API 34 or 35)** and **Android SDK Command-line Tools**.
3. **Java JDK 17+**: OpenJDK 17 or Oracle JDK.

---

### Step-by-Step Build Commands for Android APK

1. **Navigate to the mobile directory**:
   ```bash
   cd mobile
   ```

2. **Fetch Flutter Dependencies**:
   ```bash
   flutter pub get
   ```

3. **Enable Developer Options on your Android Phone**:
   - Go to phone **Settings** > **About Phone** > Tap **Build Number** 7 times to enable Developer Mode.
   - Go to **Settings** > **Developer Options** > Enable **USB Debugging** and **Install via USB**.

4. **Compile the Release APK**:
   ```bash
   flutter build apk --release
   ```
   *(Optional: For smaller per-device CPU packages, run `flutter build apk --split-per-abi`)*

5. **Locate the Output APK**:
   The generated `.apk` file will be at:
   ```
   mobile/build/app/outputs/flutter-apk/app-release.apk
   ```

6. **Install on Phone**:
   - **Method A (Direct USB install via ADB)**:
     ```bash
     flutter install
     # or
     adb install mobile/build/app/outputs/flutter-apk/app-release.apk
     ```
   - **Method B (Direct File Transfer)**:
     - Transfer `app-release.apk` to your phone via USB cable, Google Drive, or email.
     - Open the Files app on your phone, tap `app-release.apk`, and tap **Install** (allow "Install from Unknown Sources" if prompted).

---

## 🔄 Part 3: Connecting Your Laptop and Mobile

Once both apps are installed:
1. **Open CrossSync on your Windows Laptop**.
2. **Open CrossSync on your Android Phone**.
3. On Windows, click **"Pair Mobile Phone"** to display the high-entropy ECDH P-256 pairing QR code.
4. On your Android phone, tap **"Scan QR Code"** and point your camera at your laptop screen.
5. The devices will authenticate, establish an end-to-end encrypted AES-256-GCM RFCOMM session, and immediately begin syncing clipboards and file streams in real time!
