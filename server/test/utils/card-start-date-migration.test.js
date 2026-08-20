const { expect } = require('chai');

const migration = require('../../db/migrations/20260820000000_add_card_start_date');

const createKnex = () => {
  const operations = [];
  const table = {
    timestamp: (name, withTimezone) => operations.push(['timestamp', name, withTimezone]),
    dropColumn: (name) => operations.push(['dropColumn', name]),
  };
  const knex = {
    schema: {
      alterTable: (name, callback) => {
        operations.push(['alterTable', name]);
        callback(table);
        return Promise.resolve();
      },
    },
  };

  return { knex, operations };
};

describe('add card start date migration', () => {
  it('adds a timezone-aware nullable start_date column', async () => {
    const { knex, operations } = createKnex();

    await migration.up(knex);

    expect(operations).to.deep.equal([
      ['alterTable', 'card'],
      ['timestamp', 'start_date', true],
    ]);
  });

  it('removes start_date when rolling back', async () => {
    const { knex, operations } = createKnex();

    await migration.down(knex);

    expect(operations).to.deep.equal([
      ['alterTable', 'card'],
      ['dropColumn', 'start_date'],
    ]);
  });
});
