# web-app

**web-app** is a modern Angular-based web application that manages the administrative lifecycle of assessments within the Mobile Assessment and Annotation Tool ecosystem. It serves as both the entry and exit point for all assessment workflows, including submission ingestion and results publication.

## Features

- **Administrative Dashboard**  
  Provides an intuitive and structured interface for managing assessments.

- **Assessment Creation & Submission Ingestion**  
  Allows administrators to create new assessments by entering metadata and uploading a ZIP file containing student submissions. These are automatically parsed and registered in the system.

- **Results Publication**  
  Supports finalisation and publishing of marked results back to stakeholders.

- **Core Mobile Assessment and Annotation Tool Integration Point**  
  Acts as the primary orchestration interface for initiating and concluding all assessment processes.

- **User-Centric Design**  
  Built to streamline administrative workflows and reduce manual overhead in assessment management.

## Tech Stack

- **Framework:** Angular
- **Language:** TypeScript

## Prerequisites

Ensure you have the following installed:

- Node.js (v18+ recommended)
- npm
- Angular CLI

Install Angular CLI globally if needed:

```bash
npm install -g @angular/cli
```

## Setup instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd web-app
   ```

2. **Install Angular CLI globally (if needed)**

   ```bash
     npm install -g @angular/cli
   ```

3. **Install dependencies**

   ```bash
     npm install --force
   ```

4. Run the development server

   ```bash
     ng serve
   ```

5. Access the application
   - Open your browser and navigate to:
     - http://localhost:4200

## Notes

- ZIP ingestion assumes a predefined internal structure for submissions; changes to format may require backend/server updates.
- This frontend is tightly coupled with **server** for API communication.
- Authentication and role management are typically handled via backend integration.
