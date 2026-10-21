import { maskShader, sceneShader, vertexShader } from "./ice-reveal-shaders";

export const ICE_LIFETIME_MS = 3000;
export type IceSegment = [number, number, number, number];

export function createIceRenderer(canvas: HTMLCanvasElement, original: HTMLImageElement, ice: HTMLImageElement) {
  const gl = canvas.getContext("webgl", {
    alpha: true, premultipliedAlpha: false, antialias: false, depth: false, preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error("WebGL unavailable");
  gl.disable(gl.DITHER);

  const programs: WebGLProgram[] = [];
  const textures: WebGLTexture[] = [];
  const buffers: WebGLBuffer[] = [];
  const framebuffers: WebGLFramebuffer[] = [];
  const dispose = () => {
    programs.forEach(program => gl.deleteProgram(program));
    textures.forEach(texture => gl.deleteTexture(texture));
    buffers.forEach(buffer => gl.deleteBuffer(buffer));
    framebuffers.forEach(framebuffer => gl.deleteFramebuffer(framebuffer));
  };

  try {
    function program(fragment: string) {
      const shaders: WebGLShader[] = [];
      const result = gl!.createProgram();
      if (!result) throw new Error("Cannot create program");
      programs.push(result);
      try {
        for (const [type, source] of [[gl!.VERTEX_SHADER, vertexShader], [gl!.FRAGMENT_SHADER, fragment]] as const) {
          const shader = gl!.createShader(type);
          if (!shader) throw new Error("Cannot create shader");
          shaders.push(shader);
          gl!.shaderSource(shader, source);
          gl!.compileShader(shader);
          if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(shader) || "Shader failed");
          gl!.attachShader(result, shader);
        }
        gl!.linkProgram(result);
        if (!gl!.getProgramParameter(result, gl!.LINK_STATUS)) throw new Error("Cannot link program");
      } finally {
        shaders.forEach(shader => gl!.deleteShader(shader));
      }
      return result;
    }

    function texture(image?: HTMLImageElement) {
      const result = gl!.createTexture();
      if (!result) throw new Error("Cannot create texture");
      textures.push(result);
      gl!.bindTexture(gl!.TEXTURE_2D, result);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      if (image) {
        const max = gl!.getParameter(gl!.MAX_TEXTURE_SIZE) as number;
        if (image.naturalWidth > max || image.naturalHeight > max) throw new Error("Image exceeds texture size");
        gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, image);
      }
      return result;
    }

    const maskProgram = program(maskShader);
    const sceneProgram = program(sceneShader);
    const quad = gl.createBuffer();
    if (!quad) throw new Error("Cannot create buffer");
    buffers.push(quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const iceTexture = texture(ice);
    const masks = [texture(), texture()];
    const targets = masks.map(mask => {
      const target = gl.createFramebuffer();
      if (!target) throw new Error("Cannot create framebuffer");
      framebuffers.push(target);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mask, 0);
      return target;
    });
    const locations = (shader: WebGLProgram, names: string[]) => Object.fromEntries(names.map(name => [name, gl.getUniformLocation(shader, name)]));
    const maskUniforms = locations(maskProgram, ["u_mask", "u_size", "u_segments[0]", "u_count", "u_radius", "u_decay"]);
    const sceneUniforms = locations(sceneProgram, ["u_ice", "u_mask", "u_size", "u_cover", "u_time", "u_overlay", "u_paper"]);
    const positions = new Map([maskProgram, sceneProgram].map(shader => [shader, gl.getAttribLocation(shader, "a_position")]));
    const segmentsBuffer = new Float32Array(48);
    let width = 1, height = 1, maskWidth = 1, maskHeight = 1, read = 0;
    let theme: string | undefined;
    let paper = [12 / 255, 12 / 255, 12 / 255];

    function bindTexture(value: WebGLTexture, unit: number) {
      gl!.activeTexture(gl!.TEXTURE0 + unit);
      gl!.bindTexture(gl!.TEXTURE_2D, value);
    }
    function bindProgram(shader: WebGLProgram) {
      gl!.useProgram(shader);
      const position = positions.get(shader)!;
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quad);
      gl!.enableVertexAttribArray(position);
      gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0);
    }
    function clear() {
      for (const target of targets) {
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, target);
        gl!.clearColor(0, 0, 0, 1);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
      }
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    }

    return {
      resize(cssWidth: number, cssHeight: number, dpr: number) {
        width = Math.max(1, cssWidth); height = Math.max(1, cssHeight);
        const scale = Math.min(dpr, 1.5, 1800 / Math.max(width, height));
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const maskScale = Math.min(1, 640 / Math.max(width, height));
        maskWidth = Math.max(1, Math.round(width * maskScale));
        maskHeight = Math.max(1, Math.round(height * maskScale));
        masks.forEach((mask, index) => {
          bindTexture(mask, 0);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, maskWidth, maskHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, targets[index]);
          if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Incomplete framebuffer");
        });
        clear();
      },
      draw(segments: IceSegment[], elapsed: number, time: number, fadeOpacity: number, shadeOpacity: number) {
        const currentTheme = document.documentElement.dataset.theme || "dark";
        if (theme !== currentTheme) {
          const channels = getComputedStyle(canvas).getPropertyValue("--color-paper").trim().split(/\s+/).map(Number);
          if (channels.length === 3 && channels.every(Number.isFinite)) paper = channels.map(value => value / 255);
          theme = currentTheme;
        }
        const count = Math.min(segments.length, 12);
        segments.slice(0, count).forEach((segment, index) => segmentsBuffer.set(segment, index * 4));
        const write = 1 - read;
        bindProgram(maskProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets[write]);
        gl.viewport(0, 0, maskWidth, maskHeight);
        bindTexture(masks[read], 0);
        gl.uniform1i(maskUniforms.u_mask, 0);
        gl.uniform2f(maskUniforms.u_size, width, height);
        gl.uniform4fv(maskUniforms["u_segments[0]"], segmentsBuffer);
        gl.uniform1i(maskUniforms.u_count, count);
        gl.uniform1f(maskUniforms.u_radius, Math.min(84, Math.max(42, width * .055)));
        gl.uniform1f(maskUniforms.u_decay, elapsed / ICE_LIFETIME_MS);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        read = write;

        bindProgram(sceneProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        bindTexture(iceTexture, 0); bindTexture(masks[read], 1);
        gl.uniform1i(sceneUniforms.u_ice, 0);
        gl.uniform1i(sceneUniforms.u_mask, 1);
        gl.uniform2f(sceneUniforms.u_size, width, height);
        const imageAspect = original.naturalWidth / original.naturalHeight;
        const aspect = width / height;
        gl.uniform2f(sceneUniforms.u_cover, Math.min(1, aspect / imageAspect), Math.min(1, imageAspect / aspect));
        gl.uniform1f(sceneUniforms.u_time, time / 1000);
        gl.uniform2f(sceneUniforms.u_overlay, fadeOpacity, shadeOpacity);
        gl.uniform3fv(sceneUniforms.u_paper, paper);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      clear,
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
