/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const createCalendarEventInteractionGuard = () => {
  let isActive = false;
  let resetFrame = null;

  return {
    start(cancelFrame) {
      if (resetFrame !== null) {
        cancelFrame(resetFrame);
        resetFrame = null;
      }

      isActive = true;
    },
    stop(requestFrame, cancelFrame) {
      if (resetFrame !== null) {
        cancelFrame(resetFrame);
      }

      resetFrame = requestFrame(() => {
        isActive = false;
        resetFrame = null;
      });
    },
    clear(cancelFrame) {
      if (resetFrame !== null) {
        cancelFrame(resetFrame);
      }

      isActive = false;
      resetFrame = null;
    },
    shouldIgnoreClick() {
      return isActive;
    },
  };
};

export default createCalendarEventInteractionGuard;
