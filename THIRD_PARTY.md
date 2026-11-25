# 第三方素材与许可

- **University of Iowa Musical Instrument Samples**：`ap-audio/` 内的 72 段 C4–B6 钢琴和弓奏小提琴录音，原样复用 Pitch Trainer Mobile v21.0 与 Violin Ear Trainer v2.5.0 的相同音源文件。详见 `ap-audio/README.md`、`sources.json`、`quality.json`；来源许可：https://theremin.music.uiowa.edu/MIS.html 。自动质量检查通过，但尚未完成全部人工试听。
- **JCLive 原声乐器采样**：`ap-audio/lower/` 中 29 个 WAV，直接取自 Word_AP_Parasite_v1_6_13 的原有钢琴与小提琴 WAV，未修改字节。属于原声乐器采样，不是每音独立录音。源文件路径和 SHA-256 见 `ap-audio/lower/sources.json`，MIT 许可见 `ap-audio/lower/LICENSE.txt`。
- **Noto Music**，Google，SIL Open Font License 1.1。`symbol-paths.js` 内谱号和升降号 SVG 轮廓来自 Noto Music，未分发字体文件。许可见 `vendor/NotoMusic-OFL.txt`。

本版不包含 WebAudioFontPlayer、运行时 SoundFont 预设或振荡器合成音。
