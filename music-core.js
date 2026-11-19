/* Pure musical notation logic; browser global + Node tests. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ScoreCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const LETTERS=['C','D','E','F','G','A','B'];
  const NATURAL_PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const SHARP_ORDER=['F','C','G','D','A','E','B'];
  const FLAT_ORDER=['B','E','A','D','G','C','F'];
  const SIG_LABELS={
    '-7':['C♭','a♭'],'-6':['G♭','e♭'],'-5':['D♭','b♭'],
    '-4':['A♭','f'],'-3':['E♭','c'],'-2':['B♭','g'],'-1':['F','d'],
     '0':['C','a'], '1':['G','e'],'2':['D','b'],'3':['A','f♯'],
     '4':['E','c♯'],'5':['B','g♯'],'6':['F♯','d♯'],'7':['C♯','a♯']
  };
  const CLEFS={
    treble:{bottomDiatonic:4*7+2,baseBounds:[-2,9],wideBounds:[-5,13],title:'高音谱号',sharpSteps:[8,5,9,6,3,7,4],flatSteps:[4,7,3,6,2,5,1]},
    bass:{bottomDiatonic:2*7+4,baseBounds:[0,9],wideBounds:[-4,14],title:'低音谱号',sharpSteps:[6,3,7,4,1,5,2],flatSteps:[2,5,1,4,0,3,-1]}
  };
  function fromStep(clef,step){
    if(!CLEFS[clef])throw Error('Invalid clef');
    const value=CLEFS[clef].bottomDiatonic+step;
    const octave=Math.floor(value/7),letter=LETTERS[((value%7)+7)%7];
    return {letter,octave,step};
  }
  function keyAlteration(letter,keySig){
    if(keySig>0)return SHARP_ORDER.slice(0,keySig).includes(letter)?1:0;
    if(keySig<0)return FLAT_ORDER.slice(0,-keySig).includes(letter)?-1:0;
    return 0;
  }
  function toMidi(letter,octave,accidental){
    return (octave+1)*12+NATURAL_PC[letter]+accidental;
  }
  function toName(letter,octave,accidental){
    return letter+(accidental===1?'♯':accidental===-1?'♭':'')+octave;
  }
  function keyLabel(n){
    const label=SIG_LABELS[n];
    return label ? `${label[0]} 大调 · ${label[1]} 小调`:'';
  }
  function allowedKeys(mode){
    if(mode==='none')return [0];
    const count=mode==='two'?2:mode==='four'?4:7;
    return Array.from({length:count*2+1},(_,i)=>i-count);
  }
  function buildQuestion({clef,step,keySig=0,accidental=null}){
    if(!CLEFS[clef] || !Number.isInteger(step) || !Number.isInteger(keySig) || keySig<-7 || keySig>7)throw Error('Invalid question');
    const note=fromStep(clef,step);
    if(accidental!==null && ![-1,0,1].includes(accidental))throw Error('Invalid accidental');
    const keyAcc=keyAlteration(note.letter,keySig);
    const effective=accidental===null?keyAcc:accidental;
    const midi=toMidi(note.letter,note.octave,effective);
    return {clef,step,keySig,accidental, ...note,keyAcc,effective,midi,
      name:toName(note.letter,note.octave,effective),
      spelling:note.letter+(effective===1?'♯':effective===-1?'♭':''),
      keyLabel:keyLabel(keySig),
      signatureDescription:keySig===0?'无升降记号':`${Math.abs(keySig)} 个${keySig>0?'升':'降'}号`,
      source:accidental===null?(keyAcc===0?'自然音':'调号决定'):'临时记号决定'};
  }
  function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
  function generate(settings={},last=null,weak={}){
    const clefs=settings.clef==='both'?['treble','bass']:[settings.clef||'treble'];
    const keys=allowedKeys(settings.keys||'two');
    const options=[];
    for(const clef of clefs){
      const b=CLEFS[clef][settings.range==='wide'?'wideBounds':'baseBounds'];
      for(let step=b[0];step<=b[1];step++){
        const n=fromStep(clef,step);
        for(const keySig of keys){
          const defaultAcc=keyAlteration(n.letter,keySig);
          const alterations=[null];
          if(settings.accidentals){
            // Allow natural signs and either accidental different from the key signature.
            for(const a of [-1,0,1])if(a!==defaultAcc)alterations.push(a);
          }
          for(const accidental of alterations){
            const q=buildQuestion({clef,step,keySig,accidental});
            if(q.midi<36||q.midi>95)continue;
            // keep accidentals uncommon, but present in advanced mode
            let weight=accidental===null?7:1.15;
            if(last && q.clef===last.clef)weight*=.53;
            if(last && q.letter===last.letter)weight*=.35;
            if(last && q.keySig===last.keySig)weight*=.72;
            if(last && q.midi===last.midi)weight*=.15;
            const stat=weak[q.letter];
            if(stat && stat.total>=2){weight*=1+0.75*(1-stat.correct/stat.total);}
            options.push({q,weight});
          }
        }
      }
    }
    const total=options.reduce((a,o)=>a+o.weight,0);
    let choice=Math.random()*total;
    for(const option of options){
      choice-=option.weight;
      if(choice<0)return option.q;
    }
    return options[options.length-1].q;
  }
  return {LETTERS,CLEFS,SIG_LABELS,SHARP_ORDER,FLAT_ORDER,fromStep,keyAlteration,toMidi,toName,keyLabel,allowedKeys,buildQuestion,generate};
});
