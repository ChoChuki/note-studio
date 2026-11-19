(function(){
'use strict';
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
// Keep v1 storage keys to preserve the existing collection of practice records.
const SETTINGS_KEY='note-studio-settings-v1',HISTORY_KEY='note-studio-history-v1',LANGUAGE_KEY='note-studio-language-v2';
const defaults={clef:'both',keys:'two',range:'basic',instrument:'piano',accidentals:false};
function loadJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch(e){return fallback;}}
let settings={...defaults,...loadJSON(SETTINGS_KEY,{})};
let history=loadJSON(HISTORY_KEY,[]);
if(!Array.isArray(history))history=[];
let language=loadJSON(LANGUAGE_KEY,'zh-CN');
if(!NoteI18n.LANGUAGES.includes(language))language='zh-CN';
let round={correct:0,answered:0},question,ordinal=0,revealed=false,judged=false;
let audioState={state:'none',info:null};
const t=(key,values)=>NoteI18n.get(language,key,values);
function save(key,data){try{localStorage.setItem(key,JSON.stringify(data));}catch(e){$('audio-status').textContent=t('storageError');}}
function svgTag(tag,attributes={},parent=$('score')){
  const node=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
  parent.appendChild(node);return node;
}
function musicalGlyph(kind,x,y,scale){
  return svgTag('path',{d:window.MUSIC_SYMBOLS[kind],fill:'#303d3b',transform:`translate(${x} ${y}) scale(${scale} ${-scale})`});
}
function clefTitle(clef){return t(clef==='treble'?'clefTreble':'clefBass');}
function signatureTitle(q){
  return q.keySig===0?t('noSignature'):
    t('keyCount',{n:Math.abs(q.keySig),kind:t(q.keySig>0?'sharpWord':'flatWord'),plural:Math.abs(q.keySig)>1?'s':''});
}
function renderStaff(q){
  const score=$('score');score.replaceChildren();
  score.setAttribute('aria-label',t('scoreAria',{clef:clefTitle(q.clef),signature:signatureTitle(q)}));
  const bottom=216,stepHeight=13,noteX=526;
  for(let i=0;i<5;i++)svgTag('line',{x1:48,y1:bottom-i*26,x2:709,y2:bottom-i*26,class:'score-staff'});
  if(q.clef==='treble')musicalGlyph('treble',62,212,.115);
  else musicalGlyph('bass',65,216,.114);
  const steps=q.keySig>0?ScoreCore.CLEFS[q.clef].sharpSteps:ScoreCore.CLEFS[q.clef].flatSteps;
  const glyph=q.keySig>0?'sharp':'flat';
  for(let i=0;i<Math.abs(q.keySig);i++)drawAccidental(glyph,161+i*36,bottom-steps[i]*stepHeight,true);
  const y=bottom-q.step*stepHeight;
  for(let s=-2;s>=q.step;s-=2)svgTag('line',{x1:noteX-22,x2:noteX+24,y1:bottom-s*stepHeight,y2:bottom-s*stepHeight,class:'score-ledger'});
  for(let s=10;s<=q.step;s+=2)svgTag('line',{x1:noteX-22,x2:noteX+24,y1:bottom-s*stepHeight,y2:bottom-s*stepHeight,class:'score-ledger'});
  if(q.accidental!==null)drawAccidental(q.accidental===0?'natural':q.accidental===1?'sharp':'flat',noteX-53,y,false);
  if(q.step>=4)svgTag('line',{x1:noteX-11,x2:noteX-11,y1:y+1,y2:y+73,stroke:'#273b38','stroke-width':2.6});
  else svgTag('line',{x1:noteX+11,x2:noteX+11,y1:y-1,y2:y-74,stroke:'#273b38','stroke-width':2.6});
  svgTag('ellipse',{cx:noteX,cy:y,rx:13.4,ry:9.05,fill:'#253a37',transform:`rotate(-21 ${noteX} ${y})`});
}
function drawAccidental(kind,x,noteY,isKey){
  const scale=kind==='sharp'?.072:kind==='flat'?.098:.091;
  const referenceY=kind==='sharp'?155:kind==='flat'?83:kind==='natural'?88:0;
  musicalGlyph(kind,x,noteY+referenceY*scale,scale);
}
function applySettings(){
  for(const box of document.querySelectorAll('[data-setting]')){
    for(const button of box.querySelectorAll('button'))button.setAttribute('aria-pressed',String(settings[box.dataset.setting]===button.dataset.value));
  }
  $('accidentals').checked=!!settings.accidentals;
}
function summarizeWeak(){
  const subset=history.slice(-100),freq={};
  for(const item of subset){
    if(!freq[item.letter])freq[item.letter]={correct:0,total:0};
    freq[item.letter].total++;freq[item.letter].correct+=item.correct?1:0;
  }
  const candidates=Object.entries(freq).filter(([,stat])=>stat.total>=2)
    .sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total)||b[1].total-a[1].total);
  const first=candidates[0];
  const label=first&&first[1].correct<first[1].total
    ?`${first[0]} (${t('wrongCount',{n:first[1].total-first[1].correct})})`:'—';
  return {weak:freq,label};
}
function updateStats(){
  $('session-answered').textContent=round.answered;
  $('session-accuracy').textContent=round.answered?Math.round(round.correct/round.answered*100)+'%':'—';
  $('all-answered').textContent=history.length;
  $('weakest').textContent=summarizeWeak().label;
}
function explanation(q){
  const pos=t('position',{clef:clefTitle(q.clef),note:`${q.letter}${q.octave}`});
  let change;
  if(q.accidental!==null){
    const sign=t(q.accidental===0?'naturalSign':q.accidental===1?'sharpSign':'flatSign');
    change=t('override',{sign,name:q.name});
  }else if(q.keyAcc!==0){
    change=t('keyAlters',{letter:q.letter,note:`${q.letter}${q.keyAcc>0?'♯':'♭'}`});
  }else change=t('keyUnaltered');
  return `${pos} ${change} ${t('keyIntro',{key:NoteI18n.keyName(language,q.keySig,ScoreCore)})}`;
}
function refreshQuestionLabels(){
  if(!question)return;
  $('question-counter').textContent=t('questionCount',{n:String(ordinal).padStart(2,'0')});
  $('clef-label').textContent=clefTitle(question.clef);
  $('key-hint').textContent=signatureTitle(question);
  $('score').setAttribute('aria-label',t('scoreAria',{clef:clefTitle(question.clef),signature:signatureTitle(question)}));
  if(revealed){
    $('answer-name').textContent=question.name;
    $('answer-letter').textContent=t('baseLetter',{letter:question.letter});
    $('answer-explain').textContent=explanation(question);
    $('localized-note').textContent=`${t('localNameLabel')}: ${NoteI18n.note(language,question.letter,question.effective,question.octave)}`;
    $('localized-note').hidden=false;
  }
  renderAudioState();
}
function changeLanguage(lang){
  if(!NoteI18n.LANGUAGES.includes(lang))return;
  language=lang;
  save(LANGUAGE_KEY,language);
  document.documentElement.lang=language;
  document.title=t('title');
  $('language').value=language;
  $('sidebar').setAttribute('aria-label',t('sidebarAria'));
  for(const node of document.querySelectorAll('[data-i18n]'))node.textContent=t(node.dataset.i18n);
  refreshQuestionLabels();
  updateStats();
}
function chooseQuestion(){
  ScoreAudio.stop();
  const previous=question;
  question=ScoreCore.generate(settings,previous,summarizeWeak().weak);
  ordinal++;revealed=false;judged=false;
  audioState={state:'none',info:null};
  $('answer-placeholder').hidden=false;
  $('answer-content').hidden=true;
  $('localized-note').hidden=true;
  $('answer-card').style.background='';
  $('answer-placeholder').style.display='flex';
  $('answer-name').textContent='';
  $('reveal').hidden=false;
  $('judgment').hidden=true;
  $('next').hidden=true;
  for(const id of ['correct','wrong']){$(id).disabled=false;$(id).classList.remove('selected');}
  renderStaff(question);
  refreshQuestionLabels();
}
function renderAudioState(){
  const status=$('audio-status');
  if(audioState.state==='none')status.textContent='';
  else if(audioState.state==='loading')status.textContent=t('audioPreparing');
  else if(audioState.state==='failed')status.textContent=t('audioError');
  else if(audioState.state==='playing' && audioState.info){
    const info=audioState.info;
    const instrument=t(info.instrument==='violin'?'violin':'piano');
    const source=t(info.source==='recording'?'recording':info.source==='soundfont'?'soundfont':'synth');
    status.textContent=`${instrument} · ${source}${info.changed?t('lowViolin'):''}`;
  }
}
async function listen(){
  if(!revealed)return;
  const token=question;
  audioState={state:'loading',info:null};renderAudioState();
  try{
    const info=await ScoreAudio.play(settings.instrument,question.midi);
    if(token!==question||!info)return;
    audioState={state:'playing',info};renderAudioState();
  }catch(e){if(token===question){audioState={state:'failed',info:null};renderAudioState();}}
}
function reveal(){
  if(revealed)return;
  revealed=true;
  $('answer-placeholder').hidden=true;
  $('answer-placeholder').style.display='none';
  $('answer-content').hidden=false;
  $('answer-card').style.background='#f1f6f1';
  $('reveal').hidden=true;
  $('judgment').hidden=false;
  $('next').hidden=false;
  refreshQuestionLabels();
  listen();
}
function mark(correct){
  if(!revealed||judged)return;
  judged=true;
  round.answered++;if(correct)round.correct++;
  history.push({time:new Date().toISOString(),clef:question.clef,keySig:question.keySig,
    step:question.step,accidental:question.accidental,letter:question.letter,name:question.name,
    midi:question.midi,correct,mode:{...settings}});
  if(history.length>5000)history=history.slice(-5000);
  save(HISTORY_KEY,history);
  $('correct').disabled=true;$('wrong').disabled=true;
  $(correct?'correct':'wrong').disabled=false;
  $(correct?'correct':'wrong').classList.add('selected');
  updateStats();
}
document.querySelectorAll('[data-setting] button').forEach(button=>button.addEventListener('click',()=>{
  const setting=button.closest('[data-setting]').dataset.setting;
  settings[setting]=button.dataset.value;
  applySettings();save(SETTINGS_KEY,settings);
  if(setting!=='instrument')chooseQuestion();
}));
$('language').addEventListener('change',e=>changeLanguage(e.target.value));
$('accidentals').addEventListener('change',e=>{
  settings.accidentals=e.target.checked;save(SETTINGS_KEY,settings);chooseQuestion();
});
$('reveal').addEventListener('click',reveal);
$('replay').addEventListener('click',listen);
$('correct').addEventListener('click',()=>mark(true));
$('wrong').addEventListener('click',()=>mark(false));
$('next').addEventListener('click',chooseQuestion);
$('export').addEventListener('click',()=>{
  const file=new Blob([JSON.stringify({app:'Note Studio',version:2,exportedAt:new Date().toISOString(),language,settings,history},null,2)],{type:'application/json'});
  const link=document.createElement('a');link.href=URL.createObjectURL(file);link.download='note-studio-history.json';
  link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
$('reset').addEventListener('click',()=>{
  if(!window.confirm(t('resetConfirm')))return;
  history=[];round={correct:0,answered:0};save(HISTORY_KEY,history);updateStats();
});
document.addEventListener('keydown',event=>{
  if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
  if(['BUTTON','INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  if(event.code==='Space'){event.preventDefault();reveal();}
  else if(event.key==='1'){mark(true);}
  else if(event.key==='2'){mark(false);}
  else if(event.key==='Enter'&&revealed){chooseQuestion();}
  else if(event.key.toLowerCase()==='p'&&revealed){listen();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)ScoreAudio.stop();});
applySettings();changeLanguage(language);updateStats();chooseQuestion();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
})();
