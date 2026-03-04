// --- Game Constants ---
const TILE_SIZE = 40;
const MOVE_SPEED = 10;

// --- Classes ---

class Character {
    constructor(name, maxHp) {
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
    }
    isAlive() { return this.hp > 0; }
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        return amount;
    }
    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        return amount;
    }
}

class Player extends Character {
    constructor(name) {
        super(name, 100);
        this.xp = 0;
        this.level = 1;
        this.x = 50;
        this.y = 50;
        this.width = 30;
        this.height = 30;
    }

    // Combat Methods
    writeCode(target) {
        const damage = Math.floor(Math.random() * 15) + 10;
        target.takeDamage(damage);
        return { damage, msg: `Moodi furiously types code! Deployed a hotfix to ${target.name}.` };
    }
    drinkCoffee() {
        const healAmount = 20;
        this.heal(healAmount);
        return { heal: healAmount, msg: `Moodi sips dark roast coffee. HP restored.` };
    }
    debug(target) {
        if (Math.random() > 0.3) {
            const damage = Math.floor(Math.random() * 20) + 20;
            target.takeDamage(damage);
            return { success: true, damage, msg: `Moodi found the root cause! Smashed ${target.name} with a debugger.` };
        } else {
            return { success: false, damage: 0, msg: `Moodi tried to debug but got stuck in an infinite loop!` };
        }
    }
    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= 100) {
            this.level++;
            this.xp = 0;
            this.maxHp += 20;
            this.hp = this.maxHp;
            return true;
        }
        return false;
    }
}

class Enemy extends Character {
    constructor(name, maxHp, xpValue, art) {
        super(name, maxHp);
        this.xpValue = xpValue;
        this.art = art;
    }
    attack(target) {
        const damage = 5;
        target.takeDamage(damage);
        return { damage, msg: `${this.name} attacks!` };
    }
}

class Malik extends Enemy {
    constructor() {
        super("Malik (Goblin)", 60, 40, `( >_<)\n/|__|\\\n d  b`);
    }
    attack(target) {
        const moves = [
            { dmg: 8, msg: "Malik scrambles your code!" },
            { dmg: 5, msg: "Malik throws a pen at you!" }
        ];
        const move = moves[Math.floor(Math.random() * moves.length)];
        target.takeDamage(move.dmg);
        return { damage: move.dmg, msg: move.msg };
    }
}

class Inu extends Enemy {
    constructor() {
        super("Inu (Cat)", 80, 60, `/\\_/\\\n( o.o )\n > ^ <`);
    }
    attack(target) {
        const moves = [
            { dmg: 12, msg: "Inu jumps on the keyboard!" },
            { dmg: 8, msg: "Inu knocks over coffee!" }
        ];
        const move = moves[Math.floor(Math.random() * moves.length)];
        target.takeDamage(move.dmg);
        return { damage: move.dmg, msg: move.msg };
    }
}

class WiQi extends Enemy {
    constructor() {
        super("WiQi (Monster)", 120, 100, ` (.. )\n (   )\n/| | |\\`);
    }
    attack(target) {
        const moves = [
            { dmg: 15, msg: "WiQi disconnects the internet!" },
            { dmg: 10, msg: "WiQi causes lag!" }
        ];
        const move = moves[Math.floor(Math.random() * moves.length)];
        target.takeDamage(move.dmg);
        return { damage: move.dmg, msg: move.msg };
    }
}

// --- Room System ---

class Room {
    constructor(name, width, height) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.objects = []; // { type: 'enemy'|'door', x, y, w, h, instance, targetRoom }
    }

    addObject(obj) {
        this.objects.push(obj);
    }
}

// --- Game Engine ---

class Game {
    constructor() {
        this.player = new Player("Moodi");
        this.rooms = {};
        this.currentRoom = null;
        this.isCombat = false;
        this.combatEnemy = null;

        this.ui = {
            screens: {
                explore: document.getElementById('exploration-screen'),
                combat: document.getElementById('combat-screen')
            },
            world: document.getElementById('game-world'),
            avatar: document.getElementById('player-avatar'),
            location: document.getElementById('location-indicator'),
            worldLog: document.getElementById('world-log'),
            combatLog: document.getElementById('combat-log'),
            combat: {
                enemyName: document.getElementById('enemy-name'),
                enemyHp: document.getElementById('enemy-hp'),
                enemyMaxHp: document.getElementById('enemy-max-hp'),
                enemyHpBar: document.getElementById('enemy-hp-bar'),
                enemyArt: document.getElementById('enemy-art'),
                playerHp: document.getElementById('player-hp'),
                playerMaxHp: document.getElementById('player-max-hp'),
                playerHpBar: document.getElementById('player-hp-bar'),
                playerLvl: document.getElementById('player-lvl'),
                btns: {
                    attack: document.getElementById('btn-attack'),
                    heal: document.getElementById('btn-heal'),
                    special: document.getElementById('btn-special')
                }
            }
        };

        this.initWorld();
        this.initListeners();
        this.enterRoom('bedroom');
        this.log("Welcome to Moodi's Room! Use Arrow Keys to move.");
    }

