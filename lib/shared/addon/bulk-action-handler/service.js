import Service, { inject as service } from '@ember/service';
import { downloadResourceYaml } from 'shared/utils/download-files';

export default Service.extend({
  modalService: service('modal'),
  app:          service(),
  promptStop(nodes) {

    this.get('modalService').toggleModal('modal-container-stop', { model: nodes });

  },

  promptEvacuate(nodes) {

    this.get('modalService').toggleModal('modal-host-evacuate', { model: nodes });

  },

  promptDelete(nodes) {

    this.get('modalService').toggleModal('confirm-delete', { resources: nodes });

  },

  move(nodes) {

    this.get('modalService').toggleModal('modal-move-namespace', nodes);

  },

  downloadYaml(nodes){

    downloadResourceYaml(nodes);

  }
});
