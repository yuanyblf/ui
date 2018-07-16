import { observer } from '@ember/object';
import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import ManageLabels from 'shared/mixins/manage-labels';
import layout from './template';

export default Component.extend(ManageLabels, {
  layout,
  model: null,

  sortBy:           'key',
  descending:       false,

  headers: [
    {
      name:           'key',
      sort:           ['key'],
      translationKey: 'annotationsSection.key',
    },
    {
      name:           'value',
      sort:           ['value', 'key'],
      translationKey: 'annotationsSection.value',
    },
  ],

  annotationSource:    alias('model.annotations'),
  annotationsObserver: observer('model.annotations', function() {

    this.initLabels(this.get('annotationSource'));

  }),

  didReceiveAttrs() {

    this.initLabels(this.get('annotationSource'));

  },
});
