import {
  get, set, observer
} from '@ember/object';
import Component from '@ember/component';
import ViewNewEdit from 'shared/mixins/view-new-edit';
import OptionallyNamespaced from 'shared/mixins/optionally-namespaced';
import layout from './template';
import  { PRESETS_BY_NAME } from  'ui/models/dockercredential';

export default Component.extend(ViewNewEdit, OptionallyNamespaced, {
  layout,
  model: null,

  titleKey: 'cruRegistry.title',

  scope:     'project',
  namespace: null,
  asArray:   null,

  projectType:    'dockerCredential',
  namespacedType: 'namespacedDockerCredential',

  arrayChanged: observer('asArray.@each.{preset,address,username,password,auth}', function() {

    const registries = {};

    get(this, 'asArray').forEach((obj) => {

      const preset = get(obj, 'preset');
      let key = get(obj, 'address');

      if ( PRESETS_BY_NAME[preset] ) {

        key = PRESETS_BY_NAME[preset];

      }

      let val = {};

      ['username', 'password', 'auth'].forEach((k) => {

        let v = get(obj, k);

        if ( v ) {

          val[k] = v;

        }

      });

      registries[key] = val;

    });

    set(this, 'model.registries', registries);

    return this._super(...arguments);

  }),

  init() {

    this._super(...arguments);
    set(this, 'asArray', JSON.parse(JSON.stringify(get(this, 'model.asArray') || [])));

  },

  validate() {

    const errors = [];

    if ( get(this, 'scope') !== 'project' ) {

      errors.pushObjects(get(this, 'namespaceErrors') || []);

    }
    set(this, 'errors', errors);

    return errors.length === 0;

  },

  doSave() {

    let self = this;
    let sup = self._super;

    return this.namespacePromise().then(() => sup.apply(self, arguments));

  },

  doneSaving() {

    this.sendAction('cancel');

  },
});
