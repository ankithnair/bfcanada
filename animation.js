// Retro Canvas Setup
const canvas = document.getElementById('retroCanvas');
const ctx = canvas.getContext('2d');

// Animation state
let animationId;
let isPaused = false;
let particles = [];

// Retro Particle class
class RetroParticle {
    constructor(x, y, color = 'green') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 4;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.005;
        this.glow = Math.random() * 10 + 5;
        this.pulse = 0;
        this.pulseSpeed = Math.random() * 0.1 + 0.05;
    }

    update() {
        // Update position
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Add some gravity
        this.speedY += 0.1;
        
        // Add friction
        this.speedX *= 0.99;
        this.speedY *= 0.99;
        
        // Bounce off walls
        if (this.x <= 0 || this.x >= canvas.width) {
            this.speedX = -this.speedX * 0.8;
            this.x = Math.max(0, Math.min(canvas.width, this.x));
        }
        
        if (this.y <= 0 || this.y >= canvas.height) {
            this.speedY = -this.speedY * 0.8;
            this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
        
        // Update life and pulse
        this.life -= this.decay;
        this.pulse += this.pulseSpeed;
        
        // Add some randomness to prevent particles from getting stuck
        if (Math.abs(this.speedX) < 0.1 && Math.abs(this.speedY) < 0.1) {
            this.speedX = (Math.random() - 0.5) * 4;
            this.speedY = (Math.random() - 0.5) * 4;
        }
    }

    draw() {
        if (this.life <= 0) return;
        
        ctx.save();
        
        // Create pulsing glow effect
        const pulseIntensity = Math.sin(this.pulse) * 0.3 + 0.7;
        const glowSize = this.glow * pulseIntensity;
        
        // Draw outer glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowSize
        );
        
        const colors = {
            'green': ['#00ff00', '#00cc00', '#009900'],
            'cyan': ['#00ffff', '#00cccc', '#009999'],
            'yellow': ['#ffff00', '#cccc00', '#999900'],
            'magenta': ['#ff00ff', '#cc00cc', '#990099'],
            'white': ['#ffffff', '#cccccc', '#999999']
        };
        
        const colorSet = colors[this.color] || colors['green'];
        
        gradient.addColorStop(0, colorSet[0] + Math.floor(this.life * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, colorSet[1] + Math.floor(this.life * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw core particle
        ctx.fillStyle = colorSet[0] + Math.floor(this.life * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner highlight
        ctx.fillStyle = colorSet[2] + Math.floor(this.life * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.3 * this.life, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// Retro color palette
const retroColors = ['green', 'cyan', 'yellow', 'magenta', 'white'];

// Initialize particles
function initializeParticles() {
    particles = [];
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * (canvas.width - 100) + 50;
        const y = Math.random() * (canvas.height - 100) + 50;
        const color = retroColors[i % retroColors.length];
        particles.push(new RetroParticle(x, y, color));
    }
}

// Animation loop
function animate() {
    if (!isPaused) {
        // Clear canvas with fade effect for trails
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw all particles
        particles.forEach((particle, index) => {
            particle.update();
            particle.draw();
            
            // Remove dead particles
            if (particle.isDead()) {
                particles.splice(index, 1);
            }
        });
        
        // Check for particle collisions
        checkCollisions();
        
        // Update particle count display
        updateParticleCount();
    }
    
    animationId = requestAnimationFrame(animate);
}

// Collision detection between particles
function checkCollisions() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const particle1 = particles[i];
            const particle2 = particles[j];
            
            const dx = particle2.x - particle1.x;
            const dy = particle2.y - particle1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < particle1.size + particle2.size) {
                // Collision detected - create energy burst
                createEnergyBurst(particle1.x, particle1.y);
                
                // Simple elastic collision
                const angle = Math.atan2(dy, dx);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);
                
                // Rotate velocities
                const vx1 = particle1.speedX * cos + particle1.speedY * sin;
                const vy1 = particle1.speedY * cos - particle1.speedX * sin;
                const vx2 = particle2.speedX * cos + particle2.speedY * sin;
                const vy2 = particle2.speedY * cos - particle2.speedX * sin;
                
                // Swap velocities
                particle1.speedX = vx2 * cos - vy1 * sin;
                particle1.speedY = vy1 * cos + vx2 * sin;
                particle2.speedX = vx1 * cos - vy2 * sin;
                particle2.speedY = vy2 * cos + vx1 * sin;
                
                // Move particles apart
                const overlap = particle1.size + particle2.size - distance;
                const moveX = (overlap * dx) / distance / 2;
                const moveY = (overlap * dy) / distance / 2;
                
                particle1.x -= moveX;
                particle1.y -= moveY;
                particle2.x += moveX;
                particle2.y += moveY;
            }
        }
    }
}

// Create energy burst effect
function createEnergyBurst(x, y) {
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        const speed = Math.random() * 3 + 2;
        const burstParticle = new RetroParticle(
            x,
            y,
            retroColors[Math.floor(Math.random() * retroColors.length)]
        );
        burstParticle.speedX = Math.cos(angle) * speed;
        burstParticle.speedY = Math.sin(angle) * speed;
        burstParticle.life = 0.8;
        burstParticle.decay = 0.02;
        particles.push(burstParticle);
    }
}

