const tracks = {
  exploration: new Audio("/assets/audio/exploration.ogg"),
  battle: new Audio("/assets/audio/battle.ogg"),
};
for (const [name, a] of Object.entries(tracks)) {
  a.loop = true;
  a.preload = "none";
  a.volume = 0;
  a.hidden = true;
  a.dataset.bgm = name;
  document.body.append(a);
}
const coin = new Audio("/assets/audio/coin-jingle-short.ogg");
coin.preload = "auto";
coin.volume = 0.12;
coin.hidden = true;
document.body.append(coin);
let active = null,
  wanted = null,
  enabled = false,
  muted = false,
  fade = null,
  context,
  lastCoin = 0;
function transition() {
  clearInterval(fade);
  const old = active,
    target = enabled && !muted ? wanted : null;
  let n = 0;
  fade = setInterval(() => {
    n++;
    if (old) tracks[old].volume = Math.max(0, 0.35 * (1 - n / 8));
    if (n === 8) {
      clearInterval(fade);
      for (const a of Object.values(tracks)) {
        a.pause();
        a.volume = 0;
      }
      active = target;
      if (!target) return;
      tracks[target].play().catch(() => {});
      let up = 0;
      fade = setInterval(() => {
        up++;
        tracks[target].volume = Math.min(0.35, (0.35 * up) / 8);
        if (up === 8) clearInterval(fade);
      }, 35);
    }
  }, 35);
}
export const music = {
  start(value) {
    clearInterval(fade);
    for (const a of Object.values(tracks)) {
      a.pause();
      a.volume = 0;
    }
    coin.pause();
    muted = value;
    enabled = true;
    wanted = "exploration";
    active = null;
    if (!muted) {
      active = "exploration";
      tracks.exploration.play().catch(() => {});
      let n = 0;
      fade = setInterval(() => {
        tracks.exploration.volume = Math.min(0.35, (0.35 * ++n) / 8);
        if (n === 8) clearInterval(fade);
      }, 35);
    }
    try {
      context ??= new AudioContext();
      context.resume();
    } catch {}
  },
  mode(value) {
    if (wanted === value) return;
    wanted = value;
    transition();
  },
  mute(value) {
    muted = value;
    if (value) {
      coin.pause();
      coin.currentTime = 0;
    }
    transition();
  },
  stop() {
    enabled = false;
    wanted = null;
    coin.pause();
    transition();
  },
  effect(kind) {
    if (muted) return;
    if (kind === "coin") {
      const now = Date.now();
      if (now - lastCoin < 450) return;
      lastCoin = now;
      coin.currentTime = 0;
      coin.play().catch(() => {});
      return;
    }
    if (!context) return;
    const osc = context.createOscillator(),
      amp = context.createGain();
    osc.connect(amp);
    amp.connect(context.destination);
    osc.type = "sine";
    const hz =
      {
        attack: 240,
        damage: 120,
        heal: 660,
        xp: 740,
        defeat: 90,
        artifact: 990,
        click: 400,
      }[kind] || 400;
    osc.frequency.setValueAtTime(hz, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      hz * 0.7,
      context.currentTime + 0.1,
    );
    amp.gain.setValueAtTime(0.06, context.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
    osc.start();
    osc.stop(context.currentTime + 0.16);
  },
};
