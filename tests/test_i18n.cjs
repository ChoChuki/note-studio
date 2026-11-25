const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const i18n=require('../i18n.js');
const core=require('../music-core.js');
assert.deepEqual(i18n.LANGUAGES,['zh-CN','zh-TW','en','de','it','fr','ja','el']);
const base=Object.keys(i18n.DICT['zh-CN']);
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
for(const locale of i18n.LANGUAGES){
 assert.deepEqual(Object.keys(i18n.DICT[locale]).sort(),base.slice().sort());
 for(const match of html.matchAll(/data-i18n="([^"]+)"/g))assert.ok(i18n.DICT[locale][match[1]],`${locale} missing ${match[1]}`);
 for(let sig=-7;sig<=7;sig++){
  const label=i18n.keyName(locale,sig,core);
  assert.ok(label && !label.includes('undefined'),`${locale} invalid key signature ${sig}`);
 }
 for(const letter of 'ABCDEFG')for(const accidental of [-1,0,1]){
  const name=i18n.note(locale,letter,accidental,4);
  assert.ok(name && !name.includes('undefined'),`${locale} missing ${letter}, ${accidental}`);
 }
}
assert.equal(i18n.note('de','B',0,4),'H4');
assert.equal(i18n.note('de','B',-1,4),'B4');
assert.equal(i18n.note('de','B',1,4),'His4');
assert.equal(i18n.note('de','F',1,4),'Fis4');
assert.equal(i18n.note('ja','F',1,4),'ファ♯4');
assert.equal(i18n.note('fr','B',-1,4),'si♭4');
assert.equal(i18n.note('el','C',0,4),'Ντο4');
assert.equal(core.buildQuestion({clef:'treble',step:4,keySig:-1}).name,'B♭4');
console.log('PASS: 8 complete locale dictionaries; 15 keys × 8, 7 letters × 3 alterations × 8; German H/B and locale names');
