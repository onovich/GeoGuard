// Approved group contract schema 1. Twelve independently authored body-only rigs.
// Provenance and organ audits: docs/art-implementation-2026-10-02/enemy-batch/.
// This module contains serializable artwork only; registration belongs to characters.
const s = (id, d, fill = 'coral', options = {}) => ({ id, d, fill, stroke: 'brown', width: 4.5, ...options });
const e = (id, cx, cy, rx, ry, fill, options = {}) => ({ id, ellipse: [cx, cy, rx, ry], fill, stroke: 'brown', width: 4.5, ...options });
const l = (id, d, options = {}) => s(id, d, null, { width: 3.6, ...options });
const dark = { stroke: null, width: 0 };
const foot = (id, d, fill = 'coral') => s(id, d, fill, { space: 'fixed' });

const fastFeet = [
  foot('foot-left', 'M85 202 C81 208 75 221 82 225 C89 229 99 224 104 213 L109 204 Z'),
  foot('foot-right', 'M164 204 C164 215 165 227 176 226 C189 226 190 219 184 208 Z'),
];
const fastEars = [
  s('ear-far', 'M169 124 C158 84 128 50 91 39 C75 34 65 42 68 52 C73 68 119 77 148 125 Z', 'coral', { partId: 'ear-far' }),
  s('ear-near', 'M134 134 C102 108 56 119 33 112 C16 107 17 94 33 89 C66 77 112 81 157 124 Z', 'coral', { partId: 'ear-near' }),
];
const fastFace = [e('eye-left', 181, 171, 5.9, 10.8, 'brown', dark), e('eye-right', 210, 165, 5.4, 10.8, 'brown', dark), e('mouth', 199, 187, 7.4, 5, 'brown', dark)];
const fastBody = s('body', 'M80 163 C100 136 119 122 155 122 C180 119 207 127 221 144 C239 164 229 190 207 202 C175 219 114 219 88 209 C70 202 65 181 80 163 Z');
const fastFlap = s('side-flap', 'M86 165 C72 157 58 163 55 176 C50 192 63 201 77 197 C83 195 87 193 89 189', 'coral');
const fastRun = [
  foot('foot-left', 'M90 205 C82 207 68 220 73 225 C81 233 96 220 106 210 Z'),
  foot('foot-right', 'M169 204 C159 211 160 226 170 226 C181 227 184 216 190 207 Z'),
  ...fastEars,
  s('body', 'M81 162 C103 137 127 121 161 126 C187 125 211 137 226 153 C243 175 229 196 207 204 C172 218 116 219 85 209 C67 199 66 177 81 162 Z'),
  fastFlap, ...fastFace,
];

const tankFeet = [foot('foot-left', 'M74 210 C64 216 65 229 78 229 L90 229 C100 227 101 220 98 213 Z'), foot('foot-right', 'M158 213 C155 223 163 229 174 229 L181 229 C193 229 195 221 187 213 Z')];
const tankBody = s('body', 'M47 143 C41 123 57 99 82 103 C88 76 102 66 126 66 C146 65 160 79 165 101 C190 90 211 108 208 136 C223 143 227 165 217 190 C211 211 189 219 162 216 C143 224 119 221 105 218 C80 224 54 220 44 205 C34 185 32 158 47 143 Z');
const tankFists = [s('fist-left', 'M54 139 C34 135 16 151 16 177 C16 204 35 218 54 211 C76 205 80 187 70 170 C70 155 62 144 54 139 Z'), s('fist-right', 'M202 139 C222 135 240 151 240 177 C240 204 221 218 202 211 C180 205 176 187 186 170 C186 155 194 144 202 139 Z'), l('fist-left-fold', 'M36 164 C45 157 59 158 67 169 C73 178 70 184 66 185'), l('fist-right-fold', 'M220 164 C211 157 197 158 189 169 C183 178 186 184 190 185')];
const tankFace = [s('brow-slot', 'M95 135 C111 146 143 145 160 135 C169 131 174 144 164 151 C143 164 112 163 94 153 C82 145 86 131 95 135 Z', 'brown', dark), s('mouth', 'M116 151 L142 151 L143 171 C139 180 117 179 113 172 Z', 'brown', dark), s('tooth', 'M116 155 Q128 156 140 155 L140 170 Q129 174 116 170 Z', 'cream', { width: 3.4 })];

