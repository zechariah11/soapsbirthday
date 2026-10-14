import sys
from PIL import Image, ImageFilter
import numpy as np
from collections import deque
src, out, H = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(int)
h, w, _ = a.shape
bg = a[3,3]
diff = np.abs(a - bg).sum(2)
tol = int(sys.argv[4]) if len(sys.argv) > 4 else 24
# flood fill background from edges
bgm = np.zeros((h,w), bool); q = deque()
for x in range(w): q += [(0,x),(h-1,x)]
for y in range(h): q += [(y,0),(y,w-1)]
while q:
    y,x = q.popleft()
    if bgm[y,x] or diff[y,x] > tol: continue
    bgm[y,x] = True
    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny,nx=y+dy,x+dx
        if 0<=ny<h and 0<=nx<w and not bgm[ny,nx]: q.append((ny,nx))
alpha = Image.fromarray(((~bgm)*255).astype('uint8')).filter(ImageFilter.MedianFilter(5))
im = im.filter(ImageFilter.MedianFilter(3))
rgba = im.copy(); rgba.putalpha(alpha)
bbox = alpha.getbbox(); rgba = rgba.crop(bbox)
Image.fromarray(np.asarray(alpha.crop(bbox))).save(out.replace('.png','-mask.png'))
# downscale
W = round(rgba.width * H / rgba.height)
arr = np.asarray(rgba).astype(float)
pm = arr.copy(); pm[...,:3] *= pm[...,3:4]/255
small = np.asarray(Image.fromarray(pm.astype('uint8'),'RGBA').resize((W,H), Image.BOX)).astype(float)
al = small[...,3]
rgb = np.where(al[...,None]>0, small[...,:3]*255/np.maximum(al[...,None],1), 0)
mask = al > 110
# boost saturation/contrast a little for pixel-art punch
img = Image.fromarray(np.clip(rgb,0,255).astype('uint8'),'RGB')
from PIL import ImageEnhance
img = ImageEnhance.Brightness(ImageEnhance.Color(img).enhance(1.2)).enhance(1.18)
img = ImageEnhance.Contrast(img).enhance(1.15)
img = img.point(lambda v: int(255*((v/255)**0.85)))
img = img.quantize(20, method=Image.Quantize.MEDIANCUT, kmeans=4, dither=Image.Dither.NONE).convert('RGB')
rgb = np.asarray(img).copy()
# remove isolated speckles: pixel unlike all 4 neighbours while 3+ neighbours agree
for _ in range(2):
    src_ = rgb.copy()
    for y in range(1,int(H*0.17)):
        for x in range(1,W-1):
            if not mask[y,x]: continue
            nb = [tuple(src_[y+dy,x+dx]) for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)) if mask[y+dy,x+dx]]
            c = tuple(src_[y,x])
            if len(nb)==4 and c not in nb:
                best = max(set(nb), key=nb.count)
                if nb.count(best) >= 3 or sum(abs(int(a)-int(b)) for a,b in zip(c,best)) > 120:
                    rgb[y,x] = best
# pad + outline
P = 1
outa = np.zeros((H+2*P, W+2*P, 4), 'uint8')
outa[P:P+H, P:P+W, :3] = rgb; outa[P:P+H, P:P+W, 3] = mask*255
m = outa[...,3] > 0
ring = np.zeros_like(m)
for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
    ring |= np.roll(np.roll(m,dy,0),dx,1)
ring &= ~m
outa[ring] = (18,24,48,255)
Image.fromarray(outa,'RGBA').save(out)
Image.fromarray(outa,'RGBA').resize(((W+2)*8,(H+2)*8), Image.NEAREST).save(out.replace('.png','-preview.png'))
print('size', W+2, H+2)
