const assert=require('node:assert/strict');
const c=require('../music-core.js');
const eq=(q,midi,name)=>{assert.equal(q.midi,midi);assert.equal(q.name,name);};
eq(c.buildQuestion({clef:'treble',step:0}),64,'E4');
eq(c.buildQuestion({clef:'treble',step:2}),67,'G4');
eq(c.buildQuestion({clef:'treble',step:-2}),60,'C4');
eq(c.buildQuestion({clef:'bass',step:0}),43,'G2');
eq(c.buildQuestion({clef:'bass',step:2}),47,'B2');
eq(c.buildQuestion({clef:'bass',step:8}),57,'A3');
eq(c.buildQuestion({clef:'treble',step:8,keySig:1}),78,'F♯5');
eq(c.buildQuestion({clef:'bass',step:6,keySig:1}),54,'F♯3');
eq(c.buildQuestion({clef:'treble',step:4,keySig:-1}),70,'B♭4');
eq(c.buildQuestion({clef:'treble',step:4,keySig:-1,accidental:0}),71,'B4');
eq(c.buildQuestion({clef:'treble',step:4,keySig:-1,accidental:1}),72,'B♯4');
eq(c.buildQuestion({clef:'treble',step:1,keySig:7}),66,'F♯4');
eq(c.buildQuestion({clef:'treble',step:1,keySig:-7}),64,'F♭4');
assert.deepEqual(c.CLEFS.treble.sharpSteps,[8,5,9,6,3,7,4]);
assert.deepEqual(c.CLEFS.bass.flatSteps,[2,5,1,4,0,3,-1]);
for(let clef of ['treble','bass']){
 for(let step=-4;step<=14;step++){
  const plain=c.fromStep(clef,step);
  for(let sig=-7;sig<=7;sig++){
   for(let acc of [null,-1,0,1]){
    const q=c.buildQuestion({clef,step,keySig:sig,accidental:acc});
    const expected=acc===null?c.keyAlteration(plain.letter,sig):acc;
    assert.equal(q.midi,c.toMidi(plain.letter,plain.octave,expected));
    assert.equal(q.letter,plain.letter);
   }
  }
 }
}
for(let setting of [
 {clef:'both',keys:'two',range:'basic',accidentals:false},
 {clef:'both',keys:'all',range:'wide',accidentals:true},
 {clef:'bass',keys:'none',range:'wide',accidentals:false}
]){
 let last=null;
 for(let i=0;i<300;i++){
  const q=c.generate(setting,last);
  assert.ok(q.midi>=36&&q.midi<=95);
  if(!setting.accidentals)assert.equal(q.accidental,null);
  if(setting.clef!=='both')assert.equal(q.clef,setting.clef);
  assert.ok(c.allowedKeys(setting.keys).includes(q.keySig));
  last=q;
 }
}
console.log('PASS: 2 clefs × 19 staff steps × 15 key signatures × 4 accidental variants, plus 900 generated questions');
