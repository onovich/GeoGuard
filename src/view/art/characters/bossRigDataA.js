// Boss A authored body geometry. Contract schema 1; all coordinates use 256x256.
// No effects, gameplay references, resource loading or shared registry writes.
const path = (id, d, fill = 'coral', options = {}) => ({ id, d, fill, stroke: 'brown', width: 4.5, ...options });
const oval = (id, x, y, rx, ry, fill, options = {}) => ({ id, ellipse: [x, y, rx, ry], fill, stroke: 'brown', width: 4.5, ...options });
const line = (id, d, options = {}) => path(id, d, null, { width: 3.5, ...options });
const ink = (id, d, options = {}) => path(id, d, 'brown', { stroke: null, width: 0, ...options });
const rotate = (pivot, windup, attack, amplitude = 0) => ({ pivot, rigid: false, angleByPose: { windup, attack }, sway: { amplitude, period: .72 }, angleMin: -.24, angleMax: .24 });
const selectors = (abilities, neutralShapes, actionShapes = neutralShapes, windupShapes = neutralShapes, recoverShapes = neutralShapes) => ({
  variants: { neutralBody: { shapes: neutralShapes }, windupBody: { shapes: windupShapes }, attackBody: { shapes: actionShapes }, openBody: { shapes: recoverShapes } },
  poseVariants: { neutral: 'neutralBody', move: 'neutralBody', windup: 'windupBody', attack: 'attackBody', recover: 'openBody' },
  phaseVariants: { 0: 'neutralBody', 1: 'neutralBody', 2: 'neutralBody' },
  abilityVariants: Object.fromEntries(abilities.map(id => [id, { windup: 'windupBody', attack: 'attackBody', recover: 'openBody' }])),
});

const commanderShapes = [
  path('foot-left', 'M73 214 C64 217 66 232 79 232 L91 232 C103 232 105 222 99 216 Z', 'brown', { space: 'fixed' }),
  path('foot-right', 'M158 216 C151 222 153 232 165 232 L177 232 C190 232 192 219 183 214 Z', 'brown', { space: 'fixed' }),
  path('body-three-crown-lobes', 'M65 118 C58 108 61 94 74 91 C69 77 81 65 99 75 C99 48 125 44 137 68 C156 54 178 62 181 80 C197 80 204 102 191 120 L199 183 C202 204 188 220 169 218 C152 228 142 221 128 224 C112 224 102 228 88 217 C69 224 52 204 57 184 Z'),
  path('arm-left', 'M68 125 C56 125 51 115 49 106 C47 98 47 91 38 88 C28 82 19 88 15 96 C1 119 7 143 26 150 C33 153 42 150 48 157 L64 177 C80 170 82 142 68 125 Z', 'coral', { partId: 'arm-left' }),
  path('arm-right', 'M188 125 C200 125 205 115 207 106 C209 98 209 91 218 88 C228 82 237 88 241 96 C255 119 249 143 230 150 C223 153 214 150 208 157 L192 177 C176 170 174 142 188 125 Z', 'coral', { partId: 'arm-right' }),
  path('fist-left', 'M57 150 C65 143 78 147 81 154 C86 161 80 167 77 169 C86 179 76 188 68 187 C59 199 44 189 46 181 C32 179 34 164 44 158', 'coral', { partId: 'arm-left' }),
  path('fist-right', 'M199 150 C191 143 178 147 175 154 C170 161 176 167 179 169 C170 179 180 188 188 187 C197 199 212 189 210 181 C224 179 222 164 212 158', 'coral', { partId: 'arm-right' }),
  line('thumb-left', 'M37 90 Q40 94 37 98', { partId: 'arm-left', width: 3 }),
  line('thumb-right', 'M219 90 Q216 94 219 98', { partId: 'arm-right', width: 3 }),
  path('mouth', 'M115 147 L141 147 L141 160 C142 181 114 181 115 160 Z', 'brown', { width: 3 }),
  path('single-tooth', 'M120 146 L136 146 L136 160 C136 174 120 174 120 160 Z', 'cream', { stroke: null }),
  ink('brow-slot', 'M88 131 C103 125 110 136 128 136 C146 136 154 126 169 131 C179 147 151 153 128 153 C105 153 77 146 88 131 Z'),
];

