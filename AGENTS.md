# 给 AI 助手（Codex、Claude 等）的说明

这个仓库是小组课程作业《十年回响》，一个在浏览器里玩的音乐游戏。组员大多不写代码，会用“游戏里的说法”提需求，比如“第一关房东那张卡的选项改一下”“第三关的背景音乐太吵”。请你根据下面的对照表，自己找到对应的代码再修改。

## 游戏里的说法 → 去哪里改

| 组员会这样说 | 对应位置 |
| --- | --- |
| 第一关的卡片、题目、选项、数值变化 | `js/data.js` 里的 `CARDS`（写法见 `docs/卡片写作规范.md`） |
| 标着“真实故事改编”的卡 | `CARDS` 里带 `real` 字段的卡；出处列在 `docs/真实案例来源.md` |
| 第一关的“意外” | `js/data.js` 里的 `SURPRISES` |
| 每年的生活成本、名气和热爱的自然下降 | `js/game.js` 的 `yearBreak` |
| 耳机延迟校准 | `js/game.js` 的 `calibrate` |
| 选“他”或“她”时出现的题目 | `js/data.js` 里的 `GCARDS.he` / `GCARDS.she` |
| 每年的音乐关卡（演出、调弦、听音、稳拍、人机辨听）的开场对话 | `js/data.js` 里的 `MINIS` |
| 音乐关卡本身的玩法、评分 | `js/game.js` 里的 `rhythm`、`tune`、`memory`、`tempoGame`、`aiTest` |
| 红框的“人生岔路” | `js/data.js` 里的 `CRISIS` |
| 第一关的 19 种结局、结局文字 | `js/data.js` 里的 `ENDINGS` 和 `finalEnding` |
| 开局选的理想音乐人、音乐占几成 | `js/data.js` 里的 `IDEALS`、`MUSIC_SHARE` |
| 第二关：调音婆婆、塔罗牌、三个问题、签文 | `js/data.js` 里的 `TAROT`、`SOUL_Q`、`HURDLES`、`NOUN`、`ADJ`；流程在 `js/levels.js` 的 `startL2` 到 `l2Fortune` |
| 第二关的命运旋律 | `js/levels.js` 的 `fateMelody` |
| 第三关：七个身份、七个要求、三个版本的音乐 | `js/data.js` 的 `L3_ROLES`、`L3_EVENTS`；音乐片段和题目在 `js/levels.js` 的 `TASKS` |
| 第四关：回望、四个问题、写 4 个音、管弦乐 | `js/levels.js` 的 `startL4`、`l4Questions`、`orchFinale` |
| 画像的分享海报 | `js/levels.js` 的 `makePoster` |
| 最后的音乐人格画像、身份光谱、建议 | 文字在 `js/data.js` 的 `TRAITS`、`ADVICE`、`DOMAINS`；排版在 `js/levels.js` 的 `buildPortrait`、`showPortrait`、`identSection` |
| 某一关的背景音乐、某种乐器的音色、每年新加的乐器 | `js/audio.js` 的 `STYLES` 和各个乐器函数；第一关每年加哪种乐器在 `js/data.js` 的 `UNLOCK` |
| 主页和开局几页的开场音乐（轻快 chill） | `js/audio.js` 的 `STYLES.chill`；什么时候播放在 `js/game.js` 的 `homeMusic` |
| 主页、关卡说明、开始前的提醒 | `index.html` |
| 颜色、字体、大小、排版 | `style.css` |

## 修改规矩（每次都要遵守）

1. **改之前先拉取最新版本**（`git pull`），组员可能刚推送过。
2. **只改和这次需求有关的地方**，不要顺手重构、改名或格式化整个文件，否则别的组员很容易冲突。
3. **每张卡都必须有唯一的 `id`**（比如 `id: 'k62'`，真实故事用 `r-` 开头，意外用 `u-` 开头）。可以插在任何位置，也可以删除；但**不要修改已有卡的 id，也不要复用已删掉的 id**，否则玩家存档会错乱。写卡片之前请先读 `docs/卡片写作规范.md`。
4. 卡片的心理标签 `k` 只能用这 11 个：`ideal money auth approval risk secure ai bond avoid fight burn`。
5. 所有文字用简体中文，语气和现有卡片保持一致：短句、具体、两个选项都要有代价。
6. **改完至少检查一次语法**：`node --check js/文件名.js`。能开浏览器的话，打开 `index.html` 玩一下改动的部分。
7. 提交说明用中文，写清楚改了什么，比如“第一关：修改房东卡的选项文字”。
8. **提交时不要加 AI 的共同作者署名**（不要加 `Co-Authored-By` 之类的行），作者保持是组员自己。
9. 改完推送到 `main` 分支。如果推送时提示有冲突，先拉取、合并，保留双方的修改，不要强制推送（不要用 `--force`）。
10. **如果改动了存档里会记录的数据结构**（比如关卡流程、`PROG` 里的字段），把 `js/game.js` 里的 `SAVE_VERSION` 加 1，旧存档会提示玩家重新开始。只改文案不需要。
11. **改完游戏文件后，把 `sw.js` 里的 `VERSION` 加 1**，否则已经“安装到桌面”的玩家可能还在用旧缓存。
12. 新文案里如果用到了以前没出现过的汉字，可以运行 `python3 tools/build_fonts.py` 重新生成字体（需要联网下载字体包）；不运行也能玩，新字会用系统字体显示。

## 技术说明

- 纯静态网页，没有构建步骤，没有依赖。直接双击 `index.html` 就能运行。
- 所有声音由 Web Audio 实时合成，没有音频文件。
- 进度存在浏览器的 localStorage 里（键名 `reverb2036-progress-v3`，里面的 `v` 是存档版本）。
- 字体在 `fonts/` 和 `fonts.css`，已经下载到本地，只保留了游戏里用到的字，不依赖 Google Fonts。
- `manifest.json` 和 `sw.js` 让游戏可以“安装到桌面”，并且离线可玩。
- `dist/十年回响-离线版.html` 是一个单文件离线版，字体和代码都打包在里面，双击就能玩，不需要网络。用 `python3 tools/build_offline.py` 生成。
- 线上试玩地址：https://mayciosher.github.io/reverb-2036/ （GitHub Pages，推送到 main 后一两分钟自动更新）。
