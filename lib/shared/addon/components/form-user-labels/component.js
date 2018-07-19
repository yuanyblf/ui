import { next } from '@ember/runloop';
import {  set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import ManageLabels from 'shared/mixins/manage-labels';
import {
  STATUS,
  STATUS_INTL_KEY,
  classForStatus
} from 'shared/components/accordion-list-item/component';
import layout from './template';

export default Component.extend(ManageLabels, {
  intl: service(),

  layout,
  classNames: ['accordion-wrapper'],

  detailKey: 'formUserLabels.detail',

  expandAll: null,

  readonlyLabels: null,

  // Inputs
  initialLabels: null,

  statusClass: null,
  status:      function() {
    let k = STATUS.NONE;
    let count = this.get('userLabelArray').filterBy('key').get('length') || 0;

    if ( count ) {
      k = STATUS.COUNTCONFIGURED;
    }

    this.set('statusClass', classForStatus(k));

    return this.get('intl').t(`${ STATUS_INTL_KEY }.${ k }`, { count });
  }.property('userLabelArray.@each.key'),
  init() {
    this._super(...arguments);

    this.initLabels(this.get('initialLabels'), 'user', null, this.get('readonlyLabels'));
    this.labelsChanged();
  },

  didReceiveAttrs() {
    if (!this.get('expandFn')) {
      this.set('expandFn', (item) => {
        item.toggleProperty('expanded');
      });
    }
  },

  actions: {
    addUserLabel() {
      this._super();
      next(() => {
        if ( this.isDestroyed || this.isDestroying ) {
          return;
        }

        this.$('INPUT.key').last()[0].focus();
      });
    },
  },

  updateLabels(labels) {
    this.sendAction('setLabels', labels);
    this.validate();
  },

  validate() {
    let errors = [];

    //    (this.get('labelArray')||[]).forEach((obj) => {
    //    });

    set(this, 'errors', errors);
  },

});
