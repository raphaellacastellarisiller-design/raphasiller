(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Config                                                             */
  /* ------------------------------------------------------------------ */
  var OPEN_HOUR = 8;
  var CLOSE_HOUR = 18; // last slot starts at CLOSE_HOUR - 1
  var CLOSED_WEEKDAY = 0; // Sunday
  var BAYS_PER_SLOT = 2; // simultaneous cars per time slot
  var DAYS_AHEAD = 14;
  var STORAGE_KEY = 'brilhototal_bookings_v1';
  var WHATSAPP_NUMBER = '5511999999999';

  var SERVICES = {
    simples: { label: 'Lavagem Simples', price: 'R$ 40' },
    completa: { label: 'Lavagem Completa', price: 'R$ 70' },
    detalhamento: { label: 'Detalhamento Premium', price: 'R$ 150' },
    polimento: { label: 'Polimento Técnico', price: 'R$ 250' }
  };

  var WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var WEEKDAY_LABELS_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  var state = {
    selectedDate: null, // 'YYYY-MM-DD'
    selectedTime: null  // 'HH:00'
  };

  /* ------------------------------------------------------------------ */
  /* Storage helpers                                                     */
  /* ------------------------------------------------------------------ */
  function getBookings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveBookings(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function bookingsFor(dateISO, time) {
    return getBookings().filter(function (b) {
      return b.date === dateISO && (!time || b.time === time);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Date helpers                                                        */
  /* ------------------------------------------------------------------ */
  function toISODate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function buildAvailableDates() {
    var dates = [];
    var cursor = new Date();
    var added = 0;
    var guard = 0;
    while (added < DAYS_AHEAD && guard < 60) {
      guard++;
      var d = new Date(cursor);
      d.setDate(cursor.getDate() + guard - 1);
      if (guard === 1) d = new Date(cursor);
      dates.push(d);
      added++;
    }
    return dates;
  }

  function isClosedDay(date) {
    return date.getDay() === CLOSED_WEEKDAY;
  }

  function generateHourSlots() {
    var slots = [];
    for (var h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
      slots.push(String(h).padStart(2, '0') + ':00');
    }
    return slots;
  }

  /* ------------------------------------------------------------------ */
  /* Render: date chips                                                  */
  /* ------------------------------------------------------------------ */
  var dateChipsEl = document.getElementById('dateChips');
  var closedHintEl = document.getElementById('closedHint');

  function renderDateChips() {
    if (!dateChipsEl) return;
    var dates = buildAvailableDates();
    dateChipsEl.innerHTML = '';

    dates.forEach(function (date) {
      var iso = toISODate(date);
      var closed = isClosedDay(date);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'date-chip';
      btn.setAttribute('role', 'option');
      btn.setAttribute('data-date', iso);
      btn.setAttribute('aria-selected', state.selectedDate === iso ? 'true' : 'false');
      if (closed) btn.disabled = true;

      var weekday = document.createElement('span');
      weekday.className = 'date-chip__weekday';
      weekday.textContent = WEEKDAY_LABELS[date.getDay()];

      var day = document.createElement('span');
      day.className = 'date-chip__day';
      day.textContent = String(date.getDate());

      var month = document.createElement('span');
      month.className = 'date-chip__weekday';
      month.textContent = MONTH_LABELS[date.getMonth()];

      btn.appendChild(weekday);
      btn.appendChild(day);
      btn.appendChild(month);

      btn.addEventListener('click', function () {
        selectDate(iso, date);
      });

      dateChipsEl.appendChild(btn);
    });
  }

  function selectDate(iso, dateObj) {
    state.selectedDate = iso;
    state.selectedTime = null;

    Array.prototype.forEach.call(dateChipsEl.querySelectorAll('.date-chip'), function (chip) {
      chip.setAttribute('aria-selected', chip.getAttribute('data-date') === iso ? 'true' : 'false');
    });

    if (closedHintEl) closedHintEl.hidden = true;
    renderTimeSlots(iso, dateObj);
    updateSummary();
  }

  /* ------------------------------------------------------------------ */
  /* Render: time slots                                                  */
  /* ------------------------------------------------------------------ */
  var timeSlotsEl = document.getElementById('timeSlots');

  function renderTimeSlots(iso, dateObj) {
    if (!timeSlotsEl) return;
    timeSlotsEl.innerHTML = '';

    var slots = generateHourSlots();
    var now = new Date();
    var isToday = isSameDay(dateObj, now);

    var anyAvailable = false;

    slots.forEach(function (time) {
      var hour = parseInt(time.split(':')[0], 10);
      var isPast = isToday && hour <= now.getHours();
      var count = bookingsFor(iso, time).length;
      var isFull = count >= BAYS_PER_SLOT;
      var disabled = isPast || isFull;
      if (!disabled) anyAvailable = true;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot';
      btn.setAttribute('role', 'option');
      btn.setAttribute('data-time', time);
      btn.setAttribute('aria-selected', state.selectedTime === time ? 'true' : 'false');
      btn.textContent = time;
      if (disabled) btn.disabled = true;

      btn.addEventListener('click', function () {
        selectTime(time);
      });

      timeSlotsEl.appendChild(btn);
    });

    if (!anyAvailable) {
      var msg = document.createElement('p');
      msg.className = 'booking__placeholder';
      msg.textContent = 'Sem horários livres neste dia. Escolha outra data.';
      timeSlotsEl.appendChild(msg);
    }
  }

  function selectTime(time) {
    state.selectedTime = time;
    Array.prototype.forEach.call(timeSlotsEl.querySelectorAll('.time-slot'), function (slot) {
      slot.setAttribute('aria-selected', slot.getAttribute('data-time') === time ? 'true' : 'false');
    });
    updateSummary();
  }

  /* ------------------------------------------------------------------ */
  /* Summary                                                             */
  /* ------------------------------------------------------------------ */
  var summaryEl = document.getElementById('bookingSummary');
  var servicoSelect = document.getElementById('servicoSelect');

  function formatDateLong(iso) {
    var parts = iso.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return WEEKDAY_LABELS_FULL[date.getDay()] + ', ' + date.getDate() + ' de ' + MONTH_LABELS[date.getMonth()];
  }

  function updateSummary() {
    if (!summaryEl) return;
    var serviceId = servicoSelect ? servicoSelect.value : '';
    var service = SERVICES[serviceId];

    if (!service || !state.selectedDate || !state.selectedTime) {
      summaryEl.classList.remove('is-visible');
      summaryEl.innerHTML = '';
      return;
    }

    summaryEl.classList.add('is-visible');
    summaryEl.innerHTML =
      '<strong>Resumo:</strong> ' + service.label + ' (' + service.price + ') · ' +
      formatDateLong(state.selectedDate) + ' às ' + state.selectedTime;
  }

  if (servicoSelect) {
    servicoSelect.addEventListener('change', updateSummary);
  }

  /* ------------------------------------------------------------------ */
  /* "Agendar" buttons on service cards                                 */
  /* ------------------------------------------------------------------ */
  Array.prototype.forEach.call(document.querySelectorAll('.js-agendar-servico'), function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.service-card');
      var serviceId = card ? card.getAttribute('data-service') : null;
      if (serviceId && servicoSelect) {
        servicoSelect.value = serviceId;
        updateSummary();
      }
      var target = document.getElementById('agendamento');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var nomeInput = document.getElementById('nomeInput');
      if (nomeInput) setTimeout(function () { nomeInput.focus(); }, 500);
    });
  });

  /* ------------------------------------------------------------------ */
  /* My bookings list                                                    */
  /* ------------------------------------------------------------------ */
  var myBookingsListEl = document.getElementById('myBookingsList');
  var myBookingsEmptyEl = document.getElementById('myBookingsEmpty');

  function renderMyBookings() {
    if (!myBookingsListEl) return;
    var bookings = getBookings().slice().sort(function (a, b) {
      return (a.date + a.time).localeCompare(b.date + b.time);
    });

    myBookingsListEl.innerHTML = '';

    if (bookings.length === 0) {
      if (myBookingsEmptyEl) myBookingsEmptyEl.hidden = false;
      return;
    }
    if (myBookingsEmptyEl) myBookingsEmptyEl.hidden = true;

    bookings.forEach(function (b) {
      var service = SERVICES[b.service] || { label: b.service, price: '' };
      var li = document.createElement('li');
      li.className = 'my-booking-item';

      var top = document.createElement('div');
      top.className = 'my-booking-item__top';

      var name = document.createElement('span');
      name.className = 'my-booking-item__service';
      name.textContent = service.label;

      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'my-booking-item__cancel';
      cancel.textContent = 'Cancelar';
      cancel.addEventListener('click', function () {
        cancelBooking(b.id);
      });

      top.appendChild(name);
      top.appendChild(cancel);

      var when = document.createElement('div');
      when.className = 'my-booking-item__when';
      when.textContent = formatDateLong(b.date) + ' às ' + b.time + ' · ' + b.nome;

      li.appendChild(top);
      li.appendChild(when);
      myBookingsListEl.appendChild(li);
    });
  }

  function cancelBooking(id) {
    var bookings = getBookings().filter(function (b) { return b.id !== id; });
    saveBookings(bookings);
    renderMyBookings();
    if (state.selectedDate) {
      var parts = state.selectedDate.split('-').map(Number);
      var dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      renderTimeSlots(state.selectedDate, dateObj);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Form submit                                                         */
  /* ------------------------------------------------------------------ */
  var form = document.getElementById('bookingForm');
  var formErrorEl = document.getElementById('formError');

  function setInvalid(el, invalid) {
    if (!el) return;
    el.classList.toggle('field--invalid', invalid);
  }

  function generateId() {
    return 'ag_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var serviceId = servicoSelect ? servicoSelect.value : '';
      var nomeInput = document.getElementById('nomeInput');
      var telefoneInput = document.getElementById('telefoneInput');
      var veiculoInput = document.getElementById('veiculoInput');
      var obsInput = document.getElementById('obsInput');

      var nome = nomeInput ? nomeInput.value.trim() : '';
      var telefone = telefoneInput ? telefoneInput.value.trim() : '';

      setInvalid(servicoSelect, !serviceId);
      setInvalid(nomeInput, !nome);
      setInvalid(telefoneInput, !telefone);

      var errors = [];
      if (!serviceId) errors.push('escolha um serviço');
      if (!state.selectedDate) errors.push('escolha uma data');
      if (!state.selectedTime) errors.push('escolha um horário');
      if (!nome) errors.push('informe seu nome');
      if (!telefone) errors.push('informe seu telefone');

      if (errors.length > 0) {
        if (formErrorEl) {
          formErrorEl.hidden = false;
          formErrorEl.textContent = 'Antes de confirmar: ' + errors.join(', ') + '.';
        }
        return;
      }

      if (formErrorEl) formErrorEl.hidden = true;

      // re-check capacity right before saving (race with other tabs/slot filling up)
      var currentCount = bookingsFor(state.selectedDate, state.selectedTime).length;
      if (currentCount >= BAYS_PER_SLOT) {
        if (formErrorEl) {
          formErrorEl.hidden = false;
          formErrorEl.textContent = 'Esse horário acabou de ficar indisponível. Escolha outro horário.';
        }
        var parts = state.selectedDate.split('-').map(Number);
        renderTimeSlots(state.selectedDate, new Date(parts[0], parts[1] - 1, parts[2]));
        return;
      }

      var booking = {
        id: generateId(),
        service: serviceId,
        date: state.selectedDate,
        time: state.selectedTime,
        nome: nome,
        telefone: telefone,
        veiculo: veiculoInput ? veiculoInput.value.trim() : '',
        observacoes: obsInput ? obsInput.value.trim() : '',
        createdAt: new Date().toISOString()
      };

      var bookings = getBookings();
      bookings.push(booking);
      saveBookings(bookings);

      renderMyBookings();
      var parts2 = state.selectedDate.split('-').map(Number);
      renderTimeSlots(state.selectedDate, new Date(parts2[0], parts2[1] - 1, parts2[2]));
      showConfirmation(booking);

      form.reset();
      state.selectedDate = null;
      state.selectedTime = null;
      renderDateChips();
      if (timeSlotsEl) {
        timeSlotsEl.innerHTML = '<p class="booking__placeholder">Selecione uma data para ver os horários disponíveis.</p>';
      }
      updateSummary();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Confirmation modal                                                  */
  /* ------------------------------------------------------------------ */
  var modalEl = document.getElementById('confirmModal');
  var modalDetailsEl = document.getElementById('modalDetails');
  var modalWhatsappEl = document.getElementById('modalWhatsapp');

  function showConfirmation(booking) {
    if (!modalEl) return;
    var service = SERVICES[booking.service] || { label: booking.service, price: '' };

    modalDetailsEl.innerHTML =
      '<div><span>Serviço</span><strong>' + service.label + '</strong></div>' +
      '<div><span>Data</span><strong>' + formatDateLong(booking.date) + '</strong></div>' +
      '<div><span>Horário</span><strong>' + booking.time + '</strong></div>' +
      '<div><span>Nome</span><strong>' + escapeHtml(booking.nome) + '</strong></div>' +
      '<div><span>Código</span><strong>' + booking.id.slice(-6).toUpperCase() + '</strong></div>';

    if (modalWhatsappEl) {
      var text = 'Olá! Acabei de agendar: ' + service.label + ' em ' + formatDateLong(booking.date) +
        ' às ' + booking.time + '. Nome: ' + booking.nome + '. Código: ' + booking.id.slice(-6).toUpperCase() + '.';
      modalWhatsappEl.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
    }

    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.style.overflow = '';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-close-modal]'), function (el) {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ------------------------------------------------------------------ */
  /* Mobile nav toggle                                                   */
  /* ------------------------------------------------------------------ */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });

    Array.prototype.forEach.call(mainNav.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Accordion (FAQ)                                                     */
  /* ------------------------------------------------------------------ */
  Array.prototype.forEach.call(document.querySelectorAll('.accordion__trigger'), function (trigger) {
    var panel = trigger.nextElementSibling;
    trigger.addEventListener('click', function () {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.style.maxHeight = expanded ? '0px' : panel.scrollHeight + 'px';
    });
  });

  /* ------------------------------------------------------------------ */
  /* Floating action button                                              */
  /* ------------------------------------------------------------------ */
  var fab = document.getElementById('fabAgendar');
  var heroEl = document.querySelector('.hero');

  if (fab) {
    fab.addEventListener('click', function () {
      var target = document.getElementById('agendamento');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    if (heroEl && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          fab.classList.toggle('is-visible', !entry.isIntersecting && window.innerWidth <= 860);
        });
      }, { threshold: 0 });
      observer.observe(heroEl);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  var footerYearEl = document.getElementById('footerYear');
  if (footerYearEl) footerYearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ */
  /* Init                                                                 */
  /* ------------------------------------------------------------------ */
  renderDateChips();
  renderMyBookings();
})();
