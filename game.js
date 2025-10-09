// Load the background image
const bgImage = new Image();
bgImage.src = "background.jpg"; // Change this if your file has a different name

// Set up the canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player
const player = { x: 0, y: 0, w: 3, h: 3, vx: 0, vy: 0, speed: 2, jump: -5, onGround: false };

// Platform settings
const PLATFORM_WIDTH = 60; // Longer for enemies
const PLATFORM_HEIGHT = 2;
let platforms = [];
let level = 1;

// Enemies and bullets
let enemies = [];
let bullets = [];
const ENEMY_SIZE = 3, ENEMY_COLOR = "red";
const ENEMY_SPEED = 0.5;
const BULLET_WIDTH = 6, BULLET_HEIGHT = 2, BULLET_SPEED = 7;

// Generate random platforms and enemies
function generatePlatforms() {
  platforms = [];
  enemies = [];
  bullets = [];

  // Platform vertical spacing (much closer now)
  const spacing = 40;

  // Starting platform (always near bottom left)
  let startPlat = { x: 40, y: canvas.height - 40, w: PLATFORM_WIDTH, h: PLATFORM_HEIGHT };
  platforms.push(startPlat);

  // Random middle platforms, spaced vertically, with some horizontal randomness
  for (let i = 1; i < 5 + Math.floor(level/2); i++) {
    let plat = {
      x: 40 + Math.random() * (canvas.width - PLATFORM_WIDTH - 80),
      y: canvas.height - 40 - i * spacing,
      w: PLATFORM_WIDTH,
      h: PLATFORM_HEIGHT
    };
    platforms.push(plat);
    // 50% chance to put an enemy on this platform
    if (Math.random() < 0.5) {
      enemies.push({
        x: plat.x + Math.random() * (plat.w - ENEMY_SIZE),
        y: plat.y - ENEMY_SIZE,
        w: ENEMY_SIZE,
        h: ENEMY_SIZE,
        dir: Math.random() < 0.5 ? 1 : -1,
        range: plat.w - ENEMY_SIZE,
        baseX: plat.x
      });
    }
  }
  // Finish platform (top right)
  let finishPlat = { x: canvas.width - 80, y: 40, w: PLATFORM_WIDTH, h: PLATFORM_HEIGHT, finish: true };
  platforms.push(finishPlat);

  // Spawn player exactly above the first platform and set onGround
  player.x = startPlat.x + startPlat.w / 2 - player.w / 2;
  player.y = startPlat.y - player.h;
  player.vx = 0; player.vy = 0;
  player.onGround = true;
}

// Draw everything
function draw() {
  // Draw background image OR fallback color
  if (bgImage.complete && bgImage.naturalWidth > 0) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#c3e6e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // Draw platforms
  platforms.forEach(p => {
    ctx.fillStyle = p.finish ? 'green' : 'black';
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });
  // Draw enemies
  enemies.forEach(e => {
    ctx.fillStyle = ENEMY_COLOR;
    ctx.beginPath();
    ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI*2);
    ctx.fill();
  });
  // Draw bullets
  bullets.forEach(b => {
    ctx.fillStyle = "black";
    ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT);
  });
  // Draw player
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
  ctx.fill();
  // Level text
  ctx.font = "16px monospace";
  ctx.fillStyle = "black";
  ctx.fillText("Level: " + level, 20, 30);
}

// Keyboard
let keys = {};
window.onkeydown = e => {
  keys[e.key] = true;
  // Shoot with F or Enter
  if ((e.key === "f" || e.key === "F" || e.key === "Enter")) {
    bullets.push({
      x: player.x + player.w,
      y: player.y + player.h/2 - BULLET_HEIGHT/2,
      vx: BULLET_SPEED,
      vy: 0
    });
  }
};
window.onkeyup = e => keys[e.key] = false;

// Physics
function update() {
  // Player move
  player.vx = (keys['a'] || keys['ArrowLeft']) ? -player.speed : (keys['d'] || keys['ArrowRight']) ? player.speed : 0;
  if ((keys['w'] || keys['ArrowUp'] || keys[' ']) && player.onGround) {
    player.vy = player.jump;
    player.onGround = false;
  }
  player.vy += 0.2;
  player.x += player.vx;
  player.y += player.vy;
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

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
      if (p.finish) {
        level++; generatePlatforms();
      }
    }
  });

  // FALLING: Restart if below screen
  if (player.y > canvas.height + 10) {
    generatePlatforms();
  }

  // Update bullets
  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
  });
  bullets = bullets.filter(b => b.x < canvas.width && b.x > 0);

  // Move enemies, SLOWER
  enemies.forEach(e => {
    e.x += e.dir * ENEMY_SPEED;
    if (e.x < e.baseX) { e.x = e.baseX; e.dir *= -1; }
    if (e.x > e.baseX + e.range) { e.x = e.baseX + e.range; e.dir *= -1; }
  });

  // Bullet/enemy collision
  bullets = bullets.filter(bullet => {
    for (let i = 0; i < enemies.length; i++) {
      let e = enemies[i];
      if (
        bullet.x < e.x + e.w &&
        bullet.x + BULLET_WIDTH > e.x &&
        bullet.y < e.y + e.h &&
        bullet.y + BULLET_HEIGHT > e.y
      ) {
        enemies.splice(i, 1);
        return false; // remove bullet
      }
    }
    return true;
  });

  // Enemy/player collision (restart)
  enemies.forEach(e => {
    if (
      player.x < e.x + e.w &&
      player.x + player.w > e.x &&
      player.y < e.y + e.h &&
      player.y + player.h > e.y
    ) {
      generatePlatforms();
    }
  });
}

// Loop
function loop() { update(); draw(); requestAnimationFrame(loop); }
generatePlatforms();
loop();

window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generatePlatforms();
};
