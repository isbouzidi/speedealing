<?php
/* Copyright (C) 2002-2004 Rodolphe Quiedeville <rodolphe@quiedeville.org>
 * Copyright (C) 2004-2011 Laurent Destailleur  <eldy@users.sourceforge.net>
 * Copyright (C) 2005-2011 Regis Houssin        <regis.houssin@capnetworks.com>
 * Copyright (C) 2011	   Juanjo Menent        <jmenent@2byte.es>
 * Copyright (C) 2011-2012 Herve Prot           <herve.prot@symeos.com>
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
 * \class      ActionComm
 * \brief      Class to manage agenda events (actions)
 */
class Agenda extends nosqlDocument {

	public $element = 'action';
	public $table_element = 'actioncomm';
	protected $ismultientitymanaged = 2; // 0=No test on entity, 1=Test with field entity, 2=Test with link by societe
	var $id;
	var $type_id;
	var $type_code;
	var $type;
	var $label;
	var $datec;   // Date creation record (datec)
	var $datem;   // Date modification record (tms)
	var $author;  // Object user that create action
	var $usermod;  // Object user that modified action
	var $datep;   // Date action start (datep)
	var $datef;   // Date action end (datep2)
	var $durationp = -1;   // -1=Unkown duration
	var $fulldayevent = 0; // 1=Event on full day
	var $punctual = 1;  // Milestone
	var $percentage; // Percentage
	var $location;   // Location
	var $priority;   // Free text ('' By default)
	var $notes; // Description
	var $usertodo;  // Object user that must do action
	var $userdone;   // Object user that did action
	var $societe;  // Company linked to action (optionnal)
	var $contact;  // Contact linked tot action (optionnal)
	var $fk_project; // Id of project (optionnal)
	var $fk_lead; // Id of lead (optionnal)
	var $fk_task; // Id of mother task (optionnal)
	// Properties for links to other objects
	var $fk_element; // Id of record
	var $elementtype;   // Type of record. This if property ->element of object linked to.
	// Ical
	var $icalname;
	var $icalcolor;
	var $actions = array();
	var $Status = "TODO"; // Status of the action

	/**
	 *      Constructor
	 *
	 *      @param		DoliDB		$db      Database handler
	 */

	function __construct($db = null) {
		parent::__construct($db);

		$this->fk_extrafields = new ExtraFields($db);
		$this->fk_extrafields->fetch(get_class($this));

		$this->Status = "TODO";
		$this->author = new stdClass();
		$this->usermod = new stdClass();
		$this->usertodo = new stdClass();
		$this->userdone = new stdClass();
		$this->societe = new stdClass();
		$this->contact = new stdClass();
	}

	/**
	 *    Add an action/event into database
	 *
	 *    @param	User	$user      		Object user making action
	 *    @param    int		$notrigger		1 = disable triggers, 0 = enable triggers
	 *    @return   int 		        	Id of created event, < 0 if KO
	 */
	function add($user, $notrigger = 0) {
		global $langs, $conf;

		$error = 0;
		$now = dol_now();

		// Clean parameters
		$this->label = dol_trunc(trim($this->label), 128);
		$this->location = dol_trunc(trim($this->location), 128);
		$this->notes = dol_htmlcleanlastbr(trim($this->notes));
		if (empty($this->percentage))
			$this->percentage = 0;
		if (empty($this->priority))
			$this->priority = 0;
		if (empty($this->fulldayevent))
			$this->fuldayevent = 0;
		if (empty($this->punctual))
			$this->punctual = 0;
		if ($this->percentage > 100)
			$this->percentage = 100;
		if ($this->percentage == 100 && !$this->dateend)
			$this->dateend = $this->date;
		if ($this->datep && $this->datef)
			$this->durationp = ($this->datef - $this->datep);
		if ($this->date && $this->dateend)
			$this->durationa = ($this->dateend - $this->date);
		if ($this->datep && $this->datef && $this->datep > $this->datef)
			$this->datef = $this->datep;
		if ($this->date && $this->dateend && $this->date > $this->dateend)
			$this->dateend = $this->date;
		if ($this->fk_project < 0)
			$this->fk_project = 0;
		if ($this->fk_lead < 0)
			$this->fk_lead = 0;
		if ($this->fk_task < 0)
			$this->fk_task = 0;
		if ($this->elementtype == 'facture')
			$this->elementtype = 'invoice';
		if ($this->elementtype == 'commande')
			$this->elementtype = 'order';
		if ($this->elementtype == 'contrat')
			$this->elementtype = 'contract';

		if ($this->type == 2 && $this->percentage == 100) //ACTION
			$this->datef = dol_now();

		if ($this->percentage == 100 && !$this->userdone->id > 0) {
			$this->userdone->id = $user->id;
		}

		$this->datec = $now;

		$this->record();
		/*
		  $sql = "INSERT INTO " . MAIN_DB_PREFIX . "actioncomm";
		  $sql.= "(datec,";
		  $sql.= "datep,";
		  $sql.= "datep2,";
		  //$sql.= "datea,";
		  //$sql.= "datea2,";
		  $sql.= "durationp,";
		  //$sql.= "durationa,";
		  $sql.= "fk_action,";
		  $sql.= "fk_soc,";
		  $sql.= "fk_project,";
		  $sql.= "fk_lead,";
		  $sql.= "fk_task,";
		  $sql.= "note,";
		  $sql.= "fk_contact,";
		  $sql.= "fk_user_author,";
		  $sql.= "fk_user_action,";
		  $sql.= "fk_user_done,";
		  $sql.= "label,percent,priority,fulldayevent,location,punctual,";
		  $sql.= "fk_element,";
		  $sql.= "elementtype,";
		  $sql.= "entity";
		  $sql.= ") VALUES (";
		  $sql.= "'" . $this->db->idate($now) . "',";
		  $sql.= (strval($this->datep) != '' ? "'" . $this->db->idate($this->datep) . "'" : "null") . ",";
		  $sql.= (strval($this->datef) != '' ? "'" . $this->db->idate($this->datef) . "'" : "null") . ",";
		  //$sql.= (strval($this->date)!=''?"'".$this->db->idate($this->date)."'":"null").",";
		  //$sql.= (strval($this->dateend)!=''?"'".$this->db->idate($this->dateend)."'":"null").",";
		  $sql.= ($this->durationp >= 0 && $this->durationp != '' ? "'" . $this->durationp . "'" : "null") . ",";
		  //$sql.= ($this->durationa >= 0 && $this->durationa != ''?"'".$this->durationa."'":"null").",";
		  $sql.= " '" . $this->type_id . "',";
		  $sql.= ($this->societe->id > 0 ? " '" . $this->societe->id . "'" : "null") . ",";
		  $sql.= ($this->fk_project > 0 ? " '" . $this->fk_project . "'" : "null") . ",";
		  $sql.= ($this->fk_lead > 0 ? " '" . $this->fk_lead . "'" : "null") . ",";
		  $sql.= ($this->fk_task > 0 ? " '" . $this->fk_task . "'" : "null") . ",";
		  $sql.= " '" . $this->db->escape($this->note) . "',";
		  $sql.= ($this->contact->id > 0 ? "'" . $this->contact->id . "'" : "null") . ",";
		  $sql.= ($user->id > 0 ? "'" . $user->id . "'" : "null") . ",";
		  $sql.= ($this->usertodo->id > 0 ? "'" . $this->usertodo->id . "'" : "null") . ",";
		  $sql.= ($this->userdone->id > 0 ? "'" . $this->userdone->id . "'" : "null") . ",";
		  $sql.= "'" . $this->db->escape($this->label) . "','" . $this->percentage . "','" . $this->priority . "','" . $this->fulldayevent . "','" . $this->db->escape($this->location) . "','" . $this->punctual . "',";
		  $sql.= ($this->fk_element ? $this->fk_element : "null") . ",";
		  $sql.= ($this->elementtype ? "'" . $this->elementtype . "'" : "null") . ",";
		  $sql.= $conf->entity;
		  $sql.= ")";

		  dol_syslog(get_class($this) . "::add sql=" . $sql);
		 */
		if (!$notrigger) {
			// Appel des triggers
			include_once(DOL_DOCUMENT_ROOT . "/core/class/interfaces.class.php");
			$interface = new Interfaces($this->db);
			$result = $interface->run_triggers('ACTION_CREATE', $this, $user, $langs, $conf);
			if ($result < 0) {
				$error++;
				$this->errors = $interface->errors;
			}
			// Fin appel triggers
		}


		return $this->id;
	}

