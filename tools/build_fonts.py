# 重新生成本地字体：统计游戏里用到的所有字，只保留这些字，输出到 fonts/ 和 fonts.css
# 用法：在仓库根目录运行 python3 tools/build_fonts.py
# 需要：Node.js（用 npm 下载字体包）、pip install fonttools brotli
import re,os,sys,glob,subprocess,tempfile,tarfile
from fontTools import subset
from fontTools.ttLib import TTFont
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=sys.argv[1] if len(sys.argv)>1 else tempfile.mkdtemp()
PKGS={'fontsource-noto-sans-sc-5.3.1':'@fontsource/noto-sans-sc@5.3.1','fontsource-zcool-qingke-huangyou-5.3.0':'@fontsource/zcool-qingke-huangyou@5.3.0','fontsource-ibm-plex-mono-5.3.0':'@fontsource/ibm-plex-mono@5.3.0',
      'fontsource-zhi-mang-xing':'@fontsource/zhi-mang-xing','fontsource-zcool-kuaile':'@fontsource/zcool-kuaile','fontsource-orbitron':'@fontsource/orbitron','fontsource-playfair-display':'@fontsource/playfair-display'}
for d,spec in PKGS.items():
    if not os.path.isdir(os.path.join(D,d,'package')):
        out=subprocess.run(['npm','pack','-q',spec],cwd=D,check=True,capture_output=True,text=True).stdout.strip().splitlines()[-1]
        os.makedirs(os.path.join(D,d),exist_ok=True); tarfile.open(os.path.join(D,out)).extractall(os.path.join(D,d))
OUT=os.path.join(REPO,'fonts')
os.makedirs(OUT,exist_ok=True)
for f in glob.glob(OUT+'/*'): os.remove(f)
text=''
for p in ['index.html','style.css']+glob.glob(REPO+'/js/*.js'):
    text+=open(os.path.join(REPO,p) if not p.startswith('/') else p,encoding='utf8').read()
used=set(ord(c) for c in text)|set(range(0x20,0x7f))|{0x3000,0xff0c,0x3002,0xff1a,0xff1b,0xff01,0xff1f,0x201c,0x201d,0x300c,0x300d,0x2014,0x2026,0xb7}
def parse_range(r):
    s=set()
    for part in r.split(','):
        part=part.strip().replace('U+','')
        if '-' in part: a,b=part.split('-'); s.update(range(int(a,16),int(b,16)+1))
        elif '?' in part: a=int(part.replace('?','0'),16); b=int(part.replace('?','f'),16); s.update(range(a,b+1))
        elif part: s.add(int(part,16))
    return s
jobs=[('fontsource-noto-sans-sc-5.3.1','Noto Sans SC',[400,500,700],'noto'),
      ('fontsource-zcool-qingke-huangyou-5.3.0','ZCOOL QingKe HuangYou',[400],'zcool'),
      ('fontsource-ibm-plex-mono-5.3.0','IBM Plex Mono',[400,600],'plex'),
      ('fontsource-zhi-mang-xing','Zhi Mang Xing',[400],'zmx'),
      ('fontsource-zcool-kuaile','ZCOOL KuaiLe',[400],'kuaile'),
      ('fontsource-orbitron','Orbitron',[600,700],'orb'),
      ('fontsource-playfair-display','Playfair Display',['500-italic'],'pfd')]
css=[];total=0;n=0
for pkg,fam,weights,short in jobs:
    for w in weights:
        cssf=os.path.join(D,pkg,'package',f'{w}.css'); style='italic' if 'italic' in str(w) else 'normal'; wn=str(w).split('-')[0]
        src=open(cssf).read()
        for blk in re.findall(r'@font-face\s*\{(.*?)\}',src,re.S):
            m=re.search(r"url\(\./files/([^)]+\.woff2)\)",blk); r=re.search(r'unicode-range:\s*([^;]+);',blk)
            if not m: continue
            rng=parse_range(r.group(1)) if r else set(range(0,0x10ffff))
            need=rng&used
            if not need: continue
            inp=os.path.join(D,pkg,'package','files',m.group(1))
            outn=f'{short}-{w}-{n}.woff2'; n+=1
            opts=subset.Options(); opts.flavor='woff2'; opts.layout_features=['*']; opts.name_IDs=['*']; opts.notdef_outline=True
            f=TTFont(inp); s=subset.Subsetter(opts); s.populate(unicodes=need); s.subset(f)
            f.flavor='woff2'; f.save(os.path.join(OUT,outn)); total+=os.path.getsize(os.path.join(OUT,outn))
            ur=','.join('U+%X'%c for c in sorted(need))
            css.append(f"@font-face{{font-family:'{fam}';font-style:{style};font-display:swap;font-weight:{wn};src:url(fonts/{outn}) format('woff2');unicode-range:{ur};}}")
open(os.path.join(REPO,'fonts.css'),'w').write('/* 字体已下载到本地（只保留游戏里用到的字），国内也能正常显示。改了文案后运行 tools/build_fonts.py 重新生成 */\n'+'\n'.join(css)+'\n')
print('files',n,'total KB',total//1024,'chars',len(used))
