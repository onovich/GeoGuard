// Boss B schema-1 artwork data. Editable body parts only; no gameplay imports.
const path = (id, d, fill = 'coral', options = {}) => ({ id, d, fill, stroke: 'brown', width: 4.5, ...options });
const oval = (id, x, y, rx, ry, fill, options = {}) => ({ id, ellipse: [x, y, rx, ry], fill, stroke: 'brown', width: 4.5, ...options });
const line = (id, d, options = {}) => path(id, d, null, { width: 3.2, ...options });
const eye = (id, x, y, fill = 'brown') => oval(id, x, y, 4.2, 6.8, fill, { stroke: null, width: 0 });
const part = (pivot, windup, attack, rigid = false) => ({ pivot, rigid, angleByPose: { windup, attack }, angleMin: -.32, angleMax: .32 });
const reuse = (rig, abilities, neutralAttacks = []) => ({
  ...rig,
  variants: { idle: { shapes: rig.shapes }, cast: { shapes: rig.shapes }, prepare: { shapes: rig.shapes } },
  poseVariants: { neutral: 'idle', windup: 'prepare', attack: 'cast', recover: 'idle' },
  phaseVariants: { 0: 'idle', 1: 'idle', 2: 'idle' },
  abilityVariants: Object.fromEntries(abilities.map(key => [key, { windup: 'prepare', attack: neutralAttacks.includes(key) ? 'idle' : 'cast', recover: 'idle' }])),
});

const moon = {
  root: [128, 228], center: [128, 137], collisionRadius: 100, referenceRadius: 26,
  softPivot: [128, 228], bounds: [61, 35, 135, 187],
  shapes: [
    path('crescent', 'M72 56 C98 32 139 36 165 60 C190 83 199 118 189 151 C181 184 158 205 125 211 C103 216 81 212 65 204 C60 201 63 196 68 192 C93 174 104 154 103 130 C104 101 92 80 72 68 C64 64 64 61 72 56 Z', 'honey'),
    path('crescent-highlight', 'M91 53 C119 44 146 56 158 70 C167 78 164 84 157 77 C141 60 116 54 95 59 C87 61 85 56 91 53 Z', 'honeyLight', { stroke: null }),
    path('coral-lower-rim', 'M111 205 C140 200 159 190 171 174 C177 166 187 168 188 177 C189 185 179 197 166 205 C151 215 134 221 116 223 C107 224 102 221 101 215 C100 210 104 207 111 205 Z'),
    eye('eye-left', 126, 115), eye('eye-right', 159, 107),
    path('mouth', 'M134 130 C142 136 151 136 161 128 C163 126 165 129 164 134 C161 150 146 153 138 144 C135 141 131 132 134 130 Z', 'brown', { stroke: null }),
  ],
  joints: { 'crescent-upper-tip': [70, 61], 'crescent-lower-tip': [65, 201], 'crescent-waist': [103, 130], 'coral-lower-rim': [145, 206], 'eye-left': [126, 115], 'eye-right': [159, 107], mouth: [149, 136] },
};

