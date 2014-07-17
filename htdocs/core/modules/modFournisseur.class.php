<?php

/* Copyright (C) 2003		Rodolphe Quiedeville	<rodolphe@quiedeville.org>
 * Copyright (C) 2004-2012	Laurent Destailleur		<eldy@users.sourceforge.net>
 * Copyright (C) 2005-2011	Regis Houssin			<regis.houssin@capnetworks.com>
 * Copyright (C) 2012		Herve Prot				<herve.prot@symeos.com>
 * 
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
 * 		\defgroup   fournisseur     Module suppliers
 *		\brief      Module pour gerer des societes et contacts de type fournisseurs
 *		\file       htdocs/core/modules/modFournisseur.class.php
 *		\ingroup    fournisseur
 *		\brief      Fichier de description et activation du module Fournisseur
 */
include_once DOL_DOCUMENT_ROOT .'/core/modules/DolibarrModules.class.php';


/**
 *	Classe de description et activation du module Fournisseur
 */
class modFournisseur extends DolibarrModules
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
		$this->numero = 40;

		$this->family = "products";
		// Module label (no space allowed), used if translation string 'ModuleXXXName' not found (where XXX is value of numeric property 'numero' of module)
		$this->name = preg_replace('/^mod/i','',get_class($this));
		$this->description = "Gestion des fournisseurs";

		// Possible values for version are: 'development', 'experimental', 'dolibarr' or version
		$this->version = 'dolibarr';

		$this->const_name = 'MAIN_MODULE_'.strtoupper($this->name);
		$this->special = 0;
		$this->picto='company';

		// Data directories to create when module is enabled
		$this->dirs = array("/fournisseur/temp",
							"/fournisseur/commande",
		                    "/fournisseur/commande/temp",
		                    "/fournisseur/facture",
		                    "/fournisseur/facture/temp"
		                    );

            // Dependances
            $this->depends = array("modSociete");
            $this->requiredby = array();
            $this->langfiles = array('bills', 'companies', 'suppliers', 'orders');

            // Config pages
            $this->config_page_url = array("fournisseur.php");

            // Constantes
            $this->const = array();
			$r=0;

            $this->const[$r][0] = "COMMANDE_SUPPLIER_ADDON_PDF";
            $this->const[$r][1] = "chaine";
            $this->const[$r][2] = "muscadet";
			$r++;

            $this->const[$r][0] = "COMMANDE_SUPPLIER_ADDON";
            $this->const[$r][1] = "chaine";
            $this->const[$r][2] = "mod_commande_fournisseur_muguet";
			$r++;

			$this->const[$r][0] = "INVOICE_SUPPLIER_ADDON_PDF";
            $this->const[$r][1] = "chaine";
            $this->const[$r][2] = "canelle";
			$r++;

            // Boxes
            $this->boxes = array();
            $r=0;

            $this->boxes[$r][1] = "box_fournisseurs.php";
            $r++;

            $this->boxes[$r][1] = "box_factures_fourn_imp.php";
            $r++;

            $this->boxes[$r][1] = "box_factures_fourn.php";
            $r++;

            $this->boxes[$r][1] = "box_supplier_orders.php";
            $r++;

            // Permissions
            $this->rights = array();
            $this->rights_class = 'fournisseur';
            $r=0;

            $r++;
            $this->rights[$r][0] = 1181;
            $this->rights[$r][1] = 'Consulter les fournisseurs';
            $this->rights[$r][2] = 'r';
            $this->rights[$r][3] = 1;
            $this->rights[$r][4] = 'lire';

            $r++;
            $this->rights[$r][0] = 1182;
            $this->rights[$r][1] = 'Consulter les commandes fournisseur';
            $this->rights[$r][2] = 'r';
            $this->rights[$r][3] = 1;
            $this->rights[$r][4] = 'commande';
            $this->rights[$r][5] = 'lire';

            $r++;
            $this->rights[$r][0] = 1183;
            $this->rights[$r][1] = 'Creer une commande fournisseur';
            $this->rights[$r][2] = 'w';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'commande';
            $this->rights[$r][5] = 'creer';

            $r++;
            $this->rights[$r][0] = 1184;
            $this->rights[$r][1] = 'Valider une commande fournisseur';
            $this->rights[$r][2] = 'w';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'commande';
            $this->rights[$r][5] = 'valider';

            $r++;
            $this->rights[$r][0] = 1185;
            $this->rights[$r][1] = 'Approuver une commande fournisseur';
            $this->rights[$r][2] = 'w';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'commande';
            $this->rights[$r][5] = 'approuver';

            $r++;
            $this->rights[$r][0] = 1186;
            $this->rights[$r][1] = 'Commander une commande fournisseur';
            $this->rights[$r][2] = 'w';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'commande';
            $this->rights[$r][5] = 'commander';

            $r++;
            $this->rights[$r][0] = 1187;
            $this->rights[$r][1] = 'Receptionner une commande fournisseur';
            $this->rights[$r][2] = 'd';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'commande';
            $this->rights[$r][5] = 'receptionner';

            $r++;
            $this->rights[$r][0] = 1188;
            $this->rights[$r][1] = 'Supprimer une commande fournisseur';
            $this->rights[$r][2] = 'd';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'commande';
            $this->rights[$r][5] = 'supprimer';

            $r++;
            $this->rights[$r][0] = 1231;
            $this->rights[$r][1] = 'Consulter les factures fournisseur';
            $this->rights[$r][2] = 'r';
            $this->rights[$r][3] = 1;
            $this->rights[$r][4] = 'facture';
            $this->rights[$r][5] = 'lire';

            $r++;
            $this->rights[$r][0] = 1232;
            $this->rights[$r][1] = 'Creer une facture fournisseur';
            $this->rights[$r][2] = 'w';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'facture';
            $this->rights[$r][5] = 'creer';

            $r++;
            $this->rights[$r][0] = 1233;
            $this->rights[$r][1] = 'Valider une facture fournisseur';
            $this->rights[$r][2] = 'w';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'facture';
            $this->rights[$r][5] = 'valider';

            $r++;
            $this->rights[$r][0] = 1234;
            $this->rights[$r][1] = 'Supprimer une facture fournisseur';
            $this->rights[$r][2] = 'd';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'facture';
            $this->rights[$r][5] = 'supprimer';

            $r++;
            $this->rights[$r][0] = 1235;
			$this->rights[$r][1] = 'Envoyer les factures par mail';
			$this->rights[$r][2] = 'a';
			$this->rights[$r][3] = 0;
			$this->rights[$r][4] = 'supplier_invoice_advance';
			$this->rights[$r][5] = 'send';

            $r++;
            $this->rights[$r][0] = 1236;
            $this->rights[$r][1] = 'Exporter les factures fournisseurs, attributs et reglements';
            $this->rights[$r][2] = 'r';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'facture';
            $this->rights[$r][5] = 'export';

            $r++;
            $this->rights[$r][0] = 1237;
            $this->rights[$r][1] = 'Exporter les commande fournisseurs, attributs';
            $this->rights[$r][2] = 'r';
            $this->rights[$r][3] = 0;
            $this->rights[$r][4] = 'commande';
            $this->rights[$r][5] = 'export';

		// Menus
		//--------
		$r = 0;
		$this->menus[$r] = new stdClass();
		$this->menus[$r]->_id = "menu:listsuppliersshort";
		$this->menus[$r]->position = 5;
		$this->menus[$r]->url = "/fourn/liste.php";
		$this->menus[$r]->langs = "suppliers";
		$this->menus[$r]->perms = '$user->rights->societe->lire && $user->rights->fournisseur->lire';
		$this->menus[$r]->enabled = '$conf->societe->enabled && $conf->fournisseur->enabled';
		$this->menus[$r]->usertype = 2;
		$this->menus[$r]->title = "ListSuppliersShort";
		$this->menus[$r]->fk_menu = "menu:thirdparty";

		

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
		global $conf;

		$this->remove($options);

		$sql = array(
			 "DELETE FROM ".MAIN_DB_PREFIX."document_model WHERE nom = '".$this->const[0][2]."' AND entity = ".$conf->entity,
			 "INSERT INTO ".MAIN_DB_PREFIX."document_model (nom, type, entity) VALUES('".$this->const[0][2]."','order_supplier',".$conf->entity.")",
		);

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
