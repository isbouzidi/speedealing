<?php
/* Copyright (C) 2012	Regis Houssin	<regis.houssin@capnetworks.com>
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

$contracts = array(
		'CHARSET' => 'UTF-8',
		'ContractsArea' => 'Área contractos',
		'ListOfContracts' => 'Lista de contractos',
		'LastContracts' => 'Os Ultimos %s Contractos Modificados',
		'AllContracts' => 'Todos os contractos',
		'ContractCard' => 'Ficha contrato',
		'ContractStatus' => 'Estado do contrato',
		'ContractStatusNotRunning' => 'Fora de serviço',
		'ContractStatusRunning' => 'Em serviço',
		'ContractStatusDraft' => 'Rascunho',
		'ContractStatusValidated' => 'Validado',
		'ContractStatusClosed' => 'Fechado',
		'ServiceStatusInitial' => 'Inactivo',
		'ServiceStatusRunning' => 'Em serviço',
		'ServiceStatusNotLate' => 'Correndo, não terminou',
		'ServiceStatusNotLateShort' => 'Não terminou',
		'ServiceStatusLate' => 'Em serviço, expirado',
		'ServiceStatusLateShort' => 'Expirado',
		'ServiceStatusClosed' => 'Fechado',
		'ServicesLegend' => 'Legenda para os serviços',
		'Contracts' => 'contractos',
		'Contract' => 'Contrato',
		'NoContracts' => 'Sem contractos',
		'MenuServices' => 'Serviços',
		'MenuInactiveServices' => 'Serviços Inactivos',
		'MenuRunningServices' => 'Serviços Activos',
		'MenuExpiredServices' => 'Serviços Expirados',
		'MenuClosedServices' => 'Serviços Fechados',
		'NewContract' => 'Novo Contrato',
		'AddContract' => 'Criar Contrato',
		'SearchAContract' => 'Procurar um Contrato',
		'DeleteAContract' => 'Eliminar um Contrato',
		'CloseAContract' => 'Fechar um Contrato',
		'ConfirmDeleteAContract' => 'Está seguro de querer eliminar este contrato?',
		'ConfirmValidateContract' => 'Está seguro de querer Confirmar este contrato?',
		'ConfirmCloseContract' => 'Está seguro de querer Fechar este contrato?',
		'ConfirmCloseService' => 'Está seguro de querer Fechar este serviço?',
		'ValidateAContract' => 'Confirmar um contrato',
		'ActivateService' => 'Activar o serviço',
		'ConfirmActivateService' => 'Está seguro de querer activar este serviço em data %s?',
		'RefContract' => 'Contract reference',
		'DateContract' => 'Data contrato',
		'DateServiceActivate' => 'Data Activação do serviço',
		'DateServiceUnactivate' => 'Data desactivação do serviço',
		'DateServiceStart' => 'Data inicio do serviço',
		'DateServiceEnd' => 'Data finalização do serviço',
		'ShowContract' => 'Mostrar contrato',
		'ListOfServices' => 'Lista de serviços',
		'ListOfInactiveServices' => 'Lista de serviços não activa',
		'ListOfExpiredServices' => 'Lista de serviços activos expirados',
		'ListOfClosedServices' => 'Lista de serviços fechados',
		'ListOfRunningContractsLines' => 'Lista de linhas de contractos em serviço',
		'ListOfRunningServices' => 'Lista de serviços activos',
		'NotActivatedServices' => 'Serviços não activados (com os contractos validados)',
		'BoardNotActivatedServices' => 'Serviços a activar com os contractos validados',
		'LastContracts' => 'Os Ultimos %s Contractos Modificados',
		'LastActivatedServices' => 'Os %s últimos serviços activados',
		'LastModifiedServices' => 'Os %s últimos sevicios modificados',
		'EditServiceLine' => 'Edição linha do serviço',
		'ContractStartDate' => 'Data inicio',
		'ContractEndDate' => 'Data finalização',
		'DateStartPlanned' => 'Data prevista de colocação em serviço',
		'DateStartPlannedShort' => 'Data inicio prevista',
		'DateEndPlanned' => 'Data prevista fim do serviço',
		'DateEndPlannedShort' => 'Data fim prevista',
		'DateStartReal' => 'Data real colocação em serviço',
		'DateStartRealShort' => 'Data inicio',
		'DateEndReal' => 'Data real fim do serviço',
		'DateEndRealShort' => 'Data real finalização',
		'NbOfServices' => 'Nº de serviços',
		'CloseService' => 'Finalizar serviço',
		'ServicesNomberShort' => '%s serviço(s)',
		'RunningServices' => 'Serviços activos',
		'BoardRunningServices' => 'Serviços activos expirados',
		'ServiceStatus' => 'Estado do serviço',
		'DraftContracts' => 'Contractos rascunho',
		'CloseRefusedBecauseOneServiceActive' => 'O contrato não pode ser fechado já que contem ao menos um serviço aberto.',
		'CloseAllContracts' => 'Fechar todos os contractos',
		'DeleteContractLine' => 'Apagar uma linha contrato',
		'ConfirmDeleteContractLine' => 'Tem certeza de que deseja excluir este contrato linha?',
		'MoveToAnotherContract' => 'Mover o serviço a outro contrato deste Terceiro.',
		'ConfirmMoveToAnotherContract' => 'Escolhi o contrato e confirmo o alterar de serviço ao presente contrato.',
		'ConfirmMoveToAnotherContractQuestion' => 'Escolha qualquer outro contrato do mesmo Terceiro, deseja mover este serviço?',
		'PaymentRenewContractId' => 'Renovação do Serviço (Numero %s)',
		'ExpiredSince' => 'Expirado desde',
		'RelatedContracts' => 'Contractos relacionados',
		'NoExpiredServices' => 'Nenhum serviço activo expirou',
		////////// Types de contacts //////////
		'TypeContact_contrat_internal_SALESREPSIGN' => 'Comercial assinante do contrato',
		'TypeContact_contrat_internal_SALESREPFOLL' => 'Comercial seguimento do contrato',
		'TypeContact_contrat_external_BILLING' => 'Contacto cliente de facturação do contrato',
		'TypeContact_contrat_external_CUSTOMER' => 'Contacto cliente seguimento do contrato',
		'TypeContact_contrat_external_SALESREPSIGN' => 'Contacto cliente assinante do contrato',
		'Error_CONTRACT_ADDON_NotDefined' => 'CONTRACT_ADDON constante não definida'
);
?>