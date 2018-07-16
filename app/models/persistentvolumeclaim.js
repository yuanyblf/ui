import Resource from 'ember-api-store/models/resource';
import { get, computed } from '@ember/object'
import { reference } from 'ember-api-store/utils/denormalize';
import { parseSi, formatSi } from 'shared/utils/parse-unit';
import { inject as service } from '@ember/service';

var PersistentVolumeClaim = Resource.extend({
  storageClass:     reference('storageClassId', 'storageClass', 'clusterStore'),
  persistentVolume: reference('volumeId', 'persistentVolume', 'clusterStore'),
  namespace:        reference('namespaceId', 'namespace', 'clusterStore'),

  sizeBytes: computed('status.capacity.storage', function() {

    const str = get(this, 'status.capacity.storage');

    if ( str ) {

      return parseSi(str, 1024);

    }

  }),

  displaySize: computed('sizeBytes', function() {

    const bytes = get(this, 'sizeBytes');

    if ( bytes ) {

      return formatSi(bytes, 1024, 'iB', 'B');

    }

  }),
  clusterStore: service(),
  type:         'persistentVolumeClaim',
  canEdit:      false,

});

export default PersistentVolumeClaim;