// Create explosion effect for adding particles
function createExplosionEffect(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = Math.random() * 5 + 3;
        const explosionParticle = new RetroParticle(x, y, color);
        explosionParticle.speedX = Math.cos(angle) * speed;
        explosionParticle.speedY = Math.sin(angle) * speed;
        explosionParticle.life = 0.6;
        explosionParticle.decay = 0.03;
        explosionParticle.size = Math.random() * 6 + 3;
        particles.push(explosionParticle);
    }
}

// Create implosion effect for removing particles
function createImplosionEffect(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const speed = Math.random() * 4 + 2;
        const implosionParticle = new RetroParticle(x, y, color);
        implosionParticle.speedX = -Math.cos(angle) * speed;
        implosionParticle.speedY = -Math.sin(angle) * speed;
        implosionParticle.life = 0.4;
        implosionParticle.decay = 0.04;
        implosionParticle.size = Math.random() * 4 + 2;
        particles.push(implosionParticle);
    }
}

// Create pause effect
function createPauseEffect() {
    // Create a wave effect across the canvas
    for (let i = 0; i < 10; i++) {
        const x = (canvas.width / 10) * i;
        const y = canvas.height / 2;
        const pauseParticle = new RetroParticle(x, y, 'cyan');
        pauseParticle.speedX = 0;
        pauseParticle.speedY = 0;
        pauseParticle.life = 1.0;
        pauseParticle.decay = 0.01;
        pauseParticle.size = 8;
        particles.push(pauseParticle);
    }
}

// Create resume effect
function createResumeEffect() {
    // Create a burst of energy particles
    for (let i = 0; i < 15; i++) {
        const x = canvas.width / 2 + (Math.random() - 0.5) * 100;
        const y = canvas.height / 2 + (Math.random() - 0.5) * 100;
        const resumeParticle = new RetroParticle(x, y, 'green');
        resumeParticle.speedX = (Math.random() - 0.5) * 6;
        resumeParticle.speedY = (Math.random() - 0.5) * 6;
        resumeParticle.life = 0.8;
        resumeParticle.decay = 0.02;
        particles.push(resumeParticle);
    }
}

// Update button states based on current conditions
function updateButtonStates() {
    const removeBtn = document.querySelector('button[onclick="removeParticle()"]');
    const resetBtn = document.querySelector('button[onclick="resetAnimation()"]');
    
    // Disable remove button if only one particle left
    if (particles.length <= 1) {
        removeBtn.classList.add('disabled');
        removeBtn.disabled = true;
    } else {
        removeBtn.classList.remove('disabled');
        removeBtn.disabled = false;
    }
    
    // Disable reset button if no particles
    if (particles.length === 0) {
        resetBtn.classList.add('disabled');
        resetBtn.disabled = true;
    } else {
        resetBtn.classList.remove('disabled');
        resetBtn.disabled = false;
    }
}

// Control functions
function addParticle() {
    const x = Math.random() * (canvas.width - 100) + 50;
    const y = Math.random() * (canvas.height - 100) + 50;
    
    // Get selected color from dropdown
    const colorSelect = document.getElementById('particleColor');
    const selectedColor = colorSelect.value;
    
    // Use selected color or random if "random" is selected
    const color = selectedColor === 'random' 
        ? retroColors[Math.floor(Math.random() * retroColors.length)]
        : selectedColor;
    
    // Create multiple particles for epic effect
    for (let i = 0; i < 3; i++) {
        const particle = new RetroParticle(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50, color);
        particle.speedX = (Math.random() - 0.5) * 8;
        particle.speedY = (Math.random() - 0.5) * 8;
        particles.push(particle);
    }
    
    // Create explosion effect
    createExplosionEffect(x, y, color);
    updateParticleCount();
    
    // Update button state
    updateButtonStates();
}

function removeParticle() {
    if (particles.length > 1) {
        // Remove multiple particles for dramatic effect
        const particlesToRemove = Math.min(3, particles.length - 1);
        for (let i = 0; i < particlesToRemove; i++) {
            if (particles.length > 1) {
                const removedParticle = particles.pop();
                // Create implosion effect
                createImplosionEffect(removedParticle.x, removedParticle.y, removedParticle.color);
            }
        }
        updateParticleCount();
        updateButtonStates();
    }
}

function toggleAnimation() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.textContent = isPaused ? 'RESUME' : 'PAUSE';
    
    // Add visual feedback
    if (isPaused) {
        pauseBtn.style.background = '#333';
        pauseBtn.style.borderColor = '#666';
        pauseBtn.style.color = '#666';
    } else {
        pauseBtn.style.background = '#000';
        pauseBtn.style.borderColor = '#00ff00';
        pauseBtn.style.color = '#00ff00';
    }
    
    // Create pause/resume effect
    if (isPaused) {
        createPauseEffect();
    } else {
        createResumeEffect();
    }
}

function resetAnimation() {
    // Create reset explosion effect
    particles.forEach(particle => {
        createImplosionEffect(particle.x, particle.y, particle.color);
    });
    
    // Clear all particles
    particles = [];
    
    // Reinitialize with new particles
    setTimeout(() => {
        initializeParticles();
        updateParticleCount();
        updateButtonStates();
    }, 500);
}

function updateParticleCount() {
    document.getElementById('particleCount').textContent = `PARTICLES: ${particles.length}`;
}

// Handle window resize
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, window.innerWidth - 100);
    const maxHeight = Math.min(500, window.innerHeight - 300);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    
    // Reinitialize particles with new canvas size
    initializeParticles();
}

// Event listeners
window.addEventListener('resize', resizeCanvas);

// Initialize and start animation
resizeCanvas();
animate();
updateButtonStates(); // Initialize button states 