// ==========================================
// GLOBAL STATE
// ==========================================
let lastData = null;
let currentLang = "EN";
let audioEnabled = false;
let lastProcessingSet = new Set();
let isMuted = false;
let newQueueSet = new Set();
let voices = [];

speechSynthesis.onvoiceschanged = () => {
    voices = speechSynthesis.getVoices();
};

// ==========================================
// FETCH
// ==========================================
function fetchQueue() {
    fetch('API/Monitor/monitor_api.php')
    .then(res => res.json())
    .then(data => {
        if (JSON.stringify(data) !== JSON.stringify(lastData)) {
            detectNewProcessing(data);
            updateUI(data);
            lastData = data;
        }
    })
    .catch(err => console.error("Fetch error:", err));
}

// ==========================================
// RENDER
// ==========================================
function render(id, list, highlight = false) {
    const container = document.getElementById(id);
    if (!container) return;

    container.innerHTML = '';

    if (!list || list.length === 0) {
        container.innerHTML = `<div class="queue-item empty">---</div>`;
        return;
    }

    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'queue-item' + (highlight ? ' processing' : '');

        if (newQueueSet.has(item.queue_number)) {
            div.classList.add('flash');
        }

        div.textContent = item.queue_number;
        container.appendChild(div);
    });
}

// ==========================================
// UPDATE UI
// ==========================================
function updateUI(data) {
    // Only render Normal and Priority arrays now
    render('proc-normal', data.proc_normal, true);
    render('proc-priority', data.proc_priority, true);

    render('pend-normal', data.pend_normal);
    render('pend-priority', data.pend_priority);
}

// ==========================================
// DETECT PROCESSING
// ==========================================
function detectNewProcessing(data) {
    // Combined array of only Normal and Priority
    let all = [
        ...data.proc_normal,
        ...data.proc_priority
    ];

    let currentSet = new Set(all.map(x => x.queue_number));
    let index = 0;

    all.forEach(item => {
        if (!lastProcessingSet.has(item.queue_number)) {
            setTimeout(() => {
                playBeep();
                speak(item.queue_number);
            }, index * 1200);

            newQueueSet.add(item.queue_number);
            index++;
        }
    });

    lastProcessingSet = currentSet;

    setTimeout(() => newQueueSet.clear(), 3000);
}

// ==========================================
// BEEP
// ==========================================
function playBeep() {
    if (!audioEnabled || isMuted) return;

    let audio = new Audio("https://www.soundjay.com/buttons/beep-01a.mp3");
    audio.play().catch(() => {});
}

// ==========================================
// SPEAK
// ==========================================
function speak(queue) {
    if (!audioEnabled || isMuted) return;

    let formatted = queue.replace('-', ' ').split('').join(' ');

    let text = currentLang === "EN"
        ? "Now processing " + formatted
        : "Pinoproseso na ang numero " + formatted;

    let msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.9;

    let preferred = voices.find(v => v.lang.includes("en")) || voices[0];
    if (preferred) msg.voice = preferred;

    speechSynthesis.speak(msg);
}

// ==========================================
// REPEAT
// ==========================================
function repeatAnnouncements() {
    if (!lastData) return;

    // Combined array of only Normal and Priority
    let all = [
        ...lastData.proc_normal,
        ...lastData.proc_priority
    ];

    let index = 0;

    all.forEach(item => {
        setTimeout(() => {
            playBeep();
            speak(item.queue_number);
        }, index * 1200);
        index++;
    });
}

// ==========================================
// EVENTS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            currentLang = currentLang === "EN" ? "TL" : "EN";
            langToggle.textContent = currentLang === "EN" ? "🇺🇸" : "🇵🇭";
        });
    }

    const audioBtn = document.getElementById('audio-start');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            audioEnabled = true;
            let msg = new SpeechSynthesisUtterance(" ");
            speechSynthesis.speak(msg);
            audioBtn.style.display = 'none';
        });
    }

    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            muteBtn.textContent = isMuted ? "🔇" : "🔊";
        });
    }

    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            repeatAnnouncements();
        });
    }
});

// ==========================================
// CLOCK
// ==========================================
function updateClock() {
    const el = document.getElementById('datetime');
    if (!el) return;

    let now = new Date();

    let options = {
        timeZone: "Asia/Manila",
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    el.textContent = new Intl.DateTimeFormat('en-PH', options).format(now);
}

// ==========================================
// INIT
// ==========================================
fetchQueue();
setInterval(fetchQueue, 5000);

setInterval(updateClock, 1000);
updateClock();