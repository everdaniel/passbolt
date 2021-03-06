import moment from 'moment';
import 'urijs/punycode';
import 'urijs/SecondLevelDomains';
import 'urijs/IPv6';
import URI from 'urijs/URI';
import 'mad/component/grid';
import 'mad/component/contextual_menu';
import 'mad/form/element/checkbox';
import 'app/model/resource';
import 'app/model/category';
import 'app/model/favorite';
import 'app/component/favorite';
import 'app/view/component/password_browser';
import 'app/view/template/component/password_workspace_all_items_empty.ejs!';

/**
 * @inherits {mad.component.Grid}
 * @parent index
 *
 * Our password grid controller
 *
 * @constructor
 * Creates a new Password Browser Controller
 *
 * @param {HTMLElement} element the element this instance operates on.
 * @param {Object} [options] option values for the controller.  These get added to
 * this.options and merged with defaults static variable
 * @return {passbolt.component.PasswordBrowserController}
 */
var PasswordBrowser = passbolt.component.PasswordBrowser = mad.component.Grid.extend('passbolt.component.PasswordBrowser', /** @static */ {

	defaults: {
		// the type of the item rendered by the grid
		itemClass: passbolt.model.Resource,
		// the view class to use. Overriden so we can put our own logic.
		viewClass: passbolt.view.component.PasswordBrowser,
		// the list of resources displayed by the grid
		resources: new can.Model.List(),
		// the list of displayed categories
		// categories: new passbolt.model.Category.List()
		categories: [],
		// the selected resources, you can pass an existing list as parameter of the constructor to share the same list
		selectedRs: new can.Model.List(),
		// Prefix each row id with resource_
		prefixItemId: 'resource_',
        // Override the silentLoading parameter.
        silentLoading: false
	}

}, /** @prototype */ {

	// Constructor like
	init: function (el, options) {

		// The map to use to make our grid working with our resource model
		options.map = new mad.Map({
			id: 'id',
			name: 'name',
			username: 'username',
			secret: 'Secret',
			uri: 'uri',
			modified: 'modified',
			owner: 'Creator.username',
			Category: 'Category'
		});

		// the columns model
		options.columnModel = [{
			name: 'multipleSelect',
			index: 'multipleSelect',
			header: {
				css: ['selections s-cell'],
				label: '<div class="input checkbox">'
						+ '<input type="checkbox" name="select all" value="checkbox-select-all" id="checkbox-select-all" disabled="disabled">'
						+ '<label for="checkbox-select-all">select all</label> \
					</div>'
			},
			cellAdapter: function (cellElement, cellValue, mappedItem, item, columnModel) {
				var availableValues = {};
				availableValues[item.id] = '';
				var checkbox = mad.helper.Component.create(
					cellElement,
					'inside_replace',
					mad.form.Checkbox, {
						id: 'multiple_select_checkbox_' + item.id,
						name: 'test',
						cssClasses: ['js_checkbox_multiple_select'],
						availableValues: availableValues
					}
				);
				checkbox.start();
			}
		}, {
			name: 'favorite',
			index: 'favorite',
			header: {
				css: ['selections s-cell'],
				label: '<a href="#"> \
						<i class="icon fav"></i> \
						<span class="visuallyhidden">fav</span> \
					</a>'
			},
			cellAdapter: function (cellElement, cellValue, mappedItem, item, columnModel) {
				var availableValues = {};
				availableValues[item.id] = '';
				var favorite = mad.helper.Component.create(
					cellElement,
					'inside_replace',
					passbolt.component.Favorite, {
						id: 'favorite_' + item.id,
						name: 'test2',
						instance: item
					}
				);
				favorite.start();
			}
		}, {
			name: 'name',
			index: 'name',
			header: {
				css: ['m-cell'],
				label: __('Resource')
			}
		}, {
			name: 'username',
			index: 'username',
			header: {
				css: ['m-cell'],
				label: __('Username')
			}
		}, {
			name: 'secret',
			index: 'secret',
			header: {
				css: ['m-cell', 'password'],
				label: __('Password')
			},
			cellAdapter: function (cellElement, cellValue, mappedItem, item, columnModel) {
				var secret = '';
				if (typeof cellValue[0] != 'undefined') {
					secret = cellValue[0].data
				}
				mad.helper.Html.create(
					cellElement,
					'inside_replace',
					'<div class="secret-copy">' +
						'<a id="grid_secret_copy_' + item.id + '" href="#copy_secret">' +
							'<span>copy password to clipboard</span>' +
						'</a>' +
						'<pre>' + secret + '</pre>' +
					'</div>'
				);
			}
		}, {
			name: 'uri',
			index: 'uri',
			header: {
				css: ['l-cell'],
				label: __('URI')
			},
			cellAdapter: function (cellElement, cellValue, mappedItem, item, columnModel) {
				var uri = URI(cellValue);

				// If the uri is an url and is not absolute.
				// Add the default http:// protocol
				if (!uri.is('absolute') && uri.is('url')) {
					uri.protocol('http');
				}

				mad.helper.Html.create(
					cellElement,
					'inside_replace',
					'<a href="' + uri.toString() + '" target="_blank">' + cellValue + '</a>'
				);
			}
		}, {
			name: 'modified',
			index: 'modified',
			header: {
				css: ['m-cell'],
				label: __('Modified')
			},
			valueAdapter: function (value, mappedItem, item, columnModel) {
				return passbolt.Common.datetimeGetTimeAgo(value);
			}
		}, {
			name: 'owner',
			index: 'owner',
			header: {
				css: ['m-cell'],
				label: __('Owner')
			}
		}];

		this._super(el, options);
	},

	/**
	 * Show the contextual menu
	 * @param {passbolt.model.Resource} item The item to show the contextual menu for
	 * @param {string} x The x position where the menu will be rendered
	 * @param {string} y The y position where the menu will be rendered
     * @param {HTMLElement} eventTarget The element the event occurred on
	 */
	showContextualMenu: function (item, x, y, eventTarget) {
		// Get the offset position of the clicked item.
		var $item = $('#' + this.options.prefixItemId + item.id);
		var item_offset = $item.offset();

		// Instantiate the contextual menu menu.
		var contextualMenu = new mad.component.ContextualMenu(null, {
			state: 'hidden',
			source: eventTarget,
			coordinates: {
				x: x,
				y: item_offset.top
			}
		});
		contextualMenu.start();

		// get the permission on the category.
		var canRead = passbolt.model.Permission.isAllowedTo(item, passbolt.READ),
			canUpdate = passbolt.model.Permission.isAllowedTo(item, passbolt.UPDATE),
			canAdmin = passbolt.model.Permission.isAllowedTo(item, passbolt.ADMIN);

		// Add Copy username action.
		var action = new mad.model.Action({
			id: 'js_password_browser_menu_copy_username',
			label: 'Copy username',
			initial_state: !canRead ? 'disabled' : 'ready',
			action: function (menu) {
				var data = {
					name : 'username',
					data : item.username
				};
				mad.bus.trigger('passbolt.clipboard', data);
				menu.remove();
			}
		});
		contextualMenu.insertItem(action);
		// Add Copy password action.
		var action = new mad.model.Action({
            id: 'js_password_browser_menu_copy_password',
			label: 'Copy password',
			initial_state: !canRead ? 'disabled' : 'ready',
			action: function (menu) {
				var secret = item.Secret[0].data;
				mad.bus.trigger('passbolt.secret.decrypt', secret);
				menu.remove();
			}
		});
		contextualMenu.insertItem(action);
		// Add Copy URI action.
		var action = new mad.model.Action({
            id: 'js_password_browser_menu_copy_uri',
			label: 'Copy URI',
			initial_state: !canRead ? 'disabled' : 'ready',
			action: function (menu) {
				var data = {
					name : 'URL',
					data : item.uri
				};
				mad.bus.trigger('passbolt.clipboard', data);
				menu.remove();
			}
		});
		contextualMenu.insertItem(action);

		// Add Open URI in a new tab action.
		var action = new mad.model.Action({
            id: 'js_password_browser_menu_open_uri',
			label: 'Open URI in a new tab',
			initial_state: !canRead ? 'disabled' : 'ready',
			cssClasses: ['separator-after'],
			action: function (menu) {
				var uri = item.uri;
				var win = window.open(uri, '_blank');
				win.focus();
				menu.remove();
			}
		});
		contextualMenu.insertItem(action);

		// Add Edit action.
		var action = new mad.model.Action({
            id: 'js_password_browser_menu_edit',
			label: 'Edit',
			initial_state: !canUpdate ? 'disabled' : 'ready',
			action: function (menu) {
				mad.bus.trigger('request_resource_edition', item);
				menu.remove();
			}
		});
		contextualMenu.insertItem(action);

		// Add Share action.
		var action = new mad.model.Action({
            id: 'js_password_browser_menu_share',
			label: 'Share',
			initial_state: !canAdmin ? 'disabled' : 'ready',
			action: function (menu) {
				mad.bus.trigger('request_resource_sharing', item);
				menu.remove();
			}
		});
		contextualMenu.insertItem(action);
		// Add Delete action.
		var action = new mad.model.Action({
            id: 'js_password_browser_menu_delete',
			label: 'Delete',
			initial_state: !canUpdate ? 'disabled' : 'ready',
			action: function (menu) {
				mad.bus.trigger('request_resource_deletion', item);
				menu.remove();
			}
		});
		contextualMenu.insertItem(action);

		// Display the menu.
		contextualMenu.setState('ready');
	},

	/**
	 * Insert a resource in the grid
	 * @param {mad.model.Model} resource The resource to insert
	 * @param {string} refResourceId The reference resource id. By default the grid view object
	 * will choose the root as reference element.
	 * @param {string} position The position of the newly created item. You can pass in one
	 * of those strings: "before", "after", "inside", "first", "last". By dhe default value
	 * is set to last.
	 */
	insertItem: function (resource, refResourceId, position) {
		// add the resource to the list of observed resources
		this.options.resources.push(resource);
		// insert the item to the grid
		this._super(resource, refResourceId, position);
        // Reset state to ready (to remove other states such as empty).
        this.setState('ready');
	},

	/**
	 * Remove an item to the grid
	 * @param {mad.model.Model} item The item to remove
	 */
	removeItem: function (item) {
		// remove the item to the grid
		this._super(item);
        // If no resources are left, set empty state.
        if (this.options.resources.length == 0) {
            this.setState(['ready', 'empty']);
        }
	},

	/**
	 * Refresh item
	 * @param {mad.model.Model} item The item to refresh
	 */
	refreshItem: function (resource) {
		var self = this;

		// if the password browser is filter by category
		if(this.options.categories.length) {
			// Is the resource belonging to a displayed category
			var belongToDisplayedCat = false;

			// check if the resource belongs to a displayed category
			can.each(resource.Category, function (resourceCategory, i) {
				// the resource belongs to a destroy categories
				if (self.options.categories.indexOf(resourceCategory.id) != -1) {
					belongToDisplayedCat = true;
				}
			});
			// remove the resource if it does not belong to a displayed category
			if(!belongToDisplayedCat) {
				this.removeItem(resource);
				return;
			}
		}

		// if the resource has not been removed from the grid, update it
		this._super(resource);

		// If the item was previously selected, update the view that has been altered when the item has been refreshed.
		if (this.isSelected(resource)) {
			// Select the checkbox (if it is not already done).
			var id = 'multiple_select_checkbox_' + resource.id,
				checkbox = mad.getControl(id, 'mad.form.Checkbox');
			checkbox.setValue([resource.id]);

			// Make the item selected in the view.
			this.view.selectItem(resource);
		}
	},

	/**
	 * reset
	 */
	reset: function () {
		// reset the list of observed resources
		// by removing a resource from the resources list stored in options, the Browser will
		// update itself (check "{resources} remove" listener)
		this.options.resources.splice(0, this.options.resources.length);
	},

	/**
	 * Load resources in the grid
	 * @param {passbolt.model.Resource.List} resources The list of resources to
	 * load into the grid
	 */
	load: function (resources) {
		// load the resources
		this._super(resources);
	},

	/**
	 * Before selecting an item
	 * @param {mad.model.Model} item The item to select
	 */
	beforeSelect: function (item) {
		var returnValue = true;

		if (this.state.is('selection')) {
			// if an item has already been selected
			// if the item is already selected, unselect it
			if (this.isSelected(item)) {
				this.unselect(item);
				this.setState('ready');
				returnValue = false;
			} else {
				for (var i = this.options.selectedRs.length - 1; i > -1; i--) {
					this.unselect(this.options.selectedRs[i]);
				}
			}
		}

		return returnValue;
	},

	/**
	 * Before unselecting an item
	 * @param {mad.model.Model} item The item to unselect
	 */
	beforeUnselect: function (item) {
		var returnValue = true;
		return returnValue;
	},

	/**
	 * Is the item selected
	 *
	 * @param {mad.Model}
	 * @return {bool}
	 */
	isSelected: function (item) {
		// TODO does not work with the multiple selection feature.
		if (this.options.selectedRs.length > 0 && this.options.selectedRs[0].id == item.id) {
			return true;
		}
		return false;
	},

	/**
	 * Select an item
	 * @param {mad.model.Model} item The item to select
	 * @param {boolean} silent Do not propagate any event (default:false)
	 */
	select: function (item, silent) {
		silent = typeof silent == 'undefined' ? false : silent;

        // If resource is already selected, we do nothing.
		// Refresh the view
        if (this.isSelected(item)) {
            return;
        }

		// Unselect the previously selected resources, if not in multipleSelection.
		if (!this.state.is('multipleSelection') &&
			this.options.selectedRs.length > 0) {
			this.unselect(this.options.selectedRs[0]);
		}

		// Add the resource to the list of selected items.
		this.options.selectedRs.push(item);

		// Select the checkbox (if it is not already done).
		var id = 'multiple_select_checkbox_' + item.id,
			checkbox = mad.getControl(id, 'mad.form.Checkbox');
		checkbox.setValue([item.id]);

		// Make the item selected in the view.
		this.view.selectItem(item);

		// Notify the application about this selection.
		if (!silent) {
			mad.bus.trigger('resource_selected', item);
		}
	},

	/**
	 * Unselect an item
	 * @param {mad.model.Model} item The item to unselect
	 * @param {boolean} silent Do not propagate any event (default:false)
	 */
	unselect: function (item, silent) {
		silent = typeof silent == 'undefined' ? false : silent;

		// Uncheck the associated checkbox (if it is not already done).
		var id = 'multiple_select_checkbox_' + item.id,
			checkbox = mad.getControl(id, 'mad.form.Checkbox');

		// Uncheck the checkbox by reseting it. Brutal.
		checkbox.reset();

		// Unselect the item in grid.
		this.view.unselectItem(item);

		// Remove the resource from the previously selected resources.
		mad.model.List.remove(this.options.selectedRs, item);

		// Notify the app about the just unselected resource.
		if (!silent) {
			mad.bus.trigger('resource_unselected', item);
		}
	},

	/* ************************************************************** */
	/* LISTEN TO THE MODEL EVENTS */
	/* ************************************************************** */

	/**
	* Observe when a resource is created.
	* If the created resource belong to a displayed category, add the resource to the grid.
	* @param {mad.model.Model} model The model reference
	* @param {HTMLEvent} ev The event which occurred
	* @param {passbolt.model.Resource} resource The created resource
	*/
	'{passbolt.model.Resource} created': function (model, ev, resource) {
		var self = this;

		// If the resourcs belongs to one or several categories
		if (resource.Category.length) {
			// If the new resource belongs to one of the categories displayed by the resource
			// browser -> Insert it
			resource.Category.each(function(category, i) {
				if(self.options.categories.indexOf(category.id) != -1) {
					self.insertItem(resource, null, 'first');
					return false; // break
				}
			});
		}
		// Else insert it whatever the applied filter.
		// TODO Discuss this behavior with the team
		else {
			self.insertItem(resource, null, 'first');
		}
	},

	/**
	* Observe when a resource is updated.
	* If the resource is displayed by he grid, refresh it.
	* note : We listen the model directly, listening on changes on
	* a list seems too much here (one event for each updated attribute)
	* @param {mad.model.Model} model The model reference
	* @param {HTMLEvent} ev The event which occurred
	* @param {passbolt.model.Resource} resource The updated resource
	*/
	'{passbolt.model.Resource} updated': function (model, ev, resource) {
		if (this.options.resources.indexOf(resource) != -1) {
			this.refreshItem(resource);
		}
	},

	/**
	* Observe when resources are removed from the list of displayed resources and
	* remove it from the grid
	* @param {mad.model.Model} model The model reference
	* @param {HTMLEvent} ev The event which occurred
	* @param {passbolt.model.Resource} resources The removed resource
	*/
	'{resources} remove': function (model, ev, resources) {
		var self = this;
		can.each(resources, function (resource, i) {
			self.removeItem(resource);
		});
	},

	/**
	* Observe when a category is removed. And remove from the grid all the resources
	* which are not belonging to a displayed Category.
	* @param {mad.model.Model} model The model reference
	* @param {HTMLEvent} ev The event which occurred
	* @param {passbolt.model.Category} category The removed category
	*/
	'{passbolt.model.Category} destroyed': function (model, ev, category) {
		var self = this;

		// remove from the list of displayed categories the given deleted category and its children
		var destroyedCategories = mad.model.Model.nestedToList(category, 'children');
		var destroyedCategoriesIds = [];
		can.each(destroyedCategories, function(destroyedCategory, h) {
			var indexof = self.options.categories.indexOf(destroyedCategory.id);
			if (indexof != -1) {
				// remove the destroyed categories from the display categories array
				self.options.categories.splice(indexof, 1);
			}
			// destroyedCategoriesIds.push(destroyedCategory.id);
		});
	},

	/* ************************************************************** */
	/* LISTEN TO THE VIEW EVENTS */
	/* ************************************************************** */

	/**
	* Observe when an item is selected in the grid.
	* This event comes from the grid view
	* @param {HTMLElement} el The element the event occurred on
	* @param {HTMLEvent} ev The event which occurred
	* @param {mixed} item The selected item instance or its id
	* @param {HTMLEvent} ev The source event which occurred
	*/
	' item_selected': function (el, ev, item, srcEvent) {
		// switch to select state
		this.setState('selection');

		if (this.beforeSelect(item)) {
			this.select(item);
		}
	},

	/**
	* An item has been right selected
	* @param {HTMLElement} el The element the event occurred on
	* @param {HTMLEvent} ev The event which occurred
	* @param {passbolt.model.Resource} item The right selected item instance or its id
	* @param {HTMLEvent} srcEvent The source event which occurred
	*/
    ' item_right_selected': function (el, ev, item, srcEvent) {
        // Select item.
		this.select(item);
		// Show contextual menu.
		this.showContextualMenu(item, srcEvent.pageX, srcEvent.pageY, srcEvent.target);
	},

	/**
	* A password has been clicked.
	* @param {HTMLElement} el The element the event occurred on
	* @param {HTMLEvent} ev The event which occurred
	* @param {passbolt.model.Resource} item The right selected item instance or its id
	* @param {HTMLEvent} srcEvent The source event which occurred
	*/
	' password_clicked': function (el, ev, item, srcEvent) {
		// Get secret out of Resource object.
		var secret = item.Secret[0].data;
		// Request decryption. (delegated to plugin).
		mad.bus.trigger('passbolt.secret.decrypt', secret);
	},

	/**
	* Listen to the check event on any checkbox form element components.
	*
	* @param {HTMLElement} el The element the event occurred on
	* @param {HTMLEvent} ev The event which occurred
	* @param {mixed} rsId The id of the resource which has been checked
	*/
	'.js_checkbox_multiple_select checked': function (el, ev, rsId) {
		var self = this;

		// if the grid is in initial state, switch it to selected
		if (this.state.is('ready')) {
			this.setState('selection');
		}
		// if the grid is already in selected state, switch to multipleSelected
		// @todo Multiple selection has been disabled
		//else if (this.state.is('selection')) {
		//	this.setState('multipleSelection');
		//}

		// find the resource to select functions of its id
		var i = mad.model.List.indexOf(this.options.resources, rsId);
		var resource = this.options.resources[i];

		if (this.beforeSelect(resource)) {
			this.select(resource);
		}
	},

	/**
	* Listen to the uncheck event on any checkbox form element components.
	*
	* @param {HTMLElement} el The element the event occurred on
	* @param {HTMLEvent} ev The event which occurred
	* @param {mixed} rsId The id of the resource which has been unchecked
	*/
	'.js_checkbox_multiple_select unchecked': function (el, ev, rsId) {
		var self = this;

		// find the resource to select functions of its id
		var i = mad.model.List.indexOf(this.options.resources, rsId);
		var resource = this.options.resources[i];

		if (this.beforeUnselect()) {
			self.unselect(resource);
		}

		// if there is no more selected resources, switch the grid to its initial state
		if (!this.options.selectedRs.length) {
			this.setState('ready');

		// else if only one resource is selected
		} else if (this.options.selectedRs.length == 1) {
			this.setState('selection');
		}
	},

	/* ************************************************************** */
	/* LISTEN TO THE APP EVENTS */
	/* ************************************************************** */

	/**
	* Listen to the browser filter
	* @param {jQuery} element The source element
	* @param {Event} event The jQuery event
	* @param {passbolt.model.Filter} filter The filter to apply
	*/
	'{mad.bus.element} filter_resources_browser': function (element, evt, filter) {
		var self = this;

		// reset the state variables
		this.options.categories = [];

        // Set state to filter case.
        if (filter.case != undefined) {
            // Remove class belonging to previous filter.
            if (this.filter != undefined) {
                self.element.removeClass(this.filter.case);
            }
            // Add class for current filter. (used in styleguide).
            self.element.addClass(filter.case);
        }

        // store the filter
        this.filter = filter;

		// override the current list of categories displayed with the new ones
		// and the relative sub-categories
		var filteredCategory = filter.getForeignModels('Category');
		if(filteredCategory) {
			can.each(filteredCategory, function (category, i) {
				var subCategories = category.getSubCategories(true);
				can.each(subCategories, function(subCategory, i){
					self.options.categories.push(subCategory.id);
				});
			});
		}

		// change the state of the component to loading
		this.setState('loading');

        // Is password workspace empty.
        var empty = false;

		// load resources functions of the filter
		passbolt.model.Resource.findAll({
			filter: this.filter,
			recursive: true,
			silentLoading:false
		}, function (resources, response, request) {
			// If the browser has been destroyed before the request completed.
			if (self.element == null) {
				return;
			}
            // If no resources found, then add class empty, and render empty content html.
            if (resources.length == 0) {
                empty = true;
            }

			// load the resources in the browser
			self.load(resources);
			// change the state to ready
			self.setState(empty ? ['ready', 'empty'] : 'ready');
		});
	},

	/* ************************************************************** */
	/* LISTEN TO THE STATE CHANGES */
	/* ************************************************************** */

	/**
	* Listen to the change relative to the state Ready.
	* The ready state is fired automatically after the Component is rendered
	* @param {boolean} go Enter or leave the state
	*/
	stateReady: function (go) {
		// nothing to do
	},

	/**
	* Listen to the change relative to the state selected
	* @param {boolean} go Enter or leave the state
	*/
	stateSelection: function (go) {
		// nothing to do
	},

	/**
	* Listen to the change relative to the state multipleSelected
	* @param {boolean} go Enter or leave the state
	*/
	stateMultipleSelection: function (go) {
		// nothing to do
	},

    /**
     * Listen to changes related to state empty (when there are no passwords to show).
     * @param {boolean} go Enter or leave the state
     */
    stateEmpty: function (go) {
        if (go) {
            if (this.filter.case == 'all_items') {
                var empty_html = mad.View.render("app/view/template/component/password_workspace_all_items_empty.ejs");
                $('.tableview-content', self.element).prepend(empty_html);
            }
        }
        else {
            // Remove any empty content html from page.
            // (empty content is the html displayed when the workspace is empty).
            $('.empty-content', self.element).remove();
        }
    }

});

export default PasswordBrowser;
