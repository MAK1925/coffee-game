let money = 500, day = 1, pointCost = 1000, machineLevel = 1, machineCost = 500, baristaCost = 2000;
let fullDays = 15; const MAX_FULL_DAYS = 100; let dayTimerSeconds = 300;
let pointsList = [{ id: 1, price: 100, upgrades: { umbrella: false, sign: false, board: false, music: false }, secondCounter: false, baristasAssigned: 0, wins: 0 }];
let baristasList = []; let hasManager = false; let managerCost = 5000;
let taxAccumulated = 0, depositBalance = 0, debt = 0;
let hasActiveEvent = false, currentEventData = null, eventCooldown = 0;

let bots = [
    { name: "Болат-ага", money: 1500, points: 1, cups: 120 },
    { name: "Сауле", money: 3000, points: 2, cups: 250 },
    { name: "Ерлан", money: 8000, points: 3, cups: 600 }
];
let notificationLogs = ["Добро пожаловать в игру!"];

const tg = window.Telegram.WebApp;
const SAVE_KEY = 'coffeeEmpireSave_v13';

const NAMES = ["Асхат", "Ерлан", "Айгерим", "Бауыржан", "Ника", "Сауле", "Болат", "Дана"];
const TRAITS = ["Трудяга", "Веселый", "Ворчун", "Соня", "Профи"];

function getIncome() {
    let totalBasePrice = 0;
    pointsList.forEach(p => {
        let pPrice = p.price;
        if (p.upgrades && p.upgrades.umbrella) pPrice += 10;
        if (p.upgrades && p.upgrades.sign) pPrice += 20;
        if (p.upgrades && p.upgrades.board) pPrice += 15;
        if (p.upgrades && p.upgrades.music) pPrice += 25;
        totalBasePrice += pPrice;
    });
    let baristaBonus = 1 + (baristasList.length * 0.1);
    let managerBonus = hasManager ? 1.15 : 1;
    let baseIncome = totalBasePrice * machineLevel * baristaBonus * managerBonus;
    if (fullDays === 0) return Math.floor(baseIncome * 0.6);
    return Math.floor(baseIncome);
}

function updateUI() {
    document.getElementById('money-val').innerText = Math.floor(money).toLocaleString('ru-RU');
    document.getElementById('day-val').innerText = day;
    document.getElementById('next-day').innerText = day + 1;
    
    document.getElementById('full-days-val').innerText = fullDays;
    let mins = Math.floor(dayTimerSeconds / 60);
    let secs = dayTimerSeconds % 60;
    document.getElementById('full-days-timer').innerText = `+1 через: ${mins}:${secs < 10 ? '0' : ''}${secs}`;

    let btn = document.getElementById('btn-open-day');
    let statusMsg = document.getElementById('status-msg');
    if (fullDays > 0) {
        btn.classList.remove('tired');
        btn.innerHTML = `Открыть день <span id="next-day">${day + 1}</span> (📅1)`;
        statusMsg.innerText = "Полный день. Прибыль 100%";
    } else {
        btn.classList.add('tired');
        btn.innerHTML = `Усталый день <span id="next-day">${day + 1}</span>`;
        statusMsg.innerText = "Нет полных дней! Прибыль 60%";
    }

    document.getElementById('points-val').innerText = pointsList.length;
    document.getElementById('income-val').innerText = getIncome();
    
    document.getElementById('machine-lvl').innerText = machineLevel;
    document.getElementById('machine-cost').innerText = machineCost;
    
    document.getElementById('manager-status').innerText = hasManager ? "Работает ✅" : "Нет управляющего";
    document.getElementById('manager-status').style.color = hasManager ? "#4CAF50" : "#bbb";
    document.getElementById('btn-hire-manager').disabled = hasManager;
    if (hasManager) document.getElementById('btn-hire-manager').style.opacity = "0.5";

    document.getElementById('barista-val').innerText = baristasList.length;
    document.getElementById('barista-cost').innerText = baristaCost;
    
    let baristaContainer = document.getElementById('baristas-list');
    baristaContainer.innerHTML = '';
    if (baristasList.length === 0) {
        baristaContainer.innerHTML = '<p>Пока никого нет.</p>';
    } else {
        baristasList.forEach((b, index) => {
            let moodIcon = b.mood > 70 ? "😊" : (b.mood > 30 ? "😐" : "😠");
            let div = document.createElement('div');
            div.className = 'barista-item';
            div.style.borderBottom = "1px solid #555"; div.style.paddingBottom = "10px"; div.style.marginBottom = "10px";
            div.innerHTML = `
                <h3>${b.name} <span style="font-size:12px; color:#aaa;">(${b.trait})</span></h3>
                <p>Настроение: ${moodIcon} ${b.mood}%</p>
                <button class="btn-secondary" onclick="praiseBarista(${index})">Похвалить</button>
            `;
            baristaContainer.appendChild(div);
        });
    }

    document.getElementById('tax-val').innerText = Math.floor(taxAccumulated).toLocaleString('ru-RU');
    document.getElementById('deposit-val').innerText = Math.floor(depositBalance).toLocaleString('ru-RU');
    document.getElementById('debt-val').innerText = Math.floor(debt).toLocaleString('ru-RU');

    renderCityMap();
    renderLeaderboard();

    if (hasActiveEvent) document.getElementById('event-btn').style.display = 'flex';
    else document.getElementById('event-btn').style.display = 'none';
}

