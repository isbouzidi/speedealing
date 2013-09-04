<?php

/* Copyright (C) 2011-2013 Regis Houssin  <regis.houssin@capnetworks.com>
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
 *       \file       core/ajax/moduleonoff.php
 *       \brief      File to set or del an on/off module
 */
if (!defined('NOTOKENRENEWAL'))
	define('NOTOKENRENEWAL', '1'); // Disables token renewal
if (!defined('NOREQUIREMENU'))
	define('NOREQUIREMENU', '1');
if (!defined('NOREQUIREHTML'))
	define('NOREQUIREHTML', '1');
if (!defined('NOREQUIREAJAX'))
	define('NOREQUIREAJAX', '1');
if (!defined('NOREQUIRESOC'))
	define('NOREQUIRESOC', '1');
if (!defined('NOREQUIRETRAN'))
	define('NOREQUIRETRAN', '1');

require '../../main.inc.php';
require_once DOL_DOCUMENT_ROOT . '/core/lib/admin.lib.php';

$action = GETPOST('action', 'alpha');
$id = GETPOST('id', 'alpha');
$value = GETPOST('value', 'alpha');

/*
 * View
 */

top_httphead('json');

//print '<!-- Ajax page called with url '.$_SERVER["PHP_SELF"].'?'.$_SERVER["QUERY_STRING"].' -->'."\n";

if (!empty($user->admin) && !empty($action) && !empty($id)) {

	$object = new DolibarrModules();

	$filename = array();
	$modules = array();
	$orders = array();
	$categ = array();
	$dirmod = array();
	$i = 0; // is a sequencer of modules found
	$j = 0; // j is module number. Automatically affected if module number not defined.
	$modNameLoaded = array();

	$object->load_modules_files($filename, $modules, $orders, $categ, $dirmod, $modNameLoaded);

	if ($action == 'set') {
		try {
			$object->load($id); // update if module exist
		} catch (Exception $e) {
			
		}

		try {
			$key = $value;
			$objMod = $modules[$key];

			foreach ($objMod as $key => $aRow)
				if ($key != "mongodb")
					$object->$key = $aRow;

			$object->_id = "module:" . $objMod->name;
			$object->enabled = true;
			dol_delcache("MenuAuguria:list"); //refresh menu
			dol_delcache("MenuAuguria:submenu"); //refresh menu
			dol_delcache("extrafields:" . $objMod->name); //refresh extrafields
			dol_delcache("const"); //delete $conf
			dol_delcache("DolibarrModules:list"); //refresh menu
			dol_delcache("DolibarrModules:default_right");

			$object->record();
			$object->_load_documents();
		} catch (Exception $e) {
			setEventMessage($e->getMessage(), 'errors');
		}
	} else if ($action == 'reset') {
		try {
			//$object->load($id);
			$object->_id = $id;
			//unset($object->enabled);

			dol_delcache("MenuAuguria:list"); //refresh menu
			dol_delcache("MenuAuguria:submenu"); //refresh menu
			dol_delcache("extrafields:" . $objMod->name); //refresh extrafields
			dol_delcache("const"); //delete $conf
			dol_delcache("DolibarrModules:list"); //refresh menu
			dol_delcache("DolibarrModules:default_right");

			$object->set("enabled", false);
		} catch (Exception $e) {
			setEventMessage($e->getMessage(), 'errors');
		}
	}
}
?>