	/**
	 *    Load object from database
	 *
	 *    @param	int		$id     Id of action to get
	 *    @return	int				<0 if KO, >0 if OK
	 */
	function fetch($id) {
		global $langs;

		try {
			$this->load($id);
			return 1;
		} catch (Exception $e) {
			$this->error = $e->getMessage();
			return -1;
		}
	}

	/**
	 *    Delete event from database
	 *
	 *    @param    int		$notrigger		1 = disable triggers, 0 = enable triggers
	 *    @return   int 					<0 if KO, >0 if OK
	 */
	function delete($notrigger = 0) {
		global $user, $langs, $conf;

		$error = 0;
		$this->deleteDoc();
		/*
		  $this->db->begin();

		  $sql = "DELETE FROM " . MAIN_DB_PREFIX . "actioncomm";
		  $sql.= " WHERE id=" . $this->id;
		 */
		//dol_syslog(get_class($this) . "::delete sql=" . $sql, LOG_DEBUG);
		//if ($this->db->query($sql)) {
		if (!$notrigger) {
			// Appel des triggers
			include_once(DOL_DOCUMENT_ROOT . "/core/class/interfaces.class.php");
			$interface = new Interfaces($this->db);
			$result = $interface->run_triggers('ACTION_DELETE', $this, $user, $langs, $conf);
			if ($result < 0) {
				$error++;
				$this->errors = $interface->errors;
			}
			// Fin appel triggers
		}

		if (!$error) {
			//$this->db->commit();
			return 1;
		} else {
			//$this->db->rollback();
			return -2;
		}
		/* } else {
		  $this->db->rollback();
		  $this->error = $this->db->lasterror();
		  dol_syslog(get_class($this) . "::delete " . $this->error, LOG_ERR);
		  return -1;
		  } */
	}

	/**
	 *    Update action into database
	 * 	  If percentage = 100, on met a jour date 100%
	 *
	 *    @param    User	$user			Object user making change
	 *    @param    int		$notrigger		1 = disable triggers, 0 = enable triggers
	 *    @return   int     				<0 if KO, >0 if OK
	 */
	function update($user, $notrigger = 0) {
		global $langs, $conf;

		// Clean parameters
		$this->label = trim($this->label);
		$this->notes = trim($this->notes);
		if (empty($this->percentage))
			$this->percentage = 0;

		if (empty($this->fulldayevent))
			$this->fulldayevent = 0;
		if ($this->percentage > 100)
			$this->percentage = 100;
		if ($this->percentage == 100 && !$this->dateend)
			$this->dateend = $this->date;
		//if ($this->datep && $this->datef)
		//    $this->durationp = ($this->datef - $this->datep);
		if ($this->date && $this->dateend)
			$this->durationa = ($this->dateend - $this->date);
		if ($this->datep && $this->datef && $this->datep > $this->datef)
			$this->datef = $this->datep;
		if ($this->date && $this->dateend && $this->date > $this->dateend)
			$this->dateend = $this->date;
		if ($this->fk_project < 0)
			$this->fk_project = 0;
		if ($this->fk_lead < 0)
			$this->fk_lead = 0;
		if ($this->fk_task < 0)
			$this->fk_task = 0;

		if (empty($this->label))
			$this->label = $cact->libelle;

		if ($this->type == 2 && $this->percentage == 100) //ACTION
			$this->datef = dol_now();

		if ($this->percentage > 0 && $this->percentage < 100)
			$this->Status = "ON";

		if ($this->percentage == 100)
			$this->Status = "DONE";

		if ($this->Status == "ON" && !$this->userdone->id) {
			$this->userdone->id = $user->id;
			$this->userdone->name = $user->name;
		}

		// Check parameters
		if ($this->Status == "TODO" && $this->userdone->id) {
			//$this->error="ErrorCantSaveADoneUserWithZeroPercentage";
			//return -1;
			unset($this->userdone->id);
			unset($this->userdone->name);
		}
		if ($this->Status == "DONE" && !$this->userdone->id) {
			$this->userdone = new stdClass();
			$this->userdone->id = $user->id;
			$this->userdone->name = $user->name;
		}

		if ($this->Status == "DONE")
			$this->percentage = 100;
		elseif ($this->Status == "TODO")
			$this->percentage = 0;

		if (!empty($this->societe->id)) {
			$object = new Societe($this->db);
			$object->load($this->societe->id);
			$this->societe->name = $object->name;
		} else {
			unset($this->societe->name);
		}
		if (!empty($this->contact->id)) {
			$object = new Contact($this->db);
			$object->load($this->contact->id);
			$this->contact->name = $object->name;
		} else {
			unset($this->contact->name);
		}

		if (!empty($this->usertodo->id)) {
			$object = new User($this->db);
			$object->load($this->usertodo->id);
			$this->usertodo->name = $object->name;
		} else {
			$this->usertodo->id = $user->id;
			$this->usertodo->name = $user->name;
		}

		if (!empty($this->userdone->id)) {
			$object = new User($this->db);
			$object->load($this->userdone->id);
			$this->userdone->name = $object->name;
		} else {
			unset($this->userdone->name);
		}

		$id = $this->record();

		dol_delcache(get_class($this) . ":countTODO"); //Reset stats cache for agenda

		if (!$notrigger) {
			// Appel des triggers
			include_once(DOL_DOCUMENT_ROOT . "/core/class/interfaces.class.php");
			$interface = new Interfaces($this->db);
			$result = $interface->run_triggers('ACTION_MODIFY', $this, $user, $langs, $conf);
			if ($result < 0) {
				$error++;
				$this->errors = $interface->errors;
			}
			// Fin appel triggers
		}

		return $id;
	}

	/**
	 *   Load all objects with filters
	 *
	 *   @param		int		$socid			Filter by thirdparty
	 * 	 @param		int		$fk_element		Id of element action is linked to
	 *   @param		string	$elementtype	Type of element action is linked to
	 *   @param		string	$filter			Other filter
	 *   @return	int						<0 if KO, >0 if OK
	 */
	function getActions($socid = 0, $fk_element = 0, $elementtype = '', $filter = '') {
		global $conf, $langs;

		$sql = "SELECT a.id";
		$sql.= " FROM " . MAIN_DB_PREFIX . "actioncomm as a";
		$sql.= " WHERE a.entity = " . $conf->entity;
		if (!empty($socid))
			$sql.= " AND a.fk_soc = " . $socid;
		if (!empty($elementtype)) {
			if ($elementtype == 'project')
				$sql.= ' AND a.fk_project = ' . $fk_element;
			else
				$sql.= " AND a.fk_element = " . $fk_element . " AND a.elementtype = '" . $elementtype . "'";
		}
		if (!empty($filter))
			$sql.= $filter;

		dol_syslog(get_class($this) . "::getActions sql=" . $sql);
		$resql = $this->db->query($sql);
		if ($resql) {
			$num = $this->db->num_rows($resql);

			if ($num) {
				for ($i = 0; $i < $num; $i++) {
					$obj = $this->db->fetch_object($resql);
					$actioncommstatic = new ActionComm($this->db);
					$actioncommstatic->fetch($obj->id);
					$this->actions[$i] = $actioncommstatic;
				}
			}
			$this->db->free($resql);
			return 1;
		} else {
			$this->error = $this->db->lasterror();
			return -1;
		}
	}

