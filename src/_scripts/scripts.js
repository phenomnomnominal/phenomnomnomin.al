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
document.body.appendChild(canvas);
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
  start: Date.now(),
};

window.addEventListener('load', () => {
  mediaQuery.addEventListener('change', setAnimate);

  document.addEventListener('click', setTarget);
  document.addEventListener('mousemove', setTarget);

  window.addEventListener('wheel', setCeiling);

  requestAnimationFrame(render);
});

function setAnimate() {
  state.animate = !this.matches;
}

function setTarget(event) {
  if (!state.animate) {
    return;
  }

  if (!state.start) {
    state.start = Date.now();
    state.previous = state.current;
  }

  state.target = [event.clientX, event.clientY];
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

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

function lerp(x, y, a) {
  return x * (1 - a) + y * a;
}

function update(x, y) {
  const { innerWidth, innerHeight } = window;

  const centerOffsetX = x - innerWidth / 2;
  const centerOffsetY = y - innerHeight / 2;
  const angle = Math.atan(centerOffsetY / centerOffsetX);

  const invert = y > innerHeight / 2;

  root.style.setProperty('--invert', invert ? 1 : 0);

  root.style.setProperty(
    '--background-angle',
    `${(angle / (2 * Math.PI)) * 360}deg`
  );

  const weight = (y / innerHeight) * MAX_WEIGHT;

  root.style.setProperty('--font-weight', `${weight}`);

  const shadowOffset = (x / innerWidth) * MAX_SHADOW - MAX_SHADOW / 2;

  root.style.setProperty('--shadow-offset', `${shadowOffset}px`);

  const topX = CANVAS_SIZE / 2 + Math.cos(-Math.PI / 2 + angle) * CANVAS_SIZE;
  const topY = CANVAS_SIZE / 2 + Math.sin(-Math.PI / 2 + angle) * CANVAS_SIZE;
  const bottomX = CANVAS_SIZE / 2 + Math.cos(Math.PI / 2 + angle) * CANVAS_SIZE;
  const bottomY = CANVAS_SIZE / 2 + Math.sin(Math.PI / 2 + angle) * CANVAS_SIZE;
  const gradient = context.createLinearGradient(topX, topY, bottomX, bottomY);

  const computed = getComputedStyle(root);
  gradient.addColorStop(
    0,
    computed.getPropertyValue('--background-secondary-start')
  );
  gradient.addColorStop(
    0.5,
    computed.getPropertyValue('--background-secondary-end')
  );
  gradient.addColorStop(
    0.5,
    computed.getPropertyValue('--background-primary-start')
  );
  gradient.addColorStop(
    1,
    computed.getPropertyValue('--background-primary-end')
  );

  context.filter = `invert(${computed.getPropertyValue('--invert')})`;
  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  link.href = canvas.toDataURL('image/x-icon');

  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function setCeiling(event) {
  const { deltaY } = event;

  const isCeiling = document.documentElement.classList.contains('ceiling');
  if (deltaY < 0 && !isCeiling) {
    document.documentElement.classList.toggle('ceiling');
  } else if (deltaY > 0 && isCeiling) {
    document.documentElement.classList.remove('ceiling');
  }
}
