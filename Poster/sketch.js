// BLINK AND YOU'LL MISS IT. A3 Animated Poster

const PW = 560, PH = 792;

const passage = [
  "if","you're","reading","this,","it's","already","too","late.",
  "there","isn't","enough","time,","nor","enough","words","to","tell","you.",
  "what","matters","appears","only","when","you're","not","looking."
];

const FONT_SIZE   = 13;
const CHAR_WIDTH  = 7.6;
const WORD_GAP    = 6;
const LINE_HEIGHT = 24;
const BLOCK_WIDTH = 290;

let appState     = 'LOADING';
let loadingAlpha = 255;
let words        = [];
let redDelay     = 0;
let redAlpha     = 0;
let isRed        = false;
let fi           = 0;


function passageTop() { return PH * 0.055 + PW * 0.86 * 0.70 + PH * 0.03; }
function titleY()     { return PH * 0.80; }


function initWords() {
  words = [];
  let lines = [], cur = [], col = 0;
  for (let i = 0; i < passage.length; i++) {
    let ww = passage[i].length * CHAR_WIDTH + WORD_GAP;
    if (col + ww > BLOCK_WIDTH && cur.length) { lines.push(cur); cur = []; col = 0; }
    cur.push({ txt: passage[i], width: ww });
    col += ww;
  }
  if (cur.length) lines.push(cur);

  let blockTop = passageTop() + ((titleY() - passageTop()) - lines.length * LINE_HEIGHT) / 2;
  for (let l = 0; l < lines.length; l++) {
    let lw = lines[l].reduce((s, w) => s + w.width, 0);
    let x  = (PW - lw) / 2;
    let y  = blockTop + l * LINE_HEIGHT;
    for (let w = 0; w < lines[l].length; w++) {
      words.push({
        txt:       lines[l][w].txt,
        x:         x + lines[l][w].width / 2,
        y,
        opacity:   random(200, 255),
        decayRate: random(0.15, 0.45),
        alive:     true
      });
      x += lines[l][w].width;
    }
  }
}

function updateWords() {
  for (let w of words) {
    if (!w.alive) continue;
    w.opacity -= w.decayRate;
    if (w.opacity <= 0) { w.opacity = 0; w.alive = false; }
  }
}

function drawWords() {
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(FONT_SIZE);
  noStroke();
  for (let w of words) {
    if (!w.alive) continue;
    fill(255, 255, 255, w.opacity);
    text(w.txt, w.x - textWidth(w.txt) / 2, w.y);
  }
}

function drawTitle() {
  textFont('Courier New');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(PW * 0.10);
  let ty = titleY(), lh = PW * 0.10 * 1.06;
  fill(150, 0, 0, 65);
  text('BLINK AND',    PW / 2 + 4, ty + 4);
  text("YOU'LL MISS IT", PW / 2 + 4, ty + lh + 4);
  fill(255);
  text('BLINK AND',    PW / 2, ty);
  text("YOU'LL MISS IT", PW / 2, ty + lh);
  textStyle(NORMAL);
}

function drawScreen() {
  let tx = PW * 0.07,  ty = PH * 0.055;
  let tw = PW * 0.86,  th = PW * 0.86 * 0.70;
  let sx = tx + tw * 0.05, sy = ty + th * 0.07;
  let sw = tw * 0.90,      sh = th * 0.86;

  // TV bezel — darkened to blend with black background
  noStroke();
  fill(6, 6, 6);
  rect(tx, ty, tw, th);
  stroke(18, 18, 18); strokeWeight(1); noFill();
  rect(tx, ty, tw, th); noStroke();

  // screen content clipped
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(sx, sy, sw, sh);
  drawingContext.clip();

  fill(isRed ? 155 : 218, 0, 0);
  rect(sx, sy, sw, sh);

  // red static grain
  let r = (function(seed) {
    let a = seed;
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  })(fi * 7);

  for (let i = 0; i < 2600; i++) {
    let br = 55 + r() * 130;
    fill(br, r() * 12, r() * 12, 160 + r() * 85);
    rect(sx + r() * sw, sy + r() * sh, r() * 2.5 + 0.4, r() * 2.5 + 0.4);
  }

  // scanlines
  for (let y = sy; y < sy + sh; y += 5) {
    fill(0, 0, 0, 22 + random(0, 18));
    rect(sx, y, sw, 1.5);
  }

  // INITIALISING text
  fill(0, 0, 0, 215 * random(0.65, 1.0));
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(sw * 0.068);
  text('INITIALISING', sx + sw / 2, sy + sh / 2);
  textStyle(NORMAL);

  // inner vignette
  for (let i = 0; i < 14; i++) {
    fill(0, 0, 0, 18 * (1 - i / 14));
    rect(sx + i, sy + i, sw - i * 2, sh - i * 2);
  }

  fill(255, 255, 255, 7);
  ellipse(sx + sw * 0.25, sy + sh * 0.15, sw * 0.38, sh * 0.13);
  drawingContext.restore();

  // red glow spill below TV
  let cx = tx + tw / 2, spillY = ty + th;
  for (let i = 26; i > 0; i--) {
    let t = i / 26;
    fill(90, 0, 0, t * 20);
    rect(cx - tw * 0.55 * (1 - t * 0.4), spillY,
         tw * 1.1 * (1 - t * 0.4), (PH - spillY) * (1 - t * 0.7));
  }
}

function drawGlitch() {
  if (frameCount % floor(random(30, 60)) === 0) {
    fill(random(255), random(255), random(255), random(50, 100));
    rect(0, 0, PW, PH);
  }
  for (let i = 0; i < 4; i++) {
    fill(random(255), random(255), random(255));
    rect(random(PW), random(PH), random(1, 5), random(1, 5));
  }
  for (let y = 0; y < PH; y += 9) {
    fill(0, 0, 0, random(0, 40));
    rect(0, y, PW, 2);
  }
  for (let i = 0; i < 5; i++) {
    fill(random(255), random(80, 100), 0, random(0, 50));
    rect(0, random(PH), PW, random(2, 10));
  }
}

function setup() {
  createCanvas(PW, PH);
  frameRate(30);
  textFont('Courier New');
  noStroke();
}

function draw() {
  fi++;
  background(0);
  drawScreen();
  drawWords();
  drawTitle();
  drawGlitch();

  if (appState === 'LOADING') {
    fill(0, 0, 0, loadingAlpha);
    rect(0, 0, PW, PH);
    loadingAlpha -= 3;
    if (loadingAlpha <= 0) { appState = 'RUNNING'; initWords(); }
    return;
  }

  updateWords();

  if (!isRed && words.filter(w => w.alive).length === 0) {
    redDelay++;
    if (redDelay > 180) isRed = true;
  }

  if (isRed) {
    redAlpha = min(255, redAlpha + 12);
    fill(160, 0, 0, redAlpha * 0.85);
    rect(0, 0, PW, PH);
    if (redAlpha >= 255) { isRed = false; redAlpha = 0; redDelay = 0; initWords(); }
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') saveCanvas('blink_poster', 'png');
}
