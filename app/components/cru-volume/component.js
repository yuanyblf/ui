import Component from '@ember/component';
import ViewNewEdit from 'shared/mixins/view-new-edit';
import { inject as service } from '@ember/service';
import {
  get, set, computed
} from '@ember/object';
import layout from './template';
import { getSources } from 'ui/models/volume';

export default Component.extend(ViewNewEdit, {
  intl: service(),

  layout,
  model:      null,
  sourceName: null,

  titleKey:    'cruVolume.title',
  headerToken: function() {

    let k = 'cruPersistentVolumeClaim.define.';

    k += get(this, 'mode');

    return k;

  }.property('scope'),

  sourceChoices: computed('intl.locale', function() {

    const intl = get(this, 'intl');
    const skip = ['host-path', 'secret'];
    const out = getSources('ephemeral').map((p) => {

      const entry = Object.assign({}, p);
      const key = `volumeSource.${ entry.name }.title`;

      if ( skip.includes(entry.name) ) {

        entry.priority = 0;

      } else if ( intl.exists(key) ) {

        entry.label = intl.t(key);
        if ( p.persistent ) {

          entry.priority = 2;

        } else {

          entry.priority = 1;

        }

      } else {

        entry.label = entry.name;
        entry.priority = 3;

      }

      return entry;

    });

    return out.filter((x) => x.priority > 0 ).sortBy('priority', 'label');

  }),

  sourceComponent: computed('sourceName', function() {

    const name = get(this, 'sourceName');
    const sources = getSources('ephemeral');
    const entry = sources.findBy('name', name);

    if (entry) {

      return {
        component: `volume-source/source-${ name }`,
        field:     entry.value,
      }

    }

  }),
  didReceiveAttrs() {

    set(this, 'sourceName', get(this, 'primaryResource.sourceName'));

  },

  actions: {
    updateParams(key, map) {

      getSources('ephemeral').forEach((source) => {

        if (source.value === key){

          set(this, `primaryResource.${ key }`, map);

        } else {

          set(this, `primaryResource.${ source.value }`, null);

        }

      });

    },
  },

  willSave() {

    const vol = get(this, 'primaryResource');
    const entry = getSources('ephemeral').findBy('name', get(this, 'sourceName'));

    if ( !entry ) {

      const errors = [];
      const intl = get(this, 'intl');

      errors.push(intl.t('validation.required', { key: intl.t('cruVolume.source.label') }));
      set(this, 'errors', errors);

      return false;

    }

    vol.clearSourcesExcept(entry.value);

    let ok = this._super(...arguments);

    if ( ok ) {

      this.sendAction('doSave', { volume: vol, });
      this.doneSaving();

    }

    return false;

  },

  doneSaving() {

    this.sendAction('done');

  },

});