    initWorld() {
        // Create Rooms
        const bedroom = new Room("Bedroom", 600, 400);
        bedroom.addObject({ type: 'door', x: 550, y: 150, w: 50, h: 100, targetRoom: 'kitchen', label: 'Kitchen >' });

        const kitchen = new Room("Kitchen", 600, 400);
        kitchen.addObject({ type: 'door', x: 0, y: 150, w: 50, h: 100, targetRoom: 'bedroom', label: '< Bedroom' });
        kitchen.addObject({ type: 'door', x: 550, y: 150, w: 50, h: 100, targetRoom: 'livingroom', label: 'Living >' });
        kitchen.addObject({ type: 'enemy', x: 300, y: 200, w: 40, h: 40, instance: new Inu(), label: '🐱' });

        const livingroom = new Room("Living Room", 600, 400);
        livingroom.addObject({ type: 'door', x: 0, y: 150, w: 50, h: 100, targetRoom: 'kitchen', label: '< Kitchen' });
        livingroom.addObject({ type: 'enemy', x: 400, y: 100, w: 40, h: 40, instance: new Malik(), label: '👺' });
        livingroom.addObject({ type: 'enemy', x: 400, y: 300, w: 40, h: 40, instance: new WiQi(), label: '📶' });

        this.rooms = { bedroom, kitchen, livingroom };
    }

    initListeners() {
        document.addEventListener('keydown', (e) => this.handleInput(e));

        this.ui.combat.btns.attack.addEventListener('click', () => this.combatTurn('attack'));
        this.ui.combat.btns.heal.addEventListener('click', () => this.combatTurn('heal'));
        this.ui.combat.btns.special.addEventListener('click', () => this.combatTurn('special'));
    }

    handleInput(e) {
        if (this.isCombat) return;

        const speed = MOVE_SPEED;
        let dx = 0;
        let dy = 0;

        if (e.key === 'ArrowUp' || e.key === 'w') dy = -speed;
        if (e.key === 'ArrowDown' || e.key === 's') dy = speed;
        if (e.key === 'ArrowLeft' || e.key === 'a') dx = -speed;
        if (e.key === 'ArrowRight' || e.key === 'd') dx = speed;

        if (dx !== 0 || dy !== 0) {
            this.movePlayer(dx, dy);
        }
    }

    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // Boundary Check
        if (newX < 0 || newX > this.currentRoom.width - this.player.width) return;
        if (newY < 0 || newY > this.currentRoom.height - this.player.height) return;

