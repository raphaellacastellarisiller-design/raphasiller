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
// Só "arma" a animação (deixando invisível) se o navegador suportar
// IntersectionObserver — assim o conteúdo nunca fica preso invisível
// caso o JS não rode (ex.: preview rápido do iOS).
if ('IntersectionObserver' in window) {
  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach((el) => el.classList.add('reveal-armed'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach((el) => revealObserver.observe(el));
}

// Modal de exemplos por serviço
const SERVICES = {
  'social-media': {
    num: '01',
    title: 'Social Media',
    desc: 'Planejamento estratégico, captação e edição de conteúdo, gestão de redes e calendário editorial para o crescimento real da sua marca.',
    kind: 'photo',
    images: [
      'assets/images/social-media/post-01.jpg',
      'assets/images/social-media/post-02.jpg',
      'assets/images/social-media/post-03.jpg',
      'assets/images/social-media/post-04.jpg',
      'assets/images/social-media/post-05.jpg',
      'assets/images/social-media/post-06.jpg',
      'assets/images/social-media/post-07.jpg',
      { video: 'assets/videos/social-media/post-08.mp4', poster: 'assets/videos/social-media/post-08-poster.jpg' },
      { video: 'assets/videos/social-media/post-09.mp4', poster: 'assets/videos/social-media/post-09-poster.jpg' },
    ],
    labelPrefix: 'Post',
  },
  storymaker: {
    num: '02',
    title: 'Storymaker',
    sub: 'Cobertura de eventos',
    desc: 'Eternizando os momentos mágicos do seu evento em tempo real, direto no story do Instagram.',
    kind: 'story',
    videos: [
      { src: 'assets/videos/storymaker/story-01.mp4', poster: 'assets/videos/storymaker/story-01-poster.jpg', wide: true },
      { src: 'assets/videos/storymaker/story-02.mp4', poster: 'assets/videos/storymaker/story-02-poster.jpg', wide: true },
      { src: 'assets/videos/storymaker/story-03.mp4', poster: 'assets/videos/storymaker/story-03-poster.jpg' },
      { src: 'assets/videos/storymaker/story-04.mp4', poster: 'assets/videos/storymaker/story-04-poster.jpg' },
    ],
    labelPrefix: 'Story',
  },
  'registros-organicos': {
    num: '03',
    title: 'Registros Orgânicos',
    desc: 'Fotos autênticas feitas no celular, para o dia a dia da sua marca, eventos ou ensaios fotográficos — sempre com naturalidade e verdade.',
    kind: 'photo',
    images: [
      'assets/images/registros/aniversario-01.jpg',
      'assets/images/registros/aniversario-02.jpg',
      'assets/images/registros/casamento-01.jpg',
      'assets/images/registros/casamento-02.jpg',
      'assets/images/registros/casamento-03.jpg',
      'assets/images/registros/casamento-04.jpg',
    ],
    labelPrefix: 'Registro',
  },
};

const modal = document.getElementById('service-modal');
const modalPanel = modal.querySelector('.service-modal-panel');
const modalNum = document.getElementById('modal-num');
const modalTitle = document.getElementById('modal-title');
const modalSub = document.getElementById('modal-sub');
const modalDesc = document.getElementById('modal-desc');
const modalGallery = document.getElementById('modal-gallery');

let lastTrigger = null;

function buildGallery(service) {
  modalGallery.innerHTML = '';
  modalGallery.classList.toggle('gallery-stacked', service.kind === 'story');
  const total = service.images ? service.images.length
    : service.videos ? service.videos.length
    : service.count;

  const photoItems = service.images ? service.images.filter((item) => typeof item === 'string') : [];

  for (let i = 1; i <= total; i++) {
    const tile = document.createElement('div');
    tile.className = `media-tile media-${service.kind}`;
    const item = service.images ? service.images[i - 1] : null;

    if (item && typeof item === 'object' && item.video) {
      const video = document.createElement('video');
      video.src = item.video;
      video.poster = item.poster;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      tile.appendChild(video);
      tile.classList.remove(`media-${service.kind}`);
      tile.classList.add('media-video', 'media-tall');
    } else if (service.images) {
      const img = document.createElement('img');
      img.src = item;
      img.alt = `${service.title} — ${service.labelPrefix} ${String(i).padStart(2, '0')}`;
      img.loading = 'lazy';
      tile.appendChild(img);

      tile.classList.add('media-tile-clickable');
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      const photoIndex = photoItems.indexOf(item);
      const openThisPhoto = () => openLightbox(photoItems, photoIndex, tile);
      tile.addEventListener('click', openThisPhoto);
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openThisPhoto();
        }
      });
    } else if (service.videos) {
      const video = document.createElement('video');
      video.src = service.videos[i - 1].src;
      video.poster = service.videos[i - 1].poster;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      tile.appendChild(video);
      if (service.videos[i - 1].wide) tile.classList.add('media-story-wide');
    } else {
      tile.classList.add(`ph-${((i - 1) % 6) + 1}`);
    }

    if (service.kind === 'video') {
      const play = document.createElement('span');
      play.className = 'media-play';
      tile.appendChild(play);
    }

    if (!service.videos && !(item && typeof item === 'object' && item.video)) {
      const label = document.createElement('span');
      label.className = 'media-tile-label';
      label.textContent = `${service.labelPrefix} ${String(i).padStart(2, '0')}`;
      tile.appendChild(label);
    }

    modalGallery.appendChild(tile);
  }
}

