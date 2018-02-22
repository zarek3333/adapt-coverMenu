define([
	"core/js/views/menuView",
	"core/js/adapt",
	"./adapt-coverMenuItemView",
	"./adapt-coverMenuItemIndicatorView"
], function(MenuView, Adapt, CoverMenuItemView, CoverMenuItemIndicatorView) {

	var CoverMenuView = MenuView.extend({

		className: function() {
			return MenuView.prototype.className.call(this) + " cover-menu";
		},

		events: {
			"click .cover-menu-item-control": "onControlClick"
		},

		postRender: function() {
			this.listenTo(Adapt, {
				"device:resize": this.onDeviceResize,
				"coverMenu:setId": this.setId,
				"menuView:ready": this.onReady
			});

			this.setUpItems();
			this.setUpLayout();
			this.setId(this.getNextIncompleteId());
			this.listenTo(this.model, "change:_coverId", this.onIdChange);
		},

		isReady: function(model, isReady) {
			if (isReady) this.navigate();

			MenuView.prototype.isReady.apply(this, arguments);
		},

		onDeviceResize: function() {
			this.setUpLayout();
			_.defer(_.bind(this.navigate, this));
		},

		setId: function(id) {
			this.model.set("_coverId", id);
		},

		onReady: function() {
			if (Adapt.device.screenSize !== "large") this.scroll();

			this.$(".cover-menu-item-container").removeClass("no-transition");
		},

		onIdChange: function(model, id) {
			Adapt.offlineStorage.set("coverId", id);
			this.navigate();
		},

		onControlClick: function(event) {
			var models = this.model.getAvailableChildModels();
			var id = this.model.get("_coverId");

			for (var i = 0, j = models.length; i < j; i++) {
				if (models[i].get("_id") !== id) continue;

				id = $(event.currentTarget).hasClass("left") ?
					models[i - 1].get("_id") :
					models[i + 1].get("_id");

				return this.setId(id);
			}
		},

		setUpItems: function() {
			var items = this.model.getAvailableChildModels();
			var $items = this.$(".cover-menu-item-container-inner");
			var $indicators = this.$(".cover-menu-item-indicator-container-inner");

			for (var i = 0, j = items.length; i < j; i++) {
				var options = { model: items[i] };

				$items.append(new CoverMenuItemView(options).$el);
				$indicators.append(new CoverMenuItemIndicatorView(options).$el);
			}
		},

		setUpLayout: function() {
			var width = "";
			var height = "";

			if (Adapt.device.screenSize === "large") {
				width = $("#wrapper").width() *
					this.model.getAvailableChildModels().length + "px";
				height = $(window).height() - $(".navigation").height() + "px";
			}

			this.$(".cover-menu-item-container-inner").css({
				width: width,
				height: height,
				"margin-left": ""
			});
		},

		getNextIncompleteId: function() {
			var models = this.model.getAvailableChildModels();
			var id = Adapt.offlineStorage.get("coverId") || this.model.get("_coverId");
			
			// if there's no stored id or the contentObject with that id either no longer exists
			// or exists but is no longer 'available', default to the first available one
			var contentObject = Adapt.findById(id);
			if (!contentObject || !contentObject.get('_isAvailable')) {
				id = models[0].get("_id");
			}

			var index = _.findIndex(models, function(model) {
				return model.get("_id") === id;
			});

			for (var i = index, j = models.length; i < j; i++) {
				var model = models[i];

				if (!model.get("_isComplete")) {
					var newid = model.get("_id");
					// the onIdChange handler isn't setup at this point so need to make sure the newid gets put into offlineStorage
					Adapt.offlineStorage.set("coverId", newid);
					return newid;
				}
			}

			return id;
		},

		navigate: function() {
			if (Adapt.device.screenSize !== "large") return;

			var $container = this.$(".cover-menu-item-container-inner");
			var id = this.model.get("_coverId");
			var marginLeft = parseInt($container.css("margin-left"), 10) -
				$container.children("[data-adapt-id='" + id + "']").position().left;

			$container.css("margin-left", marginLeft);
			this.setControlsVisibility();
			this.setIndicatorsState();
		},

		scroll: function() {
			var $item = this.$(".cover-menu-item-container-inner")
				.css("margin-left", "")
				.children("[data-adapt-id='" + this.model.get("_coverId") + "']");

			Adapt.scrollTo($item);
		},

		setControlsVisibility: function() {
			var $controls = this.$(".cover-menu-item-control");
			var id = this.model.get("_coverId");
			var models = this.model.getAvailableChildModels();
			var hideLeft = id === models[0].get("_id");
			var hideRight = id === models[models.length - 1].get("_id");

			$controls.filter(".left").toggleClass("display-none", hideLeft);
			$controls.filter(".right").toggleClass("display-none", hideRight);
		},

		setIndicatorsState: function() {
			var id = this.model.get("_coverId");

			this.$(".cover-menu-item-indicator")
				.removeClass("selected")
				.filter("[data-adapt-id='" + id + "']").addClass("selected");
		}

	}, { template: "coverMenu" });

	Adapt.on("router:menu", function(model) {
		$("#wrapper").append(new CoverMenuView({ model: model }).$el);
	});

});