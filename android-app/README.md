## android-app

**android-app** is an Android application designed to facilitate electronic assessment in an efficient and streamlined manner. It serves as the core component of the _Mobile Assessment and Annotation Tool (MAAT)_, where grading and feedback workflows are executed.

## Features

- User-Friendly Interface
- Clean and intuitive UI to support efficient marking and navigation between submissions.
- Annotate and edit PDF submissions directly within the app.

## Tech Stack

- IDE: Android Studio Iguana (2023.2.1)
- Language: Kotlin 2.0.0
- Build System: Gradle 8.7
- Android Gradle Plugin: 8.1.4

## Prerequisites

Before setting up the project, ensure you have:

- Android Studio Iguana (or newer)
- JDK 17 (recommended for AGP 8.x)
- Android SDK installed and configured
- An Android device or emulator (API level as required by the project)

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/JoshP279/mobile-assessment-and-annotation-tool.git
cd android-app
```

2. Open in Android Studio
3. Launch Android Studio
4. Select Open an Existing Project
5. Navigate to the android-app directory
6. Sync the project
7. Allow Gradle to sync dependencies automatically
8. If prompted, update local SDK components
9. Ensure local.properties points to your Android SDK:

`sdk.dir=/path/to/your/sdk`

9. Build the project

`./gradlew build`

10. If the project builds successfully, it is ready to run
