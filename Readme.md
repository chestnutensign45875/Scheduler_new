🎓 Smart Campus Scheduler

A high-performance, hybrid desktop application for managing school/college timetables, attendance, and waitlists. Built with a modern Electron frontend, a flexible Python middleware, and a lightning-fast C optimization engine.

✨ Key Features

Hybrid Architecture: Combines the UI of Web Technologies with the raw speed of C for algorithm processing.

Role-Based Access: Distinct dashboards for Teachers (Booking/Management) and Students (View/Stats).

Smart Scheduling: * Book slots for Theory or Lab sessions.

Add specific instructions for students (e.g., "Bring Lab Coat").

Waitlist System: If a slot is full, teachers join a waitlist. If the current holder cancels, the C engine automatically promotes the next in line.

Time-Aware Logic: Prevents booking or cancelling slots that have already passed.

Day Management: View and book schedules for "Today" and "Tomorrow". Auto-resets schedules at midnight.

Attendance System: Built-in digital roll call for teachers and attendance statistics for students.

Leaderboard: Gamified student rankings based on attendance and academic scores.

Modern UI: Dark/Light mode toggle, responsive grid layout, and toast notifications.

🛠️ Tech Stack

Frontend: Electron.js, HTML5, CSS3 (Glassmorphism/Modern UI), JavaScript.

Middleware: Python 3 (uses ctypes to bridge data).

Core Logic: C (Compiled Shared Library .so/.dll for high-speed Waitlist processing).

Storage: LocalStorage (Persistent data across sessions).

🚀 Getting Started

Prerequisites

Node.js & npm

Python 3.x

GCC Compiler (MinGW for Windows, standard GCC for Linux/Mac)

1. Clone & Install

git clone [https://github.com/yourusername/smart-campus-scheduler.git](https://github.com/yourusername/smart-campus-scheduler.git)
cd smart-campus-scheduler
npm install


2. Compile the C Engine

You must compile the C core into a shared library before running the app.

For Windows (Git Bash or Command Prompt):

gcc -shared -o scheduler_core.dll scheduler_core.c


For Linux / macOS:

gcc -shared -o scheduler_core.so -fPIC scheduler_core.c


3. Run the App

npm start


🔐 Default Login Credentials

Teachers

ID: T101 to T105

Password: teach123

Students

ID: S201 to S205

Password: learn123

📦 Building for Production

To create a native installer (.exe, .dmg, .AppImage):

Install Build Tools:

pip install pyinstaller
npm install electron-builder --save-dev


Run Build Script:

npm run dist


Note: For Windows .exe, it is highly recommended to run the build command on a Windows machine to ensure the C .dll and Python .exe are compatible.

📂 Project Structure

school-scheduler/
├── main.js                # Electron Main Process
├── preload.js             # Secure Bridge (IPC)
├── index.html             # Frontend UI & Logic
├── scheduler_core.c       # C Optimization Logic (Waitlist)
├── scheduler_bridge.py    # Python Middleware
├── package.json           # Config & Build Scripts
└── dist/                  # Output folder for built apps


🤝 Contributing

Fork the repository.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📜 License

Distributed under the MIT License. See LICENSE for more information.
