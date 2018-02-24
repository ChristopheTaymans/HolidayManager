sap.ui.define([
	] , function () {
		"use strict";

		return {

			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},
			
	        customDataFormatter: function (value) {
	            if (!value) {
	                value = '';
	            }
	            return value;
	        },
	        
	        holidayStatusText: function (value) {
	        	
				switch (value) {
				case 'WA' : return this.getText('waitApproval');
							break;
				case 'NA': return this.getText('rejected');
						    break;
				case 'AP': return this.getText('approved');		
				            break;
				default: return null;
				};	          
	        },
	        
	        holidayStatus: function (value) {
				switch (value) {
				case 'WA' : return 'Warning';
							break;
				case 'NA': return 'Error';
						    break;
				case 'AP': return 'Success';		
				            break;
				default: return 'None';
				};	          
	        }

		};

	}
);