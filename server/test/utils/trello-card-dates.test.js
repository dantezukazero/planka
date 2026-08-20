const { expect } = require('chai');

const { getTrelloCardDateValues } = require('../../utils/trello-card-dates');

describe('Trello card date import mapping', () => {
  it('maps start and due to a date range and preserves dueComplete', () => {
    expect(
      getTrelloCardDateValues({
        start: '2026-08-20T09:00:00.000Z',
        due: '2026-08-23T17:00:00.000Z',
        dueComplete: true,
      }),
    ).to.deep.equal({
      startDate: '2026-08-20T09:00:00.000Z',
      dueDate: '2026-08-23T17:00:00.000Z',
      isDueCompleted: true,
    });
  });

  it('keeps a due-only card as a legacy due-date event', () => {
    expect(
      getTrelloCardDateValues({
        due: '2026-08-23T17:00:00.000Z',
        dueComplete: false,
      }),
    ).to.deep.equal({
      startDate: null,
      dueDate: '2026-08-23T17:00:00.000Z',
      isDueCompleted: false,
    });
  });

  it('maps a card without Trello dates to null date values', () => {
    expect(getTrelloCardDateValues({})).to.deep.equal({
      startDate: null,
      dueDate: null,
      isDueCompleted: undefined,
    });
  });

  it('preserves ISO timestamps with explicit timezone offsets', () => {
    const start = '2026-10-25T01:30:00.000+02:00';
    const due = '2026-10-25T03:30:00.000+01:00';

    expect(getTrelloCardDateValues({ start, due, dueComplete: false })).to.include({
      startDate: start,
      dueDate: due,
    });
  });
});
