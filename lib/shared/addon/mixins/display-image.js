import Mixin from '@ember/object/mixin';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';

export default Mixin.create({
  intl: service(),

  displayImage: computed('containers.@each.image', function() {

    const containers = get(this, 'containers') || [];
    const count = get(containers, 'length');

    if ( count > 1  ) {

      return get(this, 'intl').t('pagination.image', {
        pages: 1,
        count
      });

    } else if ( count ) {

      return get(containers, 'firstObject.image');

    } else {

      return get(this, 'intl').t('generic.unknown');

    }

  }),
});
