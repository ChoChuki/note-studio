# 第三方素材与许可

本项目的音频素材取自用户上传的 `Violin_Ear_Trainer_v2_5_0_GitHub.zip` 与 `Pitch_Trainer_Mobile_v21_0_GitHub.zip`，未使用互联网下载新的音频。

- **University of Iowa Musical Instrument Samples**，Lawrence Fritts / University of Iowa Electronic Music Studios：`ap-audio` 中的 72 段原声（钢琴及弓奏小提琴，C4–B6），包含来源 URL、处理与质量信息，详见 `ap-audio/README.md`、`sources.json`、`quality.json`。来源网站声明可不受限制下载及用于项目：https://theremin.music.uiowa.edu/MIS.html。录音是自动质量检查的原型素材，尚未全部完成人耳试听验收。
- **WebAudioFontPlayer**，Surikov，GPL-3.0。浏览器播放引擎 `vendor/WebAudioFontPlayer.js`，许可文本位于 `vendor/WebAudioFont-LICENSE.txt`。源代码与项目：https://github.com/surikov/webaudiofont。分发时须遵守 GPL-3.0，包括相应源代码提供义务。
- **JCLive SoundFont** 音色预设：`vendor/0000_JCLive_sf2_file.js`（钢琴）、`vendor/0400_JCLive_sf2_file.js`（小提琴），来自 https://github.com/surikov/webaudiofontdata，MIT 许可文本位于 `vendor/Soundfont-LICENSE.txt`。
- **Noto Music**，Google，SIL Open Font License 1.1。`symbol-paths.js` 内的谱号和升降号 SVG 图形由 Noto Music 的少量字形轮廓导出（未分发字体文件）。许可说明：https://openfontlicense.org/ ，项目：https://github.com/notofonts/music 。本仓库另附 `vendor/NotoMusic-OFL.txt`。

本项目新增的 HTML、CSS、应用逻辑为供个人学习和继续开发的源代码。由于完整分发包包含 GPL-3.0 播放组件，重新分发完整组合时应按照 GPL-3.0 履行相关条件。
