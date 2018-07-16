import { inject as service } from '@ember/service';
import Component from '@ember/component';
import C from 'ui/utils/constants';
import layout from './template';
import { isPrivate, isBadTld } from 'ui/utils/util';

export default Component.extend({
  endpoint: service(),
  settings: service(),

  layout,
  customRadio: null,
  customValue: '',
  thisPage:    null,

  looksPrivate: function() {

    return isPrivate(this.get('activeValue'));

  }.property('activeValue'),

  badTld: function() {

    return isBadTld(this.get('activeValue'));

  }.property('activeValue'),

  activeValue: function() {

    if (this.get('customRadio') === 'yes') {

      return this.get('customValue').trim();

    } else {

      return this.get('thisPage');

    }

  }.property('customRadio', 'customValue', 'thisPage'),

  customValueDidChange: function() {

    let val = (this.get('customValue') || '').trim();
    let idx = val.indexOf('/', 8); // 8 is enough for "https://"

    if (idx !== -1) {

      // Trim paths off of the URL
      this.set('customValue', val.substr(0, idx));

      return; // We'll be back...

    }

    if (val) {

      this.set('customRadio', 'yes');

    }

  }.observes('customValue'),

  didReceiveAttrs() {

    let initial     = this.get('initialValue');
    let endpoint    = this.get('endpoint.origin');
    let thisPage    = window.location.origin;

    let value, radio;

    if ( initial ) {

      if ( initial === thisPage ) {

        value = (initial === endpoint ? '' : endpoint);
        radio = 'no';

      } else {

        value = initial;
        radio = 'yes';

      }

    } else {

      if ( endpoint === thisPage ) {

        value = '';
        radio = 'no';

      } else {

        value = endpoint;
        radio = 'yes';

      }

    }

    this.setProperties({
      thisPage,
      customValue: value,
      customRadio: radio
    });

  },

  actions: {
    save(btnCb) {

      let value = this.get('activeValue');

      if (!value) {

        this.set('errors', ['Please provide a URL']);
        btnCb();

        return;

      }

      this.set('errors', null);

      this.get('settings').set(C.SETTING.API_HOST, value);
      this.get('settings').one('settingsPromisesResolved', () => {

        btnCb(true);
        this.sendAction('saved');

      });

    },
  },

});