function renderCityMap() {
    let container = document.getElementById('city-grid');
    container.innerHTML = '';

    pointsList.forEach((point, index) => {
        let type = "🏪";
        if (point.upgrades && point.upgrades.board) type = "🏬";
        if (point.upgrades && point.upgrades.sign && point.upgrades.umbrella) type = "🏢";

        let neighborPower = 50 + (index * 30) + (machineLevel * 10); 

        let card = document.createElement('div');
        card.className = 'point-card';
        card.innerHTML = `
            <div class="point-header">
                <div><span class="point-icon">${type}</span> <strong>Точка №${index + 1}</strong></div>
                <div style="color:var(--accent); font-weight:bold;">${point.price} ₸</div>
            </div>
            <p>Бариста: ${point.baristasAssigned || 0} / ${point.secondCounter ? 6 : 2} | Кубки: 🏆 ${point.wins || 0}</p>
            <div class="upgrades-list">
                <button class="upgrade-btn ${point.upgrades && point.upgrades.umbrella ? 'active' : ''}" onclick="buyUpgrade(${index}, 'umbrella', 500)">☂️ Зонт (500)</button>
                <button class="upgrade-btn ${point.upgrades && point.upgrades.sign ? 'active' : ''}" onclick="buyUpgrade(${index}, 'sign', 1000)">🪧 Вывеска (1000)</button>
                <button class="upgrade-btn ${point.upgrades && point.upgrades.board ? 'active' : ''}" onclick="buyUpgrade(${index}, 'board', 1500)">🖼️ Доска (1500)</button>
                <button class="upgrade-btn ${point.upgrades && point.upgrades.music ? 'active' : ''}" onclick="buyUpgrade(${index}, 'music', 2000)">🎵 Музыка (2000)</button>
            </div>
            ${!point.secondCounter ? `<button class="btn-secondary" style="margin-top:10px;" onclick="buySecondCounter(${index}, 5000)">Поставить 2-ю стойку (5000 ₸)</button>` : '<p style="color:#4CAF50; margin-top:10px; font-size:12px;">✅ Вторая стойка установлена</p>'}
            
            <div class="neighbor-block">
                <div class="neighbor-title">🔴 Сосед: Кофейня "У Болата"</div>
                <div class="neighbor-power">Сила района: ${neighborPower}</div>
                <button class="btn-danger" onclick="fightDistrict(${index}, ${neighborPower})">⚔️ Бой за район</button>
            </div>
        `;
        container.appendChild(card);
    });

    let emptyCard = document.createElement('div');
    emptyCard.className = 'point-card empty';
    emptyCard.innerHTML = `
        <p>Свободное место</p>
        <p style="font-size:12px; margin-bottom:10px;">Стоимость: ${pointCost} ₸</p>
        <button class="btn-buy" onclick="buyPoint()">Открыть точку</button>
    `;
    container.appendChild(emptyCard);
}
function renderLeaderboard() {
    let container = document.getElementById('leaderboard-list');
    container.innerHTML = '';
    let allPlayers = [...bots];
    allPlayers.push({ name: "Ты", money: money, points: pointsList.length, isPlayer: true });
    allPlayers.sort((a, b) => b.money - a.money);

    allPlayers.forEach((p, i) => {
        let div = document.createElement('div');
        div.style.display = 'flex'; div.style.justifyContent = 'space-between'; div.style.padding = '5px 0'; div.style.borderBottom = '1px solid #444';
        if (p.isPlayer) div.style.color = 'var(--accent)';
        div.innerHTML = `<span>${i + 1}. ${p.name}</span> <span>${Math.floor(p.money).toLocaleString('ru-RU')} ₸</span>`;
        container.appendChild(div);
    });
}

