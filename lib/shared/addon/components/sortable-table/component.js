import { or, alias } from '@ember/object/computed';
import { compare } from '@ember/utils';
import Component from '@ember/component';
import Sortable from 'shared/mixins/sortable-base';
import StickyHeader from 'shared/mixins/sticky-table-header';
import layout from './template';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
import { computed } from '@ember/object';
import { defineProperty, get, set } from '@ember/object';
import { inject as service } from '@ember/service'
import { isArray } from '@ember/array';
import { observer } from '@ember/object'
import { run } from '@ember/runloop';
import { isAlternate, isMore, isRange } from 'shared/utils/platform';

function toggleInput(node, on) {
  let id = get(node, 'id');

  if ( id ) {
    let input = $(`input[nodeid="${id}"]`); // eslint-disable-line

    if ( input && input.length ) {
      // can't reuse the input ref here because the table has rerenderd and the ref is no longer good
      $(`input[nodeid="${id}"]`).prop('checked', on); // eslint-disable-line

      let tr    = $(`input[nodeid="${id}"]`).closest('tr'); // eslint-disable-line
      let first = true;

      while ( tr && (first || tr.hasClass('sub-row') ) ) {
        tr.toggleClass('row-selected', on);
        tr    = tr.next();
        first = false;
      }
    }
  }
}
export function matches(fields, token, item) {
  let tokenMayBeIp = /^[0-9a-f\.:]+$/i.test(token);

  for ( let i = 0 ; i < fields.length ; i++ ) {
    let field = fields[i];

    if ( field ) {
      // Modifiers:
      //  id: The token must match id format (i.e. 1i123)
      let idx = field.indexOf(':');
      let modifier = null;

      if ( idx > 0 ) {
        modifier = field.substr(idx + 1);
        field = field.substr(0, idx);
      }

      let val = get(item, field);

      if ( val === undefined ) {
        continue;
      }

      val = (`${ val }`).toLowerCase();
      if ( !val ) {
        continue;
      }

      switch ( modifier ) {
      case 'exact':
        if ( val === token ) {
          return true;
        }
        break;

      case 'ip':
        if ( tokenMayBeIp ) {
          let re = new RegExp(`(?:^|\.)${  token  }(?:\.|$)`);

          if ( re.test(val) ) {
            return true;
          }
        }
        break;

      case 'prefix':
        if ( val.indexOf(token) === 0) {
          return true;
        }
        break;

      default:
        if ( val.indexOf(token) >= 0) {
          return true;
        }
      }
    }
  }

  return false;
}