	/**
	 *      Load indicators for dashboard (this->nbtodo and this->nbtodolate)
	 *
	 *      @param	User	$user   Objet user
	 *      @return int     		<0 if KO, >0 if OK
	 */
	function load_board($user) {
		global $conf, $user;

		$now = dol_now();

		$this->nbtodo = $this->nbtodolate = 0;
		$sql = "SELECT a.id, a.datep as dp";
		$sql.= " FROM (" . MAIN_DB_PREFIX . "actioncomm as a";
		if (!$user->rights->societe->client->voir && !$user->societe_id)
			$sql.= ", " . MAIN_DB_PREFIX . "societe_commerciaux as sc";
		$sql.= ")";
		$sql.= " LEFT JOIN " . MAIN_DB_PREFIX . "societe as s ON a.fk_soc = s.rowid";
		$sql.= " WHERE a.percent >= 0 AND a.percent < 100";
		$sql.= " AND a.entity = " . $conf->entity;
		if (!$user->rights->societe->client->voir && !$user->societe_id)
			$sql.= " AND a.fk_soc = sc.fk_soc AND sc.fk_user = " . $user->id;
		if ($user->societe_id)
			$sql.=" AND a.fk_soc = " . $user->societe_id;
		//print $sql;

		$resql = $this->db->query($sql);
		if ($resql) {
			while ($obj = $this->db->fetch_object($resql)) {
				$this->nbtodo++;
				if (isset($obj->dp) && $this->db->jdate($obj->dp) < ($now - $conf->actions->warning_delay))
					$this->nbtodolate++;
			}
			return 1;
		}
		else {
			$this->error = $this->db->error();
			return -1;
		}
	}

	/**
	 *      Charge les informations d'ordre info dans l'objet facture
	 *
	 *      @param	int		$id       	Id de la facture a charger
	 * 		@return	void
	 */
	function info($id) {
		$sql = 'SELECT ';
		$sql.= ' a.id,';
		$sql.= ' datec,';
		$sql.= ' tms as datem,';
		$sql.= ' fk_user_author,';
		$sql.= ' fk_user_mod';
		$sql.= ' FROM ' . MAIN_DB_PREFIX . 'actioncomm as a';
		$sql.= ' WHERE a.id = ' . $id;

		dol_syslog(get_class($this) . "::info sql=" . $sql);
		$result = $this->db->query($sql);
		if ($result) {
			if ($this->db->num_rows($result)) {
				$obj = $this->db->fetch_object($result);
				$this->id = $obj->id;
				if ($obj->fk_user_author) {
					$cuser = new User($this->db);
					$cuser->fetch($obj->fk_user_author);
					$this->user_creation = $cuser;
				}
				if ($obj->fk_user_mod) {
					$muser = new User($this->db);
					$muser->fetch($obj->fk_user_mod);
					$this->user_modification = $muser;
				}

				$this->date_creation = $this->db->jdate($obj->datec);
				$this->date_modification = $this->db->jdate($obj->datem);
			}
			$this->db->free($result);
		} else {
			dol_print_error($this->db);
		}
	}

	/**
	 *    	Return label of status
	 *
	 *    	@param	int		$mode           0=libelle long, 1=libelle court, 2=Picto + Libelle court, 3=Picto, 4=Picto + Libelle long, 5=Libelle court + Picto
	 *      @param  int		$hidenastatus   1=Show nothing if status is "Not applicable"
	 *    	@return string          		String with status
	 */
	/* function getLibStatut($mode, $hidenastatus = 0) {
	  return $this->LibStatut($this->percentage, $mode, $hidenastatus);
	  } */

	/**
	 * 		Return label of action status
	 *
	 *    	@param	int		$percent        Percent
	 *    	@param  int		$mode           0=Long label, 1=Short label, 2=Picto+Short label, 3=Picto, 4=Picto+Short label, 5=Short label+Picto, 6=Very short label+Picto
	 *      @param  int		$hidenastatus   1=Show nothing if status is "Not applicable"
	 *    	@return string		    		Label
	 */
	/* function LibStatut($percent, $mode, $hidenastatus = 0) {
	  global $langs;

	  if ($mode == 0) {
	  if ($percent == -1 && !$hidenastatus)
	  return $langs->trans('StatusNotApplicable');
	  else if ($percent == 0)
	  return $langs->trans('StatusActionToDo') . ' (0%)';
	  else if ($percent > 0 && $percent < 100)
	  return $langs->trans('StatusActionInProcess') . ' (' . $percent . '%)';
	  else if ($percent >= 100)
	  return $langs->trans('StatusActionDone') . ' (100%)';
	  }
	  else if ($mode == 1) {
	  if ($percent == -1 && !$hidenastatus)
	  return $langs->trans('StatusNotApplicable');
	  else if ($percent == 0)
	  return $langs->trans('StatusActionToDo');
	  else if ($percent > 0 && $percent < 100)
	  return $percent . '%';
	  else if ($percent >= 100)
	  return $langs->trans('StatusActionDone');
	  }
	  else if ($mode == 2) {
	  if ($percent == -1 && !$hidenastatus)
	  return img_picto($langs->trans('StatusNotApplicable'), 'statut9') . ' ' . $langs->trans('StatusNotApplicable');
	  else if ($percent == 0)
	  return img_picto($langs->trans('StatusActionToDo'), 'statut1') . ' ' . $langs->trans('StatusActionToDo');
	  else if ($percent > 0 && $percent < 100)
	  return img_picto($langs->trans('StatusActionInProcess'), 'statut3') . ' ' . $percent . '%';
	  else if ($percent >= 100)
	  return img_picto($langs->trans('StatusActionDone'), 'statut6') . ' ' . $langs->trans('StatusActionDone');
	  }
	  else if ($mode == 3) {
	  if ($percent == -1 && !$hidenastatus)
	  return img_picto($langs->trans("Status") . ': ' . $langs->trans('StatusNotApplicable'), 'statut9');
	  else if ($percent == 0)
	  return img_picto($langs->trans("Status") . ': ' . $langs->trans('StatusActionToDo') . ' (0%)', 'statut1');
	  else if ($percent > 0 && $percent < 100)
	  return img_picto($langs->trans("Status") . ': ' . $langs->trans('StatusActionInProcess') . ' (' . $percent . '%)', 'statut3');
	  else if ($percent >= 100)
	  return img_picto($langs->trans("Status") . ': ' . $langs->trans('StatusActionDone') . ' (100%)', 'statut6');
	  }
	  else if ($mode == 4) {
	  if ($percent == -1 && !$hidenastatus)
	  return img_picto($langs->trans('StatusNotApplicable'), 'statut9') . ' ' . $langs->trans('StatusNotApplicable');
	  else if ($percent == 0)
	  return img_picto($langs->trans('StatusActionToDo'), 'statut1') . ' ' . $langs->trans('StatusActionToDo') . ' (0%)';
	  else if ($percent > 0 && $percent < 100)
	  return img_picto($langs->trans('StatusActionInProcess'), 'statut3') . ' ' . $langs->trans('StatusActionInProcess') . ' (' . $percent . '%)';
	  else if ($percent >= 100)
	  return img_picto($langs->trans('StatusActionDone'), 'statut6') . ' ' . $langs->trans('StatusActionDone') . ' (100%)';
	  }
	  else if ($mode == 5) {
	  if ($percent == -1 && !$hidenastatus)
	  return img_picto($langs->trans('StatusNotApplicable'), 'statut9');
	  else if ($percent == 0)
	  return '0% ' . img_picto($langs->trans('StatusActionToDo'), 'statut1');
	  else if ($percent > 0 && $percent < 100)
	  return $percent . '% ' . img_picto($langs->trans('StatusActionInProcess') . ' - ' . $percent . '%', 'statut3');
	  else if ($percent >= 100)
	  return $langs->trans('StatusActionDone') . ' ' . img_picto($langs->trans('StatusActionDone'), 'statut6');
	  }
	  else if ($mode == 6) {
	  if ($percent == -1 && !$hidenastatus)
	  return img_picto($langs->trans('StatusNotApplicable'), 'statut9');
	  else if ($percent == 0)
	  return '0% ' . img_picto($langs->trans('StatusActionToDo'), 'statut1');
	  else if ($percent > 0 && $percent < 100)
	  return $percent . '% ' . img_picto($langs->trans('StatusActionInProcess') . ' - ' . $percent . '%', 'statut3');
	  else if ($percent >= 100)
	  return img_picto($langs->trans('StatusActionDone'), 'statut6');
	  }
	  return '';
	  } */

