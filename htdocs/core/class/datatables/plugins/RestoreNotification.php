<?php
/* Copyright (C) 2013	Regis Houssin	<regis.houssin@capnetworks.com>
 * Copyright (C) 2013	Herve Prot		<herve.prot@symeos.com>
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

namespace datatables\plugins;

use datatables\Datatables,
	datatables\PluginInterface;

class RestoreNotification implements PluginInterface {

	/* ______________________________________________________________________ */

	public function apply(Datatables $table) {
		global $langs;

		$var_name = $table->getConfig('var_name');

		$table->method("
			$('tbody tr td .action-restore').live('click', function(){
				var aPos = {$var_name}.fnGetPosition(this.parentNode);
				var aData = {$var_name}.fnGetData(aPos[0]);
				if(aData['name'] === undefined)
					var text = aData['label'];
				else
					var text = aData['name'];

				$.modal.confirm('" . $langs->trans("ConfirmRestore") . "',
					function() {
						$.ajax({
							type: 'POST',
							url: '/core/ajax/restoreinplace.php',
							data: 'json=restore&class=' + aData['element'] + '&id=' + aData['_id'],
							success: function(msg){
								// delete row
								{$var_name}.fnDeleteRow(aPos[0]);
								setTrashStatus();
							}
						});
					},
					function() {
						return false;
					},
					{
						title: '" . $langs->trans("RestoreElement") . " ' + text,
						textCancel: '" . $langs->trans("Cancel") . "',
						textConfirm: '" . $langs->trans("Restore") . "'
					}
				);
			});
		");
	}
}