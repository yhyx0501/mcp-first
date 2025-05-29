// 游戏状态管理
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.difficultySelect = document.getElementById('difficulty');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        
        // 游戏配置
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // 游戏状态
        this.gameState = 'waiting'; // waiting, playing, paused, gameOver
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameSpeed = 150;
        
        // 蛇的初始状态
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        
        // 食物
        this.food = { x: 15, y: 15 };
        
        // 难度设置
        this.difficulties = {
            easy: { speed: 200, scoreMultiplier: 1 },
            medium: { speed: 150, scoreMultiplier: 1.5 },
            hard: { speed: 100, scoreMultiplier: 2 },
            extreme: { speed: 60, scoreMultiplier: 3 }
        };
        
        this.init();
    }
    
    init() {
        this.updateHighScore();
        this.setupEventListeners();
        this.generateFood();
        this.showStartScreen();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 按钮事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        
        // 难度选择
        this.difficultySelect.addEventListener('change', () => this.updateDifficulty());
        
        // 移动端控制
        const dpadButtons = document.querySelectorAll('.dpad-btn[data-direction]');
        dpadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.getAttribute('data-direction');
                this.handleDirectionInput(direction);
            });
        });
        
        // 触摸控制
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 30) this.handleDirectionInput('right');
                else if (deltaX < -30) this.handleDirectionInput('left');
            } else {
                if (deltaY > 30) this.handleDirectionInput('down');
                else if (deltaY < -30) this.handleDirectionInput('up');
            }
        });
    }
    
    handleKeyPress(e) {
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                this.handleDirectionInput('up');
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                this.handleDirectionInput('down');
                break;
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                this.handleDirectionInput('left');
                break;
            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                this.handleDirectionInput('right');
                break;
            case 'Space':
                e.preventDefault();
                if (this.gameState === 'waiting') {
                    this.startGame();
                } else {
                    this.togglePause();
                }
                break;
        }
    }
    
    handleDirectionInput(direction) {
        if (this.gameState !== 'playing') return;
        
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        
        const newDirection = directions[direction];
        
        // 防止蛇反向移动
        if (newDirection.x === -this.direction.x && newDirection.y === -this.direction.y) {
            return;
        }
        
        this.nextDirection = newDirection;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.snake = [{ x: 10, y: 10 }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.generateFood();
        this.updateScore();
        this.hideOverlay();
        this.updateDifficulty();
    }
    
    restartGame() {
        this.startGame();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showPauseScreen();
            this.pauseBtn.textContent = '▶';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.hideOverlay();
            this.pauseBtn.textContent = '⏸';
        }
    }
    
    updateDifficulty() {
        const difficulty = this.difficultySelect.value;
        const settings = this.difficulties[difficulty];
        this.gameSpeed = settings.speed;
        this.scoreMultiplier = settings.scoreMultiplier;
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        this.food = newFood;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // 更新方向
        this.direction = { ...this.nextDirection };
        
        // 移动蛇头
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // 检查边界碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // 检查自身碰撞
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // 检查食物碰撞
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += Math.floor(10 * this.scoreMultiplier);
            this.updateScore();
            this.generateFood();
            this.addScoreAnimation();
        } else {
            this.snake.pop();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.updateHighScore();
        this.showGameOverScreen();
        this.addShakeAnimation();
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        this.highScoreElement.textContent = this.highScore;
    }
    
    showStartScreen() {
        this.overlayTitle.textContent = '🐍 贪吃蛇';
        this.overlayMessage.textContent = '按空格键或点击开始按钮开始游戏';
        this.startBtn.classList.remove('hidden');
        this.restartBtn.classList.add('hidden');
        this.showOverlay();
    }
    
    showPauseScreen() {
        this.overlayTitle.textContent = '⏸ 游戏暂停';
        this.overlayMessage.textContent = '按空格键继续游戏';
        this.startBtn.classList.add('hidden');
        this.restartBtn.classList.remove('hidden');
        this.showOverlay();
    }
    
    showGameOverScreen() {
        this.overlayTitle.textContent = '💀 游戏结束';
        this.overlayMessage.textContent = `最终分数: ${this.score}${this.score === this.highScore ? ' (新纪录!)' : ''}`;
        this.startBtn.classList.add('hidden');
        this.restartBtn.classList.remove('hidden');
        this.showOverlay();
    }
    
    showOverlay() {
        this.gameOverlay.classList.remove('hidden');
    }
    
    hideOverlay() {
        this.gameOverlay.classList.add('hidden');
    }
    
    addScoreAnimation() {
        this.scoreElement.classList.add('pulse');
        setTimeout(() => {
            this.scoreElement.classList.remove('pulse');
        }, 500);
    }
    
    addShakeAnimation() {
        this.canvas.classList.add('shake');
        setTimeout(() => {
            this.canvas.classList.remove('shake');
        }, 500);
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制蛇
        this.drawSnake();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            const pos = i * this.gridSize;
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        // 食物发光效果
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 20;
        
        // 绘制食物
        const gradient = this.ctx.createRadialGradient(
            x + this.gridSize / 2, y + this.gridSize / 2, 0,
            x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2
        );
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ee5a52');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        
        // 重置阴影
        this.ctx.shadowBlur = 0;
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            if (index === 0) {
                // 蛇头
                this.ctx.shadowColor = '#4ecdc4';
                this.ctx.shadowBlur = 15;
                
                const gradient = this.ctx.createRadialGradient(
                    x + this.gridSize / 2, y + this.gridSize / 2, 0,
                    x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2
                );
                gradient.addColorStop(0, '#4ecdc4');
                gradient.addColorStop(1, '#44a08d');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
                
                // 绘制眼睛
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(x + 4, y + 4, 3, 3);
                this.ctx.fillRect(x + this.gridSize - 7, y + 4, 3, 3);
                
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x + 5, y + 5, 1, 1);
                this.ctx.fillRect(x + this.gridSize - 6, y + 5, 1, 1);
            } else {
                // 蛇身
                const alpha = Math.max(0.3, 1 - (index * 0.1));
                this.ctx.shadowColor = `rgba(78, 205, 196, ${alpha})`;
                this.ctx.shadowBlur = 10;
                
                this.ctx.fillStyle = `rgba(78, 205, 196, ${alpha})`;
                this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            }
        });
        
        // 重置阴影
        this.ctx.shadowBlur = 0;
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        setTimeout(() => {
            this.gameLoop();
        }, this.gameSpeed);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

// 防止页面滚动
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

// 防止右键菜单
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});