	/**
	 *    	Renvoie nom clicable (avec eventuellement le picto)
	 *      Utilise $this->id, $this->code et $this->label
	 *
	 * 		@param	int		$withpicto			0=Pas de picto, 1=Inclut le picto dans le lien, 2=Picto seul
	 * 		@param	int		$maxlength			Nombre de caracteres max dans libelle
	 * 		@param	string	$classname			Force style class on a link
	 * 		@param	string	$option				''=Link to action,'birthday'=Link to contact
	 * 		@param	int		$overwritepicto		1=Overwrite picto
	 * 		@return	string						Chaine avec URL
	 */
	function getNomUrl($withpicto = 0, $maxlength = 0, $classname = '', $option = '', $overwritepicto = '') {
		global $langs;

		$result = '';
		if ($option == 'birthday')
			$lien = '<a ' . ($classname ? 'class="' . $classname . '" ' : '') . 'href="' . DOL_URL_ROOT . '/contact/perso.php?id=' . $this->id . '">';
		else
			$lien = '<a ' . ($classname ? 'class="' . $classname . '" ' : '') . 'href="' . DOL_URL_ROOT . '/comm/action/fiche.php?id=' . $this->id . '">';
		$lienfin = '</a>';
		//print $this->libelle;
		if ($withpicto == 2) {
			$libelle = $langs->trans("Action" . $this->type_code);
			$libelleshort = '';
		} else if (empty($this->libelle)) {
			$libelle = $langs->trans("Action" . $this->type_code);
			$libelleshort = $langs->trans("Action" . $this->type_code, '', '', '', '', $maxlength);
		} else {
			$libelle = $this->libelle;
			$libelleshort = dol_trunc($this->libelle, $maxlength);
		}

		if ($withpicto) {
			$libelle.=(($this->type_code && $libelle != $langs->trans("Action" . $this->type_code) && $langs->trans("Action" . $this->type_code) != "Action" . $this->type_code) ? ' (' . $langs->trans("Action" . $this->type_code) . ')' : '');
			$result.=$lien . img_object($langs->trans("ShowAction") . ': ' . $libelle, ($overwritepicto ? $overwritepicto : 'action')) . $lienfin;
		}
		if ($withpicto == 1)
			$result.=' ';
		$result.=$lien . $libelleshort . $lienfin;
		return $result;
	}

	/*
	 * Ajouter une tache automatisé suite a une action. Exemple validation d'une facture, création d'une commande, ...
	 * param    type
	 * param
	 *
	 */

	function addAutoTask($type, $label, $socid, $leadid, $projetid, $contactid = '') {
		global $user;

		$now = dol_now();

		$this->fk_lead = $leadid;
		$this->fk_project = $projectid;
		$this->label = $label;
		$this->type_code = $type;
		$this->datep = $now;
		$this->datef = $now;
		$this->societe->id = $socid;
		$this->contact = $contactid;
		$this->percentage = 100;
		$this->userdone = $user;
		$this->usertodo = $user;
		$this->type = 2;

		$this->add($user);
	}

