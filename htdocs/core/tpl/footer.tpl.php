<?php
/* Copyright (C) 2010-2013	Regis Houssin	<regis.houssin@capnetworks.com>
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
 *
 */
?>

<!-- Footer -->

<!-- jQuery Datepicker default options -->
<script type="text/javascript" src="core/js/datepicker.js.php?lang=<?php echo $langs->defaultlang; ?>"></script>

<!-- BEGIN THEME -->
<!-- <script type="text/javascript" src="includes/js/jquery.ui.extend.js"></script> -->
<script type="text/javascript" src="includes/jquery/plugins/qtip2/jquery.qtip.min.js" defer></script>
<!-- <script type="text/javascript" src="includes/lib/fullcalendar/fullcalendar.min.js"></script> -->
<script type="text/javascript" src="includes/lib/stepy/js/jquery.stepy.min.js" defer></script>
<script type="text/javascript" src="includes/lib/validate/jquery.validate.min.js" defer></script>
<script type="text/javascript" src="includes/lib/validate/localization/messages_<?php echo substr($langs->getDefaultLang(), 0, 2); ?>.js" defer></script>
<!-- <script type="text/javascript" src="includes/js/jquery.list.min.js"></script> -->
<script type="text/javascript" src="includes/js/jquery.rwd-table.js" defer></script>
<!-- END THEME -->

<!-- NOLOGIN section (obsolete?) -->

<!-- jQuery jeditable -->
<script type="text/javascript" src="includes/jquery/plugins/jeditable/jquery.jeditable.min.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/jeditable/jquery.jeditable.ui-datepicker.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/jeditable/jquery.jeditable.ui-autocomplete.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/jeditable/jquery.jeditable.wysiwyg.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/wysiwyg/jquery.wysiwyg.js" defer></script>
<script type="text/javascript">
	var urlSaveInPlace = 'core/ajax/saveinplace.php';
	var urlAddInPlace = 'core/ajax/addinplace.php';
	var tagSaveInPlace = 'core/ajax/savetaghandler.php';
	var urlLoadInPlace = 'core/ajax/loadinplace.php';
	var tagLoadInPlace = 'core/ajax/loadtaghandler.php';
	var tooltipInPlace = '<?php echo $langs->transnoentities('ClickToEdit'); ?>';
	var placeholderInPlace = '<?php echo $langs->trans('ClickToEdit'); ?>';
	var cancelInPlace = '<?php echo $langs->trans('Cancel'); ?>';
	var submitInPlace = '<?php echo $langs->trans('Ok'); ?>';
	var indicatorInPlace = '<img src="img/standard/loaders/loading16.gif">';
	var ckeditorConfig = '/js/libs/ckeditor/config.js';
</script>
<script type="text/javascript" src="js/editinplace.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/jeditable/jquery.jeditable.ckeditor.js" defer></script>
<!-- jQuery File Upload -->
<!--  <script type="text/javascript" src="includes/jquery/plugins/template/tmpl.min.js"></script> -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/fileupload/js/jquery.iframe-transport.js"></script> -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/fileupload/js/jquery.fileupload.js"></script> -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/fileupload/js/jquery.fileupload-fp.js"></script> -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/fileupload/js/jquery.fileupload-ui.js"></script> -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/fileupload/js/jquery.fileupload-jui.js"></script> -->
<!-- jQuery Timepicker -->
<script type="text/javascript" src="includes/jquery/plugins/timepicker/jquery-ui-timepicker-addon.min.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/timepicker/localization/jquery-ui-timepicker-<?php echo substr($langs->getDefaultLang(), 0, 2); ?>.js" defer></script>
<!-- jQuery Other -->
<script type="text/javascript" src="includes/js/jquery.inputmask.min.js" defer></script>
<script type="text/javascript" src="includes/js/jquery.inputmask.extentions.min.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/spinner/ui.spinner.min.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/tagHandler/js/jquery.taghandler.min.js" defer></script>

<!-- END NOLOGIN -->

