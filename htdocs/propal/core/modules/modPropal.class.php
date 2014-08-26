<?php

/* Copyright (C) 2003-2004	Rodolphe Quiedeville	<rodolphe@quiedeville.org>
 * Copyright (C) 2004-2010	Laurent Destailleur		<eldy@users.sourceforge.net>
 * Copyright (C) 2004		Sebastien Di Cintio		<sdicintio@ressource-toi.org>
 * Copyright (C) 2004		Benoit Mortier			<benoit.mortier@opensides.be>
 * Copyright (C) 2005-2011	Regis Houssin			<regis.houssin@capnetworks.com>
 * Copyright (C) 2012		Juanjo Menent			<jmenent@2byte.es>
 * Copyright (C) 2011-2013	Herve Prot				<herve.prot@symeos.com>
 * Copyright (C) 2012		David Moothen			<dmoothen@websitti.fr>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

include_once DOL_DOCUMENT_ROOT . '/core/modules/DolibarrModules.class.php';

/**
 * 	Classe de description et activation du module Propale
 */
class modPropal extends DolibarrModules {

    /**
     *   Constructor.
     */
    function __construct() {
        parent::__construct();

        $this->numero = 20;

        $this->family = "crm";
        // Module label (no space allowed), used if translation string 'ModuleXXXName' not found (where XXX is value of numeric property 'numero' of module)
        $this->name = preg_replace('/^mod/i', '', get_class($this));
        $this->description = "Gestion des propositions commerciales";

        // Possible values for version are: 'development', 'experimental', 'dolibarr' or version
        $this->version = 'speedealing';

        $this->const_name = 'MAIN_MODULE_' . strtoupper($this->name);
        $this->special = 0;
        $this->picto = 'propal';

        // Data directories to create when module is enabled
        $this->dirs = array("/propal/temp");

        // Dependancies
        $this->depends = array("modSociete");
        $this->requiredby = array();
        $this->config_page_url = array("propal.php@propal");
        $this->langfiles = array("propal", "bills", "companies", "deliveries", "products");

        // Constants
        $this->const = array();
        $r = 0;

        $this->const[$r][0] = "PROPALE_ADDON_PDF";
        $this->const[$r][1] = "chaine";
        $this->const[$r][2] = "azur";
        $this->const[$r][3] = 'Nom du gestionnaire de generation des propales en PDF';
        $this->const[$r][4] = 0;
        $r++;

        $this->const[$r][0] = "PROPALE_ADDON";
        $this->const[$r][1] = "chaine";
        $this->const[$r][2] = "mod_propale_marbre";
        $this->const[$r][3] = 'Nom du gestionnaire de numerotation des propales';
        $this->const[$r][4] = 0;
        $r++;

        $this->const[$r][0] = "PROPALE_VALIDITY_DURATION";
        $this->const[$r][1] = "chaine";
        $this->const[$r][2] = "15";
        $this->const[$r][3] = 'Duration of validity of business proposals';
        $this->const[$r][4] = 0;
        $r++;

        $this->const[$r][0] = "PROPALE_ADDON_PDF_ODT_PATH";
        $this->const[$r][1] = "chaine";
        $this->const[$r][2] = "DOL_DATA_ROOT/doctemplates/proposals";
        $this->const[$r][3] = "";
        $this->const[$r][4] = 0;

        // Boxes
        $this->boxes = array();
        $this->boxes[0][1] = "box_propales.php@propal";

        // Permissions
        $this->rights = array();
        $this->rights_class = 'propal';
        $r = 0;

		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 21; // id de la permission
        $this->rights[$r]->desc = 'Lire les propositions commerciales'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('lire');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 22; // id de la permission
        $this->rights[$r]->desc = 'Creer/modifier les propositions commerciales'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('creer');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 24; // id de la permission
        $this->rights[$r]->desc = 'Valider les propositions commerciales'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('valider');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 25; // id de la permission
        $this->rights[$r]->desc = 'Envoyer les propositions commerciales aux clients'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('propal_advance', 'send');
//        $this->rights[$r][5] = 'send';

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 26; // id de la permission
        $this->rights[$r]->desc = 'Cloturer les propositions commerciales'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('cloturer');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 27; // id de la permission
        $this->rights[$r]->desc = 'Supprimer les propositions commerciales'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('supprimer');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 28; // id de la permission
        $this->rights[$r]->desc = 'Exporter les propositions commerciales et attributs'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('export');

        // Main menu entries
        $this->menu = array();   // List of menus to add
        $r = 0;

		$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:propals";
        $this->menus[$r]->type = "top";
        $this->menus[$r]->position = 40;
        $this->menus[$r]->langs = "propal";
        $this->menus[$r]->perms = '$user->rights->propal->lire';
        $this->menus[$r]->enabled = '$conf->propal->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "Proposals";
        $r++;

		$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:newpropal";
        $this->menus[$r]->position = 0;
        $this->menus[$r]->url = "/propal/addpropal.php?action=create";
        $this->menus[$r]->langs = "propal";
        $this->menus[$r]->perms = '$user->rights->propal->creer';
        $this->menus[$r]->enabled = '$conf->propal->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "NewPropal";
        $this->menus[$r]->fk_menu = "menu:propals";
        $r++;

		$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:propalslist";
        $this->menus[$r]->position = 1;
        $this->menus[$r]->url = "/propal/list.php";
        $this->menus[$r]->langs = "propal";
        $this->menus[$r]->perms = '$user->rights->propal->lire';
        $this->menus[$r]->enabled = '$conf->propal->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "List";
        $this->menus[$r]->fk_menu = "menu:propals";
        $r++;

		$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:propalsstats";
        $this->menus[$r]->position = 2;
        $this->menus[$r]->url = "/propal/stats/index.php";
        $this->menus[$r]->langs = "propal";
        $this->menus[$r]->perms = '$user->rights->propal->lire';
        $this->menus[$r]->enabled = '$conf->propal->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "Statistics";
        $this->menus[$r]->fk_menu = "menu:propals";
        $r++;

    }

    /**
     * 		Function called when module is enabled.
     * 		The init function add constants, boxes, permissions and menus (defined in constructor) into Dolibarr database.
     * 		It also creates data directories
     *
     *      @return     int             	1 if OK, 0 if KO
     */
    function init() {
        return $this->_init();
    }

    /**
     * 		Function called when module is disabled.
     *      Remove from database constants, boxes and permissions from Dolibarr database.
     * 		Data directories are not deleted
     *
     *      @return     int             	1 if OK, 0 if KO
     */
    function remove() {
        return $this->_remove();
    }

}

?>
