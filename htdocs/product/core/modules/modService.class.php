<?php

/* Copyright (C) 2003      Rodolphe Quiedeville <rodolphe@quiedeville.org>
 * Copyright (C) 2004-2010 Laurent Destailleur  <eldy@users.sourceforge.net>
 * Copyright (C) 2004      Sebastien Di Cintio  <sdicintio@ressource-toi.org>
 * Copyright (C) 2004      Benoit Mortier       <benoit.mortier@opensides.be>
 * Copyright (C) 2005-2013 Regis Houssin        <regis.houssin@capnetworks.com>
 * Copyright (C) 2011-2013 Herve Prot           <herve.prot@symeos.com>
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
 *
 */

/**
 * 	\defgroup   service     Module services
 * 	\brief      Module pour gerer le suivi de services predefinis
 * 	\file       htdocs/core/modules/modService.class.php
 * 	\ingroup    service
 * 	\brief      Fichier de description et activation du module Service
 */
include_once DOL_DOCUMENT_ROOT . '/core/modules/DolibarrModules.class.php';

/**
 * 	Classe de description et activation du module Service
 */
class modService extends DolibarrModules {

	/**
	 *   Constructor.
	 */
	function __construct() {
		global $conf;

		parent::__construct();

		$this->numero = 53;

		$this->family = "products";
		// Module label (no space allowed), used if translation string 'ModuleXXXName' not found (where XXX is value of numeric property 'numero' of module)
		$this->name = preg_replace('/^mod/i', '', get_class($this));
		$this->description = "Gestion des services";

		// Possible values for version are: 'development', 'experimental', 'dolibarr' or version
		$this->version = 'speedealing';

		$this->const_name = 'MAIN_MODULE_' . strtoupper($this->name);
		$this->special = 0;
		$this->picto = 'service';

		// Data directories to create when module is enabled
		$this->dirs = array("/produit/temp");

		// Dependancies
		$this->depends = array();
		$this->requiredby = array("modContrat");

		// Config pages
		$this->config_page_url = array("product.php@product");
		$this->langfiles = array("products", "companies", "bills");

		// Constants
		$this->const = array();

		// Boxes
		$this->boxes = array();
		$this->boxes[0][1] = "box_services_contracts.php";

		// Permissions
		$this->rights = array();
		$this->rights_class = 'service';
		$r = 0;

		$this->rights[$r] = new stdClass();
		$this->rights[$r]->id = 531; // id de la permission
		$this->rights[$r]->desc = 'Lire les services'; // libelle de la permission
		$this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
		$this->rights[$r]->perm = array('lire');
		$r++;

		$this->rights[$r] = new stdClass();
		$this->rights[$r]->id = 532; // id de la permission
		$this->rights[$r]->desc = 'Creer/modifier les services'; // libelle de la permission
		$this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
		$this->rights[$r]->perm = array('creer');
		$r++;

		$this->rights[$r] = new stdClass();
		$this->rights[$r]->id = 534; // id de la permission
		$this->rights[$r]->desc = 'Supprimer les services'; // libelle de la permission
		$this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
		$this->rights[$r]->perm = array('supprimer');
		$r++;

		$this->rights[$r] = new stdClass();
		$this->rights[$r]->id = 538; // Must be same permission than in product module
		$this->rights[$r]->desc = 'Exporter les services';
		$this->rights[$r]->default = 0;
		$this->rights[$r]->perm = array('export');
		$r++;

		// Menus
		//--------
		$r = 0;
		$this->menus[$r] = new stdClass();
		$this->menus[$r]->_id = "menu:servicelist";
		$this->menus[$r]->url = "/product/list.php?type=SERVICE";
		$this->menus[$r]->langs = "products";
		$this->menus[$r]->position = 2;
		$this->menus[$r]->usertype = 2;
		$this->menus[$r]->perms = '$user->rights->service->lire';
		$this->menus[$r]->enabled = '$conf->service->enabled';
		$this->menus[$r]->title = "ListServices";
		$this->menus[$r]->fk_menu = "menu:products";
		$r++;

	}

	/**
	 * 		Function called when module is enabled.
	 * 		The init function add constants, boxes, permissions and menus (defined in constructor) into Dolibarr database.
	 * 		It also creates data directories
	 *
	 *      @param      string	$options    Options when enabling module ('', 'noboxes')
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