const hunterShapes = [
  path('foot-left', 'M66 211 C59 217 60 230 73 230 C85 230 91 221 83 213 Z', 'brown', { space: 'fixed' }),
  path('foot-right', 'M161 212 C155 218 164 229 176 229 C189 229 193 220 183 214 Z', 'brown', { space: 'fixed' }),
  path('rear-ear', 'M123 128 C103 111 94 99 72 92 C51 86 35 97 36 111 C38 131 61 133 77 135 L109 140 Z', 'coral', { partId: 'rear-ear' }),
  path('body-one-horn', 'M64 169 C85 142 111 125 147 128 C143 119 145 114 152 117 C173 128 193 145 199 168 L190 200 C175 218 131 220 106 214 C87 212 69 205 61 193 Z'),
  path('rear-lobe', 'M69 160 C51 161 37 172 31 183 C29 190 39 191 51 185 C34 201 35 212 49 216 C67 220 85 209 91 192', 'coral', { partId: 'rear-lobe' }),
  path('nose-wedge', 'M198 164 C212 172 230 190 238 205 C225 210 207 202 183 205 C173 188 181 170 198 164 Z'),
  ink('near-eye', 'M165 165 C163 179 166 191 176 189 C185 187 188 177 185 169 Z'),
  oval('eye-white', 176, 178, 4.5, 5.5, 'cream', { stroke: null }),
  line('near-brow', 'M160 157 Q171 169 185 171', { width: 7 }),
  line('mouth-nose-root', 'M183 204 Q191 200 202 202', { width: 3 }),
];

const fortressFeet = [
  path('foot-left', 'M75 212 C73 224 86 226 91 216 Z', 'coralShade', { space: 'fixed' }),
  path('foot-right', 'M165 216 C170 226 183 223 181 212 Z', 'coralShade', { space: 'fixed' }),
];
const fortressBase = path('lower-body', 'M77 180 C91 161 165 160 179 180 L184 207 C163 226 91 226 73 208 Z');
const fortressPost = path('shell-connector', 'M121 146 L135 146 L135 183 L121 183 Z', 'brown', { width: 3 });
const fortressClosedShell = path('single-top-shell', 'M54 172 C61 113 86 91 128 90 C173 90 198 120 202 172 C173 170 159 195 128 199 C96 195 80 170 54 172 Z');
const fortressRaisedShell = path('single-top-shell', 'M58 150 C62 97 86 67 128 67 C170 67 194 97 198 150 C160 145 97 145 58 150 Z');
const fortressFront = [
  path('shield-left', 'M58 128 C36 134 12 160 17 186 C18 209 42 219 66 216 C92 215 91 192 84 174 C78 157 66 147 54 146', 'coral', { partId: 'shield-left' }),
  path('shield-right', 'M198 128 C220 134 244 160 239 186 C238 209 214 219 190 216 C164 215 165 192 172 174 C178 157 190 147 202 146', 'coral', { partId: 'shield-right' }),
  oval('shield-left-round-end', 44, 214, 11, 11, 'coral', { partId: 'shield-left' }),
  oval('shield-right-round-end', 212, 214, 11, 11, 'coral', { partId: 'shield-right' }),
  path('face-window', 'M96 197 C98 178 109 168 128 168 C147 168 158 178 160 197 C146 205 110 205 96 197 Z', 'cream', { width: 4 }),
  oval('eye-left', 120, 187, 3.4, 6.5, 'brown', { stroke: null }),
  oval('eye-right', 136, 187, 3.4, 6.5, 'brown', { stroke: null }),
];
const fortressShapes = [...fortressFeet, fortressBase, fortressPost, fortressClosedShell, ...fortressFront];
const fortressAttack = [...fortressFeet, fortressBase, fortressPost, fortressRaisedShell, ...fortressFront];

