// Set up the canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Use the exact background color from your slide
const backgroundColor = "#c3e6e8";

// Player (a tiny dot)
const player = {
  x: 50,
  y: canvas.height - 40,
  w: 3,
  h: 3,
  vx: 0,
  vy: 0,
  speed: 2,
  jump: -5,
  onGround: false
};

// Platform properties (thin as an underscore)
const PLATFORM_WIDTH = 15;
const PLATFORM_HEIGHT = 2;

// Platforms array
let platforms = [];
let level = 1;

// Generate random platforms
function generatePlatforms() {
  platforms = [];
  // Starting platform
  platforms.push({
    x: 30,
    y: canvas.height - 30,
    w: PLATFORM_WIDTH,
    h: PLATFORM_HEIGHT
  });
  // Random middle platforms
  for (let i = 0; i < 4 + level; i++) {
    let plat = {
      x: Math.random() * (canvas.width - PLATFORM_WIDTH),
      y: Math.random() * (canvas.height - 100),
      w: PLATFORM_WIDTH,
      h: PLATFORM_HEIGHT
    };
    platforms.push(plat);
  }
  // Finish platform (green)
  platforms.push({
    x: canvas.width - 50,
    y: 40,
    w: PLATFORM_WIDTH,
    h: PLATFORM_HEIGHT,
    finish: true
  });
}

// Draw everything
function draw() {
  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw platforms
  platforms.forEach(p => {
    if (p.finish) {
      ctx.fillStyle = 'green';
    } else {
      ctx.fillStyle = 'black';
    }
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  // Draw player (tiny dot)
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
  ctx.fill();

  // Draw level info
  ctx.font = "16px monospace";
  ctx.fillStyle = "black";
  ctx.fillText("Level: " + level, 20, 30);
}

// Controls
let keys = {};
window.onkeydown = e => keys[e.key] = true;
window.onkeyup = e => keys[e.key] = false;

// Physics and logic
function update() {
  // Move
  player.vx = (keys['a'] || keys['ArrowLeft']) ? -player.speed : (keys['d'] || keys['ArrowRight']) ? player.speed : 0;
  // Jump
  if ((keys['w'] || keys['ArrowUp'] || keys[' ']) && player.onGround) {
    player.vy = player.jump;
    player.onGround = false;
  }
  player.vy += 0.2;
  player.x += player.vx;
  player.y += player.vy;

  // Boundaries
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
  if (player.y + player.h > canvas.height) {
    player.y = canvas.height - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // Platform collision
  player.onGround = false;
  platforms.forEach(p => {
    if (
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h > p.y &&
      player.y + player.h < p.y + p.h + 4 &&
      player.vy >= 0
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      // Check if on finish platform
      if (p.finish) {
        level++;
        player.x = 50;
        player.y = canvas.height - 40;
        generatePlatforms();
      }
    }
  });
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Start the game
generatePlatforms();
loop();

// Resize handler
window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generatePlatforms();
};
