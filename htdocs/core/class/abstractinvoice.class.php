<?php
require_once DOL_DOCUMENT_ROOT . '/core/class/nosqlDocument.class.php';

class AbstractInvoice extends nosqlDocument {

	var $lines = array();

	public function load($id) {
		$res = parent::load($id);

		// Attribuer un id à chaque ligne
		for ($i = 0; $i < count($this->lines); $i++) {
			$this->lines[$i]->id = $i + 1;
		}

		return $res;
	}

	public function record() {

		// ne pas sauvegarder l'id des lignes
		for ($i = 0; $i < count($this->lines); $i++)
			$this->lines[$i]->id = null;

		return parent::record();
	}

	/**
	 *  Update a line in database
	 *
	 *  @param    	int				$rowid            	Id of line to update
	 *  @return   	int              					< 0 if KO, > 0 if OK
	 */
	function updateline($lineid, $line) {
		global $conf;

		$this->lines[$lineid] = new stdClass();
		foreach (get_object_vars($line) as $key => $aRow)
			$this->lines[$lineid]->$key = $aRow;

		$this->lines = array_merge($this->lines);
		$this->update_price();
		return 1;
	}

	/**
	 *  Delete an order line
	 *
	 *  @param      int		$lineid		Id of line to delete
	 *  @return     int        		 	>0 if OK, 0 if nothing to do, <0 if KO
	 */
	function deleteline($lineid) {
		global $user;
		if ($this->Status == "DRAFT") {
			unset($this->lines[$lineid - 1]);
			$this->lines = array_merge($this->lines);

			$this->update_price(1);

			return 1;
		} else {
			return -2;
		}
	}

	function update_price($exclspec = 0, $roundingadjust = -1, $nodatabaseupdate = 0) {

		$this->total_ht = 0;
		$this->total_localtax1 = 0;
		$this->total_localtax2 = 0;
		$this->total_tva = 0;
		$this->total_ttc = 0;

		foreach ($this->lines as $line) {
			$this->total_ht += $line->total_ht;
			$this->total_localtax1 += $line->total_localtax1;
			$this->total_localtax2 += $line->totaltaxt1;
			$this->total_tva += $line->total_tva;
			$this->total_ttc += $line->total_ttc;
		}

		return 1;
	}

	/**
	 *  For menu Add/Remove a datatable
	 *
	 *  @param $ref_css name of #list
	 *  @return string
	 */
	public function datatablesEditLine($ref_css, $title = "") {
		global $langs, $user;

		$class = strtolower(get_class($this));

		if (!$user->rights->$class->edit && !$user->rights->$class->creer)
			return null;

		if (count($this->fk_extrafields->createLine)) {
			print '<form id="' . $ref_css . '_formAddNewRow" class="block" title="' . $title . '">';
			//print '<input type="hidden" name="token" value="' . $_SESSION['newtoken'] . '">';
			print '<input type="hidden" name="json" id="json" value="addline" />';
			print '<input type="hidden" name="fk_invoice" id="fk_invoice" value="' . $this->id . '" />';
			print '<input type="hidden" name="class" id="class" value="' . get_class($this) . '" />';
			foreach ($this->fk_extrafields->createLine as $aRow) {
				print '<p class="button-height block-label">';
				$label = $langs->trans($this->fk_extrafields->fields->$aRow->label);
				if (empty($label))
					$label = $langs->trans($aRow);
				print '<label for = "' . $aRow . '" class="label">' . $label . '</label>';
				print $this->select_fk_extrafields($aRow, $aRow, null, true, 40, "full-width");
				print '</p>';
			}
			print '</form>';

			if ($user->rights->$class->edit || $user->rights->$class->creer) {
				//print '<button id="' . $ref_css . '_btnAddNewRow">' . $langs->trans("Add") . '</button> ';
				$head[0] = new stdClass();
				$head[0]->title = $langs->trans("Add");
				$head[0]->id = $ref_css . '_btnAddNewRow';
				$head[0]->href = "#";
				$head[0]->icon = "icon-pencil";
				$head[0]->onclick = "return false;";
			}
		}

		/* if ($user->rights->$class->delete)
		  print '<button id="' . $ref_css . '_btnDeleteRow">' . $langs->trans("Delete") . '</button>'; */

		//print '<p class="button-height "></p>';

		return $head;
	}

