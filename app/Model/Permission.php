<?php

/**
 * Permission  model
 *
 * @copyright (c) 2015-present Bolt Softwares Pvt Ltd
 * @licence GNU Affero General Public License http://www.gnu.org/licenses/agpl-3.0.en.html
 */
class Permission extends AppModel {

/**
 * Model behaviors
 *
 * @link http://api20.cakephp.org/class/model#
 */
	public $actsAs = ['Containable', 'Trackable'];

/**
 * Details of belongs to relationships
 *
 * @link http://book.cakephp.org/2.0/en/models/associations-linking-models-together.html#
 */
	public $belongsTo = [
		'PermissionType' => [
			'foreignKey' => 'type'
		],
		'Category' => [
			'foreignKey' => 'aco_foreign_key'
		],
		'Resource' => [
			'foreignKey' => 'aco_foreign_key'
		],
		'User' => [
			'foreignKey' => 'aro_foreign_key',
		],
		'Group' => [
			'foreignKey' => 'aro_foreign_key',
		]
	];

/**
 * Get the validation rules upon context
 *
 * @param string context
 * @return array cakephp validation rules
 */
	public static function getValidationRules($case = 'default') {
		$default = [
			'aco' => [
				'rule' => ['validateAco']
			],
			'aco_foreign_key' => [
				'uuid' => [
					'rule' => 'uuid',
					'required' => true,
					'allowEmpty' => false,
					'message' => __('aco_foreign_key must be an uuid in correct format')
				],
				'aco_foreign_key' => [
					'rule' => ['validateAcoForeignKey'],
					'message' => __('the aco_foreign_key must be relative to an existing instance of aco model')
				]
			],
			'aro' => [
				'rule' => ['validateAro']
			],
			'aro_foreign_key' => [
				'uuid' => [
					'rule' => 'uuid',
					'required' => true,
					'allowEmpty' => false,
					'message' => __('aro_foreign_key must be an uuid in correct format')
				],
				'aro_foreign_key' => [
					'rule' => ['validateAroForeignKey'],
					'message' => __('the aro_foreign_key must be relative to an existing instance of aro model')
				]
			],
			'type' => [
				'rule' => 'validatePermissionType',
				'required' => true,
				'allowEmpty' => false,
				'message' => __('The given permission type is not valid')
			],
		];
		switch ($case) {
			case 'edit':
				$rules['type'] = $default['type'];
				break;
			default:
			case 'default' :
				$rules = $default;
				break;
		}

		return $rules;
	}


/**
 * Details of after save method
 *
 * @link http://api20.cakephp.org/class/model#method-ModelafterSave
 */
	public function beforeSave($options = []) {
		// If the debug mode is enabled.
		// Generate a permission id based on the aco foreign key and the aro foreign key.
		// It will help us to retrieve permission for debugging or testing.
		if (Configure::read('debug') > 0) {
			if (empty($this->data['Permission']['id'])) {
				$this->data['Permission']['id'] = Common::uuid('permission.id.' . $this->data['Permission']['aco_foreign_key'] . '-' . $this->data['Permission']['aro_foreign_key']);
			}
		}
	}

/**
 * Validation Rule : Check if the given ACO key is an allowed ACO model
 *
 * @param array check the data to test
 * @return boolean
 */
	public function validateAco($check) {
		return $this->isValidAco($check['aco']);
	}

/**
 * Validation Rule : Check if the given ARO key is an allowed ARO model
 *
 * @param array check the data to test
 * @return boolean
 */
	public function validateAro($check) {
		return $this->isValidAro($check['aro']);
	}

/**
 * Validation Rule : check if the given aco foreign key is relative to an existing instance
 *
 * @param array check the data to test
 * @return boolean
 */
	public function validateAcoForeignKey($check) {
		return $this->validateExists($check, 'aco_foreign_key', $this->data[$this->alias]['aco']);
	}

/**
 * Validation Rule : Check if the given aro foreign key is relative to an existing instance
 *
 * @param array check the data to test
 * @return boolean
 */
	public function validateAroForeignKey($check) {
		return $this->validateExists($check, 'aro_foreign_key', $this->data[$this->alias]['aro']);
	}

/**
 * Validation Rule : Check if the given permission type is valid
 *
 * @param array check the data to test
 * @return boolean
 */
	public function validatePermissionType($check) {
		return $this->PermissionType->isValidSerial($check['type']);
	}

/**
 * Validation Rule : Check if a permission with same parameters already exists
 *
 * @param array check the data to test
 * @return boolean
 */
	public function validateUnique($check) {
		return $this->isUniqueByFields(
			$this->data[$this->alias]['aco'],
			$this->data[$this->alias]['aco_foreign_key'],
			$this->data[$this->alias]['aro'],
			$this->data[$this->alias]['aro_foreign_key']);
	}

/**
 * Check if the given ACO key is an allowed ACO model
 *
 * @param string aco The aco key to test
 * @return boolean
 */
	public function isValidAco($aco) {
		return in_array($aco, Configure::read('Permission.acoModels'));
	}

/**
 * Check if the given ARO key is an allowed ACO model
 *
 * @param string aro The aro key to test
 * @return boolean
 */
	public function isValidAro($aro) {
		return in_array($aro, Configure::read('Permission.aroModels'));
	}

/**
 * Check if a permission with same parameters already exists
 *
 * @param string aco
 * @param string aco_foreign_key
 * @param string aro
 * @param string aro_foreign_key
 * @return boolean
 */
	public function isUniqueByFields($aco, $aco_foreign_key, $aro, $aro_foreign_key) {
		$combi = [
			'Permission.aco' => $aco,
			'Permission.aco_foreign_key' => $aco_foreign_key,
			'Permission.aro' => $aro,
			'Permission.aro_foreign_key' => $aro_foreign_key
		];

		return $this->isUnique($combi, false);
	}

/**
 * Return the list of field to fetch for given context
 *
 * @param string $case context ex: login, activation
 * @return $condition array
 */
	public static function getFindFields($case = 'view', $role = Role::USER, $data = null) {
		$returnValue = ['fields' => []];

		return $returnValue;
		switch ($case) {
			case 'edit':
				$returnValue = [
					'fields' => ['type']
				];
				break;
			case 'view':
				$returnValue = [
					'fields' => ['id', 'type', 'aco', 'aco_foreign_key', 'aro', 'aro_foreign_key'],
					'contain' => [
						'PermissionType' => [
							'fields' => ['serial', 'name']
						],
						// // Return the elements the permission has been defined for (user, category)
						// 'Category' => array(
						// 'fields' => array('id', 'name', 'parent_id', 'category_type_id', 'lft', 'rght')
						// ),
						// 'Resource' => array(
						// 'fields' => array('id', 'name', 'username', 'expiry_date', 'uri', 'description', 'modified')
						// ),
						// 'Permission' => array(
						// 'fields' => array('id', 'type'),
						// 'PermissionType' => array(
						// 'fields' => array('id', 'serial', 'name')
						// ),
						// // Return the elements the permission has been defined for (user, category)
						// 'User' => array(
						// 'fields' => array('id', 'username', 'role_id')
						// ),
						// 'Category' => array(
						// 'fields' => array('id', 'name', 'parent_id', 'category_type_id', 'lft', 'rght')
						// ),
						// )
					]
				];
				break;
		}

		return $returnValue;
	}
}
