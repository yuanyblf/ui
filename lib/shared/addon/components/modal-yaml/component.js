import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import {
  get, set, computed, observer
} from '@ember/object';
import NewOrEdit from 'ui/mixins/new-or-edit';
import { inject as service } from '@ember/service';
import CodeMirror from 'codemirror';
import jsyaml from 'npm:js-yaml';
import ModalBase from 'shared/mixins/modal-base';
import fetchYaml from 'shared/utils/fetch-yaml';
import layout from './template';

export default Component.extend(ModalBase, NewOrEdit, {
  intl:  service(),
  growl: service(),
  scope: service(),
  store: service('store'),

  layout,
  model:      null,
  errors:     null,
  compose:    null,
  classNames: ['modal-container', 'large-modal', 'fullscreen-modal', 'modal-shell', 'alert'],

  resource: alias('modalService.modalOpts.resource'),
  readOnly: alias('modalService.modalOpts.readOnly'),

  filename: computed('model.resource', function() {

    let resource = get(this, 'model.resource');

    if (resource){

      return `${ resource.name  }.yaml`;

    }

    return 'kubenetes.yaml';

  }),

  lintObserver: observer('model.yaml', function() {

    const yaml = get(this, 'model.yaml');
    const lintError = [];

    jsyaml.safeLoadAll(yaml, (y) => {

      lintError.pushObjects(CodeMirror.lint.yaml(y));

    });
    if ( lintError.length ) {

      set(this, 'errors', null);

    }

  }),

  init() {

    this._super(...arguments);

    window.jsyaml || (window.jsyaml = jsyaml);

    let resource = get(this, 'resource');

    if ( resource && resource.links.yaml ) {

      let yamlLink = resource.links.yaml;

      return fetchYaml(yamlLink).then((yaml) => {

        set(this, 'editing', true);
        set(this, 'model', {
          resource,
          yaml
        });

      });

    } else {

      set(this, 'editing', false);
      set(this, 'model', {
        resource,
        yaml: ''
      });

    }

  },

  actions: {
    cancel() {

      return this._super(...arguments);

    },

    close() {

      return this._super(...arguments);

    },

    save(success) {

      let model = get(this, 'model');
      const lintError = [];

      jsyaml.safeLoadAll(model.yaml, (y) => {

        lintError.pushObjects(CodeMirror.lint.yaml(y));

      });

      if ( lintError.length ) {

        set(this, 'errors', [get(this, 'intl').t('yamlPage.errors')]);
        success(false);

        return;

      }

      set(this, 'errors', null);

      let resource = model.resource;

      if ( resource ) {

        get(this, 'store').request({
          data:   JSON.stringify(jsyaml.load(model.yaml)),
          url:    resource.links.yaml,
          method: 'PUT'
        })
          .then(() => {

            this.send('cancel');

          })
          .catch(() => {

            success(false);

          });

        return;

      }

    },
  },

});
