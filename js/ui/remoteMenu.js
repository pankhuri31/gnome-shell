// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const ShellMenu = imports.gi.ShellMenu;
const St = imports.gi.St;

const PopupMenu = imports.ui.popupMenu;

const RemoteMenuItemMapper = new Lang.Class({
    Name: 'RemoteMenuItemMapper',

    _init: function(trackerItem) {
        this._trackerItem = trackerItem;

        this.menuItem = new PopupMenu.PopupBaseMenuItem();
        this._label = new St.Label();
        this.menuItem.addActor(this._label);
        this.menuItem.actor.label_actor = this._label;

        this.menuItem.connect('activate', Lang.bind(this, function() {
            this._trackerItem.activated();
        }));

        this._trackerItem.bind_property('visible', this.menuItem.actor, 'visible', GObject.BindingFlags.SYNC_CREATE);

        this._trackerItem.connect('notify::label', Lang.bind(this, this._updateLabel));
        this._trackerItem.connect('notify::sensitive', Lang.bind(this, this._updateSensitivity));
        this._trackerItem.connect('notify::role', Lang.bind(this, this._updateDecoration));
        this._trackerItem.connect('notify::toggled', Lang.bind(this, this._updateDecoration));

        this._updateLabel();
        this._updateSensitivity();
        this._updateDecoration();
    },

    _updateLabel: function() {
        let label = this._trackerItem.label;
        // remove all underscores that are not followed by another underscore
        label = label.replace(/_([^_])/, '$1');
        this._label.text = label;
    },

    _updateSensitivity: function() {
        this.menuItem.setSensitive(this._trackerItem.sensitive);
    },

    _updateDecoration: function() {
        let ornamentForRole = {};
        ornamentForRole[ShellMenu.MenuTrackerItemRole.RADIO] = PopupMenu.Ornament.DOT;
        ornamentForRole[ShellMenu.MenuTrackerItemRole.CHECK] = PopupMenu.Ornament.CHECK;

        let ornament = PopupMenu.Ornament.NONE;
        if (this._trackerItem.toggled)
            ornament = ornamentForRole[this._trackerItem.role];

        this.menuItem.setOrnament(ornament);
    },
});

const RemoteMenu = new Lang.Class({
    Name: 'RemoteMenu',
    Extends: PopupMenu.PopupMenu,

    _init: function(sourceActor, model, actionGroup) {
        this.parent(sourceActor, 0.0, St.Side.TOP);

        this._model = model;
        this._actionGroup = actionGroup;
        this._tracker = Shell.MenuTracker.new(this._actionGroup,
                                              this._model,
                                              null, /* action namespace */
                                              Lang.bind(this, this._insertItem),
                                              Lang.bind(this, this._removeItem));
    },

    destroy: function() {
        this._tracker.destroy();
        this.parent();
    },

    _insertItem: function(trackerItem, position) {
        let item;

        if (trackerItem.get_is_separator()) {
            item = new PopupMenu.PopupSeparatorMenuItem();
        } else {
            let mapper = new RemoteMenuItemMapper(trackerItem);
            item = mapper.menuItem;
        }

        this.addMenuItem(item, position);
    },

    _removeItem: function(position) {
        let items = this._getMenuItems();
        items[position].destroy();
    },
});
