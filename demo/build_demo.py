# 生成课堂演示版：dist/十年回响-课堂演示版.html（只用于课堂演示，不上线）
# 用法：在仓库根目录运行 python3 demo/build_demo.py
import os,subprocess
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
subprocess.run(['python3','tools/build_offline.py'],check=True)
h=open('dist/十年回响-离线版.html',encoding='utf8').read()
h=h.replace("'reverb2036-progress-v3'","'reverb2036-demo-progress'").replace("'reverb2036-gallery'","'reverb2036-demo-gallery'")
h=h.replace('<title>十年回响</title>','<title>十年回响 · 课堂演示版</title>')
h=h.replace('</body>','<script>\n'+open('demo/demo.js',encoding='utf8').read()+'\n</script>\n</body>')
open('dist/十年回响-课堂演示版.html','w',encoding='utf8').write(h)
subprocess.run(['git','checkout','--','sw.js','dist/十年回响-离线版.html'],stderr=subprocess.DEVNULL)
print('demo KB',len(h.encode())//1024)
