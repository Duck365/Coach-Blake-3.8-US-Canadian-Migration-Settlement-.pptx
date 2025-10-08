// Set up the canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player (a tiny dot)
const player = {
  x: 50, y: canvas.height - 20,
  w: 3, h: 3,
  vx: 0, vy: 0,
  speed: 2, jump: -5,
  onGround: false
};

// Single platform
let platform = { x: 30, y: canvas.height - 30, w: 15, h: 3 };

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Platform
  ctx.fillStyle = 'black';
  ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
  // Player (dot)
  ctx.beginPath();
  ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
  ctx.fill();
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
    player.vy = player.jump; player.onGround = false;
  }
  player.vy += 0.2;
  player.x += player.vx;
  player.y += player.vy;
  // Ground
  if (player.y + player.h > canvas.height) {
    player.y = canvas.height - player.h; player.vy = 0; player.onGround = true;
  }
  // Platform collision
  if (player.x + player.w > platform.x && player.x < platform.x + platform.w &&
      player.y + player.h > platform.y && player.y + player.h < platform.y + platform.h + 4 && player.vy >= 0) {
    player.y = platform.y - player.h;
    player.vy = 0; player.onGround = true;
  }
}

// Game loop
function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();

// Resize
window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  platform.y = canvas.height - 30;
};