const dragon = {
  root: [128, 225], center: [128, 141], collisionRadius: 115, referenceRadius: 32,
  softPivot: [128, 225], bounds: [14, 51, 230, 163],
  shapes: [
    path('wing-left', 'M110 110 C101 85 80 65 61 70 C49 73 39 83 39 90 C39 100 50 100 61 94 C57 105 61 110 68 109 C74 109 79 102 82 101 C79 114 89 119 98 112 C104 117 111 116 110 110 Z', 'coral', { partId: 'wing-left' }),
    path('wing-right', 'M146 98 C156 85 169 74 165 60 C161 44 136 42 126 47 C117 52 123 61 137 64 C124 65 124 74 137 80 C128 87 137 96 146 98 Z', 'coral', { partId: 'wing-right' }),
    path('body-tail', 'M46 130 C55 123 54 110 42 109 C26 107 12 129 13 150 C14 178 34 197 59 199 C92 204 116 183 133 161 C150 137 160 137 177 141 C194 145 209 142 221 132 C231 121 232 104 219 93 C203 81 179 83 155 86 C124 87 105 102 86 127 C73 145 66 157 52 159 C40 158 36 145 46 130 Z'),
    eye('eye-left', 189, 104), eye('eye-right', 204, 103),
    path('muzzle-neck', 'M216 100 C224 89 237 89 241 104 C244 115 242 136 233 140 C225 144 217 135 216 128 Z', 'coral', { partId: 'muzzle' }),
    oval('muzzle-rim', 234, 114, 10, 22, 'coralShade', { partId: 'muzzle', width: 3.6 }),
    oval('muzzle-aperture', 235, 114, 5.6, 15.5, 'brown', { partId: 'muzzle', stroke: null }),
  ],
  joints: { 'tail-tip': [43, 120], 'tail-body-continuity': [96, 161], 'wing-left': [104, 112], 'wing-left-tip': [45, 89], 'wing-right': [146, 95], 'wing-right-tip': [137, 49], 'eye-left': [189, 104], 'eye-right': [204, 103], muzzle: [218, 115], 'muzzle-aperture': [235, 114] },
  partTransforms: { 'wing-left': part([104, 112], -.10, .08), 'wing-right': part([146, 95], .09, -.08), muzzle: part([218, 115], 0, 0, true) },
};

const spider = {
  root: [128, 228], center: [128, 152], collisionRadius: 111, referenceRadius: 31,
  softPivot: [128, 228], bounds: [20, 78, 216, 150],
  shapes: [
    path('foot-left', 'M93 205 C88 214 90 222 97 223 C105 224 109 217 107 207 Z', 'coralShade', { space: 'fixed' }),
    path('foot-right', 'M149 207 C147 215 151 224 159 223 C166 222 168 214 163 205 Z', 'coralShade', { space: 'fixed' }),
    path('abdomen', 'M56 172 C53 128 72 80 123 78 C173 74 201 114 200 163 C198 188 185 204 164 209 C144 214 99 214 79 207 C65 202 57 189 56 172 Z'),
    path('leg-outer-left', 'M71 132 C65 120 49 126 36 140 C23 153 16 178 19 193 C20 205 35 210 43 200 C50 190 47 176 57 157 C64 145 78 143 71 132 Z', 'coral', { partId: 'leg-outer-left' }),
    path('leg-outer-right', 'M185 132 C191 120 207 126 220 140 C233 153 240 178 237 193 C236 205 221 210 213 200 C206 190 209 176 199 157 C192 145 178 143 185 132 Z', 'coral', { partId: 'leg-outer-right' }),
    path('leg-inner-left', 'M86 153 C83 141 71 143 61 155 C50 169 45 194 49 209 C51 219 65 222 73 212 C78 204 74 188 84 169 C87 163 89 157 86 153 Z', 'coral', { partId: 'leg-inner-left' }),
    path('leg-inner-right', 'M170 153 C173 141 185 143 195 155 C206 169 211 194 207 209 C205 219 191 222 183 212 C178 204 182 188 172 169 C169 163 167 157 170 153 Z', 'coral', { partId: 'leg-inner-right' }),
    oval('eye-left', 115, 164, 4.8, 5.6, 'brown', { stroke: null }),
    oval('eye-right', 141, 164, 4.8, 5.6, 'brown', { stroke: null }),
    line('smile', 'M123 175 Q128 181 133 175', { width: 3.1 }),
  ],
  joints: { 'abdomen-top': [128, 80], 'leg-outer-left': [64, 138], 'leg-outer-right': [192, 138], 'leg-inner-left': [77, 155], 'leg-inner-right': [179, 155], 'foot-left': [98, 223], 'foot-right': [158, 223], 'eye-left': [115, 164], 'eye-right': [141, 164], smile: [128, 177] },
  partTransforms: { 'leg-outer-left': part([64, 138], .025, -.025), 'leg-outer-right': part([192, 138], -.025, .025), 'leg-inner-left': part([77, 155], -.02, .02), 'leg-inner-right': part([179, 155], .02, -.02) },
};