	public function showLines() {

		global $langs;
		global $conf;

		require_once(DOL_DOCUMENT_ROOT . '/product/class/product.class.php');

		switch (get_class($this)) {
			case 'Commande':
				$title = $langs->trans('OrderLines');
				$url = 'commande/fiche.php';
				break;
			case 'Propal':
				$title = $langs->trans('PropalLines');
				$url = 'propal/fiche.php';
				break;
			case 'Facture':
				$title = $langs->trans('FactureLines');
				$url = 'facture/fiche.php';
				break;
		}
		?><div id="listLines"></div>
		<script>
			$(document).ready(function() {
				var crudServiceBaseUrl = "api/commande/lines/list?id=<?php echo $this->id; ?>",
						dataSource = new kendo.data.DataSource({
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
							complete: function(e) {
								$("#grid").data("kendoGrid").dataSource.read();
							}
						},
						parameterMap: function(options, operation) {
							if (operation !== "read" && options.models) {
								return {models: kendo.stringify(options.models)};
							}
						}
					},
					error: function(e) {
						// log error
						alert(e.xhr.responseText);
					},
					batch: true,
					pageSize: 50,
					schema: {
						model: {
							id: "_id",
							fields: {
								_id: {editable: false, nullable: true},
								qty: {type: "text", defaultValue: 1, validation: {required: true}},
								product: {defaultValue: {id: null, name: ""}}
							}
						}
					},
					sort: {field: "group", dir: "asc"},
					group: {field: "group"}
				});
				$("#listLines").kendoGrid({
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
					scrollable: false,
					groupable: false,
					sortable: true,
					//height: 430,
		//			toolbar: [
		//				{
		//					name: "create",
		//					text: "Nouvelle ligne",
		//					className: "k-button k-button-icontext k-grid-add button",
		//				}
		//			],
					columns: [
						{field: "group", title: "Groupe", encoded: false, hidden: true},
						{field: "product", title: "Produit", template: "#if (product) {# #=product.name# #}#"},
						{field: "description", title: "Description"},
						{field: "tva_tx", title: "TVA"},
						{field: "pu_ht", title: "PU HT"},
						{field: "qty", title: "Qte"},
						{field: "remise", title: "Reduc."},
						{field: "total_ht", title: "Total HT"},
						//{command: [{name: "edit", text: {edit: "Editer", update: "Enregistrer", cancel: "Annuler"}}, {name: "destroy", text: "Supp."}], title: "&nbsp;", width: "160px"}
					],
					editable: "popup"
				});
			});
		</script><?php
	}

	/**
	 * return div with total table
	 *
	 *  @return	@string
	 */
	function showAmounts() {
		global $conf, $user, $langs;

		$out = start_box($langs->trans("Summary"), "icon-bag");
		//$out.= '<legend class="anthracite large"><div class="no-margin-bottom left-icon icon-bag">' . $langs->trans("Summary") . '</div></legend>';
		$out.= '<table class="simple-table responsive-table" id="table-amount">
				<!--
        		<thead>
					<tr>
						<th scope="col"><div class="no-margin-bottom red left-icon icon-bag"><h4 class="no-margin-bottom">' . $langs->trans("Summary") . '</h4></div></th>
						<th scope="col" width="40%"></th>
						<th scope="col" width="15%" class="hide-on-mobile-portrait"></th>
					</tr>
				</thead>
				-->
				<tbody>';
		foreach ($this->fk_extrafields->amountsBox as $aRow) {
			$out.= '<tr>
						<th scope="row">';
			if (isset($this->fk_extrafields->fields->$aRow->icon))
				$out.= '<span class="left-icon ' . $this->fk_extrafields->fields->$aRow->icon . '">' . $langs->trans($this->fk_extrafields->fields->$aRow->label) . '</span>';
			else
				$out.= $langs->trans($this->fk_extrafields->fields->$aRow->label);
			$out.= '</th>
						<td align="right">';
			if (isset($this->fk_extrafields->fields->$aRow->cssClass))
				$out.= '<span class="' . $this->fk_extrafields->fields->$aRow->cssClass . '">';
			if ($this->fk_extrafields->fields->$aRow->price)
				$out.= price(price2num($this->$aRow, 'MT'));
				$out.= 0;
			else
				$out.= $this->$aRow;
			if (isset($this->fk_extrafields->fields->$aRow->cssClass))
				$out.= '</span>';
			$out.='</td>
						<td>';
			if ($this->fk_extrafields->fields->$aRow->mode == "absolute")
				$out.= $langs->trans('Currency' . $conf->currency);
			else
				$out.= "%";

			$out.='</td>
					</tr>';
		}
		$out.='</tbody></table>';
		$out.=end_box();

		return $out;
	}

	/**
	 * return address bloc
	 *
	 *  @return	@string
	 */
	function showAddresses() {
		global $conf, $user, $langs;

		//$out = start_box($langs->trans("ContactsAddresses"), "icon-bag");

		$out.= '<div class="standard-tabs">';

		// Tabs
		$out.= '<ul class="tabs">';
		$out.= '<li class="active"><a href="#tab-1">' . $langs->trans('DeliveryAddress') . '</a></li>';
		$out.= '<li><a href="#tab-2">' . $langs->trans('BillingAddress') . '</a></li>';
		$out.= '</ul>';

		// Contents
		$out.= '<div class="tabs-content">';

		$out.= '<div id="tab-1" class="with-padding">';
		$out.= '<br><br><br><br>Delivery address content<br><br><br><br>';
		$out.= '</div>';

		$out.= '<div id="tab-2" class="with-padding">';
		$out.= '<br><br><br><<br>Billing address content<br><br><br><br>';
		$out.= '</div>';

		$out.= '</div>';
		$out.= '</div>';

		//$out.= end_box();

		return $out;
	}

}

