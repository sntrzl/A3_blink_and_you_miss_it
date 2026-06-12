// BLINK AND YOU'LL MISS IT
  // Base blink detection adapted from handsfree.js sketch "blinking_thisoneworks" by bevbevlau
 // Link: https://editor.p5js.org/bevbevlau/sketches/AbSZJy-Gc

// TV filter adapted from Glitch_TV code by Karen ann Donnachie and Andy Simionato

let handsfree;
let webcam;

// detects blinking
  let eyeBlinkHistory = [];
  const historyLen = 320;
  let runningAvg = 0;
  var blinkActivation = 0;
  let blinkCooldown = 0;

// appstate
    let appState = 'LOADING';
    let loadingAlpha = 255;
    let handsfreeReady = false;

// set up word system
      let words = [];
      let redScreenAlpha = 0;
      let redScreenDelay = 0;

// hidden text when blinking
const hiddenSequences = [
  ["the", "answer", "is", "rig—"],
  ["&*$75;]'.."],
  ["before", "it", "disappears"],
  ["you", "almost", "saw", "it"],
  ["just", "right", "th—"],
  ["%$@#$%&*("],
  ["too", "late."] // final sequence triggers red screen
];

let currentSequence = 0;
let currentWord = 0;
let blinkFlashAlpha = 0;
let blinkFlashWord = '';

let eyeOpenness = 1.0; // drives vertical scale of eye shape, collapses on blink

// PASSAGE - KEEP TEXT ALIVE. words decay, blinking = speed up disappearance
const passage = [
  "if", "you're", "reading", "this,",
  "it's", "already", "too", "late.",
  "there", "isn't", "enough", "time,",
  "nor", "enough", "words", "to", "tell", "you.",
  "what", "matters", "appears", "only",
  "when", "you're", "not", "looking."
];

// para bound box
let FONT_SIZE;
let CHAR_WIDTH;
let WORD_GAP;
let LINE_HEIGHT;
let BLOCK_WIDTH;
let MARGIN;

function setLayoutConstants() {
  let scale = min(width, height) / 480;
  FONT_SIZE = 24 * scale;
  CHAR_WIDTH = 13.5 * scale;
  WORD_GAP = 12 * scale;
  LINE_HEIGHT = 44 * scale;
  BLOCK_WIDTH = width * 0.75;
  MARGIN = 40 * scale;
}


function setup() {
  createCanvas(windowWidth, windowHeight); // responsive canvas, fills window

  eyeBlinkHistory = new Array(historyLen);
  for (var i = 0; i < historyLen; i++) {
    eyeBlinkHistory[i] = 0.1;
  }

  webcam = createCapture(VIDEO);
  webcam.size(640, 480);
  webcam.elt.setAttribute('playsinline', ''); // prevents iOS fullscreen takeover
  webcam.hide(); // sets display:none

  // belt-and-braces: force webcam element fully out of view/layout
  // (hide() alone can sometimes leave the element visible depending on host page styles)
  webcam.elt.style.position = 'absolute';
  webcam.elt.style.opacity = '0';
  webcam.elt.style.pointerEvents = 'none';
  webcam.elt.style.zIndex = '-1';

  handsfree = new Handsfree({ // initialise handsfree = only facemesh enabled
    showDebug: false,
    hands: false,
    pose: false,
    facemesh: true
  });
  handsfree.start();

  handsfree.on('modelReady', () => {
    handsfreeReady = true;
  });

  setLayoutConstants();
  initWords();
  textFont('Courier New');
  noStroke();
  textAlign(CENTER, CENTER);
}


// keep canvas + layout in sync with the window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setLayoutConstants();
  initWords(); // re-wrap and reposition passage for the new dimensions
}


function draw() {

  if (appState === 'LOADING') { // screen 4 facemesh to load
    drawLoadingScreen();
    if (handsfreeReady) {
      loadingAlpha -= 4;
      if (loadingAlpha <= 0) appState = 'RUNNING';
    }
    return;
  }

  if (appState === 'REDSCREEN') {
    drawRedScreen();
    drawGlitch();
    return;
  }
// RUNNING passage sequence
  
  background(0);
  drawEyes(); // red eyes
  updateWords();
  drawWords();
  drawBlinkFlash();
  drawGlitch();
  detectBlinking(); // read facemesh, fire onBlink() if threshold crossed
  checkEndState(); // trigger red screen if all words are gone

  if (blinkCooldown > 0) blinkCooldown--; // once ready, overlay fades from red to black (transition to RUNNING)
  eyeOpenness = min(1.0, eyeOpenness + 0.08);
}

// LOADING SCREEN

