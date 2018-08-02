import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import NewOrEdit from 'shared/mixins/new-or-edit';
import ModalBase from 'shared/mixins/modal-base';
import layout from './template';
import { inject as service } from '@ember/service';
import { set, get, observer } from '@ember/object';

export default Component.extend(ModalBase, NewOrEdit, {
  scope: service(),

  layout,
  classNames:    ['large-modal'],
  editing:       true,
  model:         null,

  allNamespaces:     null,
  allProjects:       null,
  allQuotaTemplates: null,
  tags:              null,

  originalModel:  alias('modalService.modalOpts'),
  init() {
    this._super(...arguments);

    var orig = get(this, 'originalModel');
    var clone = orig.clone();

    delete clone.services;
    set(this, 'model', clone);
    set(this, 'tags', (get(this, 'primaryResource.tags') || []).join(','));
    set(this, 'allNamespaces', get(this, 'clusterStore').all('namespace'));
    set(this, 'allProjects', get(this, 'globalStore').all('project')
      .filterBy('clusterId', get(this, 'scope.currentCluster.id')));
    set(this, 'allQuotaTemplates', get(this, 'globalStore').all('resourceQuotaTemplate')
      .filterBy('clusterId', get(this, 'scope.currentCluster.id')));
  },

  actions: {
    addTag(tag) {
      const tags = get(this, 'primaryResource.tags') || [];

      tags.addObject(tag);
      set(this, 'tags', tags.join(','));
    },
  },

  tagsDidChanged: observer('tags', function() {
    set(this, 'primaryResource.tags', get(this, 'tags').split(',') || []);
  }),

  projectDidChange: observer('primaryResource.projectId', function() {
    if ( !get(this, 'primaryResource.project.resourceQuota') ) {
      set(this, 'primaryResource.resourceQuotaTemplateId', null);
    }
  }),

  doneSaving() {
    this.send('cancel');
  }
});
