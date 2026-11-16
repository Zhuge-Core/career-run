/*
 * 职场事件。想加事件，往这个数组里加一项就行。
 *
 * 一个事件：
 *   id      唯一名字
 *   tier    什么阶段会遇到：junior(实习生/专员) mid(主管/经理) senior(总监/副总裁)
 *           boss(老板) any(都会) special(固定年龄出现，规则里写死)
 *   from    消息是谁发来的
 *   text    事件正文
 *   mirror  (可选) 记下玩家这次怎么选，等当了高管遇到 recall 相同的事件时提醒 ta
 *   recall  (可选) 对应上面的 mirror
 *   choices 2~3 个选项，每个：
 *       label    选项文字
 *       text     选完的结果
 *       fx       数值变化：perf 业绩 / net 人脉 / hp 健康 / heart 良心 / money 存款(万)
 *                expense 月支出(千) / passive 睡后收入(千)
 *       guts     (可选) true = 硬气选项，存款撑不过半年的人点不了
 *       need     (可选) { money: 30 } 存款不到 30 万点不了；{ rank: 2 } 职级不够点不了
 *       remember (可选) 记住这件事，过几年会有对应的人回来找你（见 data-money.js 的 FOLLOWUPS）
 *       flag     (可选) 给玩家打一个标记，比如 house / married / kid
 *       risk     (可选) { chance: 概率, text, fx, ending } 小概率换成另一个结果
 *       check    (可选) { stat, min, fail: { text, fx, ending } } 数值不够就走 fail
 *       ending   (可选) 直接进入某个结局
 *
 * 每个事件至少留一个没有 guts 和 need 的选项，不然没钱的玩家会卡住。
 */
