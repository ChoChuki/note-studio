from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from pathlib import Path
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[1])))
Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}/')
    page.wait_for_function('window.ScoreAudio && document.querySelector("#score ellipse")')
    # Every available pitch and instrument goes through the actual browser decoding/playback path.
    result=page.evaluate('''async () => {let count=0;for(const [instrument,low] of [['piano',36],['violin',55]])for(let midi=low;midi<=95;midi++){let r=await ScoreAudio.play(instrument,midi);if(!r||r.instrument!==instrument||r.source!==(midi>=60?'recording':'sample'))throw Error(instrument+midi);count++;}const low=await ScoreAudio.play('violin',43);if(low.instrument!=='piano'||!low.changed)throw Error('fallback');ScoreAudio.stop();return count;}''')
    assert result==101
    # Instrument calls must not happen while muted, including keyboard replay.
    page.evaluate('''() => {window.playCalls=0;const orig=ScoreAudio.play;ScoreAudio.play=(...args)=>{window.playCalls++;return orig(...args)}}''')
    score=page.locator('#score').inner_html();page.locator('#sound-enabled').uncheck();assert page.locator('#score').inner_html()==score
    for lang in ['zh-CN','zh-TW','en','de','it','fr','ja','el']:
        page.locator('#language').select_option(lang)
        assert page.locator('#reveal-label').inner_text()==page.evaluate('(l)=>NoteI18n.get(l,"revealSilent")',lang)
    page.locator('#reveal').click();assert page.locator('#answer-content').is_visible();assert not page.locator('#play-row').is_visible()
    page.locator('body').click(position={'x':1,'y':1});page.keyboard.press('p');assert page.evaluate('playCalls')==0
    page.locator('#correct').click();assert page.locator('#all-answered').inner_text()=='1'
    page.reload();assert not page.locator('#sound-enabled').is_checked();assert page.locator('#all-answered').inner_text()=='1'
    page.locator('#sound-enabled').check();page.locator('#reveal').click();page.wait_for_function('document.querySelector("#audio-status").textContent && !document.querySelector("#audio-status").textContent.includes(NoteI18n.get(document.documentElement.lang,"audioPreparing"))');assert page.locator('#play-row').is_visible()
    page.locator('#sound-enabled').uncheck();assert not page.locator('#play-row').is_visible();assert page.locator('#audio-status').inner_text()==''
    assert not errors,errors
    print('PASS: 101 decoded audio files, low violin policy, 8 language mute labels, no playback when off, persisted mute/history, reenable and stop.')
    browser.close()
server.shutdown()
