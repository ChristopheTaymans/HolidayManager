sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/unified/DateTypeRange",
		"sap/ui/unified/CalendarDayType",
		"sap/ui/model/json/JSONModel",
	], function (Controller,History,Filter,FilterOperator,DateTypeRange, CalendarDayType,JSONModel) {
		"use strict";

		return Controller.extend("ess.holiday.manager.controller.BaseController", {
			/**
			 * Convenience method for accessing the router.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter : function () {
				return sap.ui.core.UIComponent.getRouterFor(this);
			},

			/**
			 * Convenience method for getting the view model by name.
			 * @public
			 * @param {string} [sName] the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel : function (sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel : function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},
			
			getText : function (fTextId,fArgs) {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(fTextId,fArgs);
			},
			
			setBusy: function(sFlag){
				this.getModel("appView").setProperty("/busy", sFlag);
			},
			

			/**
			 * Getter for the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle : function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */
			
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();

					if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("calendar", {}, true);
				}
			},
			
			getHolidays: function(oCalendar,month,year) {
				
				var oModel = this.getModel("main");
				
				var oCount = {					
				    All : 0,
					BankHoliday : 0,
					FullDay : 0,
					Morning : 0,
					Afternoon : 0
				};
			
				var oFilters = [];
				
				oFilters.push(new Filter("Uname", FilterOperator.EQ, this.getModel("appView").getProperty("/User")));
				oFilters.push(new Filter("Monat", FilterOperator.EQ, month));
				oFilters.push(new Filter("Gjahr", FilterOperator.EQ, year));

				this.setBusy(true);
				
				var oHolidays = [];
				
				oModel.read("/HolidaySet", {
					filters: oFilters,
					success: function(oData, response) {
						
						oCalendar.destroySpecialDates();

						oData.results.forEach(function(data, indx) {

							var startDate = new Date(data.Hday);
							startDate.setHours('03');
							
							if (data.Am && data.Pm) {
								
								if (data.TxtShort) {
									oHolidays.push({
										startDate: startDate,
										type: CalendarDayType.Type01,
										tooltip: data.TxtShort,
										delFlag: false,
										color: "bankHoliday",
										status: data.Status
									});
								  
								oCount.BankHoliday++;
								oCount.All++;
								
								} else {
									oHolidays.push({
										startDate: startDate,
										type: CalendarDayType.Type03,
										tooltip: this.getText("AllDay"),
										delFlag: true,
										color: "fullDay",
										status: data.Status
									});
									oCount.FullDay++;
									oCount.All++;
								}
							} else if (data.Am && !data.Pm) {
								oHolidays.push({
									startDate: startDate,
									type: CalendarDayType.Type06,
									tooltip: this.getText("Morning"),
									delFlag: true,
									color: "morning",
									status: data.Status
								});
								oCount.Morning++;
								oCount.All += .5;								
								
							} else if (!data.Am && data.Pm) {
								oHolidays.push({
									startDate: startDate,
									type: CalendarDayType.Type08,
									tooltip: this.getText("Afternoon"),
									delFlag: true,
									color: "afternoon",
									status: data.Status
								});
								oCount.Afternoon++;
								oCount.All += .5;	
							}
						}.bind(this));

						this.setModel(new JSONModel(oHolidays), "holidays");
						this.setModel(new JSONModel(oCount), "count");
						
						this.setBusy(false);

					}.bind(this),
					error: function(oError) {
						this.setBusy(false);
						this.setModel(new JSONModel(oHolidays), "holidays");
						if (oError.statusCode === "400") {
							MessageToast.show(JSON.parse(oError.responseText).error.message.value);
						}
					}.bind(this)
				});
			}
		});
	}
);