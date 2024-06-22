const ALLOCATION_COL = 2;
const START_DATE_COL = 9;
const START_TIME_COL = 10;
const END_TIME_COL = 11;

const ROOMS = [
    { id: '131', description: 'Storage' },
    { id: '132', description: '' },
    { id: '133', description: 'Monitoring' },
    { id: '134', description: '' },
    { id: '135', description: '' },
    { id: '136', description: '' },
    { id: 'upcoming', description: '' },
];

class SubEvent {
    /**
     * @param {object} event
     * @param {string} room
     * @param {date} start
     * @param {date} end
     * @param {boolean} dryrun
     */
    constructor(event, room, start, end, dryrun) {
        this.event = event;
        this.room = room;
        this.start = start;
        this.end = end;
        this.dryrun = dryrun;
    }
}

// ===== General Utils =====
function getHourStr(hour) {
    console.assert(0 <= hour && hour <= 24, hour);
    if (hour <= 12) return hour + ' AM';
    return hour - 12 + ' PM';
}
function daysInMonth(year, month) {
    return new Date(year, (month + 1) % 12, 0).getDate();
}

function getFirstWeekday(year, month) {
    return new Date(year, month, 1).getDay();
}

function formatTime(num) {
    console.assert(num >= 0, num);
    if (num < 10) return '0' + num;
    return String(num);
}

// ===== Events Utils =====
function flattenEvents(events) {
    const flat = [];
    events.forEach((e) => {
        e.allocation[0].forEach((a) => flat.push(new SubEvent(e, a[0], a[1], a[2], true)));
        e.allocation[1].forEach((a) => flat.push(new SubEvent(e, a[0], a[1], a[2], false)));
    });
    return flat;
}

// TODO: handle case when event spans over 2 days
function groupEvents(year, month, events) {
    const daysNum = daysInMonth(year, month);
    const eventsByDate = Array(daysNum + 1)
        .fill()
        .map((_) => []);
    events
        .filter((e) => e.start.getFullYear() === year)
        .filter((e) => e.start.getMonth() >= month && e.end.getMonth() <= month)
        .forEach((e) => {
            const date = e.start.getDate();
            console.assert(eventsByDate.length > date);
            eventsByDate[date].push(e);
        });
    return eventsByDate;
}

function getTimelineRange(events) {
    const minTime = Math.min(...events.map((e) => e.start.getTime()));
    const maxTime = Math.max(...events.map((e) => e.end.getTime()));

    const minH = new Date(minTime).getHours();
    let maxH = new Date(maxTime).getHours();
    if (new Date(maxTime).getMinutes() !== 0) maxH += 1;
    return { minH: minH, maxH: maxH };
}

// ===== Sidebar Utils =====
function showSidebar() {
    document.getElementById('drawer-checkbox').checked = true;
}

function hideSidebar() {
    document.getElementById('drawer-checkbox').checked = false;
}

function escapeHTML(str) {
    return new Option(str).innerHTML;
}

function getDateString(date, timeZone = 'Asia/Kolkata') {
    return new Date(date)
        .toLocaleString('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: timeZone,
        })
        .replace(' ', 'T');
}

function renderSidebar(event, columnNames) {
    const sidebarBody = document.getElementById('sidebar-body');
    let sidebarHtml = '';

    const getAllocHtml = (a) => {
        console.assert(a[0] !== '');
        return `
        <li class="mb-2">
        <select class="select w-24 select-sm">
          <option value='' disabled>Room</option>
          ${ROOMS.map((r) => `<option value=${r.id} ${a[0] === r.id ? 'selected' : ''}>${r.id}</option>`)}
        </select>
        <input type="datetime-local" class="input input-sm" value="${getDateString(a[1])}"></input>
        <input type="datetime-local" class="input input-sm" value="${getDateString(a[2])}"></input>
        </li>`;
    };

    columnNames.forEach((name, i) => {
        const value = event.details[i];
        if (value === '') return;

        sidebarHtml += `<li class="text-xl"><span class="text-secondary">${i}</span>&nbsp; ${escapeHTML(name)}</li>`;

        if (i === ALLOCATION_COL) {
            event.allocation[0].forEach((a) => (sidebarHtml += getAllocHtml(a)));
            event.allocation[1].forEach((a) => (sidebarHtml += getAllocHtml(a)));
        } else if (i === START_DATE_COL) {
            sidebarHtml += `<li class="mb-2 text-gray-500">${getDateString(event.details[i]).split('T')[0]}</li>`;
        } else if (i === START_TIME_COL || i === END_TIME_COL) {
            console.log(event.details[i]);
            sidebarHtml += `<li class="mb-2 text-gray-500">${getDateString(event.details[i]).split('T')[1]}</li>`;
        } else {
            sidebarHtml += `
              <li class="mb-2 text-gray-500">${escapeHTML(value)}</li>`;
        }
    });
    sidebarBody.innerHTML = sidebarHtml;
}

