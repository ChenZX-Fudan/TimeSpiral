// ⏳ TimeSpiral — 章节式点触探险游戏
const $ = s => document.querySelector(s);
const ct = () => document.getElementById('game-container');

// ========== STATE ==========
const S = {
  chapter: 'prologue', // current chapter id
  room: 'spiral_nexus',
  energy: 100, maxEnergy: 100,
  inv: [], flags: {}, visited: {},
  unlocked: ['prologue'], // start with only prologue
  completed: []
};

// ========== MAP POSITIONS (百分比, 对应 地图.webp 上的房间位置) ==========
const ROOM_POS = {
  'spiral_nexus':    { x:50, y:50, label:'🌀 螺旋中心' },
  'temple_of_time':  { x:72, y:28, label:'🏛️ 时间神殿' },
  'fracture_zone':   { x:28, y:32, label:'💫 裂缝区域' },
  'shadow_realm':    { x:22, y:68, label:'🌑 暗影之地' },
  'time_pathways':   { x:70, y:70, label:'✨ 时间通道' },
};

// ========== CHAPTER DEFINITIONS ==========
// Each chapter: id, title, objective (for game part), starting room
const CHAPTERS = [
  { id:'prologue', title:'序章：时间的织者', obj:'探索时间螺旋中心，与守护者们对话，了解时间之源的故事', room:'spiral_nexus', goal:'talk_all_npcs', goalNPCs:['n36','n5','n18','n0'] },
  { id:'ch1',      title:'第一章：时光的回响',  obj:'前往裂缝区域调查异常，击败暗影斥候', room:'spiral_nexus', goal:'beat_scout' },
  { id:'ch2',      title:'第二章：暗影初现',    obj:'收集时间水晶和水晶钥匙，打开暗影之地的封印', room:'temple_of_time', goal:'shadow_unlock' },
  { id:'ch3',      title:'第三章：风暴前夕',    obj:'深入暗影之地，击败暗影战士', room:'shadow_realm', goal:'beat_boss' },
  { id:'ch4',      title:'第四章：决裂时刻',    obj:'穿越时间裂缝，追踪14号的下落', room:'fracture_zone', goal:'found_14' },
  { id:'ch5',      title:'第五章：拯救之旅',    obj:'前往时间通道收集能量，深入裂缝核心救出14', room:'time_pathways', goal:'rescue_14' },
  { id:'ch6',      title:'第六章：暗影侵袭',    obj:'回到裂缝区域，击败所有暗影生物', room:'fracture_zone', goal:'beat_all_shadows' },
  { id:'ch7',      title:'第七章：守护者的牺牲', obj:'在暗影之地面对最终挑战，领悟36的牺牲', room:'shadow_realm', goal:'honor_36' },
  { id:'ch8',      title:'第八章：时间的重生',  obj:'封印暗影核心，完成时间螺旋的修复', room:'shadow_realm', goal:'sealed_core' },
];
const EXTRAS = [
  { id:'extra1', title:'番外1：时空旅行插曲',   obj:'12和队友穿越到平行时间线，遇到严肃版18', room:'spiral_nexus', goal:'read_story' },
  { id:'extra2', title:'番外2：重逢与抉择',     obj:'12通过时间裂缝回到过去，与导师32重逢', room:'spiral_nexus', goal:'read_story' },
  { id:'extra3', title:'番外3：预言的开始',     obj:'小12被告知将成为未来领袖，小18疯狂打趣', room:'spiral_nexus', goal:'read_story' },
  { id:'extra4', title:'番外4：死对头日常',     obj:'小14和小18的日常竞争——火花四溅的滑板对决', room:'spiral_nexus', goal:'read_story' },
  { id:'extra5', title:'番外5：神殿历史课',     obj:'导师32讲述时间禁锢者的起源与Negative One的背叛', room:'spiral_nexus', goal:'read_story' },
  { id:'extra6', title:'番外6：神殿大冒险',     obj:'三小只擅闯时间神殿，破解齿轮谜题与时间沙漏', room:'spiral_nexus', goal:'read_story' },
  { id:'extra7', title:'番外7：穿越小猫探险',   obj:'小12和小18意外穿越到人类世界', room:'spiral_nexus', goal:'read_story' },
  { id:'extra8', title:'番外8：见到作者啦~',    obj:'三小只穿越到现实世界，见到了infinity本人', room:'spiral_nexus', goal:'read_story' },
];

// ========== ITEMS ==========
const ITEMS = {
  'time_crystal':   { id:'time_crystal',   name:'时间水晶', icon:'💎', desc:'蕴含时间能量的水晶碎片', usable:true },
  'crystal_key':    { id:'crystal_key',    name:'水晶钥匙', icon:'🔑', desc:'用水晶凝聚而成的钥匙', usable:true },
  'shadow_essence': { id:'shadow_essence', name:'暗影精华', icon:'🖤', desc:'击败暗影后获得的黑暗精华', usable:true },
  'healing_herb':   { id:'healing_herb',   name:'时间草',   icon:'🌿', desc:'神奇草药，恢复30点时间能量', usable:true },
  'ancient_scroll': { id:'ancient_scroll', name:'古老卷轴', icon:'📜', desc:'记载着对抗暗影方法的古文献', usable:false },
  'star_glove':     { id:'star_glove',     name:'星星手套', icon:'🧤', desc:'5号守护者的遗物', usable:false },
  'time_shard':     { id:'time_shard',     name:'时间碎片', icon:'💠', desc:'时间螺旋核心的碎片，蕴含纯粹的时间能量', usable:true },
  'rescue_beacon':  { id:'rescue_beacon',  name:'救援信标', icon:'📡', desc:'能够追踪迷失在时间裂缝中的守护者', usable:true },
  'memento_36':     { id:'memento_36',     name:'36的遗物', icon:'🌟', desc:'36号守护者留下的时间印记，承载着他的意志', usable:false },
  'energy_crystal': { id:'energy_crystal', name:'能量水晶', icon:'🔵', desc:'凝聚了时间通道能量的水晶', usable:true },
};

