"""Build Mira's game prop and its two inspection pictures with Blender.

Run from any directory: blender -b -t 4 -P render_packets.py
Uses Blender 4.3, Pillow, NumPy and the openly available URW/DejaVu fonts.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from math import cos, exp, pi, sin
import random

import bpy
import numpy as np
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'artifacts/potify-high-life/src/assets/lore/seed-and-signal'
DEST.mkdir(parents=True, exist_ok=True)
WORK = TemporaryDirectory(prefix='mira-packet-')
TMP = Path(WORK.name)
rng = np.random.default_rng(318)
rand = random.Random(318)
W, H = 720, 970
INK = (30, 45, 36)
BLUE = (39, 64, 64)
FONTS = {
    'serif': '/usr/share/fonts/opentype/urw-base35/URWBookman-Demi.otf',
    'italic': '/usr/share/fonts/opentype/urw-base35/URWBookman-LightItalic.otf',
    'small': '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf',
    'mono': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
}


def centered(draw, y, text, size, family, color, tracking=0, cx=W/2):
    font = ImageFont.truetype(FONTS[family], size)
    width = sum(font.getlength(c) for c in text) + (len(text)-1)*tracking
    x = cx - width/2
    for c in text:
        draw.text((x, y), c, font=font, fill=color, anchor='ls')
        x += font.getlength(c) + tracking


def noise(small, big, strength):
    field = rng.integers(0, 255, (small[1], small[0]), dtype=np.uint8)
    return (np.asarray(Image.fromarray(field).resize(big, Image.Resampling.BICUBIC), float)/255 - .5) * strength


def paper():
    value = (noise((9, 13), (W,H), 23) + noise((79,110), (W,H), 10)
             + rng.normal(0, 3, (H,W)))
    rgb = np.clip(np.array([193,156,102])[None,None,:] + value[:,:,None], 0, 255).astype('uint8')
    tex = Image.fromarray(rgb)
    grain = Image.new('RGBA', tex.size)
    gd = ImageDraw.Draw(grain)
    for _ in range(12000):
        x, y = rand.randrange(W), rand.randrange(H)
        length = rand.triangular(1, 9, 2)
        angle = rand.uniform(-1.0, 1.0)
        gd.line((x,y,x+cos(angle)*length,y+sin(angle)*length),
                fill=rand.choice(((251,219,166,30),(75,64,42,35),(228,204,149,35))), width=1)
    return Image.alpha_composite(tex.convert('RGBA'),grain).convert('RGB')


def stem_engraving(draw):
    # Four pairs of compact serrated leaflets laid out like a specimen woodcut.
    cx, base_y = 355, 598
    def leaf(root, end, radius):
        a, b = np.array(root,float), np.array(end,float)
        delta = b-a
        unit = delta / np.linalg.norm(delta)
        normal = np.array([-unit[1], unit[0]])
        def edge(t, side, tooth=1):
            center = a + delta*t + normal*(sin(pi*t)*2.4)
            return center + normal*side*radius*sin(pi*t)**.8*tooth
        pts = [tuple(edge(0,1))]
        for side, steps in [(1,range(1,17)),(-1,range(15,0,-1))]:
            if side == -1: pts.append(tuple(b))
            for i in steps:
                pts.append(tuple(edge(i/16,side, (1.0 if i%2 else .72))))
        draw.polygon(pts,fill=INK)
        draw.line([tuple(a),tuple(a+delta*.94)],fill=(169,164,110),width=2)
        for n in range(2,14,2):
            t=n/16
            for side in [-1,1]:
                draw.line([tuple(a+delta*max(.01,t-.18)),tuple(edge(t,side,.72))],
                          fill=(165,160,106),width=1)
    stem = [(cx,base_y),(351,560),(361,524),(353,490),(367,450),(364,412),(374,369)]
    draw.line(stem,fill=INK,width=5)
    for branch in [((354,557),(285,523),22),((357,542),(426,493),22),
                   ((359,516),(293,466),20),((356,489),(419,439),19),
                   ((362,468),(306,414),17),((366,439),(415,389),15),
                   ((365,416),(336,366),12),((370,391),(389,337),11)]:
        leaf(*branch)
    draw.line([(332,591),(370,595)],fill=INK,width=1)


def make_textures():
    blank = paper()
    blank.save(TMP/'kraft.jpg', quality=77)
    ink = Image.new('RGB',(W,H),'white')
    d = ImageDraw.Draw(ink)
    d.rounded_rectangle((70,161,649,767), radius=8, outline=INK,width=4)
    d.rounded_rectangle((79,170,640,758), radius=5, outline=BLUE,width=1)
    centered(d,229,'SEED & SIGNAL',34,'small',BLUE,4)
    d.line((110,251,608,251), fill=BLUE,width=2)
    centered(d,278,'P O T I F Y   C I T Y',19,'mono',BLUE)
    # A half-tone engraving frame on unbleached stock.
    d.ellipse((211,304,509,617),outline=BLUE,width=2)
    d.ellipse((217,310,503,611),outline=BLUE,width=1)
    for n in range(51):
        y = 322+n*5.55
        a = (y-460)/153
        if abs(a)>=1: continue
        half = 141*(1-a*a)**.5
        d.line((360-half,y,360+half,y),fill=(166,163,147),width=1)
    stem_engraving(d)
    centered(d,686,'MOONMINT',67,'serif',INK,0)
    centered(d,730,'Canopy Quarter',23,'italic',BLUE,0)
    mark = np.asarray(ink,dtype=float)
    alpha = np.clip(np.max(255-mark,axis=2)/210,0,1)
    alpha *= np.clip(.91 + noise((65,85), (W,H),.32) + rng.normal(0,.09,(H,W)),.47,1)
    alpha[rng.random((H,W))<.025] *= .3
    pixels = np.asarray(blank,float)
    pixels = pixels*(1-alpha[:,:,None])+mark*alpha[:,:,None]
    face = Image.fromarray(np.uint8(np.clip(pixels,0,255)))
    face.save(TMP/'face.jpg',quality=83)
    # The crescent cut into the hand-folded narrow cuff is a pencil stroke, not a logo.
    cuff = blank.crop((0,0,W,152)).copy()
    cd = ImageDraw.Draw(cuff)
    for k in range(15):
        pts=[]
        for j in range(50):
            angle=(35+j/49*119)*pi/180
            pts.append((546+43*cos(angle)+rand.uniform(-1.8,1.8), 64+29*sin(angle)+rand.uniform(-1.6,1.6)))
        cd.line(pts, fill=rand.choice([(48,44,41),(54,50,48),(72,65,58)]),width=4)
    for i in range(80):
        x = rand.randrange(W)
        cd.line([(x,17),(x+rand.randrange(2,9),17)],fill=(143,111,76))
    # Mira writes the cultivar on both ends so she can recognize a packet in a drawer.
    glyphs = {
        'M': [(0,1),(.16,0),(.48,.58),(.88,.03),(.92,1)],
        'O': [(.18,.95),(.01,.6),(.18,.14),(.53,.01),(.82,.09),(.95,.49),(.76,.88),(.45,1),(.18,.95)],
        'N': [(0,1),(.13,.02),(.79,.94),(.98,0)],
        'I': [(.4,.04),(.34,1)],
        'T': [(0,.08),(1,.01),(.52,.06),(.46,1)],
    }
    def sign_end(texture):
        pen = ImageDraw.Draw(texture)
        x = 89
        for ch in 'MOONMINT':
            y = 57 + rand.uniform(-3,3)
            pts = [(x+17*a+3*(1-b),y+26*b) for a,b in glyphs[ch]]
            pen.line(pts,fill=(85,75,60),width=3,joint='curve')
            x += 13 if ch=='I' else 23
    sign_end(cuff)
    upper=blank.crop((0,370,W,522)).copy()
    sign_end(upper)
    atlas=Image.new('RGB',(W,304))
    atlas.paste(upper.rotate(180),(0,0))
    atlas.paste(cuff,(0,152))
    atlas.save(TMP/'cuff.jpg',quality=85)
    wood_w,wood_h=1200,900
    y,x=np.mgrid[:wood_h,:wood_w]
    warp=noise((7,9),(wood_w,wood_h),30)+noise((14,32),(wood_w,wood_h),10)
    bands=np.sin((y+warp)*.23)*2 + np.sin((y+warp)*.36)*.7
    pat=noise((7,200),(wood_w,wood_h),19)+noise((57,310),(wood_w,wood_h),10)+noise((10,13),(wood_w,wood_h),15)+bands+rng.normal(0,1.8,(wood_h,wood_w))
    base=np.clip(np.array([49,62,52])[None,None,:]+pat[:,:,None],0,255).astype('uint8')
    plank=Image.fromarray(base)
    p=ImageDraw.Draw(plank)
    for _ in range(680):
        sx,sy=rand.randrange(wood_w),rand.randrange(wood_h)
        p.line((sx,sy,sx+rand.randrange(3,27),sy+rand.choice((-1,0,1))),fill=rand.choice([(65,71,58),(45,52,44),(58,65,49)]))
    plank.save(TMP/'counter.jpg',quality=83)


make_textures()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=26
scene.cycles.use_denoising=False
scene.cycles.max_bounces=4
scene.world.use_nodes=True
bg=scene.world.node_tree.nodes.get('Background')
bg.inputs[0].default_value=(.47,.49,.48,1)
bg.inputs[1].default_value=.22
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.render.resolution_x=960
scene.render.resolution_y=640
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'


def material(name, rgb, texture=None):
    mat=bpy.data.materials.new(name)
    mat.use_nodes=True
    nodes=mat.node_tree.nodes
    bs=nodes.get('Principled BSDF')
    bs.inputs['Roughness'].default_value=.91
    bs.inputs['Base Color'].default_value=(*rgb,1)
    if texture:
        image=nodes.new('ShaderNodeTexImage')
        image.image=bpy.data.images.load(str(TMP/texture),check_existing=True)
        mat.node_tree.links.new(image.outputs['Color'],bs.inputs['Base Color'])
    return mat


face_mat=material('Moonmint / ink on kraft',(.59,.44,.25),'face.jpg')
paper_mat=material('Unbleached folded stock',(.59,.44,.25),'kraft.jpg')
cuff_mat=material('Mira / pencilled cuff',(.59,.44,.25),'cuff.jpg')
inside_mat=material('Fibre edge',(.64,.49,.30))
shadow_mat=material('Sleeve interior',(.17,.109,.057))
wood=material('Worn seed counter',(.15,.14,.09),'counter.jpg')


def surface(name, points, faces, uvs, mat, parent=None):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(points,[],faces)
    mesh.materials.append(mat)
    if uvs:
        layer=mesh.uv_layers.new(name='Paper')
        for loop in mesh.loops:
            layer.data[loop.index].uv = uvs[loop.vertex_index]
    mesh.update()
    ob=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(ob)
    if parent: ob.parent=parent
    for poly in mesh.polygons: poly.use_smooth=True
    return ob


def plane(name, fn, m, n, mat, parent, flip=False, band=(0.,1.)):
    pts=[]; uv=[]
    for j in range(n+1):
        for i in range(m+1):
            u,v=i/m,j/n
            pts.append(fn(u,v)); uv.append((u, band[0]+(band[1]-band[0])*(1-v if flip else v)))
    faces=[]
    for j in range(n):
        for i in range(m):
            k=j*(m+1)+i
            faces.append((k,k+1,k+m+2,k+m+1))
    return surface(name,pts,faces,uv,mat,parent)


def packet(opened=False, printed=True):
    root=bpy.data.objects.new('Mira’s Moonmint sleeve',None)
    bpy.context.collection.objects.link(root)
    def xy(u,v):
        right_tip=max(0,(u-.78)/.22)*max(0,(v-.85)/.15)
        y=(v-.5)*.155 - .0055*right_tip
        x=(u-.5)*.115 + .00125*sin(pi*v) - .004*right_tip
        return x,y
    def front(u,v):
        x,y=xy(u,v)
        bulge=.0035*(sin(pi*v)*sin(pi*u))**.66
        creases=.00037*cos(u*33-v*9)*sin(pi*v)*sin(pi*u)
        curl=.005*max(0,(v-.78)/.22)*max(0,(u-.8)/.2)
        lip=(.0082*exp(-(v/.075)**2)*sin(pi*u)**.65 if opened else 0)
        return (x,y,.0013+bulge+creases+curl+lip)
    def back(u,v):
        x,y=xy(u,v)
        return (x,y,.0003+.00023*sin(2*pi*v)*sin(pi*u))
    plane('Printed sleeve face',front,14,18,face_mat if printed else paper_mat,root)
    plane('Plain reverse',back,8,9,paper_mat,root)
    for name,u in [('Left seam',0),('Right seam',1)]:
        plane(name,lambda t,v,u=u: tuple(np.array(back(u,v))*(1-t)+np.array(front(u,v))*t),1,12,inside_mat,root)
    for suffix,vv in [('Head',1),('Foot',0)]:
        plane(suffix+' mouth',lambda u,t,vv=vv: tuple(np.array(back(u,vv))*(1-t)+np.array(front(u,vv))*t),14,1,
              shadow_mat if opened and vv==0 else inside_mat,root)
    # Top cuff is a double roll with one nick where the thumb normally catches it.
    def top_fold(u,v):
        base=.875+v*.124
        x,y,z=front(u,base)
        return x,y,z+.0008+.0022*exp(-((v-.15)/.23)**2)+.0004*cos(pi*u*3)
    plane('Double fold at the shop end',top_fold,14,6,cuff_mat if printed else paper_mat,root,band=(.5,1.))
    def bottom_cuff(u,v):
        if opened:
            x,y,z=front(u,0)
            return x,y-.019*v+.003*v*v, z+.016*sin(v*1.68)-.005*v*v+.0016*(u-.4)*v
        base=.114*(1-v)
        x,y,z=front(u,base)
        return x,y,z+.00068+.0017*exp(-((1-v)/.27)**2)+.0003*sin(u*9)
    # The same single marked cuff turns outward when the reader opens this end.
    plane('Pencilled foot cuff',bottom_cuff,14,7,cuff_mat if printed else paper_mat,root,flip=True,band=(0.,.5))
    return root


def area(name, position, power, color, size, target=(0,0,0)):
    bpy.ops.object.light_add(type='AREA',location=position)
    obj=bpy.context.object
    obj.name=name; obj.data.energy=power;obj.data.color=color;obj.data.shape='DISK';obj.data.size=size
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()


def remove_group(root):
    for child in list(root.children): bpy.data.objects.remove(child,do_unlink=True)
    bpy.data.objects.remove(root,do_unlink=True)


def cut_prop(root):
    # One mesh with four shared material primitives keeps the counter draw cost bounded.
    bpy.ops.object.select_all(action='DESELECT')
    copies = []
    for child in root.children:
        copy = child.copy()
        copy.data = child.data.copy()
        copy.parent = None
        bpy.context.collection.objects.link(copy)
        copy.select_set(True)
        copies.append(copy)
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    merged = bpy.context.view_layer.objects.active
    merged.name = 'Seed & Signal / Moonmint'
    bpy.ops.export_scene.gltf(filepath=str(DEST/'mira-packet.glb'),use_selection=True,export_format='GLB',
                              export_yup=True,export_cameras=False,export_lights=False,export_animations=False,
                              export_extras=False,export_image_format='AUTO')
    bpy.data.objects.remove(merged, do_unlink=True)


hero=packet()
cut_prop(hero)
plane('Worn wood',lambda u,v: ((u-.5)*.72,(v-.5)*.54,-.002),1,1,wood,None)
# One partly seen empty sleeve by the shop stack shows the consistent folded edge.
spare=packet(printed=False)
spare.location=(-.151,.059,-.0003)
spare.rotation_euler=(0,0,-.20)
second=packet(printed=False)
second.location=(-.155,.073,-.001)
second.rotation_euler=(0,0,-.28)
area('Sash light',(-.15,-.08,.20),.94,(1,.86,.69),.112)
area('Canal light',(.18,.14,.20),.26,(.76,.87,1),.24)
area('Paper edge',(-.03,.20,.07),.19,(1,.81,.59),.10)
bpy.ops.object.camera_add(location=(.028,-.125,.320))
cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,.003))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=.304
cam.data.clip_start=.01
scene.camera=cam


def render(root, label):
    root.rotation_euler.z=-.08 if label=='folded' else pi-.055
    if label == 'open':
        root.location.y = -.0085
    scene.render.filepath=str(TMP/(label+'.png'))
    bpy.ops.render.render(write_still=True)
    with Image.open(scene.render.filepath) as im:
        im.convert('RGB').save(DEST/('mira-packet-'+label+'.webp'),quality=84,method=6)


render(hero,'folded')
remove_group(hero)
opened=packet(opened=True)
render(opened,'open')
