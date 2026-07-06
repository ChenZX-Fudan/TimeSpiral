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

// ========== MAP POSITIONS (百分比, 对应 地图.png 上的房间位置) ==========
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
  { id:'ch4',      title:'第四章：决裂时刻',    obj:'穿越时间裂缝，寻找14号的下落', room:'fracture_zone', goal:'find_14' },
  { id:'ch5',      title:'第五章：拯救之旅',    obj:'前往时间通道，收集足够的能量以备最终决战', room:'time_pathways', goal:'collect_energy' },
  { id:'ch6',      title:'第六章：暗影侵袭',    obj:'回到裂缝区域，击败所有暗影生物', room:'fracture_zone', goal:'beat_all_shadows' },
  { id:'ch7',      title:'第七章：守护者的牺牲', obj:'在暗影之地面对最终挑战，领悟36的牺牲', room:'shadow_realm', goal:'honor_36' },
  { id:'ch8',      title:'第八章：时间的重生',  obj:'封印暗影核心，完成时间螺旋的修复', room:'shadow_realm', goal:'sealed_core' },
];
const EXTRAS = [
  { id:'extra1', title:'番外1：时空旅行插曲', obj:'回到螺旋中心，体验平行时空的趣事', room:'spiral_nexus', goal:'explore_extra' },
];

// ========== ITEMS ==========
const ITEMS = {
  'time_crystal':   { id:'time_crystal',   name:'时间水晶', icon:'💎', desc:'蕴含时间能量的水晶碎片', usable:true },
  'crystal_key':    { id:'crystal_key',    name:'水晶钥匙', icon:'🔑', desc:'用水晶凝聚而成的钥匙', usable:true },
  'shadow_essence': { id:'shadow_essence', name:'暗影精华', icon:'🖤', desc:'击败暗影后获得的黑暗精华', usable:true },
  'healing_herb':   { id:'healing_herb',   name:'时间草',   icon:'🌿', desc:'神奇草药，恢复30点时间能量', usable:true },
  'ancient_scroll': { id:'ancient_scroll', name:'古老卷轴', icon:'📜', desc:'记载着对抗暗影方法的古文献', usable:false },
  'star_glove':     { id:'star_glove',     name:'星星手套', icon:'🧤', desc:'5号守护者的遗物', usable:false },
};

// ========== CHAPTER-SPECIFIC NPC DIALOGUES ==========
function getChapterTalks(chapterId) {
  const talks = {
    'ch1': {
      // --- 螺旋中心 ---
      'n36': [
        ['36','12号，你感知到了吗？裂缝区域的异常波动越来越强烈。时间在颤抖。'],
        ['36','我们的探测器确认了——暗影生物在裂缝区域出没。这是时间禁锢者卷土重来的第一个信号。'],
        ['36','去裂缝区域调查。如果发现暗影生物，消灭它。这是你作为守护者的第一个任务。'],
      ],
      'n5': [
        ['5','暗影斥候——它们是时间禁锢者的侦察兵。速度快，攻击不致命，但绝不能让它们把情报带回去。'],
        ['5','战斗中合理使用时间能量。记住，能量节点和时间之泉可以补充能量。'],
        ['5','我分析过裂缝区域的能量分布：暗影斥候通常潜伏在东北方向，靠近大裂缝的位置。'],
      ],
      'n18': [
        ['18','暗影斥候？听起来好吓人！不过你可是12号啊，我相信你！'],
        ['18','等等，我有一个天才主意：暗影怕光对吧？裂缝区域…好像…没有光。嗯，当我没说。'],
        ['18','总之快去快回！我在这里给你加油！✊'],
      ],
      'n0': [
        ['Zero','裂缝……那是时间之战留下的伤疤。即使封印了时间之心，暗影依然在裂缝中滋生。'],
        ['Zero','12号，你即将面对的是暗影斥候——并不强大，但它是更大的威胁的前兆。'],
        ['Zero','记住：恐惧是暗影最好的武器。保持内心的光芒，你就不会输。'],
      ],
      // --- 裂缝区域 ---
      'n21': [
        ['21','12号！你来了！我已经在这里巡逻了好一阵——暗影能量读数一直在飙升。'],
        ['21','看到东北方向了吗？那就是暗影斥候。我在远处标记了它的位置，就等你来动手。'],
        ['21','小心那些时间裂缝——靠近它们会让你的能量不稳定。打完就回来，别久留。'],
      ],
    },
  };
  return talks[chapterId] || {};
}

