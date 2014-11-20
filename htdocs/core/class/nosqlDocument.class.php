<?php
/* Copyright (C) 2011-2013	Herve Prot		<herve.prot@symeos.com>
 * Copyright (C) 2012-2013	Regis Houssin	<regis.houssin@capnetworks.com>
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

require_once DOL_DOCUMENT_ROOT . '/core/class/commonobject.class.php';

/**
 * 	Parent class of all other business classes (invoices, contracts, proposals, orders, ...)
 */
abstract class nosqlDocument extends CommonObject {

	protected $couchdb; // TODO must to be private !!!!!
	public $mongodb;
	public $id;
	public $error;
	public $errors;
	public $canvas; // Contains canvas name if it is
	public $fk_extrafields;
	public $no_save = array("no_save", "global", "token", "id", "fk_extrafields", "couchdb", "mongodb", "db",
		"error", "errors", "childtables", "table_element", "element", "fk_element", "ismultientitymanaged",
		"dbversion", "oldcopy", "state", "country", "status", "statut", "import_key", "couchAdmin",
		"all_permissions_are_loaded", "right", "type2label", "class");

	/**
	 * 	class constructor
	 *
	 * 	@param	couchClient	$db		Database handler
	 */
	function __construct($db = null) {
		$this->class = get_class($this);
		$this->db = $db;

		$this->useDatabase();
	}

	/**
	 * load couchdb parameters
	 * @param	$dbname		string			name of database
	 * @return int
	 *
	 */
	public function useDatabase($dbname = "") {
		global $conf, $couch, $mongo, $mongodb;

		if (empty($this->couchdb) && is_object($couch)) {
			$this->couchdb = clone $couch;
		}

		if (!empty($dbname) && is_object($couch)) {
			$this->couchdb->useDatabase($dbname);
			$mongodb = $mongo->$dbname;
		}

		$collection = get_class($this);
		if (!empty($collection))
			$this->mongodb = $mongodb->$collection;
	}

	/**
	 *
	 * @param unknown $rowid
	 * @return number
	 */
	function fetch($rowid) { // old dolibarr rowid
		if (is_int($rowid)) {
			try {
				$result = $this->getView("rowid", array("key" => intval($rowid)));
				$this->load($result->rows[0]->value);
			} catch (Exception $e) {
				$this->error = "Fetch : Something weird happened: " . $e->getMessage() . " (errcode=" . $e->getCode() . ")\n";
				dol_print_error($this->db, $this->error);
				return 0;
			}
		} else {
			try {
				$this->load($rowid);
			} catch (Exception $e) {
				$this->error = "Fetch : Something weird happened: " . $e->getMessage() . " (errcode=" . $e->getCode() . ")\n";
				dol_print_error($this->db, $this->error);
				return 0;
			}
		}


		return 1;
	}

	/**
	 *
	 * @param unknown $id
	 * @return number
	 */
	function simpleFetch($id) {
		global $conf;

		// Clean parametersadmin
		$id = trim($id);

		try {
			$this->values = $this->couchdb->getDoc($id);
		} catch (Exception $e) {
			return 0;
		}

		return 1;
	}

	/**
	 *
	 * @param unknown $user
	 * @return Ambigous <object, boolean, NULL, unknown, mixed, multitype:>
	 */
	function update($user) {
		if ($this->id) // only update
			$this->UserUpdate = $user->login;
		else { // Create
			$this->UserCreate = $user->login;
			$this->UserUpdate = $user->login;
		}

		return $this->record();
	}

	/**
	 * 	Set a value and modify type for couchdb
	 * @param string $key
	 * @param string $value
	 */
	public function set($key, $value) {

		//if (isset($this->fk_extrafields->fields->$key->schema))
		//	settype($value, $this->fk_extrafields->fields->$key->settype);

		$this->$key = $value;

		if (is_object($this->_id))
			$id = new MongoId($this->_id->{'$id'});
		elseif (strlen($this->_id) == 24 && isset($this->fk_extrafields->fields->_id->schema) && ($this->fk_extrafields->fields->_id->schema == "ObjectId" || $this->fk_extrafields->fields->_id->schema->type == "ObjectId"))
			$id = new MongoId($this->_id);
		else
			$id = $this->_id;

		return $this->mongodb->update(array('_id' => $id), array('$set' => array($key => $value)));

		//return $this->couchdb->updateDoc(get_class($this), "in-place", $params, $this->id);
	}

	/**
	 * 	Get a value from a key
	 * @param string $key
	 * @return value
	 */
	public function get($key) {
		return $this->values->$key;
	}

	/**
	 * 	load a $id document in values
	 * @param $id
	 * @return $value
	 */
	public function load($id, $cache = false) {
		global $conf;

		$cache = false; // disable cache

		require_once DOL_DOCUMENT_ROOT . '/core/lib/memory.lib.php';

		$values = array();
		$found = false;

		if ($cache && !empty($conf->memcached)) {
			$values = dol_getcache($id);
			if (is_object($values)) {
				$found = true;
			}
		}

		if (!$found && !empty($id)) {
			//$values = $this->couchdb->getDoc($id); // load extrafields for class
			//if($this->Extrafields->fields->_id->settype == "ObjectId")
			//	$id = new MongoId($id);

			//error_log(print_r($id, true));

			if (is_object($id))
				$id = new MongoId($id->{'$id'});
			elseif (strlen($id) == 24 && isset($this->fk_extrafields->fields->_id->schema) && ($this->fk_extrafields->fields->_id->schema == "ObjectId" || $this->fk_extrafields->fields->_id->schema->type == "ObjectId"))
				$id = new MongoId($id);

			//error_log(print_r($this->fk_extrafields->fields, true));
			//error_log(print_r($id, true));
			$values = $this->mongodb->findOne(array('_id' => $id));

			if ($cache && !empty($conf->memcached)) {
				dol_setcache($id, $values);
			}
		}
		//print $id;
		//print_r($values);

		if (!empty($values)) {
			$values = json_decode(json_encode($values), FALSE); // convert Array to object

			$this->id = $id;

			foreach (get_object_vars($values) as $key => $aRow)
				$this->$key = $aRow;
		}

		return $values;
	}

	/**
	 * save values object document
	 *
	 * @param	bool	$cache	if true remove element from cache
	 * @return 	object			value of storeDoc
	 */
	public function record($cache = false) {
		global $conf, $user;

		$values = new stdClass();

		foreach (get_object_vars($this) as $key => $aRow)
			if (!in_array($key, $this->no_save)) {
				$values->$key = $aRow;
				if (isset($this->fk_extrafields->fields->$key->schema))
					if ($key == "updatedAt" || $this->fk_extrafields->fields->$key->schema && ($this->fk_extrafields->fields->$key->schema == "Date" || $this->fk_extrafields->fields->$key->schema->type == "Date")) { // transtypage
						if (is_string($values->$key))
							$values->$key = new MongoDate(strtotime($values->$key));
						else
							$values->$key = new MongoDate($values->$key->sec);
					} elseif ($this->fk_extrafields->fields->$key->schema && ($this->fk_extrafields->fields->$key->schema == "ObjectId" || $this->fk_extrafields->fields->$key->schema->type == "ObjectId" )) {
						if (is_string($values->$key)) {
							$values->$key = new MongoId($values->$key);
						} else {
							$values->_id = new MongoId($values->$key->{'$id'}); // re-encode mongoId
						}
					}
				//else
				//	settype($values->$key, $this->fk_extrafields->fields->$key->settype);
				// If empty set default value
				if (empty($values->$key) && isset($this->fk_extrafields->fields->$key->default))
					$values->$key = $this->fk_extrafields->fields->$key->default;
			}

		//$values->id = $this->id;
		//print_r($this->_id->{'$id'});exit;

		/* if (!empty($this->_id))
		  if (is_string($this->_id)) {
		  $values->_id = $this->_id;
		  } else if (is_object($this->_id) && isset($this->_id->{'$id'})) {
		  $values->_id = new MongoId($this->_id->{'$id'}); // re-encode mongoId
		  } */

		$values->updatedAt = new MongoDate(strtotime(dol_now()));

		// Specific for users
		/* if (get_class($this) == "User")
		  unset($values->rights);
		  else
		  $values->entity = $conf->Couchdb->name;
		 */
		// Save Status and TMS for history
		if (isset($this->fk_extrafields) && $this->fk_extrafields->history) {
			if (!isset($values->history))
				$values->history = array();

			$history = new stdClass();
			$history->date = $values->tms;
			$history->author = new stdClass();
			$history->author->id = $user->id;
			$history->author->name = $user->name;
			$history->Status = $values->Status;
			$history->rev = $values->_rev;

			$values->history[] = $history;
		}

		try {
			$this->clean($values);
			if (empty($values->_id))
				$this->mongodb->insert($values);
			else
				$this->mongodb->save($values);

			if (is_string($values->_id)) {
				$result = $values->_id;
			} else if (is_object($values->_id) && isset($values->_id->{'$id'})) {
				$result = $values->_id->{'$id'};
				$this->_id = $values->_id->{'$id'};
			}

			if ($cache && !empty($conf->memcached)) {
				dol_setcache($this->id, $values);
			}
		} catch (Exception $e) {
			dol_print_error("", $e->getMessage());
			exit;
		}

		return $result;
	}