	/**
	 * 		Export events from database into a cal file.
	 *
	 * 		@param	string		$format			'vcal', 'ical/ics', 'rss'
	 * 		@param	string		$type			'event' or 'journal'
	 * 		@param	int			$cachedelay		Do not rebuild file if date older than cachedelay seconds
	 * 		@param	string		$filename		Force filename
	 * 		@param	array		$filters		Array of filters
	 * 		@return int     					<0 if error, nb of events in new file if ok
	 */
	function build_exportfile($format, $type, $cachedelay, $filename, $filters) {
		global $conf, $langs, $dolibarr_main_url_root, $mysoc;

		require_once (DOL_DOCUMENT_ROOT . "/core/lib/xcal.lib.php");
		require_once (DOL_DOCUMENT_ROOT . "/core/lib/date.lib.php");

		dol_syslog(get_class($this) . "::build_exportfile Build export file format=" . $format . ", type=" . $type . ", cachedelay=" . $cachedelay . ", filename=" . $filename . ", filters size=" . count($filters), LOG_DEBUG);

		// Check parameters
		if (empty($format))
			return -1;

		// Clean parameters
		if (!$filename) {
			$extension = 'vcs';
			if ($format == 'ical')
				$extension = 'ics';
			$filename = $format . '.' . $extension;
		}

		// Create dir and define output file (definitive and temporary)
		$result = dol_mkdir($conf->agenda->dir_temp);
		$outputfile = $conf->agenda->dir_temp . '/' . $filename;

		$result = 0;

		$buildfile = true;
		$login = '';
		$logina = '';
		$logind = '';
		$logint = '';

		$now = dol_now();

		if ($cachedelay) {
			$nowgmt = dol_now();
			include_once(DOL_DOCUMENT_ROOT . '/core/lib/files.lib.php');
			if (dol_filemtime($outputfile) > ($nowgmt - $cachedelay)) {
				dol_syslog(get_class($this) . "::build_exportfile file " . $outputfile . " is not older than now - cachedelay (" . $nowgmt . " - " . $cachedelay . "). Build is canceled");
				$buildfile = false;
			}
		}

		if ($buildfile) {
			// Build event array
			$eventarray = array();

			$sql = "SELECT a.id,";
			$sql.= " a.datep,";  // Start
			$sql.= " a.datep2,"; // End
			$sql.= " a.durationp,";
			$sql.= " a.datec, a.tms as datem,";
			$sql.= " a.note, a.label, a.fk_action as type_id,";
			$sql.= " a.fk_soc,";
			$sql.= " a.fk_user_author, a.fk_user_mod,";
			$sql.= " a.fk_user_action, a.fk_user_done,";
			$sql.= " a.fk_contact, a.percent as percentage,";
			$sql.= " a.fk_element, a.elementtype,";
			$sql.= " a.priority, a.fulldayevent, a.location,";
			$sql.= " u.firstname, u.name,";
			$sql.= " s.nom as socname,";
			$sql.= " c.id as type_id, c.code as type_code, c.libelle";
			$sql.= " FROM (" . MAIN_DB_PREFIX . "c_actioncomm as c, " . MAIN_DB_PREFIX . "actioncomm as a)";
			$sql.= " LEFT JOIN " . MAIN_DB_PREFIX . "user as u on u.rowid = a.fk_user_author";
			$sql.= " LEFT JOIN " . MAIN_DB_PREFIX . "societe as s on s.rowid = a.fk_soc";
			$sql.= " WHERE a.fk_action=c.id";
			$sql.= " AND a.entity = " . $conf->entity;
			foreach ($filters as $key => $value) {
				if ($key == 'notolderthan')
					$sql.=" AND a.datep >= '" . $this->db->idate($now - ($value * 24 * 60 * 60)) . "'";
				if ($key == 'year')
					$sql.=" AND a.datep BETWEEN '" . $this->db->idate(dol_get_first_day($value, 1)) . "' AND '" . $this->db->idate(dol_get_last_day($value, 12)) . "'";
				if ($key == 'id')
					$sql.=" AND a.id=" . (is_numeric($value) ? $value : 0);
				if ($key == 'idfrom')
					$sql.=" AND a.id >= " . (is_numeric($value) ? $value : 0);
				if ($key == 'idto')
					$sql.=" AND a.id <= " . (is_numeric($value) ? $value : 0);
				if ($key == 'login') {
					$login = $value;
					$userforfilter = new User($this->db);
					$result = $userforfilter->fetch('', $value);
					$sql.= " AND (";
					$sql.= " a.fk_user_author = " . $userforfilter->id;
					$sql.= " OR a.fk_user_action = " . $userforfilter->id;
					$sql.= " OR a.fk_user_done = " . $userforfilter->id;
					$sql.= ")";
				}
				if ($key == 'logina') {
					$logina = $value;
					$userforfilter = new User($this->db);
					$result = $userforfilter->fetch('', $value);
					$sql.= " AND a.fk_user_author = " . $userforfilter->id;
				}
				if ($key == 'logint') {
					$logint = $value;
					$userforfilter = new User($this->db);
					$result = $userforfilter->fetch('', $value);
					$sql.= " AND a.fk_user_action = " . $userforfilter->id;
				}
				if ($key == 'logind') {
					$logind = $value;
					$userforfilter = new User($this->db);
					$result = $userforfilter->fetch('', $value);
					$sql.= " AND a.fk_user_done = " . $userforfilter->id;
				}
			}
			$sql.= " AND a.datep IS NOT NULL";  // To exclude corrupted events and avoid errors in lightning/sunbird import
			$sql.= " ORDER by datep";
			//print $sql;exit;

			dol_syslog(get_class($this) . "::build_exportfile select events sql=" . $sql);
			$resql = $this->db->query($sql);
			if ($resql) {
				// Note: Output of sql request is encoded in $conf->file->character_set_client
				while ($obj = $this->db->fetch_object($resql)) {
					$qualified = true;

					// 'eid','startdate','duration','enddate','title','summary','category','email','url','desc','author'
					$event = array();
					$event['uid'] = 'dolibarragenda-' . $this->db->database_name . '-' . $obj->id . "@" . $_SERVER["SERVER_NAME"];
					$event['type'] = $type;
					//$datestart=$obj->datea?$obj->datea:$obj->datep;
					//$dateend=$obj->datea2?$obj->datea2:$obj->datep2;
					//$duration=$obj->durationa?$obj->durationa:$obj->durationp;
					$datestart = $this->db->jdate($obj->datep);
					//print $datestart.'x'; exit;
					$dateend = $this->db->jdate($obj->datep2);
					$duration = $obj->durationp;
					$event['summary'] = $obj->label . ($obj->socname ? " (" . $obj->socname . ")" : "");
					$event['desc'] = $obj->notes;
					$event['startdate'] = $datestart;
					$event['duration'] = $duration; // Not required with type 'journal'
					$event['enddate'] = $dateend;  // Not required with type 'journal'
					$event['author'] = $obj->firstname . ($obj->name ? " " . $obj->name : "");
					$event['priority'] = $obj->priority;
					$event['fulldayevent'] = $obj->fulldayevent;
					$event['location'] = $obj->location;
					$event['transparency'] = 'TRANSPARENT';  // OPAQUE (busy) or TRANSPARENT (not busy)
					$event['category'] = $obj->libelle; // libelle type action
					$urlwithouturlroot = preg_replace('/' . preg_quote(DOL_URL_ROOT, '/') . '$/i', '', $dolibarr_main_url_root);
					$url = $urlwithouturlroot . DOL_URL_ROOT . '/comm/action/fiche.php?id=' . $obj->id;
					$event['url'] = $url;
					$event['created'] = $this->db->jdate($obj->datec);
					$event['modified'] = $this->db->jdate($obj->datem);

					if ($qualified && $datestart) {
						$eventarray[$datestart] = $event;
					}
				}
			} else {
				$this->error = $this->db->lasterror();
				dol_syslog(get_class($this) . "::build_exportfile " . $this->db->lasterror(), LOG_ERR);
				return -1;
			}

			$langs->load("agenda");

			// Define title and desc
			$more = '';
			if ($login)
				$more = $langs->transnoentities("User") . ' ' . $login;
			if ($logina)
				$more = $langs->transnoentities("ActionsAskedBy") . ' ' . $logina;
			if ($logint)
				$more = $langs->transnoentities("ActionsToDoBy") . ' ' . $logint;
			if ($logind)
				$more = $langs->transnoentities("ActionsDoneBy") . ' ' . $logind;
			if ($more) {
				$title = 'Dolibarr actions ' . $mysoc->name . ' - ' . $more;
				$desc = $more;
				$desc.=' (' . $mysoc->name . ' - built by Dolibarr)';
			} else {
				$title = 'Dolibarr actions ' . $mysoc->name;
				$desc = $langs->transnoentities('ListOfActions');
				$desc.=' (' . $mysoc->name . ' - built by Dolibarr)';
			}

			// Create temp file
			$outputfiletmp = tempnam($conf->agenda->dir_temp, 'tmp');  // Temporary file (allow call of function by different threads
			@chmod($outputfiletmp, octdec($conf->global->MAIN_UMASK));

			// Write file
			if ($format == 'vcal')
				$result = build_calfile($format, $title, $desc, $eventarray, $outputfiletmp);
			if ($format == 'ical')
				$result = build_calfile($format, $title, $desc, $eventarray, $outputfiletmp);
			if ($format == 'rss')
				$result = build_rssfile($format, $title, $desc, $eventarray, $outputfiletmp);

			if ($result >= 0) {
				if (rename($outputfiletmp, $outputfile))
					$result = 1;
				else {
					dol_syslog(get_class($this) . "::build_exportfile failed to rename " . $outputfiletmp . " to " . $outputfile, LOG_ERR);
					dol_delete_file($outputfiletmp, 0, 1);
					$result = -1;
				}
			} else {
				dol_syslog(get_class($this) . "::build_exportfile build_xxxfile function fails to for format=" . $format . " outputfiletmp=" . $outputfile, LOG_ERR);
				dol_delete_file($outputfiletmp, 0, 1);
				$langs->load("errors");
				$this->error = $langs->trans("ErrorFailToCreateFile", $outputfile);
			}
		}

		return $result;
	}

