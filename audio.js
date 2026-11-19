/* Reuses the user-provided Iowa sample bank and the original WebAudioFont fallbacks. */
(function(root){
  'use strict';
  const AudioContextCtor=root.AudioContext||root.webkitAudioContext;
  let ctx,player,currentSource=null,currentGain=null,requestId=0;
  const cache=new Map();
  const presetNames={piano:'_tone_0000_JCLive_sf2_file',violin:'_tone_0400_JCLive_sf2_file'};
  const instrumentLabels={piano:'钢琴',violin:'小提琴'};
  // Fine-tuning derived from the source trainers' sample-zone measurements (cents).
  const VIOLIN_ZONE_CENTS=[[21,58,-4],[59,62,.5],[63,66,-6.2],[67,67,-11.4],[68,70,-11.4],
    [71,71,-7.8],[72,74,-7.8],[75,78,-3.6],[79,79,3],[80,82,3],[83,86,-5.5],[87,87,2],[88,90,2]];
  let tunedViolin=null;
  function getCtx(){
    if(!ctx){if(!AudioContextCtor)throw Error('浏览器不支持音频播放');ctx=new AudioContextCtor();}
    return ctx;
  }
  function memo(key,fn){
    if(!cache.has(key))cache.set(key,Promise.resolve().then(fn).catch(err=>{cache.delete(key);throw err;}));
    return cache.get(key);
  }
  async function fetchFile(name,type){
    // Standalone HTML embeds every Iowa audio bank to work without a local web server.
    if(root.NOTE_STUDIO_EMBEDDED_INDEX){
      if(name==='sources.json')return root.NOTE_STUDIO_EMBEDDED_INDEX;
      const encoded=root.NOTE_STUDIO_EMBEDDED_AUDIO?.[name];
      if(encoded){
        const bytes=atob(encoded),arr=new Uint8Array(bytes.length);
        for(let i=0;i<bytes.length;i++)arr[i]=bytes.charCodeAt(i);
        return arr.buffer;
      }
    }
    const res=await fetch('./ap-audio/'+name);
    if(!res.ok)throw Error('Audio request failed');
    return type==='json'?res.json():res.arrayBuffer();
  }
  async function iowaSample(context,instrument,midi){
    const index=await memo('manifest',()=>fetchFile('sources.json','json'));
    const meta=index.samples.find(item=>item.id===`${instrument}-${midi}-1`);
    if(!meta||index.version!=='iowa-prototype-1')throw Error('Recording unavailable');
    return memo(meta.id,async()=>{
      const bank=await memo(meta.bank,()=>fetchFile(meta.bank));
      if(bank.byteLength<meta.offset+meta.bytes)throw Error('Incomplete bank');
      return context.decodeAudioData(bank.slice(meta.offset,meta.offset+meta.bytes));
    });
  }
  function stop(){
    requestId++;
    if(currentSource){try{currentSource.stop();}catch(e){}currentSource=null;}
    if(currentGain){try{currentGain.disconnect();}catch(e){}currentGain=null;}
    if(player && ctx){try{player.cancelQueue(ctx);}catch(e){}}
  }
  async function ensurePreset(context,instrument){
    const name=presetNames[instrument];
    const preset=root[name];
    if(!preset)throw Error('Preset missing');
    if(!player){if(typeof root.WebAudioFontPlayer!=='function')throw Error('Player missing');player=new root.WebAudioFontPlayer();}
    return memo('preset-'+instrument,()=>new Promise((resolve,reject)=>{
      try{player.loader.decodeAfterLoading(context,name);}catch(e){reject(e);return;}
      const start=Date.now();
      function check(){
        if(player.loader.loaded(name)){
          if(instrument==='violin'){
            if(!tunedViolin)tunedViolin={...preset,zones:preset.zones.map(zone=>{
              const fix=VIOLIN_ZONE_CENTS.find(([low,high])=>zone.keyRangeLow===low&&zone.keyRangeHigh===high);
              return fix?{...zone,fineTune:(Number(zone.fineTune)||0)-fix[2]}:zone;
            })};
            resolve(tunedViolin);
          }else resolve(preset);
          return;
        }
        if(Date.now()-start>10000){reject(Error('Decode timeout'));return;}
        setTimeout(check,40);
      }
      check();
    }));
  }
  function synthFallback(context,midi){
    const osc=context.createOscillator(),gain=context.createGain();
    const t=context.currentTime+.03;osc.type='triangle';osc.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),t);
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.17,t+.04);
    gain.gain.setTargetAtTime(.075,t+.18,.23);gain.gain.setTargetAtTime(0,t+.9,.08);
    osc.connect(gain);gain.connect(context.destination);
    osc.start(t);osc.stop(t+1.5);currentSource=osc;currentGain=gain;
  }
  async function play(requested,midi){
    const context=getCtx();
    // Resume is deliberately initiated inside the user's click handler (iOS Safari requirement).
    const waking=context.resume();
    stop();const ticket=requestId;
    await waking;
    const chosen=requested==='random'?(midi>=55&&Math.random()<.5?'violin':'piano'):requested;
    const instrument=chosen==='violin'&&midi<55?'piano':chosen;
    const changed=chosen!==instrument;
    let source='recording';
    if(midi>=60&&midi<=95){
      try{
        const decoded=await iowaSample(context,instrument,midi);
        if(ticket!==requestId)return null;
        const node=context.createBufferSource();const gain=context.createGain();
        node.buffer=decoded;gain.gain.value=.85;node.connect(gain);gain.connect(context.destination);
        node.onended=()=>{try{node.disconnect();gain.disconnect();}catch(e){}if(currentSource===node)currentSource=null;};
        node.start();currentSource=node;currentGain=gain;
        return {label:instrumentLabels[instrument],instrument,source,changed};
      }catch(e){/* File:// blocks fetch; or a pack is missing. The bundled preset still works. */}
    }
    if(ticket!==requestId)return null;
    try{
      const preset=await ensurePreset(context,instrument);
      if(ticket!==requestId)return null;
      player.cancelQueue(context);
      // WebAudioFont includes real sampled instrument zones, including the piano's low register.
      const envelope=player.queueWaveTable(context,context.destination,preset,0,midi,1.5,.55);
      if(!envelope)throw Error('Preset cannot play this pitch');
      source='soundfont';
    }catch(e){
      if(ticket!==requestId)return null;
      synthFallback(context,midi);
      source='synth';
    }
    return {label:instrumentLabels[instrument],instrument,source,changed};
  }
  root.ScoreAudio={play,stop};
})(window);