// ========== CHAPTER-SPECIFIC NPC DIALOGUES ==========
function getChapterTalks(chapterId) {
  const talks = {
    'ch1': {
      // --- 螺旋中心 ---
      'n36': [
        ['36','12号，你感知到了吗？裂缝区域的异常波动越来越强烈。时间在颤抖。'],
        ['36','1号回溯了过去，2号预见了危机——两条时间线都指向同一个结论：暗影正在回归。'],
        ['36','去裂缝区域调查。如果发现暗影生物，消灭它。这是你作为守护者的第一个任务。'],
      ],
      'n5': [
        ['5','暗影斥候——时间禁锢者的侦察兵。速度快，攻击不致命，但绝不能让它们把情报带回去。'],
        ['5','战斗中用时间能量强化攻击。记住，找到时间之泉可以回复能量。'],
        ['5','裂缝区域的能量分布我已经标好了。暗影斥候潜伏在东北方向，靠近大裂缝的位置。'],
      ],
      'n1': [
        ['1','我回溯了时间之河……时间之战后，Zero封印了时间之心，但裂缝从未真正愈合。'],
        ['1','暗影在裂缝中蛰伏了无数年岁。它们一直在等待封印削弱的那一刻。'],
        ['1','现在裂缝在扩大。12号，你是阻止它进一步蔓延的关键。'],
      ],
      'n2': [
        ['2','（推了推眼镜）我分析了未来72小时内的时间流分支。情况不太乐观。'],
        ['2','如果你不尽快前往裂缝区域，暗影斥候会在48小时内完成侦察——然后大部队就会涌入。'],
        ['2','但我也看到了另一条时间线：你成功消灭了斥候，守护者们获得宝贵的准备时间。我相信你能做到。'],
      ],
      'n9': [
        ['9','时间波动数据正在异常增长。频率、振幅都超出了正常范围。'],
        ['9','值得注意：裂缝区域的能量频率和暗影精华的共振模式高度吻合。时间禁锢者的手笔。'],
        ['9','建议携带时间水晶前往。水晶能稳定你周围的时空场，削弱暗影的力量。'],
      ],
      // --- 裂缝区域 ---
      'n21': [
        ['21','12号！你来了！我已经在这里巡逻了好一阵——暗影能量读数一直在飙升。'],
        ['21','看到东北方向了吗？那就是暗影斥候。我在远处标记了它的位置，就等你来动手。'],
        ['21','小心那些时间裂缝——靠近它们会让你的能量不稳定。打完就回来，别久留。'],
      ],
    },
    'ch2': {
      // --- 时间神殿 ---
      'n5': [
        ['5','裂缝又开始不稳定了。这次和之前不一样——它们不是自然出现的。有人在背后操控。'],
        ['5','水晶祭坛就在神殿中央。解开符文谜题，时间水晶会凝聚成形。那是我们对抗暗影的关键。'],
        ['5','拿到水晶后去裂缝区域的熔炉。用它锻造水晶钥匙——然后我们就能打开通往暗影之地的封印。'],
      ],
      'n9': [
        ['9','时间波动数据异常到令人不安。频率和振幅远超正常阈值。这是暗影力量的特征。'],
        ['9','暗影能够扭曲时间的流动。每一个动作都在干扰过去和未来——它们在试探我们的防御。'],
        ['9','神殿的书架上有一份古老卷轴。上面记录了当年Zero他们封印暗影的方法。'],
      ],
      'n18': [
        ['18','嘿！别这么紧张！虽然听起来像世界末日，但上次我们不是也挺过来了吗？'],
        ['18','不过说真的——暗影确实有点吓人。那种黑乎乎的东西，碰到就想打喷嚏。'],
        ['18','拿到水晶后我也跟你去裂缝区域！反正我的任务就是……嗯……在关键时刻提供精神支持！'],
      ],
      // --- 裂缝区域 ---
      'n21': [
        ['21','时间水晶在你手上？熔炉就在那边。我已经把周围的暗影能量暂时压制住了。'],
        ['21','把水晶放入熔炉——高温会催化水晶内部的能量，凝聚成钥匙的形状。'],
        ['21','拿到钥匙后，暗影之地的封印会被解开。接下来……就是面对真正的敌人了。'],
      ],
      // --- 螺旋中心 ---
      'n1': [
        ['1','我回溯了过去的时间线。暗影并不是第一次试图突破封印。Zero在时间之战中付出了巨大代价才将它们封印。'],
        ['1','但每一次封印的削弱，都是暗影卷土重来的机会。现在是它们最接近成功的一次。'],
      ],
      'n2': [
        ['2','（眼镜反射着时间流的光芒）如果你们不在48小时内锻造出水晶钥匙……暗影将在所有时间线上同步爆发。'],
        ['2','好消息是，我看到了你们成功的那条线。去神殿，拿水晶，去裂缝——这条路是可行的。'],
      ],
      'n36': [
        ['36','暗影初现……它们选择在裂缝最不稳定的时刻出击。这不是巧合，是精心策划的进攻。'],
        ['36','去神殿取得时间水晶。那是Zero留下的遗产——时间之心碎裂后，碎片化作了这些水晶。'],
        ['36','记住：水晶钥匙不仅是打开封印的工具，它本身就能驱散暗影。这是光的原理。'],
      ],
    },
    'ch3': {
      'n36': [
        ['36','你们做得很好，暂时稳定了裂缝。但暗影的力量远不止如此——它们只是刚刚开始试探。'],
        ['36','暗影的力量起源于时间之外。在遥远的过去，有一个古老的存在叫"时间禁锢者"，它们被封印在螺旋深处。现在封印正在松动。'],
        ['36','去吧，击败暗影之地的战士。只有清除盘踞在那里的黑暗，我们才能争取到准备最终决战的时间。'],
      ],
      'n5': [
        ['5','暗影战士就盘踞在暗影之地的中心。它不同于之前的斥候——更强、更快、更狡猾。'],
        ['5','战斗策略：先用普通攻击试探它的防御模式，然后用时间直觉猛攻。'],
        ['5','我和36会在后方监控裂缝波动，实时支援你们。放手去战斗吧。'],
      ],
      'n9': [
        ['9','时间波动数据显示——暗影之地的能量密度在过去24小时内提升了300%。'],
        ['9','时间禁锢者正在苏醒。每击败一个暗影生物，它们的整体力量就会削弱一分。这是消耗战。'],
        ['9','注意暗影战士的攻击模式。它会在HP低于一半时进入狂暴状态——那时才是真正的考验。'],
      ],
      'n11': [
        ['11','嘿！别这么紧张！虽然听起来像世界末日——好吧，确实有点像。但我们会赢的！'],
        ['11','我的节奏感能感知到暗影的弱点周期。每5次攻击后它有短暂僵直，那是你的机会窗口。'],
      ],
      'n14': [
        ['14','（踩着滑板转了一圈）暗影战士？听起来是个不错的对手。让我去打头阵！'],
        ['14','什么？你说要谨慎？拜托，我可是最快的守护者之一。'],
        ['14','（被5瞪了一眼）……好吧好吧，我会听指挥的。大概。'],
      ],
      'n19': [
        ['19','（从阴影中现身）这些暗影……我能感觉到它们的时间流动与正常时间完全不同。'],
        ['19','它们存在于时间的夹缝中。普通攻击只能伤到它们的表层——必须用时间能量才能造成实质伤害。'],
      ],
      'n24': [
        ['24','自我介绍一下——我是24，时间的修补者。专门修复你们察觉不到的细微裂缝。'],
        ['24','但这次的问题不是小裂缝能比的。时间禁锢者的封印正在崩溃。你们必须击败暗影战士，给我争取修复封印的时间。'],
      ],
      'n21': [
        ['21','我在暗影之地外围巡逻了好一阵。暗影战士的巢穴在中心位置——周围布满了小暗影。'],
        ['21','先把小暗影引开，再集中攻击战士。这是我在探险中学到的战术。'],
      ],
      'n18': [
        ['18','哇，大家都好严肃！放轻松点嘛——不过是一只大黑怪而已。'],
        ['18','我速度快，可以帮你们吸引它的注意力！不过如果我跑错方向了……呃，那就是战术性撤退。'],
      ],
    },
    'ch4': {
      'n14': [
        ['14','（踩着滑板跃上一块岩石）这地方真诡异！我喜欢！'],
        ['14','裂缝里的时间流好奇怪——有时候快有时候慢。嘿，你说会不会有时空隧道什么的？'],
        ['14','别担心，我去高处侦察一下！我可是最擅长这个的——（说着就冲了出去）'],
      ],
      'n19': [
        ['19','时间的裂缝……比我们想象的要深。这里有某种力量在试图隐藏它。'],
        ['19','小心——裂缝里的能量很不稳定。我能感觉到有什么东西在里面潜伏着。'],
        ['19','14太冲动了。我们得赶快找到他——裂缝的能量正在急剧上升，恐怕很快会……'],
      ],
      'n21': [
        ['21','我来接应你们。裂缝区域最近出现了异常的时间波动——频率和振幅都是我见过最大的。'],
        ['21','东北方向！我看到14往那边去了——但那边也是裂缝最不稳定的区域。得快！'],
        ['21','糟糕！裂缝在扩大！有什么东西从里面出来了——这不是普通的暗影！'],
      ],
    },
    'ch5': {
      'n11': [
        ['11','我们不能再等了！14还在裂缝的另一端，每一秒暗影的力量都在增强。'],
        ['11','时间通道里有很多能量节点——我们把它们收集起来，应该能增强时间共鸣的力量。'],
        ['11','记住节奏！在时间通道中移动时，跟着能量的脉动走，这样最省力。'],
      ],
      'n18': [
        ['18','每次我们追踪暗影，事情总是越变越糟。我不喜欢这感觉——我的尾巴都紧张得打结了！'],
        ['18','不过放心吧！我速度快，可以帮你吸引那些黑影的注意力。反正它们也抓不到我——大概吧。'],
        ['18','前面有个能量节点！我看到了！快点收集，我们得攒够能量去救14！'],
      ],
      'n19': [
        ['19','裂缝不只是普通的时间裂痕——它在吞噬时间的根源。14很可能就在裂缝的最深处。'],
        ['19','收集时间通道的能量是关键。这些能量能帮我们抵御暗影的侵蚀，进入裂缝核心。'],
        ['19','我已经定位到了14的气息——很微弱，但他还活着。我们需要至少收集3个能量节点才能突破暗影屏障。'],
      ],
      'n21': [
        ['21','时间通道的能量分布我已经标好了。三个主要的能量节点：通道入口、中部漩涡、核心交汇处。'],
        ['21','收集足够的能量后，去裂缝区域的深处——14就在那里。我会在前面开路。'],
      ],
      'n36': [
        ['36','记住：你们的首要任务是找到14。如果形势变得无法控制，立即撤退。安全至上。'],
        ['36','我和5在后方监控裂缝波动。一旦你们收集到足够的能量，我们会给出信号。'],
      ],
      'n5': [
        ['5','裂缝的波动与时间螺旋的中心区域有直接关联。越接近核心，裂缝力量越强。'],
        ['5','我们在后方监控，随时提供支持。记住——先收集能量，再深入裂缝。不要跳步。'],
      ],
    },
    'ch6': {
      'n36': [
        ['36','时间螺旋的稳定性取决于时间之心——现在它已被时间禁锢者盯上。这是最后的决战。'],
        ['36','全体守护者分组行动！12带队深入核心，我和5、9负责外围防守。1、2负责数据监控。'],
        ['36','这不是一场战斗——这是一场战争。你们必须在三个区域同时击退暗影的进攻。'],
      ],
      'n5': [
        ['5','暗影在三个区域同时发动了进攻：裂缝区域、螺旋中心、暗影之地。你们必须逐个击破。'],
        ['5','优先清理裂缝区域的暗影——那里是它们涌入的通道。然后是螺旋中心，最后直捣暗影之地。'],
      ],
      'n9': [
        ['9','时间波动已经超出了所有测量范围。整个时间螺旋的结构都在颤抖。'],
        ['9','战斗顺序很重要：裂缝→螺旋中心→暗影之地。按照这个顺序，暗影的增援会逐级减少。'],
      ],
      'n1': [
        ['1','我回溯了过去——这不是第一次暗影全面入侵。上一次……上一次我们付出了巨大代价。'],
        ['1','但时间线在变化。这一次，如果你们能在三个区域同时取胜，未来将会不同。'],
      ],
      'n2': [
        ['2','（眼镜反射着时间流的光芒）我在所有时间线中都看到了胜利的可能——但概率只有23%。'],
        ['2','不过概率不重要。重要的是你们的行动——去吧，改写这个概率。'],
      ],
      'n18': [
        ['18','三场战斗！这可比平时刺激多了！我的尾巴都兴奋得打结了！'],
        ['18','嘿，来追我啊！我会让这些黑影知道什么叫做"快到看不清"！'],
      ],
      'n19': [
        ['19','暗影的精锐——时间禁锢者的直属部队。它们比之前遇到的任何敌人都要强大。'],
        ['19','但它们有一个共同的弱点：对时间共鸣极度敏感。利用时间能量攻击，效果加倍。'],
      ],
      'n21': [
        ['21','我侦察了三个区域的情况。裂缝区域有暗影先锋，螺旋中心有暗影指挥官，暗影之地有暗影将军。'],
        ['21','先打先锋，再打指挥官，最后打将军。这是最有效率的路线。'],
      ],
      'n24': [
        ['24','三处裂缝同时爆发——这种情况我从未见过。时间禁锢者下了血本。'],
        ['24','但裂缝也是机会。每击败一个暗影精锐，封印就会恢复一部分力量。这是我们的转机。'],
      ],
      'n11': [
        ['11','节奏感告诉我——暗影的进攻有一个固定的波动周期。把握好节奏，你就能预判它们的行动！'],
        ['11','三场战斗，三个节奏。适应它们，掌控它们，击败它们！'],
      ],
    },
    'ch7': {
      'n36': [
        ['36','（站在暗影之地的最深处，暗灰色的毛发在黑暗中泛着微光）时间禁锢者……它几乎完全苏醒了。'],
        ['36','我创立时间共鸣的那一天就知道——总有一天，需要有人用自己的生命来加固封印。'],
        ['36','12，你已经成长了。你不再需要我的指导。带领守护者们，继续守护时间螺旋。这是我的选择。'],
      ],
      'n5': [
        ['5','36……他知道这一天会来。但他从来没有告诉过我们——他一直在独自承受。'],
        ['5','时间禁锢者的核心需要一位守护者的全部时间能量才能封印。36……他打算把自己作为封印。'],
        ['5','我们不能阻止他。但我们可以陪他到最后——让他知道他不是一个人在战斗。'],
      ],
      'n12': [
        ['12','（泪水在眼眶中打转）36……为什么是你？为什么一定要有人牺牲？'],
        ['12','我不想接受……但我知道，这是唯一的方法。36教过我——领导者必须做出最艰难的选择。'],
        ['12','我会继承你的意志。时间螺旋不会倒下。我发誓。'],
      ],
      'n19': [
        ['19','暗影核心的能量正在指数级增长。如果我们不立刻行动，整个时间螺旋将在几分钟内崩塌。'],
        ['19','36的牺牲不会白费。我会记录下这一刻——让未来的守护者知道，和平是有代价的。'],
      ],
    },
    'ch8': {
      'n5': [
        ['5','36已经不在了……但他的时间共鸣依然存在于我们每个人的心中。你能感觉到吗？'],
        ['5','暗影核心就在前面——封印它的力量，完成36未竟的使命。这是最后一战。'],
        ['5','用36留给你的遗物。它能引导时间共鸣的力量——那是封印暗影核心的钥匙。'],
      ],
      'n12': [
        ['12','（紧握着36的遗物，感受到一股温暖的力量）36……你还在，对吗？'],
        ['12','我明白了。时间共鸣不是一个人的力量——它是所有守护者意志的结合。'],
        ['12','现在，让我们一起完成这件事。为了36，为了时间螺旋，为了每一个相信我们的生命。'],
      ],
      'n19': [
        ['19','暗影核心的能量波动已经稳定下来了——多亏了之前所有的战斗。现在是封印它的最佳时机。'],
        ['19','激活封印需要按照正确的时间序列。36的遗物会告诉你正确的顺序——跟着它走。'],
      ],
      'n21': [
        ['21','守护者们的士气空前高涨。虽然失去了36，但他的牺牲让我们更团结了。'],
        ['21','去吧，12。完成封印。我们都相信你。'],
      ],
      'n24': [
        ['24','时间裂缝正在自动愈合——这太不可思议了。暗影核心的力量一旦被封印，整个螺旋就会恢复平衡。'],
        ['24','36的牺牲激活了时间螺旋的自我修复机制。他是对的——一个人的能量足以改变一切。'],
      ],
      'n11': [
        ['11','最后一战了！我感觉到了——时间的节奏正在恢复正常。36一定也在为我们加油。'],
        ['11','来吧，让我们把这件事漂亮地完成！36会为我们骄傲的！'],
      ],
      'n18': [
        ['18','（难得地安静了一瞬）……36那个老家伙，居然就这么走了。'],
        ['18','（然后咧嘴一笑）不过他肯定不希望我们哭哭啼啼的。来吧，让我用最快的速度帮你完成封印！'],
      ],
    },
  };
  return talks[chapterId] || {};
}

