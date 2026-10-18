export const vertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * .5 + .5;
  gl_Position = vec4(a_position, 0., 1.);
}`;

const noiseShader = `
vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash2(i).x, hash2(i + vec2(1., 0.)).x, u.x),
             mix(hash2(i + vec2(0., 1.)).x, hash2(i + 1.).x, u.x), u.y);
}`;

export const maskShader = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_mask;
uniform vec2 u_size;
uniform vec4 u_segments[12];
uniform int u_count;
uniform float u_radius;
uniform float u_decay;
${noiseShader}

void main() {
  vec2 stored = texture2D(u_mask, v_uv).rg;
  float life = max(0., stored.r + stored.g / 255. - u_decay);
  vec2 p = v_uv * u_size;
  vec2 warp = vec2(noise(p * .022), noise(p * .026 + 19.)) - .5;
  vec2 broken = p + warp * u_radius * .85;
  float radius = u_radius * (.58 + noise(p * .031 + 7.) * .7);
  float splinter = (noise(p * .12) - .5) * u_radius * .22;
  float brush = 0.;
  for (int i = 0; i < 12; i++) {
    if (i >= u_count) break;
    vec2 a = u_segments[i].xy;
    vec2 b = u_segments[i].zw;
    vec2 ab = b - a;
    float t = clamp(dot(broken - a, ab) / max(dot(ab, ab), .001), 0., 1.);
    float d = length(broken - a - ab * t) + splinter;
    brush = max(brush, 1. - smoothstep(radius * .36, radius, d));
  }
  life = max(life, brush * .999);
  // Two channels retain sub-byte decay, including on 120 Hz displays.
  gl_FragColor = vec4(floor(life * 255.) / 255., fract(life * 255.), 0., 1.);
}`;

export const sceneShader = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_original;
uniform sampler2D u_ice;
uniform sampler2D u_mask;
uniform vec2 u_size;
uniform vec2 u_cover;
uniform float u_time;
${noiseShader}

float angularNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  return mix(mix(hash2(i).x, hash2(i + vec2(1., 0.)).x, f.x),
             mix(hash2(i + vec2(0., 1.)).x, hash2(i + 1.).x, f.x), f.y);
}

float fractures(vec2 p) {
  vec2 warp = vec2(noise(p * .009), noise(p * .012 + 31.)) - .5;
  vec2 q = p * vec2(.018, .027) + warp * 1.7;
  float fault = angularNoise(q) + angularNoise(q * 2.3 + 17.) * .24;
  float mainCrack = 1. - smoothstep(.009, .027, abs(fault - .61));
  float branch = 1. - smoothstep(.006, .019, abs(angularNoise(q * 2.8 - 11.) - .48));
  float broken = smoothstep(.30, .62, noise(q * .8 + 4.));
  float branchGate = 1. - smoothstep(.05, .19, abs(fault - .61));
  return mainCrack * broken + branch * branchGate * broken * .45;
}

float maskLife(vec2 uv) {
  vec2 value = texture2D(u_mask, uv).rg;
  return value.r + value.g / 255.;
}

void main() {
  vec2 uv = (v_uv - .5) * u_cover + .5;
  vec3 original = texture2D(u_original, uv).rgb;
  float life = maskLife(v_uv);
  if (life < .003) { gl_FragColor = vec4(original, 1.); return; }

  vec2 p = v_uv * u_size;
  float grain = noise(p * .105);
  float drift = noise(p * .018 + vec2(u_time * .055, -u_time * .09));
  float roughness = (grain - .5) * .19 + (drift - .5) * .12;
  float field = life + roughness;
  float reveal = smoothstep(.045, .24, field);
  float rim = reveal * (1. - smoothstep(.19, .38, field));
  float frozen = smoothstep(.16, .7, 1. - life);
  float cracks = fractures(p);
  float frost = smoothstep(.44, .85, grain * .65 + drift * .35);

  // Refraction stays inside the frozen layer so the original never wobbles.
  vec2 refraction = (vec2(grain, drift) - .5) * .0018 * frozen;
  vec3 ice = texture2D(u_ice, clamp(uv + refraction, .001, .999)).rgb;
  ice = mix(ice, vec3(.71, .86, .92), frozen * (.16 + frost * .28));
  ice += vec3(.52, .76, .86) * cracks * frozen * .18;
  vec3 color = mix(original, ice, reveal);

  float shards = cracks * .65 + smoothstep(.62, .86, grain) * .35;
  float mist = rim * (.18 + drift * .22);
  color = mix(color, vec3(.76, .90, .96), mist);
  color += vec3(.48, .72, .82) * rim * (.12 + shards * .42);

  vec2 wind = vec2(u_time * .12, -u_time * .32);
  float billow = noise(p * .014 + wind) * .55
               + noise(p * .033 - wind * .72 + 8.) * .3
               + noise(p * .072 + wind * .4) * .15;
  float fogEdge = reveal * (1. - smoothstep(.24, .68, life));
  float fog = fogEdge * smoothstep(.22, .76, billow) * .70;
  fog += reveal * frozen * smoothstep(.36, .76, billow) * .19;
  color = mix(color, vec3(.74, .86, .91), clamp(fog, 0., .65));

  gl_FragColor = vec4(color, 1.);
}`;
