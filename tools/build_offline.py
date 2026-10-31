# 生成发布文件：
# 1. 更新 sw.js 里的离线缓存文件列表
# 2. 生成 dist/十年回响-离线版.html：字体、样式、代码全部打包进一个文件，双击就能玩，不需要网络
# 用法：在仓库根目录运行 python3 tools/build_offline.py
import os,re,glob,json,base64
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
files=['./','index.html','style.css','fonts.css','manifest.json','icons/icon-192.png','icons/icon-512.png']+sorted(glob.glob('js/*.js'))+sorted(glob.glob('js/vendor/*.js'))+sorted(glob.glob('fonts/*.woff2'))
sw=open('sw.js',encoding='utf8').read()
sw=re.sub(r'const FILES = \[.*?\];','const FILES = '+json.dumps(files,ensure_ascii=False)+';',sw,flags=re.S)
open('sw.js','w',encoding='utf8').write(sw)
fonts=open('fonts.css',encoding='utf8').read()
fonts=re.sub(r"url\(fonts/([^)]+)\)",lambda m:"url(data:font/woff2;base64,"+base64.b64encode(open('fonts/'+m.group(1),'rb').read()).decode()+")",fonts)
h=open('index.html',encoding='utf8').read()
body=h[h.index('<body')+len('<body data-screen="hub">'):h.index('<script src="js/vendor/three.min.js">')]
icon='data:image/png;base64,'+base64.b64encode(open('icons/icon-192.png','rb').read()).decode()
three=open('js/vendor/three.min.js',encoding='utf8').read()
js='\n'.join(open('js/'+f,encoding='utf8').read() for f in ['audio.js','data.js','game.js','levels.js','motion.js','titles.js','alarm.js','scene.js'])
out=f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>十年回响</title>
<link rel="icon" href="{icon}">
<style>
{fonts}
{open('style.css',encoding='utf8').read()}
</style>
</head>
<body data-screen="hub">
{body}<script>
{three}
</script>
<script>
{js}
</script>
</body>
</html>
'''
os.makedirs('dist',exist_ok=True)
open('dist/十年回响-离线版.html','w',encoding='utf8').write(out)
print('sw files',len(files),'offline KB',len(out.encode())//1024)