// ========== CHAPTER-SPECIFIC ROOM LAYOUTS ==========
function getChapterSpots(chapterId) {
  const spots = {
    'ch1': {
      'spiral_nexus': [
        { id:'n36', t:'npc', x:48, y:20, icon:'🐱', label:'36·领袖', img:'36.webp' },
        { id:'n5',  t:'npc', x:20, y:42, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'n1',  t:'npc', x:30, y:62, icon:'🐱', label:'1·时间回溯者', img:'1.webp' },
        { id:'n2',  t:'npc', x:72, y:58, icon:'🐱', label:'2·时间预知者', img:'2.webp' },
        { id:'n9',  t:'npc', x:78, y:35, icon:'🐱', label:'9·分析师', img:'9.webp' },
        { id:'fountain', t:'heal', x:50, y:72, icon:'💧', label:'时间之泉', amt:40, txt:'时间之泉的暖流涌入体内，恢复了40点时间能量。' },
      ],
      'temple_of_time': [
        { id:'altar', t:'puzzle', x:50, y:45, icon:'🔮', label:'水晶祭坛', ptype:'memory', pdesc:'激活祭坛上的时间符文', pflag:'solved_altar', preward:'time_crystal', pmsg:'时间水晶在祭坛上凝聚成形！获得「时间水晶」💎' },
        { id:'scroll', t:'item', x:25, y:35, icon:'📚', label:'古老书架', iid:'ancient_scroll' },
      ],
    },
    'ch2': {
      'temple_of_time': [
        { id:'n5',  t:'npc', x:30, y:28, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'n9',  t:'npc', x:70, y:30, icon:'🐱', label:'9·分析师', img:'9.webp' },
        { id:'n18', t:'npc', x:50, y:50, icon:'🐱', label:'18·搞笑担当', img:'18.webp' },
        { id:'altar', t:'puzzle', x:50, y:72, icon:'🔮', label:'水晶祭坛', ptype:'memory', pdesc:'激活祭坛上的时间符文', pflag:'solved_altar', preward:'time_crystal', pmsg:'时间水晶在祭坛上凝聚成形！获得「时间水晶」💎' },
        { id:'scroll', t:'item', x:20, y:65, icon:'📚', label:'古老书架', iid:'ancient_scroll' },
      ],
      'fracture_zone': [
        { id:'n21', t:'npc', x:25, y:40, icon:'🐱', label:'21·探险家', img:'21.webp' },
        { id:'n18', t:'npc', x:50, y:55, icon:'🐱', label:'18·搞笑担当', img:'18.webp' },
        { id:'forge', t:'npc', x:65, y:35, icon:'🔥', label:'时间熔炉', talk:[['旁白','一座古老的熔炉。将时间水晶放入其中，可以锻造出水晶钥匙。']] },
        { id:'rift', t:'info', x:40, y:75, icon:'⚡', label:'巨大裂缝', txt:'一道巨大的时间裂缝。黑暗能量不断从中渗出。暗影的力量在此聚集。' },
      ],
      'spiral_nexus': [
        { id:'n36', t:'npc', x:45, y:25, icon:'🐱', label:'36·领袖', img:'36.webp' },
        { id:'n1',  t:'npc', x:20, y:55, icon:'🐱', label:'1·时间回溯者', img:'1.webp' },
        { id:'n2',  t:'npc', x:75, y:55, icon:'🐱', label:'2·时间预知者', img:'2.webp' },
        { id:'fountain', t:'heal', x:50, y:70, icon:'💧', label:'时间之泉', amt:40, txt:'时间之泉的暖流涌入体内，恢复了40点时间能量。' },
      ],
    },
    'ch3': {
      'shadow_realm': [
        { id:'n36', t:'npc', x:48, y:15, icon:'🐱', label:'36·领袖', img:'36.webp' },
        { id:'n5',  t:'npc', x:22, y:30, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'n9',  t:'npc', x:75, y:28, icon:'🐱', label:'9·分析师', img:'9.webp' },
        { id:'n11', t:'npc', x:15, y:50, icon:'🐱', label:'11·节奏者', img:'11.webp' },
        { id:'n14', t:'npc', x:78, y:50, icon:'🐱', label:'14·疾风', img:'14.webp' },
        { id:'n19', t:'npc', x:65, y:75, icon:'🐱', label:'19·影行者', img:'19.webp' },
        { id:'n24', t:'npc', x:35, y:75, icon:'🐱', label:'24·修补者', img:'24.webp' },
        { id:'n21', t:'npc', x:50, y:62, icon:'🐱', label:'21·探险家', img:'21.webp' },
        { id:'n18', t:'npc', x:85, y:68, icon:'🐱', label:'18·搞笑担当', img:'18.webp' },
        { id:'boss1', t:'battle', x:50, y:38, icon:'👹', label:'暗影战士', enemy:{name:'暗影战士·卡奥斯',sprite:'👹',hp:300}, wflag:'beat_boss' },
        { id:'heal1', t:'heal', x:30, y:20, icon:'💧', label:'暗影之泉', amt:30, txt:'暗影之地中竟然也有时间的清泉……恢复了30点能量。' },
      ],
      'spiral_nexus': [
        { id:'n36', t:'npc', x:50, y:30, icon:'🐱', label:'36·领袖', img:'36.webp' },
        { id:'n5',  t:'npc', x:30, y:55, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'fountain', t:'heal', x:50, y:70, icon:'💧', label:'时间之泉', amt:40, txt:'时间之泉的暖流涌入体内，恢复了40点时间能量。' },
      ],
      'fracture_zone': [
        { id:'n21', t:'npc', x:40, y:40, icon:'🐱', label:'21·探险家', img:'21.webp' },
        { id:'herb1', t:'item', x:65, y:30, icon:'🌿', label:'时间草', iid:'healing_herb' },
      ],
    },
    'ch4': {
      'fracture_zone': [
        { id:'n14', t:'npc', x:35, y:30, icon:'🐱', label:'14·疾风', img:'14.webp' },
        { id:'n19', t:'npc', x:60, y:25, icon:'🐱', label:'19·影行者', img:'19.webp' },
        { id:'n21', t:'npc', x:20, y:60, icon:'🐱', label:'21·探险家', img:'21.webp' },
        { id:'rift1', t:'info', x:70, y:55, icon:'⚡', label:'时间裂缝', txt:'一道不稳定的时间裂缝。空气中弥漫着黑暗的气息。14号刚才还在附近……现在却不见了踪影。' },
        { id:'rift2', t:'info', x:45, y:70, icon:'🕳️', label:'深处的裂口', txt:'裂缝深处传来低沉的嗡鸣声。有什么东西正在那里面。一种巨大的吸引力试图将周围的一切拉入其中。' },
        { id:'beacon_spot', t:'puzzle', x:50, y:45, icon:'📡', label:'时间信号追踪', ptype:'sequence', pdesc:'激活时间信号追踪器，定位14的位置', pflag:'found_14', preward:'rescue_beacon', pmsg:'追踪器锁定了14的时间信号！他还在裂缝深处——还活着！获得「救援信标」📡' },
      ],
      'spiral_nexus': [
        { id:'n36', t:'npc', x:50, y:30, icon:'🐱', label:'36·领袖', img:'36.webp' },
        { id:'n5',  t:'npc', x:30, y:55, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'fountain', t:'heal', x:50, y:70, icon:'💧', label:'时间之泉', amt:40, txt:'时间之泉的暖流涌入体内，恢复了40点时间能量。' },
      ],
    },
    'ch5': {
      'time_pathways': [
        { id:'n11', t:'npc', x:25, y:30, icon:'🐱', label:'11·节奏者', img:'11.webp' },
        { id:'n18', t:'npc', x:72, y:25, icon:'🐱', label:'18·搞笑担当', img:'18.webp' },
        { id:'n19', t:'npc', x:50, y:50, icon:'🐱', label:'19·影行者', img:'19.webp' },
        { id:'n21', t:'npc', x:30, y:65, icon:'🐱', label:'21·探险家', img:'21.webp' },
        { id:'energy_a', t:'item', x:20, y:45, icon:'💠', label:'能量节点·入口', iid:'energy_crystal' },
        { id:'energy_b', t:'item', x:60, y:40, icon:'💠', label:'能量节点·中部', iid:'healing_herb' },
        { id:'energy_c', t:'item', x:80, y:62, icon:'💠', label:'能量节点·核心', iid:'time_shard' },
        { id:'heal_node', t:'heal', x:45, y:68, icon:'💚', label:'时间能量泉', amt:30, txt:'时间通道的能量泉为你补充了30点时间能量。' },
      ],
      'fracture_zone': [
        { id:'n14_trapped', t:'npc', x:50, y:28, icon:'🐱', label:'14·被困', img:'14.webp',
          talk:[['14','（虚弱地抬起头）12……你们来了……对不起，我太冲动了……'],
                ['14','暗影的力量在吸取我的能量……但我知道你们会来。你们当然会来。']] },
        { id:'n21', t:'npc', x:22, y:58, icon:'🐱', label:'21·探险家', img:'21.webp' },
        { id:'n19', t:'npc', x:75, y:55, icon:'🐱', label:'19·影行者', img:'19.webp' },
        { id:'boss_rescue', t:'battle', x:50, y:62, icon:'👾', label:'暗影核心守卫', enemy:{name:'暗影核心守卫',sprite:'👾',hp:250}, wflag:'rescue_14' },
        { id:'rift_center', t:'info', x:35, y:80, icon:'⚡', label:'裂缝核心', txt:'裂缝的中心。暗影的力量在此达到顶峰。14刚才就是被从这里吸进去的。' },
      ],
      'spiral_nexus': [
        { id:'n36', t:'npc', x:50, y:35, icon:'🐱', label:'36·领袖', img:'36.webp' },
        { id:'n5',  t:'npc', x:30, y:60, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'fountain', t:'heal', x:50, y:72, icon:'💧', label:'时间之泉', amt:40, txt:'时间之泉的暖流涌入体内，恢复了40点时间能量。' },
      ],
    },
    'ch6': {
      'fracture_zone': [
        { id:'n18', t:'npc', x:25, y:30, icon:'🐱', label:'18·搞笑担当', img:'18.webp' },
        { id:'n19', t:'npc', x:70, y:25, icon:'🐱', label:'19·影行者', img:'19.webp' },
        { id:'n21', t:'npc', x:20, y:62, icon:'🐱', label:'21·探险家', img:'21.webp' },
        { id:'battle_vanguard', t:'battle', x:50, y:45, icon:'👾', label:'暗影先锋', enemy:{name:'暗影先锋·先锋官',sprite:'👾',hp:200}, wflag:'beat_vanguard' },
        { id:'rift_large', t:'info', x:75, y:60, icon:'⚡', label:'大型裂缝', txt:'暗影入侵的主通道。击败暗影先锋可以堵住这个裂缝。' },
      ],
      'spiral_nexus': [
        { id:'n36', t:'npc', x:50, y:22, icon:'🐱', label:'36·领袖', img:'36.webp' },
        { id:'n5',  t:'npc', x:25, y:42, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'n9',  t:'npc', x:72, y:40, icon:'🐱', label:'9·分析师', img:'9.webp' },
        { id:'n1',  t:'npc', x:15, y:62, icon:'🐱', label:'1·时间回溯者', img:'1.webp' },
        { id:'n2',  t:'npc', x:80, y:62, icon:'🐱', label:'2·时间预知者', img:'2.webp' },
        { id:'battle_commander', t:'battle', x:50, y:55, icon:'👹', label:'暗影指挥官', enemy:{name:'暗影指挥官·督军',sprite:'👹',hp:280}, wflag:'beat_commander' },
        { id:'fountain', t:'heal', x:50, y:78, icon:'💧', label:'时间之泉', amt:35, txt:'时间之泉的能量在战斗中格外珍贵，恢复了35点能量。' },
      ],
      'shadow_realm': [
        { id:'n24', t:'npc', x:30, y:32, icon:'🐱', label:'24·修补者', img:'24.webp' },
        { id:'n11', t:'npc', x:68, y:30, icon:'🐱', label:'11·节奏者', img:'11.webp' },
        { id:'n19', t:'npc', x:50, y:68, icon:'🐱', label:'19·影行者', img:'19.webp' },
        { id:'battle_general', t:'battle', x:50, y:42, icon:'👹', label:'暗影将军', enemy:{name:'暗影将军·毁灭者',sprite:'👹',hp:350}, wflag:'beat_general' },
      ],
    },
    'ch7': {
      'shadow_realm': [
        { id:'n36', t:'npc', x:50, y:25, icon:'🐱', label:'36·领袖', img:'36.webp' },
        { id:'n5',  t:'npc', x:28, y:50, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'n19', t:'npc', x:72, y:52, icon:'🐱', label:'19·影行者', img:'19.webp' },
        { id:'sacrifice_altar', t:'info', x:50, y:55, icon:'💫', label:'封印祭坛', txt:'时间之心的封印已经破碎。需要一位守护者的全部时间能量才能重新激活。36正站在祭坛中央。' },
        { id:'core_warning', t:'info', x:35, y:72, icon:'⚠️', label:'暗影核心·不稳定', txt:'暗影核心正在剧烈颤抖。时间禁锢者的低语从核心深处传出——"你们永远无法真正封印我……"' },
        { id:'memento_spot', t:'puzzle', x:50, y:78, icon:'🌟', label:'36的印记', ptype:'memory', pdesc:'接受36的遗志，继承他的力量', pflag:'honor_36', preward:'memento_36', pmsg:'你接过了36的遗物，感受到他留下的温暖力量。"时间螺旋的未来，就交给你了。"36的意志将永远与你同在。' },
      ],
    },
    'ch8': {
      'shadow_realm': [
        { id:'n5',  t:'npc', x:25, y:28, icon:'🐱', label:'5·战术官', img:'5.webp' },
        { id:'n19', t:'npc', x:72, y:25, icon:'🐱', label:'19·影行者', img:'19.webp' },
        { id:'n21', t:'npc', x:18, y:55, icon:'🐱', label:'21·探险家', img:'21.webp' },
        { id:'n24', t:'npc', x:80, y:55, icon:'🐱', label:'24·修补者', img:'24.webp' },
        { id:'n11', t:'npc', x:35, y:72, icon:'🐱', label:'11·节奏者', img:'11.webp' },
        { id:'n18', t:'npc', x:68, y:72, icon:'🐱', label:'18·搞笑担当', img:'18.webp' },
        { id:'core', t:'puzzle', x:50, y:50, icon:'🕳️', label:'暗影核心', ptype:'sequence', pdesc:'用正确的时间序列封印暗影核心', pflag:'sealed_core', pmsg:'暗影核心被成功封印！时间螺旋的光芒重新照耀世界。36的牺牲没有白费。' },
        { id:'tribute_36', t:'info', x:50, y:32, icon:'🌟', label:'36的纪念', txt:'这里曾经是36站立的地方。他的时间共鸣仍然在空气中回荡——温暖而坚定。每一个守护者都能感受到他的存在。' },
      ],
    },
  };
  return spots[chapterId] || {};
}

