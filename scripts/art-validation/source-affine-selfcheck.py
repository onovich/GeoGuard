"""Offline source-pixel diagnostic only; root still reviews browser runtime."""
from PIL import Image, ImageDraw
import json, math, pathlib

data=json.loads(pathlib.Path('.tmp/four-tower-all-plans.json').read_text(encoding='utf-8-sig'))
def multiply(a,b):
    A,B,C,D,X,Y=a; e,f,g,h,u,v=b
    return [A*e+C*f,B*e+D*f,A*g+C*h,B*g+D*h,A*u+C*v+X,B*u+D*v+Y]
for name,item in data.items():
    layer=item['layer']; body=next(x for x in layer['parts'] if x['part']=='body'); scale=150/body['target'][3]
    canvas=Image.new('RGBA',(1440,1000),(255,249,239,255)); labels=ImageDraw.Draw(canvas)
    for i,plan in enumerate(item['plans']):
        col=i%4; row=i//4; flip=-1 if plan['actor']['facing']=='left' else 1
        base=[scale*flip,0,0,scale,col*360+150-128*scale*flip,row*250+225-220*scale]
        labels.text((col*360+10,row*250+5),name+' '+plan['actor']['pose']+'/'+plan['actor']['facing'],fill='#4b281c')
        parts=sorted(layer['parts'],key=lambda p:0 if p['space']=='fixed' else (1 if (p['space']=='soft' and not layer['launcherBehindBody']) or (p['space']=='launcher' and layer['launcherBehindBody']) else 2))
        for part in parts:
            image=Image.open('public/'+part['src']).convert('RGBA'); cx,cy,cw,ch=part['crop']; tx,ty,tw,th=part['target']
            matrix=plan['soft'] if part['space']=='soft' else plan['launcher']['matrix'] if part['space']=='launcher' else [1,0,0,1,0,0]
            if part['space']=='launcher':
                offset=layer.get('upOffset',[0,0]) if plan['launcher']['up'] else layer.get('attachmentOffset',[0,0])
                matrix=multiply([1,0,0,1,*offset],matrix)
                if plan['launcher']['up']:
                    angle=-math.pi/2+layer.get('upResidualCorrection',0);matrix=multiply(matrix,[math.cos(angle),math.sin(angle),-math.sin(angle),math.cos(angle),0,0])
                angle=layer.get('intrinsicAngleCorrection',0);matrix=multiply(matrix,[math.cos(angle),math.sin(angle),-math.sin(angle),math.cos(angle),0,0])
            a,b,c,d,e,f=multiply(base,multiply(matrix,[tw/cw,0,0,th/ch,tx-cx*tw/cw,ty-cy*th/ch])); determinant=a*d-b*c
            inverse=(d/determinant,-c/determinant,(c*f-d*e)/determinant,-b/determinant,a/determinant,(b*e-a*f)/determinant)
            clipped=Image.new('RGBA',image.size);clipped.paste(image.crop((cx,cy,cx+cw,cy+ch)),(cx,cy))
            canvas.alpha_composite(clipped.transform(canvas.size,Image.Transform.AFFINE,inverse,Image.Resampling.BICUBIC))
    canvas.convert('RGB').save('docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r10/'+name.lower()+'-four-pose-affine-selfcheck.jpg')
