type PhotoViewportPosition = { x: number; y: number };
type PhotoViewportSize = { width: number; height: number };
export type PhotoViewportState = {
  scale: number;
  position: PhotoViewportPosition;
};

export type PhotoViewportAction =
  | { type: "reset" }
  | ({ size: PhotoViewportSize | null } & (
      | { type: "zoom"; delta: number }
      | { type: "pinch"; factor: number; anchor?: PhotoViewportPosition }
      | { type: "pan"; delta: PhotoViewportPosition }
      | { type: "move"; position: PhotoViewportPosition }
    ));

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;

export const INITIAL_PHOTO_VIEWPORT: PhotoViewportState = {
  scale: 1,
  position: { x: 0, y: 0 },
};

function zoomViewport(
  state: PhotoViewportState,
  requestedScale: number,
  size: PhotoViewportSize | null,
  anchor?: PhotoViewportPosition
): PhotoViewportState {
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, requestedScale));
  if (!anchor || scale <= 1) return constrainViewport({ scale, position: state.position }, size);
  const ratio = scale / state.scale;
  // 锚点保持同一图像点；到达边界时仍遵守统一的平移范围。
  return constrainViewport({
    scale,
    position: {
      x: anchor.x - (anchor.x - state.position.x) * ratio,
      y: anchor.y - (anchor.y - state.position.y) * ratio,
    },
  }, size);
}

function constrainViewport(
  state: PhotoViewportState,
  size: PhotoViewportSize | null
): PhotoViewportState {
  if (state.scale <= 1) return { ...state, position: { x: 0, y: 0 } };
  if (!size) return state;
  const maxX = (size.width * (state.scale - 1)) / 2;
  const maxY = (size.height * (state.scale - 1)) / 2;
  return {
    ...state,
    position: {
      x: Math.max(-maxX, Math.min(maxX, state.position.x)),
      y: Math.max(-maxY, Math.min(maxY, state.position.y)),
    },
  };
}

/** 纯数值状态转换；DOM 尺寸与输入事件由 hook 提供。 */
export function photoViewportReducer(
  state: PhotoViewportState,
  action: PhotoViewportAction
): PhotoViewportState {
  switch (action.type) {
    case "reset":
      return INITIAL_PHOTO_VIEWPORT;
    case "zoom":
      return zoomViewport(state, state.scale + action.delta, action.size);
    case "pinch":
      return zoomViewport(state, state.scale * action.factor, action.size, action.anchor);
    case "pan":
      return constrainViewport({
        ...state,
        position: {
          x: state.position.x + action.delta.x,
          y: state.position.y + action.delta.y,
        },
      }, action.size);
    case "move":
      return constrainViewport({ ...state, position: action.position }, action.size);
  }
}
