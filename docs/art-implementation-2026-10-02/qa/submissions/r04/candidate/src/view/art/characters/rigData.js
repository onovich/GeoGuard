import { FRIENDLY_RIGS } from './friendlyRigData.js';
import { MECHANIC_RIGS } from './mechanicRigData.js';
import { BOSS_RIGS_A } from './bossRigDataA.js';
import { ENEMY_RIGS } from './enemyRigData.js';
import { BOSS_RIGS_B } from './bossRigDataB.js';

export const PALETTE = Object.freeze({
  brown: '#4B281C', sage: '#B6D4AE', sageLight: '#D1E4BA', sageShade: '#7E9F71',
  coral: '#F77965', coralLight: '#FF9A7A', coralShade: '#CB584C', cream: '#FFF9EF',
  honey: '#F8DDAA', honeyLight: '#FFEAC3', greenDark: '#345634', pink: '#F4ADA0',
});

const shape = (id, d, fill, options = {}) => ({ id, d, fill, stroke: 'brown', width: 4.5, ...options });
const oval = (id, cx, cy, rx, ry, fill, options = {}) => ({ id, ellipse: [cx, cy, rx, ry], fill, stroke: 'brown', width: 4.5, ...options });
const line = (id, d, options = {}) => shape(id, d, null, { width: 3.8, ...options });
const towerBody = 'M66 201 C49 193 42 174 43 157 C24 158 24 131 37 129 C46 127 50 135 52 141 C56 119 72 99 88 91 C72 88 63 73 70 65 C78 56 96 62 101 73 C97 57 100 43 112 42 C125 40 133 58 128 76 C152 78 177 96 185 121 C201 160 190 196 165 207 C137 221 91 217 66 201 Z';
const towerFeet = [
  shape('foot-left', 'M91 204 C88 210 86 220 97 220 L103 220 C113 220 114 212 109 207 Z', 'sageShade', { space: 'fixed' }),
  shape('foot-right', 'M147 207 C144 213 146 220 153 220 L159 220 C170 220 172 213 166 206 Z', 'sageShade', { space: 'fixed' }),
];
const eye = shape('eye', 'M144 133 C149 125 153 133 152 140 C152 148 147 151 144 145 C142 141 142 137 144 133 Z', 'brown', { stroke: null });
const basicLauncher = [
  shape('barrel', 'M-4 -17 C-17 -15 -17 14 -4 17 L32 17 C47 17 47 -17 32 -17 Z', 'sage'),
  line('barrel-highlight', 'M-4 -7 L30 -7', { stroke: 'sageLight', width: 7 }),
  oval('bore-rim', 32, 0, 11, 17, 'sageShade'),
  oval('bore-inner', 33, 0, 6.8, 11, 'greenDark', { width: 3 }),
];
const basicUp = [
  shape('barrel', 'M-13 0 L-13 -34 C-13 -49 13 -49 13 -34 L13 0 C13 13 -13 13 -13 0 Z', 'sage'),
  line('barrel-highlight', 'M-7 -3 L-7 -29', { stroke: 'sageLight', width: 5 }),
  oval('bore-rim', 0, -34, 13, 9, 'sageShade'),
  oval('bore-inner', 0, -34, 8, 5.5, 'greenDark', { width: 2.5 }),
];
const burstLauncher = [
  shape('mount-plate', 'M-5 -21 Q-8 -23 -11 -18 L-11 22 Q-9 27 -4 27 L27 27 Q31 26 31 22 L31 -16 Q30 -22 24 -22 Z', 'sage'),
  shape('front-plane', 'M10 -19 Q8 -23 15 -23 L33 -23 Q43 -23 43 -15 L43 22 Q43 28 35 28 L15 28 Q9 28 9 22 Z', 'sage'),
  ...[[16, -13], [39, -13], [16, 13], [39, 13]].flatMap(([x, y], i) => [
    oval(`bore-${i + 1}-rim`, x, y, 9, 10, 'sageShade', { width: 3.8 }),
    oval(`bore-${i + 1}-inner`, x, y, 5.5, 6.6, 'greenDark', { width: 2.2 }),
  ]),
];
const basicEnemyBody = 'M104 78 C100 51 113 41 128 43 C145 43 156 56 153 78 C165 84 174 94 178 106 C193 91 214 96 219 110 C226 128 214 141 197 143 C201 153 201 162 195 171 C214 171 224 187 216 202 C208 218 185 214 177 202 C152 219 105 219 80 202 C72 216 50 218 41 203 C29 186 41 170 60 171 C55 160 55 151 59 142 C39 145 29 127 36 111 C42 94 64 94 78 105 C83 92 92 83 104 78 Z';
const enemyFeet = [
  shape('foot-left', 'M81 204 C75 211 77 220 87 220 L94 220 C105 220 109 209 103 207 Z', 'coral', { space: 'fixed' }),
  shape('foot-right', 'M151 207 C147 213 151 220 163 220 L170 220 C180 220 180 211 174 204 Z', 'coral', { space: 'fixed' }),
];
const sealLeft = 'M102 81 C91 63 58 68 39 91 C14 120 13 170 38 195 C61 218 92 211 103 192 C114 172 95 163 85 166 C86 157 79 151 73 148 C82 145 85 137 83 132 C110 130 117 98 102 81 Z';
const sealTop = 'M102 81 C91 63 58 68 39 91 C26 105 20 122 20 139 C34 151 45 142 55 144 C69 155 82 145 83 132 C110 130 117 98 102 81 Z';
const sealBottom = 'M21 154 C17 171 26 188 39 200 C62 220 94 214 104 193 C114 173 93 168 83 172 C75 160 64 162 54 165 C40 156 27 158 21 154 Z';

