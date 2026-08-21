import createCalendarEventInteractionGuard from './calendar-event-interaction';

describe('calendar event interaction guard', () => {
  test('allows normal event clicks immediately', () => {
    expect(createCalendarEventInteractionGuard().shouldIgnoreClick()).toBe(false);
  });

  test('guards a click through the frame immediately following drag or resize stop', () => {
    const guard = createCalendarEventInteractionGuard();
    const cancelFrame = jest.fn();
    let finishFrame;
    const requestFrame = jest.fn((callback) => {
      finishFrame = callback;
      return 7;
    });

    guard.start(cancelFrame);
    expect(guard.shouldIgnoreClick()).toBe(true);

    guard.stop(requestFrame, cancelFrame);
    expect(guard.shouldIgnoreClick()).toBe(true);

    finishFrame();
    expect(guard.shouldIgnoreClick()).toBe(false);
  });

  test('cancels pending reset work when another interaction starts or the view unmounts', () => {
    const guard = createCalendarEventInteractionGuard();
    const cancelFrame = jest.fn();
    const requestFrame = jest.fn(() => 11);

    guard.start(cancelFrame);
    guard.stop(requestFrame, cancelFrame);
    guard.start(cancelFrame);

    expect(cancelFrame).toHaveBeenCalledWith(11);
    expect(guard.shouldIgnoreClick()).toBe(true);

    guard.clear(cancelFrame);
    expect(guard.shouldIgnoreClick()).toBe(false);

    const unmountGuard = createCalendarEventInteractionGuard();
    requestFrame.mockReturnValueOnce(13);
    unmountGuard.start(cancelFrame);
    unmountGuard.stop(requestFrame, cancelFrame);
    unmountGuard.clear(cancelFrame);

    expect(cancelFrame).toHaveBeenCalledWith(13);
    expect(unmountGuard.shouldIgnoreClick()).toBe(false);
  });
});
