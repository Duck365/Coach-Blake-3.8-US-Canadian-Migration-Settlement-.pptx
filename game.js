// Load the background image
const bgImage = new Image();
bgImage.src = "background.jpg"; // Make sure this matches your file name

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// This line sets the text that appears in the browser tab (the document title)
document.title = "The Great Climb Adventure";

// Player
const player = { x: 0, y: 0, w: 3, h: 3, vx: 0, vy: 0, speed: 2, jump: -5, onGround: false };

// Platform settings
const PLATFORM_WIDTH = 4; // Default tiny width for regular platforms
const PLATFORM_HEIGHT = 1;
let platforms = [];
let level = 1;

// Enemy and Bullet Constants
const ENEMY_SIZE = 3, ENEMY_COLOR = "red";
const ENEMY_SPEED = 0.50; // much slower
const ENEMY_MAX_HP = 5; // <--- NEW: Enemies require 5 hits to defeat
const BULLET_WIDTH = 20, BULLET_HEIGHT = 20, BULLET_SPEED = 20;

// Enemies, Bullets, and Seekers arrays
let enemies = [];
let bullets = [];
let seekers = []; // <--- NEW: Array for purple seekers

// Seeker Enemy Constants (The 20 flying purple pixels)
const SEEKER_COUNT = 20;
const SEEKER_SIZE = 2;
const SEEKER_COLOR = "purple";
const SEEKER_SPEED = 0.8; // They slowly fly toward the player

// Generate platforms and enemies
function generatePlatforms() {
  platforms = [];
  enemies = [];
  bullets = [];
  seekers = []; // Reset seekers for the new level

  // Platform vertical spacing (super close)
  const spacing = 28;

  // First platform (bottom left)
  let startPlat = { x: 40, y: canvas.height - 40, w: PLATFORM_WIDTH, h: PLATFORM_HEIGHT };
  platforms.push(startPlat);

  // Add random platforms
  for (let i = 1; i < 30 + Math.floor(level/2); i++) {
    let plat = {
      x: 40 + Math.random() * (canvas.width - PLATFORM_WIDTH - 4),
      y: canvas.height - 40 - i * spacing,
      w: PLATFORM_WIDTH, // Start with the default tiny width
      h: PLATFORM_HEIGHT
    };
    
    // 50% chance to put a red enemy and increase the platform size
    if (Math.random() < 0.5) {
      // Calculate a random width between 10 and 20 pixels
      const enemyPlatWidth = 10 + Math.random() * 10; 
      
      // Set the platform's width to the larger value
      plat.w = enemyPlatWidth;
      
      // Add the red enemy with 5 HP
      enemies.push({
        x: plat.x + Math.random() * (plat.w - ENEMY_SIZE),
        y: plat.y - ENEMY_SIZE,
        w: ENEMY_SIZE,
        h: ENEMY_SIZE,
        dir: Math.random() < 0.5 ? 1 : -1,
        range: plat.w - ENEMY_SIZE, 
        baseX: plat.x,
        hp: ENEMY_MAX_HP // Initial health set
      });
    }
    
    platforms.push(plat);
  }
  
  // FINISH PLATFORM (Properly sized to be visible!)
  let finishPlat = { x: canvas.width - 120, y: 40, w: 100, h: 20, finish: true }; 
  platforms.push(finishPlat);

  // Generate Seekers (20 flying purple pixels)
  for (let i = 0; i < SEEKER_COUNT; i++) {
      seekers.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.3, // Start in top half
          w: SEEKER_SIZE,
          h: SEEKER_SIZE,
      });
  }

  // Spawn player exactly above the first platform
  player.x = startPlat.x + startPlat.w / 2 - player.w / 2;
  player.y = startPlat.y - player.h;
  player.vx = 0; player.vy = 0;
  player.onGround = false; // You can always jump now anyway!
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
  // Draw red enemies
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
  // Draw purple seekers
  seekers.forEach(s => {
    ctx.fillStyle = SEEKER_COLOR;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  });
  // Draw player
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
  ctx.fill();
  // Level text
  ctx.font = "5px monospace";
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

// Physics & Logic
function update() {
  // Player move
  player.vx = (keys['a'] || keys['ArrowLeft']) ? -player.speed : (keys['d'] || keys['ArrowRight']) ? player.speed : 0;

  // Unlimited jumps: you can ALWAYS jump when you press jump!
  if (keys['w'] || keys['ArrowUp'] || keys[' ']) {
    player.vy = player.jump;
    // Prevent holding down jump for super-float: reset jump key immediately after jumping
    keys['w'] = keys['ArrowUp'] = keys[' '] = false;
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
        level++;
        generatePlatforms();
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

  // Move red enemies, SLOWER
  enemies.forEach(e => {
    e.x += e.dir * ENEMY_SPEED;
    if (e.x < e.baseX) { e.x = e.baseX; e.dir *= -1; }
    if (e.x > e.baseX + e.range) { e.x = e.baseX + e.range; e.dir *= -1; }
  });

  // Move seekers (purple pixels) towards the player and check for collision
  seekers.forEach(s => {
    // Calculate direction vector to player
    const dx = player.x - s.x;
    const dy = player.y - s.y;
    // Normalize and apply speed
    const dist = Math.sqrt(dx * dx + dy * dy);
    s.x += (dx / dist) * SEEKER_SPEED;
    s.y += (dy / dist) * SEEKER_SPEED;
    
    // Seeker/player collision (restart level)
    if (
        player.x < s.x + s.w &&
        player.x + player.w > s.x &&
        player.y < s.y + s.h &&
        player.y + player.h > s.y
    ) {
        // Collided with seeker! Restart level
        generatePlatforms();
    }
  });

  // Bullet/enemy collision (Health Logic)
  bullets = bullets.filter(bullet => {
    for (let i = 0; i < enemies.length; i++) {
      let e = enemies[i];
      if (
        bullet.x < e.x + e.w &&
        bullet.x + BULLET_WIDTH > e.x &&
        bullet.y < e.y + e.h &&
        bullet.y + BULLET_HEIGHT > e.y
      ) {
        // Hit! Decrease health
        e.hp -= 1; 
        
        if (e.hp <= 0) {
            // Remove enemy if health is depleted
            enemies.splice(i, 1);
        }
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

// Main loop
function loop() { update(); draw(); requestAnimationFrame(loop); }
generatePlatforms();
loop();

window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generatePlatforms();
};
