/* 页面：只负责把 Game 的状态画出来、把点击交给 Game。 */
(() => {
    const $ = (id) => document.getElementById(id);
    const esc = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
    const STORE_KEY = 'gongwei-to-dinglou.v2';
    const EMPTY_SAVE = { name: '', runs: 0, seen: [] };

    const loadSave = () => {
        try {
            return { ...EMPTY_SAVE, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
        } catch (err) {
            return { ...EMPTY_SAVE };
        }
    };
    const writeSave = (save) => {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(save));
        } catch (err) {
            // 无痕模式存不了，游戏照常玩，只是不记结局档案
        }
    };

    const save = loadSave();
    const picked = { origin: 'plain', goal: 'top' };
    let state = null;

    const show = (screen) => {
        ['start', 'play', 'end'].forEach((name) => {
            $(`screen-${name}`).hidden = name !== screen;
        });
        window.scrollTo(0, 0);
    };

    const renderOptions = (boxId, list, key) => {
        const box = $(boxId);
        box.querySelectorAll('.origin').forEach((el) => el.remove());
        list.forEach((item) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'origin';
            btn.setAttribute('aria-pressed', String(item.id === picked[key]));
            btn.innerHTML = `<b>${item.name}</b><span>${item.desc}</span>`;
            btn.addEventListener('click', () => {
                picked[key] = item.id;
                renderOptions(boxId, list, key);
            });
            box.appendChild(btn);
        });
    };

    const renderStart = () => {
        $('name').value = save.name;
        renderOptions('origins', Game.ORIGINS, 'origin');
        renderOptions('goals', Game.GOALS, 'goal');
        const ids = Object.keys(Game.ENDINGS);
        $('archive-head').textContent = `结局档案 ${save.seen.length} / ${ids.length}`;
        $('archive-list').innerHTML = ids
            .map((id) => (save.seen.includes(id)
                ? `<li class="seen">${Game.ENDINGS[id].title}</li>`
                : '<li>未解锁</li>'))
            .join('');
        show('start');
    };

    const renderHud = () => {
        $('hud-rank').innerHTML = `${esc(state.name)}　<span>${Game.RANKS[state.rank]}</span>`;
        $('hud-age').textContent = `${state.age} 岁　志向：${state.goal.name}`;
        $('hud-meters').innerHTML = ['perf', 'net', 'hp', 'heart']
            .map((key) => {
                const value = state.stats[key];
                const low = (key === 'hp' || key === 'heart') && value <= 25;
                return `<div class="meter${low ? ' low' : ''}">
                    <div class="meter-head"><span>${Game.STAT_NAMES[key]}</span><b>${value}</b></div>
                    <div class="bar"><i style="width:${value}%"></i></div>
                </div>`;
            })
            .join('');
        const c = Game.cash(state);
        const cover = c.expense ? Math.min(100, Math.round((100 * c.passive) / c.expense)) : 0;
        const cell = (label, value) => `<div class="cash-cell">
            <span class="k">${label}</span><span class="v">${fmt(value)}<small> 千</small></span>
        </div>`;
        const debt = state.money < 0;
        $('hud-cash').innerHTML = `
            <div class="cash-row">
                ${cell('月工资', c.salary)}${cell('月支出', c.expense)}${cell('睡后收入', c.passive)}
            </div>
            <div class="cash-foot">
                <span class="${debt ? 'in-debt' : ''}">${debt ? '欠债' : '存款'} ${Math.abs(Math.round(state.money))} 万，
                    每月${c.net >= 0 ? '结余' : '倒贴'} ${fmt(Math.abs(c.net))} 千</span>
                <span class="guts ${Game.hasGuts(state) ? 'on' : 'off'}">${Game.hasGuts(state) ? '有底气' : '没底气'}</span>
            </div>
            <div class="exit">
                <div class="meter-head"><span>睡后收入盖住支出（到 100% 就能不上班）</span><b>${cover}%</b></div>
                <div class="bar"><i style="width:${cover}%"></i></div>
            </div>`;
    };

    const renderNotices = () => {
        $('notices').innerHTML = state.notices.map((n) => `<p class="notice">${n}</p>`).join('');
    };

    const renderEvent = () => {
        renderHud();
        renderNotices();
        const ev = state.event;
        const recall = Game.recallLine(state);
        const choices = ev.choices
            .map((c, i) => {
                const why = Game.lockReason(state, c);
                return `<button class="choice" data-index="${i}" ${why ? 'disabled' : ''}>
                    <em>${'ABC'[i]}</em>
                    <span>${c.label}${why ? `<small class="why">${why}</small>` : ''}</span>
                </button>`;
            })
            .join('');
        $('memo').innerHTML = `
            <div class="memo-from">来自：${ev.from}</div>
            <div class="memo-body">
                <p>${ev.text}</p>
                ${recall ? `<p class="recall">${recall}</p>` : ''}
            </div>
            <div class="choices">${choices}</div>`;
        $('memo').querySelectorAll('.choice:not([disabled])').forEach((btn) => {
            btn.addEventListener('click', () => renderOutcome(Number(btn.dataset.index)));
        });
        show('play');
    };

    const deltaChip = (d) => {
        const sign = d.change > 0 ? '+' : '−';
        const unit = d.key === 'money' ? ' 万' : (d.key === 'expense' || d.key === 'passive') ? ' 千/月' : '';
        return `<span class="delta${d.bad ? ' down' : ''}">${d.name} ${sign}${fmt(Math.abs(d.change))}${unit}</span>`;
    };

    const renderOutcome = (index) => {
        const from = state.event.from;
        const outcome = Game.choose(state, index);
        if (!outcome) {
            return;
        }
        renderHud();
        $('notices').innerHTML = '';
        const nextLabel = outcome.ending ? '看考核结果' : state.queue.length ? '这一年还有一件事' : '过完这一年';
        $('memo').innerHTML = `
            <div class="memo-from">来自：${from}</div>
            <div class="memo-body">
                <p class="picked">你选了：${outcome.label}</p>
                <p>${outcome.text}</p>
                <div class="deltas">${outcome.deltas.map(deltaChip).join('')}</div>
            </div>
            <div class="next"><button class="primary" id="btn-next">${nextLabel}</button></div>`;
        $('btn-next').addEventListener('click', step);
        $('btn-next').focus({ preventScroll: true });
    };

    const step = () => {
        if (Game.advance(state)) {
            renderEnd();
        } else {
            renderEvent();
        }
    };

    const sealSvg = (text) => `
        <svg class="seal" viewBox="0 0 128 128" aria-hidden="true">
            <defs><path id="seal-arc" d="M 20 64 A 44 44 0 1 1 108 64"/></defs>
            <circle cx="64" cy="64" r="59" fill="none" stroke="#D32B26" stroke-width="4"/>
            <text font-size="13.5" font-weight="700" fill="#D32B26" letter-spacing="2.5"
                font-family="Songti SC, STSong, SimSun, serif">
                <textPath href="#seal-arc" startOffset="50%" text-anchor="middle">打工人生考核委员会</textPath>
            </text>
            <path fill="#D32B26"
                d="M64 40l5.6 17.3h18.2L73.1 68l5.6 17.3L64 74.6 49.3 85.3 54.9 68 40.2 57.3h18.2z"/>
            <text x="64" y="106" font-size="13" font-weight="700" fill="#D32B26" text-anchor="middle"
                letter-spacing="2" font-family="Songti SC, STSong, SimSun, serif">${text}</text>
        </svg>`;

    const renderEnd = () => {
        const end = state.ending;
        save.runs += 1;
        if (!save.seen.includes(end.id)) {
            save.seen.push(end.id);
        }
        writeSave(save);
        const name = esc(state.name);
        const career = state.log.length
            ? `<ol>${state.log.map((line) => `<li>${line}</li>`).join('')}</ol>`
            : '<p>在岗期间未获晋升。</p>';
        const cell = (label, value) => `<div><span class="k">${label}</span><span class="v">${value}</span></div>`;
        $('doc').innerHTML = `
            <p class="doc-org">打工人生考核委员会文件</p>
            <p class="doc-no">工考字〔${name}〕第 ${save.runs} 号</p>
            <hr class="doc-rule">
            <h1 class="doc-subject">关于${name}同志职业生涯的考核决定</h1>
            <p>${name}同志，${state.origin.name}，22 岁入职，在岗 ${state.age - 22} 年，
                入职志向为「${state.goal.name}」。主要履历如下：</p>
            ${career}
            <p>经研究，认定该同志的职业生涯为：</p>
            <div class="verdict-title">${end.title}</div>
            <p class="verdict-line">${end.line}</p>
            <p class="goal-line${end.goalMet ? ' met' : ''}">${end.goalLine}</p>
            <div class="sheet">
                ${cell('最高职级', Game.RANKS[state.topRank])}
                ${cell('离岗年龄', `${state.age} 岁`)}
                ${cell('人生评分', end.score)}
                ${cell('存款', `${Math.round(state.money)} 万`)}
                ${cell('月支出', `${fmt(state.expense)} 千`)}
                ${cell('睡后收入', `${fmt(state.passive)} 千`)}
                ${cell('健康', state.stats.hp)}
                ${cell('良心', state.stats.heart)}
                ${cell('志向', end.goalMet ? '达成' : '未达成')}
            </div>
            <div class="sign">
                ${sealSvg(end.seal)}
                <p>打工人生考核委员会</p>
                <p>${name} ${state.age} 岁那年</p>
            </div>
            <p class="doc-foot">从工位到顶楼　第 ${save.runs} 次人生</p>`;
        show('end');
    };

    const reportText = () => {
        const end = state.ending;
        return `【从工位到顶楼】${state.name}：${end.title}\n`
            + `${state.age} 岁离岗，最高做到${Game.RANKS[state.topRank]}，存款 ${Math.round(state.money)} 万，`
            + `人生评分 ${end.score}\n`
            + `志向「${state.goal.name}」：${end.goalMet ? '达成' : '未达成'}\n「${end.line}」`;
    };

    const copyReport = async () => {
        const text = reportText();
        const btn = $('btn-copy');
        try {
            await navigator.clipboard.writeText(text);
            btn.textContent = '已复制，去群里粘贴';
        } catch (err) {
            const area = document.createElement('textarea');
            area.value = text;
            document.body.appendChild(area);
            area.select();
            const ok = document.execCommand('copy');
            area.remove();
            btn.textContent = ok ? '已复制，去群里粘贴' : '复制失败，请直接截图';
        }
    };

    $('btn-start').addEventListener('click', () => {
        save.name = $('name').value.trim();
        writeSave(save);
        state = Game.newGame(picked.origin, picked.goal, save.name);
        renderEvent();
    });
    $('btn-again').addEventListener('click', () => {
        $('btn-copy').textContent = '复制战报文字';
        renderStart();
    });
    $('btn-copy').addEventListener('click', copyReport);

    renderStart();

    // 调试用：网址加 ?auto= 自动乱选到结局；?auto=9 乱选 9 步后停下。&goal=free 指定志向
    const params = new URLSearchParams(location.search);
    const auto = params.get('auto');
    if (auto !== null) {
        state = Game.newGame(picked.origin, params.get('goal') || picked.goal, save.name || '张三');
        let guard = 0;
        while (!state.ending && guard < 300) {
            const open = state.event.choices
                .map((c, i) => i)
                .filter((i) => !Game.lockReason(state, state.event.choices[i]));
            Game.choose(state, open[Math.floor(Math.random() * open.length)]);
            Game.advance(state);
            guard += 1;
            if (auto && guard === Number(auto)) {
                break;
            }
        }
        if (state.ending) {
            renderEnd();
        } else {
            renderEvent();
        }
    }
})();