const astrolabe = {
  root: [128, 228], center: [128, 142], collisionRadius: 104, referenceRadius: 33,
  softPivot: [128, 228], bounds: [43, 41, 165, 175],
  shapes: [
    path('moon-shell', 'M136 45 C112 43 66 74 51 111 C36 144 42 179 67 198 C91 218 136 224 170 207 C187 199 201 182 204 164 C206 151 197 146 188 155 C175 173 154 185 134 180 C105 177 90 155 95 129 C99 104 114 75 137 54 C142 49 142 45 136 45 Z'),
    path('shell-highlight', 'M114 62 C89 75 66 98 59 117 C56 126 60 131 64 121 C74 97 98 80 117 69 C124 65 122 58 114 62 Z', 'coralLight', { stroke: null }),
    oval('shell-dot', 75, 167, 5.6, 6.2, 'brown', { stroke: null }),
    line('shell-line', 'M84 180 L92 187', { width: 3 }),
    oval('center-orb', 144, 126, 37, 37, '#625578', { partId: 'center-orb' }),
    eye('orb-eye-left', 135, 125, 'cream'), eye('orb-eye-right', 152, 125, 'cream'),
    oval('orbit-orb', 194, 76, 15, 15, 'coral', { partId: 'orbit-orb', width: 4 }),
    oval('orbit-highlight', 189, 70, 3.6, 4, 'coralLight', { partId: 'orbit-orb', stroke: null }),
  ],
  joints: { 'moon-shell-upper-tip': [137, 48], 'moon-shell-lower-tip': [201, 157], 'shell-dot': [75, 167], 'shell-line': [88, 183], 'center-orb': [144, 126], 'orb-eye-left': [135, 125], 'orb-eye-right': [152, 125], 'orbit-orb': [194, 76] },
  partTransforms: { 'center-orb': part([144, 126], 0, 0), 'orbit-orb': part([194, 76], 0, 0) },
};
// The center sphere and its two eyes share one transform, including future local rotation.
astrolabe.shapes = astrolabe.shapes.map(shape => shape.id.startsWith('orb-eye-') ? { ...shape, partId: 'center-orb' } : shape);