	/**
	 *  Show actions
	 *
	 * 	@param	int		$id			Object id
	 *  @param	int		$max		Max nb of records
	 *  @return	void
	 */
	function show($id, $max = 5) {
		global $langs, $conf, $user, $db, $bc;

		$langs->load("agenda");

		$titre = $langs->trans("Actions");

		$h = 0;
		if ($user->rights->agenda->myactions->write || $user->rights->agenda->allactions->write) {
			$head[$h] = new stdClass();
			$head[$h]->href = 'agenda/fiche.php?action=create&socid=' . $id;
			$head[$h]->title = $langs->trans("NewAction");
			$head[$h]->icon = "icon-pencil";
			$h++;
		}
		$head[$h] = new stdClass();
		$head[$h]->title = $langs->trans("StatusActionToDo");
		$head[$h]->id = "TODO";
		$head[$h]->onclick = "var oTable = $('#actions_datatable').dataTable(); oTable.fnReloadAjax('" . DOL_URL_ROOT . "/core/ajax/listdatatables.php?json=actionsTODO&class=Agenda&key=" . $id . "'); return false;";
		$head[$h]->icon = "icon-clock";
		$h++;
		$head[$h] = new stdClass();
		$head[$h]->title = $langs->trans("StatusActionDone");
		$head[$h]->id = "DONE";
		$head[$h]->onclick = "var oTable = $('#actions_datatable').dataTable(); oTable.fnReloadAjax('" . DOL_URL_ROOT . "/core/ajax/listdatatables.php?json=actionsDONE&class=Agenda&key=" . $id . "'); return false;";
		$head[$h]->icon = "icon-calendar";
		$h++;

		print start_box($titre, "icon-calendar", $head);

		$i = 0;
		$obj = new stdClass();
		$societe = new Societe($this->db);

		/*
		 * Barre d'actions
		 *
		 */

		//print $this->datatablesEdit("actions_datatable", $langs->trans("NewAction"));

		print '<table class="display dt_act" id="actions_datatable" >';
		// Ligne des titres

		print '<thead>';
		print'<tr>';
		print'<th>';
		print'</th>';
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "_id";
		$obj->aoColumns[$i]->bUseRendered = false;
		$obj->aoColumns[$i]->bSearchable = false;
		$obj->aoColumns[$i]->bVisible = false;
		$i++;
		print'<th class="essential">';
		print $langs->trans("Titre");
		print'</th>';
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "label";
		$obj->aoColumns[$i]->bUseRendered = false;
		$obj->aoColumns[$i]->bSearchable = true;
		$obj->aoColumns[$i]->fnRender = $this->datatablesFnRender("label", "url");
		$i++;
		print'<th class="essential">';
		print $langs->trans('DateEchAction');
		print'</th>';
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "datep";
		$obj->aoColumns[$i]->sClass = "center";
		$obj->aoColumns[$i]->sDefaultContent = "";
		$obj->aoColumns[$i]->bUseRendered = false;
		$obj->aoColumns[$i]->fnRender = $this->datatablesFnRender("datep", "date");
		$i++;
		print'<th class="essential">';
		print $langs->trans('Company');
		print'</th>';
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "societe.name";
		$obj->aoColumns[$i]->sDefaultContent = "";
		$obj->aoColumns[$i]->fnRender = $societe->datatablesFnRender("societe.name", "url", array('id' => "societe.id"));
		$i++;
		print'<th class="essential">';
		print $langs->trans('AffectedTo');
		print'</th>';
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "usertodo.name";
		$obj->aoColumns[$i]->sDefaultContent = "";
		$i++;
		print'<th class="essential">';
		print $langs->trans("Status");
		print'</th>';
		$obj->aoColumns[$i] = new stdClass();
		$obj->aoColumns[$i]->mDataProp = "Status";
		$obj->aoColumns[$i]->sClass = "center";
		$obj->aoColumns[$i]->sDefaultContent = "TODO";
		$obj->aoColumns[$i]->fnRender = $this->datatablesFnRender("Status", "status", array("dateEnd" => "datep"));
		$i++;
		print '</tr>';
		print '</thead>';
		print'<tfoot>';
		print'</tfoot>';
		print'<tbody>';
		print'</tbody>';
		print "</table>";

		$obj->iDisplayLength = $max;
		$obj->aaSorting = array(array(2, 'desc'));
		$obj->sAjaxSource = DOL_URL_ROOT . "/core/ajax/listdatatables.php?json=actionsTODO&class=" . get_class($this) . "&key=" . $id;
		$this->datatablesCreate($obj, "actions_datatable", true);

		/* foreach ($head as $aRow) {
		  ?>
		  <script>
		  $(document).ready(function() {
		  var js = "var oTable = $('#actions_datatable').dataTable(); oTable.fnReloadAjax(\"<?php echo DOL_URL_ROOT . "/core/ajax/listdatatables.php?json=actions" . $aRow->id . "&class=" . get_class($this) . "&key=" . $id; ?>\")";
		  $("#<?php echo $aRow->id; ?>").attr("onclick", js);
		  });
		  </script>
		  <?php
		  } */
		print end_box();
	}

	/**
	 *  Initialise an instance with random values.
	 *  Used to build previews or test instances.
	 * 	id must be 0 if object instance is a specimen.
	 *
	 *  @return	void
	 */
	function initAsSpecimen() {
		global $user, $langs, $conf;

		$now = dol_now();

		// Initialise parametres
		$this->id = 0;
		$this->specimen = 1;

		$this->type_code = 'AC_OTH';
		$this->label = 'Label of event Specimen';
		$this->datec = $now;
		$this->datem = $now;
		$this->datep = $now;
		$this->datef = $now;
		$this->author = $user;
		$this->usermod = $user;
		$this->fulldayevent = 0;
		$this->punctual = 0;
		$this->percentage = 0;
		$this->location = 'Location';
		$this->priority = 'Priority X';
		$this->notes = 'Note';
	}

	function print_calendar($date) {
		global $db, $langs, $user;

		$date = strtotime($date);
		$nbDaysInMonth = date('t', $date);
		$firstDayTimestamp = mktime(-1, -1, -1, date('n', $date), 1, date('Y', $date));
		$lastDayTimestamp = mktime(23, 59, 59, date('n', $date), $nbDaysInMonth, date('Y', $date));
		$todayTimestamp = dol_mktime(-1, -1, -1, date('n'), date('j'), date('Y'));
		$firstDayOfMonth = date('w', $firstDayTimestamp);

		$object = new Agenda($db);
		//if($user->right->)
		if ($user->rights->agenda->allactions->read)
		//$events = $object->getView("calendarTasks", array("startkey" => array(intval(date('Y', $date)), intval(date('m', $date)), 0, 0, 0), "endkey" => array(intval(date('Y', $date)), intval(date('m', $date)), 100, 100, 100)));
			$events = $this->mongodb->find(array("type_code" => "AC_RDV", "datep" => array('$gte' => new MongoDate(mktime(0, 0, 0, date('n', $date), 1, date('Y', $date))), '$lt' => new MongoDate(mktime(0, 0, 0, date('n', $date) + 1, 1, date('Y', $date))))));
		else
			$events = $this->mongodb->find(array("type_code" => "AC_RDV", "datep" => array('$gte' => new MongoDate(mktime(0, 0, 0, date('n', $date), 1, date('Y', $date)))), "datep" => array('$lt' => new MongoDate(mktime(0, 0, 0, date('n', $date) + 1, 1, date('Y', $date)))), "usertodo.id" => $user->id));
		//$events = $object->getView("calendarMyTasks", array("startkey" => array($user->id, intval(date('Y', $date)), intval(date('m', $date)), 0, 0, 0), "endkey" => array($user->id, intval(date('Y', $date)), intval(date('m', $date)), 100, 100, 100)));

		$events->sort(array("datep" => 1));

		print '<table class="calendar fluid with-events large-margin-bottom with-events">';

		// Month an scroll arrows
		print '<caption>';
		print '<a class="cal-prev" href="' . $_SERVER["PHP_SELF"] . '?date=' . mktime(0, 0, 0, date('n', $date) - 1, 1, date('Y', $date)) . '">◄</a>';
		print '<a class="cal-next" href="' . $_SERVER["PHP_SELF"] . '?date=' . mktime(0, 0, 0, date('n', $date) + 1, 1, date('Y', $date)) . '">►</a>';
		print $langs->trans(date('F', $date)) . ' ' . date('Y', $date);
		print '</caption>';

		// Days names
		print '<thead>';
		print '<tr>';
		print '<th scope="col">' . $langs->trans('MondayMin') . '</th>';
		print '<th scope="col">' . $langs->trans('TuesdayMin') . '</th>';
		print '<th scope="col">' . $langs->trans('WednesdayMin') . '</th>';
		print '<th scope="col">' . $langs->trans('ThursdayMin') . '</th>';
		print '<th scope="col">' . $langs->trans('FridayMin') . '</th>';
		print '<th scope="col">' . $langs->trans('SaturdayMin') . '</th>';
		print '<th scope="col">' . $langs->trans('SundayMin') . '</th>';
		print '</tr>';
		print '</thead>';
		print '<tbody>';
		print '<tr>';

		$calendarCounter = 1;
		for ($i = $firstDayOfMonth; $i > 0; $i--, $calendarCounter++) {
			$previousTimestamp = strtotime($i . " day ago", $firstDayTimestamp);
			print '<td class="prev-month"><span class="cal-day">' . date('d', $previousTimestamp) . '</span></td>';
		}

		//$cursor = 0;
		for ($i = 1; $i <= $nbDaysInMonth; $i++, $calendarCounter++) {
			$dayTimestamp = dol_mktime(-1, -1, -1, date('n', $date), $i, date('Y', $date));
			if ($calendarCounter > 1 && ($calendarCounter - 1) % 7 == 0)
				print '</tr><tr>';
			print '<td class="' . ((date('w', $dayTimestamp) == 0 || date('w', $dayTimestamp) == 6) ? 'week-end ' : '') . ' ' . (($dayTimestamp == $todayTimestamp) ? 'today ' : '') . '"><span class="cal-day">' . $i . '</span>';
			print '<ul class="cal-events">';

			//if (!empty($events->rows[$cursor])) {
			foreach ($events as $row) {
				$row = json_decode(json_encode($row));
				//print_r($row);
				$day = date("j", $row->datep->sec);
				//print_r($date);exit;
				if ($day == $i) {
					//if ($row->key[3 - $user->rights->agenda->allactions->read] == $i) {
					$user_tmp = new User();
					$user_tmp->id = $row->usertodo->id;
					$user_tmp->name = $row->usertodo->name;
					print '<li ' . ($row->usertodo->id == $user->id ? 'class="important"' : "") . '><a href="agenda/fiche.php?id=' . $row->_id->{'$id'} . '" >' . "[" . $row->societe->name . "] " . $row->label . ($row->usertodo->id != $user->id ? '<br><i>' . $user_tmp->getNomUrl(1) . '</i>' : '') . '</a></li>';
				}
			}
			//}

			print '</ul>';
			print '</td>';
		}

		$calendarCounter--;
		$i = 1;
		while ($calendarCounter++ % 7 != 0) {
			print '<td class="next-month"><span class="cal-day">' . $i++ . '</span></td>';
		}

		print '</tr>';

		print '</tbody>';
		print '</table>';
	}

