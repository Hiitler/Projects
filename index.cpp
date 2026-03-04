// moodi_game.cpp
#include <iostream>
#include <string>
#include <vector>
#include <ctime>
#include <cstdlib>
#include <limits>

using namespace std;

// ---------- Base class for any entity ----------
class Entity {
protected:
    string name;
    int hp;
    int maxHp;
    int attackPower;
public:
    Entity(string n="", int h=10, int atk=2) : name(n), hp(h), maxHp(h), attackPower(atk) {}
    virtual ~Entity() = default;
    virtual int attack() { return attackPower; }
    virtual void takeDamage(int d) { hp -= d; if (hp < 0) hp = 0; }
    bool isAlive() const { return hp > 0; }
    string getName() const { return name; }
    int getHp() const { return hp; }
    int getMaxHp() const { return maxHp; }
};

// ---------- Player class (derived) ----------
class Player : public Entity {
    int level;
    int xp;
    int potions;
public:
    Player(string n="Moodi", int h=20, int atk=4)
        : Entity(n,h,atk), level(1), xp(0), potions(2) {}

    // Level up when XP threshold reached
    void addXp(int amount) {
        xp += amount;
        while (xp >= level * 10) {
            xp -= level * 10;
            level++;
            maxHp += 5;
            attackPower += 1;
            hp = maxHp;
            cout << "\n*** " << name << " leveled up! Now level " << level << " ***\n";
        }
    }

    int attack() override {
        // small random variance for fun
        int variance = (rand() % 3) - 1; // -1,0,1
        int dmg = attackPower + variance;
        if (dmg < 1) dmg = 1;
        return dmg;
    }

    void healWithPotion() {
        if (potions <= 0) {
            cout << "No potions left!\n";
            return;
        }
        potions--;
        int heal = maxHp/3;
        hp += heal;
        if (hp > maxHp) hp = maxHp;
        cout << name << " drinks a weirdly fizzy potion and recovers " << heal << " HP!\n";
    }

    void addPotion() { potions++; }
    int getLevel() const { return level; }
    int getXp() const { return xp; }
    int getPotions() const { return potions; }

    // Operator overload to print player status quickly
    friend ostream& operator<<(ostream& os, const Player& p) {
        os << p.name << " (Lv " << p.level << ") HP: " << p.hp << "/" << p.maxHp
           << " | ATK: " << p.attackPower << " | XP: " << p.xp << "/" << p.level*10
           << " | Potions: " << p.potions;
        return os;
    }
};

// ---------- Enemy class (derived) ----------
class Enemy : public Entity {
    string taunt;
public:
    Enemy(string n, int h, int atk, string t) : Entity(n,h,atk), taunt(t) {}
    int attack() override {
        // stronger enemies sometimes do critical hits
        int chance = rand() % 10;
        if (chance == 0) {
            cout << ">> " << name << " strikes a CRITICAL hit!\n";
            return attackPower * 2;
        }
        return attackPower;
    }
    void sayTaunt() const {
        cout << name << " says: \"" << taunt << "\"\n";
    }
};

// ---------- A Level with one primary enemy and possible minions ----------
struct Level {
    int id;
    string title;
    string story;
    Enemy boss;
    vector<Enemy> minions;
    int xpReward;
    Level(int i, string t, string s, Enemy b, vector<Enemy> m, int xp)
        : id(i), title(t), story(s), boss(b), minions(m), xpReward(xp) {}
};

// ---------- Game class controlling flow ----------
class Game {
    Player player;
    vector<Level> levels;
public:
    Game(const Player& p) : player(p) {}

    void setupLevels() {
        // Level 1: Silly Sock Goblin
        levels.emplace_back(1,
            "Laundry Lane",
            "The socks in the laundry have come alive and one stole Moodi's favorite slipper!",
            Enemy("Sock Goblin", 8, 2, "I smell detergent!"),
            vector<Enemy>{}, 8);

        // Level 2: Sticky-Toffee Bird
        levels.emplace_back(2,
            "Kitchen Countertop",
            "A toffee bird guards a sugary treasure. It tweets suspiciously.",
            Enemy("Toffee Bird", 12, 3, "Tweet-tweet... give me crumbs"),
            vector<Enemy>{ Enemy("Tiny Crumbling", 4, 1, "peep") }, 12);

        // Level 3: Suspicious Doorway
        levels.emplace_back(3,
            "Hall of Echoes",
            "Whispers say a doorway creaks when you are not looking. Creepy suspense!",
            Enemy("Creaking Door", 18, 4, "...click..."),
            vector<Enemy>{ Enemy("Echo", 5, 1, "You heard that?") , Enemy("Shadow Puddle",6,1,"...") }, 18);

        // Level 4: The Boss - The Laundry Monster (final)
        levels.emplace_back(4,
            "Laundry Lair - Final Showdown",
            "All the missing socks, slippers, and a haunted dryer have formed a Laundry Monster!",
            Enemy("Laundry Monster", 30, 6, "BAH! Give me your lint!"),
            vector<Enemy>{ Enemy("Lint Golem", 6, 2, "fluff"), Enemy("Lost Button", 5, 1, "click") }, 40);
    }

