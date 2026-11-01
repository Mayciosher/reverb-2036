import subprocess,glob,os,re,base64,json,math
# 生成 js/samples.js（真乐器采样）。先把两个采样库下载到 D 目录：
#   git clone --depth 1 https://github.com/Tonejs/audio tone            （只需要 salamander 文件夹，CC BY 3.0）
#   git clone --depth 1 https://github.com/sgossner/VSCO-2-CE vsco       （CC0，体积很大，可以用 sparse-checkout 只取用到的文件夹）
# 然后在仓库根目录运行：python3 tools/build_samples.py 下载目录
import sys,tempfile
D=sys.argv[1] if len(sys.argv)>1 else 'samples-src'
OUT=tempfile.mkdtemp()
PC={'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Ds':3,'Eb':3,'E':4,'F':5,'F#':6,'Fs':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
def midi(name,oct,shift): return 12*(int(oct)+1)+PC[name]+shift
SETS={
 'piano':(glob.glob(D+'/tone/salamander/*.mp3'),r'^([A-G][s#]?)(\d)\.mp3$',0,3.2,(33,96)),
 'vln':(glob.glob(D+'/vsco/Strings/Violin Section/susVib/*_v2.wav'),r'_([A-G]#?)(\d)_v2',12,4.0,(0,200)),
 'cello':(glob.glob(D+'/vsco/Strings/Cello Section/susvib/*_v3_1.wav'),r'_([A-G]#?)(\d)_v3',12,4.0,(0,200)),
 'tpt':(glob.glob(D+'/vsco/Brass/Trumpet/sus/*_v1_rr1.wav'),r'_([A-G]#?)(\d)_v1',12,3.0,(0,200)),
 'horn':(glob.glob(D+'/vsco/Brass/F Horn/sus/*_v2_1.wav'),r'_([A-G]#?)(\d)_v2',12,3.0,(40,200)),
 'harp':(glob.glob(D+'/vsco/Strings/Harp/*.wav'),r'_([A-G]#?)(\d)_',0,3.0,(36,100)),
 'flute':(glob.glob(D+'/vsco/Woodwinds/Flute/susvib/*_1.wav'),r'_([A-G]#?)(\d)_v1_1',12,3.0,(0,200)),
 'glock':(glob.glob(D+'/vsco/Percussion/Glock/*.wav'),r'_([A-G]#?)(\d)\.wav',12,2.0,(0,200)),
}
data={};total=0
for inst,(files,pat,shift,dur,(lo,hi)) in SETS.items():
    data[inst]={}
    for f in sorted(files):
        m=re.search(pat,os.path.basename(f))
        if not m: continue
        mi=midi(m.group(1),m.group(2),shift)
        if not(lo<=mi<=hi): continue
        if inst=='piano' and mi%3!=0 and mi not in (33,): pass
        o=f'{OUT}/{inst}_{mi}.mp3'
        fade=0.35
        subprocess.run(['ffmpeg','-v','quiet','-y','-i',f,'-ac','1','-ar','32000','-t',str(dur),'-af',f'silenceremove=start_periods=1:start_threshold=-50dB,afade=t=out:st={dur-fade}:d={fade},loudnorm=I=-16:TP=-1.5:LRA=11','-b:a','48k',o],check=True)
        b=open(o,'rb').read(); total+=len(b); data[inst][str(mi)]=base64.b64encode(b).decode()
    print(inst,sorted(map(int,data[inst])))
print('total KB',total//1024)
js='/* 真乐器采样（自动生成，不要手改）\n   钢琴：Salamander Grand Piano（Alexander Holm，CC BY 3.0）\n   弦乐、竖琴、小号、圆号、长笛、钟琴：VSCO 2 Community Edition（Versilian Studios，CC0）\n   用 tools/build_samples.py 生成 */\nconst SAMPLE_DATA = '+json.dumps(data)+';\n'
open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'js','samples.js'),'w').write(js)