const prismShapes = [
  path('soft-diamond-robe', 'M121 42 C126 34 131 34 136 42 C155 63 160 98 188 117 L188 156 C158 183 150 217 134 234 C131 238 125 238 121 232 C105 213 94 180 66 155 L67 118 C96 99 103 64 121 42 Z'),
  ink('long-black-face-window', 'M128 54 C114 69 104 110 106 141 C108 174 121 195 126 219 C129 226 130 217 132 208 C140 182 149 158 150 130 C150 99 141 67 128 54 Z'),
  oval('eye-left', 120, 108, 4.2, 9, 'cream', { stroke: null }),
  oval('eye-right', 137, 108, 4.2, 9, 'cream', { stroke: null }),
  path('mirror-left-frame', 'M46 94 C24 88 18 115 25 144 C31 172 45 185 59 178 C75 170 77 145 66 119 C61 106 55 98 46 94 Z', 'coral', { partId: 'mirror-left' }),
  path('mirror-left-glass', 'M44 111 C35 105 31 119 35 138 C39 157 47 168 55 164 C66 159 62 140 55 124 C51 117 48 113 44 111 Z', '#B39ADD', { partId: 'mirror-left', width: 3.3 }),
  path('mirror-right-frame', 'M210 94 C232 88 238 115 231 144 C225 172 211 185 197 178 C181 170 179 145 190 119 C195 106 201 98 210 94 Z', 'coral', { partId: 'mirror-right' }),
  path('mirror-right-glass', 'M212 111 C221 105 225 119 221 138 C217 157 209 168 201 164 C190 159 194 140 201 124 C205 117 208 113 212 111 Z', '#B39ADD', { partId: 'mirror-right', width: 3.3 }),
];

const frostShapes = [
  path('bottom-lobe-left', 'M97 211 C93 224 106 230 112 218 Z'),
  path('bottom-lobe-right', 'M144 218 C151 230 163 223 159 211 Z'),
  path('single-U-collar', 'M78 77 C84 67 74 61 68 67 C42 89 32 124 43 160 C51 194 84 210 109 220 L122 230 C126 234 130 234 134 230 L147 220 C174 211 205 194 213 160 C224 124 214 89 188 67 C181 62 171 68 177 77 C193 96 185 125 164 145 C153 156 139 160 128 160 C115 160 101 155 91 144 C70 126 62 96 78 77 Z', '#C7E4F4'),
  path('collar-ice-left', 'M48 133 C52 166 74 188 106 201 L118 218 C97 210 73 196 60 181 C49 166 44 149 48 133 Z', '#A8D7F0', { stroke: null }),
  path('collar-ice-right', 'M208 133 C204 166 182 188 150 201 L138 218 C159 210 183 196 196 181 C207 166 212 149 208 133 Z', '#A8D7F0', { stroke: null }),
  oval('round-head', 128, 120, 48, 42, 'coral'),
  line('eye-slot-left', 'M107 115 Q117 123 127 118', { width: 5.5 }),
  line('eye-slot-right', 'M129 118 Q139 123 149 115', { width: 5.5 }),
  path('mouth', 'M120 120 Q128 116 136 120 C137 135 132 146 128 146 C123 142 120 133 120 120 Z', 'brown', { width: 3 }),
  path('single-tooth', 'M124 122 L132 122 C132 132 130 140 128 140 C126 136 124 131 124 122 Z', 'cream', { stroke: null }),
  path('fist-left', 'M55 169 C42 151 22 157 25 169 C11 172 8 188 18 194 C9 206 21 220 34 215 C41 233 55 229 60 218 C73 216 80 196 73 179 C71 168 65 164 55 169 Z', 'coral', { partId: 'fist-left' }),
  path('fist-right', 'M201 169 C214 151 234 157 231 169 C245 172 248 188 238 194 C247 206 235 220 222 215 C215 233 201 229 196 218 C183 216 176 196 183 179 C185 168 191 164 201 169 Z', 'coral', { partId: 'fist-right' }),
  path('single-crown', 'M108 70 L104 50 L117 55 L128 35 L139 55 L152 50 L147 70 Z', '#C7E4F4'),
  path('crown-blue-face', 'M126 41 L127 67 L143 67 L148 55 L137 60 Z', '#8FC7E9', { stroke: null }),
  path('chest-diamond', 'M128 190 L143 207 L128 225 L113 207 Z', '#C7E4F4', { width: 3.5 }),
];