export default Component.extend(Sortable, StickyHeader, {
  prefs:             service(),
  intl:              service(),
  bulkActionHandler: service(),

  layout,
  body:                 null,
  groupByKey:           null,
  groupByRef:           null,
  groupedSortBy:        null,
  preSorts:             null,
  sortBy:               null,
  descending:           false,
  headers:              null,
  extraSearchFields:    null,
  extraSearchSubFields: null,
  prefix:               false,
  suffix:               false,
  bulkActions:          true,
  rowActions:           true,
  search:               true,
  searchToWormhole:     null,
  paging:               true,
  subRows:              false,
  checkWidth:           40,
  actionsWidth:         40,
  sortGroupedFirst:     false,

  availableActions:  null,
  selectedNodes:     null,
  prevNode:          null,
  searchText:        null,
  isVisible:         true,
  page:              1,
  pagingLabel:       'pagination.generic',

  showHeader: or('bulkActions', 'searchInPlace'),

  // -----
  sortableContent:     alias('body'),
  init() {
    this._super(...arguments);

    this.set('selectedNodes', []);
    if (this.get('bulkActions')) {
      this.actionsChanged();
    }

    if ( this.get('bulkActions') ) {
      run.schedule('afterRender', () => {
        let table = $(this.element).find('> TABLE'); // eslint-disable-line
        let self = this; // need this context in click function and can't use arrow func there

        table.on('click', '> TBODY > TR', (e) => {
          self.rowClick(e);
        });

        table.on('mousedown', '> TBODY > TR', (e) => {
          if ( isRange(e) || e.target.tagName === 'INPUT') {
            e.preventDefault();
          }
        });
      });
    }

    let watchKey = 'pagedContent.[]';

    if ( this.get('groupByKey') ) {
      watchKey = `pagedContent.@each.${ this.get('groupByKey').replace(/\..*/g, '') }`;
    }

    defineProperty(this, 'groupedContent', computed(watchKey, () => {
      let ary = [];
      let map = {};

      let groupKey = this.get('groupByKey');
      let refKey = this.get('groupByRef');

      this.get('pagedContent').forEach((obj) => {
        let group = obj.get(groupKey) || '';
        let ref = obj.get(refKey);
        let entry = map[group];

        if ( entry ) {
          entry.items.push(obj);
        } else {
          entry = {
            group,
            ref,
            items: [obj]
          };
          map[group] = entry;
          ary.push(entry);
        }
        if ( get(this, 'selectedNodes').includes(obj) ) {
          run.next(this, () => {
            toggleInput(obj, true);
          });
        }
      });

      if (get(this, 'sortGroupedFirst')) {
        const groupedSortBy = get(this, 'groupedSortBy');
        const sortBy = groupedSortBy ? `ref.${ groupedSortBy }` : 'group';

        ary = ary.sort((a, b) => {
          const aValue = get(a, sortBy);
          const bValue = get(b, sortBy);

          return ( !aValue - !bValue ) || compare(aValue, bValue);
        });
      }

      return ary;
    }));
  },

  didReceiveAttrs() {
    this._super(...arguments);
    if (this.get('isVisible')) {
      this.triggerResize();
    }
  },

  actions: {
    clearSearch() {
      this.set('searchText', '');
    },

    executeBulkAction(name, e) {
      e.preventDefault();
      let handler = this.get('bulkActionHandler');
      let nodes = this.get('selectedNodes');

      if (isAlternate(e)) {
        var available = this.get('availableActions');
        var action = available.findBy('action', name);
        let alt = get(action, 'altAction');

        if ( alt ) {
          name = alt;
        }
      }

      if ( typeof handler[name] === 'function' ) {
        this.get('bulkActionHandler')[name](nodes);
      } else {
        nodes.forEach((node) => {
          node.send(name);
        });
      }
    },

    executeAction(action) {
      var node = this.get('selectedNodes')[0];

      node.send(action);
    },
  },

  // Pick a new sort if the current column disappears.
  headersChanged: observer('headers.@each.name', function() {
    let sortBy = this.get('sortBy');
    let headers = this.get('headers') || [];

    if ( headers && headers.get('length') ) {
      let cur = headers.findBy('name', sortBy);

      if ( !cur ) {
        run.next(this, function() {
          this.send('changeSort', headers.get('firstObject.name'));
        });
      }
    }
  }),

  pagedContentChanged: observer('pagedContent.[]', function() {
    this.cleanupOrphans();
  }),

  pageCountChanged: observer('indexFrom', 'filtered.length', function() {
    // Go to the last page if we end up past the last page
    let from = this.get('indexFrom');
    let last = this.get('filtered.length');
    var perPage = this.get('perPage');

    if ( this.get('page') > 1 && from > last) {
      let page = Math.ceil(last / perPage);

      this.set('page', page);
    }
  }),

  sortKeyChanged: observer('sortBy', function() {
    this.set('page', 1);
  }),

  actionsChanged: observer('selectedNodes.@each._availableActions', 'pagedContent.@each._availableActions', function() {
    if (!this.get('bulkActions')) {
      return;
    }

    let nodes = this.get('selectedNodes');
    let disableAll = false;

    if ( !nodes.length ) {
      disableAll = true;
      let firstNode = this.get('pagedContent.firstObject');

      if ( firstNode ) {
        nodes = [firstNode];
      }
    }

    const map = {};

    get(this, 'pagedContent').forEach((node) => {
      get(node, '_availableActions').forEach((act) => {
        if ( !act.bulkable ) {
          return;
        }

        let obj = map[act.action];

        if ( !obj ) {
          obj = $().extend(true, {}, act);// eslint-disable-line
          map[act.action] = obj;
        }

        if ( act.enabled !== false ) {
          obj.anyEnabled = true;
        }
      });
    });

    nodes.forEach((node) => {
      get(node, '_availableActions').forEach((act) => {
        if ( !act.bulkable ) {
          return;
        }

        let obj = map[act.action];

        if ( !obj ) {
          obj = $().extend(true, {}, act); // eslint-disable-line
          map[act.action] = obj;
        }

        obj.available = (obj.available || 0) + (act.enabled === false ? 0 : 1 );
        obj.total = (obj.total || 0) + 1;
      })
    });

    let out = Object.values(map).filterBy('anyEnabled', true);

    if ( disableAll ) {
      out.forEach((x) => {
        set(x, 'enabled', false);
      });
    } else {
      out.forEach((x) => {
        if ( x.available < x.total ) {
          set(x, 'enabled', false);
        } else {
          set(x, 'enabled', true);
        }
      });
    }

    this.set('availableActions', out);
  }),
  searchInPlace:   computed('search', 'searchToWormhole', function() {
    return get(this, 'search') && !get(this, 'searchToWormhole');
  }),

  perPage: computed('paging', 'prefs.tablePerPage', function() {
    if ( this.get('paging') ) {
      return this.get('prefs.tablePerPage');
    } else {
      return 100000;
    }
  }),

  // hide bulckActions if content is empty.
  internalBulkActions: function(){
    let bulkActions = this.get('bulkActions');

    if (bulkActions){
      let sortableContent = this.get('sortableContent');

      return !!sortableContent.get('length');
    } else {
      return false;
    }
  }.property('bulkActions', 'sortableContent.[]'),
  // Flow: body [-> sortableContent] -> arranged -> filtered -> pagedContent [-> groupedContent]
  pagedContent: pagedArray('filtered', {
    page:    alias('parent.page'),
    perPage: alias('parent.perPage')
  }),

  // For data-title properties on <td>s
  dt: computed('headers.@each.{name,label,translationKey}', 'intl.locale', function() {
    let intl = this.get('intl');
    let out = {
      select:  `${ intl.t('generic.select')  }: `,
      actions: `${ intl.t('generic.actions')  }: `,
    };

    this.get('headers').forEach((header) => {
      let name = get(header, 'name');
      let dtKey = get(header, 'dtTranslationKey');
      let key = get(header, 'translationKey');

      if ( dtKey ) {
        out[name] = `${ intl.t(dtKey)  }: `;
      } else if ( key ) {
        out[name] = `${ intl.t(key)  }: `;
      } else {
        out[name] = `${ get(header, 'label') || name  }: `;
      }
    });

    return out;
  }),

  // Table content
  fullColspan: computed('headers.length', 'bulkActions', 'rowActions', function() {
    return (this.get('headers.length') || 0) + (this.get('bulkActions') ? 1 : 0 ) + (this.get('rowActions') ? 1 : 0);
  }),

  // -----
  searchFields: computed('headers.@each.{searchField,name}', 'extraSearchFields.[]', function() {
    let out = headersToSearchField(this.get('headers'));

    return out.addObjects(this.get('extraSearchFields') || []);
  }),

  subFields: computed('subHeaders.@each.{searchField,name}', 'extraSearchSubFields.[]', function() {
    let out = headersToSearchField(this.get('subHeaders'));

    return out.addObjects(this.get('extraSearchSubFields') || []);
  }),

  filtered: computed('arranged.[]', 'searchText', function() {
    let out = this.get('arranged').slice();
    let searchFields = this.get('searchFields');
    let searchText =  (this.get('searchText') || '').trim().toLowerCase();
    let subSearchField = this.get('subSearchField');
    let subFields = this.get('subFields');
    let subMatches = null;

    if ( searchText.length ) {
      subMatches = {};
      let searchTokens = searchText.split(/\s*[, ]\s*/);

      for ( let i = out.length - 1 ; i >= 0 ; i-- ) {
        let hits = 0;
        let row = out[i];
        let mainFound = true;

        for ( let j = 0 ; j < searchTokens.length ; j++ ) {
          let expect = true;
          let token = searchTokens[j];

          if ( token.substr(0, 1) === '!' ) {
            expect = false;
            token = token.substr(1);
          }

          if ( token && matches(searchFields, token, row) !== expect ) {
            mainFound = false;
            break;
          }
        }

        if ( subFields && subSearchField) {
          let subRows = (row.get(subSearchField) || []);

          for ( let k = subRows.length - 1 ; k >= 0 ; k-- ) {
            let subFound = true;

            for ( let l = 0 ; l < searchTokens.length ; l++ ) {
              let expect = true;
              let token = searchTokens[l];

              if ( token.substr(0, 1) === '!' ) {
                expect = false;
                token = token.substr(1);
              }

              if ( matches(subFields, token, subRows[k]) !== expect ) {
                subFound = false;
                break;
              }
            }

            if ( subFound ) {
              hits++;
            }
          }

          subMatches[row.get('id')] = hits;
        }

        if ( !mainFound && hits === 0 ) {
          out.removeAt(i);
        }
      }
    }

    this.set('subMatches', subMatches);

    return out;
  }),

  indexFrom: computed('page', 'perPage', function() {
    var current =  this.get('page');
    var perPage =  this.get('perPage');

    return Math.max(0, 1 + perPage * (current - 1));
  }),

  indexTo: computed('indexFrom', 'perPage', 'filtered.length', function() {
    return Math.min(this.get('filtered.length'), this.get('indexFrom') + this.get('perPage') - 1);
  }),

  pageCountContent: computed('indexFrom', 'indexTo', 'pagedContent.totalPages', function() {
    let from = this.get('indexFrom') || 0;
    let to = this.get('indexTo') || 0;
    let count = this.get('filtered.length') || 0;
    let pages = this.get('pagedContent.totalPages') || 0;
    let out = '';

    if ( pages <= 1 ) {
      out = `${ count } Item${  count === 1 ? '' : 's' }`;
    } else {
      out = `${ from } - ${ to } of ${ count }`;
    }

    return out;
  }),

  isAll: computed('selectedNodes.length', 'pagedContent.length', {
    get() {
      return this.get('selectedNodes.length') === this.get('pagedContent.length');
    },

    set(key, value) {
      var content = this.get('pagedContent');

      if ( value ) {
        this.toggleMulti(content, []);

        return true;
      } else {
        this.toggleMulti([], content);

        return false;
      }
    }
  }),

  cleanupOrphans() {
    // Remove selected items not in the current content
    let content = this.get('pagedContent');
    let nodesToAdd = [];
    let nodesToRemove = [];

    this.get('selectedNodes').forEach((node) => {
      if ( content.includes(node) ) {
        nodesToAdd.push(node);
      } else {
        nodesToRemove.push(node);
      }
    });

    this.toggleMulti(nodesToAdd, nodesToRemove);
  },

  // ------
  // Clicking
  // ------
  rowClick(e) {
    let tagName = e.target.tagName;
    let tgt = $(e.target); // eslint-disable-line

    if ( tagName === 'A'  || tagName === 'BUTTON' || tgt.parents('.btn').length || typeof tgt.data('ember-action') !== 'undefined' || tgt.hasClass('copy-btn') ) {
      return;
    }

    let content = this.get('pagedContent');
    let selection = this.get('selectedNodes');
    let isCheckbox = tagName === 'INPUT' || tgt.hasClass('row-check');
    let tgtRow = $(e.currentTarget); // eslint-disable-line

    if ( tgtRow.hasClass('separator-row') || tgt.hasClass('select-all-check')) {
      return;
    }

    while ( tgtRow && tgtRow.length && !tgtRow.hasClass('main-row') ) {
      tgtRow = tgtRow.prev();
    }

    if ( !tgtRow || !tgtRow.length ) {
      return;
    }

    let nodeId = tgtRow.find('input[type="checkbox"]').attr('nodeid');

    if ( !nodeId ) {
      return;
    }

    let node = content.findBy('id', nodeId);

    if ( !node ) {
      return;
    }

    let isSelected = selection.includes(node);
    let prevNode = this.get('prevNode');

    // PrevNode is only valid if it's in the current content
    if ( !prevNode || !content.includes(prevNode) ) {
      prevNode = node;
    }

    if ( isMore(e) ) {
      this.toggleSingle(node);
    } else if ( isRange(e) ) {
      let toToggle = this.nodesBetween(prevNode, node);

      if ( isSelected ) {
        this.toggleMulti([], toToggle);
      } else {
        this.toggleMulti(toToggle, []);
      }
    } else if ( isCheckbox ) {
      this.toggleSingle(node);
    } else {
      this.toggleMulti([node], content);
    }

    this.set('prevNode', node);
  },

  nodesBetween(a, b) {
    let toToggle = [];
    let key = this.get('groupByKey');

    if ( key ) {
      // Grouped has 2 levels to look through
      let grouped = this.get('groupedContent');

      let from = this.groupIdx(a);
      let to =  this.groupIdx(b);

      if ( !from || !to ) {
        return [];
      }

      // From has to come before To
      if ( (from.group > to.group) || ((from.group === to.group) && (from.item > to.item)) ) {
        [from, to] = [to, from];
      }

      for ( let i = from.group ; i <= to.group ; i++ ) {
        let items = grouped.objectAt(i).items;
        let j = (from.group === i ? from.item : 0);

        while ( items[j] && ( i < to.group || j <= to.item )) {
          toToggle.push(items[j]);
          j++;
        }
      }
    } else {
      // Ungrouped is much simpler
      let content = this.get('pagedContent');
      let from = content.indexOf(a);
      let to = content.indexOf(b);

      [from, to] = [Math.min(from, to), Math.max(from, to)];
      toToggle = content.slice(from, to + 1);
    }

    return toToggle;
  },

  groupIdx(node) {
    let grouped = this.get('groupedContent');

    for ( let i = 0 ; i < grouped.get('length') ; i++ ) {
      let items = grouped.objectAt(i).items;

      for ( let j = 0 ; j < items.get('length') ; j++ ) {
        if ( items.objectAt(j) === node ) {
          return {
            group: i,
            item:  j
          };
        }
      }
    }

    return null;
  },

  toggleSingle(node) {
    let selectedNodes = this.get('selectedNodes');

    if ( selectedNodes.includes(node) ) {
      this.toggleMulti([], [node]);
    } else {
      this.toggleMulti([node], []);
    }
  },

  toggleMulti(nodesToAdd, nodesToRemove) {
    let selectedNodes = this.get('selectedNodes');

    if (nodesToRemove.length) {
      // removeObjects doesn't use ArrayProxy-safe looping
      if ( typeof nodesToRemove.toArray === 'function' ) {
        nodesToRemove = nodesToRemove.toArray();
      }
      selectedNodes.removeObjects(nodesToRemove);
      toggle(nodesToRemove, false);
    }

    if (nodesToAdd.length) {
      selectedNodes.addObjects(nodesToAdd);
      toggle(nodesToAdd, true);
    }

    function toggle(nodes, on) {
      run.next(() => {
        nodes.forEach((node) => {
          toggleInput(node, on);
        });
      });
    }
  },

});

function headersToSearchField(headers) {
  let out = [];

  (headers || []).forEach((header) => {
    let field = get(header, 'searchField');

    if ( field ) {
      if ( typeof field === 'string' ) {
        out.addObject(field);
      } else if ( isArray(field) ) {
        out.addObjects(field);
      }
    } else if ( field === false ) {
      // Don't add the name
    } else {
      out.addObject(get(header, 'name'));
    }
  });

  return out.filter((x) => !!x);
}