const splinterBody = s('body', 'M133 68 C143 56 152 66 148 78 C145 91 159 111 168 135 C184 175 169 207 150 219 C126 234 91 218 83 193 C72 157 97 110 133 68 Z');
const splinterFace = [e('eye', 146, 161, 10, 14, 'brown', dark), e('eye-highlight', 149, 155, 3.4, 4.9, 'cream', dark)];
const splinterHop = [s('body', 'M133 31 C143 19 152 29 148 41 C145 54 159 74 168 98 C184 138 169 170 150 182 C126 197 91 181 83 156 C72 120 97 73 133 31 Z'), e('eye', 146, 124, 10, 14, 'brown', dark), e('eye-highlight', 149, 118, 3.4, 4.9, 'cream', dark)];

const shieldFeet = [foot('foot-left', 'M95 203 C89 215 89 228 99 228 C112 228 114 216 113 203 Z'), foot('foot-right', 'M145 205 C143 217 144 228 155 228 C166 228 168 219 160 205 Z')];
const shieldBody = s('body', 'M74 137 C75 99 95 69 127 71 C161 74 184 105 183 146 C185 184 168 210 134 215 C107 220 79 205 74 178 Z');
const shieldFist = s('rear-fist', 'M77 132 C55 125 41 137 42 157 C42 174 52 185 67 181 C82 178 88 165 78 157 C88 150 85 140 77 132 Z');
const shieldEye = [s('eye-anchor', 'M110 111 C121 124 133 127 145 125 L147 158 C114 161 101 139 110 111 Z', 'brown', dark), e('eye-highlight', 119, 134, 4.5, 9, 'cream', dark)];
const shieldLobe = s('soft-shield-lobe', 'M137 62 C140 41 160 46 178 66 C210 101 222 146 205 188 C195 215 184 229 174 226 C159 222 146 185 143 151 C139 117 134 90 137 62 Z');

const medicFeet = [foot('foot-left', 'M78 212 C73 220 76 230 87 229 C99 229 102 222 99 215 Z'), foot('foot-right', 'M157 215 C155 222 162 230 173 229 C184 229 188 220 178 212 Z')];
const medicBody = s('body', 'M128 81 C117 49 77 49 67 78 C59 95 65 107 71 116 C49 124 51 161 68 176 C62 200 78 224 101 223 C114 222 124 216 128 206 C136 220 148 226 166 221 C188 217 194 194 187 177 C205 161 205 126 185 116 C195 100 195 83 183 69 C164 47 138 56 128 81 Z');
const medicArms = [s('curl-arm-left', 'M69 114 C49 108 26 119 24 141 C20 166 40 184 65 176 C89 168 95 139 80 124 C75 119 72 116 69 114 Z'), s('curl-arm-right', 'M187 114 C207 108 230 119 232 141 C236 166 216 184 191 176 C167 168 161 139 176 124 C181 119 184 116 187 114 Z'), l('curl-left-fold', 'M45 139 C49 128 63 127 72 134 C91 151 77 172 59 170'), l('curl-right-fold', 'M211 139 C207 128 193 127 184 134 C165 151 179 172 197 170')];
const medicCross = s('cream-cross', 'M118 126 L118 114 C118 105 138 105 138 114 L138 126 L150 126 C162 127 162 145 150 146 L138 146 L138 158 C138 170 118 170 118 158 L118 146 L106 146 C94 145 94 127 106 126 Z', 'cream', { width: 3.6 });

