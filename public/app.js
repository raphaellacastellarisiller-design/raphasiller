(function () {
  "use strict";

  var STORAGE_KEY = "agenda_dados_v1";

  var WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  var MONTH_LABELS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  var WEEKDAY_FULL = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira",
    "quinta-feira", "sexta-feira", "sábado"
  ];

  var TIME_SLOTS = buildTimeSlots(7, 21);

  function buildTimeSlots(startHour, endHour) {
    var slots = [];
    for (var h = startHour; h <= endHour; h++) {
      slots.push(pad2(h) + ":00");
    }
    return slots;
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function dateKey(year, month, day) {
    return year + "-" + pad2(month + 1) + "-" + pad2(day);
  }

  function parseKeyToDate(key) {
    var parts = key.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function todayKey() {
    var d = new Date();
    return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // ---------- Data layer ----------

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  var data = loadData();

  function getDayEvents(key) {
    return data[key] || {};
  }

  function setSlotValue(key, time, value) {
    if (!data[key]) data[key] = {};
    var trimmed = value.trim();
    if (trimmed) {
      data[key][time] = trimmed;
    } else {
      delete data[key][time];
      if (Object.keys(data[key]).length === 0) delete data[key];
    }
    saveData(data);
  }

  function countForDay(key) {
    return Object.keys(getDayEvents(key)).length;
  }

  // ---------- State ----------

  var view = new Date();
  var viewYear = view.getFullYear();
  var viewMonth = view.getMonth();

  // ---------- Calendar rendering ----------

  var monthTitleEl = document.getElementById("month-title");
  var gridEl = document.getElementById("calendar-grid");

  function renderCalendar() {
    monthTitleEl.textContent = MONTH_LABELS[viewMonth] + " de " + viewYear;
    gridEl.innerHTML = "";

    var firstOfMonth = new Date(viewYear, viewMonth, 1);
    var jsWeekday = firstOfMonth.getDay(); // 0 = Sun ... 6 = Sat
    var mondayOffset = (jsWeekday + 6) % 7; // 0 = Mon

    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    var totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
    var tKey = todayKey();
    var frag = document.createDocumentFragment();

    for (var i = 0; i < totalCells; i++) {
      var cellYear = viewYear, cellMonth = viewMonth, cellDay, outside = false;

      if (i < mondayOffset) {
        cellDay = daysInPrevMonth - mondayOffset + i + 1;
        cellMonth = viewMonth - 1;
        outside = true;
      } else if (i >= mondayOffset + daysInMonth) {
        cellDay = i - mondayOffset - daysInMonth + 1;
        cellMonth = viewMonth + 1;
        outside = true;
      } else {
        cellDay = i - mondayOffset + 1;
      }

      if (cellMonth < 0) { cellMonth = 11; cellYear -= 1; }
      if (cellMonth > 11) { cellMonth = 0; cellYear += 1; }

      var key = dateKey(cellYear, cellMonth, cellDay);
      var count = countForDay(key);

      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "day-cell" + (outside ? " is-outside" : "") + (key === tKey ? " is-today" : "");
      cell.setAttribute("data-key", key);

      var num = document.createElement("span");
      num.className = "day-num";
      num.textContent = String(cellDay);
      cell.appendChild(num);

      if (count > 0) {
        var badge = document.createElement("span");
        badge.className = "day-count";
        badge.textContent = count === 1 ? "1 evento" : count + " eventos";
        cell.appendChild(badge);
      }

      cell.addEventListener("click", function () {
        openDayModal(this.getAttribute("data-key"));
      });

      frag.appendChild(cell);
    }

    gridEl.appendChild(frag);
  }

  document.getElementById("btn-prev-month").addEventListener("click", function () {
    viewMonth -= 1;
    if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
    renderCalendar();
  });

  document.getElementById("btn-next-month").addEventListener("click", function () {
    viewMonth += 1;
    if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
    renderCalendar();
  });

  document.getElementById("btn-today").addEventListener("click", function () {
    var now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    renderCalendar();
  });

  // ---------- Day modal ----------

  var modalEl = document.getElementById("day-modal");
  var modalTitleEl = document.getElementById("modal-date-title");
  var modalSubEl = document.getElementById("modal-date-sub");
  var slotListEl = document.getElementById("slot-list");
  var activeKey = null;

  function openDayModal(key) {
    activeKey = key;
    var d = parseKeyToDate(key);

    modalTitleEl.textContent = capitalizeFirst(WEEKDAY_FULL[d.getDay()]);
    modalSubEl.textContent = d.getDate() + " de " + MONTH_LABELS[d.getMonth()].toLowerCase() + " de " + d.getFullYear();

    renderSlotList(key);

    modalEl.hidden = false;
  }

  function renderSlotList(key) {
    var events = getDayEvents(key);
    slotListEl.innerHTML = "";
    var frag = document.createDocumentFragment();

    TIME_SLOTS.forEach(function (time) {
      var value = events[time] || "";

      var li = document.createElement("li");
      li.className = "slot-row" + (value ? " has-event" : "");

      var dot = document.createElement("span");
      dot.className = "slot-dot";

      var timeEl = document.createElement("span");
      timeEl.className = "slot-time";
      timeEl.textContent = time;

      var input = document.createElement("input");
      input.type = "text";
      input.className = "slot-input";
      input.placeholder = "Livre — clique para adicionar";
      input.value = value;
      input.maxLength = 80;

      var clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "slot-clear";
      clearBtn.textContent = "Limpar";

      input.addEventListener("change", function () {
        commitSlot(key, time, input.value, li, clearBtn);
      });
      input.addEventListener("blur", function () {
        commitSlot(key, time, input.value, li, clearBtn);
      });

      clearBtn.addEventListener("click", function () {
        input.value = "";
        commitSlot(key, time, "", li, clearBtn);
      });

      li.appendChild(dot);
      li.appendChild(timeEl);
      li.appendChild(input);
      li.appendChild(clearBtn);
      frag.appendChild(li);
    });

    slotListEl.appendChild(frag);
  }

  function commitSlot(key, time, value, rowEl, clearBtnEl) {
    setSlotValue(key, time, value);
    var trimmed = value.trim();
    rowEl.classList.toggle("has-event", !!trimmed);
    renderCalendar();
    renderPanorama();
  }

  function closeModal() {
    modalEl.hidden = true;
    activeKey = null;
  }

  document.getElementById("btn-close-modal").addEventListener("click", closeModal);
  modalEl.addEventListener("click", function (e) {
    if (e.target === modalEl) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modalEl.hidden) closeModal();
  });

  // ---------- Tabs ----------

  var tabBtnCalendario = document.getElementById("tab-btn-calendario");
  var tabBtnPanorama = document.getElementById("tab-btn-panorama");
  var viewCalendario = document.getElementById("view-calendario");
  var viewPanorama = document.getElementById("view-panorama");

  function activateTab(name) {
    var isCal = name === "calendario";
    tabBtnCalendario.classList.toggle("is-active", isCal);
    tabBtnPanorama.classList.toggle("is-active", !isCal);
    tabBtnCalendario.setAttribute("aria-selected", String(isCal));
    tabBtnPanorama.setAttribute("aria-selected", String(!isCal));
    viewCalendario.classList.toggle("is-active", isCal);
    viewPanorama.classList.toggle("is-active", !isCal);
    if (!isCal) renderPanorama();
  }

  tabBtnCalendario.addEventListener("click", function () { activateTab("calendario"); });
  tabBtnPanorama.addEventListener("click", function () { activateTab("panorama"); });

  // ---------- Panorama geral ----------

  var statCardsEl = document.getElementById("stat-cards");
  var upcomingListEl = document.getElementById("upcoming-list");
  var todayListEl = document.getElementById("today-list");

  function getAllEventsSorted() {
    var list = [];
    Object.keys(data).forEach(function (key) {
      var slots = data[key];
      Object.keys(slots).forEach(function (time) {
        list.push({ key: key, time: time, title: slots[time] });
      });
    });
    list.sort(function (a, b) {
      if (a.key !== b.key) return a.key < b.key ? -1 : 1;
      return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
    });
    return list;
  }

  function formatShortDate(key) {
    var d = parseKeyToDate(key);
    return pad2(d.getDate()) + " " + MONTH_LABELS[d.getMonth()].slice(0, 3);
  }

  function renderPanorama() {
    var all = getAllEventsSorted();
    var tKey = todayKey();
    var nowKey = tKey;

    var totalCount = all.length;
    var todayItems = all.filter(function (e) { return e.key === tKey; });
    var futureItems = all.filter(function (e) { return e.key >= nowKey; });
    var next = futureItems[0];

    var monthPrefix = viewYear + "-" + pad2(viewMonth + 1);
    var monthItems = all.filter(function (e) { return e.key.indexOf(monthPrefix) === 0; });

    var counts = {};
    monthItems.forEach(function (e) {
      counts[e.key] = (counts[e.key] || 0) + 1;
    });
    var busiestKey = null, busiestCount = 0;
    Object.keys(counts).forEach(function (k) {
      if (counts[k] > busiestCount) { busiestCount = counts[k]; busiestKey = k; }
    });

    var cards = [
      {
        icon: "📋",
        label: "Total de compromissos",
        value: String(totalCount),
        hint: totalCount === 0 ? "Nenhum compromisso cadastrado ainda" : "Em toda a agenda"
      },
      {
        icon: "☀️",
        label: "Hoje",
        value: String(todayItems.length),
        hint: todayItems.length ? todayItems.map(function (e) { return e.time; }).join(", ") : "Nenhum compromisso hoje"
      },
      {
        icon: "⏭️",
        label: "Próximo compromisso",
        value: next ? next.time : "—",
        hint: next ? (formatShortDate(next.key) + " · " + next.title) : "Nada agendado no futuro"
      },
      {
        icon: "🔥",
        label: "Dia mais ocupado (" + MONTH_LABELS[viewMonth] + ")",
        value: busiestKey ? formatShortDate(busiestKey) : "—",
        hint: busiestKey ? (busiestCount + (busiestCount === 1 ? " compromisso" : " compromissos")) : "Sem dados no mês"
      }
    ];

    statCardsEl.innerHTML = "";
    cards.forEach(function (c) {
      var card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML =
        '<span class="stat-icon"></span>' +
        '<p class="stat-label"></p>' +
        '<p class="stat-value"></p>' +
        '<p class="stat-hint"></p>';
      card.querySelector(".stat-icon").textContent = c.icon;
      card.querySelector(".stat-label").textContent = c.label;
      card.querySelector(".stat-value").textContent = c.value;
      card.querySelector(".stat-hint").textContent = c.hint;
      statCardsEl.appendChild(card);
    });

    renderEventList(upcomingListEl, futureItems.slice(0, 8), "Nenhum compromisso futuro.");
    renderEventList(todayListEl, todayItems, "Nenhum compromisso para hoje.");
  }

  function renderEventList(ulEl, items, emptyText) {
    ulEl.innerHTML = "";
    if (items.length === 0) {
      var empty = document.createElement("li");
      empty.className = "empty-hint";
      empty.textContent = emptyText;
      ulEl.appendChild(empty);
      return;
    }
    var frag = document.createDocumentFragment();
    items.forEach(function (e) {
      var li = document.createElement("li");

      var dateEl = document.createElement("span");
      dateEl.className = "ev-date";
      dateEl.textContent = formatShortDate(e.key);

      var timeEl = document.createElement("span");
      timeEl.className = "ev-time";
      timeEl.textContent = e.time;

      var titleEl = document.createElement("span");
      titleEl.className = "ev-title";
      titleEl.textContent = e.title;

      li.appendChild(dateEl);
      li.appendChild(timeEl);
      li.appendChild(titleEl);
      frag.appendChild(li);
    });
    ulEl.appendChild(frag);
  }

  // ---------- Init ----------

  renderCalendar();
  renderPanorama();
})();
