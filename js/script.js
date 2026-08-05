// Menu mobile
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('is-open');
  navToggle.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Animação de entrada ao rolar a página
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach((el) => revealObserver.observe(el));

// Modal de exemplos por serviço
const SERVICES = {
  'social-media': {
    num: '01',
    title: 'Social Media',
    desc: 'Planejamento estratégico de conteúdo, gestão de redes e calendário editorial pensado para o crescimento real da sua marca.',
    kind: 'photo',
    count: 6,
    labelPrefix: 'Post',
  },
  storymaker: {
    num: '02',
    title: 'Storymaker',
    desc: 'Criação de stories dinâmicos e autênticos que aproximam sua marca do público, dia após dia.',
    kind: 'story',
    count: 4,
    labelPrefix: 'Story',
  },
  videomaker: {
    num: '03',
    title: 'Videomaker',
    desc: 'Produção e edição de vídeos que comunicam com clareza, ritmo e encantam quem assiste.',
    kind: 'video',
    count: 3,
    labelPrefix: 'Vídeo',
  },
  'registros-organicos': {
    num: '04',
    title: 'Registros Orgânicos',
    desc: 'Fotos autênticas feitas no celular, capturando o dia a dia da sua marca com naturalidade e verdade.',
    kind: 'photo',
    count: 6,
    labelPrefix: 'Registro',
  },
  'criacao-artes': {
    num: '05',
    title: 'Criação de Artes',
    desc: 'Peças gráficas exclusivas para feed, stories e materiais de divulgação, com identidade visual única.',
    kind: 'photo',
    count: 6,
    labelPrefix: 'Arte',
  },
};

const modal = document.getElementById('service-modal');
const modalPanel = modal.querySelector('.service-modal-panel');
const modalNum = document.getElementById('modal-num');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalGallery = document.getElementById('modal-gallery');
const serviceCards = document.querySelectorAll('.service-card[data-service]');

let lastTrigger = null;

function buildGallery(service) {
  modalGallery.innerHTML = '';
  for (let i = 1; i <= service.count; i++) {
    const tile = document.createElement('div');
    const gradientClass = `ph-${((i - 1) % 6) + 1}`;
    tile.className = `media-tile media-${service.kind} ${gradientClass}`;

    if (service.kind === 'video') {
      const play = document.createElement('span');
      play.className = 'media-play';
      tile.appendChild(play);
    }

    const label = document.createElement('span');
    label.className = 'media-tile-label';
    label.textContent = `${service.labelPrefix} ${String(i).padStart(2, '0')}`;
    tile.appendChild(label);

    modalGallery.appendChild(tile);
  }
}

function openModal(serviceKey, triggerEl) {
  const service = SERVICES[serviceKey];
  if (!service) return;

  lastTrigger = triggerEl;
  modalNum.textContent = service.num;
  modalTitle.textContent = service.title;
  modalDesc.textContent = service.desc;
  buildGallery(service);

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  modalPanel.querySelector('.service-modal-close').focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  if (lastTrigger) lastTrigger.focus();
}

serviceCards.forEach((card) => {
  card.addEventListener('click', () => openModal(card.dataset.service, card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(card.dataset.service, card);
    }
  });
});

modal.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', closeModal);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});