const forgeLeftDoor = 'M35 119 C41 116 59 119 73 123 C78 125 81 130 79 137 L76 148 L70 148 L65 197 L72 198 L71 210 C69 217 63 221 56 219 L27 215 C18 212 19 204 20 194 L25 141 C27 128 27 122 35 119 Z';
const forgeDoorDetail = (side, mirrorX = false) => [
  path(`door-${side}`, forgeLeftDoor, 'coral', { partId: `door-${side}`, mirrorX }),
  line(`door-${side}-mark-1`, 'M41 135 L39 142', { partId: `door-${side}`, mirrorX, stroke: 'coralShade', width: 3.8 }),
  line(`door-${side}-mark-2`, 'M32 159 L31 166', { partId: `door-${side}`, mirrorX, stroke: 'coralShade', width: 3.8 }),
  line(`door-${side}-mark-3`, 'M43 185 L42 192', { partId: `door-${side}`, mirrorX, stroke: 'coralShade', width: 3.8 }),
];
// Right door is explicitly reflected at authoring time; its runtime pivot remains on the right.
const reflectPath = d => d.replace(/[MLCQZ]|-?(?:\d+\.?\d*|\.\d+)/g, (() => { let index = 0; return token => { if (/^[MLCQZ]$/.test(token)) { index = 0; return token; } return String(index++ % 2 === 0 ? 256 - Number(token) : Number(token)); }; })());
const explicitRight = shapes => shapes.map(shape => ({ ...shape, d: reflectPath(shape.d), mirrorX: false }));
const insetHorizontal = (rig, ratio) => {
  const x = value => 128 + (value - 128) * ratio;
  const point = value => [x(value[0]), value[1]];
  const transformPath = d => d.replace(/[MLCQZ]|-?(?:\d+\.?\d*|\.\d+)/g, (() => { let index = 0; return token => { if (/^[MLCQZ]$/.test(token)) { index = 0; return token; } return String(index++ % 2 === 0 ? x(Number(token)) : Number(token)); }; })());
  return { ...rig, bounds: [x(rig.bounds[0]), rig.bounds[1], rig.bounds[2] * ratio, rig.bounds[3]],
    shapes: rig.shapes.map(shape => shape.d ? { ...shape, d: transformPath(shape.d) } : { ...shape, ellipse: [x(shape.ellipse[0]), shape.ellipse[1], shape.ellipse[2] * ratio, shape.ellipse[3]] }),
    joints: Object.fromEntries(Object.entries(rig.joints).map(([id, value]) => [id, point(value)])),
    partTransforms: Object.fromEntries(Object.entries(rig.partTransforms).map(([id, value]) => [id, { ...value, pivot: point(value.pivot) }])),
  };
};
const forge = {
  root: [128, 232], center: [128, 151], collisionRadius: 110, referenceRadius: 35,
  softPivot: [128, 232], bounds: [18, 62, 220, 173],
  shapes: [
    path('foot-left', 'M39 216 C29 216 25 227 28 231 C32 236 52 233 60 233 C66 232 65 219 56 216 Z', 'coralShade', { space: 'fixed' }),
    path('foot-right', 'M200 216 C191 219 190 232 196 233 C205 233 224 236 228 231 C231 226 228 218 217 216 Z', 'coralShade', { space: 'fixed' }),
    path('arch-body', 'M40 210 C38 167 48 112 79 93 C85 71 104 61 128 62 C153 62 173 73 177 93 C208 110 218 164 216 210 C215 223 200 224 177 221 C169 218 169 200 168 181 C166 151 158 141 129 141 C99 141 89 151 88 181 L86 215 C85 224 62 224 47 222 C42 221 40 217 40 210 Z'),
    path('core-chamber', 'M90 216 L91 181 C92 158 104 145 128 145 C152 145 166 158 165 181 L167 216 Z', 'brown', { stroke: null }),
    oval('core-orb', 128, 185, 26, 26, '#F6CF59', { width: 2.6, stroke: 'honeyLight' }),
    line('core-highlight-left', 'M115 171 Q106 180 112 190', { stroke: 'honeyLight', width: 4.2 }),
    line('core-highlight-right', 'M141 177 Q147 181 145 188', { stroke: 'honeyLight', width: 4.2 }),
    oval('core-highlight-bottom', 129, 202, 3.3, 4.6, 'honeyLight', { stroke: null }),
    path('face-window', 'M103 100 C107 87 147 87 152 101 C159 115 158 126 150 129 L106 129 C97 126 98 114 103 100 Z', 'brown', { stroke: null }),
    eye('eye-left', 118, 110, 'cream'), eye('eye-right', 139, 110, 'cream'),
    line('arch-mark-left', 'M102 78 L100 83', { stroke: 'coralShade' }),
    line('arch-mark-right', 'M155 82 L158 87', { stroke: 'coralShade' }),
    ...forgeDoorDetail('left'), ...explicitRight(forgeDoorDetail('right', true)),
  ],
  joints: { 'arch-crown': [128, 64], 'door-left': [74, 134], 'door-right': [182, 134], 'foot-left': [44, 233], 'foot-right': [212, 233], 'face-window': [128, 109], 'eye-left': [118, 110], 'eye-right': [139, 110], 'core-orb': [128, 185] },
  partTransforms: { 'door-left': part([74, 134], -.14, .10, true), 'door-right': part([182, 134], .14, -.10, true) },
};