        this.player.x = newX;
        this.player.y = newY;
        this.updateAvatarPosition();
        this.checkCollisions();
    }

    updateAvatarPosition() {
        this.ui.avatar.style.left = `${this.player.x}px`;
        this.ui.avatar.style.top = `${this.player.y}px`;
    }

    enterRoom(roomName) {
        this.currentRoom = this.rooms[roomName];
        this.ui.location.innerText = `LOCATION: ${this.currentRoom.name.toUpperCase()}`;

        // Reset player pos relative to entry (simplified)
        if (roomName === 'bedroom') { this.player.x = 50; this.player.y = 200; }
        else if (roomName === 'kitchen') { this.player.x = 50; this.player.y = 200; } // Coming from left usually

        this.renderRoom();
        this.updateAvatarPosition();
    }

    renderRoom() {
        // Clear old objects (except avatar)
        const children = Array.from(this.ui.world.children);
        children.forEach(child => {
            if (child.id !== 'player-avatar') this.ui.world.removeChild(child);
        });

        // Add new objects
        this.currentRoom.objects.forEach(obj => {
            const el = document.createElement('div');
            el.className = 'room-object';
            if (obj.type === 'enemy') el.classList.add('enemy-avatar');
            if (obj.type === 'door') el.classList.add('door');

            el.style.left = `${obj.x}px`;
            el.style.top = `${obj.y}px`;
            el.style.width = `${obj.w}px`;
            el.style.height = `${obj.h}px`;
            el.innerText = obj.label || '';

            this.ui.world.appendChild(el);
        });
    }

    checkCollisions() {
        const pRect = { x: this.player.x, y: this.player.y, w: this.player.width, h: this.player.height };

        for (let i = 0; i < this.currentRoom.objects.length; i++) {
            const obj = this.currentRoom.objects[i];
            const oRect = { x: obj.x, y: obj.y, w: obj.w, h: obj.h };

            if (this.isColliding(pRect, oRect)) {
                if (obj.type === 'door') {
                    this.enterRoom(obj.targetRoom);
                    // Adjust position to avoid instant re-collision
                    if (obj.x < 100) this.player.x = 500; // Entered from left, spawn right
                    else this.player.x = 50; // Entered from right, spawn left
                    this.updateAvatarPosition();
                } else if (obj.type === 'enemy') {
                    this.startCombat(obj.instance, i);
                }
                break; // Handle one collision at a time
            }
        }
    }

    isColliding(r1, r2) {
        return r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y;
    }

    log(msg, type = 'story-msg') {
        const p = document.createElement('p');
        p.className = type;
        p.innerText = `> ${msg}`;
        if (this.isCombat) {
            this.ui.combatLog.appendChild(p);
            this.ui.combatLog.scrollTop = this.ui.combatLog.scrollHeight;
        } else {
            this.ui.worldLog.appendChild(p);
            this.ui.worldLog.scrollTop = this.ui.worldLog.scrollHeight;
        }
    }

    // --- Combat System ---

    startCombat(enemy, enemyIndex) {
        this.isCombat = true;
        this.combatEnemy = enemy;
        this.combatEnemyIndex = enemyIndex; // To remove from room if defeated

        this.ui.screens.explore.classList.add('hidden');
        this.ui.screens.combat.classList.remove('hidden');

        // Setup UI
        this.ui.combat.enemyName.innerText = enemy.name;
        this.ui.combat.enemyArt.innerText = enemy.art;
        this.ui.combatLog.innerHTML = ''; // Clear old log
        this.log(`Encountered ${enemy.name}!`, 'system-msg');

        this.updateCombatUI();
    }

    updateCombatUI() {
        if (!this.combatEnemy) return;

        this.ui.combat.enemyHp.innerText = this.combatEnemy.hp;
        this.ui.combat.enemyMaxHp.innerText = this.combatEnemy.maxHp;
        const enemyPct = (this.combatEnemy.hp / this.combatEnemy.maxHp) * 100;
        this.ui.combat.enemyHpBar.style.width = `${enemyPct}%`;

        this.ui.combat.playerHp.innerText = this.player.hp;
        this.ui.combat.playerMaxHp.innerText = this.player.maxHp;
        this.ui.combat.playerLvl.innerText = this.player.level;
        const playerPct = (this.player.hp / this.player.maxHp) * 100;
        this.ui.combat.playerHpBar.style.width = `${playerPct}%`;
    }

    combatTurn(action) {
        if (!this.isCombat) return;

        let result;
        switch (action) {
            case 'attack':
                result = this.player.writeCode(this.combatEnemy);
                this.log(result.msg, "combat-msg");
                break;
            case 'heal':
                result = this.player.drinkCoffee();
                this.log(result.msg, "success-msg");
                break;
            case 'special':
                result = this.player.debug(this.combatEnemy);
                this.log(result.msg, result.success ? "combat-msg" : "damage-msg");
                break;
        }
        this.updateCombatUI();

        if (!this.combatEnemy.isAlive()) {
            setTimeout(() => this.endCombat(true), 1000);
        } else {
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }

    enemyTurn() {
        if (!this.isCombat) return;
        const result = this.combatEnemy.attack(this.player);
        this.log(result.msg, "damage-msg");
        this.updateCombatUI();

        if (!this.player.isAlive()) {
            setTimeout(() => this.endCombat(false), 1000);
        }
    }

    endCombat(victory) {
        this.isCombat = false;
        this.ui.screens.explore.classList.remove('hidden');
        this.ui.screens.combat.classList.add('hidden');

        if (victory) {
            this.log(`Defeated ${this.combatEnemy.name}!`, 'success-msg');
            this.player.gainXp(this.combatEnemy.xpValue);
            // Remove enemy from room
            this.currentRoom.objects.splice(this.combatEnemyIndex, 1);
            this.renderRoom();
        } else {
            this.log("GAME OVER. Refresh to restart.", "damage-msg");
            alert("GAME OVER");
            location.reload();
        }
        this.combatEnemy = null;
    }
}

// Start Game
window.onload = () => {
    const game = new Game();
};
