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

update(-0.5, -0.5);

window.addEventListener('load', () => {
  mediaQuery.addEventListener('change', setAnimate);
  window.addEventListener('scroll', setCeiling);

  document.addEventListener('click', initBackground, {
    once: true,
  });

  requestAnimationFrame(render);
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

function render() {
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
    update(lerpX, lerpY);

    state.current = [lerpX, lerpY];
  }

  requestAnimationFrame(render);
}

function update(x, y) {
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

  const computed = getComputedStyle(root);
  gradient.addColorStop(
    0,
    computed.getPropertyValue('--header-secondary-start')
  );
  gradient.addColorStop(
    0.5,
    computed.getPropertyValue('--header-secondary-end')
  );
  gradient.addColorStop(
    0.5,
    computed.getPropertyValue('--header-primary-start')
  );
  gradient.addColorStop(1, computed.getPropertyValue('--header-primary-end'));

  context.filter = `invert(${computed.getPropertyValue('--invert')})`;
  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  link.href = canvas.toDataURL('image/x-icon');

  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
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
