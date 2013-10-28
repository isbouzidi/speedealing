<?php
/* Copyright (C) 2012-2013	Regis Houssin	<regis.houssin@capnetworks.com>
 * Copyright (C) 2012-2013	Herve Prot		<herve.prot@symeos.com>
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

require("../main.inc.php");
require_once(DOL_DOCUMENT_ROOT . "/societe/class/societe.class.php");
require_once(DOL_DOCUMENT_ROOT . "/contact/class/contact.class.php");
require_once(DOL_DOCUMENT_ROOT . "/agenda/class/agenda.class.php");
require_once(DOL_DOCUMENT_ROOT . "/core/lib/date.lib.php");
require_once(DOL_DOCUMENT_ROOT . "/agenda/lib/agenda.lib.php");
if ($conf->projet->enabled)
	require_once(DOL_DOCUMENT_ROOT . "/core/lib/project.lib.php");

$date = GETPOST("date", "int");

/*
  if (!isset($conf->global->AGENDA_MAX_EVENTS_DAY_VIEW))
  $conf->global->AGENDA_MAX_EVENTS_DAY_VIEW = 3;

  $showbirthday = empty($conf->use_javascript_ajax) ? GETPOST("showbirthday", "int") : 1;

  // Security check
  $socid = GETPOST("socid", "int", 1);
  if ($user->societe_id)
  $socid = $user->societe_id;
  $result = restrictedArea($user, 'agenda', 0, '', 'myactions');

  $canedit = 1;
  if (!$user->rights->agenda->myactions->read)
  accessforbidden();
  if (!$user->rights->agenda->allactions->read)
  $canedit = 0;
  if (!$user->rights->agenda->allactions->read || $filter == 'mine') {  // If no permission to see all, we show only affected to me
  $filtera = $user->id;
  $filtert = $user->id;
  $filterd = $user->id;
  }

  $action = GETPOST('action', 'alpha');
  //$year=GETPOST("year");
  $year = GETPOST("year", "int") ? GETPOST("year", "int") : date("Y");
  $month = GETPOST("month", "int") ? GETPOST("month", "int") : date("m");
  $week = GETPOST("week", "int") ? GETPOST("week", "int") : date("W");
  $day = GETPOST("day", "int") ? GETPOST("day", "int") : 0;
  $actioncode = GETPOST("actioncode", "alpha", 3);
  $pid = GETPOST("projectid", "int", 3);
  $status = GETPOST("status");
  $type = GETPOST("type");
  $maxprint = (isset($_GET["maxprint"]) ? GETPOST("maxprint") : $conf->global->AGENDA_MAX_EVENTS_DAY_VIEW);

  if (GETPOST('viewcal')) {
  $action = 'show_month';
  $day = '';
  }                                                   // View by month
  if (GETPOST('viewweek')) {
  $action = 'show_week';
  $week = ($week ? $week : date("W"));
  $day = ($day ? $day : date("d"));
  }  // View by week
  if (GETPOST('viewday')) {
  $action = 'show_day';
  $day = ($day ? $day : date("d"));
  }                                  // View by day

  $langs->load("other");
  $langs->load("commercial");

 */


/*
 * Actions
 */

/*
  if (GETPOST("viewlist")) {
  $param = '';
  foreach ($_POST as $key => $val) {
  if ($key == 'token')
  continue;
  $param.='&' . $key . '=' . urlencode($val);
  }
  //print $param;
  header("Location: " . DOL_URL_ROOT . '/comm/action/listactions.php?' . $param);
  exit;
  }

  if ($action == 'delete_action') {
  $event = new Agenda($db);
  $event->fetch($actionid);
  $result = $event->delete();
  }
 */

// Security check
$socid = GETPOST("socid", "alpha", 1);
if ($user->societe_id)
	$socid = $user->societe_id;
$result = restrictedArea($user, 'agenda', 0, '', 'myactions');

$canedit = 1;
if (!$user->rights->agenda->myactions->read)
	accessforbidden();
if (!$user->rights->agenda->allactions->read)
	$canedit = 0;
if (!$user->rights->agenda->allactions->read || $filter == 'mine') {  // If no permission to see all, we show only affected to me
	$filtera = $user->id;
	$filtert = $user->id;
	$filterd = $user->id;
}

$view = GETPOST('view', 'alpha') ? GETPOST('view', 'alpha') : 'month';

