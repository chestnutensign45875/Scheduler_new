// --- USER DATABASE ---
const users = [
    { id: 'T101', pass: 'teach123', name: 'Sarah Johnson', role: 'teacher' },
    { id: 'T102', pass: 'teach123', name: 'Michael Chen', role: 'teacher' },
    { id: 'T103', pass: 'teach123', name: 'Emily Davis', role: 'teacher' },
    { id: 'T104', pass: 'teach123', name: 'Robert Wilson', role: 'teacher' },
    { id: 'T105', pass: 'teach123', name: 'Linda Martinez', role: 'teacher' },
    { id: 'S201', pass: 'learn123', name: 'Ayush Sharma', role: 'student' },
    { id: 'S202', pass: 'learn123', name: 'Nalin Sharma', role: 'student' },
    { id: 'S203', pass: 'learn123', name: 'Pulak Sharma', role: 'student' },
    { id: 'S204', pass: 'learn123', name: 'Swarup Jain', role: 'student' },
    { id: 'S205', pass: 'learn123', name: 'Palak Singhal', role: 'student' }
];

// --- DATA MODEL ---
let currentUser = null;
let viewingDay = 'today'; 
let activeSlotId = null;  
let currentActionType = ''; 

let scheduleData = { today: [], tomorrow: [] };
let waitlistData = { today: [], tomorrow: [] };
let attendanceStats = {};

// --- EXPOSE FUNCTIONS TO WINDOW ---
// This allows HTML onclick="window.app.functionName()" to work
window.app = {
    attemptLogin,
    logout,
    switchView,
    switchDay,
    toggleTheme,
    openBookingModal,
    closeModal,
    confirmBooking,
    cancelSlot,
    joinWaitlist,
    submitAttendance,
    showToast
};

function getFreshSlots() {
    return [
        { id: 0, time: "09:00 AM", bookedBy: null, type: "Theory", instructions: "" },
        { id: 1, time: "10:00 AM", bookedBy: null, type: "Theory", instructions: "" },
        { id: 2, time: "11:00 AM", bookedBy: null, type: "Theory", instructions: "" },
        { id: 3, time: "12:00 PM", bookedBy: null, type: "Theory", instructions: "" },
        { id: 4, time: "01:00 PM", bookedBy: null, type: "Theory", instructions: "" },
        { id: 5, time: "02:00 PM", bookedBy: null, type: "Theory", instructions: "" },
        { id: 6, time: "03:00 PM", bookedBy: null, type: "Theory", instructions: "" }
    ];
}

// --- TIME & EXPIRE LOGIC ---
function isSlotExpired(timeStr) {
    if (viewingDay === 'tomorrow') return false;
    const now = new Date();
    const slotDate = new Date(); 
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (hours !== 12 && modifier === 'PM') hours += 12;
    slotDate.setHours(hours, parseInt(minutes), 0, 0);
    return now > slotDate;
}

// --- INIT & STORAGE ---
function init() {
    loadData();
    initTheme();
    users.filter(u => u.role === 'student').forEach(s => {
        if(!attendanceStats[s.id]) attendanceStats[s.id] = { total: 0, present: 0, name: s.name };
    });
    saveData();
    renderLeaderboard();
    
    // Attach event listener to login button
    document.getElementById('login-btn').addEventListener('click', attemptLogin);
}

function loadData() {
    const storedData = localStorage.getItem('scheduler_data_v3');
    const todayStr = new Date().toDateString();

    if (storedData) {
        const parsed = JSON.parse(storedData);
        
        if (parsed.lastDate && parsed.lastDate !== todayStr) {
            scheduleData.today = parsed.scheduleData.tomorrow || getFreshSlots();
            scheduleData.tomorrow = getFreshSlots();
            waitlistData.today = parsed.waitlistData.tomorrow || [];
            waitlistData.tomorrow = [];
            attendanceStats = parsed.attendanceStats || {};
            setTimeout(() => showToast("New Day: Schedule Advanced", "reset"), 1000);
        } else {
            scheduleData = parsed.scheduleData || { today: getFreshSlots(), tomorrow: getFreshSlots() };
            waitlistData = parsed.waitlistData || { today: [], tomorrow: [] };
            attendanceStats = parsed.attendanceStats || {};
        }
    } else {
        scheduleData = { today: getFreshSlots(), tomorrow: getFreshSlots() };
        waitlistData = { today: [], tomorrow: [] };
        attendanceStats = {};
    }
    saveData();
}

