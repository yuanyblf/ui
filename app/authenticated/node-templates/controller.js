import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { get } from '@ember/object';

export default Controller.extend({
  modalService:      service('modal'),

  sortBy:            'name',
  headers: [
    {
      name:           'state',
      sort:           ['sortState', 'name', 'id'],
      translationKey: 'nodeTemplatesPage.table.state',
      width:          100,
    },
    {
      name:           'name',
      sort:           ['name', 'id'],
      translationKey: 'nodeTemplatesPage.table.name',
    },
    {
      name:           'provider',
      sort:           ['displayProvider', 'name', 'id'],
      translationKey: 'nodeTemplatesPage.table.provider',
      width:          150,
    },
    {
      name:           'location',
      sort:           ['displayLocation', 'name', 'id'],
      translationKey: 'nodeTemplatesPage.table.location',
      width:          150,
    },
    {
      name:           'size',
      sort:           ['displaySize', 'name', 'id'],
      translationKey: 'nodeTemplatesPage.table.size',
      width:          150,
    },
  ],

  actions: {
    newTemplate() {

      get(this, 'modalService').toggleModal('modal-edit-node-template');

    },
  },
});