$langs->load("agenda");
$langs->load("other");
$langs->load("commercial");

$object = new Agenda($db);

/*
 * View
 */
if (empty($date))
	$date = dol_now();
else
	$date = date("c", $date);

llxHeader('', $langs->trans("Calendar"));

print_fiche_titre($langs->trans("Calendar"), true);
print '<div class="with-padding">';
//print '<div class="columns">';
//print '<div class="twelve-columns">';
//$object->print_week($now);
//print '</div>';
?><div id="example" class="k-content">
   <!-- <div id="people">
		<input checked type="checkbox" id="alex" value="user:admin"> Fred 
		<input checked type="checkbox" id="bob" value="user:demo"> Marcel 
		<input type="checkbox" id="charlie" value="user:admin"> John 
    </div>-->
    <div id="scheduler"></div>
</div>
<script id="event-template" type="text/x-kendo-template">
	<div class="agenda-event movie-template children-tooltip" data-tooltip-options='{"classes":["anthracite-gradient"],"position":"bottom"}'>
	<a href="agenda/fiche.php?id=#=_id#" title="#if(typeof societe !=='undefined') {# <it>#: societe.name#</it> #}# <br>#if (usertodo.length) {#<ul>#for (var i=0,len=usertodo.length; i<len; i++){#<li>${ usertodo[i] }</li># } #</ul>#}#">
		#: title#
		<time>#: kendo.toString(start, "HH:mm") # - #: kendo.toString(end, "HH:mm") #</time>
		#if (description.notes) {# #:description# #}#
	</a>
	</div>
</script>
<script>
	$(document).ready(function() {
		var crudServiceBaseUrl = "api/agenda";
		$("#scheduler").kendoScheduler({
			date: new Date(),
			startTime: new Date("2013/6/13 07:00 AM"),
			endTime: new Date("2013/6/13 10:00 PM"),
			height: 600,
			views: [
				"day",
				{type: "week", selected: true},
				"month"
			],
			editable: false,
			eventTemplate: $("#event-template").html(),
			//timezone: "Etc/UTC",
			dataSource: {
				batch: true,
				transport: {
					read: {
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
						dataType: "json",
					},
					parameterMap: function(options, operation) {
						if (operation !== "read" && options.models) {
							return {models: kendo.stringify(options.models)};
						}
					}
				},
				schema: {
					model: {
						id: "_id",
						fields: {
							_id: {from: "_id", type: "String"},
							title: {from: "label", defaultValue: "No title", validation: {required: true}},
							start: {type: "date", from: "datep"},
							end: {type: "date", from: "datef"},
							startTimezone: {from: "StartTimezone"},
							endTimezone: {from: "EndTimezone"},
							recurrenceId: {from: "RecurrenceID"},
							recurrenceRule: {from: "RecurrenceRule"},
							recurrenceException: {from: "RecurrenceException"},
							description: {from: "notes"},
							usertodo: {from: "usertodo", defaultValue: ["<?php echo $user->id; ?>"], nullable: true},
							isAllDay: {type: "boolean", from: "IsAllDay"}
						}
					}
				}
				/*filter: {
					logic: "or",
					filters: [
						{field: "usertodo", operator: "eq", value: "user:admin"},
						{field: "usertodo", operator: "eq", value: "user:demo"}
					]
				}*/
			},
			resources: [
				{
					field: "usertodo",
					title: "Utilisateur",
					dataSource: [
						{text: "Alex", value: "user:admin", color: "#f8a398"},
						{text: "Bob", value: "user:demo", color: "#51a0ed"},
						{text: "Charlie", value: "user:toto", color: "#56ca85"}
					],
					multiple: true
				}
			]
		});

		$("#people :checkbox").change(function(e) {
			var checked = $.map($("#people :checked"), function(checkbox) {
				return parseInt($(checkbox).val());
			});

			var filter = {
				logic: "or",
				filters: $.map(checked, function(value) {
					return {
						operator: "eq",
						field: "usertodo",
						value: value
					};
				})
			};

			var scheduler = $("#scheduler").data("kendoScheduler");

			scheduler.dataSource.filter(filter);
		});
	});
</script>
<style scoped>
	#people {
		height: 25px;
		position: relative;
	}
</style><?php
//print '<div class="twelve-columns">';
//$object->print_calendar($date);
//print '</div>';

print '</div>';

llxFooter();
?>