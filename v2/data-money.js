/*
 * 钱的决定、人生大事、回头找你的人。选项的写法和 data-career.js 一样。
 *
 * 钱的单位：money 存款是「万」，expense 月支出和 passive 睡后收入是「千 / 月」。
 *
 * MONEY_CARDS 每隔一年抽一张。when 是出现条件，都可以不写：
 *   minAge 最小年龄 / minRank 最低职级(0 实习生 … 6 老板) / has 需要有的标记 / lacks 不能有的标记
 * LIFE_EVENTS 到了 age 那一年、满足 when 就出现。
 * FOLLOWUPS  玩家当年做过 needs 这件事，过几年这个人会回来。
 */
const MONEY_CARDS = [
    {
        id: 'mc_house', from: '售楼处', when: { minAge: 26, lacks: 'house' },
        text: '售楼处的人说：首付 30 万，月供 8 千。「现在不买，明年又涨。」',
        choices: [
            {
                label: '买，自己住',
                need: { money: 30 }, flag: 'house',
                text: '你有家了。从此每个月 1 号，手机比你先醒。',
                fx: { money: -30, expense: 5, hp: 3 },
            },
            {
                label: '不买，继续租',
                text: '房东第二年又涨了一次租。你搬了第四次家。',
                fx: { expense: 1 },
            },
            {
                label: '回老家县城买套小的，租出去',
                need: { money: 15 },
                text: '租客是一对刚毕业的小情侣，从不拖欠房租。',
                fx: { money: -15, passive: 2 },
            },
        ],
    },
    {
        id: 'mc_side', from: '隔壁工位',
        text: '同事小声告诉你，ta 周末接私活，一个月能多挣三千。',
        choices: [
            {
                label: '把自己做的 PPT 模板挂到网上卖',
                text: '第一个月卖了 47 块。第二年，它开始自己挣钱了。',
                fx: { hp: -5, passive: 2 },
            },
            {
                label: '周末也去接私活',
                text: '钱到手了。你的周末从此有了报价。',
                fx: { hp: -8, money: 4 },
            },
            {
                label: '周末只想躺着',
                text: '你躺得很认真。',
                fx: { hp: 4 },
            },
        ],
    },
    {
        id: 'mc_fund', from: '茶水间',
        text: '全办公室都在聊基金，连保洁阿姨都说赚了。',
        choices: [
            {
                label: '重仓买入',
                need: { money: 10 },
                text: '你赚了。你开始在茶水间给别人讲课。',
                fx: { money: 10 },
                risk: { chance: 0.5, text: '你买在了山顶。阿姨上周已经卖了。', fx: { money: -7, hp: -3 } },
            },
            {
                label: '每月定投一点，不看',
                need: { money: 5 },
                text: '你忘了登录密码。这成了你最成功的一笔投资。',
                fx: { money: -5, passive: 0.5 },
            },
            {
                label: '不碰',
                text: '你错过了一次大涨，也错过了一次大跌。',
                fx: {},
            },
        ],
    },
    {
        id: 'mc_teashop', from: '发小', when: { minAge: 25 },
        text: '发小想开奶茶店，拉你入股 15 万：「每个月分红，躺着收钱。」',
        choices: [
            {
                label: '入股',
                need: { money: 15 },
                text: '店开在学校门口，队伍排到了马路上。',
                fx: { money: -15, passive: 5 },
                risk: {
                    chance: 0.45,
                    text: '店开了八个月。发小说，等他缓过来一定还你。',
                    fx: { money: -15, net: -2 },
                },
            },
            {
                label: '不入股，借他 5 万',
                need: { money: 5 },
                text: '店倒了，钱没还。他每年过年给你寄一箱老家的橙子。',
                fx: { money: -5, heart: 4 },
            },
            {
                label: '拒绝',
                text: '发小说理解。那个铺面后来开了彩票站。',
                fx: { net: -2 },
            },
        ],
    },
    {
        id: 'mc_car', from: '4S 店', when: { minRank: 2, lacks: 'car' },
        text: '同事们陆续换了车。销售看了一眼你的工牌：「您这个级别，开这款合适。」',
        choices: [
            {
                label: '贷款买那款',
                flag: 'car',
                text: '停车场里，你的车和总监的车停在了一排。',
                fx: { expense: 3, net: 5 },
            },
            {
                label: '买辆二手的代步',
                need: { money: 5 }, flag: 'car',
                text: '车很旧，空调很响，但下雨天你不用等网约车了。',
                fx: { money: -5, expense: 1, hp: 2 },
            },
            {
                label: '继续挤地铁',
                text: '你在地铁上背完了一本单词书。',
                fx: { hp: -2 },
            },
        ],
    },
    {
        id: 'mc_insure', from: '大学同学', when: { lacks: 'insured' },
        text: '大学同学改行卖保险了，朋友圈一天三条。今天 ta 约你喝咖啡。',
        choices: [
            {
                label: '买一份重疾险',
                flag: 'insured',
                text: '每年扣款的时候，你都心疼一下。',
                fx: { expense: 1 },
            },
            {
                label: '买一堆「理财型」的',
                need: { money: 8 },
                text: '到手的收益是宣传册上的一半。',
                fx: { money: -8, passive: 0.5 },
            },
            {
                label: '咖啡喝完，什么也没买',
                text: 'ta 买的单。之后你们没再联系。',
                fx: { net: -1 },
            },
        ],
    },
    {
        id: 'mc_course', from: '直播间',
        text: '直播间里的老师说：「三个月，带你财务自由。原价 19999，今天 9999。」',
        choices: [
            {
                label: '买课',
                need: { money: 1 },
                text: '你学到了最重要的一课：卖课最赚钱。',
                fx: { money: -1, perf: 1 },
            },
            {
                label: '划走',
                text: '算法又给你推了五个差不多的直播间。',
                fx: {},
            },
            {
                label: '自己也开一门课，教别人升职',
                need: { rank: 2 },
                text: '课卖得不错。学员留言：老师讲得真好，就是不知道老师为什么还在上班。',
                fx: { hp: -5, heart: -5, passive: 2 },
            },
        ],
    },
    {
        id: 'mc_stock', from: '全员信', when: { minRank: 1 },
        text: '公司开放员工购股，打八折：「和公司一起成长。」',
        choices: [
            {
                label: '买',
                need: { money: 10 },
                text: '每年分一点红，不多，但准时。',
                fx: { money: -10, passive: 1.5 },
                risk: { chance: 0.35, text: '公司的股价后来成了内部群里不能提的话题。', fx: { money: -10 } },
            },
            {
                label: '不买',
                text: '你和公司的关系保持在劳动合同的范围内。',
                fx: {},
            },
        ],
    },
    {
        id: 'mc_loan', from: '手机推送',
        text: '手机弹出一条推送：「您有 20 万额度待领取，日息低至万分之二。」',
        choices: [
            {
                label: '借出来，把想买的都买了',
                text: '快乐持续了两个月，还款持续了五年。',
                fx: { money: 10, expense: 3, hp: 3 },
            },
            {
                label: '借出来，拿去投资',
                text: '投对了。利息之外，每个月还能剩一点。',
                fx: { expense: 3, passive: 4 },
                risk: { chance: 0.6, text: '投的钱没了，贷款还在。', fx: { expense: 3, hp: -4 } },
            },
            {
                label: '关掉推送',
                text: '第二天它换了个文案又来了。',
                fx: { hp: 1 },
            },
        ],
    },
    {
        id: 'mc_rental', from: '房产中介', when: { minAge: 30 },
        text: '中介说有一套老破小，地段好，买下来出租很划算。',
        choices: [
            {
                label: '买下来出租',
                need: { money: 40 },
                text: '房子很旧，租客换了四拨，租金一年没断过。',
                fx: { money: -40, passive: 6 },
            },
            {
                label: '和朋友合买',
                need: { money: 20 },
                text: '你们一人一半，每月对一次账，从没红过脸。',
                fx: { money: -20, passive: 3 },
                risk: {
                    chance: 0.2,
                    text: '两年后朋友要卖房结婚，你们为了价格吵了一架。',
                    fx: { money: -20, passive: 1, net: -3 },
                },
            },
            {
                label: '不买',
                text: '那套房后来被别人买走了，租给了一家烤冷面。',
                fx: {},
            },
        ],
    },
    {
        id: 'mc_lend', from: '大学室友',
        text: '大学室友深夜发来一长段话，最后一句是：能借我 10 万吗。',
        choices: [
            {
                label: '借',
                need: { money: 10 },
                text: '他三年后还了一半，另一半变成了每年一次的道歉。',
                fx: { money: -10, heart: 6, net: 3 },
            },
            {
                label: '转 2 万，说不用还',
                need: { money: 2 },
                text: '他回了很长一段话。你没有点开看完。',
                fx: { money: -2, heart: 4 },
            },
            {
                label: '说自己也紧张',
                text: '你确实也紧张。',
                fx: { heart: -4 },
            },
        ],
    },
    {
        id: 'mc_kidclass', from: '家长群', when: { has: 'kid' },
        text: '家长群里，别人家的孩子已经在学编程、马术和第二外语。',
        choices: [
            {
                label: '全报',
                text: '孩子的日程表比你的还满。',
                fx: { expense: 4, hp: -3 },
            },
            {
                label: '只报孩子自己想学的',
                text: '孩子选了画画。画的第一张是你在加班。',
                fx: { expense: 1, heart: 3 },
            },
            {
                label: '一个不报',
                text: '孩子在楼下玩了一个暑假的泥巴。',
                fx: { heart: 2, net: -2 },
            },
        ],
    },
    {
        id: 'mc_station', from: '小区门口', when: { minAge: 28, minRank: 2 },
        text: '小区门口的快递驿站要转让，12 万，雇个人看着就行。',
        choices: [
            {
                label: '接下来',
                need: { money: 12 },
                text: '双十一那周你亲自去搬了三天箱子。其他时候，它自己转。',
                fx: { money: -12, passive: 3.5, hp: -3 },
            },
            {
                label: '不接',
                text: '接手的人后来又开了两家。',
                fx: {},
            },
        ],
    },
    {
        id: 'mc_budget', from: '银行账单',
        text: '你查了一下账单：每个月有三分之一的钱，想不起来花在了哪。',
        choices: [
            {
                label: '记账、退订阅、自己带饭',
                text: '你带了一整年的饭。在微波炉前排队，你认识了半层楼的人。',
                fx: { expense: -1.5, hp: -2, net: 2 },
            },
            {
                label: '把开销砍到骨头',
                text: '你搬到了更远的地方，退了健身卡，戒了咖啡。',
                fx: { expense: -2.5, hp: -6 },
            },
            {
                label: '算了，活着已经很累了',
                text: '你关掉账单，点了一杯奶茶。',
                fx: { hp: 3 },
            },
        ],
    },
];