	/**
	 * 	save values objects documents
	 *  @param	$obj		array of objects
	 *  @return value of storeDoc
	 */
	public function storeDocs($obj) {
		$this->couchdb->clean($obj);
		return $this->couchdb->storeDocs($obj);
	}

	/**
	 * 	delete values objects documents
	 *  @param	$obj		array of objects
	 *  @return value of storeDoc
	 */
	public function deleteDocs($obj) {
		return $this->couchdb->deleteDocs($obj);
	}

	/**
	 * 	save values of one object documents
	 *  @param	$obj		object
	 *  @return value of storeDoc
	 */
	public function getDoc($obj) {
		return $this->couchdb->getDoc($obj);
	}

	/**
	 * 	save values of one object documents
	 *  @param	$obj		object
	 *  @return value of storeDoc
	 */
	public function storeDoc($obj) {
		return $this->couchdb->storeDoc($obj);
	}

	/**
	 * 	delete a object document
	 *  @param	$obj		object
	 *  @return value of storeDoc
	 */
	public function deleteDoc($obj = null) {
		if (empty($obj)) {
			$obj = new stdClass();
			if (is_object($this->_id))
				$obj->_id = new MongoId($this->id());
			else
				$obj->_id = $this->id();
		} else {
			if (is_object($obj->_id))
				$obj->_id = new MongoId($obj->id());
			else
				$obj->_id = $obj->id();
		}

		return $this->mongodb->remove(array("_id" => $obj->_id));
	}

	/**
	 * delete object
	 */
	public function delete($force = false) {
		if (!empty($this->_id)) {
			if ($force)
				return $this->deleteDoc($this);
			else {
				return $this->set("trash", true);
			}
		}
	}

	/**
	 * 	store a file in document
	 *  @param	$name		Name of the variable
	 *  @return value of storeAttachment
	 */
	public function storeFile($name = 'addedfile', $cache = false) {
		global $_FILES, $mongo;

		$db = $mongo->files;

		// GridFS
		$grid = $db->getGridFS();

		$image = $grid->findOne(
				array("metadata" => array("filename" => $_FILES[$name]['name'], "class" => get_class($this), "id" => $this->id()))
		);

		//print_r($image->file['_id']->{'$id'});

		if (!empty($image)) // remove old image
			$grid->remove(
					array("_id" => new MongoId($image->file['_id']->{'$id'}))
			);

		$result = $grid->storeFile($_FILES[$name]['tmp_name'], array("metadata" => array("filename" => $_FILES[$name]['name'], "class" => get_class($this), "id" => $this->id()), "contentType" => $_FILES[$name]['type'], "filename" => $_FILES[$name]['name']));
		//print $result;
		//exit;
		if ($cache)
			dol_delcache($this->id);

		return 1;
	}

	/**
	 * 	delete a file in document
	 *  @param	$filename		name of the file
	 *  @return value of storeAttachment
	 */
	public function deleteFile($filename, $cache = false) {
		global $mongo;

		$db = $mongo->files;

		// GridFS
		$grid = $db->getGridFS();

		$image = $grid->findOne(
				array("metadata" => array("filename" => $filename, "class" => get_class($this), "id" => $this->id()))
		);

		if (!empty($image)) // remove old image
			$grid->remove(
					array("_id" => new MongoId($image->file['_id']->{'$id'}))
			);

		if ($cache)
			dol_delcache($this->id);

		return 1;
	}

	/**
	 * 	Return id of document
	 * @return string
	 */
	public function id() {
		if (empty($this->_id))
			$this->_id = $this->id;

		if (is_object($this->_id))
			return $this->_id->{'$id'};
		else
			return $this->_id;
	}

	/** Call a view on couchdb
	 *
	 * @param	$name			string			name of the view
	 * @param	$params			array			params ['group'],['level'],['key'],...
	 * @param	$cache			bool			load from cache
	 * @return  array
	 */
	public function getView($name, $params = array(), $cache = false) {
		global $conf;

		$found = false;

		if ($cache) {
			$result = dol_getcache(get_class($this) . ":" . $name);
			if (is_object($result)) {
				$found = true;
			}
		}

		if (!$found) {
			$result = new stdClass();
			try {
				if (is_array($params))
					$this->couchdb->setQueryParameters($params);

				$result = $this->couchdb->getView(get_class($this), $name);

				if ($cache) {
					dol_setcache(get_class($this) . ":" . $name, $result);
				}
			} catch (Exception $e) {
				error_log($e->getMessage());
				$result->total_rows = 0;
			}
		}

		return $result;
	}

	/** Call an Indexed view with lucene on couchdb
	 *
	 * @param	$name			string			name of the view
	 * @param	$params			array			params ['group'],['level'],['key'],...
	 * @return  array
	 */
	public function getIndexedView($name, $params = array()) {
		global $conf;

		$result = new stdClass();
		try {
			/* if (!empty($conf->view_limit))
			  $params['limit'] = $conf->global->MAIN_SIZE_LISTE_LIMIT; */
			//$params['limit'] = $conf->view_limit;

			$params['include_docs'] = true;
			$this->couchdb->setQueryParameters($params);

			$result = $this->couchdb->getIndexedView(get_class($this), $name);
		} catch (Exception $e) {
			error_log($e->getMessage());
			$result->total_rows = 0;
		}

		return $result;
	}

	/**
	 *    Return label of status (activity, closed)
	 *
	 *    @return   string        		Libelle
	 */
	function getLibStatus($key = "Status") {
		return $this->LibStatus($this->$key, array("key" => $key));
	}

	/**
	 * returns a/some universally unique identifier(s)
	 *
	 *
	 * @param integer $count the number of uuids to return
	 * @return array|false an array of uuids on success, false on failure.
	 */
	public function getUuids($count) {
		return $this->couchdb->getUuids($count);
	}

	/**
	 *    Flush the cache
	 * 	@param		$id					key to delete, nothing flush_all
	 *  @return		string        		Libelle
	 */
	function flush($id = '') {
		if (!empty($id))
			return dol_delcache($id);
		else
			return dol_flushcache();
	}

	/**
	 *  Renvoi le libelle d'un statut donne
	 *
	 *  @param	int		$statut				Id statut
	 *  @param  date	$expiration_date	Automatic Status with an expiration date (expired or actived)
	 *  @return	string						Libelle du statut
	 */
	function LibStatus($status, $params = array()) {
		global $langs, $conf;

		if (empty($params["key"]))
			$key = "Status";
		else
			$key = $params["key"];

		if (empty($status))
			$status = $this->fk_extrafields->fields->$key->default;

		if (isset($params["dateEnd"]) && isset($this->fk_extrafields->fields->$key->values->$status->dateEnd)) {
			if ($params["dateEnd"] < dol_now())
				$status = $this->fk_extrafields->fields->$key->values->$status->dateEnd[0];
			else
				$status = $this->fk_extrafields->fields->$key->values->$status->dateEnd[1];
		}

		if (isset($this->fk_extrafields->fields->$key->values->$status->label))
			$label = $langs->trans($this->fk_extrafields->fields->$key->values->$status->label);
		else
			$label = $langs->trans($status);

		if (isset($params["maxlen"]))
			$label = dol_trunc($label, $params["maxlen"]);

		if ($this->fk_extrafields->fields->$key->status) // Is a type status with defined color
			$color = $this->fk_extrafields->fields->$key->values->$status->cssClass;
		else
			$color = "anthracite-gradient";

		return '<small class="tag ' . $color . ' glossy">' . $label . '</small> ';
	}

	/**
	 *  For menu Add/Remove a datatable
	 *
	 *  @param $ref_css name of #list
	 *  @return string
	 */
	public function datatablesEdit($ref_css, $title = "") {
		global $langs, $user;

		$class = strtolower(get_class($this));

		if (!$user->rights->$class->edit && !$user->rights->$class->creer)
			return null;

		if (count($this->fk_extrafields->createList)) {
			print '<form id="' . $ref_css . '_formAddNewRow" class="block" title="' . $title . '">';
			//print '<input type="hidden" name="token" value="' . $_SESSION['newtoken'] . '">';
			print '<input type="hidden" name="json" id="json" value="add" />';
			print '<input type="hidden" name="class" id="class" value="' . get_class($this) . '" />';
			foreach ($this->fk_extrafields->createList as $aRow) {
				print '<p class="button-height block-label">';
				$label = $langs->trans($this->fk_extrafields->fields->$aRow->label);
				if (empty($label))
					$label = $langs->trans($aRow);
				print '<label for = "' . $aRow . '" class="label">' . $label . '</label>';
				print $this->select_fk_extrafields($aRow, $aRow, null, true, 40, "full-width");
				print '</p>';
			}
			print '</form>';

			if ($user->rights->$class->edit || $user->rights->$class->creer)
				print '<button id="' . $ref_css . '_btnAddNewRow">' . $langs->trans("Add") . '</button> ';
		}

		/* if ($user->rights->$class->delete)
		  print '<button id="' . $ref_css . '_btnDeleteRow">' . $langs->trans("Delete") . '</button>'; */

		print '<p class="button-height "></p>';
	}