const conductorArmLeft = 'M89 148 C72 163 47 165 33 151 C21 139 19 119 24 107 C26 101 41 103 43 109 C38 127 43 139 55 140 C66 141 72 132 80 125 Z';
const conductorHandLeft = 'M24 117 C21 101 23 83 25 70 C19 64 18 58 22 48 C24 40 31 38 35 44 L34 59 C37 54 39 42 44 38 C50 33 57 39 54 46 L47 61 C53 58 57 47 63 47 C71 46 73 54 67 61 L51 77 C46 89 46 106 43 120 C39 133 26 133 24 117 Z';
const conductor = {
  root: [128, 234], center: [128, 144], collisionRadius: 114, referenceRadius: 29,
  softPivot: [128, 234], bounds: [17, 34, 222, 204],
  shapes: [
    path('arm-left', conductorArmLeft), path('arm-right', reflectPath(conductorArmLeft)),
    path('hand-forearm-left', conductorHandLeft, 'coral', { partId: 'hand-forearm-left' }),
    path('hand-forearm-right', reflectPath(conductorHandLeft), 'coral', { partId: 'hand-forearm-right' }),
    path('robe-three-skirt-lobes', 'M128 69 C144 69 151 97 156 126 C163 174 179 202 205 220 C214 227 205 234 191 233 C180 234 166 230 157 222 C153 237 140 238 128 238 C113 238 102 235 98 222 C86 230 72 234 59 233 C46 233 40 226 49 220 C76 201 91 173 100 123 C106 93 113 69 128 69 Z'),
    path('robe-side-left-shade', 'M101 143 C94 178 79 211 61 225 C73 229 87 225 98 215 C105 191 109 164 110 145 Z', 'coralShade', { stroke: null }),
    path('robe-side-right-shade', 'M155 143 C162 178 177 211 195 225 C183 229 169 225 158 215 C151 191 147 164 146 145 Z', 'coralShade', { stroke: null }),
    path('face-window', 'M128 86 C114 86 109 121 110 151 C111 174 117 205 128 223 C139 205 145 173 146 151 C147 121 143 86 128 86 Z', 'brown', { stroke: null }),
    eye('eye-left', 119, 111, 'cream'), eye('eye-right', 136, 111, 'cream'),
    line('skirt-left-notch', 'M98 212 Q98 218 98 223', { width: 2.8 }),
    line('skirt-right-notch', 'M158 212 Q157 218 157 223', { width: 2.8 }),
  ],
  joints: { 'robe-crown': [128, 70], 'arm-left': [82, 139], 'arm-right': [174, 139], 'hand-forearm-left': [34, 116], 'hand-forearm-right': [222, 116], 'finger-left-1': [28, 48], 'finger-left-2': [47, 39], 'finger-left-3': [65, 53], 'finger-right-1': [228, 48], 'finger-right-2': [209, 39], 'finger-right-3': [191, 53], 'skirt-left': [63, 229], 'skirt-center': [128, 234], 'skirt-right': [192, 229], 'face-window': [128, 137], 'eye-left': [119, 111], 'eye-right': [136, 111] },
  partTransforms: { 'hand-forearm-left': { pivot: [34, 116], rigid: false, angleByPose: { windup: .65, attack: -.04 }, angleMin: -.08, angleMax: .65 }, 'hand-forearm-right': { pivot: [222, 116], rigid: false, angleByPose: { windup: -.65, attack: .04 }, angleMin: -.65, angleMax: .08 } },
};
for (const side of ['left', 'right']) for (let finger = 1; finger <= 3; finger++) conductor.partTransforms[`finger-${side}-${finger}`] = conductor.partTransforms[`hand-forearm-${side}`];