class Line {

	var $rowid;
	var $desc;
	var $pu;
	var $qty;
	var $remise_percent;
	var $tva_tx;
	var $price_base_type = 'HT';
	var $info_bits = 0;
	var $date_start = '';
	var $date_end = '';
	var $type = 0;
	var $fk_parent_line = 0;
	var $skip_update_total = 0;
	var $fk_fournprice = null;
	var $pa_ht = 0;
	var $label = '';
	var $group = '';

	function __construct() {
		//TODO Load extrafields
	}

	function load($line) {
		if (is_object($line))
			foreach ($line as $key => $row)
				$this->$key = $row;
	}

	function verify() {
		// Clean parameters
		if (empty($this->qty))
			$this->qty = 0;
		if (empty($this->info_bits))
			$this->info_bits = 0;
		if (empty($this->tva_tx))
			$this->tva_tx = 0;
		if (empty($this->remise))
			$this->remise = 0;
		if (empty($this->remise_percent))
			$this->remise_percent = 0;
		$this->remise_percent = price2num($this->remise_percent);
		$this->qty = price2num($this->qty);
		if ($this->price_base_type == 'HT')
			$this->pu = price2num($this->pu_ht);
		else
			$this->pu = price2num($this->pu_ttc);

		$this->pa_ht = price2num($this->pa_ht);
		$this->tva_tx = price2num($this->tva_tx);

		// Calcul du total TTC et de la TVA pour la ligne a partir de
		// qty, pu, remise_percent et tva_tx
		// TRES IMPORTANT: C'est au moment de l'insertion ligne qu'on doit stocker
		// la part ht, tva et ttc, et ce au niveau de la ligne qui a son propre taux tva.
		$this->calcul_price_total();

		return 1;
	}

