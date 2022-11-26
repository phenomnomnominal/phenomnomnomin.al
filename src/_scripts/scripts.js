const body = document.querySelector('body');
const root = document.querySelector(':root');

const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
  animate: !mediaQuery.matches,

  previous: [0, 0],
  current: [0, 0],
  target: [300, 300],
  step: 0,
};

mediaQuery.addEventListener('change', () => {
  state.animate = !mediaQuery.matches;
});

document.addEventListener('click', setTarget);
document.addEventListener('mousemove', setTarget);

function setTarget() {
  if (!state.animate) {
    return;
  }

  state.step = 0;
  state.previous = state.current;
  state.target = [event.clientX, event.clientY];
}

requestAnimationFrame(render);

function render() {
  const { step } = state;

  if (step <= 1) {
    const [previousX, previousY] = state.previous;
    const [targetX, targetY] = state.target;

    const nextStep = step + 0.005;
    const lerpX = lerp(previousX, targetX, easeInOut(nextStep));
    const lerpY = lerp(previousY, targetY, easeInOut(nextStep));
    update(lerpX, lerpY);

    state.step = nextStep;
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
  const angle = (Math.atan(centerOffsetY / centerOffsetX) * 360) / Math.PI - 90;

  const invert = y > innerHeight / 2;

  root.style.setProperty('--invert', invert ? 1 : 0);

  root.style.setProperty('--background-angle', `${angle}deg`);

  const weight = (y / innerHeight) * 900;

  root.style.setProperty('--font-weight', `${weight}`);

  const shadowOffset = (x / innerWidth) * 20 - 10;

  root.style.setProperty('--shadow-offset', `${shadowOffset}px`);
}

window.addEventListener('wheel', (e) => {
  const { deltaY } = e;

  const isCeiling = document.documentElement.classList.contains('ceiling');
  if (deltaY < 0 && !isCeiling) {
    document.documentElement.classList.toggle('ceiling');
  } else if (deltaY > 0 && isCeiling) {
    document.documentElement.classList.remove('ceiling');
  }
});
