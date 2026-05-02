# Mobile Assessment and Annotation Tool (MAAT)

The **Mobile Assessment and Annotation Tool (MAAT)** is an integrated, multi-component system designed to support the end-to-end assessment workflow at **Nelson Mandela University**. It was developed as part of an Honours postgraduate research project and is intended for academic and experimental use.

The system streamlines the lifecycle of student assessments, from submission ingestion through marking, automated analysis, and results publication.

---

## System Overview

MAAT is composed of four major components, each responsible for a distinct part of the assessment pipeline:

### 1. Android Application (`android-app`)

A native Android application used for viewing and marking student submissions.

- Supports direct annotation of PDF submissions
- Provides an intuitive marking interface for assessors
- Automatically uploads marked submissions upon completion

---

### 2. Neural Network Module (`neural-network`)

A Python-based machine learning component responsible for automated symbol recognition and classification.

- Classifies marking symbols (e.g., ticks, half-ticks)
- Supports automated marking assistance
- Processes extracted data from submissions

---

### 3. Backend Server (`server`)

A TypeScript-based REST API service that acts as the central communication hub for the system.

- Coordinates communication between all MAAT components
- Manages data persistence using SQLite
- Exposes RESTful endpoints for integration
- Handles submission and result workflows

---

### 4. Web Application (`web-app`)

An Angular-based administrative frontend used to manage assessments.

- Create and configure assessments
- Upload and process submission batches (ZIP format)
- Monitor and publish results
- Serves as the primary administrative interface

---

## Architecture Summary

MAAT follows a modular client–server architecture:

- **Frontend (web-app)** → Administrative control and orchestration
- **Mobile App (android-app)** → Manual marking and annotation
- **ML Module (neural-network)** → Automated symbol recognition and classification
- **Server (server)** → Central API + database layer

---

## Documentation

For detailed setup instructions and component-specific documentation, refer to the respective repositories:

- `android-app`
- `neural-network`
- `server`
- `web-app`

---

## Academic Context

This project forms part of an Honours-level postgraduate research submission at **Nelson Mandela University** and is intended for academic demonstration purposes.

---

## Treatise

The accompanying research document can be found at the root of this repository:

- `JPage.pdf`