function fightDistrict(pointIndex, neighborPower) {
    let playerPower = pointsList[pointIndex].price + (machineLevel * 20) + (baristasList.length * 15);
    
    if (playerPower > neighborPower) {
        let cupsWon = Math.floor(neighborPower / 10) + 1;
        pointsList[pointIndex].wins = (pointsList[pointIndex].wins || 0) + cupsWon;
        pointsList[pointIndex].price += 30;
        addLog(`🏆 Победа! Получено ${cupsWon} кубков.`);
        alert(`Победа! Сила: ${playerPower} vs ${neighborPower}. Получено ${cupsWon} кубков!`);
    } else {
        addLog(`💀 Поражение в бою.`);
        alert(`Поражение! Сила: ${playerPower} vs ${neighborPower}. Прокачай точку!`);
    }
    updateUI(); saveGame();
}

function addLog(text) {
    notificationLogs.unshift(text);
    if (notificationLogs.length > 10) notificationLogs.pop();
    let container = document.getElementById('notification-log');
    container.innerHTML = notificationLogs.map(log => `<p>• ${log}</p>`).join('');
}
function buyUpgrade(pointIndex, upgradeName, cost) {
    let point = pointsList[pointIndex];
    if (point.upgrades && point.upgrades[upgradeName]) return alert("Уже куплено!");
    if (money >= cost) { money -= cost; point.upgrades[upgradeName] = true; updateUI(); saveGame(); } 
    else alert("Недостаточно денег!");
}

function buySecondCounter(pointIndex, cost) {
    if (money >= cost) { money -= cost; pointsList[pointIndex].secondCounter = true; updateUI(); saveGame(); } 
    else alert("Недостаточно денег!");
}

setInterval(() => {
    if (fullDays < MAX_FULL_DAYS) {
        dayTimerSeconds--;
        if (dayTimerSeconds <= 0) { fullDays++; dayTimerSeconds = 300; saveGame(); }
        updateUI();
    } else { dayTimerSeconds = 300; }
}, 1000);

setInterval(() => {
    if (depositBalance > 0) {
        let dailyInterest = depositBalance * (0.14 / 365);
        depositBalance += dailyInterest;
        updateUI();
    }
}, 60000);

