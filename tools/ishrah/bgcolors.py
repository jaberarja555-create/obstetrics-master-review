# Background room picture of the SMRA screens in each app colour (owner, 21 Nov 2026: "when the colour changes, can the background match").
# Only the room's green/teal surfaces (hue 138-212) move to the colour; plants, wood, people and the heart model keep theirs.
# Writes ishrah/img/mr/bg-wide-<colour>.webp and bg-tall-<colour>.webp. Run when bg-wide/bg-tall change:  python3 tools/ishrah/bgcolors.py
import numpy as np, sys, os
from PIL import Image
root='/home/user/obstetrics-master-review/ishrah/img/mr'
T={'ocean':(212,1.0),'teal':(186,1.0),'purple':(265,.8),'maroon':(343,.8),'graphite':(None,.12)}
def rec(src, hue, sf):
    im=Image.open(src).convert('RGB'); a=np.asarray(im).astype(np.float32)/255
    hsv=np.asarray(im.convert('HSV')).astype(np.float32)
    h=hsv[...,0]*360/255; s=hsv[...,1]/255; v=hsv[...,2]/255
    # greens and teals (hue 70-200) move to the colour; a smooth weight at the edges avoids hard seams
    w=np.clip((h-138)/12,0,1)*np.clip((212-h)/12,0,1)*np.clip((s-.08)/.12,0,1)
    if hue is None: nh=h; ns=s*(1-w+w*sf)
    else:
        d=(hue-168); nh=(h+w*d)%360; ns=np.clip(s*(1-w+w*sf),0,1)
    out=np.stack([nh/360*255,ns*255,v*255],-1).astype(np.uint8)
    return Image.fromarray(out,'HSV').convert('RGB')
for name,(hue,sf) in T.items():
    for b in ('bg-wide','bg-tall'):
        rec(os.path.join(root,b+'.webp'),hue,sf).save(os.path.join(root,'%s-%s.webp'%(b,name)),quality=80,method=6)
print('ok')