	function calcul_price_total() {
		global $conf, $mysoc;

		// initialize total (may be HT or TTC depending on price_base_type)
		$tot_sans_remise = $this->pu * $this->qty;
		$tot_avec_remise_ligne = $tot_sans_remise * (1 - ($this->remise_percent_ligne / 100));
		$tot_avec_remise = $tot_avec_remise_ligne * (1 - ($this->remise_percent_global / 100));

		// initialize result
		$this->total_tva = 0;
		$this->total_ttc = 0;

		if ($this->price_base_type == 'HT') {
			// We work to define prices using the price without tax
			$this->total_ht_without_discount = $tot_sans_remise;
			$this->total_ttc_without_discount = $tot_sans_remise * (1 + ( (($this->info_bits & 1) ? 0 : $this->tva_tx) / 100)); // Selon TVA NPR ou non
			$result8bis = $tot_sans_remise * (1 + ( $this->tva_tx / 100)); // Si TVA consideree normale (non NPR)
			$this->total_vat_without_discount = $result8bis - ($this->total_ht_without_discount);

			$this->total_ht = $tot_avec_remise;
			$this->total_ttc = $tot_avec_remise * (1 + ( (($this->info_bits & 1) ? 0 : $this->tva_tx) / 100)); // Selon TVA NPR ou non
			$result2bis = $tot_avec_remise * (1 + ( $this->tva_tx / 100)); // Si TVA consideree normale (non NPR)
			$this->total_tva = $result2bis - ($this->total_ht); // Total VAT = TTC - (HT + localtax)

			$this->pu_ht = $this->pu;
			$this->pu_ttc = $this->pu * (1 + ((($this->info_bits & 1) ? 0 : $this->tva_tx) / 100)); // Selon TVA NPR ou non
			$result5bis = $this->pu * (1 + ($this->tva_tx / 100)); // Si TVA consideree normale (non NPR)
			$this->pu_tva = $result5bis - ($this->pu_ht);
		} else {
			// We work to define prices using the price with tax
			$this->total_ttc_without_discount = $tot_sans_remise;
			$this->total_ht_without_discount = $tot_sans_remise / (1 + ((($this->info_bits & 1) ? 0 : $this->tva_tx) / 100)); // Selon TVA NPR ou non
			$result6bis = $tot_sans_remise / (1 + ($this->tva_tx / 100)); // Si TVA consideree normale (non NPR)
			$this->total_vat_without_discount = $this->total_ttc_without_discount - ($result6bis );

			$this->total_ttc = $tot_avec_remise;
			$this->total_ht = $tot_avec_remise / (1 + ((($this->info_bits & 1) ? 0 : $this->tva_tx) / 100)); // Selon TVA NPR ou non
			$result0bis = $tot_avec_remise / (1 + ($this->tva_tx / 100)); // Si TVA consideree normale (non NPR)
			$this->total_tva = $this->total_ttc - ($result0bis ); // Total VAT = TTC - HT

			$this->pu_ttc = $this->pu;
			$this->pu_ht = $this->pu / (1 + ((($this->info_bits & 1) ? 0 : $this->tva_tx) / 100)); // Selon TVA NPR ou non
			$result3bis = $this->pu / (1 + ($this->tva_tx / 100)); // Si TVA consideree normale (non NPR)
			$this->pu_tva = $this->pu_ttc - $result3bis;
		}

		//If price is 'TTC' we need to have the totals without VAT for a correct calculation
		if ($this->price_base_type == 'TTC') {
			$tot_sans_remise = $tot_sans_remise / (1 + ($this->tva_tx / 100));
			$tot_avec_remise = $tot_avec_remise / (1 + ($this->tva_tx / 100));
		}

		// If rounding is not using base 10 (rare)
		if (!empty($conf->global->MAIN_ROUNDING_RULE_TOT)) {
			if ($this->price_base_type == 'HT') {
				$this->total_ht = round($this->total_ht / $conf->global->MAIN_ROUNDING_RULE_TOT, 0) * $conf->global->MAIN_ROUNDING_RULE_TOT;
				$this->total_tva = round($this->total_tva / $conf->global->MAIN_ROUNDING_RULE_TOT, 0) * $conf->global->MAIN_ROUNDING_RULE_TOT;
				$this->total_ttc = price2num($this->total_ht + $this->total_tva, 'MT');
			} else {
				$this->total_tva = round($this->total_tva / $conf->global->MAIN_ROUNDING_RULE_TOT, 0) * $conf->global->MAIN_ROUNDING_RULE_TOT;
				$this->total_ttc = round($this->total_ttc / $conf->global->MAIN_ROUNDING_RULE_TOT, 0) * $conf->global->MAIN_ROUNDING_RULE_TOT;
				$this->total_ht = price2num($this->total_ttc - $this->total_ht, 'MT');
			}
		}

		//print "Price.lib::calcul_price_total ".$this->total_ht."-".$this->total_tva."-".$this->total_ttc
	}

}
?>