function saveData() {
    const data = { scheduleData, waitlistData, attendanceStats, lastDate: new Date().toDateString() };
    localStorage.setItem('scheduler_data_v3', JSON.stringify(data));
}

// --- DAY SWITCHING ---
function switchDay(day) {
    viewingDay = day;
    document.getElementById('btn-today').className = day === 'today' ? 'day-btn active' : 'day-btn';
    document.getElementById('btn-tomorrow').className = day === 'tomorrow' ? 'day-btn active' : 'day-btn';
    renderSlots();
}

// --- RENDER SLOTS ---
function renderSlots() {
    const grid = document.getElementById('slots-grid');
    grid.innerHTML = '';
    const currentSlots = scheduleData[viewingDay];

    currentSlots.forEach(slot => {
        const card = document.createElement('div');
        const expired = isSlotExpired(slot.time);
        card.className = `slot-card ${expired ? 'expired' : ''}`;
        
        let bookerUser = users.find(u => u.id === slot.bookedBy);
        let bookerName = bookerUser ? bookerUser.name : '';
        let instructionHtml = slot.bookedBy && slot.instructions ? `<div class="slot-note"><i class="fa-solid fa-circle-info"></i> ${slot.instructions}</div>` : '';

        let barColor = 'var(--avail)'; 
        let statusText = 'Available';
        let textColor = 'var(--avail)';
        
        if (expired) {
            barColor = 'var(--expired)'; statusText = 'Period Over'; textColor = 'var(--text-secondary)';
        } else if (slot.bookedBy) {
            if (currentUser.role === 'teacher' && slot.bookedBy === currentUser.id) {
                barColor = 'var(--yours)'; statusText = 'Booked by You'; textColor = 'var(--yours)';
            } else {
                barColor = 'var(--booked)'; statusText = 'Occupied'; textColor = 'var(--booked)';
            }
        }

        let btnHtml = '';
        if (expired) {
            btnHtml = `<div style="color:var(--text-secondary); font-style:italic; margin-top:auto;"><i class="fa-solid fa-lock"></i> Time Locked</div>`;
        } else if (currentUser.role === 'teacher') {
            if (!slot.bookedBy) btnHtml = `<button class="btn btn-primary" onclick="window.app.openBookingModal(${slot.id}, 'book')">Book Slot</button>`;
            else if (slot.bookedBy === currentUser.id) btnHtml = `<button class="btn" style="background:var(--booked);" onclick="window.app.cancelSlot(${slot.id})">Cancel</button>`;
            else btnHtml = `<button class="btn" style="background:var(--text-secondary);" onclick="window.app.openBookingModal(${slot.id}, 'waitlist')">Waitlist</button>`;
        } else {
            if (slot.bookedBy) btnHtml = `<div style="color:var(--primary); font-weight:600; margin-top:auto;">Scheduled</div>`;
            else btnHtml = `<div style="color:var(--text-secondary); margin-top:auto; font-style:italic;">Free Period</div>`;
        }

        card.innerHTML = `
            <div class="status-bar" style="background:${barColor}"></div>
            <div class="slot-time">${slot.time}</div>
            <div class="slot-status-text" style="color:${textColor}">${statusText}</div>
            <div class="slot-details">
                ${slot.bookedBy ? `<strong>${bookerName}</strong><br>${slot.type}` : (expired ? 'Past Class' : 'Open for booking')}
                ${instructionHtml}
            </div>
            ${btnHtml}
        `;
        grid.appendChild(card);
    });
}

