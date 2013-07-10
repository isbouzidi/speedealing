<?php
/* Copyright (C) 2001-2005 Rodolphe Quiedeville   <rodolphe@quiedeville.org>
 * Copyright (C) 2004-2012 Laurent Destailleur    <eldy@users.sourceforge.net>
 * Copyright (C) 2005      Marc Barilley / Ocebo  <marc@ocebo.com>
 * Copyright (C) 2005-2012 Regis Houssin          <regis.houssin@capnetworks.com>
 * Copyright (C) 2012      Juanjo Menent          <jmenent@2byte.es>
 * Copyright (C) 2012      David Moothen          <dmoothen@websitti.fr>
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


require '../main.inc.php';
require_once DOL_DOCUMENT_ROOT . '/core/class/html.formfile.class.php';
require_once DOL_DOCUMENT_ROOT . '/core/class/html.formother.class.php';
require_once DOL_DOCUMENT_ROOT . '/commande/class/commande.class.php';
require_once DOL_DOCUMENT_ROOT . '/contact/class/contact.class.php';

$langs->load('orders');
$langs->load('deliveries');
$langs->load('companies');

$object = new Commande($db);
$societe = new Societe($db);

if (!empty($_GET['json'])) {
	$output = array(
		"sEcho" => intval($_GET['sEcho']),
		"iTotalRecords" => 0,
		"iTotalDisplayRecords" => 0,
		"aaData" => array()
	);

//    $keystart[0] = $user->id;
//    $keyend[0] = $user->id;
//    $keyend[1] = new stdClass();

	/* $params = array('startkey' => array($user->id, mktime(0, 0, 0, date("m") - 1, date("d"), date("Y"))),
	  'endkey' => array($user->id, mktime(0, 0, 0, date("m") + 1, date("d"), date("Y")))); */

	try {
		$result = $object->getView($_GET["json"]);
	} catch (Exception $exc) {
		print $exc->getMessage();
	}

	$iTotal = count($result->rows);
	$output["iTotalRecords"] = $iTotal;
	$output["iTotalDisplayRecords"] = $iTotal;
	$i = 0;
	foreach ($result->rows as $aRow) {
		$output["aaData"][] = $aRow->value;
	}

	header('Content-type: application/json');
	echo json_encode($output);
	exit;
}

/*
 * View
 */

$now = dol_now();

$form = new Form($db);
$formother = new FormOther($db);
$formfile = new FormFile($db);
$companystatic = new Societe($db);


$title = $langs->trans('Orders');
llxHeader('', $title);
print_fiche_titre($title);
?>
<div class="dashboard">
    <div class="columns">
        <div class="four-columns twelve-columns-mobile graph">
			<?php $object->graphPieStatus(); ?>
        </div>

        <div class="eight-columns twelve-columns-mobile new-row-mobile graph">
			<?php $object->graphBarStatus(); ?>
        </div>
    </div>
</div>
<?php
print '<div class="with-padding" >';

print '<div id="grid"></div>
 <script>
                $(document).ready(function () {
                    var crudServiceBaseUrl = "api/planning",
                        dataSource = new kendo.data.DataSource({
                            transport: {
                                read:  {
                                    url: crudServiceBaseUrl,
									type: "GET",
                                    dataType: "json"
                                },
                                update: {
                                    url: crudServiceBaseUrl,
									type: "PUT",
                                    dataType: "json"
                                },
                                destroy: {
                                    url: crudServiceBaseUrl,
									type: "DELETE",
                                    dataType: "json"
                                },
                                create: {
                                    url: crudServiceBaseUrl,
									type: "POST",
                                    dataType: "json"
                                },
                                parameterMap: function(options, operation) {
                                    if (operation !== "read" && options.models) {
                                        return {models: kendo.stringify(options.models)};
                                    }
                                }
                            },
                            batch: true,
                            pageSize: 50,
                            schema: {
                                model: {
                                    id: "_id",
                                    fields: {
                                        _id: { editable: false, nullable: true },
                                        name: { editable: true, validation: { required: true } },
                                        qty: { type: "number", validation: { required: true, min: 1} },
                                        date_commande: {type: "date"},
										facility: {type: "string"},
										order: {defaultValue: { id: -1, name: ""} },
										group: {defaultValue: { url: ""} },
										Status: {defaultValue: { id: "NEW", name: "Nouvelle commande"} },
										date_livraison: {type: "date"}
                                    }
                                }
                            },
							group: {
                                     field: "order.name"
                                   },
							sort: { field: "date_livraison", dir: "asc" }
                        });

                    $("#grid").kendoGrid({
                        dataSource: dataSource,
                        pageable: {
                            refresh: true,
							pageSize: 50,
							pageSizes: [5, 10, 20, 50],
							buttonCount: 5
                        },
						filterable: {
							extra: false
						},
						//scrollable: {
						//	virtual: true
						//},
						sortable: true,
                        //height: 430,
                        toolbar: [
							{ 
								name: "create", 
								text:"Nouvelle commande",
								className:"k-button k-button-icontext k-grid-add button",
							}
						],
                        columns: [
							{ field: "name", title: "Job ticket", template: \'#=group.url# \'},
                            { field: "order.name", title: "Commande", editor: orderDropDownEditor, template: ';
print $object->kendoTemplateJS("order.name", "url", array('id' => "order.id"));						
print '},
							{ field: "date_commande", title: "Creation", format: "{0:dd/MM/yyyy HH:mm}", filterable: {
                                    ui: "datetimepicker"
                                },
								template: ';
print $object->kendoTemplateJS("date_commande", "date");						
print '},
							{ field: "societe", title: "Societe", template: ';
print $object->kendoTemplateJS("societe", "url", array('id' => "societe_id"));						
print '},
                            { field: "qty", title: "Qte", width: "60px" },
							{ field: "date_livraison", title: "Livraison", format: "{0:dd/MM/yyyy HH:mm}", filterable: {
                                    ui: "datetimepicker"
                                },
								template: ';
print $object->kendoTemplateJS("date_livraison", "date");						
print '},
							{ field: "Status", title: "Etat", width: "160px",
								editor: statusDropDownEditor, template: \'<small class="tag #=Status.css# glossy ">#=Status.name#</small>\'},
                            { field: "facility", title:"Atelier", width: "100px", template: ';
print $object->kendoTemplateJS("facility", "tag");
print '},
                            { command: [{ name: "edit", text: { edit: "Editer", update: "Enregistrer", cancel: "Annuler"}}, /*{name:"destroy", text:"Supp."}*/], title: "&nbsp;", width: "90px" }],
                        editable: "popup"
                    });
                });
				
				function statusDropDownEditor(container, options) {
                    $(\'<input data-text-field="name" data-value-field="id" data-bind="value:\' + options.field + \'"/>\')
                        .appendTo(container)
                        .kendoDropDownList({
                            autoBind: false,
                            dataSource: {
							transport: {
                                read: {
										url: "api/planning/select",
										type: "GET",
										dataType: "json"
									}
								}
                            }
                        });
                }
				
				function orderDropDownEditor(container, options) {
                    $(\'<input required data-text-field="name" data-value-field="id" data-bind="value:\' + options.field + \'"/>\')
                        .appendTo(container)
                        .kendoAutoComplete({
                            minLength: 3,
							dataTextField: "name",
							filter: "contains",
                            dataSource: {
								serverFiltering: true,
								serverPaging: true,
								pageSize: 5,
                                transport: {
									read: {
										url: "api/planning/autocomplete",
										type: "GET",
										dataType: "json"
									}
                                }
                            }
                        });
                }
            </script>';

print '</div>';

llxFooter();
?>