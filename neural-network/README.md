# Neural network

**neural-netowrk** is a deep learning-based module designed to classify marking symbols into three categories: **Ticks**, **Half-Ticks**, and **Neither**. It forms part of the broader _Mobile Assessment and Annotation Tool (MAAT)_ ecosystem by automating symbol recognition from annotated assessment documents.

## Features

- **Automated Symbol Classification**  
  Accurately distinguishes between ticks, half-ticks, and non-relevant symbols.

- **CNN-Based Architecture**  
  Utilizes a Convolutional Neural Network (CNN) for robust image feature extraction and classification.

- **PDF Processing Pipeline**  
  Extracts and processes symbols directly from PDF submissions.

## Tech Stack

- **Language:** Python
- **Frameworks/Libraries:** TensorFlow
- **Model Type:** Convolutional Neural Network (CNN)
- **Input Format:** PDF → Image preprocessing pipeline

## Prerequisites

Ensure the following are installed:

- Python 3.9+
- `pip` (Python package manager)
- Virtual environment tool (`venv` or `virtualenv`)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd neural-network
   ```
2. **Create a virtual environment**
   ```bash
   python -m venv .venv
   ```
3. **Activate the virtual environment**

   ```bash
   venv\Scripts\activate
   ```

4. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

# Usage

This script will automatically be executed by the _server_
