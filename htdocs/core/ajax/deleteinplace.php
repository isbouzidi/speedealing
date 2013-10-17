<?php

/* Copyright (C) 2011-2013	Regis Houssin	<regis.houssin@capnetworks.com>
 * Copyright (C) 2011-2013	Herve Prot		<herve.prot@symeos.com>
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

if (!defined('NOTOKENRENEWAL'))
	define('NOTOKENRENEWAL', '1'); // Disables token renewal
if (!defined('NOREQUIREMENU'))
	define('NOREQUIREMENU', '1');
//if (! defined('NOREQUIREHTML'))  define('NOREQUIREHTML','1');
if (!defined('NOREQUIREAJAX'))
	define('NOREQUIREAJAX', '1');
//if (! defined('NOREQUIRESOC'))   define('NOREQUIRESOC','1');
//if (! defined('NOREQUIRETRAN'))  define('NOREQUIRETRAN','1');

require '../../main.inc.php';

$json = GETPOST('json', 'alpha');
$class = GETPOST('class', 'alpha');
$id = GETPOST('id', 'alpha');

/*
 * View
 */

top_httphead('json');

//print '<!-- Ajax page called with url '.$_SERVER["PHP_SELF"].'?'.$_SERVER["QUERY_STRING"].' -->'."\n";
error_log(print_r($_POST, true));
//error_log(print_r($_GET, true));

if (!empty($json) && !empty($id) && !empty($class)) {
	dol_include_once("/" . strtolower($class) . "/class/" . strtolower($class) . ".class.php");

	$object = new $class($db);

	if ($json == "delete") {
		try {

			if (preg_match("#^([a-z0-9]+)\#([0-9]+)$#", $id, $matches)) {

				$idInvoice = $matches[1];
				$idLine = $matches[2];

				$object->fetch($idInvoice);
				unset($object->lines[$idLine]);
				$object->lines = array_merge($object->lines);
				$object->record();
				$object->update_price();
				exit;
			} else {
				if (isset($object->fk_extrafields->fields->_id->schema) && ($object->fk_extrafields->fields->_id->schema == "ObjectId" || $object->fk_extrafields->fields->_id->schema->type == "ObjectId")) {
					$id = new MongoId($id);
				}
				$object->mongodb->remove(array("_id" => $id));
			}
			exit;
		} catch (Exception $exc) {
			error_log($exc->getMessage());
			exit;
		}
	} else if ($json == "trash") {
		try {
			$object->load($id);

			$object->trash = true;
			$object->trashed_by = new stdClass();
			$object->trashed_by->id = $user->id;
			$object->trashed_by->name = $user->name;
			$object->trashed_by->date = dol_now();

			$res = $object->record();

			exit;
		} catch (Exception $exc) {
			error_log($exc->getMessage());
			exit;
		}
	}
}
?>
