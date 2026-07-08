// ========================================
// BARANGAY — NEWS CALENDAR POPUP
// JS/Index_js/index_news_calendar.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    // Wait slightly so index_news_modal.js has time to init and expose data
    setTimeout(initNewsCalendar, 150);
});

function initNewsCalendar() {

    var MONTHS = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    var WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    // ── STATE ─────────────────────────────────────────────────
    var currentYear  = new Date().getFullYear();
    var currentMonth = new Date().getMonth(); // 0-indexed

    // Safe fallback to fetch dynamic data exposed by the modal script
    function getAnnouncements() {
        return window._barangayAnnouncements || [];
    }

    // ── INTERCEPT "VIEW ALL" LINK ─────────────────────────────
    var viewAllLink = document.querySelector('.news-view-all');
    if (!viewAllLink) return;

    viewAllLink.addEventListener('click', function (e) {
        e.preventDefault();
        openCalendar();
    });

    // ── BUILD & INJECT CALENDAR MODAL ─────────────────────────
    buildCalendarModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var overlay    = document.getElementById('news-calendar-overlay');
    var closeBtn   = document.getElementById('calendar-modal-close');
    var prevBtn    = document.getElementById('calendar-prev-month');
    var nextBtn    = document.getElementById('calendar-next-month');
    var monthLabel = document.getElementById('calendar-month-label');
    var daysGrid   = document.getElementById('calendar-days-grid');
    var eventsList = document.getElementById('calendar-events-list');
    var eventsLabel= document.getElementById('calendar-events-label');

    if (!overlay) return;

    // ── CLOSE EVENTS ─────────────────────────────────────────
    closeBtn.addEventListener('click', closeCalendar);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeCalendar();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeCalendar();
    });

    // ── MONTH NAVIGATION ──────────────────────────────────────
    prevBtn.addEventListener('click', function () {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentYear, currentMonth);
    });
    nextBtn.addEventListener('click', function () {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentYear, currentMonth);
    });

    // ─────────────────────────────────────────────────────────
    //  OPEN CALENDAR
    // ─────────────────────────────────────────────────────────
    function openCalendar() {
        var now = new Date();
        currentYear  = now.getFullYear();
        currentMonth = now.getMonth();

        renderCalendar(currentYear, currentMonth);
        renderEventsList(getAnnouncements()); // show all loaded events initially

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ─────────────────────────────────────────────────────────
    //  CLOSE CALENDAR
    // ─────────────────────────────────────────────────────────
    function closeCalendar() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ─────────────────────────────────────────────────────────
    //  RENDER CALENDAR GRID
    // ─────────────────────────────────────────────────────────
    function renderCalendar(year, month) {
        monthLabel.textContent = MONTHS[month] + ' ' + year;

        var today     = new Date();
        var firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
        var daysInMonth = new Date(year, month + 1, 0).getDate();

        var eventMap = buildEventMap(year, month);
        daysGrid.innerHTML = '';

        // Empty cells before the 1st
        for (var e = 0; e < firstDay; e++) {
            var empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            daysGrid.appendChild(empty);
        }

        // Day cells
        for (var d = 1; d <= daysInMonth; d++) {
            var dayEl  = document.createElement('div');
            var events = eventMap[d] || [];
            var isToday= (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d);

            dayEl.className = 'calendar-day' + (isToday ? ' today' : '') + (events.length > 0 ? ' has-event' : '');

            var numEl = document.createElement('span');
            numEl.className   = 'calendar-day-num';
            numEl.textContent = d;
            dayEl.appendChild(numEl);

            // Event dots (max 3)
            if (events.length > 0) {
                var dotsEl = document.createElement('div');
                dotsEl.className = 'calendar-day-dots';
                events.slice(0, 3).forEach(function (ann) {
                    var dot = document.createElement('span');
                    // We call getDotClass here, which is now forced to return 'dot-red'
                    dot.className = 'calendar-day-dot ' + getDotClass(ann.tagClass);
                    dotsEl.appendChild(dot);
                });
                dayEl.appendChild(dotsEl);

                // Click → filter event list to this specific day
                (function (dayEvents, dayNum) {
                    dayEl.addEventListener('click', function () {
                        renderEventsList(dayEvents, MONTHS[month] + ' ' + dayNum + ', ' + year);
                        highlightDay(dayEl);
                    });
                })(events, d);
            }

            daysGrid.appendChild(dayEl);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  BUILD EVENT MAP
    // ─────────────────────────────────────────────────────────
    function buildEventMap(year, month) {
        var map = {};
        getAnnouncements().forEach(function (ann) {
            // Check if eventDate exists and is not empty or "0000-00-00"
            if (!ann.eventDate || ann.eventDate === "0000-00-00" || ann.eventDate.trim() === "") return; 
            
            // Parse eventDate cleanly (YYYY-MM-DD from DB)
            var d = new Date(ann.eventDate);
            
            // Ensure the date parsed correctly before using it
            if (isNaN(d.getTime())) return;

            if (d.getFullYear() === year && d.getMonth() === month) {
                var day = d.getDate();
                if (!map[day]) map[day] = [];
                map[day].push(ann);
            }
        });
        return map;
    }

    // ─────────────────────────────────────────────────────────
    //  RENDER EVENTS LIST (sidebar)
    // ─────────────────────────────────────────────────────────
    function renderEventsList(events, dateLabel) {
        eventsLabel.textContent = dateLabel ? 'Events on ' + dateLabel : 'All Announcements';
        eventsList.innerHTML = '';

        if (!events || events.length === 0) {
            eventsList.innerHTML = '<div class="calendar-no-events">No announcements for this date.</div>';
            return;
        }

        events.forEach(function (ann) {
            var item = document.createElement('div');
            item.className = 'calendar-event-item';

            item.innerHTML = [
                '<span class="calendar-event-icon">' + escapeHTML(ann.icon || '📢') + '</span>',
                '<div class="calendar-event-info">',
                '  <div class="calendar-event-tag ' + escapeHTML(ann.tagClass || '') + '" style="display:inline-block; padding: 2px 6px; border-radius:4px; margin-bottom:4px; font-size:0.55rem; border:1px solid currentColor;">' + escapeHTML(ann.tag || '') + '</div>',
                '  <div class="calendar-event-title">' + escapeHTML(ann.title || '') + '</div>',
                '  <div class="calendar-event-date">📅 ' + escapeHTML(ann.date || '') + '</div>',
                '</div>',
                '<span class="calendar-event-arrow">→</span>'
            ].join('');

            // Click → open news detail modal mapped from index_news_modal.js
            (function (id) {
                item.addEventListener('click', function () {
                    closeCalendar();
                    setTimeout(function () {
                        if (typeof window.openNewsModal === 'function') {
                            window.openNewsModal(id);
                        }
                    }, 320); // wait for calendar close animation
                });
            })(ann.id);

            eventsList.appendChild(item);
        });
    }

    // ─────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────
    function highlightDay(el) {
        document.querySelectorAll('.calendar-day.selected').forEach(function (d) {
            d.classList.remove('selected');
        });
        el.classList.add('selected');
    }

    // FORCED RED DOT FOR ALL EVENTS
    function getDotClass(tagClass) {
        return 'dot-red'; 
    }

    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ─────────────────────────────────────────────────────────
    //  BUILD CALENDAR MODAL HTML
    // ─────────────────────────────────────────────────────────
    function buildCalendarModal() {
        var weekdaysHTML = WEEKDAYS.map(function (d) {
            return '<div class="calendar-weekday">' + d + '</div>';
        }).join('');

        var html = [
            '<div class="calendar-overlay" id="news-calendar-overlay" role="dialog" aria-modal="true">',
            '  <div class="calendar-modal">',
            '    <div class="calendar-modal-header">',
            '      <div class="calendar-modal-title-group">',
            '        <div class="calendar-modal-icon">📅</div>',
            '        <div>',
            '          <span class="calendar-modal-eyebrow">Barangay Name Here</span>',
            '          <h2 class="calendar-modal-heading" id="calendar-modal-heading">News &amp; Announcements</h2>',
            '        </div>',
            '      </div>',
            '      <button class="calendar-modal-close" id="calendar-modal-close" aria-label="Close calendar">✕</button>',
            '    </div>',
            '    <div style="display:flex; gap:0; flex-wrap:wrap;">',
            '      <div style="flex:1; min-width:280px; border-right:1px solid rgba(200,168,75,0.1);">',
            '        <div class="calendar-nav">',
            '          <button class="calendar-nav-btn" id="calendar-prev-month" aria-label="Previous month">&#8592;</button>',
            '          <span class="calendar-month-label" id="calendar-month-label"></span>',
            '          <button class="calendar-nav-btn" id="calendar-next-month" aria-label="Next month">&#8594;</button>',
            '        </div>',
            '        <div class="calendar-grid-wrap">',
            '          <div class="calendar-weekdays">' + weekdaysHTML + '</div>',
            '          <div class="calendar-days" id="calendar-days-grid"></div>',
            '        </div>',
            '        <div style="display:flex; gap:16px; flex-wrap:wrap; padding:14px 24px 18px; border-top:1px solid rgba(200,168,75,0.07); margin-top:10px;">',
            '          <span style="display:flex;align-items:center;gap:5px;font-size:0.65rem;color:#8fa0c0;"><span style="width:8px;height:8px;border-radius:50%;background:#e05050;display:inline-block;"></span>Event Scheduled</span>',
            '          <span style="display:flex;align-items:center;gap:5px;font-size:0.65rem;color:#8fa0c0;"><span style="width:8px;height:8px;border-radius:50%;background:rgba(44, 87, 229, 0.4);border:1px solid #4a78ff;display:inline-block;"></span>Today</span>',
            '        </div>',
            '      </div>',
            '      <div style="flex:1; min-width:260px; max-height:420px; overflow-y:auto;">',
            '        <div class="calendar-events-section" style="border-top:none; padding-top:22px;">',
            '          <span class="calendar-events-label" id="calendar-events-label">All Announcements</span>',
            '          <div id="calendar-events-list"></div>',
            '        </div>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        document.body.insertAdjacentHTML('beforeend', html);
    }
}