const LIFE_EVENTS = [
    {
        id: 'life_marry', age: 27, from: '对象',
        text: '谈了三年的对象问你：「我们什么时候结婚？」',
        choices: [
            {
                label: '结，办一场体面的婚礼',
                need: { money: 10 }, flag: 'married',
                text: '婚礼很体面。收到的份子钱刚好够付酒店的尾款。',
                fx: { money: -10, expense: 2, hp: 5, heart: 5 },
            },
            {
                label: '结，领个证，吃顿饭',
                flag: 'married',
                text: '那顿饭吃的是火锅。',
                fx: { expense: 1, hp: 5, heart: 4 },
            },
            {
                label: '再等等，先拼事业',
                text: '对象说好。半年后你们分开了。',
                fx: { perf: 5, heart: -5 },
            },
        ],
    },
    {
        id: 'life_kid', age: 30, from: '家里的饭桌', when: { has: 'married' },
        text: '家里的饭桌上，话题开始绕着孩子转。',
        choices: [
            {
                label: '要',
                flag: 'kid',
                text: '孩子出生那天，你在产房外面回了三封工作邮件。',
                fx: { expense: 4, hp: -5, heart: 8 },
            },
            {
                label: '不要',
                text: '你们养了一只猫。猫不需要学区房。',
                fx: { hp: 2 },
            },
            {
                label: '过两年再说',
                text: '过了两年，没有人再提。',
                fx: { perf: 3 },
            },
        ],
    },
    {
        id: 'life_school', age: 34, from: '幼儿园老师', when: { has: 'kid' },
        text: '孩子要上小学了。老师问：学校定了吗？',
        choices: [
            {
                label: '换一套学区房',
                need: { money: 40 }, flag: 'house',
                text: '房子比原来小一半，贵一倍。墙上还贴着上一家孩子的奖状。',
                fx: { money: -40, expense: 4 },
            },
            {
                label: '上私立',
                text: '学费单上的数字，你看了两遍才数清楚位数。',
                fx: { expense: 4 },
            },
            {
                label: '就近上',
                text: '学校很普通。孩子每天走路上学，回家很早。',
                fx: { heart: 2 },
            },
        ],
    },
    {
        id: 'life_parent', age: 38, from: '妈妈',
        text: '你爸住院了。医生说以后要长期吃药，身边不能离人。',
        choices: [
            {
                label: '接来一起住，请个护工',
                text: '家里多了两个人。晚饭的桌子换成了大的。',
                fx: { expense: 4, heart: 8, hp: -3 },
            },
            {
                label: '每月打钱，请老家亲戚照看',
                text: '钱每月按时到账。视频通话里，你爸总说挺好的。',
                fx: { expense: 2, heart: 2 },
            },
            {
                label: '让家里先自己想办法',
                text: '你妈在电话里说没事，让你忙你的。',
                fx: { heart: -10 },
            },
        ],
    },
];

