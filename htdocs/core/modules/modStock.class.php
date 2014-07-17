<?php
/* Copyright (C) 2003-2006 Rodolphe Quiedeville <rodolphe@quiedeville.org>
 * Copyright (C) 2004-2008 Laurent Destailleur  <eldy@users.sourceforge.net>
 * Copyright (C) 2005-2009 Regis Houssin        <regis.houssin@capnetworks.com>
 * Copyright (C) 2012	   Juanjo Menent        <jmenent@2byte.es>
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

/**
 *	\defgroup   	stock     Module stocks
 *	\brief      	Module pour gerer la tenue de stocks produits
 *	\file       htdocs/core/modules/modStock.class.php
 *	\ingroup    stock
 *	\brief      Fichier de description et activation du module Stock
 */

include_once DOL_DOCUMENT_ROOT .'/core/modules/DolibarrModules.class.php';


/**
 *	Classe de description et activation du module Stock
 */
class modStock extends DolibarrModules
{

	/**
	 *   Constructor. Define names, constants, directories, boxes, permissions
	 *
	 *   @param      DoliDB		$db      Database handler
	 */
	function __construct($db = '')
	{
		global $conf;

		parent::__construct($db);

		$this->numero = 52;

		$this->family = "products";
		// Module label (no space allowed), used if translation string 'ModuleXXXName' not found (where XXX is value of numeric property 'numero' of module)
		$this->name = preg_replace('/^mod/i','',get_class($this));
		$this->description = "Gestion des stocks";

		// Possible values for version are: 'development', 'experimental', 'dolibarr' or version
		$this->version = 'dolibarr';

		$this->const_name = 'MAIN_MODULE_'.strtoupper($this->name);
		$this->special = 0;
		$this->picto='stock';

		// Data directories to create when module is enabled
		$this->dirs = array();

		$this->config_page_url = array("stock.php");

		// Dependencies
		$this->depends = array("modProduct");
		$this->requiredby = array();
		$this->langfiles = array("stocks");

		// Constants
		$this->const = array();

		// Boxes
		$this->boxes = array();

		// Permissions
		$this->rights = array();
		$this->rights_class = 'stock';

		$this->rights[0][0] = 1001;
		$this->rights[0][1] = 'Lire les stocks';
		$this->rights[0][2] = 'r';
		$this->rights[0][3] = 1;
		$this->rights[0][4] = 'lire';
		$this->rights[0][5] = '';

		$this->rights[1][0] = 1002;
		$this->rights[1][1] = 'Creer/Modifier les stocks';
		$this->rights[1][2] = 'w';
		$this->rights[1][3] = 0;
		$this->rights[1][4] = 'creer';
		$this->rights[1][5] = '';

		$this->rights[2][0] = 1003;
		$this->rights[2][1] = 'Supprimer les stocks';
		$this->rights[2][2] = 'd';
		$this->rights[2][3] = 0;
		$this->rights[2][4] = 'supprimer';
		$this->rights[2][5] = '';

		$this->rights[3][0] = 1004;
		$this->rights[3][1] = 'Lire mouvements de stocks';
		$this->rights[3][2] = 'r';
		$this->rights[3][3] = 1;
		$this->rights[3][4] = 'mouvement';
		$this->rights[3][5] = 'lire';

		$this->rights[4][0] = 1005;
		$this->rights[4][1] = 'Creer/modifier mouvements de stocks';
		$this->rights[4][2] = 'w';
		$this->rights[4][3] = 0;
		$this->rights[4][4] = 'mouvement';
		$this->rights[4][5] = 'creer';

	}

	/**
	 *		Function called when module is enabled.
	 *		The init function add constants, boxes, permissions and menus (defined in constructor) into Dolibarr database.
	 *		It also creates data directories
	 *
     *      @param      string	$options    Options when enabling module ('', 'noboxes')
	 *      @return     int             	1 if OK, 0 if KO
	 */
	function init($options='')
	{
		$sql = array();

		return $this->_init($sql,$options);
	}

    /**
	 *		Function called when module is disabled.
	 *      Remove from database constants, boxes and permissions from Dolibarr database.
	 *		Data directories are not deleted
	 *
     *      @param      string	$options    Options when enabling module ('', 'noboxes')
	 *      @return     int             	1 if OK, 0 if KO
     */
    function remove($options='')
    {
		$sql = array();

		return $this->_remove($sql,$options);
    }

}
?>
