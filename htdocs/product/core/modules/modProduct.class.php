<?php

/* Copyright (C) 2003      Rodolphe Quiedeville <rodolphe@quiedeville.org>
 * Copyright (C) 2004-2012 Laurent Destailleur  <eldy@users.sourceforge.net>
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
 */

include_once DOL_DOCUMENT_ROOT . '/core/modules/DolibarrModules.class.php';

/**
 * 	Class descriptor of Product module
 */
class modProduct extends DolibarrModules {

    /**
     *   Constructor.
     *
     */
    function __construct() {
        global $conf;

        parent::__construct();

        $this->numero = 50;

        $this->family = "products";
        // Module label (no space allowed), used if translation string 'ModuleXXXName' not found (where XXX is value of numeric property 'numero' of module)
        $this->name = preg_replace('/^mod/i', '', get_class($this));
        $this->description = "Gestion des produits";

        // Possible values for version are: 'development', 'experimental', 'dolibarr' or version
        $this->version = 'speedealing';

        $this->special = 0;
        $this->picto = 'product';

        // Data directories to create when module is enabled
        $this->dirs = array("/product/temp");

        // Dependencies
        $this->depends = array();
        $this->requiredby = array("modStock", "modBarcode");

        // Config pages
        $this->config_page_url = array("product.php@product");
        $this->langfiles = array("products", "companies", "stocks", "bills");

        // Constants
        $this->const = array();
        $r = 0;

        $this->const[$r][0] = "PRODUCT_CODEPRODUCT_ADDON";
        $this->const[$r][1] = "chaine";
        $this->const[$r][2] = "mod_codeproduct_leopard";
        $this->const[$r][3] = 'Module to control product codes';
        $this->const[$r][4] = 0;
        $r++;

        $this->const[$r][0] = "MAIN_SEARCHFORM_PRODUITSERVICE";
        $this->const[$r][1] = "yesno";
        $this->const[$r][2] = "1";
        $this->const[$r][3] = "Show form for quick product search";
        $this->const[$r][4] = 0;
        $r++;

        // Boxes
        $this->boxes = array();
        $this->boxes[0][1] = "box_produits.php";
        $this->boxes[1][1] = "box_produits_alerte_stock.php";

        // Permissions
        $this->rights = array();
        $this->rights_class = 'produit';
        $r = 0;

		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 31; // id de la permission
        $this->rights[$r]->desc = 'Lire les produits'; // libelle de la permission
        $this->rights[$r]->default = 1; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('lire');
        $r++;

		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 32; // id de la permission
        $this->rights[$r]->desc = 'Creer/modifier les produits'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('creer');
        $r++;

		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 34; // id de la permission
        $this->rights[$r]->desc = 'Supprimer les produits'; // libelle de la permission
        $this->rights[$r]->default = 0; // La permission est-elle une permission par defaut
        $this->rights[$r]->perm = array('supprimer');
        $r++;

		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 38; // Must be same permission than in service module
        $this->rights[$r]->desc = 'Exporter les produits';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('export');
        $r++;
		
		$this->rights[$r] = new stdClass();
        $this->rights[$r]->id = 39; // Must be same permission than in service module
        $this->rights[$r]->desc = 'Importer les produits';
        $this->rights[$r]->default = 0;
        $this->rights[$r]->perm = array('import');
        $r++;

        // Menus
        //--------
        $r = 0;

		$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:products";
        $this->menus[$r]->type = "top";
        $this->menus[$r]->langs = "products";
        $this->menus[$r]->position = 3;
        $this->menus[$r]->perms = '$user->rights->produit->lire || $user->rights->service->lire';
        $this->menus[$r]->enabled = '$conf->produit->enabled || $conf->service->enabled';
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->title = "Products/Services";
        $r++;

		$this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:productlist";
        $this->menus[$r]->url = "/product/list.php?type=PRODUCT";
        $this->menus[$r]->langs = "products";
        $this->menus[$r]->position = 1;
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->perms = '$user->rights->produit->lire';
        $this->menus[$r]->enabled = '$conf->produit->enabled';
        $this->menus[$r]->title = "ListProducts";
        $this->menus[$r]->fk_menu = "menu:products";
        $r++;
		
        $this->menus[$r] = new stdClass();
        $this->menus[$r]->_id = "menu:prodservlistall";
        $this->menus[$r]->url = "/product/list.php";
        $this->menus[$r]->langs = "products";
        $this->menus[$r]->position = 4;
        $this->menus[$r]->usertype = 2;
        $this->menus[$r]->perms = '$user->rights->produit->lire || $user->rights->service->lire';
        $this->menus[$r]->enabled = '$conf->produit->enabled && $conf->service->enabled';
        $this->menus[$r]->title = "ListAll";
        $this->menus[$r]->fk_menu = "menu:products";
        $r++;


        // Exports
        //--------
        $r = 0;
		$this->export[$r] = new stdClass();
        $this->export[$r]->code = $this->rights_class . '_' . $r;
        $this->export[$r]->label = 'Products';
        $this->export[$r]->icon = 'product';
        $this->export[$r]->permission = '$user->product->export';

        // Imports
        //--------
        $r = 0;

        $r++;
        $this->import_code[$r] = $this->rights_class . '_' . $r;
        $this->import_label[$r] = "Products"; // Translation key
        $this->import_icon[$r] = $this->picto;
        $this->import_entities_array[$r] = array();  // We define here only fields that use another icon that the one defined into import_icon
        $this->import_tables_array[$r] = array('p' => MAIN_DB_PREFIX . 'product', 'extra' => MAIN_DB_PREFIX . 'product_extrafields');
        $this->import_tables_creator_array[$r] = array('p' => 'fk_user_author'); // Fields to store import user id
        $this->import_fields_array[$r] = array('p.ref' => "Ref*", 'p.label' => "Label*", 'p.description' => "Description", 'p.accountancy_code_sell' => "ProductAccountancySellCode", 'p.accountancy_code_buy' => "ProductAccountancyBuyCode", 'p.note' => "Note", 'p.length' => "Length", 'p.surface' => "Surface", 'p.volume' => "Volume", 'p.weight' => "Weight", 'p.duration' => "Duration", 'p.customcode' => 'CustomCode', 'p.price' => "SellingPriceHT", 'p.price_ttc' => "SellingPriceTTC", 'p.tva_tx' => 'VAT', 'p.tosell' => "OnSell*", 'p.tobuy' => "OnBuy*", 'p.fk_product_type' => "Type*", 'p.finished' => 'Nature', 'p.datec' => 'DateCreation*');
        // Add extra fields
        $sql = "SELECT name, label FROM " . MAIN_DB_PREFIX . "extrafields WHERE elementtype = 'product'";
        // End add extra fields
        $this->import_fieldshidden_array[$r] = array('extra.fk_object' => 'lastrowid-' . MAIN_DB_PREFIX . 'product');    // aliastable.field => ('user->id' or 'lastrowid-'.tableparent)
        $this->import_regex_array[$r] = array('p.ref' => '[^ ]', 'p.tosell' => '^[0|1]$', 'p.tobuy' => '^[0|1]$', 'p.fk_product_type' => '^[0|1]$', 'p.datec' => '^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$');
        $this->import_examplevalues_array[$r] = array('p.ref' => "PR123456", 'p.label' => "My product", 'p.description' => "This is a description example for record", 'p.note' => "Some note", 'p.price' => "100", 'p.price_ttc' => "110", 'p.tva_tx' => '10', 'p.tosell' => "0 or 1", 'p.tobuy' => "0 or 1", 'p.fk_product_type' => "0 for product/1 for service", 'p.finished' => '', 'p.duration' => "1y", 'p.datec' => '2008-12-31');
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
