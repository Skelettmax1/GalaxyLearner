class FlashcardManager {
    constructor() {
        this.flashcards = [];
        this.currentIndex = 0;
        this.initializeEventListeners();
        this.isAnimating = false;
        this.isDragging = false;
    }

    loadFlashcards() {
        return [];
    }

    saveFlashcards() {
        // Removed localStorage functionality
    }

    shuffleFlashcards() {
        for (let i = this.flashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.flashcards[i], this.flashcards[j]] = [this.flashcards[j], this.flashcards[i]];
        }
        this.currentIndex = 0;
        this.updateDisplay();
    }

    addFlashcard(question, answer) {
        const newFlashcard = {
            id: Date.now(),
            question,
            answer,
            createdAt: new Date().toISOString()
        };
        this.flashcards.push(newFlashcard);
        this.shuffleFlashcards();
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.flashcards.length === 0) {
            document.getElementById('flashcard-question').textContent = 'No flashcards yet';
            document.getElementById('flashcard-answer').textContent = 'Create your first flashcard!';
            return;
        }

        const currentFlashcard = this.flashcards[this.currentIndex];
        document.getElementById('flashcard-question').textContent = currentFlashcard.question;
        document.getElementById('flashcard-answer').textContent = currentFlashcard.answer;
        
        // Reset card flip
        document.querySelector('.flashcard').classList.remove('flipped');
    }

    async swipeCard(direction) {
        if (this.isAnimating || this.flashcards.length === 0) return;
        this.isAnimating = true;

        const flashcardElement = document.querySelector('.flashcard');
        flashcardElement.classList.add(`swipe-${direction}`);
        
        // Match the CSS animation duration (600ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Update index based on swipe direction
        if (direction === 'left') {
            this.currentIndex = (this.currentIndex + 1) % this.flashcards.length;
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.flashcards.length) % this.flashcards.length;
        }
        
        // Update display and reset animation
        this.updateDisplay();
        flashcardElement.classList.remove(`swipe-${direction}`);
        this.isAnimating = false;
    }

    initializeEventListeners() {
        // Toggle creation panel on title click
        document.getElementById('appTitle').addEventListener('click', () => {
            const panel = document.getElementById('creationPanel');
            const cardContainer = document.querySelector('.flashcard-container');
            
            // Toggle visibility with a slight delay for smooth animation
            if (panel.classList.contains('visible')) {
                panel.classList.remove('visible');
                setTimeout(() => {
                    panel.style.display = 'none';
                    cardContainer.classList.remove('hidden');
                }, 300);
            } else {
                cardContainer.classList.add('hidden');
                setTimeout(() => {
                    panel.style.display = 'block';
                    // Force reflow
                    panel.offsetHeight;
                    panel.classList.add('visible');
                }, 300);
            }
        });

        const flashcard = document.querySelector('.flashcard');
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        let currentX = 0;
        let initialX = 0;

        const handleTouchStart = (e) => {
            if (this.isAnimating) return;
            const touch = e.type === 'mousedown' ? e : e.touches[0];
            
            touchStartTime = Date.now();
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            initialX = touch.clientX;
            currentX = initialX;
            
            flashcard.classList.add('dragging');
            this.isDragging = true;
        };

        const handleTouchMove = (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            
            const touch = e.type === 'mousemove' ? e : e.touches[0];
            currentX = touch.clientX;
            
            const diff = currentX - initialX;
            // Limit the drag distance
            const maxDrag = window.innerWidth * 0.4;
            const boundedDiff = Math.max(Math.min(diff, maxDrag), -maxDrag);
            
            flashcard.style.transform = `translateX(${boundedDiff}px)`;
            
            // Add tilt effect based on drag direction
            const tiltAngle = (boundedDiff / maxDrag) * 15;
            flashcard.style.transform += ` rotate(${tiltAngle}deg)`;
        };

        const handleTouchEnd = (e) => {
            if (!this.isDragging) return;
            
            const touch = e.type === 'mouseup' ? e : e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchDuration = Date.now() - touchStartTime;
            const moveX = Math.abs(touchEndX - touchStartX);
            const moveY = Math.abs(touchEndY - touchStartY);
            
            flashcard.classList.remove('dragging');
            flashcard.style.transform = '';
            this.isDragging = false;

            // Short tap without movement = flip
            if (touchDuration < 250 && moveX < 20 && moveY < 20) {
                flashcard.classList.toggle('flipped');
                return;
            }

            // Calculate swipe velocity
            const velocity = moveX / touchDuration;
            const swipeThreshold = window.innerWidth * 0.15; // 15% of screen width

            if (moveX > swipeThreshold || velocity > 0.5) {
                const direction = touchEndX < touchStartX ? 'left' : 'right';
                this.swipeCard(direction);
            }
        };

        // Touch events
        flashcard.addEventListener('touchstart', handleTouchStart, { passive: false });
        flashcard.addEventListener('touchmove', handleTouchMove, { passive: false });
        flashcard.addEventListener('touchend', handleTouchEnd);

        // Mouse events
        flashcard.addEventListener('mousedown', handleTouchStart);
        document.addEventListener('mousemove', handleTouchMove);
        document.addEventListener('mouseup', handleTouchEnd);

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            if (!this.isAnimating) {
                if (e.key === 'ArrowLeft') {
                    this.swipeCard('left');
                }
                if (e.key === 'ArrowRight') {
                    this.swipeCard('right');
                }
                if (e.key === ' ') {
                    e.preventDefault();
                    flashcard.classList.toggle('flipped');
                }
            }
        });

        // Prevent iOS Safari overscroll
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) return;
            e.preventDefault();
        }, { passive: false });
    }

    handleSwipe(diff) {
        if (Math.abs(diff) < 50) return;
        
        // Swipe right means correct (green), swipe left means incorrect (red)
        if (diff > 0) {
            this.swipeCard('right'); // Card flies right with green border
        } else {
            this.swipeCard('left'); // Card flies left with red border
        }
    }

    exportFlashcards() {
        const blob = new Blob([JSON.stringify(this.flashcards, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flashcards_export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importFlashcards(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.flashcards = JSON.parse(e.target.result);
                this.shuffleFlashcards();
            } catch (error) {
                alert('Error importing flashcards. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
}

class StarField {
    constructor() {
        this.canvas = document.getElementById('starfield');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.mouse = { x: 0, y: 0 };
        this.connectionRadius = 150;
        this.time = 0;
        this.maxStars = 200; // Maximum number of stars
        this.init();
    }

    init() {
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        this.animate();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createStars();
    }

    createStars() {
        this.stars = []; // Clear existing stars
        const calculatedStars = Math.floor((this.canvas.width * this.canvas.height) / 8000);
        const numStars = Math.min(calculatedStars, this.maxStars);
        
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5,
                speed: Math.random() * 0.2,
                opacity: 0.5 + Math.random() * 0.5
            });
        }
    }

    drawStar(star) {
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
    }

    drawConnections() {
        this.time += 0.005;
        this.ctx.lineWidth = 0.8;  // Dickere Linien

        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            const dx = this.mouse.x - star.x;
            const dy = this.mouse.y - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.connectionRadius) {
                // Dynamische Opacity für Mausverbindung
                const mouseOpacity = 0.4 + Math.sin(this.time + star.x) * 0.2;
                
                // Gradient zur Maus
                const gradient = this.ctx.createLinearGradient(star.x, star.y, this.mouse.x, this.mouse.y);
                gradient.addColorStop(0, `rgba(147, 51, 234, ${mouseOpacity})`);
                gradient.addColorStop(1, 'rgba(147, 51, 234, 0.2)');
                this.ctx.strokeStyle = gradient;
                
                this.ctx.beginPath();
                this.ctx.moveTo(star.x, star.y);
                this.ctx.lineTo(this.mouse.x, this.mouse.y);
                this.ctx.stroke();

                // Verbindungen zu nahen Sternen
                for (let j = i + 1; j < this.stars.length; j++) {
                    const star2 = this.stars[j];
                    const dx2 = star2.x - star.x;
                    const dy2 = star2.y - star.y;
                    const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                    if (distance2 < this.connectionRadius / 2) {
                        // Dynamische Opacity für Sternverbindungen
                        const starOpacity = 0.35 + Math.sin(this.time + star.x + star2.y) * 0.15;
                        this.ctx.strokeStyle = `rgba(147, 51, 234, ${starOpacity})`;
                        
                        this.ctx.beginPath();
                        this.ctx.moveTo(star.x, star.y);
                        this.ctx.lineTo(star2.x, star2.y);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw stars
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
            this.drawStar(star);
        });

        this.drawConnections();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize both managers
const flashcardManager = new FlashcardManager();
const starField = new StarField();

// Event Listeners
document.getElementById('addFlashcard').addEventListener('click', () => {
    const question = document.getElementById('question').value;
    const answer = document.getElementById('answer').value;
    
    if (question && answer) {
        flashcardManager.addFlashcard(question, answer);
        document.getElementById('question').value = '';
        document.getElementById('answer').value = '';
    }
});

document.getElementById('exportFlashcards').addEventListener('click', () => {
    flashcardManager.exportFlashcards();
});

document.getElementById('importButton').addEventListener('click', () => {
    document.getElementById('importFlashcards').click();
});

document.getElementById('importFlashcards').addEventListener('change', (event) => {
    flashcardManager.importFlashcards(event);
});
