<?php

/* Copyright (C) 2003      Rodolphe Quiedeville <rodolphe@quiedeville.org>
 * Copyright (C) 2004-2010 Laurent Destailleur  <eldy@users.sourceforge.net>
 * Copyright (C) 2011-2012 Herve Prot           <herve.prot@symeos.com>
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

/**     \defgroup   ecm		Module ecm
 *      \brief      Module for ECM (Electronic Content Management)
 *      \file       htdocs/core/modules/modECM.class.php
 *      \ingroup    ecm
 *      \brief      Description and activation file for module ECM
 */
include_once DOL_DOCUMENT_ROOT . '/core/modules/DolibarrModules.class.php';

/**
 * 	Description and activation class for module ECM
 */
class modEcm extends DolibarrModules {

	/**
	 *   Constructor. Define names, constants, directories, boxes, permissions
	 *
	 *   @param      DoliDB		$db      Database handler
	 */
	function __construct() {
		parent::__construct();

		// Id for module (must be unique).
		// Use here a free id.
		$this->numero = 2500;

		// Family can be 'crm','financial','hr','projects','product','ecm','technic','other'
		// It is used to sort modules in module setup page
		$this->family = "ecm";
		// Module label (no space allowed), used if translation string 'ModuleXXXName' not found (where XXX is value of numeric property 'numero' of module)
		$this->name = preg_replace('/^mod/i', '', get_class($this));
		// Module description used if translation string 'ModuleXXXDesc' not found (XXX is id value)
		$this->description = "Electronic Content Management";
		// Possible values for version are: 'development', 'experimental', 'dolibarr' or version
		$this->version = '0.1.01';
		// Key used in llx_const table to save module status enabled/disabled (XXX is id value)
		$this->const_name = 'MAIN_MODULE_' . strtoupper($this->name);
		// Where to store the module in setup page (0=common,1=interface,2=other)
		$this->special = 0;
		// Name of png file (without png) used for this module
		$this->picto = 'dir';

		// Data directories to create when module is enabled
		$this->dirs = array("/ecm/temp");

		// Config pages. Put here list of php page names stored in admmin directory used to setup module
		$this->config_page_url = array();

		// Dependencies
		$this->depends = array();  // List of modules id that must be enabled if this module is enabled
		$this->requiredby = array(); // List of modules id to disable if this one is disabled
		// Constants
		$this->const = array();   // List of parameters
		// Boxes
		$this->boxes = array();   // List of boxes
		$r = 0;

		// Add here list of php file(s) stored in core/boxes that contains class to show a box.
		// Example:
		//$this->boxes[$r][1] = "myboxa.php";
		//$r++;
		//$this->boxes[$r][1] = "myboxb.php";
		//$r++;
		// Permissions
		$this->rights_class = 'ecm'; // Permission key
		$this->rights = array();  // Permission array used by this module
		$r = 0;
		$this->rights[$r] = new stdClass();
		$this->rights[$r]->id = 2501;
		$this->rights[$r]->desc = 'Consulter/Télécharger les documents';
		$this->rights[$r]->default = 1;
		$this->rights[$r]->perm = array('read');
		$r++;
		$this->rights[$r] = new stdClass();
		$this->rights[$r]->id = 2503;
		$this->rights[$r]->desc = 'Soumettre ou supprimer des documents';
		$this->rights[$r]->default = 1;
		$this->rights[$r]->perm = array('upload');
		$r++;
		$this->rights[$r] = new stdClass();
		$this->rights[$r]->id = 2515;
		$this->rights[$r]->desc = 'Administrer les rubriques de documents';
		$this->rights[$r]->default = 1;
		$this->rights[$r]->perm = array('setup');

		// Menus
		//------
		$this->menus = array();   // List of menus to add
		$r = 0;

		// Top menu
		$this->menus[$r] = new stdClass();
		$this->menus[$r]->_id = "menu:ecm";
		$this->menus[$r]->type = "top";
		$this->menus[$r]->position = 100;
		$this->menus[$r]->langs = "ecm";
		$this->menus[$r]->perms = '$user->rights->ecm->read || $user->rights->ecm->upload || $user->rights->ecm->setup';
		$this->menus[$r]->enabled = '$conf->ecm->enabled';
		$this->menus[$r]->usertype = 2;
		$this->menus[$r]->title = "MenuECM";

		$r++;

		// Left menu linked to top menu
		$this->menus[$r] = new stdClass();
		$this->menus[$r]->_id = "menu:ecmarea";
		$this->menus[$r]->position = 101;
		$this->menus[$r]->url = "/ecm/index.php";
		$this->menus[$r]->langs = "ecm";
		$this->menus[$r]->perms = '$user->rights->ecm->read || $user->rights->ecm->upload';
		$this->menus[$r]->enabled = '$conf->ecm->enabled';
		$this->menus[$r]->usertype = 2;
		$this->menus[$r]->title = "ECMArea";
		$this->menus[$r]->fk_menu = "menu:ecm";
		$r++;
		$this->menus[$r] = new stdClass();
		$this->menus[$r]->_id = "menu:ecmnew";
		$this->menus[$r]->position = 102;
		$this->menus[$r]->url = "/ecm/docdir.php?action=create";
		$this->menus[$r]->langs = "ecm";
		$this->menus[$r]->perms = '$user->rights->ecm->setup';
		$this->menus[$r]->enabled = '$conf->ecm->enabled';
		$this->menus[$r]->usertype = 2;
		$this->menus[$r]->title = "ECMNewSection";
		$this->menus[$r]->fk_menu = "menu:ecm";
		$r++;
		$this->menus[$r] = new stdClass();
		$this->menus[$r]->_id = "menu:ecmfilemanager";
		$this->menus[$r]->position = 103;
		$this->menus[$r]->url = "/ecm/index.php?action=file_manager";
		$this->menus[$r]->langs = "ecm";
		$this->menus[$r]->perms = '$user->rights->ecm->read || $user->rights->ecm->upload';
		$this->menus[$r]->enabled = '$conf->ecm->enabled';
		$this->menus[$r]->usertype = 2;
		$this->menus[$r]->title = "ECMFileManager";
		$this->menus[$r]->fk_menu = "menu:ecm";
		$r++;
		$this->menus[$r] = new stdClass();
		$this->menus[$r]->_id = "menu:ecmsearch";
		$this->menus[$r]->position = 104;
		$this->menus[$r]->url = "/ecm/search.php";
		$this->menus[$r]->langs = "ecm";
		$this->menus[$r]->perms = '$user->rights->ecm->read';
		$this->menus[$r]->enabled = '$conf->ecm->enabled';
		$this->menus[$r]->usertype = 2;
		$this->menus[$r]->title = "Search";
		$this->menus[$r]->fk_menu = "menu:ecm";
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
	function init($options = '') {
		$sql = array();

		return $this->_init($sql, $options);
	}

	/**
	 * 		Function called when module is disabled.
	 *      Remove from database constants, boxes and permissions from Dolibarr database.
	 * 		Data directories are not deleted
	 *
	 *      @param      string	$options    Options when enabling module ('', 'noboxes')
	 *      @return     int             	1 if OK, 0 if KO
	 */
	function remove($options = '') {
		$sql = array();

		return $this->_remove($sql, $options);
	}

}

?>