// ========== ROOMS (same structure, conditional on chapter) ==========
function getRoom(chapterId) {
  const base = {
    'spiral_nexus': {
      id:'spiral_nexus', name:'🌀 时间螺旋中心',
      bg:'radial-gradient(ellipse at 50% 40%, #2d1560 0%, #1a1040 40%, #0a0614 100%)',
      entry:'时间螺旋的光芒在头顶缓缓流动。守护者们的基地。',
      spots:[
        { id:'n0', t:'npc', x:22, y:26, icon:'✨', label:'Zero·初代守护者', img:'0.webp',
          talk:[
            ['Zero','我是Zero，时间之源创造的第一位守护者。很久以前，我和同伴们建立了这个时间螺旋。'],
            ['Zero','我创立了「时间共鸣」——当守护者们并肩作战时，彼此的力量与速度都会同步提升。这是我们的信念。'],
            ['Zero','但暗影从未消失。自称「时间禁锢者」的存在，试图将时间法则囚禁于自己的掌控之中。我们曾将它驱逐，却付出了巨大代价。'],
            ['Zero','如今它卷土重来了。12号，新的守护者们需要你的勇气。记住：每一个选择都影响着时间的流向。'],
          ]},
        { id:'n36', t:'npc', x:48, y:30, icon:'🐱', label:'36·领袖', img:'36.webp',
          talk:[['36','时间螺旋的平衡正在被打破。新的威胁已经出现。'], ['36','去和其他守护者交谈，了解当前的情况。']] },
        { id:'n5', t:'npc', x:30, y:60, icon:'🐱', label:'5·战术官', img:'5.webp',
          talk:[['5','12！裂缝区域出现了异常波动。我们需要立刻行动。'], ['5','先去神殿找到时间水晶——那是我们对抗暗影的关键。']] },
        { id:'n18', t:'npc', x:70, y:55, icon:'🐱', label:'18·搞笑担当', img:'18.webp',
          talk:[['18','嘿！别愁眉苦脸的！虽然暗影很可怕，但有我在呢！']] },
        { id:'fountain', t:'heal', x:50, y:68, icon:'💧', label:'时间之泉', amt:40, txt:'时间之泉的暖流涌入体内，恢复了40点时间能量。' },
      ],
      items:{}, hints:[{x:60,y:45,txt:'💡 时间之泉就在附近...'},{x:15,y:40,txt:'💡 暗影在西边蠢蠢欲动...'}]
    },
    'temple_of_time': {
      id:'temple_of_time', name:'🏛️ 时间神殿',
      bg:'linear-gradient(180deg, #1a1040 0%, #2d1f5a 50%, #1a1030 100%)',
      entry:'古老的尖塔上闪烁着神秘的符文。空气中弥漫着时间的魔力。',
      spots:[
        { id:'altar', t:'puzzle', x:50, y:45, icon:'🔮', label:'水晶祭坛', ptype:'memory', pdesc:'激活祭坛上的时间符文', pflag:'solved_altar', preward:'time_crystal', pmsg:'时间水晶在祭坛上凝聚成形！获得「时间水晶」💎' },
        { id:'scroll', t:'item', x:25, y:35, icon:'📚', label:'古老书架', iid:'ancient_scroll' },
        { id:'n9', t:'npc', x:70, y:50, icon:'🐱', label:'9·分析师', img:'9.webp',
          talk:[['9','暗影的力量在干扰时间流动。'], ['9','把时间水晶带到裂缝区域的熔炉，可以锻造出水晶钥匙。']] },
      ],
      items:{ 'ancient_scroll':{ txt:'卷轴上写着："暗影惧怕水晶之光。将时间水晶带到裂缝区域的熔炉，锻造水晶钥匙。"', flag:'read_scroll' } },
      hints:[{x:45,y:55,txt:'💡 祭坛上的符文似乎可以激活...'}]
    },
    'fracture_zone': {
      id:'fracture_zone', name:'💫 裂缝区域',
      bg:'linear-gradient(135deg, #1a0a20 0%, #2d1040 40%, #1a0828 100%)',
      entry:'时间裂缝在周围散发出暗紫色的光芒。暗影在此潜伏。',
      spots:[
        { id:'forge', t:'npc', x:35, y:40, icon:'🔥', label:'时间熔炉', talk:[['旁白','一座古老的熔炉，可以用时间水晶锻造钥匙。']] },
        { id:'battle1', t:'battle', x:65, y:35, icon:'👾', label:'暗影斥候', enemy:{name:'暗影斥候',sprite:'👾',hp:120}, wflag:'beat_scout' },
        { id:'rift', t:'info', x:50, y:65, icon:'⚡', label:'巨大裂缝', txt:'一道巨大的时间裂缝。黑暗能量不断从中渗出。需要水晶钥匙才能彻底封印。' },
        { id:'n21', t:'npc', x:80, y:55, icon:'🐱', label:'21·探险家', img:'21.webp', talk:[['21','小心！这里的暗影比之前遇到的更强大。']] },
      ],
      items:{
        'time_crystal':{ txt:'将时间水晶放入熔炉……水晶钥匙锻造成功！🔑 封印被解开了！', flag:'shadow_unlock' },
        'shadow_essence':{ txt:'21号分析了暗影精华：暗影怕光。水晶钥匙可以彻底驱散它们。', flag:'analyzed_essence' }
      },
      hints:[{x:60,y:60,txt:'💡 熔炉需要时间水晶...'},{x:70,y:30,txt:'💡 暗影潜伏在此！'}]
    },
    'shadow_realm': {
      id:'shadow_realm', name:'🌑 暗影之地',
      bg:'radial-gradient(ellipse at 50% 40%, #1a0020 0%, #0d0018 60%, #05010a 100%)',
      entry:'浓密的黑雾笼罩四周。这里是时间禁锢者的领域。',
      spots:[
        { id:'boss', t:'battle', x:50, y:35, icon:'👹', label:'暗影战士', enemy:{name:'暗影战士·卡奥斯',sprite:'👹',hp:300}, wflag:'beat_boss' },
        { id:'core', t:'puzzle', x:50, y:62, icon:'🕳️', label:'暗影核心', ptype:'sequence', pdesc:'用正确的顺序激活封印符文', pflag:'sealed_core', pmsg:'暗影核心被封印！时间螺旋恢复了平静。' },
      ],
      items:{},
      hints:[{x:55,y:40,txt:'💡 暗影战士的弱点在头部...'}]
    },
    'time_pathways': {
      id:'time_pathways', name:'✨ 时间通道',
      bg:'linear-gradient(180deg, #0d0630 0%, #1a1060 50%, #0d0630 100%)',
      entry:'发光的时间流如同河流般贯穿空间。守护者们通过这些通道快速移动。',
      spots:[
        { id:'herb', t:'item', x:30, y:40, icon:'🌿', label:'时间草', iid:'healing_herb' },
        { id:'n11', t:'npc', x:60, y:30, icon:'🐱', label:'11·节奏者', img:'11.webp', talk:[['11','通道里的时间草可以恢复能量！']] },
        { id:'heal1', t:'heal', x:50, y:55, icon:'💚', label:'能量节点', amt:20, txt:'时间通道的能量节点为你补充了20点时间能量。' },
      ],
      items:{ 'healing_herb':{ txt:'吃下时间草，时间能量恢复了30点。', flag:'used_herb' } },
      hints:[{x:50,y:50,txt:'💡 通道中有免费的能量补给...'}]
    }
  };

  // Build full room with exits based on chapter progress
  const nexus = JSON.parse(JSON.stringify(base.spiral_nexus));
  nexus.spots.push({ id:'ex_fracture', t:'exit', x:82, y:25, icon:'💫', label:'裂缝区域', to:'fracture_zone' });
  nexus.spots.push({ id:'ex_temple', t:'exit', x:22, y:20, icon:'🏛️', label:'时间神殿', to:'temple_of_time' });
  nexus.spots.push({ id:'ex_pathway', t:'exit', x:75, y:75, icon:'✨', label:'时间通道', to:'time_pathways' });
  const shadowUnlocked = S.flags.shadow_unlock || S.completed.includes('ch2');
  nexus.spots.push({ id:'ex_shadow', t:'exit', x:18, y:78, icon:'🌑', label:'暗影之地', to:'shadow_realm',
    locked:!shadowUnlocked, lockMsg:'暗影之地被强大的封印封锁着。需要水晶钥匙才能进入。' });

  const temple = JSON.parse(JSON.stringify(base.temple_of_time));
  temple.spots.push({ id:'ex_t2n', t:'exit', x:50, y:90, icon:'↩', label:'返回螺旋中心', to:'spiral_nexus' });

  const fracture = JSON.parse(JSON.stringify(base.fracture_zone));
  fracture.spots.push({ id:'ex_f2n', t:'exit', x:15, y:80, icon:'↩', label:'返回螺旋中心', to:'spiral_nexus' });

  const shadow = JSON.parse(JSON.stringify(base.shadow_realm));
  shadow.spots.push({ id:'ex_s2n', t:'exit', x:50, y:88, icon:'↩', label:'返回螺旋中心', to:'spiral_nexus' });

  const pathway = JSON.parse(JSON.stringify(base.time_pathways));
  pathway.spots.push({ id:'ex_p2n', t:'exit', x:20, y:80, icon:'↩', label:'返回螺旋中心', to:'spiral_nexus' });
  pathway.spots.push({ id:'ex_p2f', t:'exit', x:85, y:35, icon:'💫', label:'裂缝区域', to:'fracture_zone' });

  const rooms = { spiral_nexus:nexus, temple_of_time:temple, fracture_zone:fracture, shadow_realm:shadow, time_pathways:pathway };

  // Apply chapter-specific NPC dialogues
  const chapterTalks = getChapterTalks(S.chapter);
  Object.values(rooms).forEach(room => {
    room.spots = room.spots.map(spot => {
      if (spot.t === 'npc' && chapterTalks[spot.id]) {
        return { ...spot, talk: chapterTalks[spot.id] };
      }
      return spot;
    });
  });

  // Apply chapter-specific room layouts
  const chapterSpots = getChapterSpots(S.chapter);
  Object.entries(chapterSpots).forEach(([roomId, overrideSpots]) => {
    if (rooms[roomId]) {
      const exits = rooms[roomId].spots.filter(s => s.t === 'exit');
      rooms[roomId].spots = [...overrideSpots, ...exits];
      // Re-apply talks to the new spots
      rooms[roomId].spots = rooms[roomId].spots.map(spot => {
        if (spot.t === 'npc' && chapterTalks[spot.id]) {
          return { ...spot, talk: chapterTalks[spot.id] };
        }
        return spot;
      });
    }
  });

  return rooms;
}

// ========== SCREENS ==========

// --- Title ---
function showTitle() {
  const hasSave = !!localStorage.getItem('timespiral_save');

  ct().style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#0d0620,#1a1040,#2d1560);position:relative;';
  ct().innerHTML = `
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="width:180px;height:250px;margin:0 auto 20px;border-radius:12px;overflow:hidden;box-shadow:0 0 30px rgba(255,213,79,0.2),0 8px 24px rgba(0,0,0,0.5);">
        <img src="images/封面1.webp" alt="封面" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;background:#2d1f5a;>⏳</div>'">
      </div>
      <div style="font-size:2rem;font-weight:700;background:linear-gradient(135deg,#b388ff,#ffd54f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;">时间螺旋</div>
      <div style="font-size:0.75rem;color:#7c6b9a;margin-bottom:28px;">T I M E  S P I R A L</div>
      <button id="btn-new" style="display:block;width:180px;padding:12px 0;margin:0 auto 10px;border:none;border-radius:24px;background:linear-gradient(135deg,#7c4dff,#b388ff);color:white;font-size:1rem;font-family:inherit;cursor:pointer;">✨ 开始冒险</button>
      ${hasSave ? '<button id="btn-load" style="display:block;width:180px;padding:12px 0;margin:0 auto;border:1px solid #3d2e60;border-radius:24px;background:transparent;color:#b39ddb;font-size:1rem;font-family:inherit;cursor:pointer;">📖 继续冒险</button>' : ''}
    </div>`;
  document.getElementById('btn-new')?.addEventListener('click', () => { resetState(); showChapterSelect(); });
  document.getElementById('btn-load')?.addEventListener('click', () => {
    if (loadGame()) { showChapterSelect(); toast('📖 存档已读取'); } else { toast('⚠️ 没有存档'); }
  });
}

