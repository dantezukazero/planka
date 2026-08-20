const { expect } = require('chai');

const CardModel = require('../../api/models/Card');

/* eslint-disable import/newline-after-import */
global.Card = CardModel;

const createController = require('../../api/controllers/cards/create');
const updateController = require('../../api/controllers/cards/update');
delete global.Card;
/* eslint-enable import/newline-after-import */

describe('Card startDate contract', () => {
  it('maps startDate to the start_date database column for serialization', () => {
    expect(CardModel.attributes.startDate).to.deep.equal({
      type: 'ref',
      columnName: 'start_date',
    });
  });

  it('accepts startDate on create and nullable startDate on update', () => {
    expect(createController.inputs.startDate.custom).to.be.a('function');
    expect(updateController.inputs.startDate.custom).to.be.a('function');
    expect(updateController.inputs.startDate.allowNull).to.equal(true);
  });
});