function drawLoadingScreen() {
  background(220, 0, 0);

  let flicker = random(0.88, 1.0);
  fill(0, 0, 0, 255 * flicker * (loadingAlpha / 255));
  textSize(18 * (min(width, height) / 480)); // scale with window size
  textStyle(BOLD);
  text('INITIALISING', width / 2, height / 2);

  drawGlitch();

  if (handsfreeReady && loadingAlpha < 255) {
    fill(220, 0, 0, 255 - loadingAlpha);
    rect(0, 0, width, height);
  }
}

// GLITCH.TV EFFECTS

function drawGlitch() {

  if (frameCount % random(30, 60) === 0) {  // occasional full-screen colour wash
    fill(random(255), random(255), random(255), random(50, 100));
    rect(0, 0, width, height);
  }

  for (let i = 0; i < 4; i++) {  // scattered pixel noise
    fill(random(255), random(255), random(255));
    rect(random(width), random(height), random(1, 5), random(1, 5));
  }

  if (frameCount % 35 === 0) { // invert flash
    let invert = random(0, 1);
    fill(255 - invert * 255, invert * 255, invert * 255, 80);
    rect(0, 0, width, height);
  }

  for (let y = 0; y < height; y += 9) { // scanlines
    fill(0, 0, 0, random(0, 40));
    rect(0, y, width, 2);
  }

  for (let i = 0; i < 5; i++) { // tearss
    fill(random(360), random(80, 100), random(0, 50), random(0, 50));
    rect(0, random(height), width, random(2, 10));
  }

  if (frameCount % 120 === 0) { // some rgb shift
    let yShift = sin(frameCount * 0.05) * 20;
    fill(255, 255, 255, 20); rect(0, yShift, width, 5);
    fill(0, 255, 0, 20);     rect(0, yShift + 10, width, 5);
    fill(255, 0, 255, 20);   rect(0, yShift - 10, width, 5);
  }
}

// EYES - BACKGROUND

function drawEyes() {
  if (!handsfree.data.facemesh) return;
  if (!handsfree.data.facemesh.multiFaceLandmarks) return;

  var faceLandmarks = handsfree.data.facemesh.multiFaceLandmarks;
  if (faceLandmarks.length === 0) return;

  var whichFace = 0;
  var eyes = [ // MediaPipe landmark indices for left and right eye contours
    [33,161,160,159,158,157,173,133,155,154,153,145,144,163,7],
    [362,384,385,386,387,388,466,263,249,390,373,374,380,381,382]
  ];

  var eyeAvgX = 0, eyeAvgY = 0, count = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < eyes[e].length; j++) {
      var px = faceLandmarks[whichFace][eyes[e][j]].x;
      var py = faceLandmarks[whichFace][eyes[e][j]].y;
      eyeAvgX += map(px, 0, 1, width, 0);
      eyeAvgY += map(py, 0, 1, 0, height);
      count++;
    }
  }
  eyeAvgX /= count;
  eyeAvgY /= count;

  push();
  translate(width / 2, height / 2);
  scale(5, 5 * max(0.08, eyeOpenness)); // vertical scale collapses on blink
  translate(-eyeAvgX, -eyeAvgY); // re-centre on eye position

  fill(100, 0, 0, 60);
  noStroke();
  for (var e = 0; e < 2; e++) {
    beginShape();
    for (var j = 0; j < eyes[e].length; j++) {
      var px = map(faceLandmarks[whichFace][eyes[e][j]].x, 0, 1, width, 0);
      var py = map(faceLandmarks[whichFace][eyes[e][j]].y, 0, 1, 0, height);
      vertex(px, py);
    }
    endShape(CLOSE);
  }

  // bright fill with red outline — main eye shape
  fill(160, 0, 0, 200);
  stroke(220, 0, 0, 180);
  strokeWeight(0.15);
  for (var e = 0; e < 2; e++) {
    beginShape();
    for (var j = 0; j < eyes[e].length; j++) {
      var px = map(faceLandmarks[whichFace][eyes[e][j]].x, 0, 1, width, 0);
      var py = map(faceLandmarks[whichFace][eyes[e][j]].y, 0, 1, 0, height);
      vertex(px, py);
    }
    endShape(CLOSE);
  }

  pop();
}

// PASSAGE - WORD SYSTEM