// --- MODAL & BOOKING LOGIC ---
function openBookingModal(id, action) {
    const slotsList = scheduleData[viewingDay];
    if (isSlotExpired(slotsList.find(s=>s.id===id).time)) return showToast("Time slot has passed.", "error");
    
    activeSlotId = id;
    currentActionType = action;
    document.getElementById('booking-instructions').value = ''; 
    document.getElementById('booking-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('booking-modal').style.display = 'none';
    activeSlotId = null;
}

function confirmBooking() {
    const slotsList = scheduleData[viewingDay];
    const slot = slotsList.find(s => s.id === activeSlotId);
    const instructions = document.getElementById('booking-instructions').value;
    const type = document.querySelector('input[name="classType"]:checked').value;

    if (currentActionType === 'book') {
        slot.bookedBy = currentUser.id;
        slot.type = type;
        slot.instructions = instructions;
        showToast(`Booked for ${viewingDay === 'today' ? 'Today' : 'Tomorrow'}`, "success");
    } else {
        waitlistData[viewingDay].push({ 
            teacherId: currentUser.id, 
            slotId: activeSlotId, 
            type: type, 
            instructions: instructions 
        });
        showToast("Added to Waitlist", "info");
    }

    saveData();
    renderSlots();
    closeModal();
}

function joinWaitlist(id) {
    // Placeholder if not using modal, but we are using modal now
    openBookingModal(id, 'waitlist');
}

async function cancelSlot(id) {
    const slotsList = scheduleData[viewingDay];
    if (isSlotExpired(slotsList.find(s=>s.id===id).time)) return showToast("Cannot cancel past classes.", "error");
    if(!confirm("Cancel this class?")) return;
    
    const slot = slotsList.find(s => s.id === id);
    slot.bookedBy = null;
    slot.instructions = ""; 
    
    try {
        // Simulate Backend Call / Use IPC if available
        if(window.api) {
            const slotsForBackend = slotsList.map(s => ({ id: s.id, bookedBy: s.bookedBy ? parseInt(s.bookedBy.substring(1)) : 0, type: s.type }));
            const waitlistForBackend = waitlistData[viewingDay].map(w => ({ teacherId: parseInt(w.teacherId.substring(1)), slotId: w.slotId, type: w.type }));
            
            const updatedData = await window.api.runScheduler({ slots: slotsForBackend, waitlist: waitlistForBackend });
            
            updatedData.forEach(uSlot => {
                const local = slotsList.find(s => s.id === uSlot.id);
                if(uSlot.bookedBy !== 0 && uSlot.bookedBy !== null) {
                    local.bookedBy = "T" + uSlot.bookedBy; 
                    local.type = uSlot.type;
                    
                    // MERGE INSTRUCTIONS
                    const wIndex = waitlistData[viewingDay].findIndex(w => w.teacherId === local.bookedBy && w.slotId === local.id);
                    if(wIndex !== -1) {
                        local.instructions = waitlistData[viewingDay][wIndex].instructions || "";
                        waitlistData[viewingDay].splice(wIndex, 1);
                    }
                } else {
                    local.bookedBy = null;
                }
            });
            showToast("Cancelled & Updated", "info");
        } else {
            // Simple local cancellation if backend offline
            showToast("Cancelled (Local Mode)", "info");
        }
        saveData();
        renderSlots();
    } catch (e) {
        console.error("Backend offline");
        saveData();
        renderSlots();
        showToast("Cancelled (Local Mode)", "info");
    }
}

// --- UTILS ---
function showToast(message, type = 'success') {
    const x = document.getElementById("toast");
    let icon = '<i class="fa-solid fa-circle-check"></i>';
    if(type === 'reset') icon = '<i class="fa-solid fa-calendar-day"></i>';
    if(type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    if(type === 'info') icon = '<i class="fa-solid fa-circle-info"></i>';

    x.innerHTML = `${icon} <span>${message}</span>`;
    x.className = "toast show " + type;
    setTimeout(() => { x.className = x.className.replace("show", ""); }, 3000);
}

function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if(isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-icon').className = 'fa-solid fa-sun';
    }
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function attemptLogin() {
    const idInput = document.getElementById('userId').value.trim();
    const passInput = document.getElementById('userPass').value.trim();
    const user = users.find(u => u.id === idInput && u.pass === passInput);
    if (user) {
        currentUser = user;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('user-badge').innerHTML = `<i class="fa-solid fa-user-circle"></i> ${user.name}`;
        renderSlots();
        if(user.role === 'student') { } else { renderAttendanceView(); }
        renderLeaderboard();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function logout() { location.reload(); }

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    const navMap = { 'dashboard': 'nav-dash', 'attendance': 'nav-att', 'leaderboard': 'nav-leader', 'feedback': 'nav-feed' };
    if(navMap[viewName]) document.getElementById(navMap[viewName]).classList.add('active');
    const titles = { 'dashboard': 'Class Schedule', 'attendance': 'Attendance Record', 'leaderboard': 'Class Leaderboard', 'feedback': 'Feedback Corner' };
    document.getElementById('page-title').innerText = titles[viewName];
    if(viewName === 'attendance') renderAttendanceView();
    if(viewName === 'leaderboard') renderLeaderboard();
}

function renderAttendanceView() {
    const container = document.getElementById('attendance-content');
    container.innerHTML = '';
    if (currentUser.role === 'student') {
        const myStats = attendanceStats[currentUser.id] || { total: 0, present: 0 };
        const percentage = myStats.total === 0 ? 0 : Math.round((myStats.present / myStats.total) * 100);
        container.innerHTML = `
            <div class="attendance-card">
                <h2 style="color:var(--text)">My Attendance</h2>
                <div class="stat-circle">${percentage}%</div>
                <div class="stat-grid">
                    <div class="stat-box"><h3>${myStats.total}</h3><p>Classes Held</p></div>
                    <div class="stat-box"><h3>${myStats.present}</h3><p>Classes Attended</p></div>
                </div>
            </div>`;
    } else {
        const students = users.filter(u => u.role === 'student');
        let html = `
            <div class="table-container" style="max-width: 800px; margin: 0 auto;">
                <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:var(--text);">Class Roll Call</h3>
                    <span style="color:var(--text-secondary); font-size:0.9rem;">Mark students present/absent</span>
                </div>
                <table class="data-table"><thead><tr><th>ID</th><th>Student Name</th><th>Status</th></tr></thead><tbody>`;
        students.forEach(s => {
            html += `<tr><td>${s.id}</td><td>${s.name}</td><td><label class="switch"><input type="checkbox" checked class="att-check" data-sid="${s.id}"><span class="slider"></span></label></td></tr>`;
        });
        html += `</tbody></table><div style="padding:20px; text-align:right;"><button class="btn btn-primary" onclick="window.app.submitAttendance()">Submit Attendance</button></div></div>`;
        container.innerHTML = html;
    }
}

function submitAttendance() {
    const checkboxes = document.querySelectorAll('.att-check');
    checkboxes.forEach(cb => {
        const sid = cb.getAttribute('data-sid');
        const isPresent = cb.checked;
        if (!attendanceStats[sid]) attendanceStats[sid] = { total: 0, present: 0, name: '' };
        attendanceStats[sid].total += 1;
        if (isPresent) attendanceStats[sid].present += 1;
    });
    saveData();
    showToast("Attendance Updated", "success");
    renderLeaderboard();
}

function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    const students = users.filter(u => u.role === 'student');
    const rankedStudents = students.map(s => {
        const stats = attendanceStats[s.id] || { total: 10, present: 9 }; 
        const pct = stats.total === 0 ? 0 : ((stats.present / stats.total) * 100).toFixed(1);
        return { ...s, pct: pct, score: (90 + Math.random() * 10).toFixed(1) };
    }).sort((a, b) => b.pct - a.pct);
    let html = '';
    rankedStudents.forEach((s, index) => {
        html += `<tr><td><span class="rank-badge" style="${index > 2 ? 'background:transparent; color:var(--text-secondary)' : ''}">#${index + 1}</span></td><td>${s.name}</td><td>${s.score}%</td><td><strong>${s.pct}%</strong></td></tr>`;
    });
    tbody.innerHTML = html;
}

// Start the App
init();
