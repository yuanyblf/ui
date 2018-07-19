import { on } from '@ember/object/evented';
import Component from '@ember/component';
import layout from './template'
import { inject as service } from '@ember/service'
import {
  get, set, observer
} from '@ember/object'
import { run } from '@ember/runloop';

const NONE            = 'none';
const INCOMPLETE      = 'incomplete';
const ERROR           = 'error';
const NOTCONFIGURED   = 'notConfigured';
const CONFIGURED      = 'configured';
const COUNTCONFIGURED = 'countConfigured';
const STANDARD        = 'standard';
const SPECIFIC        = 'specific';
const CUSTOM          = 'custom';
const RULE            = 'rule';
const ANY             = 'any';

export const STATUS = {
  NONE,
  INCOMPLETE,
  ERROR,
  NOTCONFIGURED,
  CONFIGURED,
  COUNTCONFIGURED,
  STANDARD,
  CUSTOM,
  SPECIFIC,
  RULE,
  ANY
}

export const STATUS_INTL_KEY = 'accordionRow.status';

export function classForStatus(status) {
  switch (status) {
  case NONE:
  case NOTCONFIGURED:
  case STANDARD:
  case ANY:
    return 'text-muted';
  case INCOMPLETE:
  case ERROR:
    return 'text-error';
  default:
    return 'text-success';
  }
}

export default Component.extend({
  scope:     service(),

  layout,
  classNames:   ['accordion'],

  name:         null,
  title:        null,
  detail:       null,
  status:       null,
  statusClass:  null,
  showStatue:   true,

  intent:       null,
  showExpand:   true,
  expandOnInit: false,

  expanded:     false,
  expandAll:    false,
  everExpanded: false,

  expand() {
  },

  expdObserver: on('init', observer('expanded', function() {
    if (get(this, 'expanded') && !get(this, 'intent')) {
      if (!get(this, 'everExpanded')) {
        set(this, 'everExpanded', true);
      }

      run.next(() => {
        if ( this.isDestroyed || this.isDestroying ) {
          return;
        }

        set(this, 'intent', get(this, 'componentName'));
      });
    }
  })),

  expandAllObserver: on('init', observer('expandAll', function() {
    var ea = get(this, 'expandAll');

    if (ea) {
      set(this, 'expanded', true);
    } else {
      set(this, 'expanded', false);
    }
  })),
  init() {
    this._super(...arguments);
    run.scheduleOnce('render', () => {
      let eoi = get(this, 'expandOnInit');

      if (eoi) {
        if (!get(this, 'everExpanded')) {
          set(this, 'everExpanded', true);
        }

        run.next(() => {
          if ( this.isDestroyed || this.isDestroying ) {
            return;
          }

          set(this, 'expanded', eoi);
        });
      }
    });
  },

  actions: {
    doExpand() {
      if ( get(this, 'showExpand') ) {
        this.expand(this);
      }
    },
  },

});
