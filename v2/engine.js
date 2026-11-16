/*
 * 游戏规则，不碰页面。事件内容在 data-career.js 和 data-money.js。
 * 钱的单位：存款是「万」，工资 / 支出 / 睡后收入是「千 / 月」。
 */
const Game = (() => {
    const RANKS = ['实习生', '专员', '主管', '经理', '总监', '副总裁', '老板'];
    const SALARY = [5, 7, 11, 16, 26, 42, 85];
    // 升职以后开销也跟着升：这是「当上总监照样月光」的来源
    const CREEP = [0, 1, 1.5, 2.5, 4, 7, 12];
    const PROMOTE = [
        { perf: 18, net: 0 },
        { perf: 30, net: 14 },
        { perf: 42, net: 24 },
        { perf: 54, net: 34 },
        { perf: 70, net: 48 },
        { perf: 86, net: 60 },
    ];
    const MIN_YEARS_AT_RANK = 2;
    const START_AGE = 22;
    const GRACE_YEARS = 3;
    const LAST_AGE = 45;
    const BOSS_YEARS = 3;
    const SECRETARY_RANK = 4;
    const START_EXPENSE = 4.5;
    const MIN_EXPENSE = 2;
    const GUTS_MONTHS = 6;
    const DEBT_LIMIT = -30;
    const FOLLOWUP_GAP = 4;
    const FREEDOM_REASK_YEARS = 3;
    const INTACT_BAR = 60;
    const STAT_NAMES = {
        perf: '业绩', net: '人脉', hp: '健康', heart: '良心',
        money: '存款', expense: '月支出', passive: '睡后收入',
    };

    const ORIGINS = [
        {
            id: 'elite', name: '名校应届生', desc: '业绩起点高，谁也不认识',
            stats: { perf: 16, net: 6, hp: 80, heart: 70 }, money: 0,
        },
        {
            id: 'plain', name: '普通毕业生', desc: '什么都普通，但是能熬',
            stats: { perf: 9, net: 12, hp: 92, heart: 78 }, money: 0,
        },
        {
            id: 'nepo', name: '老板的远房亲戚', desc: '人脉和零花钱开局就有，活不太会干',
            stats: { perf: 4, net: 30, hp: 82, heart: 60 }, money: 5,
        },
    ];

    const GOALS = [
        { id: 'top', name: '爬到顶楼', desc: '当上老板' },
        { id: 'free', name: '提前下楼', desc: '睡后收入盖过支出，不用再上班' },
        { id: 'intact', name: '全身而退', desc: '干到最后，健康和良心都还在' },
    ];

    const ENDINGS = {
        icu: { title: '福报战神', line: '你把一切都给了公司，包括住院押金。', seal: '因病离岗' },
        exposed: { title: '东窗事发', line: '你走过的每一条捷径，都有人留了截图。', seal: '予以辞退' },
        scapegoat: { title: '专业背锅', line: '事故报告上只有你一个人的名字。', seal: '予以辞退' },
        laid35: { title: '光荣毕业', line: '公司说这不叫裁员，叫向社会输送人才。', seal: '准予毕业' },
        laid_mortgage: { title: '带贷毕业', line: '公司说这叫毕业。银行说月供照旧。', seal: '准予毕业' },
        default: { title: '断供', line: '银行的短信，比老板的消息来得还勤。', seal: '资不抵债' },
        dali: { title: '逃离工位', line: '民宿第二年就亏完了，但你再没失眠过。', seal: '准予离职' },
        free: { title: '提前下楼', line: '周一早上，你关掉了闹钟。', seal: '准予下楼' },
        boss_good: { title: '良心老板', line: '小周说，你是 ta 见过最不像老板的老板。', seal: '准予登顶' },
        boss_mid: { title: '人生巅峰', line: '你站在顶楼往下看，认不出哪个工位曾经是你的。', seal: '准予登顶' },
        boss_bad: { title: '活成了他', line: '你终于成了老板，也终于成了当年那个老板。', seal: '准予登顶' },
        retire_exec: { title: '高管离场', line: '差一步到顶楼。电梯到这层就不往上了。', seal: '考核通过' },
        intact: { title: '全身而退', line: '你没到顶楼，也没倒在路上。下班的时候天还亮着。', seal: '考核通过' },
        retire_mid: { title: '中层钉子', line: '上面的下不来，下面的上不去，你在中间坐了二十年。', seal: '考核通过' },
        retire_low: { title: '万年专员', line: '你送走了五任老板，工位从没换过。', seal: '考核通过' },
        fish: { title: '摸鱼宗师', line: '工资没涨，头发没掉。很难说谁赢了。', seal: '考核通过' },
    };
    const BAD_ENDINGS = new Set(['icu', 'exposed', 'scapegoat', 'laid35', 'laid_mortgage', 'default', 'dali']);

    const clamp = (v) => Math.max(0, Math.min(100, v));
    const round1 = (v) => Math.round(v * 10) / 10;
    const tierOf = (rank) => (rank <= 1 ? 'junior' : rank <= 3 ? 'mid' : rank <= 5 ? 'senior' : 'boss');
    const pick = (list, rng) => list[Math.floor(rng() * list.length)];

    const cash = (state) => {
        const salary = SALARY[state.rank];
        return {
            salary,
            expense: state.expense,
            passive: state.passive,
            net: round1(salary + state.passive - state.expense),
        };
    };
    const isFree = (state) => state.passive > 0 && state.passive >= state.expense;
    const hasGuts = (state) => isFree(state) || state.money >= (state.expense * GUTS_MONTHS) / 10;

    // 选项点不了的原因；能点就返回空字符串
    const lockReason = (state, choice) => {
        const need = choice.need || {};
        if (need.money && state.money < need.money) {
            return `存款不到 ${need.money} 万`;
        }
        if (need.rank && state.rank < need.rank) {
            return `职级不到${RANKS[need.rank]}`;
        }
        if (choice.guts && !hasGuts(state)) {
            return state.flags.house ? '背着房贷，存款撑不过半年' : '没底气：存款撑不过半年';
        }
        return '';
    };

    const meets = (state, when = {}) => (
        (!when.minAge || state.age >= when.minAge)
        && (!when.minRank || state.rank >= when.minRank)
        && (!when.has || state.flags[when.has])
        && (!when.lacks || !state.flags[when.lacks])
    );

    const newGame = (originId, goalId, name, rng = Math.random) => {
        const origin = ORIGINS.find((o) => o.id === originId) || ORIGINS[1];
        const state = {
            rng,
            name: name || '打工人',
            origin,
            goal: GOALS.find((g) => g.id === goalId) || GOALS[0],
            age: START_AGE,
            rank: 0,
            topRank: 0,
            yearsAtRank: 0,
            bossYears: 0,
            stats: { ...origin.stats },
            money: origin.money,
            expense: START_EXPENSE,
            passive: 0,
            flags: {},
            used: new Set(),
            memory: {},
            log: [],
            notices: [],
            queue: [],
            event: null,
            outcome: null,
            ending: null,
        };
        planYear(state);
        return state;
    };

    const nextCareerEvent = (state) => {
        const { rng, used } = state;
        const fresh = (tier) => CAREER_EVENTS.filter((e) => e.tier === tier && !used.has(e.id));
        const take = (ev) => {
            used.add(ev.id);
            return ev;
        };
        if (state.age === 35 && state.rank < 6 && !state.memory.crisis35) {
            state.memory.crisis35 = true;
            const id = state.rank <= 2 ? 'x_35_low' : 'x_35_high';
            return take(CAREER_EVENTS.find((e) => e.id === id));
        }
        // 当年帮过或坑过的人，过几年以别的身份回来
        if (state.rank >= 2 && state.rank < 6) {
            const due = FOLLOWUPS.filter((e) => {
                const past = state.memory[e.needs];
                return past && !used.has(e.id) && state.age - past.age >= FOLLOWUP_GAP;
            });
            if (due.length && rng() < 0.5) {
                return take(pick(due, rng));
            }
        }
        const tier = tierOf(state.rank);
        let pool = fresh(tier);
        const anyPool = fresh('any');
        if (tier !== 'boss' && anyPool.length && (rng() < 0.2 || !pool.length)) {
            return take(pick(anyPool, rng));
        }
        if (!pool.length) {
            CAREER_EVENTS.filter((e) => e.tier === tier).forEach((e) => used.delete(e.id));
            pool = fresh(tier);
        }
        const paired = pool.filter((e) => e.mirror || (e.recall && state.memory[e.recall]));
        if (paired.length && rng() < 0.6) {
            return take(pick(paired, rng));
        }
        return take(pick(pool, rng));
    };

    // 排好这一年要发生的事：一个职场事件，隔年再加一个钱的决定，到岁数了加人生大事
    const planYear = (state) => {
        const queue = [];
        const asked = state.memory.freeAsked;
        if (isFree(state) && (!asked || state.age - asked.age >= FREEDOM_REASK_YEARS)) {
            state.memory.freeAsked = { age: state.age };
            queue.push(FREEDOM_EVENT);
        } else {
            queue.push(nextCareerEvent(state));
        }
        const life = LIFE_EVENTS.find((e) => e.age === state.age && meets(state, e.when));
        if (life) {
            queue.push(life);
        } else if (state.rank < 6 && (state.age - START_AGE) % 2 === 1) {
            const pool = MONEY_CARDS.filter((e) => !state.used.has(e.id) && meets(state, e.when));
            if (pool.length) {
                const card = pick(pool, state.rng);
                state.used.add(card.id);
                queue.push(card);
            }
        }
        state.event = queue.shift();
        state.queue = queue;
    };

    const recallLine = (state) => {
        const ev = state.event;
        const past = ev && ev.recall && state.memory[ev.recall];
        return past ? `你想起 ${past.age} 岁那年，你选的是「${past.label}」。` : '';
    };

    const choose = (state, index) => {
        const ev = state.event;
        const choice = ev.choices[index];
        if (lockReason(state, choice)) {
            return null;
        }
        let result = { text: choice.text, fx: choice.fx, ending: choice.ending };
        if (choice.check && state.stats[choice.check.stat] < choice.check.min) {
            result = choice.check.fail;
        } else if (choice.risk && state.rng() < choice.risk.chance) {
            // 入职头三年不让坏运气直接出局：第一下点击就结束的新玩家不会再开第二局
            const tooEarly = choice.risk.ending && state.age < START_AGE + GRACE_YEARS;
            result = tooEarly ? result : choice.risk;
        }
        const deltas = [];
        Object.entries(result.fx || {}).forEach(([key, change]) => {
            if (!change) {
                return;
            }
            if (key === 'money') {
                state.money = round1(state.money + change);
            } else if (key === 'expense') {
                state.expense = Math.max(MIN_EXPENSE, round1(state.expense + change));
            } else if (key === 'passive') {
                state.passive = Math.max(0, round1(state.passive + change));
            } else {
                state.stats[key] = clamp(state.stats[key] + change);
            }
            // 支出涨是坏事，其他数值跌是坏事
            const bad = key === 'expense' ? change > 0 : change < 0;
            deltas.push({ key, name: STAT_NAMES[key], change, bad });
        });
        if (choice.flag) {
            state.flags[choice.flag] = true;
        }
        if (choice.remember) {
            state.memory[choice.remember] = { age: state.age };
        }
        if (ev.mirror) {
            state.memory[ev.mirror] = { age: state.age, label: choice.label };
        }
        state.outcome = { label: choice.label, text: result.text, deltas, ending: result.ending };
        return state.outcome;
    };

    const goalMet = (state, endingId) => {
        if (state.goal.id === 'top') {
            return state.topRank === 6;
        }
        if (state.goal.id === 'free') {
            return endingId === 'free';
        }
        const s = state.stats;
        return !BAD_ENDINGS.has(endingId) && s.hp >= INTACT_BAR && s.heart >= INTACT_BAR;
    };

    const goalLine = (state, met) => {
        if (met) {
            return `入职时填的志向是「${state.goal.name}」。做到了。`;
        }
        if (state.goal.id === 'top') {
            return `入职时说要爬到顶楼。最后停在了${RANKS[state.topRank]}这一层。`;
        }
        if (state.goal.id === 'free') {
            return `入职时说要提前下楼。离岗时每月睡后收入 ${state.passive} 千，支出 ${state.expense} 千。`;
        }
        return `入职时说要全身而退。离岗时健康 ${state.stats.hp}，良心 ${state.stats.heart}。`;
    };

    const finish = (state, rawId) => {
        const id = rawId === 'laid35' && state.flags.house ? 'laid_mortgage' : rawId;
        const s = state.stats;
        const met = goalMet(state, id);
        const wealth = Math.max(0, Math.min(300, state.money)) / 30;
        const score = Math.round(state.topRank * 9 + s.hp * 0.1 + s.heart * 0.1 + wealth + (met ? 15 : 0));
        state.ending = {
            id,
            ...ENDINGS[id],
            goalMet: met,
            goalLine: goalLine(state, met),
            score: Math.min(100, score),
        };
        state.event = null;
        state.queue = [];
        return state.ending;
    };

    // 健康或良心归零时的结局；买过重疾险能救一次
    const collapse = (state) => {
        const s = state.stats;
        if (s.hp <= 0) {
            if (state.flags.insured && !state.flags.claimed) {
                state.flags.claimed = true;
                s.hp = 25;
                state.money = round1(state.money - 3);
                state.notices.push('<b>住院通知</b>　你住了一个月院。重疾险赔了大部分，你捡回一条命。');
                return null;
            }
            return 'icu';
        }
        return s.heart <= 0 ? 'exposed' : null;
    };

    // 往下走一步：同一年里还有事就接着处理，没有就过完这一年
    const advance = (state) => {
        const s = state.stats;
        const pending = state.outcome && state.outcome.ending;
        state.outcome = null;
        state.notices = [];
        if (pending) {
            return finish(state, pending);
        }
        let fatal = collapse(state);
        if (fatal) {
            return finish(state, fatal);
        }
        if (state.queue.length) {
            state.event = state.queue.shift();
            return null;
        }
        if (state.rank === 6) {
            state.bossYears += 1;
            if (state.bossYears >= BOSS_YEARS) {
                return finish(state, s.heart >= 60 ? 'boss_good' : s.heart < 30 ? 'boss_bad' : 'boss_mid');
            }
        }
        state.money = round1(state.money + (cash(state).net * 12) / 10);
        if (state.money < 0) {
            if (state.money < DEBT_LIMIT) {
                return finish(state, 'default');
            }
            s.hp = clamp(s.hp - 4);
            state.notices.push(`<b>催款短信</b>　你欠着 ${Math.abs(Math.round(state.money))} 万。夜里睡不踏实。`);
        }
        state.age += 1;
        state.yearsAtRank += 1;
        // 熬年头也算资历
        s.perf = clamp(s.perf + 1);
        s.net = clamp(s.net + 1);
        if (state.age >= 30) {
            s.hp = clamp(s.hp - (state.age >= 38 ? 3 : 2));
        }
        fatal = collapse(state);
        if (fatal) {
            return finish(state, fatal);
        }
        const bar = PROMOTE[state.rank];
        if (bar && state.yearsAtRank >= MIN_YEARS_AT_RANK && s.perf >= bar.perf && s.net >= bar.net) {
            state.rank += 1;
            state.topRank = state.rank;
            state.yearsAtRank = 0;
            state.expense = round1(state.expense + CREEP[state.rank]);
            state.log.push(`${state.age} 岁，升任${RANKS[state.rank]}`);
            state.notices.push(
                `<b>晋升通知</b>　你升任${RANKS[state.rank]}，月薪 ${SALARY[state.rank]} 千。`
                + `开销也跟着升了，每月多花 ${CREEP[state.rank]} 千。`,
            );
            if (state.rank === SECRETARY_RANK) {
                state.notices.push('<b>人事通知</b>　公司给你配了一位秘书：小周。');
            }
            if (state.rank === 6) {
                state.notices.push('顶楼的办公室是你的了。接下来三年，轮到你做决定。');
            }
        }
        if (state.age > LAST_AGE && state.rank < 6) {
            if (state.rank >= 4) {
                return finish(state, 'retire_exec');
            }
            if (s.hp >= INTACT_BAR && s.heart >= INTACT_BAR) {
                return finish(state, 'intact');
            }
            if (state.rank >= 2) {
                return finish(state, 'retire_mid');
            }
            return finish(state, s.hp >= INTACT_BAR ? 'fish' : 'retire_low');
        }
        planYear(state);
        return null;
    };

    return {
        RANKS, ORIGINS, GOALS, ENDINGS, STAT_NAMES, PROMOTE,
        newGame, choose, advance, recallLine, lockReason, cash, hasGuts, isFree,
    };
})();
