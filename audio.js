/* Original Iowa per-note recordings; lower pitches use existing Word × Pitch acoustic sample WAVs. No synthesizer or runtime pitch shifting. */
(function(root){
  'use strict';
  const Ctor=root.AudioContext||root.webkitAudioContext;
  let ctx,currentSource=null,currentGain=null,requestId=0;
  const cache=new Map();
  function getCtx(){if(!ctx){if(!Ctor)throw Error('Audio unavailable');ctx=new Ctor();}return ctx;}
  function memo(key,fn){if(!cache.has(key))cache.set(key,Promise.resolve().then(fn).catch(err=>{cache.delete(key);throw err;}));return cache.get(key);}
  async function fetchFile(name,type){
    const res=await fetch('./ap-audio/'+name);
    if(!res.ok)throw Error('Audio request failed');
    return type==='json'?res.json():res.arrayBuffer();
  }
  function chooseInstrument(requested,midi){
    const chosen=requested==='random'?(midi>=55&&Math.random()<.5?'violin':'piano'):requested;
    const instrument=chosen==='violin'&&midi<55?'piano':chosen;
    return {instrument,changed:chosen!==instrument,source:midi>=60?'recording':'sample'};
  }
  async function sample(context,instrument,midi){
    if(midi<36||midi>95)throw Error('Recording unavailable');
    if(midi<60){
      const file=`lower/${instrument}/${midi}.wav`;
      return memo(file,async()=>context.decodeAudioData(await fetchFile(file)));
    }
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
    if(currentSource){try{currentSource.stop();}catch(e){}try{currentSource.disconnect();}catch(e){}currentSource=null;}
    if(currentGain){try{currentGain.disconnect();}catch(e){}currentGain=null;}
  }
  async function play(requested,midi){
    stop();const ticket=requestId;
    const context=getCtx();
    // Resume directly from the user's gesture for Safari.
    const waking=context.resume();
    const info=chooseInstrument(requested,midi);
    try{
      await waking;
      if(ticket!==requestId)return null;
      const decoded=await sample(context,info.instrument,midi);
      if(ticket!==requestId)return null;
      const node=context.createBufferSource(),gain=context.createGain();
      node.buffer=decoded;gain.gain.value=.85;node.connect(gain);gain.connect(context.destination);
      node.onended=()=>{try{node.disconnect();gain.disconnect();}catch(e){}if(currentSource===node){currentSource=null;currentGain=null;}};
      node.start();currentSource=node;currentGain=gain;
      return info;
    }catch(e){if(ticket!==requestId)return null;throw e;}
  }
  root.ScoreAudio={play,stop,chooseInstrument};
})(window);
