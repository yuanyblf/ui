import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { get, set } from '@ember/object'
import { inject as service } from '@ember/service';
import { on } from '@ember/object/evented';
import C from 'ui/utils/constants';

export default Route.extend({
  globalStore: service(),

  setDefaultRoute: on('activate', function() {

    set(this, `session.${ C.SESSION.CLUSTER_ROUTE }`, 'authenticated.cluster.notifier');

  }),
  model(params, transition) {

    const cs = get(this, 'globalStore');
    const clusterId = transition.params['authenticated.cluster'].cluster_id;

    return hash({ notifiers: cs.findAll('notifier', { filter: { clusterId } }).then(() => cs.all('notifier')), });

  },

});