const bomberFeet = [foot('foot-left', 'M92 211 C81 215 81 228 94 228 C105 228 114 223 110 215 Z'), foot('foot-right', 'M146 215 C142 223 151 228 162 228 C175 228 175 215 164 211 Z')];
const bomberBody = s('body', 'M74 122 C73 92 93 76 113 73 C112 62 127 55 139 60 C153 65 150 72 151 74 C172 79 184 94 184 118 C207 130 213 156 204 180 C212 193 202 204 187 206 C179 223 145 222 128 217 C111 224 79 222 69 206 C52 203 47 192 52 179 C42 154 50 132 74 122 Z');
const bomberFuse = s('bent-fuse-bud', 'M115 71 C115 56 127 43 145 38 C158 34 174 36 174 45 C174 58 160 51 150 52 C138 52 133 59 132 68 Z', 'coral');
const bomberCheeks = [s('cheek-arm-left', 'M69 119 C40 113 27 137 34 160 C39 180 62 188 77 174 C92 161 88 136 76 128', 'coral'), s('cheek-arm-right', 'M187 119 C216 113 229 137 222 160 C217 180 194 188 179 174 C164 161 168 136 180 128', 'coral'), l('cheek-left-fold', 'M70 124 C91 144 88 166 75 179'), l('cheek-right-fold', 'M186 124 C165 144 168 166 181 179')];
const bomberFace = [l('eye-slot-left', 'M103 119 L111 132', { width: 5.4 }), l('eye-slot-right', 'M153 119 L145 132', { width: 5.4 }), s('mouth', 'M116 139 L140 139 C143 157 135 164 128 164 C121 164 113 156 116 139 Z', 'brown', dark), s('tongue', 'M121 149 C117 141 125 141 128 147 C132 141 139 142 135 150 C133 156 129 158 128 158 C125 157 122 154 121 149 Z', 'cream', dark)];

const jammerEars = [s('antenna-left', 'M117 117 C105 82 101 68 87 67 C68 67 63 98 49 115 C43 122 33 120 29 113 C21 100 32 91 42 80 C57 65 68 46 86 45 C108 42 123 72 132 109 Z', 'coral', { partId: 'antenna-left' }), s('antenna-right', 'M139 117 C151 82 155 68 169 67 C188 67 193 98 207 115 C213 122 223 120 227 113 C235 100 224 91 214 80 C199 65 188 46 170 45 C148 42 133 72 124 109 Z', 'coral', { partId: 'antenna-right' })];
const jammerBody = s('body', 'M65 184 C62 150 77 117 101 108 C119 100 139 101 155 108 C181 122 194 150 191 185 C207 195 212 210 197 214 C188 217 181 212 180 208 C178 229 155 232 150 215 C132 220 117 219 107 216 C101 232 78 230 77 210 C69 218 54 215 52 207 C49 199 54 189 65 184 Z');
const jammerFace = [l('eye-slot-left', 'M105 146 C103 160 116 160 116 146', { width: 4.3 }), l('eye-slot-right', 'M141 146 C141 160 154 160 152 146', { width: 4.3 }), l('zigzag-mouth', 'M107 179 L118 165 L129 179 L140 165 L151 179', { width: 4.2 }), l('base-left-fold', 'M71 204 L77 210'), l('base-right-fold', 'M185 204 L180 210')];

const phaseBody = s('continuous-body-tail', 'M69 55 C86 35 115 40 128 65 C138 85 136 116 146 144 C158 174 174 181 203 187 C219 192 229 205 228 216 C220 206 209 205 197 208 C190 210 187 211 183 210 C192 216 193 221 184 223 C151 232 128 214 108 200 C78 176 58 144 55 113 C51 87 54 68 69 55 Z');
const phaseFace = [s('face-window', 'M75 70 C85 55 101 64 108 82 C113 103 111 130 119 152 C123 165 130 177 128 180 C122 184 105 166 95 153 C81 136 72 114 70 95 C69 84 70 76 75 70 Z', 'brown', dark), e('eye-left', 83, 90, 2.6, 7.7, 'cream', dark), e('eye-right', 97, 89, 2.6, 7.7, 'cream', dark)];

