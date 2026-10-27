# 生成“可跳关的完整版”：dist/十年回响-可跳关版.html（不上线，存档独立）
# 用法：在仓库根目录运行 python3 skip/build_skip.py
import os,subprocess
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
subprocess.run(['python3','tools/build_offline.py'],check=True)
h=open('dist/十年回响-离线版.html',encoding='utf8').read()
for a,b in [("'reverb2036-progress-v3'","'reverb2036-skip-progress'"),("'reverb2036-gallery'","'reverb2036-skip-gallery'")]:
    assert a in h,a; h=h.replace(a,b)
h=h.replace('</body>','<script>\n'+open('skip/skip.js',encoding='utf8').read()+'\n</script>\n</body>')
open('dist/十年回响-可跳关版.html','w',encoding='utf8').write(h)
print('skip KB',len(h.encode())//1024)
