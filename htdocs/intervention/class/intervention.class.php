<?php
/* Copyright (C) 2011-2013	Herve Prot           <herve.prot@symeos.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU  *General Public License as published by
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
 * \file       htdocs/intervention/class/intervention.class.php
 * \ingroup    intervention
 * \brief      Fichier des classes des interventions
 */
include_once DOL_DOCUMENT_ROOT . '/core/class/commonorder.class.php';
require_once DOL_DOCUMENT_ROOT . '/product/class/product.class.php';
require_once DOL_DOCUMENT_ROOT . '/margin/lib/margins.lib.php';
require_once DOL_DOCUMENT_ROOT . '/core/class/abstractinvoice.class.php';

/**
 *  Class to manage customers orders
 */
class Intervention extends AbstractInvoice {

	public $element = 'intervention';

	/**
	 * 	Constructor
	 *
	 *  @param		DoliDB		$db      Database handler
	 */
	function __construct($db = '') {
		parent::__construct($db);

		$this->fk_extrafields = new ExtraFields($db);
		$this->fk_extrafields->fetch(get_class($this));

	}
}
?>