const burrowFeet = [foot('foot-left', 'M70 203 C64 212 68 226 79 226 C94 226 99 215 92 207 Z', 'brown'), foot('foot-right', 'M164 207 C157 215 162 226 177 226 C188 226 192 212 186 203 Z', 'brown')];
const burrowBody = s('body', 'M52 146 C57 121 75 115 80 114 C89 92 108 81 128 81 C151 81 172 94 180 114 C197 116 206 130 205 146 C223 159 213 191 194 204 C172 221 86 221 63 204 C43 191 35 164 52 146 Z');
const burrowClaws = [s('three-finger-claw-left', 'M58 141 C37 131 22 148 19 173 C16 192 20 202 29 202 C33 202 33 197 35 194 C31 212 41 223 51 216 C55 214 56 208 58 203 C56 219 67 225 76 216 C80 212 80 206 80 199 C89 179 80 151 66 145 Z'), s('three-finger-claw-right', 'M198 141 C219 131 234 148 237 173 C240 192 236 202 227 202 C223 202 223 197 221 194 C225 212 215 223 205 216 C201 214 200 208 198 203 C200 219 189 225 180 216 C176 212 176 206 176 199 C167 179 176 151 190 145 Z'), l('claw-left-finger-1', 'M35 194 L35 187'), l('claw-left-finger-2', 'M58 203 L59 189'), l('claw-right-finger-1', 'M221 194 L221 187'), l('claw-right-finger-2', 'M198 203 L197 189')];
const burrowFace = [s('eye-left', 'M91 126 C93 121 107 135 109 140 C112 150 101 150 97 142 Z', 'brown', dark), s('eye-right', 'M165 126 C163 121 149 135 147 140 C144 150 155 150 159 142 Z', 'brown', dark), e('round-nose-mouth', 128, 169, 22, 21, 'brown', dark)];

const beaconFeet = [foot('foot-left', 'M83 218 C77 229 80 243 91 243 C102 243 104 233 101 220 Z'), foot('foot-right', 'M155 220 C152 233 154 243 165 243 C176 243 179 229 173 218 Z')];
const beaconBody = s('body', 'M93 97 C88 85 82 74 82 64 C69 62 68 47 78 44 C93 38 101 53 92 62 L101 83 C117 79 130 79 148 83 L157 62 C148 53 156 38 171 44 C181 47 180 62 167 64 C167 74 162 85 157 97 C174 115 180 140 183 168 C185 186 192 202 200 209 C212 220 199 229 183 228 C172 229 164 224 160 224 C139 231 113 229 98 225 C80 231 57 228 52 218 C47 208 61 198 66 183 C73 164 73 139 79 122 C82 113 87 103 93 97 Z');
const beaconFace = [e('mouth', 128, 155, 30, 48, 'brown', dark), s('tongue', 'M105 179 C99 162 118 158 128 170 C138 158 157 162 151 179 C148 194 135 201 128 201 C120 199 109 192 105 179 Z', 'coralLight', dark)];

const scoutHead = s('head-hood', 'M98 138 C70 122 73 81 96 64 C123 44 153 53 171 77 C183 94 178 119 167 130 C151 145 124 146 98 138 Z');
const scoutEye = [e('eye-white', 142, 108, 31, 31, 'cream', { width: 4 }), e('eye', 147, 101, 11, 13, 'brown', dark)];
const scoutLid = s('lid', 'M95 62 C121 45 150 54 166 76 C170 81 173 87 174 89 C158 97 135 107 107 112 L106 137 C92 136 84 125 80 113 C72 91 82 72 95 62 Z');
const scoutLegs = [s('long-leg-left', 'M105 128 C104 149 100 177 98 205 C109 210 110 224 99 231 C88 237 75 229 76 218 C76 211 81 208 84 205 C86 176 89 147 93 131 Z'), s('long-leg-right', 'M129 134 C136 156 145 180 167 205 C181 208 188 221 177 230 C166 239 149 233 148 221 C147 213 151 208 152 205 C134 181 119 156 116 138 Z')];
const scoutSquashLegs = [s('long-leg-left', 'M107 131 C95 152 83 178 76 211 C63 217 65 235 81 235 C99 235 103 219 92 213 C94 188 110 165 117 143 Z'), s('long-leg-right', 'M131 138 C145 155 161 185 172 211 C188 215 189 233 173 236 C153 239 148 223 157 214 C149 193 128 169 123 148 Z')];
const scoutSquash = [...scoutSquashLegs, scoutHead, ...scoutEye, scoutLid];
const scoutChase = [s('long-leg-left', 'M107 132 C87 155 81 174 65 207 C53 215 58 231 73 231 C91 232 98 216 83 208 C94 181 108 167 119 145 Z'), s('long-leg-right', 'M136 139 C150 161 170 186 179 207 C196 211 199 227 183 231 C163 236 156 220 164 211 C150 186 128 166 125 149 Z'), s('head-hood', 'M105 140 C81 119 85 81 110 67 C140 51 171 64 183 91 C193 117 166 143 143 147 C132 151 116 147 105 140 Z'), e('eye-white', 154, 119, 29, 28, 'cream', { width: 4 }), e('eye', 159, 115, 11, 12, 'brown', dark), s('lid', 'M109 68 C138 51 169 65 182 91 C187 100 187 102 187 104 C166 104 145 100 119 91 L115 142 C95 135 86 117 91 95 C95 81 100 74 109 68 Z')];