// --- Chapter Select ---
function showChapterSelect() {
  const mainDone = CHAPTERS.every(ch => S.completed.includes(ch.id));
  const showExtras = !!S.flags._extrasRevealed;
  // Main chapters always visible; extras only after easter egg
  const mainChapters = CHAPTERS;
  const extraChapters = showExtras ? EXTRAS : [];

  let html = `<div style="width:100%;height:100%;overflow-y:auto;background:linear-gradient(180deg,#0d0620,#1a1040 30%,#2d1560 100%);padding:40px 20px;">`;
  html += `<h2 id="chapter-title" style="text-align:center;color:#b388ff;margin-bottom:4px;font-size:1.4rem;cursor:default;">📖 选择章节</h2>`;
  html += `<p id="chapter-hint" style="text-align:center;color:#7c6b9a;font-size:0.75rem;margin-bottom:24px;">完成当前章节后解锁下一章</p>`;

  // Render main chapters
  mainChapters.forEach(ch => {
    const unlocked = S.unlocked.includes(ch.id);
    const completed = S.completed.includes(ch.id);
    let cardStyle = 'background:rgba(35,24,56,0.8);border:1px solid #3d2e60;';
    if (completed) cardStyle += 'border-color:#69f0ae;opacity:0.85;';
    if (!unlocked) cardStyle += 'opacity:0.4;';
    if (S.chapter === ch.id && !completed) cardStyle += 'border-color:#ffd54f;box-shadow:0 0 16px rgba(255,213,79,0.25);';
    const statusIcon = completed ? '✅' : (unlocked ? '▶️' : '🔒');
    const statusText = completed ? '已完成' : (unlocked ? '点击开始' : '未解锁');
    html += `<div class="ch-card" data-ch="${ch.id}" style="${cardStyle}padding:14px;border-radius:10px;margin-bottom:10px;cursor:${unlocked?'pointer':'default'};display:flex;align-items:center;gap:10px;transition:all 0.2s;">
      <span style="font-size:1.6rem;flex-shrink:0;">${statusIcon}</span>
      <div style="flex:1;min-width:0;"><div style="font-size:0.95rem;color:#ede7f6;">${ch.title}</div><div style="font-size:0.7rem;color:#7c6b9a;margin-top:2px;">${ch.obj}</div></div>
      <span style="font-size:0.7rem;color:${completed?'#69f0ae':'#b39ddb'};flex-shrink:0;">${statusText}</span>
    </div>`;
  });

  if (showExtras) {
    html += `<div style="margin:20px 0 8px;padding-top:16px;border-top:1px dashed #3d2e60;">
      <h3 style="text-align:center;color:#ffd54f;font-size:1.1rem;margin-bottom:12px;">📚 番外篇 · 对话小说</h3>
    </div>`;
    extraChapters.forEach(ch => {
      const completed = S.completed.includes(ch.id);
      let cardStyle = 'background:rgba(45,20,60,0.8);border:1px solid #7c4dff;';
      if (completed) cardStyle += 'border-color:#69f0ae;opacity:0.85;';
      const statusIcon = completed ? '✅' : '📖';
      const statusText = completed ? '已读' : '阅读';
      html += `<div class="ch-card ch-extra" data-ch="${ch.id}" style="${cardStyle}padding:12px;border-radius:10px;margin-bottom:8px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.2s;">
        <span style="font-size:1.4rem;flex-shrink:0;">${statusIcon}</span>
        <div style="flex:1;min-width:0;"><div style="font-size:0.9rem;color:#ede7f6;">${ch.title}</div><div style="font-size:0.65rem;color:#7c6b9a;margin-top:2px;">${ch.obj}</div></div>
        <span style="font-size:0.65rem;color:#b39ddb;flex-shrink:0;">${statusText}</span>
      </div>`;
    });
  }

  // Reset button
  html += `<div style="text-align:center;margin-top:20px;">
    <button id="btn-reset" style="padding:8px 20px;border:1px solid #3d2e60;border-radius:16px;background:transparent;color:#7c6b9a;font-size:0.8rem;font-family:inherit;cursor:pointer;">🔄 重置进度</button>
  </div>`;
  html += `</div>`;
  ct().innerHTML = html;

  // Easter egg popup: all 8 chapters completed → show modal to unlock extras
  if (mainDone && !showExtras) {
    setTimeout(() => showEasterEggModal(), 400);
  }

  // Event delegation for chapter cards
  ct().addEventListener('click', function chCardClick(e) {
    const card = e.target.closest('.ch-card');
    if (!card) return;
    const chId = card.dataset.ch;
    if (!chId) return;
    const isExtra = EXTRAS.some(ex => ex.id === chId);
    const allChs = [...CHAPTERS, ...EXTRAS];
    const ch = allChs.find(c => c.id === chId);
    if (!ch) return;

    // Check unlock: extras always accessible after reveal, mains need unlock
    if (!isExtra && !S.unlocked.includes(chId)) { return; }
    if (isExtra && !mainDone) { toast('完成所有8章主线后解锁番外'); return; }

    S.chapter = chId;
    S.room = ch.room;
    saveGame();

    // Extras → visual novel viewer
    if (isExtra) {
      showNovelViewer(ch);
      return;
    }

    // Main chapters → story reader + game
    const storyText = STORY_DATA[chId]?.text || '';
    ct().innerHTML = `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;background:#0d0620;">
        <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #3d2e60;background:rgba(10,6,20,0.95);">
          <span style="color:#b388ff;font-weight:600;">📖 ${ch.title}</span>
          <button id="btn-skip-story" style="padding:8px 18px;border:1px solid #ffd54f;border-radius:16px;background:rgba(255,213,79,0.1);color:#ffd54f;font-size:0.85rem;font-family:inherit;cursor:pointer;">跳过 ⏭</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px 18px;color:#ede7f6;line-height:2;font-size:0.95rem;">
          ${storyText ? storyText.split('\n').filter(l => l.trim()).map(p => `<p style="text-indent:2em;margin-bottom:0.8em;">${p}</p>`).join('') : '<p style="text-align:center;color:#7c6b9a;padding:40px;">暂无文本，直接进入游戏吧</p>'}
        </div>
        <div style="padding:16px;text-align:center;border-top:1px solid #3d2e60;background:rgba(10,6,20,0.95);">
          <button id="btn-enter-game" style="width:220px;padding:14px 0;border:none;border-radius:24px;background:linear-gradient(135deg,#7c4dff,#b388ff);color:white;font-size:1.05rem;font-family:inherit;cursor:pointer;">🎮 进入冒险</button>
          <div style="font-size:0.7rem;color:#7c6b9a;margin-top:8px;">目标：${ch.obj}</div>
        </div>
      </div>`;
    document.getElementById('btn-skip-story')?.addEventListener('click', () => startChapterGame(ch));
    document.getElementById('btn-enter-game')?.addEventListener('click', () => startChapterGame(ch));
    // Async load story if not preloaded
    if (!storyText) {
      fetch('js/data/stories.json').then(r => r.json()).then(data => {
        STORY_DATA = data;
        const text = data[chId]?.text || '';
        if (text) {
          const el = ct().querySelector('[style*="overflow-y:auto"]');
          if (el) el.innerHTML = text.split('\n').filter(l => l.trim()).map(p => `<p style="text-indent:2em;margin-bottom:0.8em;">${p}</p>`).join('');
        }
      }).catch(() => {});
    }
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (confirm('确定要重置所有进度吗？此操作不可撤销。')) {
      localStorage.removeItem('timespiral_save');
      resetState();
      showChapterSelect();
      toast('🔄 进度已重置');
    }
  });
}