function initWords() {
  words = [];

  let lines = [], currentLine = [], col = 0; // wrap passage into lines within BLOCK_WIDTH
  for (var i = 0; i < passage.length; i++) {
    let wordWidth = passage[i].length * CHAR_WIDTH + WORD_GAP;
    if (col + wordWidth > BLOCK_WIDTH && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
      col = 0;
    }
    currentLine.push({ txt: passage[i], width: wordWidth });
    col += wordWidth;
  }
  if (currentLine.length > 0) lines.push(currentLine);

  let totalHeight = lines.length * LINE_HEIGHT;
  let blockTop = max(MARGIN, min((height - totalHeight) / 2, height - totalHeight - MARGIN));

    // place each word — x anchored at word centre for CENTRE text alignment
  for (var l = 0; l < lines.length; l++) {
    let lineWidth = lines[l].reduce((sum, w) => sum + w.width, 0);
    let x = (width - lineWidth) / 2;
    let y = blockTop + l * LINE_HEIGHT;
    for (var w = 0; w < lines[l].length; w++) {
      words.push({
        txt: lines[l][w].txt,
        x: x + lines[l][w].width / 2,
        y: y,
        opacity: random(200, 255),
        decayRate: random(0.25, 0.7), // decay speed
        alive: true
      });
      x += lines[l][w].width;
    }
  }
}


function updateWords() { // fading opacity
  for (var i = 0; i < words.length; i++) {
    if (words[i].alive) {
      words[i].opacity -= words[i].decayRate;
      if (words[i].opacity <= 0) { words[i].opacity = 0; words[i].alive = false; }
    }
  }
}


 // passage setup
function drawWords() {
  textAlign(CENTER, TOP);
  textStyle(NORMAL);
  noStroke();
  for (var i = 0; i < words.length; i++) {
    if (words[i].alive) {
      fill(255, 255, 255, words[i].opacity);
      textSize(FONT_SIZE);
      text(words[i].txt, words[i].x, words[i].y);
    }
  }
}


function drawBlinkFlash() {
  if (blinkFlashAlpha <= 0 || blinkFlashWord === '') return;

  blinkFlashAlpha -= 80;
  blinkFlashAlpha = max(0, blinkFlashAlpha);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  noStroke();
  fill(255, 255, 255, blinkFlashAlpha);
  textSize(72 * (min(width, height) / 480)); // scale with window size
  text(blinkFlashWord, width / 2, height / 2);
  textStyle(NORMAL);
}

// ON BLINKING
function onBlink() {
  if (blinkCooldown > 0) return;

  eyeOpenness = 0.0;

  var living = words.filter(w => w.alive);
  if (living.length > 0) {
    living.sort((a, b) => a.opacity - b.opacity);
    living[0].opacity = 0;
    living[0].alive = false;
  }

  var seq = hiddenSequences[currentSequence];
  blinkFlashWord = seq[currentWord];
  blinkFlashAlpha = 180;

  currentWord++;
  if (currentWord >= seq.length) {
    currentWord = 0;
    currentSequence++;
    
    // cut to final red screen
    if (currentSequence >= hiddenSequences.length) {
      redScreenAlpha = 0;
      appState = 'REDSCREEN';
    }
  }

  blinkCooldown = 30;
}

// END STATE
function checkEndState() {
  if (appState === 'REDSCREEN') return;
  if (words.filter(w => w.alive).length === 0) {
    redScreenDelay++;
    if (redScreenDelay > 180) {
      redScreenAlpha = 0;
      appState = 'REDSCREEN';
    }
  }
}


function drawRedScreen() {
  background(160, 0, 0);
}

// BLINKING DETECTION - HANDSFREE
// measures vertical distance between upper/lower eyelid landmarks, 
// compares against a rolling average to detect sudden closure

function detectBlinking() {
  if (!handsfree.data.facemesh) return;
  if (!handsfree.data.facemesh.multiFaceLandmarks) return;

  var faceLandmarks = handsfree.data.facemesh.multiFaceLandmarks;
  if (faceLandmarks.length === 0) return;

  var whichFace = 0;
  var eyeBlinkMeasurementPairs = [[159,154],[158,145],[385,374],[386,373]];
  var measurement = 0;
  for (var i = 0; i < eyeBlinkMeasurementPairs.length; i++) {
    var pa = faceLandmarks[whichFace][eyeBlinkMeasurementPairs[i][0]];
    var pb = faceLandmarks[whichFace][eyeBlinkMeasurementPairs[i][1]];
    measurement += dist(pa.x, pa.y, pb.x, pb.y);
  }

  for (var i = 0; i < historyLen - 1; i++) {
    eyeBlinkHistory[i] = eyeBlinkHistory[i + 1];
  }
  eyeBlinkHistory[historyLen - 1] = measurement;

  runningAvg = 0.95 * runningAvg + 0.05 * measurement;
  var stdv = 0;
  for (var i = 0; i < historyLen; i++) {
    stdv += sq(eyeBlinkHistory[i] - runningAvg);
  }
  stdv = sqrt(stdv / historyLen);

  blinkActivation *= 0.9;

  var threshVal = runningAvg - stdv * 0.6;
  if ((eyeBlinkHistory[historyLen - 1] < threshVal) &&
      (eyeBlinkHistory[historyLen - 2] >= threshVal)) {
    blinkActivation = 1.0;
    onBlink();
  }
}