	/**
	 *  For Generate a datatable
	 *
	 *  @param $obj object of aocolumns parameters
	 *  @param $ref_css name of #list
	 *  @return string
	 */
	public function datatablesCreate($obj, $ref_css, $json = false, $ColSearch = false) {
		global $conf, $langs, $user;

		$class = strtolower(get_class($this));
		?>
		<script type="text/javascript" charset="utf-8">
			$(document).ready(function() {
			var oTable = $('#<?php echo $ref_css ?>').dataTable({
			"aoColumns" : [
		<?php
		$nb = count($obj->aoColumns);
		foreach ($obj->aoColumns as $i => $aRow):
			?>
				{
			<?php foreach ($aRow as $key => $fields): ?>
				<?php if ($key == "mDataProp" || $key == "sClass" || $key == "sDefaultContent" || $key == "sType" || $key == "sWidth") : ?>
						"<?php echo $key; ?>":"<?php echo $fields; ?>",
				<?php elseif ($key == "fnRender") : ?>
						"<?php echo $key; ?>": <?php echo $fields; ?>,
				<?php else : ?>
						"<?php echo $key; ?>": <?php echo ($fields ? "true" : "false"); ?>,
				<?php endif; ?>
				<?php
			endforeach;
			if ($nb - 1 == $i)
				echo "}";
			else
				echo"},";
			?>
		<?php endforeach; ?>
			],
		<?php if (!isset($obj->aaSorting)) : ?>
				"aaSorting" : [[1, "asc"]],
		<?php else : ?>
				"aaSorting" : <?php echo json_encode($obj->aaSorting); ?>,
		<?php endif; ?>
		<?php if ($json) : ?>
				"sServerMethod": 'POST',
			<?php if (!empty($obj->sAjaxSource)): ?>
					"sAjaxSource": "<?php echo $obj->sAjaxSource; ?>",
			<?php else : ?>
					"sAjaxSource" : "<?php echo DOL_URL_ROOT . '/core/ajax/listdatatables.php'; ?>?json=list&bServerSide=<?php echo $obj->bServerSide; ?>&class=<?php echo get_class($this); ?>",
			<?php endif; ?>
			<?php if (!empty($obj->aoAjaxData)): ?>
					"fnServerData": function (sSource, aoData, fnCallback) {
					$.ajax({
					"dataType": 'json',
							"type": "POST",
							"url": sSource,
							"data": <?php echo $obj->aoAjaxData; ?>,
							"success": fnCallback
					})
					},
			<?php endif; ?>
		<?php endif; ?>
		<?php if (!empty($obj->iDisplayLength)): ?>
				"iDisplayLength": <?php echo $obj->iDisplayLength; ?>,
		<?php else : ?>
				"iDisplayLength": <?php echo (int) $conf->global->MAIN_SIZE_LISTE_LIMIT; ?>,
		<?php endif; ?>
			"aLengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
					"bProcessing": true,
					"bJQueryUI": true,
					"bAutoWidth": false,
					/*"sScrollY": "500px",
					 "oScroller": {
					 "loadingIndicator": true
					 },*/
		<?php if ($obj->bServerSide) : ?>
				"bServerSide": true,
		<?php else : ?>
				"bServerSide": false,
		<?php endif; ?>
			"bDeferRender": true,
					"oLanguage": { "sUrl": "<?php echo DOL_URL_ROOT . '/core/js/datatables.js.php?lang=' . ($langs->defaultlang ? $langs->defaultlang : "en_US"); ?>"},
					/*$obj->sDom = '<\"top\"Tflpi<\"clear\">>rt<\"bottom\"pi<\"clear\">>';*/
					/*$obj->sPaginationType = 'full_numbers';*/
					/*$obj->sDom = 'TC<\"clear\">lfrtip';*/
					"oColVis": { "buttonText" : 'Voir/Cacher',
					"aiExclude": [0, 1] // Not cacheable _id and name
			},
					//$obj->oColVis->bRestore = true;
					//$obj->oColVis->sAlign = 'left';

					// Avec export Excel
		<?php if (!empty($obj->sDom)) : ?>
				//"sDom": "Cl<fr>t<\"clear\"rtip>",
				"sDom": "<?php echo $obj->sDom; ?>",
		<?php else : ?>
				//"sDom": "C<\"clear\"fr>lt<\"clear\"rtip>",
				"sDom": "<\"dataTables_header\"lfr>t<\"dataTables_footer\"ip>",
						//"sDom": "C<\"clear\"fr>tiS",
						//"sDom": "TC<\"clear\"fr>lt<\"clear\"rtip>",
		<?php endif; ?>
			// bottons
		<?php if ($obj->oTableTools->aButtons != null) : ?>
				"oTableTools" : { "aButtons": [
			<?php foreach ($obj->oTableTools->aButtons as $i => $aRow): ?>
				<?php if (is_array($aRow)): ?>
						{
					<?php foreach ($aRow as $key => $fields): ?>
						<?php if ($key == "fnClick" || $key == "fnAjaxComplete") : ?>
								"<?php echo $key; ?>": <?php echo $fields; ?>,
						<?php else : ?>
								"<?php echo $key; ?>":"<?php echo $fields; ?>",
						<?php endif; ?>
					<?php endforeach; ?>
						},
				<?php else : ?>
						{
						"sExtends": "<?php echo $aRow; ?>",
								"sFieldBoundary": '"',
								//"sFieldSeperator": "-",
								"sCharSet": "utf8",
								"sFileName": "export.csv",
								"bSelectedOnly": false
						},
				<?php endif; ?>
			<?php endforeach; ?>
				],
						"sSwfPath": "<?php echo DOL_URL_ROOT . '/includes/jquery/plugins/datatables/extras/TableTools/media/swf/copy_csv_xls.swf'; ?>",
						"sRowSelect": "multi"
				},
		<?php endif; ?>
		<?php if (isset($obj->fnRowCallback)): ?>
				"fnRowCallback": <?php echo $obj->fnRowCallback; ?>,
		<?php endif; ?>
		<?php if (isset($obj->fnFooterCallback)): ?>
				"fnFooterCallback": <?php echo $obj->fnFooterCallback; ?>,
		<?php endif; ?>
		<?php if (!defined('NOLOGIN')) : ?>
			<?php if (isset($obj->fnDrawCallback)): ?>
					"fnDrawCallback": <?php echo $obj->fnDrawCallback; ?>,
			<?php endif; ?>
		<?php endif; ?>
		<?php if (!$obj->disableEditInPlace && ($user->rights->$class->edit || $user->rights->$class->creer || $user->admin)) : ?>
				}).makeEditable({
				sUpdateURL: urlSaveInPlace,
						sAddURL: urlAddInPlace,
						"aoColumns": [<?php
			$nb = count($obj->aoColumns);
			foreach ($obj->aoColumns as $i => $aRow) {
				$idx = $aRow->mDataProp;
				if (isset($aRow->bVisible) && $aRow->bVisible == false)
					continue;

				if (!empty($idx) && $aRow->editable && isset($this->fk_extrafields->fields->$idx->type)) {
					print "{";
					//print "event:'click',";
					print "indicator: indicatorInPlace,";
					print "tooltip: tooltipInPlace,";
					print "placeholder : '',";
					print "submit: submitInPlace,";
					print "onblur: 'cancel',";
					print "height: '14px',";
					//print 'ajaxoptions: {"dataType":"json"},';
					switch ($this->fk_extrafields->fields->$idx->type) {
						case "select" :
							print "type: 'select',";
							print "loadurl : urlLoadInPlace,";
							?>loaddata: function (value, settings) {
								return {
								"id": oTable.fnGetData(this.parentNode, 0),
										"element_class" : "<?php echo get_class($this); ?>",
										"type":"select",
										"key": "editval_<?php echo $idx; ?>"
								};
								},<?php
							break;
						case "text":
							print "type: 'text',";
							break;
						case "date":
							print "type: 'datepicker',";
							print "cancel: cancelInPlace,";
							break;
						default :
							print "type: 'text',";
							break;
					}
					?>submitdata: function (value, settings) {
						return { "id": oTable.fnGetData(this.parentNode, 0),
								"element_class" : "<?php echo get_class($this); ?>",
								"type": "<?php echo $this->fk_extrafields->fields->$idx->type; ?>",
								"key": "editval_<?php echo $idx; ?>"
						};
						},
								callback: function(sValue, y) {
						//var aPos = oTable.fnGetPosition( this );
						//oTable.fnAddData( sValue, aPos[0], aPos[1] ); // doesn't work with server-side
						//oTable.fnDraw();
						$(this).html(sValue);
						},<?php
					if (isset($this->fk_extrafields->fields->$idx->validate)) {
						print 'oValidationOptions : { rules:{ value: {';

						foreach ($this->fk_extrafields->fields->$idx->validate as $key => $value)
							if ($key != "cssclass")
								print $key . ":" . $value . ",";

						print '} } },';
						if (isset($this->fk_extrafields->fields->$idx->validate->cssclass))
							print 'cssclass: "' . $this->fk_extrafields->fields->$idx->validate->cssclass . '",';
					}
					print "},";
				}
				else
					print "null,";
			}
			?>
				],
						fnOnNewRowPosted: function(data) {
				var rtn = oTable.fnAddData(JSON.parse(data));
						return true;
				},
						fnOnAdding: function() {
				oTable.fnDraw(false);
						return true;
				},
						oAddNewRowOkButtonOptions: {
				label: "<?php echo $langs->trans("Create"); ?>",
						icons: { primary: 'ui-icon-check' },
						name: "action",
						value: "add-new"
				},
						oAddNewRowCancelButtonOptions: {
				label: "<?php echo $langs->trans("Undo"); ?>",
						class: "back-class",
						name: "action",
						value: "cancel-add",
						icons: { primary: 'ui-icon-close' }
				},
						oAddNewRowFormOptions: {
				show: "blind",
						hide: "blind"
				},
						sAddNewRowFormId: "<?php echo $ref_css ?>_formAddNewRow",
						sAddNewRowButtonId: "<?php echo $ref_css ?>_btnAddNewRow",
						sAddNewRowOkButtonId: "<?php echo $ref_css ?>_btnAddNewRowOk",
						sAddNewRowCancelButtonId: "<?php echo $ref_css ?>_btnAddNewRowCancel",
						sDeleteRowButtonId: "<?php echo $ref_css ?>_btnDeleteRow"
		<?php endif; ?>
			});
		<?php if ($ColSearch) : ?>
				$("tfoot input").keyup(function () {
				/* Filter on the column */
				var id = $(this).parent().attr("id");
						oTable.fnFilter(this.value, id);
				});
						/*send selected level value to server */
						$("tfoot #level").change(function () {
				/* Filter on the column */
				var id = $(this).parent().attr("id");
						var value = $(this).val();
						oTable.fnFilter(value, id);
				});
						/*send selected stcomm value to server */
						$("tfoot .flat").change(function () {
				/* Filter on the column */
				var id = $(this).parent().attr("id");
						var value = $(this).val();
						oTable.fnFilter(value, id);
				});
		<?php endif; ?>
			// Select_all
			$('.chSel_all').click(function () {
			$(this).closest('table').find('input[name=row_sel]').attr('checked', this.checked);
			});
					$("tbody tr td .delEnqBtn").on('click', function(){
			var aPos = oTable.fnGetPosition(this.parentNode);
					var aData = oTable.fnGetData(aPos[0]);
					if (aData["name"] === undefined)
					var text = aData["label"];
					else
					var text = aData["name"];
					var answer = confirm("<?php echo $langs->trans("Delete"); ?> '" + text + "' ?");
					if (answer) {
			$.ajax({
			type: "POST",
					url: "<?php echo DOL_URL_ROOT . '/core/ajax/deleteinplace.php'; ?>",
					data: "json=delete&class=<?php echo get_class($this); ?>&id=" + aData["_id"],
					success: function(msg){
			oTable.fnDeleteRow(aPos[0]);
			}
			});
			}
			return false;
			});
			});
		</script>
		<?php
//$output.= "});"; // ATTENTION AUTOFILL NOT COMPATIBLE WITH COLVIS !!!!
		/* $output.= 'new AutoFill( oTable, {
		  "aoColumnDefs": [
		  {
		  "bEnable":false,
		  "aTargets": [ 0,1,2,3,5,6,8]
		  },
		  {
		  "fnCallback": function ( ao ) {
		  var n = document.getElementById(\'output\');
		  for ( var i=0, iLen=ao.length ; i<iLen ; i++ ) {
		  n.innerHTML += "Update: old value: {"+
		  ao[i].oldValue+"} - new value: {"+ao[i].newValue+"}<br>";
		  }
		  n.scrollTop = n.scrollHeight;
		  },
		  "bEnable" : true,
		  "aTargets": [ 4,7 ]
		  }]
		  } );'; */

		return;
	}

	/**
	 * 	Contruct a HTML From for a fields
	 *
	 * 	@param	array	$aRow		parameter of the field
	 * 	@param	string	$key		Name of the field
	 * 	@param	string	$cssClass	CSS Classe for the form
	 * 	@return	string
	 */
	public function form($aRow, $key, $cssClass) {
		global $langs, $conf;

		$form = new Form($this->db);

		$rtr = "";

		if ($aRow->enable) {
			$rtr.= '<div class="formRow elVal">' . "\n";

			$label = $langs->transcountry($key, $this->Country);
			if (!$label)
				$label = $langs->trans($key);

			$rtr.= '<label for="' . $key . '">' . $label . '</label>' . "\n";
			switch ($aRow->type) {
				case "textarea" :
					$rtr.= '<textarea maxlength="' . $aRow->length . '" class="' . $cssClass . '" id="' . $key . '" name="' . $key . '" cols="1" rows="4">' . $this->$key . '</textarea>';
					$rtr.= '<script> $(document).ready(function() { $("#' . $key . '").counter({ goal: 120 });});	</script>';
					break;
				case "select" :
					if ($cssClass == "small")
						$style = "width:200px;";
					else
						$style = "width:400px;";
					$rtr.= '<select data-placeholder="' . $langs->trans($key) . '&hellip;" class="chzn-select expand" style="' . $style . '" id="' . $key . '" name="' . $key . '" >';
					if (isset($aRow->dict)) {
						require_once(DOL_DOCUMENT_ROOT . "/admin/class/dict.class.php");
						// load from dictionnary
						try {
							$dict = new Dict($this->db);
							$values = $dict->load($aRow->dict, true);
							//filter for country
							foreach ($values->values as $idx => $row) {
								if (empty($row->pays_code) || $this->Country == $row->pays_code)
									$aRow->values[$idx] = $row;
							}
						} catch (Exception $e) {
							dol_print_error('', $e->getMessage());
						}
					}
					if (empty($this->$key))
						$this->$key = $aRow->default;

					foreach ($aRow->values as $idx => $row) {
						if ($row->enable) {
							$rtr.= '<option value="' . $idx . '"';

							if ($this->$key == $idx)
								$rtr.= ' selected="selected"';

							$rtr.= '>';

							if (isset($row->label))
								$rtr.= $langs->trans($row->label);
							else
								$rtr.= $langs->trans($idx);
							$rtr.='</option>';
						}
					}

					$rtr.= '</select>';

					break;
				case "checkbox" :
					if (isset($this->$key))
						$value = $this->$key;
					else
						$value = $aRow->default;

					if ($value)
						$rtr.= '<input type="checkbox" id="' . $key . '" name="' . $key . '" checked="checked"/>';
					else
						$rtr.= '<input type="checkbox" id="' . $key . '" name="' . $key . '" />';
					break;
				case "uploadfile" :
					$rtr.= '<input type="file" class="flat" name="' . $key . '" id="' . $key . '">';
					break;
				default :
					if (isset($aRow->mask))
						$rtr.= '<input type="text" maxlength="' . $aRow->length . '" id="' . $key . '" name="' . $key . '" value="' . $this->$key . '" class="input-text ' . $aRow->css . " " . $cssClass . '" mask="' . $key . '"/>' . "\n";
					else
						$rtr.= '<input type="text" maxlength="' . $aRow->length . '" id="' . $key . '" name="' . $key . '" value="' . $this->$key . '" class="input-text ' . $aRow->css . " " . $cssClass . '"/>' . "\n";
			}
			$rtr.= '</div>' . "\n";
		}
		return $rtr;
	}

	/**
	 *  For Generate fnRender param for a datatable parameter
	 *
	 *  @param $obj object of aocolumns parameters
	 *  @param $ref_css name of #list
	 *  @return string
	 */
	public function datatablesFnRender($key, $type, $params = array()) {
		global $langs, $conf;

		switch ($type) {
			case "url":
				if (empty($params['url'])) // default url
					$url = strtolower(get_class($this)) . '/fiche.php?id=';
				else
					$url = $params['url'];

				if (empty($params['id']))
					$params['id'] = "_id";

				$rtr = 'function(obj) {
	 		var ar = [];
			';
				if (strpos($key, ".") > 0)
					$rtr.='if(obj.aData.' . substr($key, 0, strpos($key, ".")) . '=== undefined)
							return ar.join("");
	 		if(obj.aData.' . $key . ' === undefined)
				if(obj.aData.' . $params["id"] . ' === undefined)
					return ar.join("");
				else
					obj.aData.' . $key . ' = obj.aData.' . $params["id"] . ';
			';

				if (!empty($this->fk_extrafields->ico)) {
					$rtr.= 'ar[ar.length] = "<span class=\"' . $this->fk_extrafields->ico . '\" title=\"' . $langs->trans("See " . get_class($this)) . ' : " + obj.aData.' . (!empty($params['title']) ? $params['title'] : $key) . ' + "\">";';
				}

				$rtr.= 'if(obj.aData.' . $params["id"] . ' === undefined) {
					ar[ar.length] = "<span>";
					ar[ar.length] = obj.aData.' . $key . '.toString();
				ar[ar.length] = "</span>";
				} else {
					ar[ar.length] = "<a href=\"' . $url . '";
				ar[ar.length] = obj.aData.' . $params["id"] . ';
					ar[ar.length] = "\">";
					ar[ar.length] = obj.aData.' . $key . '.toString();
				ar[ar.length] = "</a>";
				}
				var str = ar.join("");
				return str;
			}';
				break;

			case "email":
				$rtr = 'function(obj) {
					var ar = [];
					if(obj.aData.' . $key . ' === undefined)
					return ar.join("");

					ar[ar.length] = "<a href=\"mailto:";
					ar[ar.length] = obj.aData.' . $key . '.toString();
					ar[ar.length] = "\">";
					ar[ar.length] = obj.aData.' . $key . '.toString();
					ar[ar.length] = "</a>";
					var str = ar.join("");
					return str;
			}';
				break;

