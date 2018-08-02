import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import C from 'ui/utils/constants';
import { computed, get, set } from '@ember/object';

export default Controller.extend({
  globalStore:  service(),
  modalService: service('modal'),
  growl:        service(),
  settings:     service(),
  catalog:      service(),

  togglingHelmIncubator: false,
  togglingHelmStable:    false,
  togglingLibrary:       false,

  headers: [
    {
      name:           'state',
      sort:           ['sortState', 'displayName'],
      searchField:    'displayState',
      translationKey: 'generic.state',
      width:          120,
    },
    {
      name:           'name',
      sort:           ['displayName', 'id'],
      searchField:    'displayName',
      translationKey: 'generic.name',
    },
    {
      name:           'kind',
      sort:           ['catalogKind', 'displayName'],
      searchField:    'catalogKind',
      translationKey: 'catalogSettings.more.kind.label',
      width:          120,
    },
    {
      name:           'url',
      sort:           ['url', 'displayName'],
      translationKey: 'catalogSettings.more.url.label',
    },
    {
      name:           'branch',
      sort:           ['branch', 'displayName'],
      translationKey: 'catalogSettings.more.branch.label',
      width:          120,
    },
  ],

  actions: {
    disableLibrary() {
      if ( get(this, 'togglingLibrary') ) {
        return;
      }

      set(this, 'togglingLibrary', true);
      get(this, 'library').delete().catch((err) => {
        get(this, 'growl').fromError('Error removing Library', err);
      }).finally(() => {
        set(this, 'togglingLibrary', false);
        this.send('refresh');
      });
    },
    enableLibrary() {
      if ( get(this, 'togglingLibrary') ) {
        return;
      }

      set(this, 'togglingLibrary', true);
      get(this, 'globalStore').createRecord({
        type:   'catalog',
        name:   C.CATALOG.LIBRARY_KEY,
        url:    C.CATALOG.LIBRARY_VALUE,
        branch: C.CATALOG.DEFAULT_BRANCH,
        kind:   'helm',
      }).save().catch((err) => {
        get(this, 'growl').fromError('Error saving Library', err);
      })
        .finally(() => {
          set(this, 'togglingLibrary', false);
          this.send('refresh');
        });
    },

    disableHelmIncubator() {
      if ( get(this, 'togglingHelmIncubator') ) {
        return;
      }

      set(this, 'togglingHelmIncubator', true);
      get(this, 'helmIncubator').delete().catch((err) => {
        get(this, 'growl').fromError('Error removing Incubator', err);
      }).finally(() => {
        set(this, 'togglingHelmIncubator', false);
        this.send('refresh');
      });
    },
    enableHelmIncubator() {
      if ( get(this, 'togglingHelmIncubator') ) {
        return;
      }

      set(this, 'togglingHelmIncubator', true);
      get(this, 'globalStore').createRecord({
        type:   'catalog',
        name:   C.CATALOG.HELM_INCUBATOR_KEY,
        url:    C.CATALOG.HELM_INCUBATOR_VALUE,
        branch: C.CATALOG.DEFAULT_BRANCH,
        kind:   'helm',
      }).save().catch((err) => {
        get(this, 'growl').fromError('Error saving Incubator', err);
      })
        .finally(() => {
          set(this, 'togglingHelmIncubator', false);
          this.send('refresh');
        });
    },

    disableHelmStable() {
      if ( get(this, 'togglingHelmStable') ) {
        return;
      }

      set(this, 'togglingHelmStable', true);
      get(this, 'helmStable').delete().catch((err) => {
        get(this, 'growl').fromError('Error removing Stable', err);
      }).finally(() => {
        set(this, 'togglingHelmStable', false);
        this.send('refresh');
      });
    },
    enableHelmStable() {
      if ( get(this, 'togglingHelmStable') ) {
        return;
      }

      set(this, 'togglingHelmStable', true);
      get(this, 'globalStore').createRecord({
        type:   'catalog',
        name:   C.CATALOG.HELM_STABLE_KEY,
        url:    C.CATALOG.HELM_STABLE_VALUE,
        branch: C.CATALOG.DEFAULT_BRANCH,
        kind:   'helm',
      }).save().catch((err) => {
        get(this, 'growl').fromError('Error saving Stable', err);
      })
        .finally(() => {
          set(this, 'togglingHelmStable', false);
          this.send('refresh');
        });
    },

    enableCommunity() {
      get(this, 'globalStore').createRecord({
        type:   'catalog',
        name:   C.CATALOG.COMMUNITY_KEY,
        url:    C.CATALOG.COMMUNITY_VALUE,
        branch: C.CATALOG.COMMUNITY_BRANCH,
      }).save().catch((err) => {
        get(this, 'growl').fromError('Error saving Community', err);
      })
        .finally(() => {
          this.send('refresh', this)
        });
    },

    disableCommunity() {
      get(this, 'stdCommunity').delete().catch((err) => {
        get(this, 'growl').fromError('Error removing Community', err);
      }).finally(() => {
        this.send('refresh', this)
      });
    },

    add() {
      const record = get(this, 'globalStore').createRecord({
        type:   'catalog',
        kind:   'helm',
        branch: 'master',
      });

      get(this, 'modalService').toggleModal('modal-edit-catalog', record);
    },
  },

  library: computed('model.@each.{name,url,branch}', function() {
    return this.findMatch(
      C.CATALOG.LIBRARY_KEY,
      C.CATALOG.LIBRARY_VALUE
    );
  }),

  helmStable: computed('model.@each.{name,url,branch}', function() {
    return this.findMatch(
      C.CATALOG.HELM_STABLE_KEY,
      C.CATALOG.HELM_STABLE_VALUE,
    );
  }),

  helmIncubator: computed('model.@each.{name,url,branch}', function() {
    return this.findMatch(
      C.CATALOG.HELM_INCUBATOR_KEY,
      C.CATALOG.HELM_INCUBATOR_VALUE,
    );
  }),

  custom: computed('library', 'helmStable', 'helmIncubator', function() {
    const hide = [
      get(this, 'library'),
      get(this, 'helmStable'),
      get(this, 'helmIncubator')
    ];

    return get(this, 'model').filter((x) => !hide.includes(x));
  }),
  customLibrary: computed('custom.@each.{name}', function() {
    return get(this, 'custom').findBy('name', 'library')
  }),
  customHelmStable: computed('custom.@each.{name}', function() {
    return get(this, 'custom').findBy('name', 'helm')
  }),
  customHelmIncubator: computed('custom.@each.{name}', function() {
    return get(this, 'custom').findBy('name', 'helm-incubator')
  }),
  findMatch(name, url, branch) {
    const entry = get(this, 'model').findBy('name', name);

    if ( !entry ) {
      return null;
    }

    if ( get(entry, 'url') === url &&
         (!branch || get(entry, 'branch') === branch)
    ) {
      return entry;
    }
  },

});