// --- Story Reader ---
async function showStoryReader(chapter) {
  // Show loading immediately
  ct().innerHTML = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;background:#0d0620;">
      <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #3d2e60;background:rgba(10,6,20,0.95);">
        <span style="color:#b388ff;font-weight:600;">📖 ${chapter.title}</span>
        <button id="btn-skip-story" style="padding:8px 18px;border:1px solid #ffd54f;border-radius:16px;background:rgba(255,213,79,0.1);color:#ffd54f;font-size:0.85rem;font-family:inherit;cursor:pointer;">跳过 ⏭</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:20px 18px;color:#ede7f6;line-height:2;font-size:0.95rem;text-align:center;color:#7c6b9a;padding-top:80px;">
        <p>⏳ 加载中...</p>
      </div>
      <div style="padding:16px;text-align:center;border-top:1px solid #3d2e60;background:rgba(10,6,20,0.95);">
        <button id="btn-enter-game" style="width:220px;padding:14px 0;border:none;border-radius:24px;background:linear-gradient(135deg,#7c4dff,#b388ff);color:white;font-size:1.05rem;font-family:inherit;cursor:pointer;">🎮 进入冒险</button>
        <div style="font-size:0.7rem;color:#7c6b9a;margin-top:8px;">目标：${chapter.obj}</div>
      </div>
    </div>`;
  document.getElementById('btn-skip-story')?.addEventListener('click', () => startChapterGame(chapter));
  document.getElementById('btn-enter-game')?.addEventListener('click', () => startChapterGame(chapter));

  // Use preloaded story data, or fallback to fetch
  let storyText = STORY_DATA[chapter.id]?.text || '';
  if (!storyText && Object.keys(STORY_DATA).length === 0) {
    try {
      const resp = await fetch('js/data/stories.json');
      const data = await resp.json();
      STORY_DATA = data;
      storyText = data[chapter.id]?.text || '';
    } catch(e) { console.warn('[TS] Story text not loaded:', e); }
  }

  // Update the content area with story text (or keep the default)
  const contentEl = ct().querySelector('div[style*="flex:1"]');
  if (contentEl) {
    if (storyText) {
      contentEl.style.cssText = 'flex:1;overflow-y:auto;padding:20px 18px;color:#ede7f6;line-height:2;font-size:0.95rem;';
      contentEl.innerHTML = storyText.split('\n').filter(l => l.trim()).map(p => `<p style="text-indent:2em;margin-bottom:0.8em;">${p}</p>`).join('');
    } else {
      contentEl.innerHTML = '<p style="text-align:center;color:#7c6b9a;padding:40px;">暂无文本，直接进入游戏吧</p>';
    }
  }
}

// --- Easter Egg Modal ---
function showEasterEggModal() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;z-index:400;background:rgba(5,3,12,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn 0.4s ease;';
  overlay.innerHTML = `
    <div style="font-size:3.5rem;margin-bottom:16px;animation:battleFloat 2s ease-in-out infinite;">🎁</div>
    <div style="font-size:1.4rem;color:#ffd54f;font-weight:700;margin-bottom:8px;">🎉 恭喜通关全部章节！</div>
    <div style="font-size:0.9rem;color:#b39ddb;margin-bottom:6px;text-align:center;max-width:300px;">你已完成时间螺旋的全部主线故事</div>
    <div style="font-size:0.85rem;color:#7c6b9a;margin-bottom:24px;text-align:center;max-width:300px;">发现了隐藏的番外篇 · 对话小说，要解锁吗？</div>
    <button id="btn-unlock-extras" style="width:200px;padding:14px 0;border:none;border-radius:24px;background:linear-gradient(135deg,#7c4dff,#b388ff);color:white;font-size:1.05rem;font-family:inherit;cursor:pointer;">✨ 解锁番外篇</button>
    <button id="btn-skip-extras" style="margin-top:12px;padding:8px 20px;border:1px solid #3d2e60;border-radius:16px;background:transparent;color:#7c6b9a;font-size:0.8rem;font-family:inherit;cursor:pointer;">以后再说</button>`;
  ct().appendChild(overlay);

  document.getElementById('btn-unlock-extras')?.addEventListener('click', () => {
    S.flags._extrasRevealed = true;
    saveGame();
    overlay.remove();
    showChapterSelect();
    toast('✨ 番外篇已解锁！');
  });
  document.getElementById('btn-skip-extras')?.addEventListener('click', () => {
    overlay.remove();
    toast('💡 随时可以从章节选择再次查看');
  });
  // Also dismiss on clicking the dark background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      toast('💡 随时可以从章节选择再次查看');
    }
  });
}

// --- Visual Novel Viewer (for extras) ---
// Scroll-accumulation mode: click to append next segment, previous text scrolls up
function showNovelViewer(chapter) {
  const text = STORY_DATA[chapter.id]?.text || '';
  if (!text) {
    fetch('js/data/stories.json').then(r => r.json()).then(data => {
      STORY_DATA = data;
      showNovelViewer(chapter);
    }).catch(() => {
      toast('⚠️ 故事加载失败');
      showChapterSelect();
    });
    return;
  }

  // Split into segments: double newline separates scenes
  const rawSegments = text.split(/\n{2,}/).filter(s => s.trim());
  let idx = 0;

  // Map speaker name to best available image
  function getPortrait(speaker) {
    const name = speaker.replace(/（[^）]*）/, '').trim();
    const MAP = {
      '12': '12.webp', '小12': 'x12.webp',
      '14': '14.webp', '小14': 'x14.webp',
      '18': '18.webp', '小18': 'x18.webp',
      '32': '32.webp',
      'infinity': 'infinity.webp',
      '旁白': null,
    };
    if (name in MAP) return MAP[name] ? `images/${MAP[name]}` : null;
    // "小" prefix — check BEFORE generic number extraction
    const xiaoMatch = name.match(/小(\d+)/);
    if (xiaoMatch) return `images/x${xiaoMatch[1]}.webp`;
    const num = name.match(/\d+/);
    if (num) return `images/${num[0]}.webp`;
    return null;
  }

  // Build HTML for a single segment
  function buildSegmentHTML(seg) {
    const trimmed = seg.trim();

    // --- shared render helpers ---
    function dialogueCard(speakerName, actionText, dialogueLines) {
      const portraitImg = getPortrait(speakerName);
      const portraitHTML = portraitImg
        ? `<img src="${portraitImg}" alt="${speakerName||'?'}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent='🐱';this.remove()">`
        : '<span style="font-size:2rem;">🐱</span>';
      // Clean up trailing punctuation from action text
      const cleanAction = (actionText || '').replace(/[，,。\s]+$/, '').trim();
      const displayAction = cleanAction || (speakerName || '');
      const dialogueHTML = (dialogueLines || []).filter(Boolean).map(d =>
        `<div style="font-size:0.9rem;color:#ede7f6;line-height:1.75;margin-bottom:2px;">${d}</div>`
      ).join('');
      return `
        <div class="novel-seg" style="padding:16px 0;border-bottom:1px solid rgba(61,46,96,0.25);animation:fadeIn 0.35s ease;">
          <div style="display:flex;align-items:flex-start;gap:14px;">
            <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;border:2px solid #b388ff;box-shadow:0 0 12px rgba(179,136,255,0.25);background:#2d1f5a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${portraitHTML}
            </div>
            <div style="flex:1;min-width:0;">
              ${displayAction ? `<div style="font-size:0.8rem;color:#ffd54f;font-weight:600;margin-bottom:6px;">${displayAction}</div>` : ''}
              ${dialogueHTML}
            </div>
          </div>
        </div>`;
    }

    function narrationCard(text) {
      return `
        <div class="novel-seg" style="padding:14px 0;border-bottom:1px solid rgba(61,46,96,0.25);animation:fadeIn 0.35s ease;">
          <div style="font-size:0.9rem;color:#c5bfd6;line-height:1.9;text-indent:2em;">${text.replace(/\n/g, '<br>')}</div>
        </div>`;
    }

    // Try to extract a speaker name from the beginning of a string.
    // Returns {speaker, rest} or null.
    function extractSpeaker(text) {
      let s = text.trim();
      // Skip leading punctuation / filler words that appear before the speaker name
      // e.g. "。小12发现了…" → skip "。"
      s = s.replace(/^[。，、；：！？….—\-—\s]+/, '').trim();
      if (!s) return null;
      // "小12" / "小18" pattern (young characters — keep "小" prefix)
      let m = s.match(/^(小\d+)/);
      if (m) return { speaker: m[1], rest: s.substring(m[0].length).trim() };
      // Pure number: 12, 18, 5, 32, etc.
      m = s.match(/^(\d+)/);
      if (m) return { speaker: m[1], rest: s.substring(m[0].length).trim() };
      // "那只18" / "那个18" / "这位32" / "平行时空的18" — strip prefix
      m = s.match(/^(?:那只|那个|这位|那位|平行时空的)\s*(\d+)/);
      if (m) return { speaker: m[1], rest: s.substring(m[0].length).trim() };
      // "小女孩" → infinity (author self-insert in extra7/extra8)
      m = s.match(/^(小女孩)/);
      if (m) return { speaker: 'infinity', rest: s.substring(m[0].length).trim() };
      // Named characters
      m = s.match(/^(Zero|Infinity|infinity)/i);
      if (m) return { speaker: m[1], rest: s.substring(m[0].length).trim() };
      // Loose fallback: speaker number embedded in description text
      // (e.g. "而那位严肃版的18则冷冷地说道" → 18)
      m = s.match(/(小\d+)/);
      if (m) return { speaker: m[1], rest: s.substring(m.index + m[0].length).trim() };
      m = s.match(/(?<!\d)(\d{1,2})(?!\d)/);
      if (m) return { speaker: m[1], rest: s.substring(m.index + m[0].length).trim() };
      return null;
    }

    // Last-resort: scan the text for a known speaker number
    // Used when the speaker isn't the first word after the quote
    // (e.g. "一个紫红色的猫咪…完全不像是18" → 18)
    function deepScanSpeaker(text) {
      // "小\d+" anywhere in the first ~60 chars
      let m = text.match(/小(\d+)/);
      if (m) return '小' + m[1];
      // "的18" / "的32" — possessive form usually indicates the speaker
      m = text.match(/[的]\s*(\d+)/);
      if (m) return m[1];
      // Standalone 2-digit number in first 40 chars (32, 18, 14, 12 etc.)
      m = text.substring(0, 40).match(/(?:^|[^\d])(\d{2})(?:[^\d]|$)/);
      if (m) return m[1];
      return null;
    }

    // ============================================================
    // Quote helper: extracts ALL quoted segments from text
    // Matches both U+201C/U+201D smart quotes and ASCII "
    // ============================================================
    function findAllQuoted(text) {
      const quotes = [];
      const narrationParts = [];
      const re = /[“”](.+?)[“”]/gs;
      let m, lastIdx = 0;
      while ((m = re.exec(text)) !== null) {
        // Text before this quote is narration/description
        narrationParts.push(text.substring(lastIdx, m.index));
        quotes.push(m[1]);
        lastIdx = m.index + m[0].length;
      }
      // Remaining text after last quote
      narrationParts.push(text.substring(lastIdx));
      // Safety: limit iterations to prevent hangs on malformed input
      if (quotes.length > 20) return { quotes: quotes.slice(0, 20), narrationText: '' };
      return { quotes, narrationText: narrationParts.join('').trim() };
    }

    // ============================================================
    // Pattern 0 — “前对话” 说话人描述 ：”后对话”
    //   e.g.  “是的。”小12点了点头，继续道：”我们必须尽快出发。”
    //   e.g.  “没错。”小32导师微微一笑，缓缓说道：”时间是最好的老师。”
    //   Leading quote + speaker description + colon + trailing quote
    //   Must come BEFORE Pattern A to avoid mis-classifying the leading quote
    // ============================================================
    const pat0 = trimmed.match(/^[“”](.+?)[“”]\s*([\s\S]+?)[：:]\s*[“”](.+?)[“”]([\s\S]*)$/);
    if (pat0) {
      const frontDialogue = pat0[1];
      const midDesc = pat0[2];       // speaker description between quotes
      const backDialogue = pat0[3];
      const afterRest = pat0[4].trim();
      const extra = findAllQuoted(afterRest);
      const allDialogue = [frontDialogue, backDialogue, ...extra.quotes];
      const ext = extractSpeaker(midDesc);
      if (ext) {
        // Action text: midDesc cleaned up (the speaker name + description)
        const actionText = midDesc.trim();
        let html = dialogueCard(ext.speaker, actionText, allDialogue);
        if (extra.narrationText) html += narrationCard(extra.narrationText);
        return html;
      }
      // Deep scan: try to find speaker in midDesc
      const deep = deepScanSpeaker(midDesc);
      if (deep) {
        return dialogueCard(deep, midDesc.trim(), allDialogue);
      }
      // No speaker found — still show as dialogue with midDesc as action
      let html2 = dialogueCard(null, midDesc.trim(), allDialogue);
      if (extra.narrationText) html2 += narrationCard(extra.narrationText);
      return html2;
    }

    // ============================================================
    // Pattern A — Speaker description + ： + “quoted dialogue”
    //   e.g.  小14则一如既往地耸了耸肩，嘴角带着一丝微笑：”虽然我喜欢...”
    //   e.g.  32继续道：”守护者必须理解...”
    //   e.g.  32点了点头：”没错，他们...”
    //   Matches: any text up to ：” (colon then left-quote)
    // ============================================================
    const patA = trimmed.match(/^([\s\S]+?)[：:]\s*[“”](.+?)[“”]([\s\S]*)$/);
    if (patA) {
      const fullPreText = patA[1].trim();   // everything before ："
      const mainDialogue = patA[2];          // the first quoted dialogue
      const afterFirst = patA[3].trim();    // anything after the closing quote

      // Check for additional quotes in the after-text
      const extra = findAllQuoted(afterFirst);
      const allDialogue = [mainDialogue, ...extra.quotes];
      // If there's extra non-quoted text after all quotes, append as narration
      const extraNarration = extra.narrationText || '';

      const ext = extractSpeaker(fullPreText);
      if (ext) {
        // Build action text: speaker name + rest of description
        const actionText = fullPreText;
        let html = dialogueCard(ext.speaker, actionText, allDialogue);
        if (extraNarration) {
          html += narrationCard(extraNarration);
        }
        return html;
      }
      // Fallback: no speaker found in pre-text — still show as dialogue
      let html2 = dialogueCard(null, fullPreText, allDialogue);
      if (extraNarration) {
        html2 += narrationCard(extraNarration);
      }
      return html2;
    }

    // ============================================================
    // Pattern B — Leading-quote prose: "dialogue" speaker ...
    //   e.g.  "呜……也许吧。" 小18懒洋洋地摇晃着尾巴，轻声说，"不过..."
    //   e.g.  "这是螺旋中心？"12疑惑地环顾四周
    //   e.g.  "好吧，新的冒险，马上开始。"  (no speaker)
    // ============================================================
    const patB = trimmed.match(/^[“"](.+?)[”"]\s*([\s\S]*)$/);
    if (patB) {
      const firstDialogue = patB[1];
      const remaining = patB[2];

      // Extract ALL quoted segments from remaining text
      const extra = findAllQuoted(remaining);
      const allDialogue = [firstDialogue, ...extra.quotes];
      // The non-quoted text is the speaker description
      const narrationText = extra.narrationText;

      // Try to extract speaker from narration
      const ext = extractSpeaker(narrationText);
      if (ext) {
        return dialogueCard(ext.speaker, narrationText, allDialogue);
      }
      // Try deep scan on narration text
      const deep = deepScanSpeaker(narrationText);
      if (deep) {
        return dialogueCard(deep, narrationText, allDialogue);
      }
      // Try deep scan on original remaining (before quote extraction)
      const deep2 = deepScanSpeaker(remaining);
      if (deep2) {
        return dialogueCard(deep2, remaining, allDialogue);
      }
      // No speaker found — if we have narration text, show it as action
      if (narrationText) {
        return dialogueCard(null, narrationText, allDialogue);
      }
      // Pure quoted line with no speaker (e.g. last line "好吧，新的冒险...")
      // Show as narration-style dialogue
      return narrationCard(allDialogue.map(d => '“' + d + '”').join('\n'));
    }

    // ============================================================
    // Pattern C — Colon format without quotes: Speaker...： dialogue
    //   e.g.  12：这是螺旋中心
    //   e.g.  18（推了推眼镜）：是的
    // ============================================================
    const patC = trimmed.match(/^([\s\S]{1,80}?)[：:]\s*([\s\S]+)$/);
    if (patC) {
      const preText = patC[1].trim();
      const content = patC[2].trim();
      const ext = extractSpeaker(preText);
      if (ext) {
        return dialogueCard(ext.speaker, preText, [content]);
      }
      // No speaker number — use as label
      return dialogueCard(preText, preText, [content]);
    }

    // ============================================================
    // Fallback — pure narration
    // ============================================================
    return narrationCard(trimmed);    return narrationCard(trimmed);
  }

  // Build the full view structure
  ct().innerHTML = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;background:#0d0620;">
      <div style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #3d2e60;background:rgba(10,6,20,0.95);flex-shrink:0;">
        <span style="color:#b388ff;font-weight:600;font-size:0.9rem;">📖 ${chapter.title}</span>
        <button id="btn-novel-back" style="padding:4px 12px;border:1px solid #3d2e60;border-radius:12px;background:rgba(16,10,30,0.9);color:#b39ddb;font-size:0.75rem;font-family:inherit;cursor:pointer;">← 返回</button>
        <span id="novel-progress" style="color:#7c6b9a;font-size:0.7rem;">0/${rawSegments.length}</span>
      </div>
      <div id="novel-content" style="flex:1;overflow-y:auto;padding:16px 20px;">
      </div>
      <div id="novel-footer" style="padding:14px;text-align:center;border-top:1px solid #3d2e60;background:rgba(10,6,20,0.95);flex-shrink:0;cursor:pointer;">
        <span style="color:#7c6b9a;font-size:0.75rem;">点击继续 ▸</span>
      </div>
    </div>`;

  const contentEl = document.getElementById('novel-content');
  const progressEl = document.getElementById('novel-progress');
  const footerEl = document.getElementById('novel-footer');

  function appendNextSegment() {
    if (idx >= rawSegments.length) {
      if (!S.completed.includes(chapter.id)) {
        S.completed.push(chapter.id);
        saveGame();
      }
      footerEl.innerHTML = '<span style="color:#69f0ae;font-size:0.8rem;">📖 阅读完毕 ✨</span>';
      footerEl.style.cursor = 'default';
      footerEl.onclick = null;
      toast('📖 阅读完毕！');
      return;
    }

    const seg = rawSegments[idx].trim();
    let html;
    try {
      html = buildSegmentHTML(seg);
    } catch(e) {
      console.warn('[TS] buildSegmentHTML error:', e, 'seg:', seg.substring(0, 80));
      // Fallback: render as plain narration on error (prevents crash/freeze)
      html = '<div class="novel-seg" style="padding:14px 0;border-bottom:1px solid rgba(61,46,96,0.25);animation:fadeIn 0.35s ease;"><div style="font-size:0.9rem;color:#c5bfd6;line-height:1.9;text-indent:2em;">' + seg.replace(/\n/g, '<br>') + '</div></div>';
    }
    contentEl.insertAdjacentHTML('beforeend', html);
    idx++;
    progressEl.textContent = `${idx}/${rawSegments.length}`;

    // Auto-scroll to bottom so new content is visible
    setTimeout(() => {
      contentEl.scrollTop = contentEl.scrollHeight;
    }, 60);
  }

  // Click footer or content area to advance
  footerEl.addEventListener('click', appendNextSegment);
  contentEl.addEventListener('click', appendNextSegment);

  // Back button
  document.getElementById('btn-novel-back')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showChapterSelect();
  });

  // Load first segment immediately
  appendNextSegment();
}

// --- Game ---
function startChapterGame(chapter) {
  S.room = chapter.room;
  S.goal = chapter.goal;
  S.goalNPCs = chapter.goalNPCs || [];
  S.chapterNPCsTalked = {};
  renderRoom();
}