const siegeFeet = [foot('foot-left', 'M70 210 C66 219 69 230 79 229 C91 229 94 220 90 213 Z', 'brown'), foot('foot-right', 'M166 213 C162 220 165 229 177 229 C187 230 190 219 186 210 Z', 'brown')];
const siegeBody = s('body', 'M43 155 C38 135 55 117 72 121 C78 111 91 106 109 111 C124 104 141 107 150 112 C175 103 191 115 197 127 C218 133 220 158 210 181 C215 199 198 213 179 215 C146 228 91 223 70 218 C47 218 35 205 37 186 C29 173 31 164 43 155 Z');
const siegeFists = [s('fist-left', 'M60 147 C38 133 19 150 18 177 C17 203 34 222 50 220 C70 218 78 203 73 189 C82 177 71 156 60 147 Z'), s('fist-right', 'M196 147 C218 133 237 150 238 177 C239 203 222 222 206 220 C186 218 178 203 183 189 C174 177 185 156 196 147 Z'), l('left-fist-fold', 'M40 164 C60 166 75 179 69 190'), l('right-fist-fold', 'M216 164 C196 166 181 179 187 190')];
const siegeFace = [s('eye-window', 'M98 182 C114 186 142 186 158 182 C161 201 151 209 128 209 C106 209 95 201 98 182 Z', 'brown', dark), s('eye-left', 'M104 186 L117 189 L117 201 C109 201 105 195 104 186 Z', 'cream', dark), s('eye-right', 'M152 186 L139 189 L139 201 C147 201 151 195 152 186 Z', 'cream', dark), e('mouth', 128, 216, 7, 4, 'brown', dark)];
const siegePlate = s('forehead-plate', 'M81 139 C68 107 86 97 128 95 C168 96 188 109 174 142 C163 171 147 189 128 188 C109 188 94 169 81 139 Z');
const siegeStrike = [...siegeFeet, siegeBody, siegeFists[0], s('fist-right', 'M182 154 C185 136 191 124 203 113 C198 99 201 85 216 81 C233 76 245 85 247 101 C252 121 245 135 231 139 C218 142 204 163 198 177 C187 182 177 171 182 154 Z'), siegeFists[2], l('right-fist-fold', 'M218 99 C210 107 215 120 230 120'), ...siegeFace, siegePlate];

