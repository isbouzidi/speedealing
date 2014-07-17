<?php

/* Copyright (C) 2003-2004	Rodolphe Quiedeville	<rodolphe@quiedeville.org>
 * Copyright (C) 2004-2010	Laurent Destailleur		<eldy@users.sourceforge.net>
 * Copyright (C) 2004		Sebastien Di Cintio		<sdicintio@ressource-toi.org>
 * Copyright (C) 2004		Benoit Mortier			<benoit.mortier@opensides.be>
 * Copyright (C) 2005-2013	Regis Houssin			<regis.houssin@capnetworks.com>
 * Copyright (C) 2011-2013	Herve Prot
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
 *  Classe de description et activation du module Facture
 */
class modFacture extends DolibarrModules {

    /**
     *   Constructor.
     */
    function __construct() {
        global $conf;

        parent::__construct();
        $this->numero = 30;

        $this->family = "financial";
        // Module label (no space allowed), used if translation string 'ModuleXXXName' not found (where XXX is value of numeric property 'numero' of module)
        $this->name = preg_replace('/^mod/i', '', get_class($this));
        $this->description = "Gestion des factures";

        // Possible values for version are: 'development', 'experimental', 'speedealing' or version
        $this->version = 'speedealing';

        $this->const_name = 'MAIN_MODULE_' . strtoupper($this->name);
        $this->special = 0;
        $this->picto = 'bill';

        // Data directories to create when module is enabled
        $this->dirs = array("/facture/temp");

        // Dependencies
        $this->depends = array("modSociete");
        $this->requiredby = array("modComptabilite", "modAccounting");
        $this->conflictwith = array();
        $this->langfiles = array("bills", "companies", "compta", "products");

        // Config pages
        $this->config_page_url = array("facture.php");

        // Constantes
        $this->const = array();
        $r = 0;

        $this->const[$r][0] = "FACTURE_ADDON_PDF";
        $this->const[$r][1] = "chaine";
        $this->const[$r][2] = "crabe";
        $r++;

        $this->const[$r][0] = "FACTURE_ADDON";
        $this->const[$r][1] = "chaine";
        $this->const[$r][2] = "terre";
        $r++;

        $this->const[$r][0] = "FACTURE_ADDON_PDF_ODT_PATH";
        $this->const[$r][1] = "chaine";
        $this->const[$r][2] = "DOL_DATA_ROOT/doctemplates/invoices";
        $this->const[$r][3] = "";
        $this->const[$r][4] = 0;
        $r++;

        // Boxes
        $this->boxes = array();
        $r = 0;
        $this->boxes[$r][1] = "box_factures_imp.php";
        $r++;
        $this->boxes[$r][1] = "box_factures.php";
        $r++;

        // Permissions
        $this->rights = array();
        $this->rights_class = 'facture';
        $r = 0;

		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 11;
        $this->rights[$r]->desc = 'Lire les factures';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('lire');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 12;
        $this->rights[$r]->desc = 'Creer/modifier les factures';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('creer');

        // There is a particular permission for unvalidate because this may be not forbidden by some laws
        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 13;
        $this->rights[$r]->desc = 'Dévalider les factures';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('invoice_advance', 'unvalidate');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 14;
        $this->rights[$r]->desc = 'Valider les factures';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('valider');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 15;
        $this->rights[$r]->desc = 'Envoyer les factures par mail';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('invoice_advance', 'send');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 16;
        $this->rights[$r]->desc = 'Emettre des paiements sur les factures';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('paiement');
        $r++;
		
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 19;
        $this->rights[$r]->desc = 'Supprimer les factures';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('supprimer');

        $r++;
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 1321;
        $this->rights[$r]->desc = 'Exporter les factures clients, attributs et reglements';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('facture', 'export');

        // Menus
        //-------

        $r = 0;
		$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:factures";
        $this->menus[$r]->type = "top";
        $this->menus[$r]->position = 42;
        $this->menus[$r]->langs = "bills";
        $this->menus[$r]->perms = '$user->rights->facture->lire';
        $this->menus[$r]->enabled = '$conf->facture->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "Bills";
        $r++;

		/*$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:newfacture";
        $this->menus[$r]->position = 0;
        $this->menus[$r]->url = "/facture/fiche.php?action=create";
        $this->menus[$r]->langs = "facture";
        $this->menus[$r]->perms = '$user->rights->facture->creer';
        $this->menus[$r]->enabled = '$conf->facture->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "NewBill";
        $this->menus[$r]->fk_menu = "menu:factures";
        $r++;*/

		$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:billslist";
        $this->menus[$r]->position = 1;
        $this->menus[$r]->url = "#!/bills";
        $this->menus[$r]->langs = "bills";
        $this->menus[$r]->perms = '$user->rights->facture->lire';
        $this->menus[$r]->enabled = '$conf->facture->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "List";
        $this->menus[$r]->fk_menu = "menu:factures";
        $r++;

		/*$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:billsstats";
        $this->menus[$r]->position = 2;
        $this->menus[$r]->url = "/facture/stats/index.php";
        $this->menus[$r]->langs = "facture";
        $this->menus[$r]->perms = '$user->rights->facture->lire';
        $this->menus[$r]->enabled = '$conf->facture->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "BillsStatistics";
        $this->menus[$r]->fk_menu = "menu:factures";
        $r++;*/

//        $r = 0;
//        $this->menus[$r]->_id = "menu:accountancy";
//        $this->menus[$r]->type = "top";
//        $this->menus[$r]->position = 6;
//        $this->menus[$r]->url = "/compta/index.php";
//        $this->menus[$r]->langs = "compta";
//        $this->menus[$r]->perms = '$user->rights->compta->resultat->lire || $user->rights->accounting->plancompte->lire || $user->rights->facture->lire|| $user->rights->deplacement->lire || $user->rights->don->lire || $user->rights->tax->charges->lire';
//        $this->menus[$r]->enabled = '$conf->comptabilite->enabled || $conf->accounting->enabled || $conf->facture->enabled || $conf->deplacement->enabled || $conf->don->enabled  || $conf->tax->enabled';
//        $this->menus[$r]->usertype = 2;
//        $this->menus[$r]->title = "MenuFinancial";
//        $r++;
//        $this->menus[$r]->_id = "menu:billscustomers";
//        $this->menus[$r]->position = 3;
//        $this->menus[$r]->url = "/compta/facture/list.php";
//        $this->menus[$r]->langs = "bills";
//        $this->menus[$r]->perms = '$user->rights->facture->lire';
//        $this->menus[$r]->enabled = '$conf->facture->enabled';
//        $this->menus[$r]->usertype = 2;
//        $this->menus[$r]->title = "BillsCustomers";
//        $this->menus[$r]->fk_menu = "menu:accountancy";
//        $r++;
//        $this->menus[$r]->_id = "menu:newbill0";
//        $this->menus[$r]->position = 3;
//        $this->menus[$r]->url = "/compta/clients.php?action=facturer";
//        $this->menus[$r]->langs = "bills";
//        $this->menus[$r]->perms = '$user->rights->facture->creer';
//        $this->menus[$r]->enabled = '$conf->facture->enabled';
//        $this->menus[$r]->usertype = 2;
//        $this->menus[$r]->title = "NewBill";
//        $this->menus[$r]->fk_menu = "menu:billscustomers";
//        $r++;
//        $this->menus[$r]->_id = "menu:repeatable";
//        $this->menus[$r]->position = 4;
//        $this->menus[$r]->url = "/compta/facture/fiche-rec.php";
//        $this->menus[$r]->langs = "bills";
//        $this->menus[$r]->perms = '$user->rights->facture->lire';
//        $this->menus[$r]->enabled = '$conf->facture->enabled';
//        $this->menus[$r]->usertype = 2;
//        $this->menus[$r]->title = "Repeatable";
//        $this->menus[$r]->fk_menu = "menu:billscustomers";
//        $r++;
//        $this->menus[$r]->_id = "menu:unpaid0";
//        $this->menus[$r]->position = 5;
//        $this->menus[$r]->url = "/compta/facture/impayees.php?action=facturer";
//        $this->menus[$r]->langs = "bills";
//        $this->menus[$r]->perms = '$user->rights->facture->lire';
//        $this->menus[$r]->enabled = '$conf->facture->enabled';
//        $this->menus[$r]->usertype = 2;
//        $this->menus[$r]->title = "Unpaid";
//        $this->menus[$r]->fk_menu = "menu:billscustomers";
//        $r++;
//        $this->menus[$r]->_id = "menu:payments0";
//        $this->menus[$r]->position = 6;
//        $this->menus[$r]->url = "/compta/paiement/liste.php";
//        $this->menus[$r]->langs = "bills";
//        $this->menus[$r]->perms = '$user->rights->facture->lire';
//        $this->menus[$r]->enabled = '$conf->facture->enabled';
//        $this->menus[$r]->usertype = 2;
//        $this->menus[$r]->title = "Payments";
//        $this->menus[$r]->fk_menu = "menu:billscustomers";
//        $r++;
//        $this->menus[$r]->_id = "menu:statistics3";
//        $this->menus[$r]->position = 8;
//        $this->menus[$r]->url = "/compta/facture/stats/index.php";
//        $this->menus[$r]->langs = "bills";
//        $this->menus[$r]->perms = '$user->rights->facture->lire';
//        $this->menus[$r]->enabled = '$conf->facture->enabled';
//        $this->menus[$r]->usertype = 2;
//        $this->menus[$r]->title = "Statistics";
//        $this->menus[$r]->fk_menu = "menu:billscustomers";
//        $r++;
//        $this->menus[$r]->_id = "menu:reportings";
//        $this->menus[$r]->position = 1;
//        $this->menus[$r]->url = "/compta/paiement/rapport.php";
//        $this->menus[$r]->langs = "bills";
//        $this->menus[$r]->perms = '$user->rights->facture->lire';
//        $this->menus[$r]->enabled = '$conf->facture->enabled';
//        $this->menus[$r]->usertype = 2;
//        $this->menus[$r]->title = "Reportings";
//        $this->menus[$r]->fk_menu = "menu:payments0";
     
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
