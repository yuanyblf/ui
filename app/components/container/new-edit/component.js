import Errors from 'ui/utils/errors';
import { get, set } from '@ember/object';
import { equal } from '@ember/object/computed';
import { next } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import NewOrEdit from 'shared/mixins/new-or-edit';
import { debouncedObserver } from 'ui/utils/debounce';
import C from 'ui/utils/constants';
import ChildHook from 'shared/mixins/child-hook';
import { flattenLabelArrays } from 'shared/mixins/manage-labels';
import layout from './template';

export default Component.extend(NewOrEdit, ChildHook, {
  clusterStore: service(),
  intl:         service(),
  prefs:        service(),
  settings:     service(),

  layout,
  tagName: 'form',

  isUpgrade:         false,
  service:           null,
  launchConfig:      null,
  launchConfigIndex: null,

  namespace: null,
  scale:     1,
  scaleMode: null,

  serviceLinksArray:     null,
  isRequestedHost:       null,
  upgradeOptions:        null,
  separateLivenessCheck: false,

  // Errors from components
  commandErrors:    null,
  volumeErrors:     null,
  networkingErrors: null,
  secretsErrors:    null,
  readyCheckErrors: null,
  liveCheckErrors:  null,
  schedulingErrors: null,
  securityErrors:   null,
  scaleErrors:      null,
  imageErrors:      null,
  portErrors:       null,
  namespaceErrors:  null,
  labelErrors:      null,
  annotationErrors: null,

  // ----------------------------------
  userLabels: null,

  header:        '',
  isSidekick:    equal('scaleMode', 'sidekick'),
  init() {
    window.nec = this;
    this._super(...arguments);

    if (get(this, 'launchConfig') && !get(this, 'launchConfig.environmentFrom')) {
      set(this, 'launchConfig.environmentFrom', []);
    }

    const service = get(this, 'service');

    if (!get(this, 'isSidekick') &&
      service && !get(service, 'scheduling')) {
      set(service, 'scheduling', { node: {} });
    }

    if (!get(this, 'isSidekick')) {
      this.setProperties({
        name:        get(this, 'service.name'),
        description: get(this, 'service.description'),
        scale:       get(this, 'service.scale'),
        scheduling:  get(this, 'service.scheduling'),
      });
    } else {
      this.setProperties({
        name:        get(this, 'launchConfig.name'),
        description: get(this, 'launchConfig.description'),
      });
    }

    let namespaceId = null;

    namespaceId = get(this, 'service.namespaceId');

    if (namespaceId) {
      let namespace = get(this, 'clusterStore').getById('namespace', namespaceId);

      if (namespace) {
        set(this, 'namespace', namespace);
      }
    }

    if (!get(this, 'separateLivenessCheck')) {
      const ready = get(this, 'launchConfig.readinessProbe');
      const live = get(this, 'launchConfig.livenessProbe');
      const readyStr = JSON.stringify(ready);
      const liveStr = JSON.stringify(live);

      if (readyStr !== liveStr) {
        set(this, 'separateLivenessCheck', true);
      }
    }

    if ( !get(this, 'isSidekick') ) {
      this.labelsChanged();
    }
  },

  didInsertElement() {
    const input = this.$("INPUT[type='text']")[0];

    if (input) {
      input.focus();
    }
  },

  actions: {
    setImage(uuid) {
      set(this, 'launchConfig.image', uuid);
    },

    setLabels(section, labels) {
      set(this, `${ section  }Labels`, labels);
    },

    setRequestedHostId(hostId) {
      set(this, 'launchConfig.requestedHostId', hostId);
    },

    setUpgrade(upgrade) {
      set(this, 'upgradeOptions', upgrade);
    },

    done() {
      this.sendAction('done');
    },

    cancel() {
      this.sendAction('cancel');
    },

    toggleSeparateLivenessCheck() {
      set(this, 'separateLivenessCheck', !get(this, 'separateLivenessCheck'));
    },

    removeSidekick(idx) {
      var ary = get(this, 'primaryService.secondaryLaunchConfigs');

      ary.removeAt(idx);
    },
  },

  // Labels
  labelsChanged: debouncedObserver(
    'userLabels.@each.{key,value}',
    function() {
      let out = flattenLabelArrays(
        get(this, 'userLabels'),
      );

      set(this, 'service.labels', out);
    }
  ),

  updateHeader: function() {
    let args = {};
    let k = 'newContainer.';

    k += `${ get(this, 'isUpgrade') ? 'upgrade' : 'add'  }.`;
    if (get(this, 'isSidekick')) {
      let svc = get(this, 'service');

      if (svc && get(svc, 'id')) {
        k += 'sidekickName';
        args = { name: get(this, 'service.displayName') };
      } else {
        k += 'sidekick';
      }
    } else if (get(this, 'isGlobal')) {
      k += 'globalService';
    } else {
      k += 'service';
    }

    next(() => {
      if (this.isDestroyed || this.isDestroying) {
        return;
      }

      set(this, 'header', get(this, 'intl').t(k, args));
    });
  }.observes('isUpgrade', 'isSidekick', 'isGlobal', 'service.displayName', 'intl.locale').on('init'),

  // ----------------------------------
  // ----------------------------------
  // Save
  // ----------------------------------
  validate() {
    let pr = get(this, 'primaryResource');
    let errors = pr.validationErrors() || [];

    (get(this, 'service.secondaryLaunchConfigs') || []).forEach((slc) => {
      slc.validationErrors().forEach((err) => {
        errors.push(`${ get(slc, 'displayName')  }: ${  err }`);
      });
    });

    // Errors from components
    errors.pushObjects(get(this, 'commandErrors') || []);
    errors.pushObjects(get(this, 'volumeErrors') || []);
    errors.pushObjects(get(this, 'networkingErrors') || []);
    errors.pushObjects(get(this, 'secretsErrors') || []);
    errors.pushObjects(get(this, 'readyCheckErrors') || []);
    errors.pushObjects(get(this, 'liveCheckErrors') || []);
    errors.pushObjects(get(this, 'schedulingErrors') || []);
    errors.pushObjects(get(this, 'securityErrors') || []);
    errors.pushObjects(get(this, 'scaleErrors') || []);
    errors.pushObjects(get(this, 'imageErrors') || []);
    errors.pushObjects(get(this, 'portErrors') || []);
    errors.pushObjects(get(this, 'namespaceErrors') || []);
    errors.pushObjects(get(this, 'labelErrors') || []);
    errors.pushObjects(get(this, 'annotationErrors') || []);

    errors = errors.uniq();

    if (get(errors, 'length')) {
      set(this, 'errors', errors);

      return false;
    }

    set(this, 'errors', null);

    return true;
  },

  willSave() {
    let intl = get(this, 'intl');
    let pr;
    let nameResource;
    let lc = get(this, 'launchConfig');
    let name = (get(this, 'name') || '').trim().toLowerCase();
    let service = get(this, 'service');

    let readinessProbe = get(lc, 'readinessProbe');

    if (!get(this, 'separateLivenessCheck')) {
      if ( readinessProbe ) {
        const livenessProbe = Object.assign({}, readinessProbe);

        set(livenessProbe, 'successThreshold', 1);
        set(lc, 'livenessProbe', livenessProbe);
      } else {
        set(lc, 'livenessProbe', null);
      }
    }
    const uid = get(lc, 'uid');

    if ( uid === '' ) {
      set(lc, 'uid', null);
    }

    if (get(this, 'isSidekick')) {
      let errors = [];

      if (!service) {
        errors.push(get(this, 'intl').t('newContainer.errors.noSidekick'));
        set(this, 'errors', errors);

        return false;
      }

      if (!name) {
        errors.push(intl.t('validation.required', { key: intl.t('formNameDescription.name.label') }));
        set(this, 'errors', errors);

        return false;
      }

      pr = service.clone();
      nameResource = lc;

      let slc = get(pr, 'secondaryLaunchConfigs');

      if (!slc) {
        slc = [];
        set(pr, 'secondaryLaunchConfigs', slc);
      }

      let lci = get(this, 'launchConfigIndex');

      if (lci === undefined || lci === null) {
        // If it's a new sidekick, add it to the end of the list
        lci = slc.length;
      } else {
        lci = parseInt(lci, 10)
      }

      let duplicate = pr.containers.find((x, idx) => idx !== lci + 1 && get(x, 'name').toLowerCase() === name);

      if (duplicate) {
        errors.push(intl.t('newContainer.errors.duplicateName', {
          name,
          service: get(duplicate, 'displayName')
        }));
        set(this, 'errors', errors);

        return false;
      }

      slc[lci] = lc;

      set(lc, 'name', name);
      set(pr, 'containers', [pr.containers[0]]);
      pr.containers.pushObjects(slc);
    } else {
      service.clearConfigsExcept(`${ get(this, 'scaleMode')  }Config`);
      pr = service;
      nameResource = pr;
      set(pr, 'scale', get(this, 'scale'));
      const containers = get(pr, 'containers');

      if (!containers) {
        set(pr, 'containers', []);
      } else {
        set(lc, 'name', name);
        containers[0] = lc
      }
    }

    nameResource.setProperties({
      name,
      description: get(this, 'description'),
    });

    set(this, 'primaryResource', pr);
    set(this, 'originalPrimaryResource', pr);

    let errors = [];

    if (!get(this, 'namespace.name')) {
      errors.push(intl.t('validation.required', { key: intl.t('generic.namespace') }));
      set(this, 'errors', errors);

      return false;
    }

    set(pr, 'namespaceId', get(this, 'namespace.id') || '__placeholder__');
    const self = this;
    const sup = this._super;

    return this.applyHooks('_beforeSaveHooks').then(() => {
      set(pr, 'namespaceId', get(this, 'namespace.id'));

      return this.applyHooks('_volumeHooks').then(() => sup.apply(self, ...arguments))
        .catch((err) => {
          set(this, 'errors', [Errors.stringify(err)]);
        });
    })
      .catch((err) => {
        set(this, 'errors', [Errors.stringify(err)]);
      });
  },

  doneSaving() {
    if (!get(this, 'isUpgrade')) {
      let scaleMode = get(this, 'scaleMode');

      if (scaleMode === 'sidekick') {
        // Remember sidekick as service since you're not
        // likely to want to add many sidekicks in a row
        scaleMode = 'deployment';
      }
      set(this, `prefs.${ C.PREFS.LAST_SCALE_MODE }`, scaleMode);
      set(this, `prefs.${ C.PREFS.LAST_IMAGE_PULL_POLICY }`, get(this, 'launchConfig.imagePullPolicy'));
      set(this, `prefs.${ C.PREFS.LAST_NAMESPACE }`, get(this, 'namespace.id'));
    }
    this.sendAction('done');
  },

});
