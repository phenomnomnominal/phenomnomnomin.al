const html = document.documentElement;
const body = document.querySelector('body');
const root = document.querySelector(':root');

const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const MAX_WEIGHT = 900;
const MAX_SHADOW = 30;

const TRANSITION_TIME = 2000;

const CANVAS_SIZE = 64;
const canvas = document.createElement('canvas');
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
const context = canvas.getContext('2d');

const link = document.createElement('link');
link.type = 'image/x-icon';
link.rel = 'shortcut icon';
const head = document.querySelector('head');
head.appendChild(link);

const state = {
  animate: !mediaQuery.matches,

  previous: [0, 0],
  current: [0, 0],
  target: [300, 300],
  start: null,
};

window.addEventListener('load', () => {
  mediaQuery.addEventListener('change', setAnimate);
  window.addEventListener('scroll', setCeiling);

  document.addEventListener('click', initBackground, {
    once: true,
  });

  render(-0.5, -0.5);

  requestAnimationFrame(update);
});

async function initBackground() {
  if (isFunction(DeviceOrientationEvent.requestPermission)) {
    const permissionState = await DeviceOrientationEvent.requestPermission();
    if (permissionState === 'granted') {
      window.addEventListener('deviceorientation', setTargetFromOrientation);
      return;
    }
  }

  document.addEventListener('mousemove', setTargetFromMouse);
}

function setAnimate() {
  state.animate = !this.matches;
}

function setCeiling() {
  const { scrollY } = window;
  html.classList.toggle('ceiling', scrollY <= 0);
}

function setTarget(x, y) {
  if (!state.animate) {
    return;
  }

  if (!state.start) {
    state.start = Date.now();
    state.previous = state.current;
  }

  state.target = [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

function setTargetFromMouse(event) {
  const { innerWidth, innerHeight } = window;
  const centerOffsetX = event.clientX - innerWidth / 2;
  const centerOffsetY = event.clientY - innerHeight / 2;
  setTarget(centerOffsetX / innerWidth, centerOffsetY / innerHeight);
}

function setTargetFromOrientation(event) {
  const { beta, gamma } = event;

  const cappedBeta = Math.max(Math.min(beta, 90), -90);
  setTarget(gamma / 90, cappedBeta / 90);
}

function update() {
  const { start } = state;

  if (start) {
    const [previousX, previousY] = state.previous;
    const [targetX, targetY] = state.target;

    const delta = (Date.now() - start) / TRANSITION_TIME;
    if (delta >= 1) {
      state.start = null;
    }

    const lerpX = lerp(previousX, targetX, easeInOut(delta));
    const lerpY = lerp(previousY, targetY, easeInOut(delta));
    render(lerpX, lerpY);

    state.current = [lerpX, lerpY];
  }

  requestAnimationFrame(update);
}

function render(x, y) {
  const invert = y > 0;

  root.style.setProperty('--invert', invert ? 1 : 0);

  const angle = Math.atan(x != 0 ? y / x : 0);

  const headerAngle = (angle / (2 * Math.PI)) * 360;
  root.style.setProperty('--header-angle', `${headerAngle}deg`);
  const mainAngle = (angle / (2 * Math.PI)) * 360 + 60;
  root.style.setProperty('--main-angle', `${mainAngle}deg`);

  const weight = (y + 0.5) * MAX_WEIGHT;

  root.style.setProperty('--font-weight', `${weight}`);

  const shadowOffset = (x + 0.5) * MAX_SHADOW - MAX_SHADOW / 2;

  root.style.setProperty('--shadow-offset', `${shadowOffset}px`);

  const topX = CANVAS_SIZE / 2 + Math.cos(-Math.PI / 2 + angle) * CANVAS_SIZE;
  const topY = CANVAS_SIZE / 2 + Math.sin(-Math.PI / 2 + angle) * CANVAS_SIZE;
  const bottomX = CANVAS_SIZE / 2 + Math.cos(Math.PI / 2 + angle) * CANVAS_SIZE;
  const bottomY = CANVAS_SIZE / 2 + Math.sin(Math.PI / 2 + angle) * CANVAS_SIZE;
  const gradient = context.createLinearGradient(topX, topY, bottomX, bottomY);

  const [primaryStart, primaryEnd, secondaryStart, secondaryEnd] =
    getGradientColours();
  gradient.addColorStop(0, primaryStart);
  gradient.addColorStop(0.5, primaryEnd);
  gradient.addColorStop(0.5, secondaryStart);
  gradient.addColorStop(1, secondaryEnd);

  context.filter = `invert(${invert ? 1 : 0})`;
  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  link.href = canvas.toDataURL('image/x-icon');
}

function getGradientColours() {
  if (!getGradientColours.cached) {
    const computed = getComputedStyle(root);
    getGradientColours.cached = [
      computed.getPropertyValue('--header-secondary-start'),
      computed.getPropertyValue('--header-secondary-end'),
      computed.getPropertyValue('--header-primary-start'),
      computed.getPropertyValue('--header-primary-end'),
    ];
  }
  return getGradientColours.cached;
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

function lerp(x, y, a) {
  return x * (1 - a) + y * a;
}

function isFunction(func) {
  return typeof func === 'function';
}
