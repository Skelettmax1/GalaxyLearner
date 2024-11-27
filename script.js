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
            panel.classList.toggle('visible');
        });

        // Card flip
        const flashcard = document.querySelector('.flashcard');
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;

        flashcard.addEventListener('touchstart', (e) => {
            if (!this.isAnimating) {
                touchStartTime = Date.now();
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        });

        flashcard.addEventListener('touchend', (e) => {
            if (this.isAnimating) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - touchStartTime;
            const moveX = Math.abs(touchEndX - touchStartX);
            const moveY = Math.abs(touchEndY - touchStartY);

            // If it's a quick tap without much movement, treat as a flip
            if (touchDuration < 250 && moveX < 20 && moveY < 20) {
                flashcard.classList.toggle('flipped');
            } else if (moveX > 50) {
                // If there's significant horizontal movement, handle as swipe
                this.handleSwipe(touchEndX - touchStartX);
            }
        });

        // Mouse handling
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let clickStartTime = 0;

        flashcard.addEventListener('mousedown', (e) => {
            if (!this.isAnimating) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                clickStartTime = Date.now();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || this.isAnimating) return;
            
            const moveX = Math.abs(e.clientX - startX);
            const moveY = Math.abs(e.clientY - startY);
            
            if (moveX > 50) {
                this.handleSwipe(e.clientX - startX);
                isDragging = false;
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            const moveX = Math.abs(e.clientX - startX);
            const moveY = Math.abs(e.clientY - startY);
            const clickDuration = Date.now() - clickStartTime;

            // If it's a quick click without much movement, treat as a flip
            if (clickDuration < 250 && moveX < 20 && moveY < 20) {
                flashcard.classList.toggle('flipped');
            }
            
            isDragging = false;
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard if we're not typing in an input field
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            if (!this.isAnimating) {
                if (e.key === 'ArrowLeft') {
                    this.swipeCard('left'); // Swipe left (incorrect)
                }
                if (e.key === 'ArrowRight') {
                    this.swipeCard('right'); // Swipe right (correct)
                }
                if (e.key === ' ') {
                    e.preventDefault(); // Prevent page scroll
                    flashcard.classList.toggle('flipped');
                }
            }
        });
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
                // Dynamische Opacity fÃ¼r Mausverbindung
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
                        // Dynamische Opacity fÃ¼r Sternverbindungen
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
