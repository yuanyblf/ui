import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { get, set } from '@ember/object';

export default Component.extend({
  saml:     service(),
  errors:   null,
  provider: null,

  actions: {
    authenticate() {
      get(this, 'saml').login(get(this, 'provider')).catch( ( err ) => {
        set(this, 'errors', [err.message])
      });
    }
  }
});