function renderRoom() {
  const rooms = getRoom();
  const room = rooms[S.room];
  if (!room) return;
  ct().innerHTML = '';

  const bg = room.bg;
  const bgStyle = bg.startsWith('#') || bg.startsWith('linear') || bg.startsWith('radial')
    ? `background:${bg};` : `background-image:url('${bg}');background-size:cover;background-position:center;`;
  ct().style.cssText = `width:100%;height:100%;position:relative;overflow:hidden;${bgStyle}`;

  // Chapter objective
  const ch = [...CHAPTERS, ...EXTRAS].find(c => c.id === S.chapter);
  if (ch) {
    const objBar = document.createElement('div');
    objBar.style.cssText = 'position:absolute;top:50px;left:50%;transform:translateX(-50%);z-index:90;padding:6px 16px;background:rgba(10,6,20,0.9);border:1px solid #ffd54f;border-radius:16px;color:#ffd54f;font-size:0.75rem;pointer-events:none;text-align:center;max-width:85%;';
    objBar.textContent = `🎯 ${ch.obj}`;
    ct().appendChild(objBar);
  }

  updateHUD(room.name);

  // Hotspots
  room.spots.forEach(spot => {
    if (spot.locked && !S.flags.shadow_unlock) { /* show locked */ }
    const div = document.createElement('div');
    const isNPC = spot.t === 'npc';
    const markerSize = isNPC ? '48px' : '38px';
    div.style.cssText = `position:absolute;left:${spot.x}%;top:${spot.y}%;transform:translate(-50%,-50%);cursor:pointer;z-index:10;`;
    div.innerHTML = `
      <div class="hs-marker" style="width:${markerSize};height:${markerSize};border-radius:50%;border:2px solid ${spot.locked&&!S.flags.shadow_unlock?'rgba(124,107,154,0.4)':'rgba(179,136,255,0.5)'};background:rgba(45,31,74,0.7);display:flex;align-items:center;justify-content:center;font-size:1.1rem;transition:all 0.2s;${isNPC?'overflow:hidden;':''}${spot.t==='battle'?'border-color:rgba(255,82,82,0.6);box-shadow:0 0 10px rgba(255,0,0,0.15);':''}">
        ${isNPC && spot.img ? `<img src="images/${spot.img}" alt="${spot.label}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent='🐱'">` : (spot.icon||'📍')}
      </div>
      ${spot.label ? `<div style="position:absolute;top:${parseInt(markerSize)+4}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:0.6rem;color:#b39ddb;background:rgba(10,6,20,0.8);padding:2px 6px;border-radius:4px;pointer-events:none;">${spot.locked&&!S.flags.shadow_unlock?'🔒 '+spot.label:spot.label}</div>` : ''}`;

    div.addEventListener('mouseenter', () => {
      const m = div.querySelector('.hs-marker');
      if (m) { m.style.borderColor = '#ffd54f'; m.style.boxShadow = '0 0 12px rgba(255,213,79,0.3)'; m.style.transform = 'scale(1.12)'; }
    });
    div.addEventListener('mouseleave', () => {
      const m = div.querySelector('.hs-marker');
      if (m) { m.style.borderColor = spot.t==='battle'?'rgba(255,82,82,0.6)':'rgba(179,136,255,0.5)'; m.style.boxShadow = ''; m.style.transform = ''; }
    });
    div.addEventListener('click', () => handleSpot(spot));
    ct().appendChild(div);
  });

  // Room entry text
  if (!S.visited[room.id] && room.entry) {
    S.visited[room.id] = true;
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;top:20%;left:50%;transform:translateX(-50%);font-size:1rem;color:#b39ddb;text-align:center;z-index:5;pointer-events:none;animation:entryFade 2.5s ease forwards;max-width:80%;text-shadow:0 0 20px rgba(0,0,0,0.8);';
    el.textContent = room.entry;
    ct().appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}

// ========== HUD ==========
function updateHUD(roomName) {
  let h = $('.hud');
  if (!h) {
    h = document.createElement('div');
    h.className = 'hud';
    h.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:100;padding:10px 14px;background:linear-gradient(180deg,rgba(10,6,20,0.95),transparent);display:flex;align-items:center;gap:12px;';
    ct().appendChild(h);
  }
  const pct = Math.round((S.energy / S.maxEnergy) * 100);
  h.innerHTML = `
    <span style="font-size:0.85rem;font-weight:600;color:#b388ff;flex:1;">${roomName}</span>
    <span style="display:flex;align-items:center;gap:4px;font-size:0.75rem;color:#ffd54f;">
      ⚡<span style="width:60px;height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;display:inline-block;"><span style="display:block;height:100%;background:linear-gradient(90deg,#7c4dff,#ffd54f);border-radius:3px;width:${pct}%;transition:width 0.3s;"></span></span>${S.energy}
    </span>
    <button id="btn-inv" style="width:30px;height:30px;border-radius:50%;border:1px solid #3d2e60;background:rgba(16,10,30,0.8);color:#b39ddb;font-size:0.9rem;cursor:pointer;">🎒</button>
    <button id="btn-time" style="width:30px;height:30px;border-radius:50%;border:1px solid #3d2e60;background:rgba(16,10,30,0.8);color:#b39ddb;font-size:0.9rem;cursor:pointer;">⚡</button>
    <button id="btn-map" style="width:30px;height:30px;border-radius:50%;border:1px solid #3d2e60;background:rgba(16,10,30,0.8);color:#b39ddb;font-size:0.9rem;cursor:pointer;">🗺️</button>
    <button id="btn-chapters" style="width:30px;height:30px;border-radius:50%;border:1px solid #3d2e60;background:rgba(16,10,30,0.8);color:#b39ddb;font-size:0.9rem;cursor:pointer;">📖</button>`;
  document.getElementById('btn-inv')?.addEventListener('click', toggleInventory);
  document.getElementById('btn-map')?.addEventListener('click', showMap);
  document.getElementById('btn-time')?.addEventListener('click', useTimePower);
  document.getElementById('btn-chapters')?.addEventListener('click', () => { saveGame(); showChapterSelect(); });
}

// ========== HANDLERS ==========
let showingDialog = false;
function handleSpot(spot) {
  if (showingDialog) return;
  if (spot.locked && !S.flags.shadow_unlock) { showDialog('旁白', spot.lockMsg || '这里暂时无法通行...'); return; }
  if (spot.t === 'exit') { S.room = spot.to; renderRoom(); saveGame(); return; }
  if (spot.t === 'npc') {
    // Track NPC talk for chapter goals
    if (S.goal === 'talk_all_npcs' && S.goalNPCs.includes(spot.id)) {
      S.chapterNPCsTalked[spot.id] = true;
      if (S.goalNPCs.every(id => S.chapterNPCsTalked[id])) {
        setTimeout(() => completeChapter(), 1000);
      }
    }
    let i = 0;
    const next = () => { if (i >= spot.talk.length) return; const [sp,tx] = spot.talk[i]; i++; showDialog(sp, tx, i < spot.talk.length ? next : null, spot.img); };
    next(); return;
  }
  if (spot.t === 'item') {
    if (S.flags['p_'+spot.iid]) { showDialog('旁白', '这里已经没有东西了。'); return; }
    S.inv.push(spot.iid); S.flags['p_'+spot.iid] = true;
    showDialog('旁白', `获得了「${ITEMS[spot.iid]?.name||spot.iid}」！${ITEMS[spot.iid]?.desc||''}`);
    saveGame(); return;
  }
  if (spot.t === 'puzzle') { startPuzzle(spot); return; }
  if (spot.t === 'battle') { startBattle(spot); return; }
  if (spot.t === 'heal') { S.energy = Math.min(S.maxEnergy, S.energy + (spot.amt||30)); updateHUD(getRoom()[S.room].name); if (spot.txt) showDialog('旁白', spot.txt); return; }
  if (spot.t === 'info') { showDialog('旁白', spot.txt); return; }
}

// ========== DIALOG ==========
function showDialog(speaker, text, onDone, img) {
  $('.dlg-wrap')?.remove(); showingDialog = true;
  const wrap = document.createElement('div');
  wrap.className = 'dlg-wrap';
  wrap.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:200;max-width:500px;width:90%;';

  const portraitHTML = img ? `
    <div style="flex-shrink:0;width:90px;height:90px;border-radius:50%;overflow:hidden;border:2px solid #b388ff;box-shadow:0 0 16px rgba(179,136,255,0.35);margin-right:14px;align-self:center;">
      <img src="images/${img}" alt="${speaker}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
    </div>` : '';

  wrap.innerHTML = `<div style="background:rgba(16,10,30,0.96);border:1px solid #3d2e60;border-radius:14px;padding:16px 18px;backdrop-filter:blur(12px);animation:slideUp 0.25s ease;display:flex;align-items:flex-start;gap:0;">
    ${portraitHTML}
    <div style="flex:1;min-width:0;">
      <div style="font-size:0.8rem;color:${speaker==='旁白'?'#7c6b9a':'#ffd54f'};margin-bottom:6px;${speaker==='旁白'?'font-style:italic':''}">${speaker}</div>
      <div style="font-size:0.95rem;line-height:1.65;color:#ede7f6;">${text}</div>
    </div>
  </div>
  <div style="text-align:right;font-size:0.65rem;color:#7c6b9a;margin-top:4px;padding-right:8px;">点击${onDone?'继续':'关闭'} ▸</div>`;
  wrap.addEventListener('click', () => { wrap.remove(); showingDialog = false; if (onDone) setTimeout(onDone, 50); });
  ct().appendChild(wrap);
}

// ========== PUZZLE ==========
function startPuzzle(spot) {
  if (S.flags[spot.pflag]) { showDialog('旁白', '这个谜题已经解开了。'); return; }
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;z-index:250;background:rgba(5,3,12,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;';
  if (spot.ptype === 'memory') {
    const symbols = ['⏳','🌀','💎','✨','🌙','⚡','🕐','🌟']; const pairs = 4;
    const tiles = [...symbols.slice(0,pairs), ...symbols.slice(0,pairs)].sort(() => Math.random()-0.5);
    let sel = null, matched = 0, locked = false;
    overlay.innerHTML = `<div style="font-size:1.3rem;color:#ffd54f;margin-bottom:16px;">🧩 时间记忆</div><div style="font-size:0.9rem;color:#b39ddb;margin-bottom:20px;">找出相同的符文配对</div><div id="puz-grid" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:300px;margin-bottom:16px;"></div>`;
    ct().appendChild(overlay);
    const grid = overlay.querySelector('#puz-grid');
    tiles.forEach((sym, i) => {
      const tile = document.createElement('div');
      tile.style.cssText = 'width:60px;height:60px;border:2px solid #3d2e60;border-radius:8px;background:rgba(16,10,30,0.9);display:flex;align-items:center;justify-content:center;font-size:1.8rem;cursor:pointer;';
      tile.textContent = '?';
      tile.addEventListener('click', () => {
        if (locked || tile.classList.contains('done')) return;
        tile.textContent = sym; tile.style.borderColor = '#ffd54f';
        if (!sel) { sel = tile; } else if (sel !== tile) {
          locked = true;
          if (sel.textContent === tile.textContent) {
            tile.classList.add('done'); sel.classList.add('done');
            tile.style.borderColor = '#69f0ae'; sel.style.borderColor = '#69f0ae';
            tile.style.opacity = '0.5'; sel.style.opacity = '0.5';
            matched++; sel = null; locked = false;
            if (matched >= pairs) { setTimeout(() => { overlay.remove(); puzzleDone(spot); }, 500); }
          } else {
            setTimeout(() => { tile.textContent = '?'; sel.textContent = '?'; tile.style.borderColor = '#3d2e60'; sel.style.borderColor = '#3d2e60'; sel = null; locked = false; }, 600);
          }
        }
      });
      grid.appendChild(tile);
    });
  } else if (spot.ptype === 'sequence') {
    const seq = ['🌙','✨','🌞','🌀','💫']; let idx = 0;
    const shuffled = [...seq].sort(() => Math.random()-0.5);
    overlay.innerHTML = `<div style="font-size:1.3rem;color:#ffd54f;margin-bottom:16px;">🕐 时间序列</div><div style="font-size:0.9rem;color:#b39ddb;margin-bottom:20px;">按正确顺序点击：月→星→日→旋→光</div><div id="puz-grid" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:300px;"></div>`;
    ct().appendChild(overlay);
    const grid = overlay.querySelector('#puz-grid');
    shuffled.forEach(sym => {
      const tile = document.createElement('div');
      tile.style.cssText = 'width:60px;height:60px;border:2px solid #3d2e60;border-radius:8px;background:rgba(16,10,30,0.9);display:flex;align-items:center;justify-content:center;font-size:1.8rem;cursor:pointer;';
      tile.textContent = sym;
      tile.addEventListener('click', () => {
        if (sym === seq[idx]) { tile.style.borderColor = '#69f0ae'; tile.style.opacity = '0.5'; idx++; if (idx >= seq.length) { setTimeout(() => { overlay.remove(); puzzleDone(spot); }, 400); } }
        else { tile.style.borderColor = '#ff5252'; idx = 0; grid.querySelectorAll('div').forEach(t => { t.style.borderColor = '#3d2e60'; t.style.opacity = '1'; }); setTimeout(() => tile.style.borderColor = '#3d2e60', 300); }
      });
      grid.appendChild(tile);
    });
  }
}

function puzzleDone(spot) {
  S.flags[spot.pflag] = true;
  if (spot.preward) S.inv.push(spot.preward);
  renderRoom(); saveGame();
  showDialog('旁白', spot.pmsg || '谜题解开了！');
  // Check chapter goal
  checkGoal(spot.pflag);
}

// ========== BATTLE ==========
function startBattle(spot) {
  if (S.flags[spot.wflag]) { showDialog('旁白', '敌人已经被击败了。'); return; }
  const en = spot.enemy; let ehp = en.hp; const mhp = en.hp;
  ct().innerHTML = '';
  const ov = document.createElement('div');
  ov.style.cssText = 'position:absolute;inset:0;z-index:250;background:radial-gradient(ellipse at center,#1e0a20,#05020a);display:flex;flex-direction:column;align-items:center;justify-content:center;';
  ov.innerHTML = `
    <div id="en-sprite" style="width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(180,0,0,0.4),transparent);display:flex;align-items:center;justify-content:center;font-size:4rem;margin-bottom:16px;cursor:pointer;animation:battleFloat 2s ease-in-out infinite;">${en.sprite}</div>
    <div style="width:180px;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;margin-bottom:12px;"><div id="ehp-bar" style="height:100%;background:#ff5252;border-radius:4px;width:100%;transition:width 0.3s;"></div></div>
    <div id="bmsg" style="font-size:0.85rem;color:#b39ddb;margin-bottom:20px;">${en.name} 出现了！点击它来攻击！</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:300px;">
      <button data-dmg="20" style="padding:8px 14px;border:1px solid #3d2e60;border-radius:8px;background:rgba(35,24,56,0.9);color:#ede7f6;font-size:0.8rem;font-family:inherit;cursor:pointer;">⚔️ 攻击 (20)</button>
      <button data-dmg="40" data-cost="15" style="padding:8px 14px;border:1px solid #3d2e60;border-radius:8px;background:rgba(35,24,56,0.9);color:#ede7f6;font-size:0.8rem;font-family:inherit;cursor:pointer;">✨ 时间直觉 (15⚡)</button>
      <button data-dmg="55" data-cost="30" style="padding:8px 14px;border:1px solid #3d2e60;border-radius:8px;background:rgba(35,24,56,0.9);color:#ede7f6;font-size:0.8rem;font-family:inherit;cursor:pointer;">💫 螺旋共鸣 (30⚡)</button>
    </div>`;
  ct().appendChild(ov);

  const attack = (dmg, cost) => {
    if (cost && S.energy < cost) { toast('⚡ 能量不足！'); return; }
    if (cost) S.energy -= cost;
    ehp -= dmg + Math.floor(Math.random() * 10);
    if (ehp <= 0) { ehp = 0;
      document.getElementById('ehp-bar').style.width = '0%';
      document.getElementById('bmsg').textContent = `✨ 胜利！${en.name} 被击败了！`;
      S.flags[spot.wflag] = true; saveGame();
      setTimeout(() => { ct().innerHTML = ''; renderRoom(); toast('⚔️ 战斗胜利！'); checkGoal(spot.wflag); }, 1500);
    } else {
      document.getElementById('ehp-bar').style.width = `${(ehp/mhp)*100}%`;
      document.getElementById('bmsg').textContent = `造成了 ${dmg} 点伤害！${en.name} 反击！`;
    }
  };
  document.getElementById('en-sprite')?.addEventListener('click', () => attack(8, 0));
  ov.querySelectorAll('button').forEach(btn => { btn.addEventListener('click', () => attack(parseInt(btn.dataset.dmg), parseInt(btn.dataset.cost)||0)); });
}

// ========== CHAPTER COMPLETION ==========
function checkGoal(flag) {
  const ch = [...CHAPTERS, ...EXTRAS].find(c => c.id === S.chapter);
  if (!ch) return;
  // ch6 special: need all 3 shadow commanders beaten
  if (ch.goal === 'beat_all_shadows') {
    if (S.flags.beat_vanguard && S.flags.beat_commander && S.flags.beat_general) {
      completeChapter();
    }
    return;
  }
  if (flag === ch.goal || (ch.goal === 'talk_all_npcs' && S.goalNPCs.every(id => S.chapterNPCsTalked[id]))) {
    completeChapter();
  }
}

function completeChapter() {
  if (!S.completed.includes(S.chapter)) {
    S.completed.push(S.chapter);
    // Unlock next chapter
    const allChs = [...CHAPTERS, ...EXTRAS];
    const idx = allChs.findIndex(c => c.id === S.chapter);
    if (idx >= 0 && idx + 1 < allChs.length) {
      S.unlocked.push(allChs[idx + 1].id);
    }
    saveGame();
  }
  // Show victory
  const ch = [...CHAPTERS, ...EXTRAS].find(c => c.id === S.chapter);
  ct().innerHTML = '';
  const ov = document.createElement('div');
  ov.style.cssText = 'position:absolute;inset:0;z-index:250;background:rgba(5,3,12,0.95);display:flex;flex-direction:column;align-items:center;justify-content:center;';
  ov.innerHTML = `
    <div style="font-size:4rem;margin-bottom:12px;">✨</div>
    <div style="font-size:1.5rem;color:#ffd54f;font-weight:700;margin-bottom:8px;">${ch?.title} — 完成！</div>
    <div style="font-size:0.9rem;color:#b39ddb;margin-bottom:24px;text-align:center;max-width:280px;">${ch?.obj}</div>
    <button id="btn-next" style="width:200px;padding:12px 0;border:none;border-radius:24px;background:linear-gradient(135deg,#7c4dff,#b388ff);color:white;font-size:1rem;font-family:inherit;cursor:pointer;">📖 继续冒险</button>`;
  ct().appendChild(ov);
  document.getElementById('btn-next')?.addEventListener('click', () => showChapterSelect());
}

// ========== INVENTORY ==========
function toggleInventory() {
  if ($('.inv-panel')) { $('.inv-panel').remove(); $('.inv-backdrop')?.remove(); return; }
  const bd = document.createElement('div');
  bd.className = 'inv-backdrop';
  bd.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:199;';
  bd.addEventListener('click', () => { bd.remove(); $('.inv-panel')?.remove(); });
  ct().appendChild(bd);
  const panel = document.createElement('div');
  panel.className = 'inv-panel';
  panel.style.cssText = 'position:absolute;top:0;right:0;width:240px;height:100%;background:rgba(16,10,30,0.97);border-left:1px solid #3d2e60;z-index:200;overflow-y:auto;';
  const itemsHtml = S.inv.length > 0 ? S.inv.map(id => {
    const it = ITEMS[id]; if (!it) return '';
    return `<div style="padding:10px;border-bottom:1px solid #3d2e60;cursor:pointer;display:flex;align-items:center;gap:10px;" class="inv-item" data-id="${id}">
      <span style="font-size:1.5rem;">${it.icon}</span><div style="flex:1;"><div style="font-size:0.85rem;color:#ede7f6;">${it.name}</div><div style="font-size:0.7rem;color:#7c6b9a;">${it.desc}</div></div>
      ${it.usable ? '<span style="color:#ffd54f;font-size:0.75rem;">使用→</span>' : ''}</div>`;
  }).join('') : '<div style="padding:20px;color:#7c6b9a;text-align:center;">背包是空的</div>';
  panel.innerHTML = `<div style="padding:14px;border-bottom:1px solid #3d2e60;"><span style="color:#b388ff;font-weight:600;">🎒 背包 (${S.inv.length})</span></div>${itemsHtml}`;
  panel.querySelectorAll('.inv-item').forEach(el => { el.addEventListener('click', () => {
    const id = el.dataset.id; if (!ITEMS[id]?.usable) return;
    const rooms = getRoom(); const room = rooms[S.room];
    if (room?.items?.[id]) { const act = room.items[id]; if (act.flag) S.flags[act.flag] = true; showDialog('旁白', act.txt); bd.remove(); panel.remove(); renderRoom(); saveGame(); checkGoal(act.flag); }
    else { toast('这里用不上这个物品'); }
  }); });
  ct().appendChild(panel);
}

// ========== TIME POWER ==========
function useTimePower() {
  if (S.energy < 20) { toast('⚡ 时间能量不足 (需要20)'); return; }
  S.energy -= 20;
  updateHUD(getRoom()[S.room].name);
  const rooms = getRoom(); const room = rooms[S.room];
  if (room.hints) { room.hints.forEach(h => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${h.x}%;top:${h.y}%;transform:translate(-50%,-50%);color:#ffd54f;font-size:0.7rem;background:rgba(10,6,20,0.9);padding:4px 10px;border-radius:12px;z-index:20;pointer-events:none;`;
    el.textContent = h.txt; ct().appendChild(el); setTimeout(() => el.remove(), 2500);
  }); }
  toast('⏳ 时间感知触发...');
}

// ========== WORLD MAP ==========
function showMap() {
  // Remove existing map overlay if any
  $('.map-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'map-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:300;background:rgba(5,3,12,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;';

  // Build room markers
  let markersHTML = '';
  Object.entries(ROOM_POS).forEach(([roomId, pos]) => {
    const isCurrent = S.room === roomId;
    const visited = S.visited[roomId];
    const dotColor = isCurrent ? '#ffd54f' : (visited ? '#69f0ae' : '#7c6b9a');
    const dotSize = isCurrent ? '14px' : '9px';
    markersHTML += `
      <div style="position:absolute;left:${pos.x}%;top:${pos.y}%;transform:translate(-50%,-50%);pointer-events:none;z-index:2;">
        <div style="width:${dotSize};height:${dotSize};border-radius:50%;background:${dotColor};box-shadow:0 0 ${isCurrent?'12px':'6px'} ${dotColor};${isCurrent?'animation:mapPulse 1.5s ease-in-out infinite;':''}"></div>
        <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:0.65rem;color:${isCurrent?'#ffd54f':'#b39ddb'};background:rgba(10,6,20,0.85);padding:2px 6px;border-radius:8px;">${pos.label}</div>
      </div>`;
  });

  overlay.innerHTML = `
    <div style="position:relative;width:90vw;max-width:500px;max-height:75vh;">
      <div style="text-align:center;margin-bottom:10px;">
        <span style="color:#b388ff;font-size:1.1rem;">🗺️ 时间螺旋世界</span>
        <span style="color:#7c6b9a;font-size:0.7rem;margin-left:8px;">当前：${ROOM_POS[S.room]?.label||'未知'}</span>
      </div>
      <div style="position:relative;border:2px solid #3d2e60;border-radius:12px;overflow:hidden;box-shadow:0 0 30px rgba(124,77,255,0.15);">
        <img src="images/地图.webp" alt="世界地图" style="width:100%;height:auto;display:block;" onerror="this.alt='地图加载失败'">
        ${markersHTML}
      </div>
      <p style="text-align:center;color:#7c6b9a;font-size:0.65rem;margin-top:8px;">
        🟡 当前位置 &nbsp; 🟢 已探索 &nbsp; ⚫ 未到达
      </p>
    </div>
    <button id="btn-close-map" style="margin-top:16px;padding:8px 28px;border:1px solid #3d2e60;border-radius:20px;background:rgba(16,10,30,0.9);color:#b39ddb;font-size:0.9rem;font-family:inherit;cursor:pointer;">✕ 关闭地图</button>`;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.id === 'btn-close-map') {
      overlay.remove();
    }
  });
  ct().appendChild(overlay);
}

