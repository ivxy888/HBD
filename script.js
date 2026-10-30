'use strict';
const $ = id => document.getElementById(id);
const els = {
  elevator: $('elevator'), penthouse: $('penthouse'), floor: $('floor'),
  indicator: $('indicator'), start: $('start'), sound: $('sound'),
  restart: $('restart'), loading: $('loading'), glow: $('glow')
};
const audio = { ambience: $('a-amb'), bell: $('a-bell'), music: $('a-music'), fireworks: $('a-fw') };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let timers = [], muted = false, started = false, audioContext = null, masterGain = null;
let width = window.innerWidth, height = window.innerHeight;
let audioFailures = new Set();

function later(fn, delay) { timers.push(setTimeout(fn, delay)); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function loadScene() {
  const img = new Image();
  img.onload = () => els.loading.classList.add('ready');
  img.onerror = () => {
    els.loading.classList.add('ready');
    console.error('Penthouse image could not be loaded. Check assets/images/penthouse-interior.png');
  };
  img.src = 'assets/images/penthouse-interior.png';
  if (img.complete && img.naturalWidth) els.loading.classList.add('ready');
}

function initAudio() {
  if (audioContext) { if (audioContext.state === 'suspended') audioContext.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioContext = new AC(); masterGain = audioContext.createGain();
  masterGain.gain.value = muted ? 0 : .85; masterGain.connect(audioContext.destination);
}
async function playAudio(key, volume = .5, loop = false) {
  const item = audio[key]; if (!item || audioFailures.has(key) || muted) return false;
  try { item.pause(); item.currentTime = 0; item.loop = loop; item.volume = volume; item.muted = muted; await item.play(); return true; }
  catch (_) { audioFailures.add(key); return false; }
}
function stopAudio() {
  Object.values(audio).forEach(a => { a.pause(); try { a.currentTime = 0; } catch (_) {} });
}
function fadeAudio(item, target, duration, pauseAtEnd = false) {
  if (!item || item.paused) return;
  const startVolume = item.volume, start = performance.now();
  const tick = now => {
    const p = Math.min(1, (now - start) / duration);
    item.volume = startVolume + (target - startVolume) * p;
    if (p < 1) requestAnimationFrame(tick); else if (pauseAtEnd) item.pause();
  };
  requestAnimationFrame(tick);
}
function synthBell() {
  if (!audioContext || muted) return;
  const t = audioContext.currentTime;
  [880, 1320, 1760].forEach((frequency, index) => {
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(.12 / (index + 1), t + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, t + 2.2);
    osc.connect(gain).connect(masterGain); osc.start(t); osc.stop(t + 2.3);
  });
}
async function ringBell() { if (!(await playAudio('bell', .75))) synthBell(); }
function startSoundtrack() {
  playAudio('music', .0, true).then(ok => { if (ok) fadeAudio(audio.music, .42, 6500); });
}
function updateSoundButton() {
  els.sound.classList.toggle('off', muted);
  els.sound.setAttribute('aria-pressed', String(muted));
  els.sound.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  els.sound.textContent = muted ? '♪' : '♫';
}
els.sound.addEventListener('click', async () => {
  muted = !muted; updateSoundButton();
  Object.values(audio).forEach(a => a.muted = muted);
  if (masterGain) masterGain.gain.setTargetAtTime(muted ? 0 : .85, audioContext.currentTime, .08);
  if (!muted && started) {
    initAudio();
    if (audio.music.paused) startSoundtrack();
  }
});


// Photographic-style fireworks overlay: rising rockets, bright bursts, falling embers and glow.
const fwCanvas = $('fireworks');
const fwCtx = fwCanvas ? fwCanvas.getContext('2d') : null;
let fwW = 0, fwH = 0, fwDpr = 1, fwRockets = [], fwSparks = [];
let fwFrame = 0, fwLastLaunch = 0, fwRunning = false;

function resizeFireworks() {
  if (!fwCanvas || !fwCtx) return;
  fwDpr = Math.min(window.devicePixelRatio || 1, 1.7);
  fwW = window.innerWidth; fwH = window.innerHeight;
  fwCanvas.width = Math.round(fwW * fwDpr);
  fwCanvas.height = Math.round(fwH * fwDpr);
  fwCanvas.style.width = fwW + 'px';
  fwCanvas.style.height = fwH + 'px';
  fwCtx.setTransform(fwDpr, 0, 0, fwDpr, 0, 0);
}
function launchRocket() {
  const x = fwW * (.12 + Math.random() * .76);
  const targetY = fwH * (.12 + Math.random() * .34);
  const startY = fwH * (.78 + Math.random() * .12);
  const hue = [34, 39, 45, 48, 27][Math.floor(Math.random() * 5)];
  fwRockets.push({
    x, y: startY, vx: (Math.random() - .5) * .55,
    vy: -(5.8 + Math.random() * 2.1),
    targetY, hue, trail: [], age: 0
  });
}
function burstRocket(r) {
  const count = 72 + Math.floor(Math.random() * 48);
  const baseSpeed = 1.2 + Math.random() * 2.2;
  const hue = r.hue;
  for (let i = 0; i < count; i++) {
    const angle = Math.PI * 2 * i / count + (Math.random() - .5) * .12;
    const speed = baseSpeed * (.35 + Math.random() * .95);
    fwSparks.push({
      x: r.x, y: r.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: .022 + Math.random() * .018,
      drag: .986 + Math.random() * .008,
      life: 75 + Math.random() * 65,
      maxLife: 140,
      size: .7 + Math.random() * 1.6,
      hue: hue + (Math.random() - .5) * 10,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  // A brief central flash makes the burst illuminate the sky.
  fwSparks.push({x:r.x,y:r.y,vx:0,vy:0,life:10,maxLife:10,size:26,hue,flash:true});
}
function drawFireworks() {
  if (!fwCtx) return;
  fwCtx.clearRect(0, 0, fwW, fwH);
  fwCtx.globalCompositeOperation = 'lighter';

  for (let i = fwRockets.length - 1; i >= 0; i--) {
    const r = fwRockets[i];
    r.trail.push({x:r.x,y:r.y});
    if (r.trail.length > 12) r.trail.shift();
    r.x += r.vx; r.y += r.vy; r.vy += .035; r.age++;
    for (let j = 0; j < r.trail.length; j++) {
      const p = r.trail[j], alpha = (j + 1) / r.trail.length;
      fwCtx.beginPath();
      fwCtx.fillStyle = `rgba(255,${Math.round(185 + alpha*55)},${Math.round(105 + alpha*100)},${alpha*.5})`;
      fwCtx.arc(p.x,p.y,.7 + alpha*1.05,0,Math.PI*2); fwCtx.fill();
    }
    fwCtx.beginPath();
    fwCtx.fillStyle = 'rgba(255,245,218,.98)';
    fwCtx.shadowColor = `hsla(${r.hue},100%,70%,.95)`;
    fwCtx.shadowBlur = 18;
    fwCtx.arc(r.x,r.y,2.1,0,Math.PI*2); fwCtx.fill();
    fwCtx.shadowBlur = 0;
    if (r.y <= r.targetY || r.vy >= -.3 || r.age > 150) {
      burstRocket(r); fwRockets.splice(i,1);
    }
  }

  for (let i = fwSparks.length - 1; i >= 0; i--) {
    const s = fwSparks[i];
    if (s.flash) {
      const alpha = Math.max(0,s.life/s.maxLife);
      const grad = fwCtx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.size);
      grad.addColorStop(0,`rgba(255,248,225,${alpha*.85})`);
      grad.addColorStop(.25,`hsla(${s.hue},100%,70%,${alpha*.38})`);
      grad.addColorStop(1,`hsla(${s.hue},100%,60%,0)`);
      fwCtx.fillStyle=grad; fwCtx.fillRect(s.x-s.size,s.y-s.size,s.size*2,s.size*2);
      s.life--;
    } else {
      s.vx *= s.drag; s.vy = s.vy*s.drag + s.gravity;
      s.x += s.vx; s.y += s.vy; s.life--;
      const alpha = Math.max(0,s.life/s.maxLife);
      s.twinkle += .18;
      const flicker = .68 + Math.sin(s.twinkle)*.32;
      fwCtx.beginPath();
      fwCtx.fillStyle = `hsla(${s.hue},95%,${65 + Math.random()*22}%,${alpha*flicker})`;
      fwCtx.shadowColor = `hsla(${s.hue},100%,70%,${alpha})`;
      fwCtx.shadowBlur = 8;
      fwCtx.arc(s.x,s.y,s.size*(.55+alpha*.5),0,Math.PI*2); fwCtx.fill();
      fwCtx.shadowBlur = 0;
    }
    if (s.life <= 0) fwSparks.splice(i,1);
  }
  fwCtx.globalCompositeOperation = 'source-over';
  fwFrame = requestAnimationFrame(drawFireworks);
}
function startFireworks() {
  if (!fwCanvas || !fwCtx || reducedMotion) return;
  stopFireworks();
  resizeFireworks();
  fwRunning = true; fwLastLaunch = performance.now() - 1000;
  fwRockets = []; fwSparks = [];
  fwFrame = requestAnimationFrame(drawFireworks);
}
function stopFireworks() {
  if (fwFrame) cancelAnimationFrame(fwFrame);
  fwFrame = 0; fwRunning = false;
  fwRockets = []; fwSparks = [];
  if (fwCtx) fwCtx.clearRect(0,0,fwW,fwH);
}
function fireworksLaunchLoop(now) {
  if (!fwRunning) return;
  if (now - fwLastLaunch > 1150 + Math.random()*900) {
    launchRocket(); fwLastLaunch = now;
  }
  requestAnimationFrame(fireworksLaunchLoop);
}

function reset() {
  clearTimers(); started = false;
  els.glow.style.opacity = 0; els.penthouse.classList.remove('celebration'); stopFireworks();
  els.elevator.className = ''; els.penthouse.classList.remove('fly');
  els.floor.textContent = '1'; els.indicator.classList.remove('arrived');
  els.start.classList.remove('hide'); stopAudio();
}
function begin() {
  reset(); started = true; initAudio(); updateSoundButton();
  playAudio('ambience', .36, true);
  els.start.classList.add('hide');
  ['1', '6', '12', '18', '25', '31', '37', '43', 'PH'].forEach((value, index) => later(() => { els.floor.textContent = value; }, 450 + index * 440));
  later(() => { ringBell(); els.indicator.classList.add('arrived'); }, 4200);
  later(() => { els.elevator.classList.add('open'); fadeAudio(audio.ambience, 0, 2600, true); }, 5000);
  later(() => { els.elevator.classList.add('walk'); els.penthouse.classList.add('fly'); }, 6200);
  later(() => { els.elevator.classList.add('gone'); }, 9300);
  later(() => { startSoundtrack(); els.penthouse.classList.add('celebration'); startFireworks(); fireworksLaunchLoop(performance.now()); }, 11200);
}
els.start.addEventListener('click', begin);
els.restart.addEventListener('click', begin);
window.addEventListener('pagehide', () => { started = false; stopAudio(); });
window.addEventListener('resize', () => { width = window.innerWidth; height = window.innerHeight; resizeFireworks(); });
resizeFireworks(); loadScene(); updateSoundButton();
