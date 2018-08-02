import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';

export default Route.extend({
  clusterStore: service(),

  model(params) {
    return get(this, 'clusterStore').find('storageclass', params.storage_class_id);
  },
});