const keeperDoorLeft = 'M35 119 C44 118 58 118 66 121 C72 123 74 126 74 134 L74 145 L68 145 L68 193 L74 194 L74 207 C74 215 70 218 60 218 L31 218 C23 218 22 214 22 205 L23 141 C23 127 24 120 35 119 Z';
const keeper = {
  root: [128, 232], center: [128, 149], collisionRadius: 110, referenceRadius: 33,
  softPivot: [128, 232], bounds: [20, 58, 216, 176],
  shapes: [
    path('foot-left', 'M35 215 C29 216 28 226 29 231 C32 235 52 233 58 233 C65 231 63 219 58 215 Z', 'coralShade', { space: 'fixed' }),
    path('foot-right', 'M198 215 C193 219 191 231 198 233 C204 233 224 235 227 231 C228 226 227 216 221 215 Z', 'coralShade', { space: 'fixed' }),
    path('empty-arch-body', 'M46 218 C43 172 44 117 82 91 C87 69 106 59 128 59 C150 59 169 68 174 91 C211 114 213 172 210 218 C209 224 187 224 175 220 C170 218 169 206 169 185 C169 158 157 137 129 137 C101 137 87 158 87 185 L85 218 C83 224 51 225 46 218 Z'),
    path('face-window', 'M106 96 C112 85 144 85 150 96 C157 111 157 121 150 125 L107 125 C99 122 99 110 106 96 Z', 'brown', { stroke: null }),
    eye('eye-left', 117, 107, 'cream'), eye('eye-right', 138, 107, 'cream'),
    line('arch-mark-left-1', 'M94 96 L91 99', { stroke: 'coralShade' }),
    line('arch-mark-left-2', 'M83 111 L82 115', { stroke: 'coralShade' }),
    line('arch-mark-right-1', 'M163 99 L166 103', { stroke: 'coralShade' }),
    line('arch-mark-right-2', 'M179 116 L180 120', { stroke: 'coralShade' }),
    path('door-left', keeperDoorLeft, 'coral', { partId: 'door-left' }),
    path('door-right', reflectPath(keeperDoorLeft), 'coral', { partId: 'door-right' }),
    line('door-left-mark-1', 'M43 132 L42 138', { partId: 'door-left', stroke: 'coralShade' }),
    line('door-left-mark-2', 'M39 162 L38 168', { partId: 'door-left', stroke: 'coralShade' }),
    line('door-left-mark-3', 'M51 190 L50 196', { partId: 'door-left', stroke: 'coralShade' }),
    line('door-right-mark-1', 'M213 132 L214 138', { partId: 'door-right', stroke: 'coralShade' }),
    line('door-right-mark-2', 'M217 162 L218 168', { partId: 'door-right', stroke: 'coralShade' }),
    line('door-right-mark-3', 'M205 190 L206 196', { partId: 'door-right', stroke: 'coralShade' }),
  ],
  joints: { 'arch-crown': [128, 61], 'arch-opening': [128, 188], 'door-left': [70, 135], 'door-right': [186, 135], 'foot-left': [46, 233], 'foot-right': [210, 233], 'face-window': [128, 107], 'eye-left': [117, 107], 'eye-right': [138, 107] },
  partTransforms: { 'door-left': part([70, 135], -.11, .08, true), 'door-right': part([186, 135], .11, -.08, true) },
};

