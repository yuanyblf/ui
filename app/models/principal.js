import { equal } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Resource from 'ember-api-store/models/resource';
import C from 'ui/utils/constants';
import { get, computed } from '@ember/object'

var Principal = Resource.extend({
  intl: service(),

  isUser: equal('parsedExternalType', C.PROJECT.TYPE_USER),
  isTeam: equal('parsedExternalType', C.PROJECT.TYPE_TEAM),
  isOrg:  equal('parsedExternalType', C.PROJECT.TYPE_ORG),

  parsedExternalType: computed('id', function() {
    return get(this, 'id').split(':')
      .get('firstObject');
  }),

  avatarSrc: computed('isGithub', 'id', 'profilePicture', function() {
    if ( get(this, 'isGithub') && get(this, 'profilePicture') ) {
      return get(this, 'profilePicture');
    } else {
      let id = get(this, 'id') || 'Unknown';

      id = id.replace('local://', '');

      return `data:image/png;base64,${ new Identicon(AWS.util.crypto.md5(id, 'hex'), 80, 0.01).toString() }`;
    }
  }),

  isGithub: computed('parsedExternalType', function() {
    // console.log('is github?', get(this, 'provider'));
    return (get(this, 'provider') || '').toLowerCase() === 'github';
  }),

  logicalType: computed('parsedExternalType', function() {
    switch ( get(this, 'parsedExternalType') ) {
    case C.PROJECT.TYPE_ACTIVE_DIRECTORY_USER:
    case C.PROJECT.TYPE_AZURE_USER:
    case C.PROJECT.TYPE_FREEIPA_USER:
    case C.PROJECT.TYPE_GITHUB_USER:
    case C.PROJECT.TYPE_LDAP_USER:
    case C.PROJECT.TYPE_OPENLDAP_USER:
    case C.PROJECT.TYPE_PING_USER:
    case C.PROJECT.TYPE_RANCHER:
    case C.PROJECT.TYPE_SHIBBOLETH_USER:
      return C.PROJECT.PERSON;

    case C.PROJECT.TYPE_GITHUB_TEAM:
      return C.PROJECT.TEAM;

    case C.PROJECT.TYPE_ACTIVE_DIRECTORY_GROUP:
    case C.PROJECT.TYPE_AZURE_GROUP:
    case C.PROJECT.TYPE_FREEIPA_GROUP:
    case C.PROJECT.TYPE_GITHUB_ORG:
    case C.PROJECT.TYPE_LDAP_GROUP:
    case C.PROJECT.TYPE_OPENLDAP_GROUP:
    case C.PROJECT.TYPE_PING_GROUP:
    case C.PROJECT.TYPE_SHIBBOLETH_GROUP:
      return C.PROJECT.ORG;
    }
  }),

  logicalTypeSort: computed('logicalType', function() {
    switch (get(this, 'logicalType') ) {
    case C.PROJECT.ORG: return 1;
    case C.PROJECT.TEAM: return 2;
    case C.PROJECT.PERSON: return 3;
    default: return 4;
    }
  }),

  displayType: computed('parsedExternalType', 'intl.locale', function() {
    let key = 'model.identity.displayType.unknown';
    let type = get(this, 'parsedExternalType');

    switch ( type ) {
    case C.PROJECT.TYPE_ACTIVE_DIRECTORY_USER:
    case C.PROJECT.TYPE_AZURE_USER:
    case C.PROJECT.TYPE_FREEIPA_USER:
    case C.PROJECT.TYPE_GITHUB_USER:
    case C.PROJECT.TYPE_LDAP_USER:
    case C.PROJECT.TYPE_OPENLDAP_USER:
    case C.PROJECT.TYPE_PING_USER:
    case C.PROJECT.TYPE_SHIBBOLETH_USER:
      key = 'model.identity.displayType.user';
      break;

    case C.PROJECT.TYPE_ACTIVE_DIRECTORY_GROUP:
    case C.PROJECT.TYPE_AZURE_GROUP:
    case C.PROJECT.TYPE_FREEIPA_GROUP:
    case C.PROJECT.TYPE_LDAP_GROUP:
    case C.PROJECT.TYPE_OPENLDAP_GROUP:
    case C.PROJECT.TYPE_PING_GROUP:
    case C.PROJECT.TYPE_SHIBBOLETH_GROUP:
      key = 'model.identity.displayType.group';
      break;

    case C.PROJECT.TYPE_GITHUB_TEAM:
      key = 'model.identity.displayType.team';
      break;

    case C.PROJECT.TYPE_GITHUB_ORG:
      key = 'model.identity.displayType.org';
      break;

    case C.PROJECT.TYPE_RANCHER:
      key = 'model.identity.displayType.localUser';
      break;
    }

    return get(this, 'intl').t(key, { type });
  }),
});

Principal.reopenClass({
  mangleIn(data/* , store */) {
    if ( data.displayName ) {
      // set to name then delete
      data.name = data.displayName;
      delete data.displayName;
    }

    return data;
  },
});

export default Principal;
