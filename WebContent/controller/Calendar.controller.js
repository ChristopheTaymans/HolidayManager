sap.ui.define([
	"ess/holiday/manager/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ess/holiday/manager/model/formatter",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, formatter, MessageToast) {
	"use strict";

	return BaseController.extend("ess.holiday.manager.controller.Calendar", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			this.getRouter().getRoute("calendar").attachPatternMatched(this.refresh, this);
			this.getRouter().getRoute("calendar").attachEventOnce("patternMatched",function(oEvent){
//				this.getView().bindElement("main>/CurrentUserSet('')");
				this.getModel('main').read("/CurrentUserSet('')",{					
					success : function(oData,response){
						var appModel = this.getModel("appView");
						appModel.setProperty("/User", oData.Uname);
						appModel.setProperty("/Fullname", oData.Fullname);
					}.bind(this)
				});
			}.bind(this))
		},
	    
		refresh: function() {			
			var oCalendar = this.byId("calendar");
			var month = oCalendar.getStartDate().getMonth() + 1;
			var year = oCalendar.getStartDate().getFullYear();			
			this.getHolidays(oCalendar,month,year);
		},
		
		_onDateChange : function(){
			this.byId("calendar").removeAllSelectedDates();
			this.refresh();
		},

		_onSelect: function(oEvent) {

			var oCalendar = this.byId("calendar");

			this.getModel("appView").setProperty("/add", false);
			this.getModel("appView").setProperty("/save", false);

			var holidays = this.getModel("holidays").getProperty("/");

			oEvent.getSource().getSelectedDates().forEach(function(oSelectedDate, indx) {
				var selectedDate = oSelectedDate.getStartDate();
				selectedDate.setHours("3");
				if (holidays.find(function(sDate) {
						return selectedDate.valueOf() === sDate.startDate.valueOf();
					}) || selectedDate.getDay() === 6 || selectedDate.getDay() === 0) {
					oCalendar.removeSelectedDate(oSelectedDate);
				} else {
					this.getModel("appView").setProperty("/add", true);
				}
			}.bind(this));

		},

		_onAdd: function(oEvent) {
			// create popover
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("ess/holiday.manager.view.Create", this);
				this.getView().addDependent(this._oPopover);
				this.setModel(new JSONModel({
					all: true,
					morning: false,
					afternoon: false
				}), "option");
			}

			this._oPopover.open();

		},

		_onCreate: function(oEvent) {

			this._oPopover.close();
			
			var currentUser = this.getModel("appView").getProperty("/User");

			var option = this.getModel("option").getProperty("/");
			switch (true) {
				case option.all:
					var am = true;
					var pm = true;
					break;
				case option.morning:
					am = true;
					pm = false;
					break;
				case option.afternoon:
					am = false;
					pm = true;
			}

			var oModel = this.getModel("main");			
			
			oModel.callFunction("/SendMail",{				
				urlParameters:{"Uname":currentUser}});
			
			this.setBusy(true);

			this.byId("calendar").getSelectedDates().forEach(function(oSelectedDate) {

				var oCreatedBinding = oModel.createEntry("/HolidaySet", {
					success: function(oData, response) {
						// triggered if the creation is succesful after the submitchange 							
					},
					error: function(oError) {
						// triggered if the creation has failed after the submitchange 							  
						//								MessageToast.show(JSON.parse(oError.responseText).error.message.value);							
					}
				});

				oModel.setProperty("Uname", currentUser, oCreatedBinding);
				oModel.setProperty("Hday", oSelectedDate.getStartDate(), oCreatedBinding);
				oModel.setProperty("Am", am, oCreatedBinding);
				oModel.setProperty("Pm", pm, oCreatedBinding);

			});
			

			oModel.submitChanges({
				success: function(oData, response) {

					if (oData.__batchResponses[0].response !== undefined && oData.__batchResponses[0].response.statusCode === "400") {
						MessageToast.show((JSON.parse(oData.__batchResponses[0].response.body)).error.message.value);						
					} else {
						this.byId("calendar").removeAllSelectedDates();
						this.getModel("appView").setProperty("/add", false);
						MessageToast.show(this.getText("saved"));
						
						this.refresh();
					}
					this.setBusy(false);
				}.bind(this)
			});
		},

		_onSkipCreate: function(oEvent) {
			this._oPopover.close();
		},

		_onDelete: function(oEvent) {

			var oBinding = oEvent.getSource().getParent().getBindingContext("holidays");
			var sDate = this.getModel("holidays").getProperty("startDate", oBinding);

			var oModel = this.getModel("main");
			var sPath = oModel.createKey("/HolidaySet", {
				Uname: this.getModel("appView").getProperty("/User"),
				Hday: sDate
			});
			this.setBusy(true);
			oModel.remove(sPath, {
				success: function(oData, response) {
					this.setBusy(false);
					MessageToast.show(this.getText("deleted"));
					this.refresh();
				}.bind(this),
				error: function(oError) {
					this.setBusy(false);
					if (oError.statusCode === "400") {
						MessageToast.show(JSON.parse(oError.responseText).error.message.value);
					}
				}.bind(this)
			});
		},

		_onReport: function() {
			this.getRouter().navTo("report", {
				year: this.byId("calendar").getStartDate().getFullYear()
			});
		},

		onExit: function() {
			if (this._oPopover) {
				this._oPopover.destroy();
			}
		}
	});
});