export const RIGS = {
  ...FRIENDLY_RIGS,
  ...MECHANIC_RIGS,
  ...Object.fromEntries(Object.entries(BOSS_RIGS_A).map(([id, rig]) => [id, id === 'boss:RAIL_WARLORD' ? {
    ...rig, variants: { ...rig.variants, openBody: { ...rig.variants.openBody,
      shapeAliases: { 'near-eye-closed': 'near-eye' }, suppressedShapes: ['near-eye-white', 'near-brow'],
    } },
  } : rig])),
  ...ENEMY_RIGS,
  ...BOSS_RIGS_B,
  'tower:BASIC': {
    root: [128, 220], center: [128, 143], collisionRadius: 80, referenceRadius: 14,
    softPivot: [128, 220], bounds: [24, 40, 210, 184],
    shapes: [...towerFeet, shape('body', towerBody, 'sage'), eye, line('cheek-arc', 'M139 167 Q150 179 139 187')],
    joints: { 'bud-top-left': [84, 74], 'bud-top-right': [114, 61], 'rear-lobe': [40, 145], 'eye': [147, 139], 'cheek-arc': [141, 176], 'foot-left': [100, 220], 'foot-right': [156, 220] },
    launcher: { pivot: [176, 143], upPivot: [172, 123], shapes: basicLauncher, upShapes: basicUp, muzzles: [[33, 0]], upMuzzles: [[0, -34]] },
  },
  'tower:BURST': {
    root: [128, 220], center: [128, 143], collisionRadius: 80, referenceRadius: 16,
    softPivot: [128, 220], bounds: [24, 40, 222, 184],
    shapes: [...towerFeet, shape('body', towerBody, 'sage'), shape('belly-spot', 'M68 173 C70 164 81 162 89 166 C101 166 101 177 96 184 C87 190 68 188 68 173 Z', 'sageShade', { stroke: null }), eye, line('smile', 'M141 163 Q148 174 157 163')],
    joints: { 'bud-top-left': [84, 74], 'bud-top-right': [114, 61], 'rear-lobe': [40, 145], 'eye': [147, 139], 'smile': [149, 167], 'foot-left': [100, 220], 'foot-right': [156, 220] },
    launcher: { pivot: [176, 143], shapes: burstLauncher, muzzles: [[16, -13], [39, -13], [16, 13], [39, 13]], upAngle: -0.58 },
  },
  'hero:PLAYER': {
    root: [128, 220], center: [128, 159], collisionRadius: 54, referenceRadius: 12,
    softPivot: [128, 220], bounds: [78, 34, 100, 188],
    shapes: [
      shape('body', 'M128 82 C129 115 142 129 155 145 C176 171 178 207 153 218 C139 224 117 222 104 218 C77 210 77 179 91 157 C104 139 124 118 128 82 Z', 'honey'),
      shape('leaf', 'M128 83 C118 70 127 49 142 41 C162 29 179 39 168 56 C158 73 139 63 128 83 Z', 'sageShade'),
      shape('body-glow', 'M106 163 C99 180 97 201 112 209 C119 215 121 209 116 201 C108 188 116 169 112 163 Z', 'honeyLight', { stroke: null }),
    ],
    joints: { 'leaf-root': [128, 82], 'leaf-tip': [164, 42] },
  },
  'enemy:BASIC': {
    root: [128, 220], center: [128, 142], collisionRadius: 91, referenceRadius: 10,
    softPivot: [128, 220], bounds: [27, 41, 200, 183],
    shapes: [...enemyFeet, shape('body', basicEnemyBody, 'coral'),
      oval('eye-left', 109, 139, 7, 10, 'brown', { stroke: null }), oval('eye-right', 149, 139, 7, 10, 'brown', { stroke: null }),
      line('brow-left', 'M101 129 L115 136', { width: 5 }), line('brow-right', 'M142 136 L156 129', { width: 5 }),
      oval('mouth', 128, 165, 16, 15, 'brown', { stroke: null }),
      shape('mouth-glint', 'M122 153 L135 153 Q136 161 129 162 Q122 162 122 153 Z', 'cream', { stroke: null }),
    ],
    joints: { 'bud-12': [128, 62], 'bud-2': [202, 117], 'bud-4': [201, 190], 'bud-8': [51, 189], 'bud-10': [52, 117], 'foot-left': [91, 220], 'foot-right': [165, 220], 'eye-left': [109, 139], 'eye-right': [149, 139], 'mouth': [128, 165] },
  },
  'enemy:SHARD': {
    root: [128, 224], center: [128, 150], collisionRadius: 106, referenceRadius: 9,
    softPivot: [128, 224], bounds: [19, 36, 218, 191],
    shapes: [
      shape('three-lobe-body', 'M84 126 C65 110 84 51 125 40 C154 45 188 99 173 124 C198 115 232 135 234 163 C241 205 213 226 178 222 C150 220 131 200 128 184 C123 205 101 226 70 223 C35 225 14 201 22 169 C29 138 58 113 84 126 Z', 'coral'),
      line('mark-top-left', 'M122 93 L122 106'), line('mark-top-right', 'M135 93 L135 106'),
      line('mark-left-1', 'M56 166 L64 157'), line('mark-left-2', 'M65 177 L74 168'),
      line('mark-right-1', 'M183 157 L192 166'), line('mark-right-2', 'M174 168 L183 177'),
      oval('mouth', 128, 146, 24, 27, 'brown', { stroke: null }),
      shape('tooth', 'M113 127 Q128 120 143 127 C141 142 135 157 128 159 C120 157 116 140 113 127 Z', 'cream', { stroke: null }),
    ],
    joints: { 'lobe-top': [128, 89], 'lobe-left': [68, 175], 'lobe-right': [185, 175], 'mouth': [128, 146] },
  },
  'boss:HIVE': {
    root: [128, 232], center: [128, 139], collisionRadius: 106, referenceRadius: 29,
    softPivot: [128, 232], bounds: [14, 28, 228, 198],
    shapes: [
      shape('ear-left', 'M96 61 C81 58 70 43 79 35 C90 26 108 41 109 59 Z', 'coral'),
      shape('ear-right', 'M146 59 C149 39 167 27 178 36 C191 47 168 61 157 62 Z', 'coral'),
      shape('three-layer-body-five-skirt-lobes', 'M82 69 C99 48 146 48 167 72 C180 86 182 92 181 98 C203 108 221 126 217 149 C220 166 222 178 235 193 C251 214 218 228 201 211 C185 232 160 229 148 213 C132 232 112 230 99 213 C80 230 62 232 51 211 C35 230 7 213 20 194 C32 178 35 168 39 150 C35 127 48 109 74 98 C70 89 75 77 82 69 Z', 'coral'),
      line('eye-left', 'M102 85 Q108 96 115 85'), line('eye-right', 'M141 85 Q147 96 154 85'),
      oval('aperture-upper-rim', 128, 122, 29, 27, 'pink'), oval('aperture-upper', 128, 122, 21, 21, 'brown', { width: 3 }),
      oval('aperture-lower-left-rim', 77, 172, 35, 27, 'pink'), oval('aperture-lower-left', 77, 172, 25, 21, 'brown', { width: 3 }),
      oval('aperture-lower-right-rim', 180, 172, 35, 27, 'pink'), oval('aperture-lower-right', 180, 172, 25, 21, 'brown', { width: 3 }),
    ],
    joints: { 'ear-left': [96, 51], 'ear-right': [161, 51], 'eye-left': [108, 90], 'eye-right': [147, 90], 'aperture-upper': [128, 122], 'aperture-lower-left': [77, 172], 'aperture-lower-right': [180, 172], 'skirt-1': [34, 211], 'skirt-2': [72, 215], 'skirt-3': [125, 217], 'skirt-4': [174, 216], 'skirt-5': [223, 211] },
  },
  'mechanic:NEST': {
    root: [128, 226], center: [128, 142], collisionRadius: 98, referenceRadius: 13,
    softPivot: [128, 226], bounds: [24, 40, 210, 188],
    shapes: [
      shape('foot-left', 'M62 206 C57 216 63 226 72 226 C85 226 87 215 81 209 Z', 'coral', { space: 'fixed' }),
      shape('foot-right', 'M176 209 C170 216 174 226 184 226 C196 226 202 218 195 206 Z', 'coral', { space: 'fixed' }),
      shape('three-lobe-body', 'M45 204 C34 184 26 165 31 142 C36 112 61 103 70 116 C80 124 82 133 85 151 C74 106 80 67 105 48 C125 30 151 40 165 65 C180 87 176 121 172 151 C176 132 179 115 196 111 C222 105 234 142 225 172 C222 184 218 193 212 206 C200 221 179 216 170 210 C147 220 107 220 85 210 C70 220 55 216 45 204 Z', 'coral'),
      oval('mouth', 128, 132, 28, 50, 'brown', { width: 3 }),
      oval('tooth-left', 116, 105, 4.5, 9, 'cream', { stroke: null }), oval('tooth-right', 139, 105, 4.5, 9, 'cream', { stroke: null }),
      shape('tongue', 'M108 162 C106 144 119 144 128 155 C137 142 150 146 148 161 C146 174 135 179 128 181 C119 177 111 173 108 162 Z', 'pink', { stroke: null }),
    ],
    joints: { 'lobe-left': [57, 168], 'lobe-center': [128, 108], 'lobe-right': [201, 168], 'mouth': [128, 132], 'tooth-left': [116, 105], 'tooth-right': [139, 105], 'tongue': [128, 164], 'foot-left': [72, 226], 'foot-right': [184, 226] },
    brokenMode: 'replace-body', replaceBodyId: 'three-lobe-body',
    brokenShapes: [
      shape('broken-center-lobe', 'M101 184 C79 157 80 83 106 55 C122 34 149 47 163 72 C177 101 176 156 156 184 C142 202 115 203 101 184 Z', 'coral'),
      shape('broken-left-lobe', 'M41 204 C21 177 24 142 44 126 C65 110 83 132 85 157 C84 172 99 186 92 199 C80 215 52 219 41 204 Z', 'coral'),
      shape('broken-right-lobe', 'M171 200 C165 185 179 177 174 159 C174 135 191 111 211 126 C234 142 231 181 213 205 C204 219 181 213 171 200 Z', 'coral'),
    ],
  },
  'mechanic:SEAL': {
    root: [128, 224], center: [128, 145], collisionRadius: 104, referenceRadius: 13,
    softPivot: [128, 224], bounds: [11, 62, 234, 158],
    shapes: [shape('claw-left', sealLeft, 'coral'), shape('claw-right', sealLeft, 'coral', { mirrorX: true })],
    brokenShapes: [shape('claw-left-top', sealTop, 'coral'), shape('claw-left-bottom', sealBottom, 'coral'), shape('claw-right-top', sealTop, 'coral', { mirrorX: true }), shape('claw-right-bottom', sealBottom, 'coral', { mirrorX: true })],
    joints: { 'claw-left': [65, 145], 'claw-right': [191, 145] },
  },
};