const railCannon = { pivot: [151, 151], rigid: true, angleByPose: { windup: -.025, attack: .012 }, angleMin: -.035, angleMax: .035 };
const railShapes = [
  path('foot-left', 'M67 187 C63 196 69 206 80 203 C84 201 88 196 87 191 Z', 'coral', { space: 'fixed' }),
  path('foot-right', 'M125 193 C124 205 136 209 139 197 Z', 'coral', { space: 'fixed' }),
  path('tail-lobe', 'M38 145 C15 129 5 141 10 155 C14 166 27 167 39 162 Z'),
  path('dorsal-fin-rear', 'M54 128 C38 117 42 103 52 109 C61 112 69 119 71 126 Z'),
  path('dorsal-fin-front', 'M72 123 C57 108 60 96 70 99 C82 102 91 112 91 120 Z'),
  path('low-long-body', 'M39 143 C63 119 100 115 151 115 L175 138 L175 177 L151 197 C99 197 61 194 39 176 C27 166 27 153 39 143 Z'),
  ink('near-eye', 'M85 145 L115 149 C116 163 101 172 91 161 C87 157 85 151 85 145 Z'),
  path('near-eye-white', 'M97 149 L110 152 C109 160 99 160 97 149 Z', 'cream', { stroke: null }),
  line('near-brow', 'M84 142 L115 149', { width: 4 }),
  line('tail-fold', 'M47 155 Q44 159 47 163', { width: 2.5 }),
  path('rail-upper-support', 'M144 126 C163 118 188 118 194 135 L188 141 L148 143 Z', 'brown', { partId: 'rail-cannon', width: 3 }),
  path('rail-lower-support', 'M146 168 L190 169 L195 181 C183 191 159 187 145 180 Z', 'brown', { partId: 'rail-cannon', width: 3 }),
  path('rail-port-connector', 'M150 140 C172 136 190 136 202 139 L206 168 C184 170 171 172 149 169 Z', 'coral', { partId: 'rail-cannon', width: 3.5 }),
  path('upper-rail', 'M137 117 C166 112 204 108 236 109 C249 109 250 130 236 132 C207 133 172 136 145 140 C137 132 134 125 137 117 Z', 'coral', { partId: 'rail-cannon' }),
  path('lower-rail', 'M139 172 C174 178 209 181 236 183 C250 184 249 205 235 205 C202 202 167 200 143 196 C137 189 136 180 139 172 Z', 'coral', { partId: 'rail-cannon' }),
  oval('central-port-rim', 219, 156, 18, 24, 'cream', { partId: 'rail-cannon', width: 4 }),
  oval('central-port-inner', 222, 156, 10, 17, 'brown', { partId: 'rail-cannon', stroke: null }),
];
const railOpen = railShapes.filter(s => !['near-eye', 'near-eye-white', 'near-brow'].includes(s.id));
railOpen.splice(6, 0, ink('near-eye-closed', 'M85 147 C94 156 107 158 117 151 C115 168 94 169 85 147 Z'));

const collectorShapes = [
  path('foot-left', 'M57 214 C48 225 56 234 68 231 C76 230 79 222 78 217 Z', 'coral', { space: 'fixed' }),
  path('foot-right', 'M139 218 C139 232 156 236 164 224 L166 216 Z', 'coral', { space: 'fixed' }),
  path('bud-left', 'M84 82 C81 62 62 66 61 75 C61 83 75 83 77 90 Z'),
  path('bud-right', 'M109 87 C111 67 129 66 132 74 C136 85 121 86 119 93 Z'),
  path('fat-bag-body', 'M80 86 C98 75 126 85 137 106 C150 132 166 128 178 139 L181 177 C181 210 158 225 127 224 C96 230 49 224 32 206 C15 185 24 155 43 134 C57 116 65 107 80 86 Z'),
  path('single-curled-arm', 'M159 140 C169 145 175 140 177 134 C181 125 187 139 187 145 C214 137 208 114 198 105 C187 96 181 105 173 103 C161 97 167 76 180 70 C208 55 232 81 237 111 C245 147 235 172 215 181 C199 189 181 179 174 168 C164 168 158 154 159 140 Z', 'coral', { partId: 'curled-arm' }),
  ink('arm-inner-curl', 'M193 91 C182 94 185 108 193 115 C204 126 204 145 190 150 C201 158 215 145 217 131 C220 112 205 87 193 91 Z', { partId: 'curled-arm' }),
  line('arm-root-fold', 'M170 141 Q168 153 179 161', { partId: 'curled-arm', width: 3 }),
  ink('brow-slot', 'M83 106 C91 111 107 112 119 107 C125 123 102 129 89 121 C84 118 82 112 83 106 Z'),
  path('tongue', 'M91 119 C97 112 109 116 106 128 C102 143 86 139 88 130 Z', 'pink', { width: 3 }),
  oval('belly-coin', 105, 174, 39, 34, 'honey', { width: 4 }),
  path('coin-inner-edge', 'M101 154 L115 154 L123 166 L123 185 L113 195 L99 195 L89 185 L89 166 Z', '#A97936', { stroke: null }),
  path('coin-inner-face', 'M103 158 L113 158 L119 168 L119 183 L111 190 L101 190 L94 182 L94 168 Z', '#F5CA75', { stroke: null }),
  path('coin-glint', 'M80 153 C90 145 94 154 87 161 C79 168 73 161 80 153 Z', 'honeyLight', { stroke: null }),
  line('bag-fold-left', 'M49 165 Q44 176 51 182', { width: 2.8 }),
  line('bag-fold-upper', 'M64 132 Q63 139 71 138', { width: 2.8 }),
];