function openDay() {
    let income = getIncome();
    money += income;
    let tax = Math.floor(income * 0.04);
    taxAccumulated += tax;

    if (baristasList.length > 0) {
        let salaries = baristasList.length * 200;
        money -= salaries;
        if (money < 0) baristasList.forEach(b => b.mood = Math.max(0, b.mood - 10));
    }
    day++;
    if (fullDays > 0) fullDays--;

    if (!hasActiveEvent && eventCooldown <= 0) { if (Math.random() < 0.3) spawnRandomEvent(); } 
    else if (eventCooldown > 0) eventCooldown--;

    bots.forEach(b => b.money += Math.floor(Math.random() * 200) + 50);

    updateUI(); saveGame();
    if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function hireManager() {
    if (!hasManager && money >= managerCost) {
        money -= managerCost; hasManager = true;
        pointsList.forEach(p => p.price = Math.floor(p.price * 1.2));
        addLog("Нанят управляющий. Цены +20%.");
        updateUI(); saveGame(); alert("Управляющий нанят!");
    } else alert(hasManager ? "Уже есть." : "Недостаточно денег!");
}

function hireBarista() {
    if (money >= baristaCost) {
        let totalCapacity = 0;
        pointsList.forEach(p => totalCapacity += (p.secondCounter ? 6 : 2));
        if (baristasList.length >= totalCapacity) return alert("Нет мест! Купите 2-ю стойку.");

        money -= baristaCost;
        let randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
        let randomTrait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
        baristasList.push({ id: Date.now(), name: randomName, trait: randomTrait, mood: 100 });
        baristaCost = Math.floor(baristaCost * 1.5);
        addLog(`Нанят бариста: ${randomName}`);
        updateUI(); saveGame();
    } else alert("Недостаточно денег!");
}

function praiseBarista(index) {
    let b = baristasList[index];
    if (b.mood < 100) { b.mood = Math.min(100, b.mood + 20); updateUI(); saveGame(); } 
    else alert(b.name + " и так счастлив!");
}

function payTaxes() {
    if (taxAccumulated > 0) {
        if (money >= taxAccumulated) { money -= taxAccumulated; taxAccumulated = 0; addLog("Налоги уплачены."); updateUI(); saveGame(); alert("Налоги уплачены!"); } 
        else alert("Недостаточно денег!");
    } else alert("Нет накопленных налогов.");
}

function depositMoney(amount) {
    if (money >= amount) { money -= amount; depositBalance += amount; updateUI(); saveGame(); } 
    else alert("Недостаточно денег!");
}

function withdrawDeposit() {
    if (depositBalance > 0) { money += depositBalance; depositBalance = 0; updateUI(); saveGame(); }
}

function takeLoan(amount) {
    money += amount; debt += amount * 1.2; updateUI(); saveGame();
}

function repayLoan() {
    if (debt > 0) {
        if (money >= debt) { money -= debt; debt = 0; updateUI(); saveGame(); alert("Кредит погашен!"); } 
        else alert("Недостаточно денег!");
    } else alert("У вас нет долгов.");
}

const EVENTS = [
    { title: "Бариста просит прибавку", desc: "Твой бариста просит больше денег.", opt1: "Дать прибавку (-1000 ₸)", opt2: "Отказать", action1: () => { if(money >= 1000) { money -= 1000; return "Бариста доволен!"; } else return "Не хватило денег!"; }, action2: () => { if (Math.random() < 0.5 && baristasList.length > 0) { baristasList.pop(); return "Бариста уволился!"; } return "Бариста остался."; } },
    { title: "Блогер хочет обзор", desc: "Блогер Ника хочет обзор.", opt1: "Заплатить (-2000 ₸)", opt2: "Отказаться", action1: () => { if(money >= 2000) { money -= 2000; pointsList[0].price += 20; return "Приток гостей!"; } else return "Не хватило денег!"; }, action2: () => "Вы отказались." }
];

function spawnRandomEvent() {
    hasActiveEvent = true;
    currentEventData = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    document.getElementById('event-title').innerText = currentEventData.title;
    document.getElementById('event-desc').innerText = currentEventData.desc;
    document.getElementById('event-opt1').innerText = currentEventData.opt1;
    document.getElementById('event-opt2').innerText = currentEventData.opt2;
    updateUI();
}

function triggerEvent() { if (hasActiveEvent) document.getElementById('event-modal').style.display = 'flex'; }
function resolveEvent(choice) {
    let msg = (choice === 1) ? currentEventData.action1() : currentEventData.action2();
    hasActiveEvent = false; eventCooldown = 3;
    document.getElementById('event-modal').style.display = 'none';
    updateUI(); saveGame(); alert(msg);
}

function buyPoint() {
    if (money >= pointCost) {
        money -= pointCost;
        pointsList.push({ id: Date.now(), price: 100, upgrades: { umbrella: false, sign: false, board: false, music: false }, secondCounter: false, baristasAssigned: 0, wins: 0 });
        pointCost = Math.floor(pointCost * 2.5);
        addLog("Открыта новая точка!");
        updateUI(); saveGame();
    } else alert("Недостаточно денег!");
}

function changeAllPrices() { pointsList.forEach(point => { point.price += 50; }); updateUI(); saveGame(); }

function upgradeMachine() {
    if (money >= machineCost) { money -= machineCost; machineLevel += 1; machineCost = Math.floor(machineCost * 1.8); updateUI(); saveGame(); } 
    else alert("Недостаточно денег!");
}

function switchTab(tabName, element) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

function saveGame() {
    const gameData = { money, day, fullDays, dayTimerSeconds, pointsList, pointCost, machineLevel, machineCost, baristaCost, baristasList, hasManager, managerCost, taxAccumulated, depositBalance, debt, hasActiveEvent, currentEventData, eventCooldown, bots, notificationLogs };
    const dataString = JSON.stringify(gameData);
    localStorage.setItem(SAVE_KEY, dataString);
    if (tg.CloudStorage) tg.CloudStorage.setItem(SAVE_KEY, dataString, (err) => {});
}

function loadGame() {
    let localData = localStorage.getItem(SAVE_KEY);
    if (localData) { try { applyData(JSON.parse(localData)); } catch(e) {} }
    if (tg.CloudStorage) {
        tg.CloudStorage.getItem(SAVE_KEY, (err, cloudData) => {
            if (!err && cloudData) { try { applyData(JSON.parse(cloudData)); } catch(e) {} }
            finishLoading();
        });
    } else finishLoading();
}

function applyData(data) {
    money = data.money ?? money; day = data.day ?? day;
    fullDays = data.fullDays ?? fullDays; dayTimerSeconds = data.dayTimerSeconds ?? 300;
    pointsList = data.pointsList ?? pointsList; pointCost = data.pointCost ?? pointCost;
    machineLevel = data.machineLevel ?? machineLevel; machineCost = data.machineCost ?? machineCost;
    baristaCost = data.baristaCost ?? baristaCost; baristasList = data.baristasList ?? [];
    hasManager = data.hasManager ?? false; managerCost = data.managerCost ?? 5000;
    taxAccumulated = data.taxAccumulated ?? 0; depositBalance = data.depositBalance ?? 0; debt = data.debt ?? 0;
    hasActiveEvent = data.hasActiveEvent ?? false; currentEventData = data.currentEventData ?? null; eventCooldown = data.eventCooldown ?? 0;
    bots = data.bots ?? bots; notificationLogs = data.notificationLogs ?? notificationLogs;
    updateUI();
}

function finishLoading() { document.getElementById('loading-screen').style.display = 'none'; }

tg.ready(); tg.expand(); updateUI(); loadGame();