<!-- jQuery DataTables -->
<script type="text/javascript" src="includes/jquery/plugins/datatables/media/js/jquery.dataTables.min.js" defer></script>
<!-- <script type="text/javascript" src="includes/jquery/plugins/datatables/js/dataTables.plugins.js"></script> -->
<script type="text/javascript" src="includes/jquery/plugins/datatables/extras/ColReorder/media/js/ColReorder.min.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/datatables/extras/ColVis/media/js/ColVis.min.js" defer></script>
<!-- <script type="text/javascript" src="includes/jquery/plugins/datatables/extras/TableTools/media/js/TableTools.min.js" defer></script> -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/datatables/extras/AutoFill/media/js/AutoFill.min.js" defer></script> -->
<script type="text/javascript" src="includes/jquery/plugins/datatables/extras/AjaxReload/media/js/fnReloadAjax.js" defer></script>
<script type="text/javascript" src="includes/jquery/plugins/datatables/extras/DataTables-Editable/media/js/jquery.dataTables.editable.js" defer></script>
<!-- <script type="text/javascript" src="includes/jquery/plugins/datatables/js/initXHR.js"></script> -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/datatables/js/searchColumns.js"></script> -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/datatables/js/ZeroClipboard.js"></script> -->
<!-- jQuery Multiselect -->
<!-- <script type="text/javascript" src="includes/jquery/plugins/multiselect/js/ui.multiselect.js"></script> -->

<!-- HighChart -->
<script type="text/javascript" src="js/lib/highcharts/highcharts.js" defer></script>
<!-- Highstock -->
<!--<script type="text/javascript" src="includes/jquery/plugins/highstock/js/highstock.js" defer></script>-->
<script type="text/javascript" src="js/libs/highcharts/symeos.js" defer></script>

<!-- CKEditor -->
<!--<script type="text/javascript">var CKEDITOR_BASEPATH = '<?php echo DOL_URL_ROOT; ?>/includes/ckeditor/';</script>
<script type="text/javascript" src="includes/ckeditor/ckeditor_basic.js" defer></script>-->

<script type="text/javascript" src="js/setup.js"></script>

<!-- Template functions -->
<script type="text/javascript" src="js/developr.accordions.js"></script>
<script type="text/javascript" src="js/developr.auto-resizing.js"></script>
<script type="text/javascript" src="js/developr.input.js"></script>
<script type="text/javascript" src="js/developr.message.js"></script>
<script type="text/javascript" src="js/developr.modal.js"></script>
<script type="text/javascript" src="js/developr.navigable.js"></script>
<script type="text/javascript" src="js/developr.collapsible.js"></script>
<script type="text/javascript" src="js/developr.notify.js"></script>
<script type="text/javascript" src="js/developr.scroll.js"></script>
<script type="text/javascript" src="js/developr.progress-slider.js"></script>
<script type="text/javascript" src="js/developr.tooltip.js"></script>
<script type="text/javascript" src="js/developr.confirm.js"></script>
<script type="text/javascript" src="js/developr.content-panel.js"></script>
<script type="text/javascript" src="js/developr.agenda.js"></script>
<script type="text/javascript" src="js/developr.tabs.js"></script>		<!-- Must be loaded last -->

<!-- CKEditor -->
<script type="text/javascript" src="js/libs/ckeditor/ckeditor.js"></script>

<!-- Includes specific JS of Speedealing -->
<script type="text/javascript" src="js/lib_head.js" defer></script>

<!-- Tinycon -->
<script src="includes/js/tinycon.min.js"></script>

<script src="/socket.io/socket.io.js"></script>
<script>
	$(document).ready(function() {
		var socket = io.connect();
		socket.on('notify', function(data) {
			notify(data.title, data.message, data.options);
		});
		//socket.emit('user', "<?php echo $user->id;?>");
		//socket.on('refreshTicket', function(data) {
		//});
	});
</script>

<script>
	// Call template init (optional, but faster if called manually)
	$.template.init();

	// Favicon count
	Tinycon.setBubble(<?php echo $count_icon; ?>);

	$(document).ready(function() {
		// Box show/hide/remove
		prth_box_actions.init();
		//* jquery tools tabs
		//prth_tabs.init();
		//* infinite tabs (jquery UI tabs)
		prth_infinite_tabs.init();
	});
</script>

<footer id="footer">
</footer>