const sunPetals = [
  path('petal-12', 'M111 76 C111 46 122 33 132 37 C144 41 148 59 146 77 Z'),
  path('petal-2', 'M173 86 C197 64 216 72 216 83 C214 97 203 108 184 116 Z'),
  path('petal-4', 'M185 156 C213 167 222 185 210 192 C196 199 179 189 167 177 Z'),
  path('petal-6', 'M147 198 C147 224 136 237 127 232 C116 227 111 211 112 196 Z'),
  path('petal-8', 'M78 175 C57 194 39 198 34 186 C29 173 44 158 66 150 Z'),
  path('petal-10', 'M69 116 C44 105 32 87 41 78 C50 70 69 76 84 89 Z'),
];
const sunFace = [
  oval('round-sun-body', 128, 136, 64, 65, 'coral'),
  oval('eye-left', 109, 125, 4.8, 9, 'brown', { stroke: null }),
  oval('eye-right', 148, 125, 4.8, 9, 'brown', { stroke: null }),
  path('mouth', 'M110 146 C121 151 138 151 147 146 C154 177 116 184 110 146 Z', 'brown', { width: 3 }),
  path('mouth-tongue', 'M119 165 C127 158 139 161 143 168 C138 180 123 180 119 165 Z', 'pink', { stroke: null }),
];
const sunShapes = [...sunPetals, ...sunFace];
const sunAction = sunShapes.filter(s => !['eye-left', 'eye-right'].includes(s.id));
sunAction.splice(7, 0, line('eye-left', 'M106 120 L114 125 L106 130', { width: 4 }), line('eye-right', 'M152 120 L144 125 L152 130', { width: 4 }));

