const API_URL = "/api/interpret";

const majorArcana = [
    "愚者 (The Fool)", "魔术师 (The Magician)", "女祭司 (The High Priestess)", "皇后 (The Empress)", 
    "皇帝 (The Emperor)", "教皇 (The Hierophant)", "恋人 (The Lovers)", "战车 (The Chariot)", 
    "力量 (Strength)", "隐士 (The Hermit)", "命运之轮 (Wheel of Fortune)", "正义 (Justice)", 
    "倒吊人 (The Hanged Man)", "死神 (Death)", "节制 (Temperance)", "恶魔 (The Devil)", 
    "高塔 (The Tower)", "星星 (The Star)", "月亮 (The Moon)", "太阳 (The Sun)", 
    "审判 (Judgement)", "世界 (The World)"
];

const suits = ["权杖 (Wands)", "圣杯 (Cups)", "宝剑 (Swords)", "星币 (Pentacles)"];
const ranks = ["王牌 (Ace)", "2", "3", "4", "5", "6", "7", "8", "9", "10", "侍从 (Page)", "骑士 (Knight)", "王后 (Queen)", "国王 (King)"];

// DOM Elements
const inputSection = document.getElementById('inputSection');
const gameArea = document.getElementById('gameArea');
const interpretationSection = document.getElementById('interpretation-section');
const spreadArea = document.getElementById('spread-area');
const handArea = document.getElementById('hand-area');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const drawCountInput = document.getElementById('drawCount');
const questionInput = document.getElementById('question');
const statusText = document.getElementById('statusText');
const loadingEl = document.getElementById('loading');
const resultContent = document.getElementById('result-content');

let currentDeck = [];
let targetCount = 0;
let drawnCards = [];
let isGameActive = false;
let userQuestion = "";

function generateDeck() {
    let deck = [];
    majorArcana.forEach((name, index) => {
        deck.push({ name: name, type: "大阿卡纳", id: `major-${index}` });
    });
    suits.forEach(suit => {
        ranks.forEach((rank, index) => {
            deck.push({ name: `${suit} - ${rank}`, type: "小阿卡纳", id: `minor-${suit}-${index}` });
        });
    });
    return deck;
}

// Fisher-Yates Shuffle (Fallback)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// True Random Shuffle using Quantum Random Numbers
async function trueRandomShuffle(deck) {
    try {
        const response = await fetch('/api/random');
        if (!response.ok) throw new Error('Random API failed');
        
        const data = await response.json();
        // data.data is array of numbers from ANU API
        const randomValues = data.data; 
        
        if (!randomValues || randomValues.length < deck.length) {
            throw new Error('Not enough random numbers');
        }

        // Assign random value to each card
        const deckWithRandom = deck.map((card, index) => ({
            card,
            sortValue: randomValues[index]
        }));
        
        // Sort based on the quantum random values
        deckWithRandom.sort((a, b) => a.sortValue - b.sortValue);
        
        return deckWithRandom.map(item => item.card);
    } catch (e) {
        console.warn("True random failed, falling back to pseudo-random", e);
        return shuffle(deck); // Fallback to Fisher-Yates
    }
}

startBtn.addEventListener('click', initGame);
resetBtn.addEventListener('click', resetGame);

async function initGame() {
    const count = parseInt(drawCountInput.value);
    userQuestion = questionInput.value.trim();

    if (!userQuestion) {
        alert("请先在心中默念你的问题，并输入在文本框中。");
        return;
    }
    if (count < 1 || count > 10) {
        alert("请输入1到10之间的数量");
        return;
    }

    targetCount = count;
    drawnCards = [];
    isGameActive = true;
    
    // UI Transition
    inputSection.style.display = 'none';
    gameArea.style.display = 'block';
    interpretationSection.style.display = 'none';
    resetBtn.style.display = 'none';
    
    spreadArea.innerHTML = '';
    handArea.innerHTML = '';

    // Show loading state for shuffling
    statusText.textContent = "正在接收宇宙能量洗牌...";
    startBtn.disabled = true; // Prevent double click

    // Generate and shuffle deck
    const rawDeck = generateDeck();
    currentDeck = await trueRandomShuffle(rawDeck);

    startBtn.disabled = false;
    statusText.textContent = `请凝视星空，凭直觉抽取 ${targetCount} 张牌...`;

    renderSpreadDeck();
}

function resetGame() {
    gameArea.style.display = 'none';
    interpretationSection.style.display = 'none';
    inputSection.style.display = 'block';
    questionInput.value = '';
    // Optional: keep the question if user wants to ask again? No, clear it for fresh start.
}

