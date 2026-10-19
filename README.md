# AutoTrack — Automotive Production Monitoring System

## Overview

AutoTrack is a web-based application designed to help monitor automotive production activities through a centralized interface.

## Features

- Production monitoring dashboard
- Frontend and backend integration
- MySQL database integration
- Authentication and role-based access, if implemented
- Organized API communication

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** MySQL
- **Version Control:** Git and GitHub

## Project Structure

```text
AutoTrack/
├── frontend/
├── backend/
├── database/
├── docs/
├── README.md
└── .gitignore
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/monishaadhi/AutoTrack.git
cd AutoTrack
```

### 2. Install dependencies

Install dependencies separately in the frontend and backend directories:

```bash
cd frontend
npm install
```

In a separate terminal:

```bash
cd ~/Desktop/AutoTrack/backend
npm install
```

### 3. Configure the environment

Create the necessary local environment files using your project's required variable names. Configure your MySQL connection and other required settings. Never commit real passwords, tokens, or API keys.

### 4. Start the application

Use the development scripts defined in each directory's `package.json`. Start the MySQL database before running database-dependent backend features.

## Development Status

AutoTrack is under active development. Setup instructions and features may evolve as development progresses.

## GitHub Repository

https://github.com/monishaadhi/AutoTrack