	function print_week($date) {
		global $db, $langs, $user, $mongodb;

		//$timestamps = array();
		$datestart = strtotime($date);
		//$dayOfWeek = date('w', $date);
		// for ($i = 0, $d = -$dayOfWeek; $i < 7; $i++, $d++) {
		$dateend = strtotime("7 day", $date);
		/*  $timestamps[$i] = array(
		  'start' => mktime(0, 0, 0, date('n', $tmpTimestamp), date('j', $tmpTimestamp), date('Y', $tmpTimestamp)),
		  'end' => mktime(23, 59, 59, date('n', $tmpTimestamp), date('j', $tmpTimestamp), date('Y', $tmpTimestamp)),
		  );
		  } */

		//print date('j', strtotime(-date('w', $date)+1 . " day", $date));

		$object = new Agenda($db);
		//$events = $object->getView("calendarMyTasks", array("startkey" => array($user->id, intval(date('Y', $date)), intval(date('m', $date)), 0, 0, 0), "endkey" => array($user->id, intval(date('Y', $date)), intval(date('m', $date)), 100, 100, 100)));
		$events = $mongodb->Agenda->find(array("type_code" => "AC_RDV", '$or' => array("usertodo.id" => $user->id, "author.id" => $user->id), "datep" => array('$gte' => new MongoDate($datestart), '$lt' => new MongoDate($dateend))));

		//print_r($events);
		$styles = array(
			0 => 'left: 0%; right: 85.7143%; margin-left: -1px;',
			1 => 'left: 14.2857%; right: 71.4286%; margin-left: 0px;',
			2 => 'left: 28.5714%; right: 57.1429%; margin-left: 0px;',
			3 => 'left: 42.8571%; right: 42.8571%; margin-left: 0px;',
			4 => 'left: 57.1429%; right: 28.5714%; margin-left: 0px;',
			5 => 'left: 71.4286%; right: 14.2857%; margin-left: 0px;',
			6 => 'left: 85.7143%; right: 0%; margin-left: 0px;'
		);

		$days = array(
			0 => 'Sunday',
			1 => 'Monday',
			2 => 'Tuesday',
			3 => 'Wednesday',
			4 => 'Thursday',
			5 => 'Friday',
			6 => 'Saturday'
		);

		$first = date('j', $datestart) - date('j', strtotime(-date('w', $datestart) . " day", $datestart));

		print '<div class="block">
				<div class="block-title">
					<h3 id="agenda-day">Tuesday</h3>
					<div class="button-group absolute-right compact">
						<a href="#" class="button" id="agenda-previous"><span class="icon-left-fat"></span></a>
						<a href="#" class="button" id="agenda-today">' . $langs->trans("Today") . '</a>
						<a href="#" class="button" id="agenda-next"><span class="icon-right-fat"></span></a>
					</div>
				</div>';

		print '<div class="agenda" id="agenda">';
		print '<ul class="agenda-time">
								<li class="from-7 to-8"><span>7 AM</span></li>
								<li class="from-8 to-9"><span>8 AM</span></li>
								<li class="from-9 to-10"><span>9 AM</span></li>
								<li class="from-10 to-11"><span>10 AM</span></li>
								<li class="from-11 to-12"><span>11 AM</span></li>
								<li class="from-12 to-13 blue"><span>12 AM</span></li>
								<li class="from-13 to-14"><span>1 PM</span></li>
								<li class="from-14 to-15"><span>2 PM</span></li>
								<li class="from-15 to-16"><span>3 PM</span></li>
								<li class="from-16 to-17"><span>4 PM</span></li>
								<li class="from-17 to-18"><span>5 PM</span></li>
								<li class="from-18 to-19"><span>6 PM</span></li>
								<li class="from-19 to-20"><span>7 PM</span></li>
								<li class="at-20"><span>8 PM</span></li>
								</ul>';

		print '<div class="agenda-wrapper">';

		//$cursor = 0;
		for ($i = 0; $i < 7; $i++) {
			$extraClass = '';
			//if ($i == 0)
			//	$extraClass = 'agenda-visible-first';
			//else if ($i == 6)
			//	$extraClass = 'agenda-visible-last';
			print '<div class="agenda-events agenda-day' . ($i + 1) . '" style="' . $styles[$i] . '">';
			print '<div class="agenda-header">';
			print $langs->trans($days[$i]);
			print '</div>';

			//if (!empty($events->rows[$cursor])) {
			for ($j = 0; $j < count($events->rows); $j++) {
				if ($events->rows[$j]->key[3] == date('j', strtotime(-date('w', $date) . " day", $date)) + $i) {
					//$dateStart = $events->rows[$j]->value->datep;
					//$dateEnd = $events->rows[$j]->value->datef;
					//if ($events->rows[$j]->value->type_code != 'AC_RDV')
					//	$dateEnd = $dateStart + $events->rows[$j]->value->durationp;
					$hourStart = $events->rows[$j]->key[4];
					if ($events->rows[$j]->value->type_code != 'AC_RDV')
						$hourEnd = $events->rows[$j]->key[4] + $events->rows[$j]->value->durationp / 3600;
					else
						$hourEnd = date('G', strtotime($events->rows[$j]->value->datef) + 1);

					print '<a class="agenda-event from-' . $hourStart . ' to-' . $hourEnd . ($events->rows[$j]->value->usertodo->id == $user->id ? ' red-gradient' : '') . '" href="agenda/fiche.php?id=' . $events->rows[$j]->id . '">';

					print '<time>' . $hourStart . 'h - ' . $hourEnd . 'h</time>';
					if (isset($events->rows[$j]->value->societe->name))
						print "[" . $events->rows[$j]->value->societe->name . "] ";
					print $events->rows[$j]->value->label;

					if ($events->rows[$j]->value->usertodo->id != $user->id) {
						$user_tmp = new User();
						$user_tmp->id = $events->rows[$j]->value->usertodo->id;
						$user_tmp->name = $events->rows[$j]->value->usertodo->name;

						print '<br><i>' . $user_tmp->getNomUrl(1, 'span') . '</i>';
					}
					print '</a>';
				}
				//else
				//	break;
			}
			//}

			print '</div>';
		}

		print '</div>';
		print '</div>';
		?>
		<script>
			$(document).ready(function() {
				// Days
				var daysName = ['<?php echo $langs->trans('Sunday'); ?>', '<?php echo $langs->trans('Monday'); ?>', '<?php echo $langs->trans('Tuesday'); ?>', '<?php echo $langs->trans('Wednesday'); ?>', '<?php echo $langs->trans('Thursday'); ?>', '<?php echo $langs->trans('Friday'); ?>', '<?php echo $langs->trans('Saturday'); ?>'],
						// Name display
						agendaDay = $('#agenda-day'),
						// Agenda scrolling
						agenda = $('#agenda').scrollAgenda({
					first: <?php echo $first; ?>,
					onRangeChange: function(start, end)
					{
						if (start != end)
						{
							agendaDay.text(daysName[start].substr(0, 3) + ' - ' + daysName[end].substr(0, 3));
						}
						else
						{
							agendaDay.text(daysName[start]);
						}
					}
				});

				// Remote controls
				$('#agenda-previous').click(function(event)
				{
					event.preventDefault();
					agenda.scrollAgendaToPrevious();
				});
				$('#agenda-today').click(function(event)
				{
					event.preventDefault();
					agenda.scrollAgendaFirstColumn(<?php echo $first; ?>);
				});
				$('#agenda-next').click(function(event)
				{
					event.preventDefault();
					agenda.scrollAgendaToNext();
				});
			});
		</script>
		<?php
	}

