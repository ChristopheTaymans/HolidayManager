sap.ui.define([
	"ess/holiday/manager/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"ess/holiday/manager/model/formatter"
], function(BaseController, JSONModel, Filter,FilterOperator, formatter) {
	"use strict";

	var selectedDate = new Date("9999", "11", "31");

	return BaseController.extend("ess.holiday.manager.controller.Report", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			this.getRouter().getRoute("report").attachPatternMatched(this.refresh, this);		
		},
		
		onSelect: function(oEvent) {

			var currentSelectedDate = oEvent.getSource().getSelectedDates()[0];

			if (currentSelectedDate.getStartDate().valueOf() === selectedDate.valueOf()) {
				selectedDate = new Date("9999", "11", "31");
				oEvent.getSource().removeSelectedDate(currentSelectedDate);
			} else {
				selectedDate = new Date(currentSelectedDate.getStartDate());
			}
			
			this.refresh(oEvent);
			this.onFilterSelect();
		},

		onDateChange: function(oEvent) {
			oEvent.getSource().removeAllSelectedDates();
			this.refresh(oEvent);
			this.onFilterSelect();
		},
		
		onFilterSelect:function(oEvent){
			
			var oBinding = this.getView().byId("HolidayList").getBinding("items");
			var aKey = oEvent.getParameter("key");
			var oCustomData = oEvent.getParameter("item").getCustomData();
			var aFilters = [];
						
			if (oCustomData.length && oCustomData.find(function(oData){
				return oData.getKey()=="type" 
			}).getValue() === "approval"){	
				aFilters.push(new Filter("status", sap.ui.model.FilterOperator.EQ, aKey));	
			}
			else if (aKey != "all"){	
				aFilters.push(new Filter("color", sap.ui.model.FilterOperator.EQ, aKey));	
			}					

			oBinding.filter(aFilters);  			
		},		
		
		refresh: function(oEvent) {

			var oMonthSelector = this.byId("MonthSelector");

			if (oEvent.getParameter("arguments")) {
				oMonthSelector.setStartDate(new Date(oEvent.getParameter("arguments").year, "0", "1"));
			}
			
			var oModel = this.getModel("main");

			var oMonthSelected = oMonthSelector.getSelectedDates();

			if (!oMonthSelected.length) {
				var month = "99";
				var year = oMonthSelector.getStartDate().getFullYear();
			} else {
				month = oMonthSelected[0].getStartDate().getMonth() + 1;
				year = oMonthSelected[0].getStartDate().getFullYear();
			}
			
			this.getHolidays(oMonthSelector,month,year);		

		}
	});
});