function renderSpreadDeck() {
    const totalCards = currentDeck.length;
    const containerWidth = spreadArea.clientWidth || 800;
    // Check if mobile for card width
    const isMobile = window.innerWidth <= 768;
    const cardWidth = isMobile ? 60 : 90; 
    
    const availableWidth = containerWidth - cardWidth;
    const step = availableWidth / (totalCards - 1);

    currentDeck.forEach((cardData, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-spread-item';
        
        const leftPos = index * step;
        const randomY = Math.random() * 20;
        const randomRot = (Math.random() * 10) - 5;

        cardEl.style.left = `${leftPos}px`;
        cardEl.style.top = `${20 + randomY}px`;
        cardEl.style.transform = `rotate(${randomRot}deg)`;
        
        cardEl.addEventListener('click', () => onCardClick(cardData, cardEl));
        spreadArea.appendChild(cardEl);
    });
}

function onCardClick(cardData, cardEl) {
    if (!isGameActive || drawnCards.length >= targetCount) return;
    if (cardEl.classList.contains('drawn')) return;

    cardEl.classList.add('drawn');
    cardEl.style.opacity = '0';
    cardEl.style.pointerEvents = 'none';

    // Determine orientation (50% chance)
    cardData.isReversed = Math.random() < 0.5;
    drawnCards.push(cardData);
    
    revealCard(cardData);

    if (drawnCards.length >= targetCount) {
        isGameActive = false;
        statusText.textContent = "抽取完成，正在解读...";
        setTimeout(interpretCards, 1500); // Wait a bit after last card
    } else {
        statusText.textContent = `已抽取 ${drawnCards.length}/${targetCount} 张`;
    }
}

function revealCard(cardData) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const back = document.createElement('div');
    back.className = 'card-back-face';

    const front = document.createElement('div');
    front.className = 'card-front';
    
    const nameEl = document.createElement('div');
    nameEl.className = 'card-name';
    nameEl.textContent = cardData.name;

    const typeEl = document.createElement('div');
    typeEl.className = 'card-type';
    typeEl.textContent = cardData.type;

    front.appendChild(nameEl);
    front.appendChild(typeEl);

    if (cardData.isReversed) {
        const revEl = document.createElement('div');
        revEl.className = 'reversed';
        revEl.textContent = "逆位";
        front.appendChild(revEl);
        front.style.transform = "rotateY(180deg) rotate(180deg)";
    }

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);
    handArea.appendChild(card);

    setTimeout(() => {
        card.classList.add('flipped');
    }, 100);
}

async function interpretCards() {
    interpretationSection.style.display = 'block';
    loadingEl.style.display = 'flex';
    resultContent.innerHTML = '';
    
    // Show user question
    document.getElementById('review-question-text').textContent = userQuestion;
    
    // Scroll to interpretation
    interpretationSection.scrollIntoView({ behavior: 'smooth' });

    const cardsDescription = drawnCards.map((c, i) => 
        `${i + 1}. ${c.name} (${c.isReversed ? "逆位" : "正位"})`
    ).join("\n");

    const prompt = `
    你是一位神秘而智慧的塔罗牌占卜师。
    用户的问题是：${userQuestion}
    用户抽到的牌是：
    ${cardsDescription}
    
    请根据用户的问题和抽到的牌，进行详细的解读。
    解读风格应该是神秘、富有启发性且温暖的。
    请使用Markdown格式输出，可以使用加粗、列表、标题等格式来组织内容，使其易于阅读。
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const interpretation = data.choices[0].message.content;

        loadingEl.style.display = 'none';
        
        // Render Markdown
        resultContent.innerHTML = marked.parse(interpretation);
        
        // Simple fade in effect
        resultContent.style.opacity = 0;
        resultContent.style.transition = 'opacity 1s ease-in';
        setTimeout(() => {
            resultContent.style.opacity = 1;
        }, 100);

        resetBtn.style.display = 'inline-block';

    } catch (error) {
        console.error(error);
        loadingEl.style.display = 'none';
        resultContent.textContent = "星灵的连接似乎受到了干扰，请稍后再试。\n(错误信息: " + error.message + ")";
        resetBtn.style.display = 'inline-block';
    }
}

// Handle window resize to re-spread if needed (optional, but good for UX)
window.addEventListener('resize', () => {
    if (isGameActive && drawnCards.length === 0) {
        renderSpreadDeck();
    }
});