const bloom = {
  root: [128, 234], center: [128, 146], collisionRadius: 108, referenceRadius: 32,
  softPivot: [128, 234], bounds: [23, 49, 209, 186],
  shapes: [
    path('rear-leaf-left', 'M75 171 C50 171 28 183 24 207 C24 213 30 215 40 214 C60 214 83 207 96 196 Z', 'coralShade'),
    path('rear-leaf-right', 'M181 171 C206 171 228 183 232 207 C232 213 226 215 216 214 C196 214 173 207 160 196 Z', 'coralShade'),
    path('main-petal-top', 'M128 49 C152 63 173 84 178 115 C180 148 160 176 128 183 C97 176 76 149 78 117 C82 84 106 63 128 49 Z'),
    path('base-leaf-left', 'M125 204 C116 193 90 194 76 207 C64 216 65 228 77 232 C95 239 117 228 129 214 Z', 'sageShade', { space: 'fixed' }),
    path('base-leaf-right', 'M131 204 C140 193 166 194 180 207 C192 216 191 228 179 232 C161 239 139 228 127 214 Z', 'sageShade', { space: 'fixed' }),
    line('base-vein-left', 'M94 222 Q105 211 116 208', { width: 2.2, space: 'fixed' }),
    line('base-vein-right', 'M162 222 Q151 211 140 208', { width: 2.2, space: 'fixed' }),
    oval('mouth', 128, 143, 46, 41, 'brown', { width: 3.3 }),
    path('tooth-upper-left', 'M97 117 C102 109 107 107 111 107 L107 129 C105 137 100 131 97 117 Z', 'cream', { stroke: null }),
    path('tooth-upper-center', 'M114 105 C122 101 134 101 141 105 L131 126 C129 131 126 131 123 125 Z', 'cream', { stroke: null }),
    path('tooth-upper-right', 'M145 107 C151 109 156 112 160 118 L151 131 C148 136 145 127 145 107 Z', 'cream', { stroke: null }),
    path('tooth-lower-left', 'M97 166 C100 150 105 146 108 153 L115 180 C108 180 102 175 97 166 Z', 'cream', { stroke: null }),
    path('tooth-lower-center', 'M115 181 L124 155 C127 147 130 151 133 158 L141 180 C133 184 122 184 115 181 Z', 'cream', { stroke: null }),
    path('tooth-lower-right', 'M142 180 L149 154 C151 147 156 153 160 166 C155 173 149 177 142 180 Z', 'cream', { stroke: null }),
    path('main-petal-left', 'M127 202 C105 219 81 206 65 185 C48 169 27 139 28 120 C30 110 58 111 80 125 C101 139 113 170 127 202 Z', 'coral', { partId: 'main-petal-left' }),
    path('main-petal-right', 'M129 202 C151 219 175 206 191 185 C208 169 229 139 228 120 C226 110 198 111 176 125 C155 139 143 170 129 202 Z', 'coral', { partId: 'main-petal-right' }),
    line('petal-top-mark-left', 'M103 91 L101 95', { stroke: 'coralShade', width: 3 }),
    line('petal-top-mark-right', 'M153 91 L155 95', { stroke: 'coralShade', width: 3 }),
    line('petal-left-mark', 'M65 147 L69 153', { partId: 'main-petal-left', stroke: 'coralShade', width: 3 }),
    line('petal-right-mark', 'M191 147 L187 153', { partId: 'main-petal-right', stroke: 'coralShade', width: 3 }),
  ],
  joints: { 'main-petal-top': [128, 143], 'main-petal-top-tip': [128, 49], 'main-petal-left': [125, 201], 'main-petal-right': [131, 201], 'rear-leaf-left': [83, 191], 'rear-leaf-right': [173, 191], 'foot-base-leaf-left': [101, 222], 'foot-base-leaf-right': [155, 222], mouth: [128, 143], 'tooth-upper-left': [105, 112], 'tooth-upper-center': [128, 104], 'tooth-upper-right': [150, 113], 'tooth-lower-left': [107, 176], 'tooth-lower-center': [128, 181], 'tooth-lower-right': [149, 176] },
  partTransforms: { 'main-petal-left': part([125, 201], .065, -.045), 'main-petal-right': part([131, 201], -.065, .045) },
};

export const BOSS_RIGS_B = {
  'boss:TWINS_MOON': reuse(moon, ['eclipsePulse', 'lunarSnare', 'shadowArc', 'soloLunarOrbit', 'twinCrossfire'], ['lunarSnare', 'shadowArc', 'soloLunarOrbit']),
  'boss:DRAGON': reuse(insetHorizontal(dragon, .91), ['dragonStrafe', 'emberWake', 'infernoRing', 'meteorRain', 'skyDive', 'wingBuffet']),
  'boss:SPIDER_MATRIARCH': reuse(spider, ['broodAmbush', 'nestBloom', 'silkVolley', 'spawnSpiderlings', 'webField', 'webTrap']),
  'boss:ASTROLABE': reuse(astrolabe, ['eventHorizon', 'gravityWell', 'orbitalLock', 'orbitalShots', 'singularity', 'starfall']),
  'boss:BLOOD_FORGE': reuse(forge, ['brandLine', 'forgeArmor', 'forgeDetonation', 'moltenBurst', 'sacrificeMinions', 'slagDrop']),
  'boss:VOID_CONDUCTOR': reuse(conductor, ['conductLines', 'crescendo', 'finale', 'pulseMeasure', 'syncopate', 'tempoShift']),
  'boss:LABYRINTH_KEEPER': reuse(keeper, ['corridorClamp', 'deadEnd', 'gateSwap', 'mazeCrush', 'mazeFold', 'raiseWalls']),
  'boss:NIGHTMARE_BLOOM': reuse(bloom, ['blightRoots', 'creepingCanopy', 'gardenWake', 'poisonBloom', 'seedPods', 'sporeBurst']),
};