// ========== SAVE / LOAD ==========
function saveGame() {
  localStorage.setItem('timespiral_save', JSON.stringify({
    chapter:S.chapter, room:S.room, energy:S.energy, inv:S.inv,
    flags:S.flags, visited:S.visited, unlocked:S.unlocked, completed:S.completed
  }));
}
function loadGame() {
  const raw = localStorage.getItem('timespiral_save');
  if (raw) {
    const d = JSON.parse(raw);
    S.chapter = d.chapter || 'prologue'; S.room = d.room || 'spiral_nexus';
    S.energy = d.energy ?? 100; S.inv = d.inv || [];
    S.flags = d.flags || {}; S.visited = d.visited || {};
    S.unlocked = d.unlocked || ['prologue']; S.completed = d.completed || [];
    repairSave(); // fix corrupted saves from old buggy code
    return true;
  }
  return false;
}

function repairSave() {
  const allChs = [...CHAPTERS, ...EXTRAS];
  let changed = false;
  S.completed.forEach(chId => {
    const idx = allChs.findIndex(c => c.id === chId);
    if (idx >= 0 && idx + 1 < allChs.length) {
      const nextId = allChs[idx + 1].id;
      if (!S.unlocked.includes(nextId)) {
        S.unlocked.push(nextId);
        changed = true;
      }
    }
  });
  if (changed) saveGame();
}
function resetState() {
  S.chapter = 'prologue'; S.room = 'spiral_nexus'; S.energy = 100;
  S.inv = []; S.flags = {}; S.visited = {}; S.chapterNPCsTalked = {};
  S.unlocked = ['prologue']; S.completed = []; S.goal = ''; S.goalNPCs = [];
}

// ========== TOAST ==========
function toast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:absolute;top:80px;left:50%;transform:translateX(-50%);z-index:300;padding:8px 20px;background:rgba(10,6,20,0.9);border:1px solid #ffd54f;border-radius:20px;color:#ffd54f;font-size:0.8rem;animation:fadeIn 0.3s ease;pointer-events:none;';
  t.textContent = msg; ct().appendChild(t); setTimeout(() => t.remove(), 2000);
}

// ========== BOOT ==========
console.log('[TS] Booting TimeSpiral...');
// Preload story data so chapter clicks respond instantly
let STORY_DATA = {};
fetch('js/data/stories.json')
  .then(r => r.json())
  .then(d => { STORY_DATA = d; console.log('[TS] Stories preloaded:', Object.keys(d).length, 'chapters'); })
  .catch(e => console.warn('[TS] Story preload failed:', e));
document.addEventListener('DOMContentLoaded', showTitle);
// Debug: expose to Console
window.__TS = { get S() { return S; }, saveGame, showChapterSelect, resetState };
