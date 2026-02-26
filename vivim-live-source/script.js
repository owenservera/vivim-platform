document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject animation delays programmatically for staggered entry
    const animatedElements = document.querySelectorAll('[style*="--delay"]');
    animatedElements.forEach(el => {
        const delay = el.style.getPropertyValue('--delay');
        el.style.animationDelay = delay;
    });

    // 2. Ambient background effect spawning
    const ambientContainer = document.getElementById('ambient-canvas');
    if (ambientContainer) {
        const colors = ['orb-1', 'orb-2', 'orb-3'];
        colors.forEach(className => {
            const orb = document.createElement('div');
            orb.className = `orb ${className}`;
            ambientContainer.appendChild(orb);
            
            // Fade in orbs gradually
            setTimeout(() => {
                orb.classList.add('visible');
            }, 100);
        });
    }

    // 3. Fluid Cursor Glow Effect
    const cursorGlow = document.querySelector('.cursor-glow');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateGlow() {
        // Easing factor for smooth trailing
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        
        if (cursorGlow) {
            cursorGlow.style.left = `${glowX}px`;
            cursorGlow.style.top = `${glowY}px`;
        }
        
        requestAnimationFrame(animateGlow);
    }
    animateGlow();

    // 4. Logo 3D Tilt Effect on Hover
    const tiltWrapper = document.getElementById('tilt-wrapper');
    const logoImg = document.getElementById('logo-img');

    if (tiltWrapper && logoImg) {
        tiltWrapper.addEventListener('mousemove', (e) => {
            const rect = tiltWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const tiltX = ((y - centerY) / centerY) * -15; // Max 15 degree rotation
            const tiltY = ((x - centerX) / centerX) * 15;
            
            logoImg.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.05, 1.05, 1.05)`;
            logoImg.style.transition = `none`;
        });
        
        tiltWrapper.addEventListener('mouseleave', () => {
            logoImg.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
            logoImg.style.transition = `transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)`;
        });
    }

    // 5. Form submission handling
    const form = document.getElementById('invite-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const input = document.getElementById('email-input');
            if (input && input.value) {
                // Feedback state
                const btn = form.querySelector('.stealth-button span');
                const originalText = btn.innerText;
                btn.innerText = 'Encrypting...';
                
                // Simulate network latency / encryption sequence
                setTimeout(() => {
                    form.classList.add('submitted');
                }, 1200);
            }
        });
    }
});