	/*
	 * Graph Eisenhower matrix
	 *
	 */

	function graphEisenhower($json = false) {
		global $user, $conf, $langs;

		$langs->load("companies");

		if ($json) {
			// For Data see viewgraph.php
			$params = array('startkey' => array($user->id, date("c", mktime(0, 0, 0, date("m") - 1, date("d"), date("Y")))),
				'endkey' => array($user->id, date("c", mktime(0, 0, 0, date("m") + 1, date("d"), date("Y")))));

			if ($_GET['name'] == "MyDelegatedTasks")
				$result = $this->mongodb->find(json_decode('{"Status":{"$ne":"DONE"},"author.id":"' . $user->id . '","usertodo.id":{"$ne":"' . $user->id . '"}}'));
			else
				$result = $this->mongodb->find(json_decode('{"Status":{"$ne":"DONE"},"usertodo.id":"' . $user->id . '"}'));
			//$result = $this->getView("list" . $_GET["name"], $params);
			//error_log(print_r($result,true));
			$output = array();

			if (count($result))
				foreach ($result as $aRow) {
					$aRow = json_decode(json_encode($aRow));
					$type_code = $aRow->type_code;
					$priority = $this->fk_extrafields->fields->type_code->values->$type_code->priority;

					$obj = new stdClass();
					$obj->x = $aRow->datep->sec * 1000;
					$obj->y = $priority;
					$obj->name = $aRow->label;
					$obj->id = $aRow->_id->{'$id'};
					if (!isset($aRow->societe->name))
						$obj->soc = $langs->trans("None");
					else
						$obj->soc = $aRow->societe->name;
					$obj->usertodo = $aRow->usertodo->name;

					$output[] = clone $obj;
				}

			return $output;
		} else {
			$total = 0;
			$i = 0;
			?>
			<div id="eisenhower" style="min-width: 100px; height: 280px; margin: 0 auto"></div>
			<script type="text/javascript">
				$(document).ready(function() {
					(function($) { // encapsulate jQuery

						$(function() {
							var seriesOptions = [],
									yAxisOptions = [],
									seriesCounter = 0,
									names = ['MyTasks', 'MyDelegatedTasks'],
									colors = Highcharts.getOptions().colors;
							var translate = [];
							translate['MyTasks'] = "<?php echo $langs->trans('MyTasks'); ?>";
							translate['MyDelegatedTasks'] = "<?php echo $langs->trans('MyDelegatedTasks'); ?>";
							$.each(names, function(i, name) {

								$.getJSON('<?php echo DOL_URL_ROOT . '/core/ajax/viewgraph.php'; ?>?json=graphEisenhower&class=<?php echo get_class($this); ?>&name=' + name.toString() + '&callback=?', function(data) {

									seriesOptions[i] = {
										type: 'scatter',
										name: translate[name],
										data: data
									};

									// As we're loading the data asynchronously, we don't know what order it will arrive. So
									// we keep a counter and create the chart when all the data is loaded.
									seriesCounter++;

									if (seriesCounter == names.length) {
										createChart();
									}
								});
							});


							// create the chart when all data is loaded
							function createChart() {
								var chart;

								chart = new Highcharts.Chart({
									chart: {
										renderTo: 'eisenhower',
										defaultSeriesType: "columnrange",
										marginBottom: 35
									},
									credits: {
										enabled: false
									},
									xAxis: {
										title: {text: "Urgence"},
										min: <?php echo ((strtotime(dol_now()) * 1000) - (37 * 24 * 3600 * 1000)); ?>,
										max: <?php echo ((strtotime(dol_now()) * 1000) + (30 * 24 * 3600 * 1000)); ?>,
										type: "datetime",
										tickInterval: 7 * 24 * 3600 * 1000 * 2,
										tickWidth: 0,
										gridLineWidth: 1,
										labels: {
											align: "left",
											x: 3,
											y: -3
										},
										plotBands: [{
												from: <?php echo ((strtotime(dol_now()) * 1000) - (7 * 24 * 3600 * 1000)); ?>,
												to: <?php echo (strtotime(dol_now()) * 1000); ?>,
												color: "#edc9c9"
											}],
										plotLines: [{
												value: <?php echo (strtotime(dol_now()) * 1000); ?>,
												width: 4,
												color: "red",
												label: {
													text: Highcharts.dateFormat("%e. %b %H:%M",<?php echo (strtotime(dol_now()) * 1000); ?>),
													style: {color: "white"}
												}
											}]
									},
									yAxis: {
										min: 0,
										max: <?php echo 10; ?>,
										title: {text: "Importance"},
										plotLines: [{
												value: <?php echo 5; ?>,
												width: 2,
												color: "red"
											}],
										labels: {
											enabled: false
										}
									},
									title: {
										text: null
									},
									tooltip: {
										enabled: true,
										formatter: function() {
											return '<b>' + this.point.soc + "</b><br><i>" + this.point.name + "</i><br>" + Highcharts.dateFormat("%e. %b", this.x) + "<br><i>" + this.point.usertodo + "</i>";
										}
									},
									plotOptions: {
										series: {cursor: "pointer",
											point: {
												events: {click: function() {
														location.href = 'agenda/fiche.php?id=' + this.options.id;
													}}
											}
										}
									},
									legend: {
										layout: 'vertical',
										align: 'right',
										verticalAlign: 'top',
										x: -5,
										y: 5,
										floating: true,
										borderWidth: 1,
										backgroundColor: Highcharts.theme.legendBackgroundColor || '#FFFFFF',
										shadow: true,
										enabled: true
									},
									series: seriesOptions
								});
							}

						});
					})(jQuery);
				});
			</script>
			<?php
		}
	}

	/*
	 * Calcul des priorités
	 *
	 */

	function fibonacci($n) {
		if ($n <= 1)
			return $n;
		else
			return $this->fibonacci($n - 1) + $this->fibonacci($n - 2);
	}

}
?>
