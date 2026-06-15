// @ts-nocheck
// Slice-1 game, lifted verbatim from the prototype (Phase-1 port): same code,
// now a bundled ES module using the installed Phaser instead of the CDN global.
// Incremental migration — overlays move to React + state to Zustand in later layers.
import Phaser from 'phaser'

  const SF = { input:{ left:false,right:false,jump:false,interact:false }, activeObjectId:null, panelOpen:false,
    creating:true, mode:'owner',
    character:{ name:'Soul', rank:'Wanderer', body:'male', hair:'plain', haircolor:'brown', eyes:'brown', weapon:'none' } };
  // creation options (hairstyles are gender-connected)
  const CREATE = {
    hairMale:['plain','buzzcut','flat_top_fade','bedhead','curly_short','afro'],
    hairFemale:['long','bob','bangslong','bangs','plain','afro'],
    haircolor:['brown','black','blonde','auburn','silver','blue'],
    eyes:['brown','blue','green','gray'],
    weapon:['none','sword','dagger','rapier','saber','axe','mace','scythe','halberd'],
  };
  // hair recolour ramps (luminance gradient-map: [shadow, mid, highlight])
  const HAIR_RAMP = {
    brown:[[58,38,20],[122,82,40],[182,132,76]], black:[[16,16,22],[40,40,50],[88,88,102]],
    blonde:[[120,86,30],[214,170,72],[250,230,156]], auburn:[[78,24,16],[166,54,30],[216,112,72]],
    silver:[[110,114,128],[178,182,196],[242,244,252]], blue:[[22,42,92],[50,96,178],[130,178,238]],
  };
  const HAIRSW = { brown:'#a8783e', black:'#2a2a32', blonde:'#e6cf86', auburn:'#a8442a', silver:'#c2c6d2', blue:'#3a6ad0' };
  const EYECOL = { brown:'#6b4a2a', blue:'#3b6fd0', green:'#3a8a45', gray:'#8a99a8' };
  const SWATCH = { eyes:EYECOL, haircolor:HAIRSW };
  const LBL = { body:{male:'Male',female:'Female'},
    hair:{plain:'Plain',bangs:'Bangs',bangslong:'Fringe',long:'Long',curly_short:'Curly',bob:'Bob',afro:'Afro',buzzcut:'Buzz',flat_top_fade:'Fade',bedhead:'Messy'},
    weapon:{none:'None',sword:'Sword',dagger:'Dagger',rapier:'Rapier',saber:'Saber',axe:'Axe',mace:'Mace',scythe:'Scythe',halberd:'Halberd'} };
  // rank tiers (tied to levels/XP later); each gets its own accent colour. Wanderer = starting tier.
  const RANKS = { Wanderer:'#9fb2c9', Apprentice:'#7fd6a8', Seeker:'#6fb4f2', Master:'#c79cf2', Ascendant:'#f6c44a' };
  const rankColor = r => RANKS[r] || '#9fb2c9';
  function rampColor(L,ramp){ const lo=L<128?ramp[0]:ramp[1], hi=L<128?ramp[1]:ramp[2], t=L<128?L/128:(L-128)/127;
    return [lo[0]+(hi[0]-lo[0])*t|0, lo[1]+(hi[1]-lo[1])*t|0, lo[2]+(hi[2]-lo[2])*t|0]; }
  const OBJECTS_META = {
    monument:{ icon:'⬡', color:'#a78bfa', art:'door', title:'THE MONUMENT', desc:'Look closer — this monument is <b>you</b>. Everything you become is etched into its stone.', meta:'Two views within: the 6-stat Hexagon and the 4 Realms.' },
    shrine:{ icon:'🕯', color:'#23d18b', art:'house', title:'THE HABIT SHRINE', desc:'Tend your daily habits at my altar, and a light kindles for each one kept.', meta:'11 starting habits → XP into their linked stats.' },
    quest:{ icon:'📋', color:'#ffb02e', art:'sign', title:'THE QUEST BOARD', desc:'Take a quest from the board, traveller — a Daily, a Weekly, or a Monthly BOSS.', meta:'Quest XP splits across its realm’s 2 core stats.' },
  };

  /* ---- time/season → sky tint + weather + clock (keeps the world matching reality) ---- */
  function amsNow(){
    try{ const p=new Intl.DateTimeFormat('en-GB',{ timeZone:'Europe/Amsterdam', hour:'2-digit', minute:'2-digit', hour12:false, weekday:'short', month:'numeric' }).formatToParts(new Date());
      const g=t=>p.find(x=>x.type===t)?.value||''; return { hour:parseInt(g('hour'),10), minute:g('minute'), hh:g('hour'), weekday:g('weekday'), month:parseInt(g('month'),10)-1 };
    }catch(e){ return { hour:12, minute:'00', hh:'12', weekday:'—', month:5 }; }
  }
  function computeTheme(){
    const t=amsNow(), h=t.hour, m=t.month;
    const season=(m<=1||m===11)?'winter':m<=4?'spring':m<=7?'summer':'autumn';
    const tod=(h>=5&&h<8)?'dawn':(h>=8&&h<18)?'day':(h>=18&&h<21)?'dusk':'night';
    // colour wash over the (bright day) pixel art so it reads as the right time
    const GRADE={ dawn:'linear-gradient(180deg,rgba(255,180,150,.16),rgba(120,90,160,.10))',
                  day:'radial-gradient(140% 100% at 50% 22%, rgba(255,255,255,0) 74%, rgba(20,70,100,.10) 100%)',
                  dusk:'linear-gradient(180deg,rgba(255,170,90,.15),rgba(80,50,90,.14))',
                  night:'linear-gradient(180deg,rgba(24,36,86,.26),rgba(14,22,64,.34))' }[tod];
    // bg = darker time wash for sky/forest; fg = lighter so foreground stays colourful
    const bg={ dawn:0xffc6b4, day:0xffffff, dusk:0xffc890, night:0x4f66a4 }[tod];
    const fg={ dawn:0xffe2d6, day:0xffffff, dusk:0xffe6c6, night:0xb6c4e8 }[tod];
    const weather=(season==='winter')?'snow':(tod==='night'||tod==='dusk')?'fireflies':(season==='spring'?'petals':'pollen');
    return { season, tod, grade:GRADE, bg, fg, weather };
  }
  const THEME=computeTheme();

  /* ===========================================================================
     WORLD GEOMETRY  (unchanged — same playable layout)
     =========================================================================== */
  const WORLD={ w:2800, h:1400 }; const GROUND_TOP=1200; const SPAWN={ x:420, y:1130 }; const S=2; // pixel scale
  const PLATFORMS=[ {x:760,y:1050,w:190},{x:1120,y:960,w:170},{x:1740,y:1055,w:220},{x:1995,y:920,w:220},{x:2280,y:790,w:360} ];
  const INTERACTABLES=[ {id:'shrine',wx:980,wy:GROUND_TOP},{id:'quest',wx:1380,wy:GROUND_TOP},{id:'monument',wx:2280,wy:790} ];
  // Sunny Land tileset (16px, 25 cols): grass-top tiles 26/28/30, dirt fill 51
  const TILE={ grassL:26, grass:28, grassR:30, dirt:51 };

  /* ---- small canvas helpers (for Leo + particle/prompt textures only) ---- */
  const R=n=>{ const x=Math.sin(n*127.1)*43758.5453; return x-Math.floor(x); };
  function rrPath(ctx,x,y,w,h,r){ r=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function fillStroke(ctx,fill,oc,ow){ if(fill){ ctx.fillStyle=fill; ctx.fill(); } if(oc){ ctx.lineJoin='round'; ctx.strokeStyle=oc; ctx.lineWidth=ow||2; ctx.stroke(); } }
  // pixel-art Leo (small black lab) — drawn low-res so it sits in the Sunny Land style
  function leoTex(ctx,w,h,phase){
    const O='#15120f', furB='#3c3a35', furS='#2a2824', furH='#6f6a61', gray='#aab0b8', tan='#d8b45a';
    const base=h-1;
    let ty=phase===1?-4:(phase===2?2:-1); ctx.save(); ctx.translate(5,base-14); ctx.rotate(ty*0.08); rrPath(ctx,-3,-1,5,12,2); fillStroke(ctx,furB,O,2); ctx.restore();
    const A=phase===1,B=phase===2; const leg=(x,f)=>{ rrPath(ctx,x+f,base-8,5,8,2); fillStroke(ctx,furS,O,1.6); };
    leg(10,A?1:(B?-1:0)); leg(15,A?-1:(B?1:0)); leg(22,A?1:(B?-1:0)); leg(27,A?-1:(B?1:0));
    rrPath(ctx,6,base-18,28,12,6); fillStroke(ctx,furB,O,2); ctx.fillStyle=furH; rrPath(ctx,9,base-17,18,3,2); ctx.fill();
    ctx.beginPath(); ctx.arc(32,base-20,8,0,7); fillStroke(ctx,furB,O,2);
    rrPath(ctx,37,base-19,6,6,3); fillStroke(ctx,furB,O,1.6); ctx.beginPath(); ctx.arc(43,base-16,1.7,0,7); fillStroke(ctx,'#0c0c0c',O,1);
    rrPath(ctx,27,base-27,6,9,3); fillStroke(ctx,furS,O,2);
    const eye=ex=>{ ctx.beginPath(); ctx.arc(ex,base-21,2.4,0,7); fillStroke(ctx,'#fff',O,1.4); ctx.beginPath(); ctx.arc(ex+.4,base-20.6,1.3,0,7); ctx.fillStyle='#3a2a18'; ctx.fill(); };
    eye(31); eye(37);
    ctx.fillStyle='rgba(255,150,160,.6)'; ctx.beginPath(); ctx.arc(29,base-16,1.8,0,7); ctx.fill();
    rrPath(ctx,28,base-14,6,4,2); fillStroke(ctx,gray,O,1.4); ctx.beginPath(); ctx.arc(31,base-10,1.2,0,7); fillStroke(ctx,tan,O,.8);
  }
  function dotTex(c){ c.fillStyle='#fff'; c.beginPath(); c.arc(4,4,4,0,7); c.fill(); }
  function star4Tex(c,w,h){ const cx=w/2,cy=h/2; c.fillStyle='#fff';
    c.beginPath(); c.moveTo(cx,1); c.lineTo(cx+2,cy); c.lineTo(cx,h-1); c.lineTo(cx-2,cy); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(1,cy); c.lineTo(cx,cy-2); c.lineTo(w-1,cy); c.lineTo(cx,cy+2); c.closePath(); c.fill();
    c.beginPath(); c.arc(cx,cy,1.7,0,7); c.fill(); }
  function haloTex(c,w,h){ const cx=w/2,cy=h/2; [[60,.10],[46,.16],[33,.24],[22,.34]].forEach(([r,a])=>{ c.fillStyle='rgba(255,255,255,'+a+')'; c.beginPath(); c.arc(cx,cy,r,0,7); c.fill(); }); }
  function shadowTex(c,w,h){ c.fillStyle='rgba(20,18,30,.28)'; c.beginPath(); c.ellipse(w/2,h/2,w/2,h/2,0,0,7); c.fill(); }

  /* ===========================================================================
     WORLD SCENE
     =========================================================================== */
  class WorldScene extends Phaser.Scene {
    constructor(){ super('world'); }
    preload(){
      // real assets
      this.load.image('sky','assets/sunny/env/sky.png');
      this.load.image('forest','assets/sunny/env/forest.png');
      this.load.image('tiles','assets/sunny/env/tileset.png');
      this.load.atlas('ents','assets/sunny/atlas/entities.png','assets/sunny/atlas/entities.json');
      this.load.atlas('props','assets/sunny/atlas/props.png','assets/sunny/atlas/props.json');
      // LPC modular character OPTIONS (walk sheets, 64x64 frames, 9 cols x 4 rows N/W/S/E).
      // Art: Liberated Pixel Cup (CC-BY-SA 3.0 / GPL 3.0) — credit LPC contributors. TODO: full author list.
      this.load.image('o_body_male','assets/lpc/body/male.png'); this.load.image('o_body_female','assets/lpc/body/female.png');
      this.load.image('o_head_male','assets/lpc/head/male.png'); this.load.image('o_head_female','assets/lpc/head/female.png'); // LPC body is neck-down; head is a separate layer
      ['male','female'].forEach(b=>['top','bottom','feet'].forEach(p=>this.load.image('o_fit_'+b+'_'+p,'assets/lpc/outfit/'+b+'/'+p+'.png')));
      [...new Set([...CREATE.hairMale,...CREATE.hairFemale])].forEach(h=>this.load.image('o_hair_'+h,'assets/lpc/hair/'+h+'.png'));
      CREATE.eyes.forEach(e=>this.load.image('o_eyes_'+e,'assets/lpc/eyes/'+e+'.png'));
      CREATE.weapon.filter(w=>w!=='none').forEach(w=>this.load.image('o_weapon_'+w,'assets/lpc/weapon/'+w+'.png'));
      // canvas textures for Leo + particles + prompt
      const cv=(key,w,h,fn)=>{ const t=this.textures.createCanvas(key,w,h); fn(t.getContext(),w,h); t.refresh(); };
      cv('leo_idle',48,40,(c,w,h)=>leoTex(c,w,h,0)); cv('leo_walk0',48,40,(c,w,h)=>leoTex(c,w,h,1)); cv('leo_walk1',48,40,(c,w,h)=>leoTex(c,w,h,2));
      cv('dot',8,8,(c)=>dotTex(c)); cv('star4',16,16,star4Tex); cv('halo',128,128,haloTex); cv('shadow',80,26,shadowTex);
    }

    create(){
      this.physics.world.setBounds(0,0,WORLD.w,WORLD.h); this.solids=[];
      this.composeChar(); window.__scene=this;   // expose for the creation screen's live re-compose
      this.buildBackground(); this.buildGround(); this.buildPlatforms(); this.buildProps(); this.buildInteractables();
      this.buildPlayer(); this.buildLeo(); this.buildPrompt(); this.buildParticles(); this.bindInput();
      const cam=this.cameras.main; cam.setBounds(0,0,WORLD.w,WORLD.h); cam.startFollow(this.player,true,0.09,0.09); cam.setDeadzone(150,200); cam.setBackgroundColor('rgba(0,0,0,0)');
      // player + critter animations from the atlas
      const gf=(p,a,b)=>this.anims.generateFrameNames('ents',{prefix:p,start:a,end:b});
      // idle = East row standing (frame 27) — turned 3/4 sideways; run/jump = East row too.
      this.anims.create({ key:'p_idle', frames:[{key:'char_walk',frame:27}], frameRate:1, repeat:-1 });
      this.anims.create({ key:'p_run', frames:[28,29,30,31,32,33,34,35].map(f=>({key:'char_walk',frame:f})), frameRate:11, repeat:-1 });
      this.anims.create({ key:'p_jump', frames:[{key:'char_walk',frame:31}], frameRate:1, repeat:-1 });
      this.anims.create({ key:'op_walk', frames:gf('opossum/opossum-',1,6), frameRate:8, repeat:-1 });
      this.anims.create({ key:'l_idle', frames:[{key:'leo_idle'}], frameRate:1, repeat:-1 });
      this.anims.create({ key:'l_walk', frames:[{key:'leo_walk0'},{key:'leo_walk1'}], frameRate:9, repeat:-1 });
      this.player.play('p_idle'); this._wasAir=false;
      if(SF.creating) setupCreate();   // show the creation screen over the (dimmed) world
    }

    /* ---- composite the selected LPC layers into one walk sheet (live, re-runnable) ---- */
    composeChar(){
      const C=SF.character, b=C.body;
      const exists=this.textures.exists('char_walk');
      const tex=exists?this.textures.get('char_walk'):this.textures.createCanvas('char_walk',576,256);
      const ctx=tex.getContext(); ctx.imageSmoothingEnabled=false; ctx.clearRect(0,0,576,256);
      const drawKey=k=>{ if(this.textures.exists(k)) ctx.drawImage(this.textures.get(k).getSourceImage(),0,0); };
      drawKey('o_body_'+b); drawKey('o_head_'+b); drawKey('o_eyes_'+C.eyes);
      drawKey('o_fit_'+b+'_bottom'); drawKey('o_fit_'+b+'_feet'); drawKey('o_fit_'+b+'_top');
      ctx.drawImage(this.recolorHair(C.hair, C.haircolor||'brown'),0,0);          // recoloured hair
      if(C.weapon && C.weapon!=='none') drawKey('o_weapon_'+C.weapon);
      tex.refresh();   // (no fake-eye overlay — the LPC head has its own natural face + the o_eyes layer)
      if(!exists){ let i=0; for(let r=0;r<4;r++) for(let c=0;c<9;c++){ tex.add(i,0,c*64,r*64,64,64); i++; } }
      // SOUTH-row (row 2 = front-facing) frame data URLs for the DOM creation preview + conversation portrait —
      // LPC holds weapons in the right hand, which the 3/4 side view hides; front-on every weapon reads clearly.
      const src=tex.getSourceImage(); window.__charFrames=[];
      for(let c=0;c<9;c++){ const fc=document.createElement('canvas'); fc.width=64; fc.height=64; const fx=fc.getContext('2d');
        fx.imageSmoothingEnabled=false; fx.drawImage(src,c*64,2*64,64,64,0,0,64,64); window.__charFrames.push(fc.toDataURL()); }
      window.__portrait=[window.__charFrames[0]];
    }
    /* LPC eyes are tiny/realistic — draw a clear readable face on the South (front-facing) row so the character has a face */
    drawFace(ctx){
      const iris=EYECOL[SF.character.eyes]||'#5a3a1a';
      const x=33, y=221;     // exactly on the LPC face line (cell-y ~29) of the East-standing pose — sits on the head, no float
      const eye=ex=>{ ctx.fillStyle='#241a2a'; ctx.fillRect(ex-1,y-2,4,5);     // dark frame
        ctx.fillStyle='#ffffff'; ctx.fillRect(ex-1,y-2,4,4);                   // white
        ctx.fillStyle=iris;      ctx.fillRect(ex,y-1,2,3);                     // iris (eye colour)
        ctx.fillStyle='#15101c'; ctx.fillRect(ex,y,1,2);                       // pupil
        ctx.fillStyle='#ffffff'; ctx.fillRect(ex,y-1,1,1); };                 // shine
      eye(x-3); eye(x+2);    // eyes toward the facing (right) side
      ctx.fillStyle='#6b3a2c'; ctx.fillRect(x-1,y+4,3,1);                                                // smile
      ctx.fillStyle='rgba(255,150,150,.4)'; ctx.fillRect(x-4,y+1,2,2); ctx.fillRect(x+4,y+1,2,2);        // blush
    }
    /* LPC ships hair in one colour; recolour by luminance gradient-map so any colour works (cached) */
    recolorHair(style, colour){
      if(!this._hairCache) this._hairCache={};
      const key=style+'_'+colour; if(this._hairCache[key]) return this._hairCache[key];
      const img=this.textures.get('o_hair_'+style).getSourceImage();
      const cv=document.createElement('canvas'); cv.width=576; cv.height=256; const cx=cv.getContext('2d');
      cx.imageSmoothingEnabled=false; cx.drawImage(img,0,0);
      const ramp=HAIR_RAMP[colour]||HAIR_RAMP.brown, id=cx.getImageData(0,0,576,256), d=id.data;
      for(let i=0;i<d.length;i+=4){ if(d[i+3]>10){ const L=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2], c=rampColor(L,ramp); d[i]=c[0]; d[i+1]=c[1]; d[i+2]=c[2]; } }
      cx.putImageData(id,0,0); this._hairCache[key]=cv; return cv;
    }

    /* ---- parallax sky + forest (Sunny Land) ---- */
    buildBackground(){
      this.add.tileSprite(0,0,WORLD.w,GROUND_TOP+260,'sky').setOrigin(0,0).setScrollFactor(0.1,0.3).setDepth(0).setTileScale(S,S).setTint(THEME.bg);
      // far forest band (hazier) + near forest band
      this.add.tileSprite(0,GROUND_TOP+40,WORLD.w,360,'forest').setOrigin(0,1).setScrollFactor(0.35,1).setDepth(2).setTileScale(S*0.9,S*0.9).setAlpha(0.5).setTint(THEME.bg);
      this.add.tileSprite(0,GROUND_TOP+30,WORLD.w,420,'forest').setOrigin(0,1).setScrollFactor(0.55,1).setDepth(3).setTileScale(S,S).setTint(THEME.bg);
    }

    /* ---- ground: Sunny Land tilemap (visual) + invisible physics bodies ---- */
    addSolid(cx,topY,w,h){ const b=this.physics.add.staticImage(cx,topY+h/2,'dot').setVisible(false).setDisplaySize(w,h); b.refreshBody(); this.solids.push(b); return b; }
    shadowAt(x,y,sx,depth,alpha){ this.add.image(x,y,'shadow').setOrigin(0.5,0.5).setDepth(depth||9).setScale(sx,sx*0.5).setAlpha(alpha==null?0.24:alpha); }
    buildGround(){
      const gcols=Math.ceil(WORLD.w/(16*S))+1, grows=Math.ceil((WORLD.h-GROUND_TOP)/(16*S))+2;
      const map=this.make.tilemap({ tileWidth:16, tileHeight:16, width:gcols, height:grows });
      const tset=map.addTilesetImage('tiles','tiles',16,16);
      const layer=map.createBlankLayer('ground',tset,0,GROUND_TOP).setScale(S).setDepth(10);
      if(THEME.fg!==0xffffff) layer.setTint(THEME.fg);
      for(let x=0;x<gcols;x++){ layer.putTileAt(TILE.grass,x,0); for(let y=1;y<grows;y++) layer.putTileAt(TILE.dirt,x,y); }
      this.addSolid(WORLD.w/2,GROUND_TOP,WORLD.w,200);
    }

    /* ---- floating platforms from the 'platform-long' prop ---- */
    buildPlatforms(){
      for(const p of PLATFORMS){
        this.shadowAt(p.x,p.y+26,p.w/95,9.5,0.16);
        const pieceW=32*S, n=Math.ceil(p.w/pieceW), left=p.x-p.w/2;
        for(let i=0;i<n;i++) this.add.image(Math.min(left+pieceW/2+i*pieceW, p.x+p.w/2-pieceW/2),p.y,'props','platform-long').setOrigin(0.5,0).setScale(S).setDepth(11).setTint(THEME.fg);
        this.addSolid(p.x,p.y,p.w,22);
      }
    }

    /* ---- scenery props (thinned, size-varied) ---- */
    prop(x,frame,scale,depth,flip){ const im=this.add.image(x,GROUND_TOP+2,'props',frame).setOrigin(0.5,1).setScale(scale*S).setDepth(depth||12).setTint(THEME.fg); if(flip) im.setFlipX(true); return im; }
    buildProps(){
      // big anchors
      this.shadowAt(150,GROUND_TOP+6,1.5,9.6,0.18); this.prop(150,'tree',1.5,9);
      this.shadowAt(2640,GROUND_TOP+6,1.2,9.6,0.18); this.prop(2640,'tree',1.2,9,true);
      this.prop(1700,'tree',0.9,9);
      // low scatter — spaced, varied
      this.prop(600,'bush',1.0); this.prop(2430,'bush',0.8,12,true);
      this.prop(300,'rock',1.0); this.prop(2560,'rock',0.7);
      this.prop(1255,'shrooms',1.1); this.prop(1080,'shrooms',0.8);
      this.prop(860,'bush',0.7,8);
      // ambient critter near home (Sunny Land opossum), gently patrolling
      this.shadowAt(660,GROUND_TOP+6,0.9,12.5,0.2);
      const op=this.add.sprite(660,GROUND_TOP+2,'ents','opossum/opossum-1').setOrigin(0.5,1).setScale(S).setDepth(13).setTint(THEME.fg); op.play('op_walk');
      this.tweens.add({ targets:op, x:740, duration:3000, yoyo:true, repeat:-1, ease:'Sine.inOut', onYoyo:()=>op.setFlipX(true), onRepeat:()=>op.setFlipX(false) });
    }

    /* ---- interactables: house/sign/door stand-ins + glow + sparkles ---- */
    buildInteractables(){
      const C={ shrine:{frame:'house',sc:1.7,glowY:-92,gs:1.7}, quest:{frame:'sign',sc:3.0,glowY:-58,gs:1.3}, monument:{frame:'door',sc:2.4,glowY:-78,gs:1.6} };
      this.interactables=[];
      for(const data of INTERACTABLES){
        const meta=OBJECTS_META[data.id], cfg=C[data.id], col=Phaser.Display.Color.HexStringToColor(meta.color).color;
        const sprite=this.add.image(0,0,'props',cfg.frame).setOrigin(0.5,1).setScale(cfg.sc).setTint(THEME.fg);
        const h=sprite.displayHeight;
        this.shadowAt(data.wx,data.wy+5,h/150,19,0.22);
        const cont=this.add.container(data.wx,data.wy).setDepth(20);
        const halo=this.add.image(0,cfg.glowY,'halo').setTint(col).setScale(cfg.gs).setAlpha(.7); cont.add(halo);
        this.tweens.add({ targets:halo, scale:cfg.gs*1.12, alpha:1, duration:1300, yoyo:true, repeat:-1, ease:'Sine.inOut' });
        cont.add(sprite);
        const label=this.add.text(0,-h-8,this.objLabel(data.id),{ fontFamily:'"Press Start 2P"', fontSize:'11px', color:'#ffffff', stroke:'#1a1230', strokeThickness:5, align:'center' }).setOrigin(0.5,1); cont.add(label);
        this.tweens.add({ targets:label, y:label.y-6, duration:1600, yoyo:true, repeat:-1, ease:'Sine.inOut' });
        this.add.particles(data.wx,data.wy+cfg.glowY,'star4',{ x:{min:-40,max:40}, y:{min:-44,max:44}, lifespan:1300, scale:{start:0.8,end:0}, alpha:{start:1,end:0}, tint:col, frequency:240, quantity:1, rotate:{min:0,max:90} }).setDepth(21);
        data.topY=data.wy-h-10; cont.data={ ...data, halo }; this.interactables.push(cont);
      }
    }
    objLabel(id){ return ({monument:'Monument',shrine:'Habit Shrine',quest:'Quest Board'})[id]; }

    /* ---- fox player (placeholder for the Wanderer) ---- */
    buildPlayer(){
      this.pShadow=this.add.image(SPAWN.x,GROUND_TOP,'shadow').setAlpha(.28).setDepth(48).setScale(0.85);
      const p=this.physics.add.sprite(SPAWN.x,SPAWN.y,'char_walk',27).setDepth(50).setScale(S).setTint(THEME.fg);
      p.body.setSize(16,30).setOffset(24,32);   // native px (64x64 frame); arcade scales with the sprite
      p.setCollideWorldBounds(true).setMaxVelocity(360,1100); this.physics.add.collider(p,this.solids); this.player=p;
      // name tag = chosen NAME (bold) with the RANK in a smaller tinted line above it
      this.nameTag=this.add.text(SPAWN.x,SPAWN.y-54,SF.character.name,{ fontFamily:'"Press Start 2P"', fontSize:'9px', color:'#fff', stroke:'#1a1230', strokeThickness:5 }).setOrigin(0.5,1).setDepth(60);
      this.rankTag=this.add.text(SPAWN.x,SPAWN.y-67,SF.character.rank.toUpperCase(),{ fontFamily:'"Press Start 2P"', fontSize:'7px', color:rankColor(SF.character.rank), stroke:'#1a1230', strokeThickness:4, letterSpacing:2 }).setOrigin(0.5,1).setDepth(60);
    }
    buildLeo(){
      this.lShadow=this.add.image(SPAWN.x-90,GROUND_TOP,'shadow').setAlpha(.26).setDepth(47).setScale(0.7);
      const l=this.physics.add.sprite(SPAWN.x-90,SPAWN.y,'leo_idle').setDepth(49).setScale(1.25).setTint(THEME.fg); l.body.setSize(30,18).setOffset(8,20);
      l.setCollideWorldBounds(true).setMaxVelocity(420,1100); this.physics.add.collider(l,this.solids); this.leo=l;
      this.leoTag=this.add.text(SPAWN.x-90,SPAWN.y-30,'Leo',{ fontFamily:'"Press Start 2P"', fontSize:'8px', color:'#ffd479', stroke:'#1a1230', strokeThickness:5 }).setOrigin(0.5,1).setDepth(60);
    }
    buildPrompt(){ const c=this.add.container(0,0).setDepth(70).setVisible(false); const inner=this.add.container(0,0); const bg=this.add.graphics();
      bg.fillStyle(0x1a1230,.92); bg.fillRoundedRect(-16,-16,32,32,7); bg.lineStyle(2,0xf59e0b,1); bg.strokeRoundedRect(-16,-16,32,32,7);
      const key=this.add.text(0,1,'E',{ fontFamily:'"Press Start 2P"', fontSize:'14px', color:'#ffe27a' }).setOrigin(0.5); inner.add([bg,key]); c.add(inner);
      this.tweens.add({ targets:inner, y:-8, duration:700, yoyo:true, repeat:-1, ease:'Sine.inOut' }); this.prompt=c; }

    buildParticles(){
      this.dust=this.add.particles(0,0,'dot',{ speed:{min:30,max:110}, angle:{min:200,max:340}, lifespan:360, scale:{start:1.6,end:0}, alpha:{start:.55,end:0}, tint:0xeae0c8, gravityY:300, emitting:false }).setDepth(45);
      const W=THEME.weather;
      if(W==='snow') this.add.particles(0,0,'dot',{ x:{min:0,max:1900}, y:-20, lifespan:16000, speedY:{min:25,max:70}, speedX:{min:-22,max:22}, scale:{min:.6,max:1.6}, alpha:{min:.5,max:.9}, tint:0xffffff, frequency:90, quantity:1 }).setScrollFactor(0).setDepth(80);
      else if(W==='fireflies') this.add.particles(0,0,'star4',{ x:{min:0,max:WORLD.w}, y:{min:GROUND_TOP-340,max:GROUND_TOP-10}, lifespan:2600, speedX:{min:-10,max:10}, speedY:{min:-10,max:5}, scale:{start:0.6,end:0}, alpha:{start:1,end:0}, tint:0xffe24a, frequency:130, quantity:1, rotate:{min:0,max:90} }).setDepth(46);
      else if(W==='petals') this.add.particles(0,0,'dot',{ x:{min:0,max:1900}, y:-20, lifespan:14000, speedY:{min:18,max:46}, speedX:{min:-26,max:26}, scale:{min:.8,max:1.5}, alpha:{min:.6,max:.95}, tint:[0xffb6d5,0xffd6e6], frequency:150, quantity:1, rotate:{min:0,max:360} }).setScrollFactor(0).setDepth(80);
      else this.add.particles(0,0,'star4',{ x:{min:0,max:WORLD.w}, y:{min:GROUND_TOP-300,max:GROUND_TOP-20}, lifespan:5200, speedY:{min:-14,max:-2}, speedX:{min:-8,max:8}, scale:{start:0.4,end:0}, alpha:{start:.8,end:0}, tint:0xfff0a0, frequency:240, quantity:1 }).setDepth(15);
    }

    bindInput(){ this.input.keyboard.addCapture('SPACE,UP,DOWN,LEFT,RIGHT,W,A,D'); this.keys=this.input.keyboard.addKeys({ left:'LEFT', right:'RIGHT', up:'UP', a:'A', d:'D', w:'W', space:'SPACE', e:'E' }); this._jumpPrev=false; this._interactPrev=false; }

    update(){
      const p=this.player,l=this.leo,k=this.keys;
      if(SF.creating){ p.setVelocityX(0); l.setVelocityX(0); p.play('p_idle',true); l.play('l_idle',true); this.syncFollowers(); return; }
      const left=k.left.isDown||k.a.isDown||SF.input.left, right=k.right.isDown||k.d.isDown||SF.input.right, jumpHeld=k.up.isDown||k.w.isDown||k.space.isDown||SF.input.jump, interactHeld=k.e.isDown||SF.input.interact;
      const jumpEdge=jumpHeld&&!this._jumpPrev, interactEdge=interactHeld&&!this._interactPrev; this._jumpPrev=jumpHeld; this._interactPrev=interactHeld;
      if(SF.panelOpen){ p.setVelocityX(0); p.play('p_idle',true); l.setVelocityX(0); l.play('l_idle',true); this.prompt.setVisible(false); this.syncFollowers(); return; }
      const SPEED=240; let vx=0; if(left&&!right) vx=-SPEED; else if(right&&!left) vx=SPEED; p.setVelocityX(vx); if(vx!==0) p.setFlipX(vx<0);
      const onFloor=p.body.onFloor()||p.body.blocked.down;
      if(jumpEdge&&onFloor){ p.setVelocityY(-780); this.dust.explode(8,p.x,p.y+p.body.halfHeight); }
      if(!jumpHeld&&p.body.velocity.y<-260) p.setVelocityY(-260);
      if(this._wasAir&&onFloor) this.dust.explode(9,p.x,p.y+p.body.halfHeight); this._wasAir=!onFloor;
      if(!onFloor) p.play('p_jump',true); else if(vx!==0) p.play('p_run',true); else p.play('p_idle',true); // keep facing the last direction at rest
      const facing=p.flipX?-1:1, targetX=p.x-facing*92, dx=targetX-l.x, dist=Math.abs(dx); let lvx=0; if(dist>14){ lvx=Phaser.Math.Clamp(dx*5,-300,300); if(dist>240) lvx=Math.sign(dx)*380; }
      l.setVelocityX(lvx); if(Math.abs(lvx)>8) l.setFlipX(lvx<0); const leoFloor=l.body.onFloor()||l.body.blocked.down; if(leoFloor&&(p.y<l.y-70)&&dist<170) l.setVelocityY(-720);
      if(Math.abs(lvx)>30) l.play('l_walk',true); else l.play('l_idle',true);
      this.syncFollowers();
      let near=null,best=140; for(const o of this.interactables){ const ddx=Math.abs(o.data.wx-p.x), ddy=Math.abs(o.data.wy-p.y); if(ddx<best&&ddy<210){ best=ddx; near=o; } }
      const newId=near?near.data.id:null; if(newId!==SF.activeObjectId){ SF.activeObjectId=newId; syncInteractBtn(); }
      if(near){ this.prompt.setVisible(true); this.prompt.x=near.data.wx; this.prompt.y=near.data.topY-30; } else this.prompt.setVisible(false);
      if(interactEdge&&near) openPanel(near.data.id);
    }
    syncFollowers(){ const p=this.player,l=this.leo; this.pShadow.setPosition(p.x,p.y+p.body.halfHeight+2); this.lShadow.setPosition(l.x,l.y+l.body.halfHeight+1); this.nameTag.setPosition(p.x,p.y-p.body.halfHeight-6); this.rankTag.setPosition(p.x,p.y-p.body.halfHeight-19); this.leoTag.setPosition(l.x,l.y-l.body.halfHeight-4); }
  }

  /* ===========================================================================
     DOM LAYER
     =========================================================================== */
  const $=id=>document.getElementById(id);
  let portraitTimer=null;
  function openPanel(id){ const m=OBJECTS_META[id]; if(!m) return; SF.panelOpen=true;
    const panel=$('panel');
    panel.classList.remove('show','theme-monument','theme-shrine','theme-quest');
    panel.classList.add('theme-'+id);
    panel.style.setProperty('--accent', m.color);                 // one accent, per realm
    $('p-icon').textContent=m.icon; $('p-title').textContent=m.title; $('p-desc').innerHTML=m.desc; $('p-meta').innerHTML=m.meta;
    $('p-pname').textContent=SF.character.name; $('p-prank').textContent=SF.character.rank.toUpperCase(); $('p-prank').style.color=rankColor(SF.character.rank);
    $('p-elart').src='assets/sunny/ui/'+m.art+'.png';             // the element, as the other party
    const frames=window.__portrait||['assets/sunny/player/player-idle-1.png']; let pf=0; $('p-portrait').src=frames[0];
    clearInterval(portraitTimer); portraitTimer=setInterval(()=>{ pf=(pf+1)%frames.length; $('p-portrait').src=frames[pf]; }, 420); // breathing idle = alive
    $('dim').classList.add('show'); requestAnimationFrame(()=>panel.classList.add('show'));
    syncInteractBtn(); /* SFX slot: themed open chime per element; soft cancel on close */ }
  function closePanel(){ SF.panelOpen=false; $('dim').classList.remove('show'); $('panel').classList.remove('show'); clearInterval(portraitTimer);
    SF.input.left=SF.input.right=SF.input.jump=SF.input.interact=false; document.querySelectorAll('.btn').forEach(b=>b.classList.remove('held')); }
  $('p-close').addEventListener('click',closePanel); $('dim').addEventListener('click',closePanel); document.addEventListener('keydown',e=>{ if(e.key==='Escape') closePanel(); });
  function isTouch(){ return ('ontouchstart' in window)||navigator.maxTouchPoints>0||window.innerWidth<=768; }
  function syncInteractBtn(){ const b=$('t-interact'); if(b) b.classList.toggle('live', !!SF.activeObjectId&&!SF.panelOpen); }
  function setupTouch(){ const show=isTouch(); $('touch').classList.toggle('show',show); if(show) $('hint').style.display='none';
    document.querySelectorAll('#touch .btn').forEach(btn=>{ const key=btn.dataset.k;
      const on=e=>{ e.preventDefault(); if(key==='interact'){ if(SF.activeObjectId&&!SF.panelOpen) openPanel(SF.activeObjectId); return; } SF.input[key]=true; btn.classList.add('held'); };
      const off=e=>{ e.preventDefault(); if(key!=='interact'){ SF.input[key]=false; btn.classList.remove('held'); } };
      btn.addEventListener('touchstart',on,{passive:false}); btn.addEventListener('touchend',off,{passive:false}); btn.addEventListener('touchcancel',off,{passive:false}); btn.addEventListener('mousedown',on); window.addEventListener('mouseup',off); }); }
  window.addEventListener('resize',()=>$('touch').classList.toggle('show',isTouch()));
  function updateClock(){ const t=amsNow(); const sIcon={winter:'❄',spring:'🌸',summer:'☀',autumn:'🍂'}[THEME.season], tIcon={dawn:'🌅',day:'☀',dusk:'🌆',night:'🌙'}[THEME.tod];
    $('clk-time').textContent=`${tIcon} ${t.hh}:${t.minute}`; $('clk-day').innerHTML=`${t.weekday} · ${sIcon} <span>${THEME.season.charAt(0).toUpperCase()+THEME.season.slice(1)}</span>`; }

  /* ---- character creation flow (owner persists in prod; guest is ephemeral) ---- */
  let crTimer=null, crFi=0;
  function crRefresh(){ const f=window.__charFrames; if(f&&f.length) $('cr-preview').src=f[0]; }
  function crAnim(){ const f=window.__charFrames; if(f&&f.length>8){ crFi=crFi%8+1; $('cr-preview').src=f[crFi]; } } // walk in place so the weapon shows
  function setupCreate(){
    const guest=/[?&](guest|visitor)/i.test(location.search); SF.mode=guest?'visitor':'owner';
    $('cr-title').textContent=guest?'CREATE YOUR GUEST':'CREATE YOUR CHARACTER';
    $('cr-sub').textContent=guest?'A look just for this visit — not saved.':'This is you — the soul you’ll forge.';
    $('cr-name').value=SF.character.name;
    const genderHair=()=>SF.character.body==='female'?CREATE.hairFemale:CREATE.hairMale;
    function renderRow(axis, values){ const c=$('cr-'+axis); c.innerHTML='';
      values.forEach(v=>{ const b=document.createElement('button'); b.className='cr-chip'+(SF.character[axis]===v?' on':'');
        if(SWATCH[axis]){ b.classList.add('sw'); b.style.setProperty('--sw',SWATCH[axis][v]||'#888'); b.title=v; } else b.textContent=(LBL[axis]&&LBL[axis][v])||v;
        b.onclick=()=>{ SF.character[axis]=v;
          if(axis==='body'){ const gh=genderHair(); if(!gh.includes(SF.character.hair)) SF.character.hair=gh[0]; renderRow('hair',gh); } // gender-connected hair
          if(window.__scene) window.__scene.composeChar(); crRefresh(); [...c.children].forEach(x=>x.classList.remove('on')); b.classList.add('on'); };
        c.appendChild(b); });
    }
    renderRow('body',['male','female']); renderRow('hair',genderHair()); renderRow('haircolor',CREATE.haircolor); renderRow('eyes',CREATE.eyes); renderRow('weapon',CREATE.weapon);
    $('cr-name').oninput=e=>{ SF.character.name=e.target.value||'Soul'; };
    $('cr-begin').onclick=crEnter;
    crRefresh(); clearInterval(crTimer); $('create').classList.add('show');   // show the still idle pose (CSS bob gives life; face stays locked)
  }
  function crEnter(){ clearInterval(crTimer); SF.character.name=($('cr-name').value||'Soul').trim()||'Soul'; SF.creating=false; $('create').classList.remove('show');
    const s=window.__scene; if(s&&s.nameTag){ s.nameTag.setText(SF.character.name); if(s.rankTag){ s.rankTag.setText(SF.character.rank.toUpperCase()); s.rankTag.setColor(rankColor(SF.character.rank)); } } }

  function startGame(){ if(window.__sfStarted) return; window.__sfStarted=true; $('loading').style.display='none'; $('grade').style.background=THEME.grade;
    new Phaser.Game({ type:Phaser.AUTO, parent:'game', transparent:true, pixelArt:true, roundPixels:true, scale:{ mode:Phaser.Scale.RESIZE, width:'100%', height:'100%' }, physics:{ default:'arcade', arcade:{ gravity:{y:1600}, debug:false } }, scene:WorldScene });
    setupTouch(); syncInteractBtn(); updateClock(); setInterval(updateClock,1000); requestAnimationFrame(()=>{ const t=$('title-toast'); if(t) t.style.opacity='0'; });
    // preload panel portrait/element art so the conversation opens without a flicker
    ['ui/house','ui/sign','ui/door'].forEach(p=>{ const i=new Image(); i.src='assets/sunny/'+p+'.png'; }); }
  const fonts=(document.fonts&&document.fonts.load)?Promise.all([document.fonts.load('10px "Press Start 2P"'),document.fonts.load('20px "VT323"')]).catch(()=>{}):Promise.resolve();
  fonts.finally(startGame); setTimeout(startGame,1800);