// ===== Page Rendering =====
function renderCalendar(year, month, eventGroups) {
    const calendar = document.getElementById('calendar');

    const monthStr = new Date(year, month, 1).toLocaleString('en-US', { month: 'short' });

    for (let i = 1; i < eventGroups.length; i++) {
        const dayStr = new Date(year, month, i).toLocaleString('en-US', { weekday: 'short' });
        calendar.innerHTML += `
          <div
            class="m-auto w-[200px] text-center rounded-xl bg-neutral-content text-2xl font-bold text-neutral font-mono">
            ${i} ${monthStr}: ${dayStr}
          </div>`;

        const group = eventGroups[i];
        if (group.length === 0) {
            calendar.innerHTML += `<div class="text-center">No events...</div>`;
            continue;
        }

        const container = document.createElement('div');
        container.className = 'm-8 grid grid-cols-[auto_1fr] gap-2.5';
        calendar.appendChild(container);

        const range = getTimelineRange(group);
        let scale = range.maxH - range.minH;
        console.assert(scale > 0, range.minH, range.maxH);

        let timeline =
            '<div id="timeline" class="grid grid-rows-[repeat(1,_50px)] grid-cols-[repeat(1,50px)]"><div></div>';
        for (let i = 0; i < scale; i++) {
            timeline += `
          <div class="border-t border-dashed border-neutral-content">${getHourStr(range.minH + i)}</div>`;
        }
        timeline += `</div>`;
        container.innerHTML = timeline;

        let rooms = '<div class="col-start-2 grid grid-cols-[repeat(6,200px)_400px] gap-1">';
        ROOMS.forEach((r) => {
            rooms += `
        <div>
          <div class="h-[50px] flex gap-4">
            <p class="inline text-3xl font-semibold">${r.id}</p>
            <p class="inline font-thin">${r.description}</p>
          </div>
          <div class="grid grid-rows-[repeat(${scale * 2},_25px)] rounded-md bg-neutral" id="events-${i}-${r.id}"></div>
        </div>`;
        });
        rooms += '</div>';
        container.innerHTML += rooms;
    }
}

function renderEvents(eventGroups) {
    for (let i = 1; i < eventGroups.length; i++) {
        const group = eventGroups[i];
        if (group.length === 0) {
            continue;
        }

        const range = getTimelineRange(group);
        group.forEach((e) => {
            const startH = e.start.getHours();
            const startM = e.start.getMinutes();
            let startRow = (startH - range.minH) * 2 + 1;
            if (startM > 15) startRow += 1;
            else if (startM > 45) startRow += 2;

            const endH = e.end.getHours();
            const endM = e.end.getMinutes();
            let endRow = (endH - range.minH) * 2 + 1;
            if (endM > 15) endRow += 1;
            else if (endM > 45) endRow += 2;

            const eventElem = document.createElement('div');
            eventElem.className = `bg-neutral-content text-base-300 px-1 my-0 text-sm max-w-[200px]
              rounded-md border border-base-300 row-start-[${startRow}] row-end-[${endRow}]`;
            eventElem.innerHTML += `
              <p class="font-semibold">${e.event.name}</p>
              <p>${formatTime(startH)}:${formatTime(startM)} - ${formatTime(endH)}:${formatTime(endM)}
                (${e.event.lang})</p>`;
            eventElem.addEventListener('dblclick', () => {
                hideSidebar();
                renderSidebar(e.event, columnNames);
                showSidebar();
            });

            const roomEvents = document.getElementById('events-' + i + '-' + e.room);
            roomEvents.appendChild(eventElem);
        });
    }
}

function renderPage(data) {
    const parsedData = JSON.parse(data);
    const events = parsedData[0];
    columnNames = parsedData[1];

    events.forEach((e) => {
        e.allocation[0].forEach((a) => {
            a[0] = String(a[0]);
            a[1] = new Date(a[1]);
            a[2] = new Date(a[2]);
        });
        e.allocation[1].forEach((a) => {
            a[0] = String(a[0]);
            a[1] = new Date(a[1]);
            a[2] = new Date(a[2]);
        });
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const subEvents = flattenEvents(events);
    const eventGroups = groupEvents(year, month, subEvents);
    renderCalendar(year, month, eventGroups);
    renderEvents(eventGroups);
}

let columnNames = null;
if (typeof google !== 'undefined') {
    // Prod mode
    google.script.run.withSuccessHandler((data) => renderPage(data)).getEvents();
} else {
    // Dev mode
    renderPage(getEventsMock());
}