const authoredRigs = {
  'boss:COMMANDER': {
    root: [128, 232], center: [128, 156], collisionRadius: 104, referenceRadius: 28, softPivot: [128, 232],
    shapes: commanderShapes,
    joints: { 'crown-left': [93, 77], 'crown-center': [128, 69], 'crown-right': [164, 78], 'arm-left': [63, 131], 'arm-right': [193, 131], 'fist-left': [63, 169], 'fist-right': [193, 169], 'foot-left': [84, 232], 'foot-right': [172, 232], 'brow-slot': [128, 139], mouth: [128, 158], tooth: [128, 159] },
    partTransforms: { 'arm-left': rotate([63, 131], .055, -.055, .007), 'arm-right': rotate([193, 131], -.055, .055, .007), 'fist-left': rotate([63, 131], .055, -.055, .007), 'fist-right': rotate([193, 131], -.055, .055, .007) },
    ...selectors(['summonFormation', 'commandLine', 'shieldPulse', 'phalanxAdvance', 'commandRush'], commanderShapes),
  },
  'boss:HUNTER': {
    root: [128, 230], center: [128, 168], collisionRadius: 93, referenceRadius: 24, softPivot: [128, 230],
    shapes: hunterShapes,
    joints: { 'rear-ear': [107, 135], 'ear-tip': [40, 109], 'top-horn': [151, 127], 'nose-root': [186, 183], 'nose-tip': [237, 205], 'rear-lobe': [68, 184], 'foot-left': [74, 230], 'foot-right': [176, 229], 'near-eye': [176, 177], mouth: [189, 202] },
    partTransforms: { 'rear-ear': rotate([107, 135], -.045, .035, .008), 'ear-tip': rotate([107, 135], -.045, .035, .008), 'rear-lobe': rotate([68, 184], .02, -.015, .005) },
    ...selectors(['dashAtPlayer', 'markPrey', 'summonScouts', 'pincerRush', 'afterimageBurst', 'feintStrike'], hunterShapes),
  },
  'boss:FORTRESS': {
    root: [128, 226], center: [128, 171], collisionRadius: 105, referenceRadius: 34, softPivot: [128, 226],
    shapes: fortressShapes,
    joints: { 'top-shell': [128, 153], 'shell-connector': [128, 167], 'shield-left': [70, 164], 'shield-right': [186, 164], 'shield-left-end': [44, 214], 'shield-right-end': [212, 214], 'foot-left': [84, 224], 'foot-right': [174, 224], 'face-window': [128, 187], 'eye-left': [120, 187], 'eye-right': [136, 187] },
    partTransforms: { 'shield-left': rotate([70, 164], -.015, -.03), 'shield-right': rotate([186, 164], .015, .03), 'shield-left-end': rotate([70, 164], -.015, -.03), 'shield-right-end': rotate([186, 164], .015, .03) },
    ...selectors(['summonSiege', 'bastionMortar', 'fortify', 'shockRam', 'quake', 'bunkerRing'], fortressShapes, fortressAttack),
  },
  'boss:PRISM': {
    root: [128, 240], center: [128, 136], collisionRadius: 96, referenceRadius: 27, softPivot: [128, 240],
    shapes: prismShapes,
    joints: { 'robe-top': [128, 38], 'robe-bottom': [128, 235], 'face-window': [128, 131], 'eye-left': [120, 108], 'eye-right': [137, 108], 'mirror-left': [66, 134], 'mirror-right': [190, 134], 'mirror-left-center': [47, 137], 'mirror-right-center': [209, 137] },
    partTransforms: { 'mirror-left': rotate([66, 134], .065, -.07, .008), 'mirror-right': rotate([190, 134], -.065, .07, .008), 'mirror-left-center': rotate([66, 134], .065, -.07, .008), 'mirror-right-center': rotate([190, 134], -.065, .07, .008) },
    ...selectors(['prismBeam', 'refractVolley', 'mirrorSummon', 'prismLattice', 'tripleBeam', 'mirrorStep'], prismShapes),
  },
  'boss:FROST_JUDGE': {
    root: [128, 236], center: [128, 145], collisionRadius: 102, referenceRadius: 30, softPivot: [128, 236],
    shapes: frostShapes,
    joints: { head: [128, 120], 'eye-slot-left': [118, 118], 'eye-slot-right': [139, 118], mouth: [128, 128], tooth: [128, 130], 'U-collar': [128, 186], 'fist-left': [62, 179], 'fist-right': [194, 179], crown: [128, 58], 'chest-diamond': [128, 207], 'bottom-lobe-left': [104, 218], 'bottom-lobe-right': [151, 218] },
    partTransforms: { 'fist-left': rotate([62, 179], .035, -.04, .004), 'fist-right': rotate([194, 179], -.035, .04, .004) },
    ...selectors(['frostRing', 'whiteout', 'freezeTower', 'glacialPrison', 'summonFrostGuards', 'coldSnap'], frostShapes),
  },
  'boss:RAIL_WARLORD': {
    root: [128, 210], center: [128, 158], collisionRadius: 107, referenceRadius: 27, softPivot: [128, 210],
    shapes: railShapes,
    joints: { 'dorsal-fin-rear': [56, 121], 'dorsal-fin-front': [76, 115], 'foot-left': [77, 203], 'foot-right': [132, 206], 'tail-lobe': [31, 151], 'near-eye': [101, 155], 'rail-cannon': [151, 151], 'upper-rail': [192, 123], 'lower-rail': [192, 190], 'central-port': [222, 156], 'rail-tip-M': [237, 156] },
    partTransforms: { 'rail-cannon': railCannon, 'upper-rail': railCannon, 'lower-rail': railCannon, 'central-port': railCannon, 'rail-tip-M': railCannon },
    ...selectors(['railShot', 'crosshairBarrage', 'markTower', 'suppressiveGrid', 'overload', 'killLane'], railShapes, railShapes, railShapes, railOpen),
  },
  'boss:COLLECTOR': {
    root: [128, 234], center: [128, 158], collisionRadius: 96, referenceRadius: 26, softPivot: [128, 234],
    shapes: collectorShapes,
    joints: { 'bud-left': [77, 84], 'bud-right': [119, 84], 'foot-left': [68, 231], 'foot-right': [153, 233], 'curled-arm': [165, 151], 'arm-tip': [176, 97], 'brow-slot': [102, 116], tongue: [98, 129], 'belly-coin': [105, 174] },
    partTransforms: { 'curled-arm': rotate([165, 151], .035, -.05, .006), 'arm-tip': rotate([165, 151], .035, -.05, .006) },
    ...selectors(['stealMoney', 'taxBeacon', 'paydaySweep', 'summonScouts', 'ransomBurst', 'repossess'], collectorShapes),
  },
  'boss:TWINS_SUN': {
    root: [128, 240], center: [128, 136], collisionRadius: 93, referenceRadius: 24, softPivot: [128, 240],
    shapes: sunShapes,
    joints: { 'petal-12': [128, 77], 'petal-2': [179, 101], 'petal-4': [179, 166], 'petal-6': [128, 197], 'petal-8': [77, 166], 'petal-10': [77, 101], 'eye-left': [109, 125], 'eye-right': [148, 125], mouth: [129, 161] },
    partTransforms: {},
    ...selectors(['solarDash', 'flareLance', 'twinCrossfire', 'eclipsePulse', 'soloSolarVolley'], sunShapes, sunAction, sunAction),
  },
};