			case "date":
				$rtr = 'function(obj) {
					if(obj.aData.' . $key . ')
					{
					var date = new Date(obj.aData.' . $key . ' * 1000);
			return date.toLocaleDateString();
			}
	 		else
	 		return null;
			}';
				break;

			case "datetime" :
				$rtr = 'function(obj) {
			if(obj.aData.' . $key . ')
			{
				var date = new Date(obj.aData.' . $key . ' * 1000);
	 		return date.toLocaleDateString() +" "+date.toLocaleTimeString();
			}
	 		else
	 		return null;
			}';
				break;

			case "status":
				$rtr = 'function(obj) {
			var now = Math.round(+new Date());
			var status = new Array();
			var expire = new Array();
			var statusDateEnd = "";
			var stat = obj.aData.' . $key . ';
			if(stat === undefined)
				stat = "' . $this->fk_extrafields->fields->$key->default . '";';


				if (!empty($this->fk_extrafields->fields->$key->values)) {
					foreach ($this->fk_extrafields->fields->$key->values as $key1 => $aRow) {
						if (isset($aRow->label))
							$rtr.= 'status["' . $key1 . '"]= new Array("' . $langs->trans($aRow->label) . '","' . $aRow->cssClass . '");';
						else
							$rtr.= 'status["' . $key1 . '"]= new Array("' . $langs->trans($key1) . '","' . $aRow->cssClass . '");';
						if (isset($aRow->dateEnd)) {
							$rtr.= 'expire["' . $key1 . '"]="' . $aRow->dateEnd . '";';
						}
					}
				}

				if (isset($params["dateEnd"])) {
					$rtr.= 'if(obj.aData.' . $params["dateEnd"] . ' === undefined)
				obj.aData.' . $params["dateEnd"] . ' = "";';
					$rtr.= 'if(obj.aData.' . $params["dateEnd"] . ' != ""){';
					$rtr.= 'var dateEnd = new Date(obj.aData.' . $params["dateEnd"] . '*1000).getTime();';
					$rtr.= 'if(dateEnd < now)';
					$rtr.= 'if(expire[stat] !== undefined)
				stat = expire[stat];';
					$rtr.= '}';
				}
				$rtr.= 'if(status[stat]===undefined)
					stat = "ERROR";';

				$rtr.= 'var ar = [];
		ar[ar.length] = "<small class=\"tag ";
		ar[ar.length] = status[stat][1];
		ar[ar.length] = " glossy\">";
		ar[ar.length] = status[stat][0];
		ar[ar.length] = "</small>";
		var str = ar.join("");
		return str;
			}';
				break;

			case "attachment" :
				$url_server = "/db/" . $this->couchdb->getDatabaseName();

				$rtr = 'function(obj) {
			var ar = [];
			ar[ar.length] = "<img src=\"theme/' . $conf->theme . $this->fk_extrafields->ico . '\" border=\"0\" alt=\"' . $langs->trans("See " . get_class($this)) . ' : ";
			ar[ar.length] = obj.aData.' . $key . '.toString();
				ar[ar.length] = "\" title=\"' . $langs->trans("See " . get_class($this)) . ' : ";
			ar[ar.length] = obj.aData.' . $key . '.toString();
				ar[ar.length] = "\"></a> <a href=\"' . $url_server . '/";
				ar[ar.length] = obj.aData._id;
				ar[ar.length] = "/";
				ar[ar.length] = obj.aData.' . $key . '.toString();
	 		ar[ar.length] = "\">";
	 		ar[ar.length] = obj.aData.' . $key . '.toString();
			ar[ar.length] = "</a>";
			var str = ar.join("");
			return str;
			}';
				break;

			case "sizeMo":
				$rtr = 'function(obj) {
				var ar = [];
	 		if(obj.aData.' . $key . ')
	 		{
				var size = obj.aData.' . $key . '/1000000;
			size = (Math.round(size*100))/100;
			ar[ar.length] = size;
			ar[ar.length] = " Mo";
			var str = ar.join("");
			return str;
			}
			else
			{
			ar[ar.length] = "0 Mo";
			var str = ar.join("");
			return str;
			}
			}';
				break;

			case "price":
				$rtr = 'function(obj) {
						var ar = [];
						if(obj.aData.' . $key . ' === undefined || obj.aData.' . $key . ' == "") {
							var str = ar.join("");
							return str;
                        } else {
						var price = obj.aData.' . $key . ';
						price = ((Math.round(price*100))/100).toFixed(2);
						ar[ar.length] = price;
						ar[ar.length] = " €";
						var str = ar.join("");
						return str;
			}
			}';
				break;

			case "pourcentage":
				$rtr = 'function(obj) {
	 		var ar = [];
	 		if(obj.aData.' . $key . ')
	 		{
				var total = obj.aData.' . $key . ';
				price = ((Math.round(total*100))/100).toFixed(2);
				ar[ar.length] = total;
				ar[ar.length] = " %";
				var str = ar.join("");
				return str;
			}
	 		else
	 		{
				ar[ar.length] = "0.00 %";
				var str = ar.join("");
				return str;
			}
			}';
				break;

			case "tag":
				$rtr = 'function(obj) {
					var ar = [];

					if(typeof(obj.aData.' . $key . ')=="string") {
						ar[ar.length] = "<small class=\"tag anthracite-gradient glossy";
						ar[ar.length] = " \">";
						ar[ar.length] = obj.aData.' . $key . '.toString();
						ar[ar.length] = "</small> ";
                    } else {
						for (var i in obj.aData.' . $key . ') {
							ar[ar.length] = "<small class=\"tag anthracite-gradient glossy";
							ar[ar.length] = " \">";
							ar[ar.length] = obj.aData.' . $key . '[i].toString();
							ar[ar.length] = "</small> ";
                        }
					}
					var str = ar.join("");
					return str;
			}';
				break;

			case "array":
				$rtr = 'function(obj) {
					var ar = [];

					for (var i=0; i<obj.aData.' . $key . '.length; i++) {
							ar[ar.length] = "<small class=\"tag grey-gradient glossy";
							ar[ar.length] = " \">";
							ar[ar.length] = obj.aData.' . $key . '[i].name.toString();
							ar[ar.length] = "</small> ";
                        }
					var str = ar.join("");
					return str;
			}';
				break;

			default :
				dol_print_error($db, "Type of fnRender must be url, date, datetime, attachment or status");
				exit;
		}

		return $rtr;
	}

	/**
	 *  For Generate function param for a kendo UI
	 *
	 *  @param $obj object of aocolumns parameters
	 *  @param $ref_css name of #list
	 *  @return string
	 */
	public function kendoTemplateJS($key, $type, $params = array()) {
		global $langs, $conf;

		switch ($type) {
			case "url":
				if (empty($params['url'])) // default url
					$url = strtolower(get_class($this)) . '/fiche.php?id=';
				else
					$url = $params['url'];

				if (empty($params['id']))
					$params['id'] = "_id";

				$rtr = 'function(obj) {
	 		var ar = [];
			if(obj.' . $key . ' === undefined)
				return "";
			';
				if (strpos($key, ".") > 0)
					$rtr.='if(obj.' . substr($key, 0, strpos($key, ".")) . '=== undefined)
							return ar.join("");
	 		if(obj.' . $key . ' === undefined)
				if(obj.' . $params["id"] . ' === undefined)
					return ar.join("");
				else
					obj.' . $key . ' = obj.' . $params["id"] . ';
			';

				if (!empty($this->fk_extrafields->ico)) {
					$rtr.= 'ar[ar.length] = "<span class=\"' . $this->fk_extrafields->ico . '\" title=\"' . $langs->trans("See " . get_class($this)) . ' : " + obj.' . (!empty($params['title']) ? $params['title'] : $key) . ' + "\">";';
				}

				$rtr.= 'if(obj.' . $params["id"] . ' === undefined) {
					ar[ar.length] = "<span>";
					ar[ar.length] = obj.' . $key . '.toString();
				ar[ar.length] = "</span>";
				} else {
					ar[ar.length] = "<a href=\"' . $url . '";
				ar[ar.length] = obj.' . $params["id"] . ';
					ar[ar.length] = "\">";
					ar[ar.length] = obj.' . $key . '.toString();
				ar[ar.length] = "</a>";
				}
				var str = ar.join("");
				return str;
			}';
				break;

			case "email":
				$rtr = 'function(obj) {
					var ar = [];
					if(obj.' . $key . ' === undefined)
					return ar.join("");

					ar[ar.length] = "<a href=\"mailto:";
					ar[ar.length] = obj.' . $key . '.toString();
					ar[ar.length] = "\">";
					ar[ar.length] = obj.' . $key . '.toString();
					ar[ar.length] = "</a>";
					var str = ar.join("");
					return str;
			}';
				break;

			case "date":
				$rtr = 'function(obj) {
					if(obj.' . $key . ')
					{
					var date = new Date(Date.parse(obj.' . $key . '));
			return date.toLocaleDateString();
			}
	 		else
	 		return null;
			}';
				break;

			case "datetime" :
				$rtr = 'function(obj) {
			if(obj.' . $key . ')
			{
				var date = new Date(obj.' . $key . ');
	 		return date.toLocaleDateString() +" "+date.toLocaleTimeString();
			}
	 		else
	 		return null;
			}';
				break;

			case "status":
				$rtr = 'function(obj) {
			var now = Math.round(+new Date());
			var status = new Array();
			var expire = new Array();
			var statusDateEnd = "";
			var stat = obj.' . $key . ';
			if(stat === undefined)
				stat = "' . $this->fk_extrafields->fields->$key->default . '";';


				if (!empty($this->fk_extrafields->fields->$key->values)) {
					foreach ($this->fk_extrafields->fields->$key->values as $key1 => $aRow) {
						if (isset($aRow->label))
							$rtr.= 'status["' . $key1 . '"]= new Array("' . $langs->trans($aRow->label) . '","' . $aRow->cssClass . '");';
						else
							$rtr.= 'status["' . $key1 . '"]= new Array("' . $langs->trans($key1) . '","' . $aRow->cssClass . '");';
						if (isset($aRow->dateEnd)) {
							$rtr.= 'expire["' . $key1 . '"]="' . $aRow->dateEnd . '";';
						}
					}
				}

				if (isset($params["dateEnd"])) {
					$rtr.= 'if(obj.aData.' . $params["dateEnd"] . ' === undefined)
				obj.aData.' . $params["dateEnd"] . ' = "";';
					$rtr.= 'if(obj.aData.' . $params["dateEnd"] . ' != ""){';
					$rtr.= 'var dateEnd = new Date(obj.' . $params["dateEnd"] . ').getTime();';
					$rtr.= 'if(dateEnd < now)';
					$rtr.= 'if(expire[stat] !== undefined)
				stat = expire[stat];';
					$rtr.= '}';
				}
				$rtr.= 'if(status[stat]===undefined)
					stat = "ERROR";';

				$rtr.= 'var ar = [];
		ar[ar.length] = "<small class=\"tag ";
		ar[ar.length] = status[stat][1];
		ar[ar.length] = " glossy\">";
		ar[ar.length] = status[stat][0];
		ar[ar.length] = "</small>";
		var str = ar.join("");
		return str;
			}';
				break;

			case "attachment" :
				$url_server = "/db/" . $this->couchdb->getDatabaseName();

				$rtr = 'function(obj) {
			var ar = [];
			ar[ar.length] = "<img src=\"theme/' . $conf->theme . $this->fk_extrafields->ico . '\" border=\"0\" alt=\"' . $langs->trans("See " . get_class($this)) . ' : ";
			ar[ar.length] = obj.aData.' . $key . '.toString();
				ar[ar.length] = "\" title=\"' . $langs->trans("See " . get_class($this)) . ' : ";
			ar[ar.length] = obj.aData.' . $key . '.toString();
				ar[ar.length] = "\"></a> <a href=\"' . $url_server . '/";
				ar[ar.length] = obj.aData._id;
				ar[ar.length] = "/";
				ar[ar.length] = obj.aData.' . $key . '.toString();
	 		ar[ar.length] = "\">";
	 		ar[ar.length] = obj.aData.' . $key . '.toString();
			ar[ar.length] = "</a>";
			var str = ar.join("");
			return str;
			}';
				break;

			case "sizeMo":
				$rtr = 'function(obj) {
				var ar = [];
	 		if(obj.aData.' . $key . ')
	 		{
				var size = obj.aData.' . $key . '/1000000;
			size = (Math.round(size*100))/100;
			ar[ar.length] = size;
			ar[ar.length] = " Mo";
			var str = ar.join("");
			return str;
			}
			else
			{
			ar[ar.length] = "0 Mo";
			var str = ar.join("");
			return str;
			}
			}';
				break;

			case "price":
				$rtr = 'function(obj) {
						var ar = [];
						if(obj.aData.' . $key . ' === undefined || obj.aData.' . $key . ' == "") {
							var str = ar.join("");
							return str;
                        } else {
						var price = obj.aData.' . $key . ';
						price = ((Math.round(price*100))/100).toFixed(2);
						ar[ar.length] = price;
						ar[ar.length] = " €";
						var str = ar.join("");
						return str;
			}
			}';
				break;

			case "pourcentage":
				$rtr = 'function(obj) {
	 		var ar = [];
	 		if(obj.aData.' . $key . ')
	 		{
				var total = obj.aData.' . $key . ';
				price = ((Math.round(total*100))/100).toFixed(2);
				ar[ar.length] = total;
				ar[ar.length] = " %";
				var str = ar.join("");
				return str;
			}
	 		else
	 		{
				ar[ar.length] = "0.00 %";
				var str = ar.join("");
				return str;
			}
			}';
				break;

			case "tag":
				$rtr = 'function(obj) {
					var ar = [];

					if(typeof(obj.' . $key . ')=="string") {
						ar[ar.length] = "<small class=\"tag anthracite-gradient glossy";
						ar[ar.length] = " \">";
						ar[ar.length] = obj.' . $key . '.toString();
						ar[ar.length] = "</small> ";
                    } else {
						for (var i in obj.' . $key . ') {
							ar[ar.length] = "<small class=\"tag anthracite-gradient glossy";
							ar[ar.length] = " \">";
							ar[ar.length] = obj.' . $key . '[i].toString();
							ar[ar.length] = "</small> ";
                        }
					}
					var str = ar.join("");
					return str;
			}';
				break;

			default :
				dol_print_error($db, "Type of fnRender must be url, date, datetime, attachment or status");
				exit;
		}

		return $rtr;
	}

	/**
	 * Function for ajax inbox to create an new object
	 * @param	$url	string		url of the create page
	 * @return string
	 */
	/* public function buttonCreate($url) {
	  global $langs;

	  print '<a href="#fd_input" class="gh_button pill icon add" id="fd3">' . $langs->trans("Create") . '</a>';
	  ?>
	  <div style="display:none">
	  <div id="inlineDialog">
	  <div id="fd_input">
	  <div class="fd3_pane">
	  <form action="<?php echo $url; ?>" class="nice" style="width:220px">
	  <label><?php echo $this->fk_extrafields->labelCreate; ?></label>
	  <input type="text" class="input-text fd3_name_input expand" name="id" />
	  <a href="#" class="gh_button small pill fd3_submit">Create</a>
	  </form>
	  </div>
	  </div>
	  </div>
	  </div>
	  <?php ?>
	  <script type="text/javascript" charset="utf-8">
	  $(document).ready(function() {
	  $("#fd3").fancybox({
	  'overlayOpacity'	: '0.2',
	  'transitionIn'		: 'elastic',
	  'transitionOut'		: 'fade',
	  'onCleanup'			: function() {
	  if($('.fd3_pane:first').is(':hidden')){$('.fd3_pane').toggle();$.fancybox.resize();}
	  $('.fd3_pane label.error').remove();
	  }
	  });
	  });
	  </script>
	  <?php
	  return 1;
	  } */

	/**
	 * Compare function for sorting two aaData rows in datatable
	 */
	public function sortDatatable(&$array, $key, $dir) {
		if ($dir == "desc")
			usort($array, function($a, $b) use ($key) {
						return $a->$key > $b->$key ? -1 : 1;
					});
		else
			usort($array, function($a, $b) use ($key) {
						return $a->$key > $b->$key ? 1 : -1;
					});
	}

	/**
	 * 	Show object list
	 *
	 * 	@param	string	$view	Requested view
	 */
	public function showList($query, $aaSorting = array(1, 'asc')) {

		require DOL_DOCUMENT_ROOT . '/core/class/autoloader.php';

		//$data_source = "core/ajax/listdatatables.php?json=list&class=" . get_class($this) . "&bServerSide=true";
		$data_source = "core/ajax/listdatatables.php?json=list";
		$table = new datatables\Datatables(compact('data_source'));
		$table->setSchema(new datatables\schemas\DefaultSchema);
		$table->setConfig('object_class', get_class($this));
		$table->setConfig('aoAjaxData', $query);
		$table->setParam('aaSorting', array($aaSorting));

		// Add default plugins
		$table->plug(new datatables\plugins\Localization);

		// Add plugins defined in database
		if (!empty($this->fk_extrafields->pluginsList)) {
			foreach ($this->fk_extrafields->pluginsList as $plugin) {
				$classname = 'datatables\plugins\\' . $plugin;
				if (class_exists($classname))
					$table->plug(new $classname);
			}
		}

		// render view
		//var_dump(compact('table'));
		return $table->render();
	}

	/**
	 *  Return list of tags in an object
	 *
	 *  @return 	array	List of types of members
	 */
	function listTag() {
		global $conf, $langs;

		$list = array();

		$result = $this->getView('tag', array("group" => true));

		if (count($result->rows) > 0)
			foreach ($result->rows as $aRow) {
				$list[] = $langs->trans($aRow->key);
			}

		return $list;
	}

	/**
	 *    	Renvoie tags list clicable (avec eventuellement le picto)
	 *
	 * 		@param		int		$withpicto		0=Pas de picto, 1=Inclut le picto dans le lien, 2=Picto seul
	 * 		@param		int		$maxlen			length max libelle
	 * 		@return		string					String with URL
	 */
	function getTagUrl($withpicto = 0, $maxlen = 0) {
		global $langs;

		$result = '';

		if (count($this->Tag)) {
			for ($i = 0; $i < count($this->Tag); $i++) {
				if (get_class($this) == "Adherent") {
					$lien = '<a href="' . DOL_URL_ROOT . '/adherent/type.php?id=' . $this->Tag[$i] . '">';
					$lienfin = '</a> ';
				} else {
					$lien = '<small>';
					$lienfin = '</small> ';
				}

				$picto = 'group';
				$label = $langs->trans("ShowTypeCard", $this->Tag[$i]);

				if ($withpicto)
					$result.=($lien . img_object($label, $picto) . $lienfin);
				if ($withpicto && $withpicto != 2)
					$result.=' ';
				$result.=$lien . ($maxlen ? dol_trunc($this->Tag[$i], $maxlen) : $this->Tag[$i]) . $lienfin;
			}
		}
		return $result;
	}

	/**
	 *    	Renvoie tags list clicable (avec eventuellement le picto)
	 *
	 * 		@param		int		$withpicto		0=Pas de picto, 1=Inclut le picto dans le lien, 2=Picto seul
	 * 		@param		int		$maxlen			length max libelle
	 * 		@return		string					String with URL
	 */
	function LibTag($values, $params = array()) {
		global $langs, $conf;

		if (empty($params["key"]))
			$key = "Tag";
		else
			$key = $params["key"];

		$result = '';

		if (count($values)) {
			for ($i = 0; $i < count($values); $i++) {
				$result.= $this->LibStatus($values[$i], $params);
			}
		}
		return $result;
	}

	function directory($key) {
		$couchdb = clone $this->couchdb;
		$couchdb->useDatabase("directory");

		$couchdb->setQueryParameters(array("key" => $key));
		$result = $couchdb->getView("Directory", "mail");

		return $result->rows[0]->value;
	}

	/**
	 *    	Print a select HTML for fields in extrafields
	 *
	 * 		@param		string		$key            name of the field
	 * 		@param		string		$htmlname	HTML name
	 * 		@param		string		$value          if needed : value of the key
	 * 		@param		int		$lengh          max number of characters in label select
	 * 		@param		boolean         $returnIndex    return index or value from select
	 *          @param          string          $cssClass       Specific css class for input "ex. full-width"
	 * 		@return		string		String with URL
	 */
	function select_fk_extrafields($key, $htmlname, $value = null, $returnIndex = true, $lengh = 40, $cssClass = "") {
		global $langs, $mysoc, $mongodb;

		$aRow = $this->fk_extrafields->fields->$key;

		if (isset($aRow->label))
			$title = $langs->trans($aRow->label);
		else
			$title = $langs->trans($key);

		switch ($aRow->type) {
			case "select" :

				if (GETPOST($htmlname))
					$selected = GETPOST($htmlname);
				elseif (!empty($value)) // Using value from the function
					$selected = $value;
				else
					$selected = $this->$key;

				$rtr = "";
				$rtr.= '<select data-placeholder="' . $title . '&hellip;" data-select-options=\'{"searchText":"Rechercher"}\' class="select compact expandable-list ' . $aRow->validate->cssclass . ' ' . $aRow->cssClass . '" id="' . $htmlname . '" name="' . $htmlname . '" ' . ($aRow->multiple ? 'multiple' : '') . '>';
				if (isset($aRow->mongo)) { // Check collection
					$class = $aRow->mongo->collection;
					//$object = new $class($this->db);

					/* $params = array();
					  if (count($aRow->params))
					  foreach ($aRow->params as $idx => $row) {
					  eval("\$row = $row;");
					  if (!empty($row))
					  $params[$idx] = $row;
					  } */
					try {
						//$result = $object->getView($aRow->view, $params);
						/**
						 * Execute Query for filter
						 */
						$query = $aRow->mongo->query;

						if ($query) {
							foreach ($query as $option => $v)
								if (is_string($v) && strpos($v, '$') !== false) {
									eval("\$v = $v;");
									if (is_object($v))
										$v = new MongoId($v->{'$id'});

									$query->$option = $v;
								}
							$result = $mongodb->$class->{$aRow->mongo->method}($query);
						}
						else
							$result = $mongodb->$class->{$aRow->mongo->method}();

						if ($aRow->mongo->order)
							$result->sort((array) $aRow->mongo->order);
					} catch (Exception $e) {
						$this->error = "Fetch : Something weird happened: " . $e->getMessage() . " (errcode=" . $e->getCode() . ")\n";
						dol_print_error($this->db, $this->error);
						return 0;
					}

					$aRow->values[0] = new stdClass();
					$aRow->values[0]->label = "-";
					$aRow->values[0]->enable = true;

					if (!empty($result)) {
						while ($result->hasNext()) {
							$row = (object) $result->getNext();
							if (is_object($row->_id))
								$row->_id = $row->_id->{'$id'};

							//print($row->name);
							$aRow->values[$row->_id] = new stdClass();
							$aRow->values[$row->_id]->label = $row->name;
							$aRow->values[$row->_id]->enable = true;
						}
					}

					$selected = $this->$key->id; // Index of key

					if (is_object($selected))
						$selected = $selected->{'$id'};
				}

				if (empty($selected)) {
					if (!empty($aRow->default))
						eval('$selected = ' . $aRow->default . ';');
				}


				if (count($aRow->values)) {
					foreach ($aRow->values as $idx => $row) {
						$enable = $row->enable;

						// Apply filter
						if ($enable && !$row->default && count($aRow->filters)) {
							foreach ($aRow->filters as $keyf => $rowf) {
								if ($this->$rowf != $row->$keyf)
									$enable = false;
							}
						}
						if ($enable) {
							if (!empty($row->label))
								$tab_result[$idx] = dol_trunc($langs->trans($row->label), $lengh);
							else
								$tab_result[$idx] = dol_trunc($langs->trans($idx), $lengh);
						}
					}

					// Tri
					if ($aRow->sort) {
						asort($tab_result);
					}

					foreach ($tab_result as $idx => $row) {

						if ($returnIndex)
							$rtr.= '<option value="' . $idx . '"';
						else
							$rtr.= '<option value="' . $row . '"';

						if ($returnIndex) {
							if ($selected == $idx)
								$rtr.= ' selected="selected"';
						} else {
							if ($selected == $row)
								$rtr.= ' selected="selected"';
						}

						$rtr.= '>';

						$rtr.= $row;
						$rtr.='</option>';
					}
				}
				$rtr.= '</select>';

				break;

			case "text":
				$rtr .= '<input type="text" name="' . $htmlname . '" id="' . $htmlname . '" class="input ' . $cssClass . " " . $aRow->validate->cssclass . '" value="' . $this->$key . '" placeholder="' . $title . '"/>';
				break;

			case "textarea":
				$rtr .= '<textarea name="' . $htmlname . '" id="' . $htmlname . '" class="input ' . $cssClass . " " . $aRow->validate->cssclass . '" placeholder="' . $title . '">' . $this->$key . '</textarea>';
				break;

			case "date":
				$rtr .= '<input type="text" class="input ' . $cssClass . " " . $aRow->validate->cssclass . '" name="' . $htmlname . '" id="' . $htmlname . '" value="' . $this->print_fk_extrafields($key) . '" placeholder="' . $title . '"/>';
				$rtr .= '<script>$("input#' . $htmlname . '").datepicker();</script>';
				break;

			case "datetime":
				$rtr .= '<input type="text" class="input ' . $cssClass . " " . $aRow->validate->cssclass . '" name="' . $htmlname . '" id="' . $htmlname . '" value="' . $this->print_fk_extrafields($key) . '" placeholder="' . $title . '"/>';
				$rtr .= '<script>$("input#' . $htmlname . '").datetimepicker();</script>';
				break;
		}

		return $rtr;
	}

	/**
	 *    	Print a value field from extrafields
	 *
	 * 		@param		string		$key            name of the field
	 * 		@return		string		String with URL
	 */
	function print_fk_extrafields($key) {
		global $langs;

		$aRow = $this->fk_extrafields->fields->$key;
		$value = $this->$key;
		if (empty($this->$key))
			return null;

		if ($aRow->type != "date" && is_object($this->$key) && empty($this->$key->id))
			return null;

		if (isset($aRow->mongo) && empty($aRow->getkey)) { // Is an object
			$class = $aRow->mongo->collection;
			dol_include_once("/" . strtolower($class) . "/class/" . strtolower($class) . ".class.php");
			$object = new $class($this->db);
			$object->name = $this->$key->name;
			$object->id = $this->$key->id;
			return $object->getNomUrl(1);
		} elseif (isset($aRow->status)) { // Is a status
			return $this->LibStatus($value, array("key" => $key));
		}
		$out = "";
		switch ($aRow->type) {
			case "select":
				if (isset($aRow->values->$value->label)) {
					$out.= $langs->trans($aRow->values->$value->label);
				} else {
					if (!is_array($value))
					//print_r($value);
						$out.= $langs->trans($value);
				}
				break;
			case "text":
				$out.= $value;
				break;
			case "textarea":
				$out.= $value;
				break;
			case "email":
				$out.= '<a href="mailto:' . $value . '">' . $value . '</a>';
				break;
			case "date":
				$out .= dol_print_date(date("c", $value->sec), "%d/%m/%Y");
				break;
			case "datetime":
				$out .= dol_print_date(date("c", $value->sec), "%d/%m/%Y");
				break;
			case "image":
				if (!empty($value))
					$out.='<img alt="' . $aRow->alt . '" border="0" width="' . $aRow->width . '" src="' . $this->getFile($value) . '">';
				else
					$out.='<img alt="No photo" border="0" width="' . $aRow->width . '" src="' . DOL_URL_ROOT . '/theme/common/nophoto.jpg">';
				break;
		}

		return $out;
	}

	/**
	 * return div with block note
	 *
	 *  @return	@string
	 */
	function show_notes($edit = true) {
		global $conf, $user, $langs;

		//$out = start_box($langs->trans("Notes"), "icon-info-round");

		if (count($this->notes) == 0)
			return "";

		$out.= '<div class="standard-tabs">';

		// Tabs
		$out.= '<ul class="tabs">';
		for ($i = 0; $i < count($this->notes); $i++) {
			$out.= '<li class="active"><a href="#tab-notes-' . $i . '">' . $langs->trans($this->notes[$i]->title) . '</a></li>';
		}
		$out.= '</ul>';

		// Contents
		$out.= '<div class="tabs-content">';
		for ($i = 0; $i < count($this->notes); $i++) {
			$out.= '<div id="tab-notes-' . $i . '" class="with-padding">';

			// Notes
			if ($this->notes[$i]->edit) {
				$out.= '<input id="element_id_notes" type="hidden" value="' . $this->id . '"/>';
				$out.= '<input id="element_idx_notes" type="hidden" value="' . $this->notes[$i]->title . '"/>';
				$out.= '<input id="element_class_notes" type="hidden" value="' . get_class($this) . '"/>';
				$out.= '<div class="wrapped no-margin-bottom left-icon icon-info-round">';
				$out.= '<div id="editval_notes" class="edit_wysiwyg with-tooltip">';
				$out.= $this->notes[$i]->note . '</div>';
				$out.= '</div>';
			} else {
				$out.= '<div class="wrapped no-margin-bottom left-icon icon-info-round">';
				$out.= $this->notes[$i]->note;
				$out.= '</div>';
			}

			$out.= '</div>';
		}

		$out.= '</div>';
		$out.= '</div>';

		//$out.= end_box();

		return $out;
	}

	/**
	 * Test if an object is changed before a record()
	 * return boolean
	 */
	function isChanged($oldObj) {
		$change = false;
		if (is_object($oldObj)) {
			if (get_class($this) != get_class($oldObj))
				return true;
		}
		else
			return true;

		foreach ($this->fk_extrafields->fields as $key => $aRow) {
			if ($this->$key != $oldObj->$key)
				$change = true;
		}
		return $change;
	}

	/**
	 *  Show history record
	 *
	 *  @param	int		$max		Max nb of records
	 *  @return	void
	 */
	function show_history($max = 5) {
		global $langs, $conf, $user, $db, $bc;

		$titre = $langs->trans("History");
		print start_box($titre, "icon-calendar");

		$i = 0;
		$obj = new stdClass();
		$societe = new Societe($this->db);

		print '<table class="display dt_act" id="history_datatable" >';
		// Ligne des titres

		print '<thead>';
		print'<tr>';
		print'<th class="essential">';
		print $langs->trans("Date");
		print'</th>';
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "date";
		$obj->aoColumns[$i]->bUseRendered = false;
		$obj->aoColumns[$i]->bSearchable = true;
		$obj->aoColumns[$i]->fnRender = $this->datatablesFnRender("date", "datetime");
		$i++;
		print'<th class="essential">';
		print $langs->trans('User');
		print'</th>';
		$userstatic = new User();
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "author";
		$obj->aoColumns[$i]->sDefaultContent = "";
		$obj->aoColumns[$i]->fnRender = $userstatic->datatablesFnRender("author.name", "url", array('id' => "author.id"));
		$i++;

		print'<th class="essential">';
		print $langs->trans("Status");
		print'</th>';
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "Status";
		$obj->aoColumns[$i]->sClass = "center";

		$obj->aoColumns[$i]->sDefaultContent = "ERROR";
		$obj->aoColumns[$i]->fnRender = $this->datatablesFnRender("Status", "status");
		$i++;
		print '</tr>';
		print '</thead>';
		print'<tfoot>';
		print'</tfoot>';
		print'<tbody>';
		print'</tbody>';
		print "</table>";

		$obj->iDisplayLength = $max;
		$obj->aaSorting = array(array(0, "desc"));
		$obj->sAjaxSource = DOL_URL_ROOT . "/core/ajax/listdatatables.php?json=history&class=" . get_class($this) . "&key=" . $this->id;
		$this->datatablesCreate($obj, "history_datatable", true);

		print end_box();
	}

	/**
	 * Download file for temporary directy
	 * Set header to develop file
	 */
	public function downloadTempFile($original_file) {
		global $conf, $user;

		require_once DOL_DOCUMENT_ROOT . '/core/lib/files.lib.php';
		$original_file = sys_get_temp_dir() . '/' . $user->id . '/' . $original_file;

		clearstatcache();

		$filename = basename($original_file);

		//$type = 'application/octet-stream';
		$type = dol_mimetype($original_file);

		header('Content-Description: File Transfer');
		if ($type)
			header('Content-Type: ' . $type . (preg_match('/text/', $type) ? '; charset="' . $conf->file->character_set_client : ''));
		if ($attachment)
			header('Content-Disposition: attachment; filename="' . $filename . '"');
		else
			header('Content-Disposition: inline; filename="' . $filename . '"');
		header('Content-Length: ' . dol_filesize($original_file));
// Ajout directives pour resoudre bug IE
		header('Cache-Control: Public, must-revalidate');
		header('Pragma: public');

		readfile($original_file);
		unlink($original_file);
	}

	/**
	 *  Record fonction for clean empty value
	 *
	 *  @return int         		1 success
	 */
	public function clean(&$object) {
		foreach ($object as $key => $aRow) {
			if (is_object($aRow) || is_array($aRow))
				$this->clean($aRow);

			// Don't delete roles parameters for _user databases
			if (!is_array($aRow) && empty($aRow) && $key != "roles") {
				unset($object->$key);
			}
		}
	}

}
?>