    void printIntro() {
        cout << "Welcome to...\n\n"
             << "  Moodi's Mischief: A tiny tale of one brave (and slightly grumpy) hero.\n\n"
             << "Story: Moodi woke up to find something weird: the world is misplacing small things!\n"
             << "Solve the mystery by progressing through levels, battling silly creatures, collecting XP and potions.\n\n";
        pauseForEffect();
    }

    void pauseForEffect() {
        cout << "\n(Press ENTER to continue...)";
        cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    }

    // run a level
    bool playLevel(Level& lvl) {
        cout << "\n--- Level " << lvl.id << ": " << lvl.title << " ---\n";
        cout << lvl.story << "\n";
        cout << "A wild " << lvl.boss.getName() << " appears!\n";
        lvl.boss.sayTaunt();

        // fight minions first (if any)
        for (Enemy& m : lvl.minions) {
            cout << "\nA minion appears: " << m.getName() << " (HP: " << m.getHp() << ")\n";
            if (!fightSingleEnemy(m)) return false;
            cout << "You defeated the minion " << m.getName() << "!\n";
            player.addXp(3);
            maybeGetPotion();
        }

        // boss fight
        cout << "\nNow face the boss: " << lvl.boss.getName() << " (HP: " << lvl.boss.getHp() << ")\n";
        if (!fightSingleEnemy(lvl.boss)) return false;

        cout << "\n*** You defeated " << lvl.boss.getName() << "! ***\n";
        player.addXp(lvl.xpReward);
        maybeGetPotion();
        return true;
    }

    // single enemy combat loop
    bool fightSingleEnemy(Enemy& enemy) {
        // short suspenseful intro
        cout << "It's tense... the lights flicker... your hands get clammy.\n";
        pauseForEffect();

        while (player.isAlive() && enemy.isAlive()) {
            cout << "\n" << player << "\n";
            cout << enemy.getName() << " HP: " << enemy.getHp() << "\n";
            cout << "Choose action: [1] Attack  [2] Defend  [3] Potion  [4] Try to Flee\n> ";
            int choice = getChoice(1,4);

            if (choice == 1) {
                int dmg = player.attack();
                cout << "You attack " << enemy.getName() << " for " << dmg << " damage.\n";
                enemy.takeDamage(dmg);
            } else if (choice == 2) {
                cout << "You brace yourself. (Reduced incoming damage this turn)\n";
            } else if (choice == 3) {
                player.healWithPotion();
            } else {
                // flee attempt chance
                int chance = rand() % 100;
                if (chance < 40) {
                    cout << "You slipped away awkwardly. Flee successful.\n";
                    return true; // escaped, treat as not defeated but level can continue
                } else {
                    cout << "Flee failed! The enemy blocks your way.\n";
                }
            }

            // enemy's turn if still alive
            if (enemy.isAlive()) {
                int edmg = enemy.attack();
                // if player defended, reduce damage
                if (choice == 2) edmg = max(0, edmg - 2);
                cout << enemy.getName() << " hits you for " << edmg << " damage.\n";
                player.takeDamage(edmg);
            }
        }

        return player.isAlive();
    }

    // simple input validation
    int getChoice(int lo, int hi) {
        int c;
        while (true) {
            if (!(cin >> c)) {
                cin.clear();
                cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
                cout << "Enter a number between " << lo << " and " << hi << ": ";
                continue;
            }
            cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            if (c < lo || c > hi) {
                cout << "Enter a number between " << lo << " and " << hi << ": ";
                continue;
            }
            return c;
        }
    }

    void maybeGetPotion() {
        int chance = rand() % 100;
        if (chance < 30) {
            player.addPotion();
            cout << "You found a fizzy potion on the floor! +1 potion.\n";
        }
    }

    void start() {
        printIntro();
        setupLevels();

        for (Level& lvl : levels) {
            bool survived = playLevel(lvl);
            if (!survived) {
                cout << "\nOh no! Moodi has fainted... The mystery remains unsolved.\n";
                cout << "Final status: " << player << "\n";
                cout << "Try again to finish the tale!\n";
                return;
            } else {
                cout << "\nLevel " << lvl.id << " cleared! Take a breath...\n";
            }
        }

        cout << "\nCongratulations! Moodi solved the Mystery of the Missing Things!\n";
        cout << "Final status: " << player << "\n";
    }
};

// ---------- main ----------
int main() {
    srand(static_cast<unsigned int>(time(nullptr)));

    cout << "Enter a name for your hero (or press ENTER to keep 'Moodi'):\n> ";
    string name;
    getline(cin, name);
    if (name.empty()) name = "Moodi";

    Player player(name);
    Game game(player);
    game.start();

    cout << "\nThanks for playing Moodi's Mischief!\n";
    return 0;
}