// Uniform source fitting leaves a transparent deformation margin on the fixed
// canvas. r0 is fitted by the same amount, preserving the authored runtime size.
const fitRig = (rig) => {
  const k = .88;
  const point = ([x, y]) => [Number((128 + k * (x - 128)).toFixed(4)), Number((rig.root[1] + k * (y - rig.root[1])).toFixed(4))];
  const fitShape = (shape) => {
    if (shape.ellipse) return { ...shape, ellipse: [...point(shape.ellipse.slice(0, 2)), shape.ellipse[2] * k, shape.ellipse[3] * k], width: shape.width * k };
    const tokens = shape.d.match(/[MLCQZ]|-?(?:\d+\.?\d*|\.\d+)/g);
    let coordinate = 0;
    const d = tokens.map(token => {
      if (/^[MLCQZ]$/.test(token)) { coordinate = 0; return token; }
      const axis = coordinate++ % 2;
      const anchor = axis ? rig.root[1] : 128;
      return Number((anchor + k * (Number(token) - anchor)).toFixed(4));
    }).join(' ');
    return { ...shape, d, width: shape.width * k };
  };
  const fitParts = parts => Object.fromEntries(Object.entries(parts ?? {}).map(([id, part]) => [id, { ...part, pivot: point(part.pivot) }]));
  return { ...rig, center: point(rig.center), collisionRadius: rig.collisionRadius * k,
    shapes: rig.shapes.map(fitShape), joints: Object.fromEntries(Object.entries(rig.joints).map(([id, p]) => [id, point(p)])),
    partTransforms: fitParts(rig.partTransforms),
    variants: Object.fromEntries(Object.entries(rig.variants).map(([id, variant]) => [id, { ...variant, shapes: variant.shapes.map(fitShape) }])),
  };
};
export const BOSS_RIGS_A = Object.fromEntries(Object.entries(authoredRigs).map(([id, rig]) => [id, fitRig(rig)]));

// Additive FORTRESS repair in fitted coordinates. Splitting the raised lower
// cubic at t=.5 preserves its approved contour while matching closed topology.
BOSS_RIGS_A['boss:FORTRESS'].shapeMorphs = {
  'single-top-shell': {
    fromD: BOSS_RIGS_A['boss:FORTRESS'].variants.neutralBody.shapes.find(shape => shape.id === 'single-top-shell').d,
    toD: 'M66.4 159.12 C69.92 112.48 91.04 86.08 128 86.08 C164.96 86.08 186.08 112.48 189.6 159.12 C172.88 156.92 150.66 155.82 128.33 155.82 C106 155.82 83.56 156.92 66.4 159.12 Z',
    poses: ['attack'], curve: 'sin2',
  },
};
