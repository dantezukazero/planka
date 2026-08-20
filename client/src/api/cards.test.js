import { transformCard, transformCardData } from './cards';

jest.mock('./socket', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('./attachments', () => ({ transformAttachment: jest.fn() }));
jest.mock('./activities', () => ({ transformActivity: jest.fn() }));
jest.mock('./notifications', () => ({ transformNotification: jest.fn() }));

describe('card date API transforms', () => {
  test('deserializes startDate and dueDate as native dates', () => {
    const card = transformCard({
      id: 'card-1',
      startDate: '2026-08-20T09:00:00.000Z',
      dueDate: '2026-08-23T17:00:00.000Z',
    });

    expect(card.startDate).toEqual(new Date('2026-08-20T09:00:00.000Z'));
    expect(card.dueDate).toEqual(new Date('2026-08-23T17:00:00.000Z'));
  });

  test('serializes native startDate and dueDate as ISO timestamps', () => {
    const data = transformCardData({
      startDate: new Date('2026-08-20T09:00:00.000Z'),
      dueDate: new Date('2026-08-23T17:00:00.000Z'),
    });

    expect(data).toEqual({
      startDate: '2026-08-20T09:00:00.000Z',
      dueDate: '2026-08-23T17:00:00.000Z',
    });
  });

  test('preserves null values used to remove a range', () => {
    expect(transformCardData({ startDate: null, dueDate: null })).toEqual({
      startDate: null,
      dueDate: null,
    });
  });
});
