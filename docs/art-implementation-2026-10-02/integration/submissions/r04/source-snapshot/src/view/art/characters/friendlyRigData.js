// Seven retained friendly identities, measured in untrimmed 256px source space.
const s=(id,d,fill='sage',options={})=>({id,d,fill,stroke:'brown',width:4.5,...options});
const e=(id,x,y,rx,ry,fill,options={})=>({id,ellipse:[x,y,rx,ry],fill,stroke:'brown',width:4.5,...options});
const l=(id,d,options={})=>s(id,d,null,{width:3.8,...options});
const feet=(left=94,right=162)=>[
 s('foot-left',`M${left-10} 204 C${left-17} 214 ${left-14} 220 ${left-5} 220 L${left+4} 220 C${left+15} 220 ${left+15} 212 ${left+9} 205 Z`,'sageShade',{space:'fixed'}),
 s('foot-right',`M${right-10} 205 C${right-15} 213 ${right-12} 220 ${right-4} 220 L${right+5} 220 C${right+17} 220 ${right+15} 212 ${right+9} 204 Z`,'sageShade',{space:'fixed'}),
];
const contacts=(left=94,right=162)=>({'foot-left':[left,220],'foot-right':[right,220]});
const tube=(id,x,y,length,rx=8,ry=12)=>[
 s(`${id}-body`,`M${x} ${y-ry} C${x-9} ${y-ry} ${x-9} ${y+ry} ${x} ${y+ry} L${x+length} ${y+ry} C${x+length+rx} ${y+ry} ${x+length+rx} ${y-ry} ${x+length} ${y-ry} Z`),
 e(`${id}-rim`,x+length,y,rx,ry,'sageShade',{width:3.4}),e(`${id}-bore`,x+length+.5,y,rx*.48,ry*.65,'greenDark',{width:2}),
];
const pear='M85 207 C61 199 64 172 79 158 C100 139 115 119 119 94 C123 69 128 43 146 43 C161 42 167 51 170 64 C172 79 166 94 160 105 C146 126 148 146 155 165 C169 199 153 215 125 215 C108 216 95 213 85 207 Z';
const pearPad=s('belly-pad','M87 174 C99 188 113 179 124 177 C143 172 139 198 125 203 C105 212 80 199 87 174 Z','sageShade',{stroke:null});
const pearEyes=[e('eye-left',145,62,3.5,6,'brown',{stroke:null}),e('eye-right',159,62,3.5,6,'brown',{stroke:null})];
const pearJoints={'neck-top':[149,51],'eye-left':[145,62],'eye-right':[159,62],'belly-pad':[111,190],...contacts(91,137)};
const roundBuds='M62 199 C43 185 38 167 43 148 C24 149 20 130 30 123 C38 117 47 124 49 130 C56 105 70 88 88 82 C73 74 70 60 79 56 C89 52 98 61 100 67 C94 49 103 37 115 43 C126 47 129 62 126 76 C151 76 179 94 190 124 C204 162 191 195 165 208 C136 222 88 219 62 199 Z';
const nearEye=e('eye',149,135,4.7,8,'brown',{stroke:null});
const buds={'bud-left':[87,64],'bud-right':[113,56],'rear-lobe':[34,134]};
const sentinelFeet=[s('foot-left','M84 200 C79 209 81 220 90 220 L98 220 C110 220 110 212 103 201 Z','sageShade',{space:'fixed'}),s('foot-right','M152 201 C147 209 150 220 158 220 L167 220 C180 220 177 210 171 200 Z','sageShade',{space:'fixed'})];
export const FRIENDLY_RIGS={
 'tower:CANNON':{
  root:[128,220],center:[128,145],collisionRadius:86,referenceRadius:16,softPivot:[128,220],
  shapes:[...feet(),s('body-two-rear-top-buds','M67 205 C44 192 38 174 40 154 C23 154 20 135 31 131 C36 128 42 132 45 139 C50 116 67 93 88 81 C72 79 66 66 74 59 C82 51 94 60 100 67 C96 45 111 37 124 49 C132 56 130 71 128 79 C151 77 178 84 192 107 C205 131 202 170 182 196 C161 220 94 221 67 205 Z'),e('eye',119,132,5,8,'brown',{stroke:null})],
  joints:{'bud-left':[83,66],'bud-right':[114,57],'eye':[119,132],...contacts()},
  launcher:{pivot:[179,128],shapes:[s('barrel','M-10 -36 C-22 -34 -22 34 -10 36 L22 36 C43 36 43 -36 22 -36 Z'),e('barrel-rim',24,0,23,36,'sageShade'),e('barrel-bore',25,0,14,27,'brown',{width:2})],muzzles:[[25,0]],upPivot:[173,119],upShapes:[s('barrel','M-23 0 L-23 -29 C-23 -51 23 -51 23 -29 L23 0 C23 20 -23 20 -23 0 Z'),e('barrel-rim',0,-29,23,14,'sageShade'),e('barrel-bore',0,-29,15,8,'brown',{width:2})],upMuzzles:[[0,-29]]},
 },
 'tower:SNIPER':{
  root:[128,220],center:[128,143],collisionRadius:90,referenceRadius:14,softPivot:[128,220],
  shapes:[...feet(91,137),s('continuous-pear-neck',pear),pearPad,...pearEyes],joints:pearJoints,
  launcher:{pivot:[167,70],shapes:[s('long-beak','M-3 -9 C13 -3 39 -2 71 0 C77 0 77 5 71 5 C43 8 16 5 -3 12 Z')],muzzles:[[74,2]],upAngle:-.58},
 },
 'tower:RAIL':{
  root:[128,220],center:[128,143],collisionRadius:90,referenceRadius:14,softPivot:[128,220],
  shapes:[...feet(91,137),s('continuous-pear-neck',pear),pearPad,...pearEyes],joints:pearJoints,
  launcher:{pivot:[166,78],shapes:[...tube('beak-upper',0,-10,64,4.5,5),...tube('beak-lower',0,10,64,4.5,5)],muzzles:[[64,-10],[64,10]],upAngle:-.58},
 },
 'tower:RAPID':{
  root:[128,220],center:[128,143],collisionRadius:82,referenceRadius:13,softPivot:[128,220],
  shapes:[...feet(),s('body-two-buds-and-rear-lobe',roundBuds),nearEye,l('mouth-line','M115 172 Q139 177 137 160')],
  joints:{...buds,eye:[149,135],'mouth-line':[128,172],...contacts()},
  launcher:{pivot:[180,143],shapes:[...tube('tube-upper',0,-15,32,8,12),...tube('tube-lower',0,15,32,8,12)],muzzles:[[32,-15],[32,15]],upAngle:-Math.PI/2},
 },
 'tower:MORTAR':{
  root:[128,220],center:[128,148],collisionRadius:85,referenceRadius:18,softPivot:[128,220],
  shapes:[...feet(81,175),s('rear-triangle-bud','M58 132 C42 112 31 99 40 94 C49 87 65 102 74 109 Z'),s('wide-round-body','M54 197 C42 190 40 176 45 159 C53 122 69 101 96 91 C126 78 167 91 183 114 C194 136 204 172 198 192 C190 216 77 222 54 197 Z'),e('eye',86,152,6,9,'brown',{stroke:null}),e('cheek-dot',90,173,3.8,3.8,'brown',{stroke:null}),l('smile','M151 177 Q154 193 165 180')],
  joints:{'triangle-bud':[49,105],eye:[86,152],'cheek-dot':[90,173],smile:[158,183],...contacts(81,175)},
  launcher:{pivot:[171,123],angle:-.63,upAngle:-.88,shapes:[s('cup','M-7 -27 C-16 -23 -16 23 -7 27 L31 27 C47 27 47 -27 31 -27 Z'),e('cup-rim',32,0,19,27,'sageShade'),e('cup-aperture',33,0,12,19,'brown',{width:2})],muzzles:[[33,0]]},
 },
 'tower:FROST':{
  root:[128,220],center:[128,157],collisionRadius:88,referenceRadius:15,softPivot:[128,220],
  shapes:[...feet(80,174),s('fin-far','M189 151 C217 146 231 164 222 179 C215 192 194 185 181 175 Z'),s('body-two-top-buds','M53 194 C41 183 43 160 55 147 C63 124 80 111 96 104 C81 103 75 92 82 85 C92 76 102 89 103 95 C99 74 112 69 121 81 C126 88 126 98 124 104 C150 104 182 113 197 131 C216 163 203 190 182 205 C157 222 81 218 53 194 Z'),s('fin-near','M55 148 C35 137 18 145 17 160 C16 177 40 184 57 174'),e('eye',152,132,4.5,8,'brown',{stroke:null}),l('belly-stripe-left','M126 170 L126 188',{width:6}),l('belly-stripe-right','M141 170 L141 188',{width:6})],
  joints:{'bud-left':[91,92],'bud-right':[115,87],'fin-near':[37,160],'fin-far':[207,168],eye:[152,132],'belly-stripe-left':[126,180],'belly-stripe-right':[141,180],...contacts(80,174)},
  launcher:{pivot:[180,137],shapes:[s('whistle','M-3 -12 L35 -12 C50 -12 50 12 35 12 L-3 12 C-19 12 -19 -12 -3 -12 Z'),s('whistle-slot','M23 -5 L35 -5 C41 -5 41 5 35 5 L23 5 C17 5 17 -5 23 -5 Z','greenDark',{stroke:null})],muzzles:[[30,0]],upAngle:-Math.PI/2},
 },
 'tower:SENTINEL':{
  root:[128,220],center:[128,145],collisionRadius:92,referenceRadius:17,softPivot:[128,220],
  shapes:[...sentinelFeet,e('shoulder-far',186,154,25,32,'sageShade'),s('body-two-buds','M56 192 C43 174 46 141 61 120 C70 98 86 90 98 85 C83 72 89 54 102 56 C112 57 118 68 119 77 C116 59 129 48 141 57 C152 63 149 78 145 85 C171 86 192 106 199 132 C211 163 199 193 175 201 C145 213 75 208 56 192 Z'),e('shoulder-near',62,158,32,38,'sageShade'),e('shoulder-near-inset',62,158,24,29,'#709461',{stroke:null}),s('eye-slot','M121 119 Q142 126 166 119 C177 142 114 148 121 119 Z','brown',{stroke:null}),e('eye-highlight',147,134,6,6,'cream',{stroke:null})],
  joints:{'bud-left':[104,67],'bud-right':[135,67],'shoulder-near':[62,158],'shoulder-far':[186,154],'eye-slot':[146,132],'eye-highlight':[147,134],...contacts()},
  launcher:{pivot:[189,151],shapes:[...tube('tube',-2,0,27,10,18),l('tube-highlight','M-2 -8 L20 -8',{stroke:'sageLight',width:6})],muzzles:[[25,0]],upAngle:-Math.PI/2},
 },
};