const CAREER_EVENTS = [
    // ---------- 实习生 / 专员 ----------
    {
        id: 'j_weekend', tier: 'junior', from: '老板', mirror: 'weekend',
        text: '周五晚上 8 点，老板在群里 @你：「这个 PPT 周一早上要，辛苦一下。」',
        choices: [
            {
                label: '收到，周末加班改',
                text: '你改到周日凌晨。周一老板翻了两页，说先放着。',
                fx: { perf: 8, hp: -8 },
            },
            {
                label: '回复：周末有事，周一上午给',
                guts: true,
                text: '老板没说什么。周一上午你交了，没人发现区别。',
                fx: { hp: 4, heart: 3, perf: -1 },
                risk: { chance: 0.3, text: '老板回了个「好的。」带句号。', fx: { hp: 4, net: -6 } },
            },
            {
                label: '已读不回，周一早到两小时赶出来',
                text: '赶出来了，错了两个数。没人看到那两页。',
                fx: { perf: 4, hp: -3 },
            },
        ],
    },
    {
        id: 'j_blame', tier: 'junior', from: '老板', mirror: 'blame',
        text: '项目上线出了事故。老板把你叫进会议室：「这次对外就说是你这边疏忽了，我心里有数。」',
        choices: [
            {
                label: '认了',
                text: '老板确实心里有数，季度奖多给了你两千。',
                fx: { perf: -3, net: 10, heart: -3 },
                risk: {
                    chance: 0.12,
                    text: '年底裁员需要理由，你的事故记录正好在第一页。',
                    ending: 'scapegoat',
                },
            },
            {
                label: '当场拿出聊天记录',
                guts: true,
                text: '事故记到了该记的人头上。老板从此叫你全名。',
                fx: { perf: 4, net: -8, heart: 5 },
            },
            {
                label: '私下谈条件：背可以，晋升名额给我',
                text: '老板看了你很久，说：「你比我想的聪明。」',
                fx: { perf: 7, net: 3, heart: -8 },
            },
        ],
    },
    {
        id: 'j_credit', tier: 'junior', from: '周会', mirror: 'credit',
        text: '你熬了三周做的方案，同事老吴在周会上讲得眉飞色舞，全程没提你的名字。',
        choices: [
            {
                label: '当场补一句：这部分数据是我跑的',
                remember: 'wu_exposed',
                text: '会议室安静了两秒。老板看了你一眼，记住了你。',
                fx: { perf: 7, net: -4 },
            },
            {
                label: '会后群发邮件，附上文件修改记录',
                remember: 'wu_exposed',
                text: '功劳回来了。老吴再也没跟你一起吃过午饭。',
                fx: { perf: 9, net: -8, heart: -2 },
            },
            {
                label: '算了，下次再说',
                remember: 'wu_forgiven',
                text: '你失眠了两天。老吴当月评了优秀员工。',
                fx: { perf: -3, hp: -3, heart: 2 },
            },
        ],
    },
    {
        id: 'j_toast', tier: 'junior', from: '团建饭局',
        text: '团建饭局上，老板举起杯子看向你：「年轻人，表示一下？」',
        choices: [
            {
                label: '干了',
                text: '你干了三杯。老板拍着你的肩说好样的，第二天不记得你叫什么。',
                fx: { net: 6, hp: -8 },
            },
            {
                label: '以茶代酒',
                text: '气氛冷了一下，很快有人接过了话。',
                fx: { hp: 2, heart: 2, net: -3 },
            },
            {
                label: '不喝，但包揽倒酒、转桌、叫代驾',
                text: '散场时每个人的代驾都是你叫的。行政说你靠谱。',
                fx: { net: 7, hp: -3, perf: 1 },
            },
        ],
    },
    {
        id: 'j_script', tier: 'junior', from: '你自己',
        text: '你写了个小脚本，把每天要花两小时的报表活变成了点一下。',
        choices: [
            {
                label: '告诉老板',
                text: '老板很高兴，把另外两个人的报表也交给了你。',
                fx: { perf: 10, hp: -5 },
            },
            {
                label: '谁也不告诉',
                text: '你每天多出两小时。你把它们用在了午睡上。',
                fx: { hp: 9, heart: -1 },
            },
            {
                label: '分享给全组',
                text: '全组每天早走一小时。有人给你带了一个月的咖啡。',
                fx: { net: 10, perf: 3 },
            },
        ],
    },
    {
        id: 'j_offer', tier: 'junior', from: '猎头',
        text: '隔壁公司想挖你，工资多三成，但要常驻外地。',
        choices: [
            {
                label: '去',
                text: '钱确实多了。你在出租屋里过了两个春节。',
                fx: { money: 6, perf: 5, hp: -6, net: -5 },
            },
            {
                label: '拿着 offer 找老板谈加薪',
                text: '老板沉默了一会儿，给你涨了两成。',
                fx: { money: 4, perf: 2 },
                risk: {
                    chance: 0.4,
                    text: '老板说：「年轻人不要太看重钱。」然后把你移出了一个项目群。',
                    fx: { net: -8 },
                },
            },
            {
                label: '婉拒',
                text: '猎头说以后常联系。后来确实常联系。',
                fx: { net: 3, heart: 2 },
            },
        ],
    },
    {
        id: 'j_intern', tier: 'junior', from: '隔壁工位',
        text: '新来的实习生小林把你做了一周的表删了一半，站在你工位旁边快哭了。',
        choices: [
            {
                label: '陪 ta 一起恢复到半夜',
                remember: 'intern_helped',
                text: '凌晨一点恢复完了。ta 给你鞠了个躬，你不知道该怎么接。',
                fx: { heart: 6, hp: -5, net: 4 },
            },
            {
                label: '上报老板',
                remember: 'intern_reported',
                text: '实习生没有转正。你的表延期了，但延期原因写的不是你。',
                fx: { perf: 3, heart: -6 },
            },
            {
                label: '自己重做，顺手教 ta 做备份',
                remember: 'intern_helped',
                text: 'ta 后来成了全组备份做得最勤的人。',
                fx: { heart: 4, hp: -3, perf: 2 },
            },
        ],
    },
    {
        id: 'j_course', tier: 'junior', from: '人力资源部',
        text: '公司报销在职培训，课在每周六，一共半年。',
        choices: [
            {
                label: '报名，认真上',
                text: '半年没有周末。证书拿到了，简历多了一行。',
                fx: { perf: 10, hp: -6 },
            },
            {
                label: '不报，周六睡觉',
                text: '你睡了二十六个懒觉，每一个都很值。',
                fx: { hp: 9 },
            },
            {
                label: '报名，让同事代签到',
                text: '证书拿到了。你一节课也没听过。',
                fx: { perf: 4, heart: -5 },
                risk: {
                    chance: 0.3,
                    text: '教务抽查点名，通报发到了全公司邮箱。',
                    fx: { perf: -4, net: -6, heart: -5 },
                },
            },
        ],
    },
    {
        id: 'j_gala', tier: 'junior', from: '行政部',
        text: '年会要求每个组出一个节目，没人报名。行政的目光落在了你身上。',
        choices: [
            {
                label: '上台',
                text: '你唱跑调了。全公司都认识你了。',
                fx: { net: 9, hp: -2 },
            },
            {
                label: '推给更新的新人',
                text: '新人跳了一支舞，视频在公司群里传了一年。',
                fx: { heart: -4, hp: 1 },
            },
            {
                label: '报名当主持人',
                text: '对词的时候，你和每一位高管都单独聊了五分钟。',
                fx: { net: 12, hp: -4 },
            },
        ],
    },
    {
        id: 'j_checkup', tier: 'junior', from: '体检中心',
        text: '体检报告出来了，三项带箭头。医生的建议是规律作息。',
        choices: [
            {
                label: '办健身卡，真的去',
                text: '你去了，而且去了不止三次。',
                fx: { hp: 12, perf: -3, money: -1 },
            },
            {
                label: '买保温杯和枸杞',
                text: '保温杯很好用，主要用来装冰美式。',
                fx: { hp: 3 },
            },
            {
                label: '下季度再说，先冲业绩',
                text: '业绩冲上去了。下季度你没有再说。',
                fx: { perf: 7, hp: -8 },
            },
        ],
    },
    {
        id: 'j_clockin', tier: 'junior', from: '行政部',
        text: '公司开始查考勤，迟到一分钟扣五十。你住在通勤一个半小时的地方。',
        choices: [
            {
                label: '搬到公司旁边',
                text: '房租翻倍。你每天多睡一小时，也多加一小时班。',
                fx: { money: -4, hp: 4, perf: 5 },
            },
            {
                label: '每天早起一小时',
                text: '你学会了站着睡觉。',
                fx: { hp: -6, perf: 2 },
            },
            {
                label: '和管考勤的同事搞好关系',
                text: '你的考勤记录从此很好看。',
                fx: { net: 6, heart: -3 },
            },
        ],
    },
    {
        id: 'j_moments', tier: 'junior', from: '朋友圈',
        text: '老板凌晨一点发朋友圈：「奋斗的人最美。」配图是办公室的夜景。',
        choices: [
            {
                label: '秒赞，评论「向老板学习」',
                text: '老板回了你一个握手的表情。',
                fx: { net: 5, heart: -2, hp: -1 },
            },
            {
                label: '第二天当面说：老板注意身体',
                text: '老板愣了一下，说很久没人跟他说这个了。',
                fx: { net: 8, heart: 2 },
            },
            {
                label: '屏蔽老板的朋友圈',
                text: '世界清净了。你错过了老板后来的几条暗示。',
                fx: { hp: 3, heart: 2, net: -3 },
            },
        ],
    },

    // ---------- 主管 / 经理 ----------
    {
        id: 'm_bottom', tier: 'mid', from: '人力资源部',
        text: '公司推行末位淘汰，你组里必须报一个「待改进」。',
        choices: [
            {
                label: '报业绩最差的小李',
                remember: 'li_cut',
                text: '小李三个月后走了。走之前把交接文档写得很细。',
                fx: { perf: 4, heart: -6 },
            },
            {
                label: '报自己',
                remember: 'self_reported',
                guts: true,
                text: '你的奖金没了。组里的人从此真把你当自己人。',
                fx: { perf: -6, heart: 10, net: 8 },
            },
            {
                label: '全组轮流当',
                text: '大家心照不宣，谁也没走。',
                fx: { net: 5, heart: 2 },
                risk: { chance: 0.3, text: '人力发现了你的轮值表。', fx: { perf: -6, net: 2 } },
            },
        ],
    },
    {
        id: 'm_elevator', tier: 'mid', from: '电梯里',
        text: '电梯里只有你和老板的老板。他问：「最近忙什么呢？」你有三十秒。',
        choices: [
            {
                label: '讲清楚手上项目的进展',
                text: '他点了点头，出电梯前问了你的名字。',
                fx: { perf: 5, net: 6 },
            },
            {
                label: '说都是老板带得好',
                text: '这句话当天就传回了你老板耳朵里。',
                fx: { net: 9, heart: -2 },
            },
            {
                label: '紧张，只说了句「挺好的」',
                text: '电梯到了。你在工位上复盘了一下午。',
                fx: { hp: -2 },
            },
        ],
    },
    {
        id: 'm_dump', tier: 'mid', from: '隔壁部门',
        text: '隔壁部门把一个没人想碰的烂摊子项目踢到了你组。',
        choices: [
            {
                label: '接下来',
                text: '你带着组里熬了三个月，居然做成了。',
                fx: { perf: 11, hp: -10 },
            },
            {
                label: '写邮件踢回去，抄送所有人',
                guts: true,
                text: '项目回去了。隔壁主管在茶水间不再跟你打招呼。',
                fx: { perf: 2, net: -8 },
            },
            {
                label: '请对方主管吃饭，一人一半',
                text: '一顿火锅解决了三封邮件解决不了的事。',
                fx: { perf: 5, net: 6, hp: -4, money: -1 },
            },
        ],
    },
    {
        id: 'm_poach', tier: 'mid', from: '猎头',
        text: '猎头来电：竞争对手开双倍薪水，条件是你带着客户名单过去。',
        choices: [
            {
                label: '带着名单跳',
                text: '钱翻倍了。老东家的人再没接过你的电话。',
                fx: { money: 25, perf: 8, heart: -15, net: -10 },
            },
            {
                label: '人过去，名单不带',
                text: '对方有点失望，但还是要了你。',
                fx: { money: 12, perf: 4, net: -4 },
            },
            {
                label: '截图发给老板表忠心',
                text: '老板很感动，口头表扬了你。',
                fx: { net: 9, heart: -3 },
            },
        ],
    },
    {
        id: 'm_baijiu', tier: 'mid', from: '客户',
        text: '客户说：「这杯干了，合同明天签。」桌上是 52 度的白酒。',
        choices: [
            {
                label: '干',
                text: '合同签了。你在酒店卫生间的地上醒来。',
                fx: { perf: 12, hp: -12 },
            },
            {
                label: '不喝，方案再让两个点',
                text: '客户笑了笑，签了。利润薄了点。',
                fx: { perf: 5, money: -2, heart: 2 },
            },
            {
                label: '让下属替你喝',
                text: '合同签了。下属第二天请了病假。',
                fx: { perf: 10, heart: -10, net: -3 },
            },
        ],
    },
    {
        id: 'm_overtime', tier: 'mid', from: '老板',
        text: '你组的加班时长连续三个月全公司倒数。老板找你聊「氛围」。',
        choices: [
            {
                label: '要求全组九点以后再走',
                text: '加班时长上去了。产出没变，离职率变了。',
                fx: { perf: 6, heart: -8, hp: -5 },
            },
            {
                label: '拿出产出数据：活都干完了',
                guts: true,
                text: '老板看完数据，没再提这件事。',
                fx: { perf: 5, heart: 4, net: -3 },
                risk: {
                    chance: 0.3,
                    text: '老板说：「数据不代表态度。」',
                    fx: { heart: 4, net: -9 },
                },
            },
            {
                label: '让大家下班别关电脑，挂着在线',
                text: '你组的在线时长成了全公司第一。',
                fx: { net: 4, heart: -3 },
            },
        ],
    },
    {
        id: 'm_hospital', tier: 'mid', from: '家里',
        text: '家里人住院了，偏偏和你负责的项目上线是同一周。',
        choices: [
            {
                label: '请假去医院',
                text: '项目延了一周。你在病床边坐了五天。',
                fx: { heart: 8, perf: -7, hp: 2 },
            },
            {
                label: '白天医院，晚上公司',
                text: '两边都撑下来了。你一周瘦了八斤。',
                fx: { perf: 3, hp: -14, heart: 3 },
            },
            {
                label: '让下属盯上线，出事算你的',
                text: '上线很顺利。下属说这是 ta 第一次被这样信任。',
                fx: { heart: 5, net: 4 },
                risk: { chance: 0.25, text: '上线出了事故。你说过出事算你的。', fx: { perf: -9, heart: 5 } },
            },
        ],
    },
    {
        id: 'm_options', tier: 'mid', from: '全员信',
        text: '公司宣布今年不涨薪，改发期权：「上市了，大家都财务自由。」',
        choices: [
            {
                label: '信了，接着拼',
                text: '期权协议你后来在抽屉里见过一次。',
                fx: { perf: 8, hp: -5 },
                risk: { chance: 0.2, text: '公司真的上市了。你去看了一眼账户，又看了一眼。', fx: { perf: 8, money: 50 } },
            },
            {
                label: '要求折成现金',
                guts: true,
                text: '折了，打了个很低的折。老板觉得你没有格局。',
                fx: { money: 5, net: -6 },
            },
            {
                label: '开始悄悄面试',
                text: '你面了四家。知道了自己在市场上值多少。',
                fx: { perf: -3, net: 4, hp: -2 },
            },
        ],
    },
    {
        id: 'm_oldfoe', tier: 'mid', from: '微信',
        text: '一个当年坑过你的前同事被优化了，发消息问你组里缺不缺人。',
        choices: [
            {
                label: '帮 ta 内推',
                text: 'ta 入职那天请你吃了饭，一直在说对不起。',
                fx: { heart: 8, net: 5, perf: -2 },
            },
            {
                label: '已读不回',
                text: '消息一直停在那儿。',
                fx: { heart: -3 },
            },
            {
                label: '回一句「我帮你问问」，然后不问',
                text: 'ta 等了你两个星期。',
                fx: { heart: -6 },
            },
        ],
    },

    // ---------- 总监 / 副总裁：你有秘书了 ----------
    {
        id: 's_weekend', tier: 'senior', from: '大客户', recall: 'weekend',
        text: '周五晚上 8 点，大客户临时要改方案，周一早上要。秘书小周正在收拾包，说今晚有朋友从外地来。',
        choices: [
            {
                label: '在群里 @小周：「辛苦一下」',
                text: '小周回了「收到」。周一你翻了两页，说先放着。',
                fx: { perf: 8, heart: -10 },
            },
            {
                label: '让小周走，自己改',
                text: '你改到周日凌晨。手生了，但还会。',
                fx: { perf: 5, hp: -10, heart: 8 },
            },
            {
                label: '跟客户说周三给',
                guts: true,
                text: '客户不太高兴。周三的版本比周一能给的好得多。',
                fx: { perf: -4, net: -4, heart: 6, hp: 2 },
            },
        ],
    },
    {
        id: 's_blame', tier: 'senior', from: '集团', recall: 'blame',
        text: '你拍板的项目出了事故，集团要追责。小周当时书面提醒过你风险，邮件还在。',
        choices: [
            {
                label: '找小周：「对外就说流程疏忽，我心里有数」',
                text: '小周看着你，说：「好的。」',
                fx: { perf: 3, heart: -15, net: -3 },
            },
            {
                label: '自己担',
                guts: true,
                text: '你的年终奖没了。整个事业部都知道了这件事。',
                fx: { perf: -9, heart: 10, net: 9 },
            },
            {
                label: '说成是供应商的问题',
                text: '供应商换了一家。事情过去了。',
                fx: { heart: -7, net: -4 },
                risk: { chance: 0.3, text: '供应商拿出了完整的往来邮件。', fx: { perf: -10, heart: -7, net: -8 } },
            },
        ],
    },
    {
        id: 's_credit', tier: 'senior', from: '董事长', recall: 'credit',
        text: '小周熬了三周做的分析，帮你拿下了年度最大的单。董事长在大会上问：「这是谁的思路？」',
        choices: [
            {
                label: '「团队的努力，主要是我带着做的」',
                text: '掌声很响。小周在最后一排跟着鼓掌。',
                fx: { perf: 10, heart: -10 },
            },
            {
                label: '请小周上台讲',
                text: '小周讲得比你好。董事长记住了两个名字。',
                fx: { perf: 3, heart: 10, net: 6 },
            },
            {
                label: '说「是小周做的」，但话筒没递过去',
                text: '你替 ta 讲完了。讲得不如 ta。',
                fx: { perf: 5, heart: -2 },
            },
        ],
    },
    {
        id: 's_layoff', tier: 'senior', from: '集团',
        text: '集团要求你的事业部「优化」15%。名单由你定，下周一交。',
        choices: [
            {
                label: '按绩效排名一刀切',
                text: '名单交了。走廊里再没人跟你对视。',
                fx: { perf: 6, heart: -8 },
            },
            {
                label: '自己降薪、砍预算，少裁一半',
                text: '你少拿了很多钱。留下来的人里有人哭了。',
                fx: { perf: -4, heart: 10, money: -20, net: 5 },
            },
            {
                label: '先裁 35 岁以上的',
                text: '名单上的人，很多比你小。',
                fx: { perf: 8, heart: -15 },
            },
        ],
    },
    {
        id: 's_resign', tier: 'senior', from: '小周',
        text: '小周递来一封辞职信：想回老家考公务员。',
        choices: [
            {
                label: '加薪挽留',
                text: '小周留下了。ta 说其实只是想听你说一句别走。',
                fx: { money: -5, net: 4, heart: 3 },
            },
            {
                label: '不留，写一封很长的推荐信',
                text: '信你写了一晚上。新来的秘书也姓周。',
                fx: { heart: 8, perf: -2 },
            },
            {
                label: '「现在的年轻人吃不了苦」',
                text: '小周没有接话。新来的秘书也姓周。',
                fx: { heart: -8 },
            },
        ],
    },
    {
        id: 's_sides', tier: 'senior', from: '董事会',
        text: '董事长和总裁闹翻了，两边都约你吃饭，是同一个晚上。',
        choices: [
            {
                label: '去董事长那边',
                text: '你押对了。',
                fx: { perf: 8, net: 12 },
                risk: { chance: 0.5, text: '你押错了。', fx: { perf: -12, net: -8 } },
            },
            {
                label: '去总裁那边',
                text: '你押对了。',
                fx: { perf: 8, net: 12 },
                risk: { chance: 0.5, text: '你押错了。', fx: { perf: -12, net: -8 } },
            },
            {
                label: '称病，都不去',
                text: '两边都没得罪，两边也都没把你当自己人。',
                fx: { hp: 3, net: -5 },
            },
        ],
    },
    {
        id: 's_faint', tier: 'senior', from: '小周',
        text: '你在会议室里晕了一下。小周悄悄把你下午的会都推了，递来一杯温水和一张体检预约单。',
        choices: [
            {
                label: '去体检，休两周假',
                text: '公司没有你也转得很好。这让你有点失落，也松了口气。',
                fx: { hp: 18, perf: -6 },
            },
            {
                label: '把会加回来',
                text: '你开完了所有的会。预约单过期了。',
                fx: { perf: 5, hp: -12, heart: -2 },
            },
            {
                label: '去体检，路上开电话会',
                text: '抽血的时候你在静音和取消静音之间切了四次。',
                fx: { hp: 6, perf: 1 },
            },
        ],
    },
    {
        id: 's_ip', tier: 'senior', from: '市场部',
        text: '市场部劝你做个人账号，拍短视频讲「我是怎么从实习生做到高管的」。',
        choices: [
            {
                label: '拍',
                text: '第三条火了。评论区最高赞是：「所以你也让下属周末加班吗？」',
                fx: { net: 12, perf: 3, hp: -3, heart: -2 },
            },
            {
                label: '不拍',
                text: '市场部找了另一位副总。他现在有八十万粉丝。',
                fx: { hp: 2 },
            },
            {
                label: '让小周代运营，稿子也 ta 写',
                text: '账号做起来了。金句都是小周写的。',
                fx: { net: 10, heart: -6 },
            },
        ],
    },
    {
        id: 's_card', tier: 'senior', from: '供应商',
        text: '供应商在饭后塞来一张卡：「一点心意，大家都这样。」',
        choices: [
            {
                label: '收下',
                text: '卡里的数字比你想的大。',
                fx: { money: 50, heart: -20 },
                risk: { chance: 0.3, text: '供应商出事了，账本上有你的名字。', ending: 'exposed' },
            },
            {
                label: '退回，换一家供应商',
                text: '新供应商贵了一成。采购部对你有意见。',
                fx: { heart: 8, net: -5 },
            },
            {
                label: '退回，合同照签',
                text: '对方有点尴尬。合作倒是一直很顺。',
                fx: { heart: 4, perf: 2 },
            },
        ],
    },

    // ---------- 老板：最后三年 ----------
    {
        id: 'b_996', tier: 'boss', from: '人力资源部',
        text: '人力把新的工时制度草案放在你桌上：早九晚九，一周六天。小周在旁边等你签字。',
        choices: [
            {
                label: '签',
                text: '你签了。小周把文件收走的时候，看了你一眼。',
                fx: { perf: 8, heart: -15 },
            },
            {
                label: '退回去',
                text: '你在草案上写了三个字：不需要。',
                fx: { heart: 12, perf: -3 },
            },
            {
                label: '不写进制度，但提倡「自愿」',
                text: '没有人被要求加班。也没有人敢第一个走。',
                fx: { perf: 5, heart: -9 },
            },
        ],
    },
    {
        id: 'b_toast', tier: 'boss', from: '年会',
        text: '年会上，一个实习生来敬酒，端杯子的手在抖。',
        choices: [
            {
                label: '「年轻人，表示一下？」',
                text: 'ta 干了三杯。你想不起来 ta 叫什么。',
                fx: { heart: -10 },
            },
            {
                label: '「随意，喝茶也行」',
                text: 'ta 明显松了口气。',
                fx: { heart: 8 },
            },
            {
                label: '把自己的酒换成茶',
                text: '你换了，全场跟着换了。那年的年会没有人吐。',
                fx: { heart: 11, net: 4 },
            },
        ],
    },
    {
        id: 'b_zhou', tier: 'boss', from: '小周',
        text: '小周跟了你很多年，想出去独立带一个事业部。那意味着你要重新适应一个新秘书。',
        choices: [
            {
                label: '放 ta 走',
                text: '小周的事业部第二年就盈利了。',
                fx: { heart: 12 },
            },
            {
                label: '「再等两年」',
                text: '小周说好。两年后你又说了一遍。',
                fx: { heart: -9 },
            },
            {
                label: '放 ta 走，再给一笔股份',
                text: '小周说，当年那个周五，ta 没有白加班。',
                fx: { heart: 15, money: -50 },
            },
        ],
    },
    {
        id: 'b_cash', tier: 'boss', from: '财务部',
        text: '公司现金流紧张。财务给了三条路：拖欠供应商、裁员，或者你把自己的房子抵押出去。',
        choices: [
            {
                label: '拖欠供应商',
                text: '供应商的老板在你楼下等了三天。',
                fx: { heart: -12 },
            },
            {
                label: '裁员',
                text: '走的人里，有当年跟你一起入职的。',
                fx: { heart: -10 },
            },
            {
                label: '抵押自己的房子',
                text: '公司撑过去了。你没告诉任何人这件事。',
                fx: { heart: 11, money: -100 },
            },
        ],
    },
    {
        id: 'b_speech', tier: 'boss', from: '母校',
        text: '母校请你回去给毕业生讲话，题目是「我的成功经验」。',
        choices: [
            {
                label: '讲奋斗：我当年每天只睡四小时',
                text: '台下掌声热烈。有个学生记了满满一页。',
                fx: { net: 6, heart: -8 },
            },
            {
                label: '讲运气：我只是没在半路倒下',
                text: '台下有点安静。散场后有几个人留下来找你。',
                fx: { heart: 9 },
            },
            {
                label: '让小周写稿，照着念',
                text: '稿子写得很好。你念到一半才发现写的不是你。',
                fx: { heart: -4, net: 3 },
            },
        ],
    },

    // ---------- 什么阶段都会遇到 ----------
    {
        id: 'a_reunion', tier: 'any', from: '同学群',
        text: '老同学聚会。混得最好的那个抢着买了单，混得最差的那个没来。',
        choices: [
            {
                label: '去，加了一圈微信',
                text: '回来以后，三个人找你办事，一个人找你借钱。',
                fx: { net: 6, hp: -2 },
            },
            {
                label: '不去',
                text: '你在家看了一晚上群里的合照。',
                fx: { hp: 3 },
            },
            {
                label: '去了，全程在回工作消息',
                text: '菜没吃几口。同学说你现在是大忙人了。',
                fx: { perf: 3, net: -2 },
            },
        ],
    },
    {
        id: 'a_subway', tier: 'any', from: '地铁',
        text: '连续加班第二十天，你在地铁上睡过了站，醒来时已经到了终点站。',
        choices: [
            {
                label: '第二天请年假',
                text: '你睡了整整两天。',
                fx: { hp: 12, perf: -4 },
            },
            {
                label: '买杯咖啡，坐回去继续干',
                text: '活干完了。你的手开始会自己抖。',
                fx: { perf: 6, hp: -10 },
            },
            {
                label: '在终点站吃碗面再回去',
                text: '那碗面你记了很多年。',
                fx: { hp: 4, heart: 3 },
            },
        ],
    },
    {
        id: 'a_startup', tier: 'any', from: '老朋友',
        text: '一个朋友拉你合伙创业：「现在不出来，这辈子就这样了。」',
        choices: [
            {
                label: '投点钱，业余时间参与',
                text: '项目撑了一年半。钱没回来，朋友还在。',
                fx: { money: -12, hp: -8 },
                risk: { chance: 0.2, text: '项目被收购了。你的那点钱翻了很多倍。', fx: { money: 60, hp: -8 } },
            },
            {
                label: '拒绝',
                text: '朋友说理解。后来你们联系少了。',
                fx: { net: -2 },
            },
            {
                label: '不创业，也不干了，去大理开民宿',
                text: '你交了辞职信，当晚就订了机票。',
                ending: 'dali',
            },
        ],
    },
    {
        id: 'a_invest', tier: 'any', from: '理财经理',
        text: '理财经理说有个年化 12% 的产品，「你们领导都买了」。',
        choices: [
            {
                label: '把存款都放进去',
                text: '真的拿到了 12%。你开始相信理财经理。',
                fx: { money: 25 },
                risk: { chance: 0.5, text: '产品暴雷了。理财经理的电话再也打不通。', fx: { money: -35, hp: -5 } },
            },
            {
                label: '不买',
                text: '你把钱留在了活期里。',
                fx: {},
            },
            {
                label: '买一点试试',
                text: '赚了点小钱。',
                fx: { money: 4 },
                risk: { chance: 0.5, text: '亏了点小钱，当交学费。', fx: { money: -6 } },
            },
        ],
    },
    {
        id: 'a_redpacket', tier: 'any', from: '工作群',
        text: '半夜两点，工作群里有人发了个红包。是老板。',
        choices: [
            {
                label: '秒抢，回复「谢谢老板」',
                text: '抢到三块二。老板知道了你半夜两点也在线。',
                fx: { net: 3, hp: -2 },
            },
            {
                label: '假装睡了',
                text: '你确实该睡了。',
                fx: { hp: 2 },
            },
            {
                label: '抢到手气最佳，再发一个更大的',
                text: '群里热闹了十分钟。老板给你点了个赞。',
                fx: { net: 8, money: -1, hp: -2 },
            },
        ],
    },
    {
        id: 'a_mom', tier: 'any', from: '妈妈',
        text: '你妈打来电话：「隔壁小王都当上领导了。你最近吃得好不好？」',
        choices: [
            {
                label: '「嗯嗯，在忙，回头说」',
                text: '电话挂了。回头你没有说。',
                fx: { heart: -3, perf: 1 },
            },
            {
                label: '回家待一个周末',
                text: '你妈做了一桌子菜，一句没提小王。',
                fx: { hp: 6, heart: 5, perf: -2 },
            },
            {
                label: '给家里转一笔钱',
                text: '你妈没收，退回来了，还多转了两千。',
                fx: { heart: 3, money: 0 },
            },
        ],
    },

    // ---------- 35 岁那年，固定出现 ----------
    {
        id: 'x_35_low', tier: 'special', from: '人力资源部',
        text: '35 岁生日那天，人力约你下午三点「聊聊」。会议室的桌上放着一盒纸巾。',
        choices: [
            {
                label: '签字，拿赔偿走人',
                text: '你抱着纸箱走出大楼，保安帮你按了电梯。',
                ending: 'laid35',
            },
            {
                label: '去找老板求情',
                text: '老板把你的名字划掉了，换上了另一个人。',
                fx: { heart: -5, net: -5 },
                check: {
                    stat: 'net', min: 30,
                    fail: { text: '老板的秘书说他这周都不在。', ending: 'laid35' },
                },
            },
            {
                label: '当场表示愿意降薪转岗',
                text: '你留下来了。新工位在厕所旁边。',
                fx: { perf: -5, hp: -5, money: -8 },
            },
        ],
    },
    {
        id: 'x_35_high', tier: 'special', from: '人力资源部',
        text: '35 岁生日那天，人力给你一份名单：你手下要走一个 35 岁以上的。和你同岁的老陈排在第一个。',
        choices: [
            {
                label: '签字',
                text: '老陈走的那天，在你的工位上放了一盆绿萝。',
                fx: { perf: 4, heart: -10 },
            },
            {
                label: '换成绩效垫底的年轻人',
                text: '年轻人走了。老陈不知道自己上过名单。',
                fx: { heart: -4, net: -3 },
            },
            {
                label: '去找老板把这个名额争掉',
                text: '名额取消了。你用掉了攒了很多年的面子。',
                fx: { heart: 10, net: -6 },
                check: {
                    stat: 'net', min: 45,
                    fail: {
                        text: '名额没争掉。你的档案里多了一句：「管理者不够坚决」。',
                        fx: { perf: -8, heart: 5 },
                    },
                },
            },
        ],
    },
];