// 睡后收入盖过支出时出现：走不走由玩家定
const FREEDOM_EVENT = {
    id: 'x_free', from: '你自己',
    text: '你算了一笔账：就算明天不上班，每个月的睡后收入也够花了。',
    choices: [
        {
            label: '递辞职信',
            text: '老板问你下家是哪。你说没有下家。',
            ending: 'free',
        },
        {
            label: '再干几年',
            text: '你把辞职信存进了草稿箱。',
            fx: {},
        },
    ],
};

const FOLLOWUPS = [
    {
        id: 'f_intern_good', needs: 'intern_helped', from: '新客户',
        text: '新客户的负责人推门进来，是当年把你的表删了一半的实习生小林。',
        choices: [
            {
                label: '提起当年那个晚上',
                text: '小林笑了：「那天的事我一直记得。」合同当场签了。',
                fx: { perf: 12, net: 8 },
            },
            {
                label: '公事公办，不提旧事',
                text: '会开得很顺。散会时小林说：「备份的习惯，是你教我的。」',
                fx: { perf: 8, heart: 2 },
            },
        ],
    },
    {
        id: 'f_intern_bad', needs: 'intern_reported', from: '新客户',
        text: '新客户的负责人推门进来，是当年被你上报、没能转正的实习生小林。ta 看了你一眼：「我们以前见过。」',
        choices: [
            {
                label: '会后单独道歉',
                text: '小林说没关系，都过去了。合同给了别家。',
                fx: { heart: 5, perf: -4 },
            },
            {
                label: '装作不记得',
                text: '合同给了别家。小林把你送到电梯口，很客气。',
                fx: { perf: -8, net: -5 },
            },
        ],
    },
    {
        id: 'f_wu_bad', needs: 'wu_exposed', from: '人事通知',
        text: '事业部新来了一位副总。是老吴，当年被你当众戳穿抢功的那个老吴。',
        choices: [
            {
                label: '主动去打招呼',
                text: '老吴很热情。他记得那次周会的每一个细节。',
                fx: { net: -3, hp: -3 },
            },
            {
                label: '申请调去别的部门',
                text: '你换了部门，从头认识了一遍人。',
                fx: { perf: -6, hp: 2 },
            },
            {
                label: '当无事发生',
                text: '老吴也当无事发生。',
                fx: {},
                risk: { chance: 0.5, text: '年终考评，他给了你最低一档。', fx: { perf: -10 } },
            },
        ],
    },
    {
        id: 'f_wu_good', needs: 'wu_forgiven', from: '老吴',
        text: '老吴升了副总，上任第一件事是点名要你进他的核心项目：「当年那个方案，我欠你一次。」',
        choices: [
            {
                label: '接',
                text: '这次汇报的时候，老吴第一页就写了你的名字。',
                fx: { perf: 12, hp: -5 },
            },
            {
                label: '婉拒：我们两清了',
                text: '老吴愣了一下，说好。后来他逢人便说你这个人可以。',
                fx: { heart: 5, net: 6 },
            },
        ],
    },
    {
        id: 'f_li_bad', needs: 'li_cut', from: '猎头',
        text: '猎头给你推了一个很好的职位。终面那天，面试官是当年被你报上末位名单的小李。',
        choices: [
            {
                label: '照常面',
                text: '小李只问了一个问题：「你怎么看末位淘汰？」',
                fx: { perf: -3, hp: -3, heart: -3 },
            },
            {
                label: '找个理由取消',
                text: '猎头再也没给你推过职位。',
                fx: { net: -4 },
            },
        ],
    },
    {
        id: 'f_li_good', needs: 'self_reported', from: '老部下',
        text: '当年你把自己报上末位名单保下的那组人，后来有三个做到了总监。他们有个群，群名是你的名字。',
        choices: [
            {
                label: '请他们吃顿饭',
                text: '那顿饭他们抢着买单，最后是饭店老板免的单：老板也是你带过的人。',
                fx: { net: 12, heart: 3 },
            },
            {
                label: '不打扰',
                text: '你没进那个群。但你遇到事的时候，总有人恰好帮得上忙。',
                fx: { net: 8, heart: 5 },
            },
        ],
    },
];
