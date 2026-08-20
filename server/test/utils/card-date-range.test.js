const { expect } = require('chai');

const { getEffectiveCardDateRange, isCardDateRangeValid } = require('../../utils/card-date-range');

describe('card date range validation', () => {
  it('accepts a legacy due date without a start date', () => {
    expect(isCardDateRangeValid(null, '2026-08-20T12:00:00.000Z')).to.equal(true);
  });

  it('accepts same-day and multi-day ranges in chronological order', () => {
    expect(isCardDateRangeValid('2026-08-20T09:00:00.000Z', '2026-08-20T17:00:00.000Z')).to.equal(
      true,
    );
    expect(isCardDateRangeValid('2026-08-20T09:00:00.000Z', '2026-08-23T17:00:00.000Z')).to.equal(
      true,
    );
  });

  it('rejects a start date without a due date', () => {
    expect(isCardDateRangeValid('2026-08-20T09:00:00.000Z', null)).to.equal(false);
  });

  it('rejects a start date after the due date', () => {
    expect(isCardDateRangeValid('2026-08-21T09:00:00.000Z', '2026-08-20T17:00:00.000Z')).to.equal(
      false,
    );
  });

  it('rejects invalid date values', () => {
    expect(isCardDateRangeValid(null, 'not-an-iso-date')).to.equal(false);
    expect(isCardDateRangeValid('not-an-iso-date', '2026-08-20T17:00:00.000Z')).to.equal(false);
  });

  it('validates an updated start date against the stored due date', () => {
    const range = getEffectiveCardDateRange(
      { startDate: null, dueDate: '2026-08-23T17:00:00.000Z' },
      { startDate: '2026-08-20T09:00:00.000Z' },
    );

    expect(range).to.deep.equal({
      startDate: '2026-08-20T09:00:00.000Z',
      dueDate: '2026-08-23T17:00:00.000Z',
    });
    expect(isCardDateRangeValid(range.startDate, range.dueDate)).to.equal(true);
  });

  it('validates an updated due date against the stored start date', () => {
    const range = getEffectiveCardDateRange(
      {
        startDate: '2026-08-20T09:00:00.000Z',
        dueDate: '2026-08-23T17:00:00.000Z',
      },
      { dueDate: '2026-08-24T17:00:00.000Z' },
    );

    expect(range.dueDate).to.equal('2026-08-24T17:00:00.000Z');
    expect(isCardDateRangeValid(range.startDate, range.dueDate)).to.equal(true);
  });

  it('allows removing startDate while retaining dueDate', () => {
    const range = getEffectiveCardDateRange(
      {
        startDate: '2026-08-20T09:00:00.000Z',
        dueDate: '2026-08-23T17:00:00.000Z',
      },
      { startDate: null },
    );

    expect(range).to.deep.equal({
      startDate: null,
      dueDate: '2026-08-23T17:00:00.000Z',
    });
    expect(isCardDateRangeValid(range.startDate, range.dueDate)).to.equal(true);
  });
});
