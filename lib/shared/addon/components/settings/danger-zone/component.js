import EmberObject from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { normalizeName } from 'shared/settings/service';
import { get, set, computed } from '@ember/object';
import C from 'ui/utils/constants';
import layout from './template';

export default Component.extend({
  settings:        service(),
  modalService:    service('modal'),
  layout,
  loading:         false,
  show:            false,

  actions: {
    showNode(node) {
      node.toggleProperty('hide');
    },

    show() {
      set(this, 'loading', true);
      get(this, 'settings').loadAll().then(() => {
        set(this, 'loading', false);
        set(this, 'show', true);
      }).catch(() => {
        set(this, 'loading', false);
        set(this, 'show', false);
      });
    },
  },

  allowed: computed(() => {
    let out = {};

    Object.keys(C.SETTING.ALLOWED).forEach((key) => {
      let val = Object.assign({}, C.SETTING.ALLOWED[key]);

      val.descriptionKey = `dangerZone.description.${  key }`;
      out[key] = val;
    });

    return out;
  }),

  current: computed('settings.all.@each.{name,source}', function() {
    let all = get(this, 'settings.asMap');
    let allowed = get(this, 'allowed');
    let isLocalDev = window.location.host === 'localhost:8000';

    return Object.keys(allowed).filter((key) => {
      let details = allowed[key];

      return (!details['devOnly'] || isLocalDev);
    }).map((key) => {
      let obj = all[normalizeName(key)];
      let details = allowed[key];

      let out =  EmberObject.create({
        key,
        obj,
      });

      if (get(details, 'kind') === 'multiline') {
        out.set('hide', true);
      }

      (Object.keys(details) || []).forEach((key2) => {
        out.set(key2, details[key2]);
      });

      return out;
    });
  }),
});