// ========== ROOMS (same structure, conditional on chapter) ==========
function getRoom(chapterId) {
  const base = {
    'spiral_nexus': {
      id:'spiral_nexus', name:'🌀 时间螺旋中心',
      bg:'radial-gradient(ellipse at 50% 40%, #2d1560 0%, #1a1040 40%, #0a0614 100%)',
      entry:'时间螺旋的光芒在头顶缓缓流动。守护者们的基地。',
      spots:[
        { id:'n0', t:'npc', x:22, y:26, icon:'✨', label:'Zero·初代守护者', img:'0.png',
          talk:[
            ['Zero','我是Zero，时间之源创造的第一位守护者。很久以前，我和同伴们建立了这个时间螺旋。'],
            ['Zero','我创立了「时间共鸣」——当守护者们并肩作战时，彼此的力量与速度都会同步提升。这是我们的信念。'],
            ['Zero','但暗影从未消失。自称「时间禁锢者」的存在，试图将时间法则囚禁于自己的掌控之中。我们曾将它驱逐，却付出了巨大代价。'],
            ['Zero','如今它卷土重来了。12号，新的守护者们需要你的勇气。记住：每一个选择都影响着时间的流向。'],
          ]},
        { id:'n36', t:'npc', x:48, y:30, icon:'🐱', label:'36·领袖', img:'36.png',
          talk:[['36','时间螺旋的平衡正在被打破。新的威胁已经出现。'], ['36','去和其他守护者交谈，了解当前的情况。']] },
        { id:'n5', t:'npc', x:30, y:60, icon:'🐱', label:'5·战术官', img:'5.png',
          talk:[['5','12！裂缝区域出现了异常波动。我们需要立刻行动。'], ['5','先去神殿找到时间水晶——那是我们对抗暗影的关键。']] },
        { id:'n18', t:'npc', x:70, y:55, icon:'🐱', label:'18·搞笑担当', img:'18.png',
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
        { id:'n9', t:'npc', x:70, y:50, icon:'🐱', label:'9·分析师', img:'9.png',
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
        { id:'n21', t:'npc', x:80, y:55, icon:'🐱', label:'21·探险家', img:'21.png', talk:[['21','小心！这里的暗影比之前遇到的更强大。']] },
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
        { id:'n11', t:'npc', x:60, y:30, icon:'🐱', label:'11·节奏者', img:'11.png', talk:[['11','通道里的时间草可以恢复能量！']] },
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
        <img src="images/封面1.jpg" alt="封面" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;background:#2d1f5a;>⏳</div>'">
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
  const allChapters = [...CHAPTERS, ...EXTRAS];

  let html = `<div style="width:100%;height:100%;overflow-y:auto;background:linear-gradient(180deg,#0d0620,#1a1040 30%,#2d1560 100%);padding:40px 20px;">`;
  html += `<h2 style="text-align:center;color:#b388ff;margin-bottom:4px;font-size:1.4rem;">📖 选择章节</h2>`;
  html += `<p style="text-align:center;color:#7c6b9a;font-size:0.75rem;margin-bottom:24px;">完成当前章节后解锁下一章</p>`;

  allChapters.forEach((ch, i) => {
    const unlocked = S.unlocked.includes(ch.id);
    const completed = S.completed.includes(ch.id);
    const isExtra = EXTRAS.some(e => e.id === ch.id);

    // Extras only unlock after all 8 main chapters done
    const extraLocked = isExtra && !mainDone;
    const actuallyUnlocked = unlocked && !extraLocked;

    let cardStyle = 'background:rgba(35,24,56,0.8);border:1px solid #3d2e60;';
    if (completed) cardStyle += 'border-color:#69f0ae;opacity:0.85;';
    if (!actuallyUnlocked) cardStyle += 'opacity:0.4;';
    if (S.chapter === ch.id && !completed) cardStyle += 'border-color:#ffd54f;box-shadow:0 0 16px rgba(255,213,79,0.25);';

    const statusIcon = completed ? '✅' : (actuallyUnlocked ? '▶️' : '🔒');
    const statusText = completed ? '已完成' : (extraLocked ? '完成主线解锁' : (actuallyUnlocked ? '点击开始' : '未解锁'));

    html += `<div class="ch-card" data-ch="${ch.id}" style="${cardStyle}padding:14px;border-radius:10px;margin-bottom:10px;cursor:${actuallyUnlocked?'pointer':'default'};display:flex;align-items:center;gap:10px;transition:all 0.2s;">
      <span style="font-size:1.6rem;flex-shrink:0;">${statusIcon}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.95rem;color:#ede7f6;font-weight:${ch.id===S.chapter?'600':'400'};">${ch.title}</div>
        <div style="font-size:0.7rem;color:#7c6b9a;margin-top:2px;">${ch.obj}</div>
      </div>
      <span style="font-size:0.7rem;color:${completed?'#69f0ae':'#b39ddb'};flex-shrink:0;">${statusText}</span>
    </div>`;
  });

  // Reset button
  html += `<div style="text-align:center;margin-top:20px;">
    <button id="btn-reset" style="padding:8px 20px;border:1px solid #3d2e60;border-radius:16px;background:transparent;color:#7c6b9a;font-size:0.8rem;font-family:inherit;cursor:pointer;">🔄 重置进度</button>
  </div>`;

  html += `</div>`;
  ct().innerHTML = html;

  // Event delegation: single listener on the container
  ct().addEventListener('click', function chCardClick(e) {
    const card = e.target.closest('.ch-card');
    if (!card) return;
    const chId = card.dataset.ch;
    if (!chId) return;
    console.log('[TS] Card clicked:', chId, 'unlocked:', S.unlocked.includes(chId));
    const ch = allChapters.find(c => c.id === chId);
    if (!ch) return;
    const isExtra = EXTRAS.some(ex => ex.id === chId);
    if (!S.unlocked.includes(chId)) { console.warn('[TS] Locked:', chId); return; }
    if (isExtra && !mainDone) { toast('完成所有8章主线后解锁番外'); return; }
    S.chapter = chId;
    S.room = ch.room;
    // Show story reader - use preloaded data or fall through to game
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

    // Async load story if not preloaded yet (non-blocking)
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
    const next = () => { if (i >= spot.talk.length) return; const [sp,tx] = spot.talk[i]; i++; showDialog(sp, tx, i < spot.talk.length ? next : null); };
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
function showDialog(speaker, text, onDone) {
  $('.dlg-wrap')?.remove(); showingDialog = true;
  const wrap = document.createElement('div');
  wrap.className = 'dlg-wrap';
  wrap.style.cssText = 'position:absolute;bottom:16px;left:16px;right:16px;z-index:200;max-width:460px;margin:0 auto;';
  wrap.innerHTML = `<div style="background:rgba(16,10,30,0.96);border:1px solid #3d2e60;border-radius:10px;padding:14px 16px;backdrop-filter:blur(12px);animation:slideUp 0.25s ease;"><div style="font-size:0.75rem;color:${speaker==='旁白'?'#7c6b9a':'#ffd54f'};margin-bottom:4px;${speaker==='旁白'?'font-style:italic':''}">${speaker}</div><div style="font-size:0.95rem;line-height:1.6;color:#ede7f6;">${text}</div><div style="float:right;font-size:0.7rem;color:#7c6b9a;margin-top:4px;">点击${onDone?'继续':'关闭'} ▸</div></div>`;
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
        <img src="images/地图.png" alt="世界地图" style="width:100%;height:auto;display:block;" onerror="this.alt='地图加载失败'">
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