export const ENEMY_RIGS = {
  'enemy:FAST': {
    root: [128, 228], center: [137, 161], collisionRadius: 105, referenceRadius: 8, softPivot: [128, 228],
    shapes: [...fastFeet, ...fastEars, fastBody, fastFlap, ...fastFace],
    joints: { 'foot-left': [85, 228], 'foot-right': [177, 228], 'ear-far': [153, 123], 'ear-near': [136, 130], 'ear-far-tip': [77, 43], 'ear-near-tip': [24, 99], 'side-flap': [84, 180], 'eye-left': [181, 171], 'eye-right': [210, 165], mouth: [199, 187] },
    partTransforms: { 'ear-far': { pivot: [153, 123], rigid: false, sway: { amplitude: .012, period: .72 }, angleMin: -.018, angleMax: .018 }, 'ear-near': { pivot: [136, 130], rigid: false, sway: { amplitude: .012, period: .72 }, angleMin: -.018, angleMax: .018 } },
    variants: { run: { shapes: fastRun } }, poseVariants: { attack: 'run' },
  },
  'enemy:TANK': {
    root: [128, 232], center: [128, 156], collisionRadius: 113, referenceRadius: 16, softPivot: [128, 232],
    shapes: [...tankFeet, tankBody, ...tankFists, ...tankFace],
    joints: { 'foot-left': [78, 232], 'foot-right': [177, 232], 'top-lobe-1': [80, 117], 'top-lobe-2': [128, 108], 'top-lobe-3': [177, 119], 'fist-left': [67, 166], 'fist-right': [189, 166], 'brow-slot': [128, 147], mouth: [128, 164], tooth: [128, 163] },
  },
  'enemy:SPLINTER': {
    root: [128, 232], center: [128, 165], collisionRadius: 78, referenceRadius: 5, softPivot: [128, 232],
    shapes: [splinterBody, ...splinterFace], joints: { 'droplet-tip': [142, 66], eye: [146, 161] },
    variants: { hop: { shapes: splinterHop, joints: { 'droplet-tip': [142, 29], eye: [146, 124] } } }, poseVariants: { attack: 'hop' },
  },
  'enemy:SHIELD': {
    root: [128, 232], center: [130, 153], collisionRadius: 98, referenceRadius: 12, softPivot: [128, 232],
    shapes: [...shieldFeet, shieldBody, shieldFist, ...shieldEye, shieldLobe],
    joints: { 'foot-left': [100, 232], 'foot-right': [155, 232], 'soft-shield-lobe': [145, 144], 'shield-tip': [143, 54], 'rear-fist': [78, 149], 'eye-anchor': [119, 134] },
  },
  'enemy:MEDIC': {
    root: [128, 232], center: [128, 143], collisionRadius: 106, referenceRadius: 11, softPivot: [128, 232],
    shapes: [...medicFeet, medicBody, ...medicArms, medicCross],
    joints: { 'foot-left': [88, 232], 'foot-right': [169, 232], 'body-lobe-1': [93, 91], 'body-lobe-2': [161, 91], 'body-lobe-3': [96, 193], 'body-lobe-4': [163, 193], 'curl-arm-left': [75, 140], 'curl-arm-right': [181, 140], 'cream-cross': [128, 137] },
  },
  'enemy:BOMBER': {
    root: [128, 232], center: [128, 145], collisionRadius: 100, referenceRadius: 11, softPivot: [128, 232],
    shapes: [...bomberFeet, bomberFuse, bomberBody, ...bomberCheeks, ...bomberFace],
    joints: { 'foot-left': [94, 232], 'foot-right': [162, 232], 'bent-fuse-bud': [124, 71], 'fuse-tip': [167, 45], 'cheek-arm-left': [75, 147], 'cheek-arm-right': [181, 147], 'eye-slot-left': [107, 126], 'eye-slot-right': [149, 126], mouth: [128, 150], tongue: [128, 150] },
  },
  'enemy:JAMMER': {
    root: [128, 232], center: [128, 154], collisionRadius: 107, referenceRadius: 12, softPivot: [128, 232],
    shapes: [...jammerEars, jammerBody, ...jammerFace],
    joints: { 'antenna-left': [111, 110], 'antenna-right': [145, 110], 'antenna-left-tip': [34, 111], 'antenna-right-tip': [222, 111], 'foot-base-1': [61, 214], 'foot-base-2': [88, 232], 'foot-base-3': [164, 232], 'foot-base-4': [198, 214], 'eye-slot-left': [111, 153], 'eye-slot-right': [147, 153], 'zigzag-mouth': [129, 174] },
    partTransforms: { 'antenna-left': { pivot: [111, 110], rigid: false, sway: { amplitude: .018, period: .72 }, angleMin: -.02, angleMax: .02 }, 'antenna-right': { pivot: [145, 110], rigid: false, sway: { amplitude: -.018, period: .72 }, angleMin: -.02, angleMax: .02 } },
  },
  'enemy:PHASE': {
    root: [128, 232], center: [128, 142], collisionRadius: 99, referenceRadius: 10, softPivot: [128, 232],
    shapes: [phaseBody, ...phaseFace],
    joints: { 'continuous-body-tail': [128, 181], 'tail-tip-left': [183, 222], 'tail-tip-right': [228, 216], 'face-window': [94, 108], 'eye-left': [83, 90], 'eye-right': [97, 89] },
  },
  'enemy:BURROWER': {
    root: [128, 232], center: [128, 164], collisionRadius: 119, referenceRadius: 12, softPivot: [128, 232],
    shapes: [...burrowFeet, burrowBody, ...burrowClaws, ...burrowFace],
    joints: { 'foot-left': [80, 232], 'foot-right': [177, 232], 'three-finger-claw-left': [67, 152], 'three-finger-claw-right': [189, 152], 'claw-left-tip-1': [24, 201], 'claw-left-tip-2': [44, 218], 'claw-left-tip-3': [70, 219], 'claw-right-tip-1': [232, 201], 'claw-right-tip-2': [212, 218], 'claw-right-tip-3': [186, 219], 'eye-left': [102, 136], 'eye-right': [154, 136], 'round-nose-mouth': [128, 169] },
  },
  'enemy:BEACON': {
    root: [128, 246], center: [128, 152], collisionRadius: 103, referenceRadius: 12, softPivot: [128, 246],
    shapes: [...beaconFeet, beaconBody, ...beaconFace],
    joints: { 'foot-left': [91, 246], 'foot-right': [165, 246], 'antenna-left': [99, 88], 'antenna-right': [156, 88], 'antenna-left-tip': [80, 51], 'antenna-right-tip': [169, 51], mouth: [128, 155], tongue: [128, 181] },
  },
  'enemy:SCOUT': {
    root: [128, 236], center: [128, 141], collisionRadius: 95, referenceRadius: 8, softPivot: [128, 236],
    shapes: [...scoutLegs, scoutHead, ...scoutEye, scoutLid],
    joints: { 'foot-left': [89, 236], 'foot-right': [167, 236], 'long-leg-left': [99, 135], 'long-leg-right': [123, 140], 'head-hood': [127, 106], lid: [140, 98], eye: [147, 101] },
    variants: { crouch: { shapes: scoutSquash, joints: { 'foot-left': [82, 236], 'foot-right': [174, 236], 'long-leg-left': [111, 141], 'long-leg-right': [129, 144], 'head-hood': [127, 106], lid: [140, 98], eye: [147, 101] } }, chase: { shapes: scoutChase, joints: { 'foot-left': [73, 236], 'foot-right': [183, 236], 'long-leg-left': [112, 140], 'long-leg-right': [135, 145], 'head-hood': [139, 110], lid: [154, 102], eye: [159, 115] } } },
    poseVariants: { squash: 'crouch', attack: 'chase' },
  },
  'enemy:SIEGE': {
    root: [128, 234], center: [128, 174], collisionRadius: 116, referenceRadius: 17, softPivot: [128, 234],
    shapes: [...siegeFeet, siegeBody, ...siegeFists, ...siegeFace, siegePlate],
    joints: { 'foot-left': [79, 234], 'foot-right': [177, 234], 'forehead-plate': [128, 130], 'fist-left': [68, 177], 'fist-right': [188, 177], 'eye-left': [111, 196], 'eye-right': [145, 196], mouth: [128, 216] },
    variants: { strike: { shapes: siegeStrike, joints: { 'foot-left': [79, 234], 'foot-right': [177, 234], 'forehead-plate': [128, 130], 'fist-left': [68, 177], 'fist-right': [188, 158], 'eye-left': [111, 196], 'eye-right': [145, 196], mouth: [128, 216] } } }, poseVariants: { attack: 'strike' },
  },
};
