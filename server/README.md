# server

**server** is a TypeScript-based backend service that facilitates communication between all _Mobile Assesssment and Annotation Tool (MAAT)_ system components: **web-app**, **android-app**, and **neural-network**. It acts as the central coordination layer, enabling data exchange, orchestration, and persistence across the platform.

## Features

- **Centralized Communication**  
  Manages and coordinates data flow between all components.

- **RESTful API**  
  Exposes structured endpoints for integration with frontend and processing modules.

- **SQLite Database Integration**  
  Lightweight relational database used for storing submissions, metadata, and processing results.

- **Scalable Architecture**  
  Designed to support concurrent requests and asynchronous processing workflows.

- **Modular Design**  
  Clean separation of concerns to support maintainability and future extension.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** SQLite

## Prerequisites

Ensure you have the following installed:

- Node.js (v18+ recommended)
- npm or yarn
- SQLite (if managing DB manually)

## Setup Instructions

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd server
    ```

2. **Install dependencies**

    ```bash
    npm install --force
    ```

3. **Build the server**

    ```bash
    tsc
    ```

4. **Run the server**
    ```bash
    npm run start
    ```

## Please note

SQLite is used for simplicity and portability as per the scope of this academic project, consider migrating to a more robust database (e.g. PostgreSQL) for production-scale deployments.