function openModal(serviceKey, triggerEl) {
  const service = SERVICES[serviceKey];
  if (!service) return;

  lastTrigger = triggerEl;
  modalNum.textContent = service.num;
  modalTitle.textContent = service.title;
  modalSub.textContent = service.sub || '';
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

// Pastinha de serviços (abas)
const folderTabs = document.querySelectorAll('.folder-tab[data-service]');
const folderNum = document.getElementById('folder-num');
const folderTitle = document.getElementById('folder-title');
const folderSub = document.getElementById('folder-sub');
const folderDesc = document.getElementById('folder-desc');
const folderCta = document.getElementById('folder-cta');

let activeServiceKey = 'social-media';

function setActiveTab(serviceKey) {
  const service = SERVICES[serviceKey];
  if (!service) return;
  activeServiceKey = serviceKey;

  folderTabs.forEach((tab) => {
    tab.setAttribute('aria-selected', tab.dataset.service === serviceKey ? 'true' : 'false');
  });

  folderNum.textContent = service.num;
  folderTitle.textContent = service.title;
  folderSub.textContent = service.sub || '';
  folderSub.hidden = !service.sub;
  folderDesc.textContent = service.desc;
}

folderTabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveTab(tab.dataset.service));
});

folderCta.addEventListener('click', () => openModal(activeServiceKey, folderCta));

modal.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', closeModal);
});

// Lightbox: ampliar fotos (portfólio + galeria do modal)
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

let lightboxGroup = [];
let lightboxIndex = 0;
let lastLightboxTrigger = null;

function normalizeLightboxItem(item) {
  return typeof item === 'string' ? { src: item, alt: '' } : item;
}

function showLightboxImage() {
  const item = normalizeLightboxItem(lightboxGroup[lightboxIndex]);
  lightboxImg.src = item.src;
  lightboxImg.alt = item.alt;

  const multiple = lightboxGroup.length > 1;
  lightboxPrev.hidden = !multiple;
  lightboxNext.hidden = !multiple;
  lightboxCounter.textContent = multiple ? `${lightboxIndex + 1} / ${lightboxGroup.length}` : '';
}

function openLightbox(group, index, triggerEl) {
  lightboxGroup = group;
  lightboxIndex = index;
  lastLightboxTrigger = triggerEl;

  showLightboxImage();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lightbox.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.src = '';
  document.body.style.overflow = modal.hidden ? '' : 'hidden';
  if (lastLightboxTrigger) lastLightboxTrigger.focus();
}

function lightboxStep(delta) {
  lightboxIndex = (lightboxIndex + delta + lightboxGroup.length) % lightboxGroup.length;
  showLightboxImage();
}

lightbox.querySelectorAll('[data-lightbox-close]').forEach((el) => {
  el.addEventListener('click', closeLightbox);
});
lightboxPrev.addEventListener('click', () => lightboxStep(-1));
lightboxNext.addEventListener('click', () => lightboxStep(1));

// Portfólio: fotos clicáveis
const portfolioTriggers = document.querySelectorAll('.lightbox-trigger[data-lightbox-group="portfolio"]');
const portfolioPhotos = Array.from(portfolioTriggers).map((el) => {
  const img = el.querySelector('img');
  return { src: img.src, alt: img.alt };
});

portfolioTriggers.forEach((el, index) => {
  const open = () => openLightbox(portfolioPhotos, index, el);
  el.addEventListener('click', open);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!lightbox.hidden) {
      closeLightbox();
    } else if (!modal.hidden) {
      closeModal();
    }
    return;
  }
  if (!lightbox.hidden && lightboxGroup.length > 1) {
    if (e.key === 'ArrowLeft') lightboxStep(-1);
    if (e.key === 'ArrowRight') lightboxStep(1);
  }
});
